// Captures what the LLM is allowed to see about a page: its ARIA snapshot.
// Also records structural-complexity covariates (DOM nodes, interactive elements).
// Usage: node tools/snapshot.mjs <url>   -> prints one JSON object to stdout
import { chromium } from '@playwright/test';

const url = process.argv[2];
if (!url) {
  console.error('usage: node tools/snapshot.mjs <url>');
  process.exit(2);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: 'ko-KR' });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
  const aria = await page.locator('body').ariaSnapshot();
  const stats = await page.evaluate(() => ({
    domNodes: document.getElementsByTagName('*').length,
    interactiveElements: document.querySelectorAll(
      'a[href],button,input,select,textarea,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"])',
    ).length,
  }));
  console.log(JSON.stringify({ url, title: await page.title(), aria, stats }));
} finally {
  await browser.close();
}
