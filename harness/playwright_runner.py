"""Run Playwright (via npx) and turn its JSON report into protocol labels.

Labels produced here are *generation-stage* labels, i.e. outcomes of running a
generated suite against the fault-free app (see docs/research/PROTOCOL.md §5):

  valid              all tests passed
  execution_failure  could not execute as intended (syntax/transform error,
                     no tests, locator not found, timeout, ...)
  oracle_error       ran, but an assertion's expected value is wrong for the
                     correct app (Expected vs Received mismatch)
  environment_error  app/server/network problem, not attributable to the LLM

Heuristic labels carry `needs_review=True`; a sample is re-labelled by humans
to report agreement (Cohen's kappa).
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ANSI = re.compile(r"\x1b\[[0-9;]*m")
NPX = "npx.cmd" if os.name == "nt" else "npx"


def _strip(s: str) -> str:
    return ANSI.sub("", s or "")


def run_playwright(tests_dir: Path, spec_rel: str, base_url: str, output_dir: Path,
                   timeout_s: int = 300) -> Dict[str, Any]:
    env = dict(os.environ, BASE_URL=base_url, PW_OUTPUT_DIR=str(output_dir), FORCE_COLOR="0")
    t0 = time.time()
    try:
        proc = subprocess.run(
            [NPX, "playwright", "test", spec_rel, "--config=playwright.config.ts", "--reporter=json"],
            cwd=str(tests_dir), env=env, capture_output=True, text=True, encoding="utf-8",
            errors="replace", timeout=timeout_s,
        )
        rc, out, err = proc.returncode, proc.stdout, proc.stderr
    except subprocess.TimeoutExpired as e:
        rc, out, err = -1, (e.stdout or "") if isinstance(e.stdout, str) else "", "harness timeout"
    duration = round(time.time() - t0, 2)
    report: Optional[Dict[str, Any]] = None
    try:
        start = out.find("{")
        report = json.loads(out[start:]) if start >= 0 else None
    except json.JSONDecodeError:
        report = None
    return {"returncode": rc, "duration_s": duration, "report": report,
            "stderr_tail": _strip(err)[-2000:]}


def _collect(report: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], List[str]]:
    tests: List[Dict[str, Any]] = []

    def walk(suite: Dict[str, Any]) -> None:
        for spec in suite.get("specs", []) or []:
            for t in spec.get("tests", []) or []:
                results = t.get("results", []) or []
                msgs = []
                for r in results:
                    for e in (r.get("errors") or ([r["error"]] if r.get("error") else [])):
                        msgs.append(_strip(e.get("message", "")))
                tests.append({
                    "title": spec.get("title"),
                    "status": t.get("status"),  # expected | unexpected | flaky | skipped
                    "result_statuses": [r.get("status") for r in results],
                    "errors": msgs,
                })
        for child in suite.get("suites", []) or []:
            walk(child)

    for s in report.get("suites", []) or []:
        walk(s)
    global_errors = [_strip(e.get("message", "")) for e in report.get("errors", []) or []]
    return tests, global_errors


ENV_PATTERNS = ("ERR_CONNECTION_REFUSED", "ECONNREFUSED", "net::ERR_", "browserType.launch",
                "Executable doesn't exist")
LOCATOR_PATTERNS = ("element(s) not found", "waiting for", "strict mode violation",
                    "Timeout", "timed out", "not visible", "not attached", "resolved to 0 elements")


def classify(run: Dict[str, Any]) -> Dict[str, Any]:
    report = run.get("report")
    if report is None:
        detail = run.get("stderr_tail", "")
        label = "environment_error" if any(p in detail for p in ENV_PATTERNS) else "execution_failure"
        return {"label": label, "sublabel": "no_report", "needs_review": True,
                "n_tests": 0, "n_passed": 0, "error_excerpt": detail[-1500:]}

    tests, global_errors = _collect(report)
    n = len(tests)
    passed = sum(1 for t in tests if t["status"] == "expected")
    all_errors = global_errors + [m for t in tests for m in t["errors"]]
    excerpt = "\n---\n".join(all_errors)[:3000]

    if global_errors and n == 0:
        sub = "invalid_code" if not any(p in excerpt for p in ENV_PATTERNS) else "env"
        label = "environment_error" if sub == "env" else "execution_failure"
        return {"label": label, "sublabel": sub, "needs_review": False,
                "n_tests": 0, "n_passed": 0, "error_excerpt": excerpt}
    if n == 0:
        return {"label": "execution_failure", "sublabel": "no_tests", "needs_review": False,
                "n_tests": 0, "n_passed": 0, "error_excerpt": excerpt}
    if passed == n:
        return {"label": "valid", "sublabel": None, "needs_review": False,
                "n_tests": n, "n_passed": passed, "error_excerpt": ""}

    if any(p in excerpt for p in ENV_PATTERNS):
        label, sub, review = "environment_error", "network_or_browser", False
    elif "Expected" in excerpt and "Received" in excerpt and not any(
            p in excerpt for p in ("element(s) not found", "resolved to 0 elements")):
        # assertion ran against a real element but the expected value is wrong
        label, sub, review = "oracle_error", "assertion_mismatch", True
    elif any(p in excerpt for p in LOCATOR_PATTERNS):
        label, sub, review = "execution_failure", "locator_or_timeout", True
    else:
        label, sub, review = "execution_failure", "other", True
    return {"label": label, "sublabel": sub, "needs_review": review,
            "n_tests": n, "n_passed": passed, "error_excerpt": excerpt}
