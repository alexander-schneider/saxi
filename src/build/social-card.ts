import { SITE_NAME, SITE_TAGLINE } from "./constants.js";
import { escapeHtml } from "./utils.js";

export const SOCIAL_CARD_WIDTH = 1200;
export const SOCIAL_CARD_HEIGHT = 630;
export const SOCIAL_CARD_ALT = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const SOCIAL_CARD_PATH = "/social-card.png";

export function renderSocialCardHtml(fontUrl: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      @font-face {
        font-family: Inter;
        font-style: normal;
        font-weight: 100 900;
        src: url("${fontUrl}") format("woff2");
      }

      html, body {
        margin: 0;
        width: ${SOCIAL_CARD_WIDTH}px;
        height: ${SOCIAL_CARD_HEIGHT}px;
        background: #08090a;
        color: #f7f8f8;
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      .card {
        position: relative;
        box-sizing: border-box;
        width: ${SOCIAL_CARD_WIDTH}px;
        height: ${SOCIAL_CARD_HEIGHT}px;
        overflow: hidden;
        padding: 88px 96px;
        background:
          radial-gradient(ellipse 70% 80% at 92% 8%, rgb(139 124 247 / 0.16), transparent 58%),
          radial-gradient(ellipse 50% 60% at 8% 100%, rgb(139 124 247 / 0.08), transparent 52%),
          #08090a;
      }

      .wordmark {
        margin: 0;
        color: #f7f8f8;
        font-size: 34px;
        font-weight: 600;
        letter-spacing: -0.04em;
        line-height: 1;
      }

      .tld {
        color: rgb(247 248 248 / 0.52);
      }

      .headline {
        margin: 64px 0 0;
        max-width: 920px;
        color: #f7f8f8;
        font-size: 68px;
        font-weight: 500;
        letter-spacing: -0.045em;
        line-height: 1.05;
        text-wrap: balance;
      }

      .lede {
        margin: 28px 0 0;
        max-width: 760px;
        color: #8a8f98;
        font-size: 26px;
        font-weight: 400;
        letter-spacing: -0.01em;
        line-height: 1.35;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <p class="wordmark">${escapeHtml(SITE_NAME.replace(".ai", ""))}<span class="tld">.ai</span></p>
      <h1 class="headline">${escapeHtml(SITE_TAGLINE)}</h1>
      <p class="lede">Free public APIs. Indexed, searchable, and ready to use.</p>
    </div>
  </body>
</html>`;
}
