"""Self-test for the clean-run labeller (no LLM calls, no cost).

Writes hand-made specs whose correct label is known, runs them through the same
Playwright path the experiment uses, and checks the label. Run it whenever
playwright_runner.py changes. Requires the app (Vite template or StudyFlow) at
--base-url.

  python harness/selftest_labels.py
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

HARNESS = Path(__file__).resolve().parent
TESTS = HARNESS.parent / "tests"
sys.path.insert(0, str(HARNESS))
from playwright_runner import classify, run_playwright  # noqa: E402

HEADER = "import { test, expect } from '@playwright/test';\n"
CASES = {
    # name: (expected label, test body)
    "valid": ("valid", "test('t', async ({ page }) => { await page.goto('/');"
                       " await expect(page.locator('body')).toBeVisible(); });"),
    "oracle": ("oracle_error", "test('t', async ({ page }) => { await page.goto('/');"
                               " await expect(page).toHaveTitle('definitely-not-the-title'); });"),
    "locator": ("execution_failure", "test('t', async ({ page }) => { await page.goto('/');"
                                     " await page.getByRole('button', { name: 'no-such-button' })"
                                     ".click({ timeout: 2000 }); });"),
    "syntax": ("execution_failure", "test('t', async ({ page }) => { await page.goto('/'); "),
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default="http://localhost:5173")
    args = ap.parse_args()
    d = TESTS / "llm-generated" / "_selftest"
    d.mkdir(parents=True, exist_ok=True)
    failures = 0
    try:
        for name, (want, body) in CASES.items():
            (d / f"{name}.spec.ts").write_text(HEADER + body + "\n", encoding="utf-8")
            v = classify(run_playwright(TESTS, f"llm-generated/_selftest/{name}.spec.ts", args.base_url,
                                        d / "_artifacts" / name))
            ok = v["label"] == want
            failures += not ok
            print(f"{'PASS' if ok else 'FAIL'}  {name:8s} expected={want:18s} got={v['label']} ({v['sublabel']})")
    finally:
        shutil.rmtree(d, ignore_errors=True)
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
