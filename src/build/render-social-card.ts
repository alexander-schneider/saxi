import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";

import { SITE_NAME, SITE_TAGLINE } from "./constants.js";
import { renderSocialCardHtml } from "./social-card.js";

const OUTPUT_PATH = join("src/assets/social-card.png");
const FONT_PATH = join("src/assets/fonts/inter-latin-wght-normal.woff2");

async function renderSocialCard(): Promise<void> {
  const fontData = await readFile(FONT_PATH);
  const fontUrl = `data:font/woff2;base64,${fontData.toString("base64")}`;
  const html = renderSocialCardHtml(fontUrl);
  const channel = process.env.PLAYWRIGHT_CHROMIUM_CHANNEL;
  const browser = await chromium.launch({
    ...(channel ? { channel } : {}),
    headless: true
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 630 },
      deviceScaleFactor: 1
    });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await mkdir(dirname(OUTPUT_PATH), { recursive: true });
    await page.screenshot({
      path: OUTPUT_PATH,
      type: "png",
      animations: "disabled"
    });
  } finally {
    await browser.close();
  }

  const png = await readFile(OUTPUT_PATH);
  console.log(
    JSON.stringify(
      {
        output: pathToFileURL(OUTPUT_PATH).href,
        bytes: png.byteLength,
        title: `${SITE_NAME}: ${SITE_TAGLINE}`
      },
      null,
      2
    )
  );
}

await renderSocialCard();
