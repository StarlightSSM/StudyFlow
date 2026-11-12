"""Stage 1 of the experiment: generate test suites and validate them on the
fault-free app (PROTOCOL.md §4-§5).

For each scenario x repetition:
  1. capture the start page's ARIA snapshot (what the LLM is allowed to see)
  2. LLM generates a Playwright test file           (step 0)
  3. run it on the CLEAN app and label the outcome
  4. if it failed, send ONLY the clean-app failure back for repair (step 1..N)
     -> fault information never reaches the generator (Obj2 / leakage guard)
  5. once valid, re-run K times to detect flakiness
  6. freeze the final file; Stage 2 (evaluate on fault variants) uses it as-is

Everything is appended to research/llm-results/runs/<run_id>/:
  run.json          environment, versions, model, prompt hashes, app commit
  calls.jsonl       one line per LLM call (prompt hash, raw response, tokens, latency, errors)
  executions.jsonl  one line per Playwright run (label, error excerpt, duration)
  suites.jsonl      one line per suite (final label, repair history, expect counts, cost)
  specs/            every generated file, per step;  snapshots/  ARIA snapshots

Usage (from the StudyFlow root, with the app already running):
  python harness/generate.py --scenario research/scenarios/SMOKE-001.json --reps 1
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import platform
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

HARNESS = Path(__file__).resolve().parent
ROOT = HARNESS.parent
TESTS = ROOT / "tests"
RUNS = ROOT / "research" / "llm-results" / "runs"
PROMPTS = HARNESS / "prompts"
HARNESS_VERSION = "0.1.0"

sys.path.insert(0, str(HARNESS))
from llm import get_provider  # noqa: E402
from playwright_runner import NPX, classify, run_playwright  # noqa: E402


# ---------------------------------------------------------------- utilities
def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def append_jsonl(path: Path, obj: Dict[str, Any]) -> None:
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")


def now() -> str:
    return dt.datetime.now().astimezone().isoformat(timespec="seconds")


def cmd_out(args: List[str], cwd: Optional[Path] = None) -> str:
    try:
        return subprocess.run(args, cwd=str(cwd) if cwd else None, capture_output=True, text=True,
                              encoding="utf-8", errors="replace", timeout=60).stdout.strip()
    except Exception as e:  # noqa: BLE001
        return f"unavailable ({type(e).__name__})"


def fill(template: str, **values: str) -> str:
    for k, v in values.items():
        template = template.replace("{{" + k + "}}", v)
    return template


CODE_BLOCK = re.compile(r"```(?:ts|typescript|js|javascript)?\s*\n(.*?)```", re.S)


def extract_code(text: str) -> Optional[str]:
    m = CODE_BLOCK.search(text or "")
    return m.group(1).strip() + "\n" if m else None


def count_expects(code: str) -> int:
    return len(re.findall(r"\bexpect(?:\.soft)?\s*\(", code or ""))


def http_ok(url: str, timeout: float = 5.0) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:  # noqa: S310 - local URL
            return 200 <= r.status < 500
    except Exception:  # noqa: BLE001
        return False


def http_json(url: str, timeout: float = 5.0) -> Optional[Dict[str, Any]]:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:  # noqa: S310 - local URL
            return json.loads(r.read().decode("utf-8"))
    except Exception:  # noqa: BLE001
        return None


def take_snapshot(url: str) -> Dict[str, Any]:
    out = cmd_out(["node", "tools/snapshot.mjs", url], cwd=TESTS)
    try:
        return json.loads(out.splitlines()[-1])
    except Exception:  # noqa: BLE001
        raise SystemExit(f"snapshot failed for {url}:\n{out[-1500:]}")


# --------------------------------------------------------------------- main
def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--scenario", nargs="+", required=True, help="scenario JSON file(s)")
    ap.add_argument("--reps", type=int, default=3, help="independent generations per scenario")
    ap.add_argument("--max-repairs", type=int, default=3)
    ap.add_argument("--flaky-reruns", type=int, default=3)
    ap.add_argument("--base-url", default="http://localhost:5173")
    ap.add_argument("--api-url", default="http://localhost:3000",
                    help="backend URL; /api/__research/info is recorded if available")
    ap.add_argument("--provider", default="gemini")
    # pinned: "gemini-3.5-flash" was observed to be served by gemini-3.6-flash (2026-11-12)
    ap.add_argument("--model", default="gemini-3.6-flash")
    ap.add_argument("--min-interval", type=float, default=6.0, help="seconds between LLM calls (free-tier RPM)")
    ap.add_argument("--run-id", default=None)
    ap.add_argument("--note", default="", help="free-text note stored in run.json")
    args = ap.parse_args()

    load_dotenv(ROOT / ".env")
    if not http_ok(args.base_url):
        raise SystemExit(f"app not reachable at {args.base_url} - start it first (frontend: npm run dev)")

    scenarios = [json.loads(Path(p).read_text(encoding="utf-8")) for p in args.scenario]
    gen_tpl = (PROMPTS / "generate_v1.md").read_text(encoding="utf-8")
    rep_tpl = (PROMPTS / "repair_v1.md").read_text(encoding="utf-8")

    run_id = args.run_id or dt.datetime.now().strftime("%Y%m%d-%H%M%S") + "-" + args.model.replace(".", "")
    run_dir = RUNS / run_id
    (run_dir / "specs").mkdir(parents=True, exist_ok=True)
    (run_dir / "snapshots").mkdir(exist_ok=True)
    exec_dir_rel = f"llm-generated/{run_id}"
    (TESTS / exec_dir_rel).mkdir(parents=True, exist_ok=True)

    import importlib.metadata as md
    run_meta = {
        "run_id": run_id, "started_at": now(), "harness_version": HARNESS_VERSION, "note": args.note,
        "provider": args.provider, "model": args.model, "sampling": "provider defaults (not overridden)",
        "params": {k: getattr(args, k) for k in ("reps", "max_repairs", "flaky_reruns", "base_url", "min_interval")},
        "prompts": {"generate_v1": sha256(gen_tpl), "repair_v1": sha256(rep_tpl)},
        "app": {
            "git_commit": cmd_out(["git", "rev-parse", "HEAD"], ROOT),
            "git_dirty": bool(cmd_out(["git", "status", "--porcelain", "--", "frontend", "backend"], ROOT)),
            "research_info": http_json(args.api_url.rstrip("/") + "/api/__research/info"),
        },
        "versions": {
            "python": platform.python_version(), "node": cmd_out(["node", "-v"]),
            "playwright": cmd_out([NPX, "playwright", "--version"], TESTS),
            "google-genai": md.version("google-genai"), "os": platform.platform(),
        },
        "scenarios": [s["scenario_id"] for s in scenarios],
    }
    (run_dir / "run.json").write_text(json.dumps(run_meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"run {run_id} -> {run_dir}")

    llm = get_provider(args.provider, args.model)
    last_call = [0.0]

    def call_llm(prompt: str, ctx: Dict[str, Any]) -> Dict[str, Any]:
        wait = args.min_interval - (time.time() - last_call[0])
        if wait > 0:
            time.sleep(wait)
        res = llm.generate(prompt)
        last_call[0] = time.time()
        rec = {**ctx, "ts": now(), "prompt_sha256": sha256(prompt), "prompt_chars": len(prompt),
               "ok": res.ok, "provider": res.provider, "model_requested": res.model_requested,
               "model_version": res.model_version, "latency_s": res.latency_s, "attempts": res.attempts,
               "errors": res.errors, "usage": res.usage, "response": res.text}
        append_jsonl(run_dir / "calls.jsonl", rec)
        # Reproducibility guard: the server may route a model name to another version.
        if res.ok and res.model_version:
            seen = run_meta.setdefault("model_versions_seen", [])
            if res.model_version not in seen:
                seen.append(res.model_version)
                if res.model_version != args.model:
                    print(f"  NOTE: requested {args.model!r}, server answered with {res.model_version!r}")
                if len(seen) > 1:
                    print(f"  WARNING: model version changed during the run: {seen}")
                (run_dir / "run.json").write_text(json.dumps(run_meta, ensure_ascii=False, indent=2),
                                                  encoding="utf-8")
        return rec

    for sc in scenarios:
        sid = sc["scenario_id"]
        start_url = args.base_url.rstrip("/") + sc.get("start_path", "/")
        snap = take_snapshot(start_url)
        (run_dir / "snapshots" / f"{sid}.json").write_text(json.dumps(snap, ensure_ascii=False, indent=2),
                                                         encoding="utf-8")
        common = {"goal": sc["goal"], "spec": sc["spec"], "start_path": sc.get("start_path", "/"),
                  "aria_snapshot": snap["aria"]}

        for rep in range(1, args.reps + 1):
            suite_id = f"{sid}_r{rep}"
            history: List[Dict[str, Any]] = []
            usage_sum: Dict[str, int] = {}
            n_calls, latency_sum = 0, 0.0
            prompt = fill(gen_tpl, **common)
            final: Dict[str, Any] = {}
            code: Optional[str] = None

            for step in range(0, args.max_repairs + 1):
                ctx = {"run_id": run_id, "suite_id": suite_id, "scenario_id": sid,
                       "condition": sc.get("condition"), "variant": sc.get("variant"),
                       "rep": rep, "step": step, "kind": "generate" if step == 0 else "repair"}
                call = call_llm(prompt, ctx)
                n_calls += 1
                latency_sum += call["latency_s"]
                for k, v in (call["usage"] or {}).items():
                    if isinstance(v, int):
                        usage_sum[k] = usage_sum.get(k, 0) + v
                if not call["ok"]:
                    final = {"label": "environment_error", "sublabel": "llm_api_unavailable",
                             "needs_review": False, "error_excerpt": " | ".join(call["errors"])[-1500:]}
                    history.append({"step": step, **final})
                    break

                new_code = extract_code(call["response"])
                if new_code is None:
                    verdict = {"label": "execution_failure", "sublabel": "no_code_block", "needs_review": False,
                               "n_tests": 0, "n_passed": 0,
                               "error_excerpt": "The response did not contain a ```ts code block."}
                else:
                    code = new_code
                    name = f"{suite_id}_s{step}.spec.ts"
                    (run_dir / "specs" / name).write_text(code, encoding="utf-8")
                    shutil.copyfile(run_dir / "specs" / name, TESTS / exec_dir_rel / name)
                    pw = run_playwright(TESTS, f"{exec_dir_rel}/{name}", args.base_url,
                                        run_dir / "pw-artifacts" / f"{suite_id}_s{step}")
                    verdict = classify(pw)
                    append_jsonl(run_dir / "executions.jsonl", {
                        **ctx, "ts": now(), "app_version": "clean", "purpose": "validate",
                        "spec_file": name, "code_sha256": sha256(code), "expect_count": count_expects(code),
                        "duration_s": pw["duration_s"], "returncode": pw["returncode"], **verdict})
                history.append({"step": step, "label": verdict["label"], "sublabel": verdict["sublabel"],
                                "expect_count": count_expects(code) if new_code else None})
                print(f"  {suite_id} step {step}: {verdict['label']}"
                      + (f" ({verdict['sublabel']})" if verdict.get("sublabel") else ""))
                final = verdict

                if verdict["label"] in ("valid", "environment_error"):
                    break
                if step < args.max_repairs:
                    prompt = fill(rep_tpl, **common, code=code or "(no code was produced)",
                                  error=verdict["error_excerpt"][:3000])

            # flakiness check on the frozen, valid suite
            flaky_runs: List[str] = []
            if final.get("label") == "valid" and args.flaky_reruns > 0:
                name = f"{suite_id}_s{history[-1]['step']}.spec.ts"
                for k in range(1, args.flaky_reruns + 1):
                    pw = run_playwright(TESTS, f"{exec_dir_rel}/{name}", args.base_url,
                                        run_dir / "pw-artifacts" / f"{suite_id}_rerun{k}")
                    v = classify(pw)
                    flaky_runs.append(v["label"])
                    append_jsonl(run_dir / "executions.jsonl", {
                        "run_id": run_id, "suite_id": suite_id, "scenario_id": sid, "rep": rep,
                        "ts": now(), "app_version": "clean", "purpose": f"flaky_rerun_{k}",
                        "spec_file": name, "duration_s": pw["duration_s"], **v})
                if any(lbl != "valid" for lbl in flaky_runs):
                    final = {**final, "label": "flaky", "sublabel": "unstable_on_clean_app"}
                print(f"  {suite_id} reruns: {flaky_runs} -> {final['label']}")

            append_jsonl(run_dir / "suites.jsonl", {
                "run_id": run_id, "suite_id": suite_id, "scenario_id": sid, "condition": sc.get("condition"),
                "variant": sc.get("variant"), "rep": rep, "final_label": final.get("label"),
                "final_sublabel": final.get("sublabel"), "needs_review": final.get("needs_review", False),
                "final_step": history[-1]["step"] if history else None, "n_repairs": max(0, len(history) - 1),
                "history": history, "flaky_reruns": flaky_runs, "n_llm_calls": n_calls,
                "llm_latency_s": round(latency_sum, 2), "usage_total": usage_sum,
                "frozen_spec": f"{suite_id}_s{history[-1]['step']}.spec.ts" if code else None,
                "snapshot_stats": snap.get("stats"),
            })

    run_meta["finished_at"] = now()
    (run_dir / "run.json").write_text(json.dumps(run_meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"done. results: {run_dir / 'suites.jsonl'}")


if __name__ == "__main__":
    main()
