import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { ApiEntry } from "./types.js";
import { escapeHtml } from "./utils.js";

const DIST_SCREENSHOT_DIR = "dist/assets/screenshots";
const CACHE_SCREENSHOT_DIR = ".cache/screenshots";

function placeholderSvg(api: ApiEntry): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" fill="none">
  <rect width="1280" height="720" fill="#f7f3ea" />
  <rect x="48" y="48" width="1184" height="624" rx="8" fill="#fcfaf6" stroke="#e3dccf" />
  <text x="96" y="168" fill="#9a3d1a" font-family="'IBM Plex Mono', monospace" font-size="22">${escapeHtml(api.primaryCategory)}</text>
  <text x="96" y="260" fill="#2c241c" font-family="Georgia, serif" font-size="52">${escapeHtml(api.name)}</text>
  <rect x="96" y="312" width="720" height="16" rx="4" fill="#e3dccf" />
  <rect x="96" y="348" width="640" height="16" rx="4" fill="#e3dccf" />
  <rect x="96" y="384" width="520" height="16" rx="4" fill="#e3dccf" />
  <text x="96" y="600" fill="#5c5349" font-family="'IBM Plex Mono', monospace" font-size="24">${escapeHtml(api.domain)}</text>
</svg>`;
}

async function writePlaceholder(api: ApiEntry): Promise<string> {
  const outputPath = join(DIST_SCREENSHOT_DIR, `${api.slug}.svg`);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, placeholderSvg(api), "utf8");
  return `/assets/screenshots/${api.slug}.svg`;
}

async function copyCachedScreenshot(api: ApiEntry): Promise<string | null> {
  const cachePath = join(CACHE_SCREENSHOT_DIR, `${api.slug}.png`);
  const outputPath = join(DIST_SCREENSHOT_DIR, `${api.slug}.png`);

  try {
    await readFile(cachePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await copyFile(cachePath, outputPath);
    return `/assets/screenshots/${api.slug}.png`;
  } catch {
    return null;
  }
}

async function fetchRemoteScreenshot(api: ApiEntry): Promise<string | null> {
  const baseUrl = process.env.SCREENSHOT_API_BASE_URL;
  if (!baseUrl) {
    return null;
  }

  const cachePath = join(CACHE_SCREENSHOT_DIR, `${api.slug}.png`);

  try {
    await mkdir(dirname(cachePath), { recursive: true });
    const url = new URL("/internal/screenshot", baseUrl);
    url.searchParams.set("url", api.screenshotTargetUrl);
    const requestInit = process.env.SCREENSHOT_API_TOKEN
      ? {
          headers: {
            authorization: `Bearer ${process.env.SCREENSHOT_API_TOKEN}`
          }
        }
      : {};

    const response = await fetch(url, requestInit);

    if (!response.ok) {
      return null;
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    await writeFile(cachePath, imageBuffer);
    return copyCachedScreenshot(api);
  } catch {
    return null;
  }
}

export async function materializeScreenshots(apis: ApiEntry[]): Promise<ApiEntry[]> {
  const hydrated: ApiEntry[] = [];

  for (const api of apis) {
    const cachedScreenshot = await copyCachedScreenshot(api);
    const remoteScreenshot = cachedScreenshot ?? (await fetchRemoteScreenshot(api));
    const screenshotPath = remoteScreenshot ?? (await writePlaceholder(api));
    hydrated.push({
      ...api,
      screenshotPath
    });
  }

  return hydrated;
}
