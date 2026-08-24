import {
  COMPANY_COUNTRY,
  COMPANY_MANAGING_DIRECTOR,
  COMPANY_NAME,
  COMPANY_POSTAL,
  COMPANY_REGISTER_COURT,
  COMPANY_REGISTER_NUMBER,
  COMPANY_STREET,
  COMPANY_VAT_ID,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_LABEL,
  PAGE_SIZE,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_TAGLINE,
  LLM_CATALOG_PROMPT
} from "./constants.js";
import { categoryIcon } from "./topic-icons.js";
import type { ApiEntry, CollectionPage, SiteData, TaxonomyPage } from "./types.js";
import { compareStrings, escapeHtml, slugify } from "./utils.js";

interface PageDefinition {
  title: string;
  description: string;
  path: string;
  body: string;
  sidebar?: string;
  structuredData?: unknown[];
  noIndex?: boolean;
}

interface PagerState {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

const SIDEBAR_LINKS = [
  { href: "/apis/", label: "All APIs" },
  { href: "/capability/", label: "Capabilities" },
  { href: "/collections/", label: "Collections" },
  { href: "/category/", label: "Sections" }
];

const ADD_API_GITHUB_URL = createGitHubAddApiUrl();
const REPORT_API_ISSUE_URL = "https://github.com/alexander-schneider/saxi.ai/issues/new";

export function renderDocument(definition: PageDefinition): string {
  const canonicalUrl = `${SITE_ORIGIN}${definition.path}`;
  const title = `${definition.title} | ${SITE_NAME}`;
  const structuredData = definition.structuredData
    ?.map(
      (entry) =>
        `<script type="application/ld+json">${JSON.stringify(entry).replaceAll("</script>", "<\\/script>")}</script>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script>
      (function () {
        try {
          var stored = localStorage.getItem("saxi-theme");
          var theme = stored === "light" || stored === "dark"
            ? stored
            : "dark";
          document.documentElement.dataset.theme = theme;
          document.documentElement.style.colorScheme = theme;
        } catch (error) {}
      })();
    </script>
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(definition.description)}" />
    <meta name="theme-color" content="#08090a" />
    ${definition.noIndex ? '<meta name="robots" content="noindex, follow" />' : '<meta name="robots" content="index, follow" />'}
    <link rel="canonical" href="${canonicalUrl}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preload" href="/assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/assets/fonts/ibm-plex-mono-latin-400.woff2" as="font" type="font/woff2" crossorigin />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${escapeHtml(definition.title)}" />
    <meta property="og:description" content="${escapeHtml(definition.description)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${SITE_ORIGIN}/social-card.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(definition.title)}" />
    <meta name="twitter:description" content="${escapeHtml(definition.description)}" />
    <link rel="stylesheet" href="/assets/app.css?v=hero-stats" />
    ${structuredData ?? ""}
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    ${renderHeader(Boolean(definition.sidebar))}
    <div class="nav-backdrop" data-nav-backdrop hidden></div>
    <div class="shell pb-20 pt-8">
      <div class="${definition.sidebar ? "site-layout" : ""}">
        ${
          definition.sidebar
            ? `<aside id="site-nav" class="site-sidebar" data-site-nav tabindex="-1">${definition.sidebar}</aside>`
            : ""
        }
        <div class="site-main">
          <main id="main" class="shell-grid py-6">
            ${definition.body}
          </main>
          ${renderFooter()}
        </div>
      </div>
    </div>
    <script src="/assets/app.js?v=nav-stack" defer></script>
  </body>
</html>`;
}

function renderHeader(hasNav = false): string {
  const llmPrompt = escapeHtml(LLM_CATALOG_PROMPT);
  const navToggle = hasNav
    ? `<button
          type="button"
          class="nav-toggle"
          data-nav-toggle
          aria-expanded="false"
          aria-controls="site-nav"
          aria-label="Open menu"
        >
          <span class="nav-toggle-icons" aria-hidden="true">
            <svg class="nav-toggle-icon nav-toggle-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            <svg class="nav-toggle-icon nav-toggle-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </span>
        </button>`
    : "";

  return `<header class="site-header">
    <div class="site-header-inner">
      <div class="header-brand">
        ${navToggle}
        <a href="/" class="site-logo" aria-label="saxi.ai home">saxi<span class="site-logo-tld">.ai</span></a>
      </div>
      <div class="header-tools">
        <div class="header-llm" data-llm-copy>
          <label class="header-llm-kicker" for="llm-catalog-prompt">LLM</label>
          <input
            id="llm-catalog-prompt"
            class="header-llm-input"
            type="text"
            readonly
            spellcheck="false"
            autocomplete="off"
            value="${llmPrompt}"
            title="${llmPrompt}"
          />
          <button class="header-llm-copy" type="button" data-llm-copy-button aria-live="polite" aria-label="Copy catalog prompt">Copy</button>
        </div>
        <div class="header-tools-end">
        <button
          type="button"
          class="theme-toggle"
          data-theme-toggle
          aria-pressed="false"
          aria-label="Switch to light mode"
        >
          <span class="theme-toggle-icons" aria-hidden="true">
            <svg class="theme-toggle-icon theme-toggle-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 3v1.5M12 19.5V21M4.22 4.22l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.22 19.78l1.06-1.06M18.72 5.28l1.06-1.06" />
            </svg>
            <svg class="theme-toggle-icon theme-toggle-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
            </svg>
          </span>
        </button>
        <form action="/apis/" method="get" class="header-search">
          <label class="sr-only" for="site-search">Search APIs</label>
          <input
            id="site-search"
            class="min-w-0 flex-1 bg-transparent text-base text-ink-950 outline-none placeholder:text-ink-500"
            type="search"
            name="q"
            placeholder="Search APIs"
          />
          <button class="header-search-button" type="submit">Search</button>
        </form>
        </div>
      </div>
    </div>
  </header>`;
}

function renderFooter(): string {
  return `<footer class="mt-14 border-t border-ink-200 pt-8 text-sm text-ink-600">
    <div class="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
      <div class="max-w-2xl space-y-3">
        <p class="meta-label">About</p>
        <p>
          saxi.ai indexes public APIs from open-source lists and community submissions for AI agents
          and developers. Every entry links to real docs, carries availability metadata, and is tagged by capability.
        </p>
      </div>
      <div class="grid gap-6 sm:grid-cols-2">
        <div class="space-y-2">
          <p class="meta-label">Contact</p>
          <p><a class="eyebrow-link" href="/contact/">Contact page</a></p>
        </div>
        <div class="space-y-2 lg:text-right">
          <p class="meta-label">Sources</p>
        <p><a class="eyebrow-link" href="https://github.com/public-api-lists/public-api-lists" target="_blank" rel="noopener noreferrer">Public API Lists</a></p>
        <p><a class="eyebrow-link" href="https://github.com/public-apis/public-apis" target="_blank" rel="noopener noreferrer">public-apis/public-apis</a></p>
        <p><a class="eyebrow-link" href="https://github.com/tools-collection/apis-collection" target="_blank" rel="noopener noreferrer">tools-collection/apis-collection</a></p>
        </div>
      </div>
    </div>
  </footer>`;
}

function createGitHubAddApiUrl(): string {
  const template = JSON.stringify(
    {
      name: "Example API",
      description: "One clear sentence describing what the API does.",
      docsUrl: "https://example.com/docs",
      websiteUrl: "https://example.com",
      categories: ["Development"],
      auth: "API Key",
      cors: "Unknown",
      https: true,
      free: true,
      addedAt: new Date().toISOString().slice(0, 10),
      openapiUrl: "",
      notes: "Why should this API be listed on saxi.ai?"
    },
    null,
    2
  );
  const params = new URLSearchParams({
    filename: "replace-with-api-name.json",
    value: template
  });

  return `https://github.com/alexander-schneider/saxi.ai/new/main/data/community-apis?${params.toString()}`;
}

function createReportIssueFallbackUrl(api: ApiEntry): string {
  const params = new URLSearchParams({
    template: "report-api.md",
    title: `Report API listing: ${api.name}`
  });

  return `${REPORT_API_ISSUE_URL}?${params.toString()}`;
}

function renderSidebar(site: SiteData, pathname: string): string {
  const browseLinks = SIDEBAR_LINKS.map((item) => {
    const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
    return `<a href="${item.href}" class="sidebar-link" data-active="${active ? "true" : "false"}">
      <span>${item.label}</span>
    </a>`;
  }).join("");

  const topicLinks = site.topics
    .map((topic) => {
      const href = `/topic/${topic.slug}/`;
      const active = pathname === href;
      return `<a href="${href}" class="sidebar-link" data-active="${active ? "true" : "false"}">
        <span class="sidebar-link-label">${categoryIcon(topic.slug)}<span>${escapeHtml(topic.title)}</span></span>
        <span class="sidebar-count">${topic.count}</span>
      </a>`;
    })
    .join("");

  return `<div class="sidebar-stack">
    <div class="sidebar-drawer-head">
      <p class="sidebar-section-label">Menu</p>
    </div>
    <section class="sidebar-panel">
      <p class="sidebar-section-label">Navigate</p>
      <div class="sidebar-list">${browseLinks}</div>
      <a class="sidebar-add-api" href="/add-api/">
        <span>Add your API</span>
        <span aria-hidden="true">+</span>
      </a>
    </section>
    <section class="sidebar-panel">
      <div class="flex items-center justify-between gap-3">
        <p class="sidebar-section-label">Categories</p>
        <a href="/topic/" class="eyebrow-link">All</a>
      </div>
      <div class="sidebar-list sidebar-list-scroll">${topicLinks}</div>
    </section>
  </div>`;
}

function renderHeroStats(stats: Array<{ label: string; value: string }>): string {
  return `<div class="hero-stats">
    ${stats
      .map(
        (stat) => `<div class="hero-stat">
      <span class="meta-label">${escapeHtml(stat.label)}</span>
      <strong>${escapeHtml(stat.value)}</strong>
    </div>`
      )
      .join("")}
  </div>`;
}

function renderHero(
  title: string,
  eyebrow: string,
  description: string,
  actions?: string,
  iconSvg?: string,
  stats?: Array<{ label: string; value: string }>
): string {
  const icon = iconSvg ? `<div class="hero-icon-wrap">${iconSvg}</div>` : "";
  const heading = `<h1 class="max-w-4xl text-4xl font-medium tracking-tight text-ink-950 sm:text-5xl lg:text-[4rem] lg:leading-none">${title}</h1>`;
  const lede = `<p class="max-w-3xl text-base leading-8 text-ink-700">${description}</p>`;

  if (stats && stats.length > 0) {
    return `<section class="hero-panel">
    <div class="hero-grid">
      <div class="hero-intro">
        ${icon}
        <p class="meta-label">${eyebrow}</p>
      </div>
      <div class="hero-copy">
        ${heading}
        ${lede}
        ${actions ?? ""}
      </div>
      ${renderHeroStats(stats)}
    </div>
  </section>`;
  }

  return `<section class="hero-panel">
    <div class="space-y-5">
      ${icon}
      <p class="meta-label">${eyebrow}</p>
      ${heading}
      ${lede}
      ${actions ?? ""}
    </div>
  </section>`;
}

function summarizeSlice(apis: ApiEntry[]): Array<{ label: string; value: string }> {
  const openApiCount = apis.filter((api) => api.hasOpenApi).length;
  const noAuthCount = apis.filter((api) => api.authType === "No Auth").length;
  const officialCount = apis.filter((api) => api.isOfficial).length;
  const topProtocols = [...apis.reduce((map, api) => {
    for (const protocol of api.protocols) {
      map.set(protocol, (map.get(protocol) ?? 0) + 1);
    }
    return map;
  }, new Map<string, number>()).entries()]
    .sort((left, right) => right[1] - left[1] || compareStrings(left[0], right[0]))
    .slice(0, 2)
    .map(([protocol]) => protocol)
    .join(" / ");

  return [
    { label: "APIs", value: String(apis.length) },
    { label: "OpenAPI", value: String(openApiCount) },
    { label: "No auth", value: String(noAuthCount) },
    { label: "Official", value: String(officialCount) },
    { label: "Protocols", value: topProtocols || "REST" }
  ];
}

function renderEditorialSlice(intro: string, editorialSections: string[]): string {
  return `<section>
    <article class="hero-note px-6 py-6 sm:px-8 sm:py-8">
      <div class="space-y-4">
        <p class="text-base leading-8 text-ink-600">${escapeHtml(intro)}</p>
        ${editorialSections.map((paragraph) => `<p class="text-base leading-8 text-ink-700">${escapeHtml(paragraph)}</p>`).join("")}
      </div>
    </article>
  </section>`;
}

function renderSearchHero(site: SiteData): string {
  return `<form action="/apis/" method="get" class="hero-panel">
    <div class="hero-grid">
      <p class="hero-lede">${site.apis.length} free APIs. ${site.topics.length} categories. Open data.</p>
      <div class="hero-copy">
        <h1 class="max-w-4xl text-4xl font-medium tracking-tight text-ink-950 sm:text-5xl lg:text-[4rem] lg:leading-none">${SITE_TAGLINE}</h1>
        <p class="max-w-3xl text-base leading-8 text-ink-700">
          Discover free APIs across AI, search, browser automation, developer tools, messaging, maps, payments, and infrastructure.
        </p>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <span class="meta-label">APIs</span>
          <strong>${site.apis.length}</strong>
        </div>
        <div class="hero-stat">
          <span class="meta-label">Categories</span>
          <strong>${site.topics.length}</strong>
        </div>
        <div class="hero-stat">
          <span class="meta-label">Capabilities</span>
          <strong>${site.capabilities.length}</strong>
        </div>
        <div class="hero-stat">
          <span class="meta-label">Collections</span>
          <strong>${site.collections.length}</strong>
        </div>
      </div>
    </div>
  </form>`;
}

function renderSponsoredBanner(): string {
  return `<section class="sponsor-banner" aria-label="Sponsored banner">
    <div class="sponsor-grid">
      <div class="space-y-5">
        <div class="flex flex-wrap items-center gap-3">
          <span class="sponsor-label">Sponsored</span>
          <span class="badge">Adanos Software</span>
        </div>
        <div class="space-y-3">
          <h2 class="text-3xl font-medium tracking-tight text-ink-950 sm:text-[2.35rem]">Market sentiment API for stocks and crypto.</h2>
          <p class="max-w-3xl text-base leading-8 text-ink-700">
            Real-time sentiment and attention data from Reddit, X, financial news, Polymarket and crypto communities,
            unified into a developer-first API for trading tools, quant workflows and AI agents.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="badge">Market Data</span>
          <span class="badge">REST API</span>
          <span class="badge">JSON</span>
          <span class="badge">AI Agents</span>
          <span class="badge">CLI</span>
        </div>
        <div class="flex flex-wrap gap-3">
          <a href="https://adanos.org/" target="_blank" rel="noreferrer" class="button-primary">Visit Adanos</a>
          <a href="https://api.adanos.org/" target="_blank" rel="noreferrer" class="button-secondary">API Docs</a>
        </div>
      </div>
      <div class="sponsor-code">
<pre><code>{
  "ticker": "NVDA",
  "buzz_score": 79.4,
  "trend": "rising",
  "mentions": 3689,
  "sentiment_score": 0.64,
  "bullish_pct": 58,
  "bearish_pct": 14
}</code></pre>
        <p class="sponsor-code-caption">Structured sentiment signals for apps, dashboards and LLM tool use.</p>
      </div>
    </div>
  </section>`;
}

function renderSectionTitle(title: string, description: string, href?: string): string {
  return `<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div class="space-y-2">
      <p class="meta-label">Section</p>
      <h2 class="section-title">${title}</h2>
      <p class="section-copy">${description}</p>
    </div>
    ${href ? `<a href="${href}" class="button-secondary">View all</a>` : ""}
  </div>`;
}

function taxonomySlugFromHref(href: string): string | undefined {
  const match = /^\/(?:topic|category|capability|collections)\/([^/]+)\/?$/.exec(href);
  return match?.[1];
}

function renderTaxonomyTiles(items: Array<{ href: string; title: string; description: string; count: number }>): string {
  return `<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">${items
    .map((item) => {
      const slug = taxonomySlugFromHref(item.href);
      const icon = slug ? categoryIcon(slug) : "";
      return `<a href="${item.href}" class="glass-tile group">
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            ${icon ? `<span class="category-icon-wrap">${icon}</span>` : ""}
            <h3 class="text-lg font-semibold text-ink-950">${escapeHtml(item.title)}</h3>
          </div>
          <span class="badge shrink-0">${item.count} APIs</span>
        </div>
        <p class="mt-3 text-sm leading-7 text-ink-700">${escapeHtml(item.description)}</p>
      </a>`;
    })
    .join("")}</div>`;
}

function renderApiCard(api: ApiEntry): string {
  const capabilities = api.capabilities.slice(0, 4).map((capability) => `<span class="badge">${escapeHtml(capability)}</span>`).join("");
  const badges = [
    api.isFree ? "Free" : "Paid/Trial",
    api.authType,
    api.https ? "HTTPS" : "HTTP",
    `CORS ${api.cors}`,
    api.isOfficial ? "Official" : "Unofficial",
    api.hasOpenApi ? "OpenAPI" : ""
  ]
    .filter(Boolean)
    .map((value) => `<span class="badge">${escapeHtml(value)}</span>`)
    .join("");

  return `<article
    class="api-card"
    data-api-card
    data-name="${escapeHtml(api.name)}"
    data-search="${escapeHtml(api.searchText)}"
    data-section="${escapeHtml(api.primaryCategory)}"
    data-category="${escapeHtml(api.primaryCategory)}"
    data-categories="${escapeHtml(api.sourceCategories.join("|"))}"
    data-capabilities="${escapeHtml(api.capabilities.join("|"))}"
    data-auth="${escapeHtml(api.authType)}"
    data-official="${api.isOfficial ? "yes" : "no"}"
    data-openapi="${api.hasOpenApi ? "yes" : "no"}"
    data-weight="${api.weight}"
    data-score="${api.freshnessScore}"
  >
    <a href="${escapeHtml(api.docsUrl)}" target="_blank" rel="noreferrer" class="api-card-link" aria-label="${escapeHtml(api.name)} documentation">
      <div class="api-card-media">
        <img
          src="${api.screenshotPath}"
          alt="${escapeHtml(api.name)} documentation page"
          width="400"
          height="192"
          loading="lazy"
          decoding="async"
          class="api-card-image"
        />
      </div>
      <div class="api-card-body">
        <div class="flex flex-wrap gap-2">
          <span class="badge">${escapeHtml(api.primaryCategory)}</span>
          ${capabilities}
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-xl font-semibold tracking-tight text-ink-950">${escapeHtml(api.name)}</h3>
            <span class="font-mono text-sm text-ink-500">${escapeHtml(api.domain)}</span>
          </div>
          <p class="text-sm leading-7 text-ink-700">${escapeHtml(api.description)}</p>
        </div>
        <div class="mt-auto flex flex-wrap gap-2">${badges}</div>
      </div>
    </a>
    <a
      href="${escapeHtml(createReportIssueFallbackUrl(api))}"
      target="_blank"
      rel="noreferrer"
      class="api-card-report"
      title="Report this API listing"
      aria-label="Report ${escapeHtml(api.name)} listing"
      data-report-api
      data-report-id="${escapeHtml(api.id)}"
      data-report-name="${escapeHtml(api.name)}"
      data-report-docs-url="${escapeHtml(api.docsUrl)}"
      data-report-website-url="${escapeHtml(api.websiteUrl)}"
      data-report-domain="${escapeHtml(api.domain)}"
      data-report-section="${escapeHtml(api.primaryCategory)}"
      data-report-categories="${escapeHtml(api.sourceCategories.join("|"))}"
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
        <path d="M5 17V4.5M5 4.5H14.5L12.7 8L14.5 11.5H5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="sr-only">Report listing</span>
    </a>
  </article>`;
}

function renderApiGrid(apis: ApiEntry[]): string {
  return `<div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3" data-results-grid>${apis
    .map((api) => renderApiCard(api))
    .join("")}</div>`;
}

function renderArchivePager(state: PagerState): string {
  if (state.totalPages <= 1) {
    return "";
  }

  const pages = Array.from({ length: state.totalPages }, (_, index) => index + 1);
  const visible = new Set<number>([1, state.totalPages]);
  for (let offset = -1; offset <= 1; offset++) {
    const page = state.currentPage + offset;
    if (page >= 1 && page <= state.totalPages) {
      visible.add(page);
    }
  }

  const items: string[] = [];
  let lastRendered = 0;
  for (const page of pages) {
    if (!visible.has(page)) {
      continue;
    }
    if (lastRendered > 0 && page - lastRendered > 1) {
      items.push(`<span class="nav-pill pointer-events-none text-ink-500">&hellip;</span>`);
    }
    const href = page === 1 ? state.basePath : `${state.basePath}page/${page}/`;
    const active = page === state.currentPage;
    items.push(`<a href="${href}" class="nav-pill" data-active="${active ? "true" : "false"}">${page}</a>`);
    lastRendered = page;
  }

  return `<div class="flex flex-wrap gap-2">${items.join("")}</div>`;
}

function renderAllApisFilters(site: SiteData): string {
  const option = (value: string) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`;

  return `<form class="filter-panel" data-filter-form>
    <div class="space-y-2">
      <label class="sr-only" for="api-search">Search APIs</label>
      <input id="api-search" class="filter-input" type="search" name="q" placeholder="Search APIs, docs, or capabilities" data-search-input />
    </div>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <select class="filter-input" name="category" aria-label="Category">
        <option value="">All categories</option>
        ${site.filterOptions.categories.map(option).join("")}
      </select>
      <select class="filter-input" name="section" aria-label="Section">
        <option value="">All sections</option>
        ${site.filterOptions.sections.map(option).join("")}
      </select>
      <select class="filter-input" name="capability" aria-label="Capability">
        <option value="">All capabilities</option>
        ${site.filterOptions.capabilities.map(option).join("")}
      </select>
      <select class="filter-input" name="auth" aria-label="Auth type">
        <option value="">Any auth</option>
        ${site.filterOptions.authTypes.map(option).join("")}
      </select>
    </div>
    <div class="grid gap-3 sm:grid-cols-3">
      <select class="filter-input" name="official" aria-label="Official status">
        <option value="">Official + unofficial</option>
        <option value="yes">Official only</option>
        <option value="no">Unofficial only</option>
      </select>
      <select class="filter-input" name="openapi" aria-label="OpenAPI spec">
        <option value="">Any spec state</option>
        <option value="yes">OpenAPI available</option>
        <option value="no">No OpenAPI spec</option>
      </select>
      <select class="filter-input" name="sort" data-sort-select aria-label="Sort order">
        <option value="relevance">Best match</option>
        <option value="alphabetical">Alphabetical</option>
        <option value="freshness">Source confidence</option>
      </select>
    </div>
  </form>`;
}

function renderBreadcrumb(items: Array<{ href: string; label: string }>): string {
  return `<nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-2 text-sm text-ink-400">
    ${items
      .map(
        (item, index) =>
          `${index > 0 ? '<span class="text-ink-600">/</span>' : ""}<a href="${item.href}" class="eyebrow-link">${escapeHtml(item.label)}</a>`
      )
      .join("")}
  </nav>`;
}

function breadcrumbSchema(items: Array<{ href: string; label: string }>): unknown {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${SITE_ORIGIN}${item.href}`
    }))
  };
}

export function renderHomePage(site: SiteData): string {
  const capabilityTiles = site.capabilities.slice(0, 9).map((capability) => ({
    href: `/capability/${capability.slug}/`,
    title: capability.title,
    description: capability.description,
    count: capability.count
  }));

  const collectionTiles = site.collections.map((collection) => ({
    href: `/collections/${collection.slug}/`,
    title: collection.title,
    description: collection.description,
    count: collection.apis.length
  }));

  return renderDocument({
    title: "Public API Directory for AI Agents and Developers",
    description:
      "Browse public APIs across AI, browser automation, search, speech, developer tools, messaging, maps, and infrastructure.",
    path: "/",
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_ORIGIN,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_ORIGIN}/apis/?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_ORIGIN,
        contactPoint: {
          "@type": "ContactPoint",
          email: CONTACT_EMAIL,
          contactType: "customer support"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Featured APIs",
        numberOfItems: Math.min(site.featuredApis.length, 9),
        itemListElement: site.featuredApis.slice(0, 9).map((api, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: api.name,
          url: api.docsUrl
        }))
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Newest APIs",
        numberOfItems: Math.min(site.newestApis.length, 6),
        itemListElement: site.newestApis.slice(0, 6).map((api, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: api.name,
          url: api.docsUrl
        }))
      }
    ],
    sidebar: renderSidebar(site, "/"),
    body: [
      renderSearchHero(site),
      renderSponsoredBanner(),
      site.newestApis.length > 0
        ? `<section class="space-y-5">
          ${renderSectionTitle("Newest APIs", "Recently added community submissions with public docs, availability metadata, and validation checks already attached.")}
          ${renderApiGrid(site.newestApis.slice(0, 6))}
        </section>`
        : "",
      `<section class="space-y-5">
        ${renderSectionTitle("Featured APIs", "The most useful APIs for building with AI, sorted by documentation quality, protocol support, and real-world utility.", "/apis/")}
        ${renderApiGrid(site.featuredApis.slice(0, 9))}
      </section>`,
      `<section class="space-y-5">
        ${renderSectionTitle("Collections", "Hand-picked groups of APIs for common tasks — from browser automation and RAG pipelines to translation and speech.", "/collections/")}
        ${renderTaxonomyTiles(collectionTiles)}
      </section>`,
      `<section class="space-y-5">
        ${renderSectionTitle("Top Capabilities", "Find APIs by what they do — search, code execution, OCR, geocoding, and more.", "/capability/")}
        ${renderTaxonomyTiles(capabilityTiles)}
      </section>`
    ].join("")
  });
}

export function renderApisLandingPage(site: SiteData, pager: PagerState): string {
  const archiveSummary = `<div class="flex flex-wrap items-center justify-between gap-4">
    <div class="space-y-1">
      <p class="meta-label">Pages</p>
      <p class="text-sm text-ink-700">
        Browse all APIs page by page, or use the filters above to narrow down.
      </p>
    </div>
    ${renderArchivePager(pager)}
  </div>`;

  return renderDocument({
    title: "All APIs",
    description:
      "Search and filter the saxi.ai directory of public APIs for AI agents and developers.",
    path: "/apis/",
    noIndex: true,
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: "/apis/", label: "All APIs" }
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "All APIs",
        description:
          "Search and filter the saxi.ai directory of public APIs for AI agents and developers.",
        url: `${SITE_ORIGIN}/apis/`
      }
    ],
    sidebar: renderSidebar(site, "/apis/"),
    body: [
      renderHero(
        "Search the full API directory",
        "All APIs",
        "Filter by category, capability, auth type, or just search. Every API links directly to its documentation."
      ),
      `<section class="space-y-6">
        ${renderAllApisFilters(site)}
        <div class="space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
              <p class="meta-label">Results</p>
              <h2 class="text-2xl font-bold tracking-tight text-ink-950">Free APIs for AI agents and developers</h2>
            </div>
            <p class="badge" data-results-count>${site.apis.length} APIs</p>
          </div>
          <div data-search-index="/search-index.json">
            ${renderApiGrid(site.apis.slice(0, PAGE_SIZE))}
          </div>
          ${archiveSummary}
        </div>
      </section>`
    ].join("")
  });
}

export function renderApisArchivePage(site: SiteData, apis: ApiEntry[], pager: PagerState): string {
  const path = pager.currentPage === 1 ? "/apis/" : `/apis/page/${pager.currentPage}/`;
  const title = pager.currentPage === 1 ? "All APIs" : `All APIs - Page ${pager.currentPage}`;

  return renderDocument({
    title,
    description:
      "Browse the crawlable archive of public APIs for AI agents and developers.",
    path,
    noIndex: true,
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: "/apis/", label: "All APIs" }
      ])
    ],
    sidebar: renderSidebar(site, path),
    body: [
      renderBreadcrumb([
        { href: "/", label: "Home" },
        { href: "/apis/", label: "All APIs" }
      ]),
      renderHero(
        pager.currentPage === 1 ? "All APIs" : `All APIs — page ${pager.currentPage}`,
        "Archive",
        "The complete list of public APIs in the directory. Use the main search page for filtering and sorting."
      ),
      `<section class="space-y-5">
        ${renderApiGrid(apis)}
        ${renderArchivePager(pager)}
      </section>`
    ].join("")
  });
}

export function renderTaxonomyIndexPage(
  site: SiteData,
  title: string,
  description: string,
  path: string,
  items: Array<{ href: string; title: string; description: string; count: number }>
): string {
  return renderDocument({
    title,
    description,
    path,
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: path, label: title }
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: title,
        description,
        url: `${SITE_ORIGIN}${path}`
      }
    ],
    sidebar: renderSidebar(site, path),
    body: [
      renderHero(title, "Index", description),
      `<section class="space-y-5">${renderTaxonomyTiles(items)}</section>`
    ].join("")
  });
}

export function renderTopicPage(site: SiteData, topic: TaxonomyPage): string {
  const path = `/topic/${topic.slug}/`;
  return renderDocument({
    title: `${topic.title} APIs`,
    description: topic.description,
    path,
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: "/topic/", label: "Categories" },
        { href: path, label: `${topic.title} APIs` }
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${topic.title} APIs`,
        description: topic.description,
        url: `${SITE_ORIGIN}${path}`
      }
    ],
    sidebar: renderSidebar(site, path),
    body: renderTaxonomyBody(topic, path, { href: "/topic/", label: "Categories" }, "Category", "/apis/", {
      name: "category",
      value: topic.title
    })
  });
}

function renderTaxonomyBody(
  item: TaxonomyPage | CollectionPage,
  pathname: string,
  parent: { href: string; label: string },
  eyebrow: string,
  browseLink: string,
  searchFilter?: { name: string; value: string }
): string {
  const breadcrumb = [
    { href: "/", label: "Home" },
    parent,
    { href: pathname, label: item.title }
  ];

  const allApisLink = searchFilter
    ? `${browseLink}?${searchFilter.name}=${encodeURIComponent(searchFilter.value)}`
    : browseLink;

  return [
    renderBreadcrumb(breadcrumb),
    renderHero(item.title, eyebrow, item.description, undefined, categoryIcon(item.slug), summarizeSlice(item.apis)),
    renderEditorialSlice(item.intro, item.editorialSections),
    `<section class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="space-y-1">
          <p class="meta-label">Directory slice</p>
          <h2 class="text-2xl font-bold tracking-tight text-ink-950">${item.apis.length} APIs</h2>
        </div>
        <a href="${allApisLink}" class="button-secondary">Open in all APIs search</a>
      </div>
      ${renderApiGrid(item.apis)}
    </section>`
  ].join("");
}

export function renderCategoryPage(site: SiteData, category: TaxonomyPage): string {
  const path = `/category/${category.slug}/`;
  return renderDocument({
    title: `${category.title} APIs`,
    description: category.description,
    path,
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: "/category/", label: "Sections" },
        { href: path, label: `${category.title} APIs` }
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${category.title} APIs`,
        description: category.description,
        url: `${SITE_ORIGIN}${path}`
      }
    ],
    sidebar: renderSidebar(site, path),
    body: renderTaxonomyBody(category, path, { href: "/category/", label: "Sections" }, "Section", "/apis/", {
      name: "section",
      value: category.title
    })
  });
}

export function renderCapabilityPage(site: SiteData, capability: TaxonomyPage): string {
  const path = `/capability/${capability.slug}/`;
  return renderDocument({
    title: `${capability.title} APIs`,
    description: capability.description,
    path,
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: "/capability/", label: "Capabilities" },
        { href: path, label: `${capability.title} APIs` }
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${capability.title} APIs`,
        description: capability.description,
        url: `${SITE_ORIGIN}${path}`
      }
    ],
    sidebar: renderSidebar(site, path),
    body: renderTaxonomyBody(capability, path, { href: "/capability/", label: "Capabilities" }, "Capability", "/apis/", {
      name: "capability",
      value: capability.title
    })
  });
}

export function renderCollectionPage(site: SiteData, collection: CollectionPage): string {
  const path = `/collections/${collection.slug}/`;
  return renderDocument({
    title: collection.title,
    description: collection.description,
    path,
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: "/collections/", label: "Collections" },
        { href: path, label: collection.title }
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: collection.title,
        description: collection.description,
        url: `${SITE_ORIGIN}${path}`
      }
    ],
    sidebar: renderSidebar(site, path),
    body: renderTaxonomyBody(collection, path, { href: "/collections/", label: "Collections" }, "Collection", "/apis/")
  });
}

export function renderAddApiPage(site: SiteData): string {
  return renderDocument({
    title: "Add your API",
    description: "How to submit a public API to saxi.ai through GitHub pull requests.",
    path: "/add-api/",
    noIndex: true,
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: "/add-api/", label: "Add your API" }
      ])
    ],
    sidebar: renderSidebar(site, "/add-api/"),
    body: [
      renderHero(
        "Add your API",
        "Community submissions",
        "saxi.ai accepts public APIs through GitHub pull requests. GitHub can only open the PR screen after a contributor has created a branch with one JSON file, so the first step is the generated file editor."
      ),
      `<section class="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <article class="hero-note px-6 py-6 sm:px-8 sm:py-8">
          <div class="space-y-6">
            <div>
              <p class="meta-label">GitHub flow</p>
              <h2 class="mt-2 text-2xl font-medium tracking-tight text-ink-950">Why this starts in the file editor</h2>
            </div>
            <p class="text-sm leading-7 text-ink-700">
              A pull request compares two branches. For a new API submission there is no contributor branch yet,
              so GitHub cannot directly show a useful create-PR page. The generated editor link creates the required
              JSON file first; after the contributor clicks <span class="text-ink-950">Propose changes</span>, GitHub opens
              the pull request screen with the validation checks attached.
            </p>
            <div class="flex flex-wrap gap-3">
              <a href="${escapeHtml(ADD_API_GITHUB_URL)}" target="_blank" rel="noopener noreferrer" class="button-primary">Open GitHub editor</a>
              <a href="https://github.com/alexander-schneider/saxi.ai/blob/main/data/community-apis/README.md" target="_blank" rel="noopener noreferrer" class="button-secondary">Submission rules</a>
            </div>
          </div>
        </article>
        <article class="hero-note px-6 py-6 sm:px-8 sm:py-8">
          <div class="space-y-5">
            <div>
              <p class="meta-label">Checklist</p>
              <h2 class="mt-2 text-2xl font-medium tracking-tight text-ink-950">Before opening the PR</h2>
            </div>
            <ul class="space-y-3 text-sm leading-7 text-ink-700">
              <li>Rename the file to lowercase kebab-case, for example <code class="text-ink-950">my-example-api.json</code>.</li>
              <li>Replace every placeholder value, especially <code class="text-ink-950">Example API</code> and <code class="text-ink-950">example.com</code>.</li>
              <li>Use 1-3 categories copied from the allowed category list.</li>
              <li>Submit only APIs with public docs and accurate availability metadata.</li>
            </ul>
          </div>
        </article>
      </section>`
    ].join("")
  });
}

export function renderContactPage(site: SiteData): string {
  return renderDocument({
    title: "Contact & Imprint",
    description: "Contact and legal company information for the saxi.ai project.",
    path: "/contact/",
    noIndex: true,
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: "/contact/", label: "Contact" }
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: COMPANY_NAME,
        url: SITE_ORIGIN,
        email: CONTACT_EMAIL,
        telephone: CONTACT_PHONE,
        address: {
          "@type": "PostalAddress",
          streetAddress: COMPANY_STREET,
          postalCode: "10407",
          addressLocality: "Berlin",
          addressCountry: COMPANY_COUNTRY
        }
      }
    ],
    sidebar: renderSidebar(site, "/contact/"),
    body: [
      renderHero(
        "Contact & Imprint",
        "Contact",
        "saxi.ai is operated by Adanos Software GmbH. Reach out for corrections, broken links, partnership requests, or legal inquiries."
      ),
      `<section class="grid gap-5 xl:grid-cols-2">
        <article class="hero-note px-6 py-6 sm:px-8 sm:py-8">
          <div class="space-y-5">
            <div>
              <p class="meta-label">Primary contact</p>
              <a href="mailto:${CONTACT_EMAIL}" class="mt-2 inline-block text-2xl font-semibold tracking-tight text-ink-950">${CONTACT_EMAIL}</a>
            </div>
            <div>
              <p class="meta-label">Phone</p>
              <a href="tel:${CONTACT_PHONE}" class="mt-2 inline-block text-xl font-semibold tracking-tight text-ink-950">${CONTACT_PHONE_LABEL}</a>
              <p class="mt-2 text-sm leading-7 text-ink-700">Business line only. No product support by phone.</p>
            </div>
            <p class="text-sm leading-7 text-ink-700">
              Please include enough context if you are reporting a broken source, outdated docs URL, category issue, or partnership request.
            </p>
          </div>
        </article>
        <article class="hero-note px-6 py-6 sm:px-8 sm:py-8">
          <div class="space-y-5">
            <div>
              <p class="meta-label">Company</p>
              <h2 class="mt-2 text-2xl font-semibold tracking-tight text-ink-950">${COMPANY_NAME}</h2>
            </div>
            <div class="space-y-1 text-sm leading-7 text-ink-700">
              <p>${COMPANY_STREET}</p>
              <p>${COMPANY_POSTAL}</p>
              <p>${COMPANY_COUNTRY}</p>
            </div>
            <div class="space-y-1 text-sm leading-7 text-ink-700">
              <p><span class="text-ink-950">Managing Director:</span> ${COMPANY_MANAGING_DIRECTOR}</p>
              <p><span class="text-ink-950">Responsible for content:</span> ${COMPANY_MANAGING_DIRECTOR}</p>
            </div>
          </div>
        </article>
      </section>`,
      `<section class="grid gap-5 xl:grid-cols-2">
        <article class="hero-note px-6 py-6 sm:px-8 sm:py-8">
          <div class="space-y-5">
            <div>
              <p class="meta-label">Registration</p>
              <h2 class="mt-2 text-2xl font-semibold tracking-tight text-ink-950">Legal company details</h2>
            </div>
            <div class="space-y-1 text-sm leading-7 text-ink-700">
              <p><span class="text-ink-950">Registered at:</span> ${COMPANY_REGISTER_COURT}</p>
              <p><span class="text-ink-950">Registration number:</span> ${COMPANY_REGISTER_NUMBER}</p>
              <p><span class="text-ink-950">VAT ID:</span> ${COMPANY_VAT_ID}</p>
            </div>
          </div>
        </article>
        <article class="hero-note px-6 py-6 sm:px-8 sm:py-8">
          <div class="space-y-5">
            <div>
              <p class="meta-label">Dispute resolution</p>
              <h2 class="mt-2 text-2xl font-semibold tracking-tight text-ink-950">Consumer arbitration</h2>
            </div>
            <p class="text-sm leading-7 text-ink-700">
              Adanos Software GmbH does not participate in consumer arbitration proceedings and is not obliged to do so.
            </p>
            <p class="text-sm leading-7 text-ink-700">
              EU online dispute resolution platform:
              <a class="eyebrow-link" href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">ec.europa.eu/consumers/odr</a>
            </p>
          </div>
        </article>
      </section>`
    ].join("")
  });
}

export function renderNotFoundPage(): string {
  return renderDocument({
    title: "Page not found",
    description: "The page you requested does not exist in the saxi.ai directory.",
    path: "/404.html",
    noIndex: true,
    body: `<section class="hero-note max-w-3xl px-6 py-8 sm:px-8 sm:py-10">
      <p class="meta-label">404</p>
      <h1 class="mt-4 text-4xl font-medium tracking-tight text-ink-950">This route does not exist.</h1>
      <p class="mt-4 max-w-2xl text-base leading-8 text-ink-700">
        Use the directory homepage or the full API search to get back to a valid section of saxi.ai.
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a href="/" class="button-secondary">Back to homepage</a>
        <a href="/apis/" class="button-secondary">Open all APIs</a>
      </div>
    </section>`
  });
}

export function renderSearchIndex(site: SiteData): string {
  return JSON.stringify(
    {
      generatedAt: site.generatedAt,
      total: site.apis.length,
      apis: site.apis.map((api) => ({
        id: api.id,
        slug: api.slug,
        name: api.name,
        description: api.description,
        docsUrl: api.docsUrl,
        websiteUrl: api.websiteUrl,
        screenshotPath: api.screenshotPath,
        primaryCategory: api.primaryCategory,
        sourceCategories: api.sourceCategories,
        capabilities: api.capabilities,
        authType: api.authType,
        https: api.https,
        cors: api.cors,
        isOfficial: api.isOfficial,
        hasOpenApi: api.hasOpenApi,
        domain: api.domain,
        searchText: api.searchText,
        weight: api.weight,
        freshnessScore: api.freshnessScore,
        addedAt: api.addedAt
      }))
    },
    null,
    2
  );
}

function absoluteUrl(path: string): string {
  return `${SITE_ORIGIN}${path}`;
}

function renderJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function buildCollectionMembership(site: SiteData): Map<string, CollectionPage[]> {
  const membership = new Map<string, CollectionPage[]>();

  for (const collection of site.collections) {
    for (const api of collection.apis) {
      membership.set(api.id, [...(membership.get(api.id) ?? []), collection]);
    }
  }

  return membership;
}

export function renderApiManifest(site: SiteData): string {
  return renderJson({
    schemaVersion: "1.0",
    generatedAt: site.generatedAt,
    site: {
      name: SITE_NAME,
      url: SITE_ORIGIN,
      description: "Public API directory for AI agents and developers."
    },
    summary: {
      apis: site.apis.length,
      topics: site.topics.length,
      capabilities: site.capabilities.length,
      collections: site.collections.length
    },
    endpoints: {
      manifest: absoluteUrl("/api/index.json"),
      catalog: absoluteUrl("/api/catalog.json"),
      apis: absoluteUrl("/api/apis.json"),
      topics: absoluteUrl("/api/topics.json"),
      capabilities: absoluteUrl("/api/capabilities.json"),
      collections: absoluteUrl("/api/collections.json"),
      updates: absoluteUrl("/api/updates.json"),
      searchIndex: absoluteUrl("/search-index.json"),
      llmTxt: absoluteUrl("/llm.txt"),
      llmsTxt: absoluteUrl("/llms.txt"),
      sitemap: absoluteUrl("/sitemap.xml"),
      robots: absoluteUrl("/robots.txt")
    },
    notes: [
      "Use /api/catalog.json for agent ingestion. It is compact, public, and CORS-enabled.",
      "Use /api/apis.json only when you need the full snapshot with extra metadata.",
      "Use /search-index.json only for lightweight UI-style search and ranking.",
      "saxi.ai currently publishes full snapshots, not incremental diffs."
    ]
  });
}

export function renderPublicApis(site: SiteData): string {
  const collectionMembership = buildCollectionMembership(site);

  return renderJson({
    schemaVersion: "1.0",
    generatedAt: site.generatedAt,
    total: site.apis.length,
    apis: site.apis.map((api) => {
      const sectionSlug = slugify(api.primaryCategory);
      const collections = (collectionMembership.get(api.id) ?? []).map((collection) => ({
        slug: collection.slug,
        title: collection.title,
        url: absoluteUrl(`/collections/${collection.slug}/`)
      }));

      return {
        id: api.id,
        slug: api.slug,
        name: api.name,
        description: api.description,
        docsUrl: api.docsUrl,
        websiteUrl: api.websiteUrl,
        screenshotUrl: absoluteUrl(api.screenshotPath),
        screenshotTargetUrl: api.screenshotTargetUrl,
        domain: api.domain,
        section: {
          slug: sectionSlug,
          title: api.primaryCategory,
          url: absoluteUrl(`/category/${sectionSlug}/`)
        },
        categories: api.sourceCategories.map((title) => {
          const slug = slugify(title);
          return {
            slug,
            title,
            url: absoluteUrl(`/topic/${slug}/`)
          };
        }),
        capabilities: api.capabilities.map((title) => {
          const slug = slugify(title);
          return {
            slug,
            title,
            url: absoluteUrl(`/capability/${slug}/`)
          };
        }),
        collections,
        authType: api.authType,
        https: api.https,
        cors: api.cors,
        hasOpenApi: api.hasOpenApi,
        protocols: api.protocols,
        isOfficial: api.isOfficial,
        isFree: api.isFree,
        sourceLabels: api.sourceLabels,
        sourceRepos: api.sourceRepos,
        sourceLicenses: api.sourceLicenses,
        addedAt: api.addedAt,
        indexedAt: site.generatedAt
      };
    })
  });
}

export function renderAgentCatalog(site: SiteData): string {
  return JSON.stringify({
    schemaVersion: "1.0",
    generatedAt: site.generatedAt,
    total: site.apis.length,
    apis: site.apis.map((api) => ({
      name: api.name,
      docsUrl: api.docsUrl,
      description: truncateText(api.description, 180),
      authType: api.authType,
      hasOpenApi: api.hasOpenApi,
      isOfficial: api.isOfficial,
      isFree: api.isFree,
      section: slugify(api.primaryCategory),
      topics: api.sourceCategories.slice(0, 6).map((title) => slugify(title)),
      capabilities: api.capabilities.slice(0, 6).map((title) => slugify(title))
    }))
  });
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

export function renderPublicTopics(site: SiteData): string {
  return renderJson({
    schemaVersion: "1.0",
    generatedAt: site.generatedAt,
    total: site.topics.length,
    topics: site.topics.map((topic) => ({
      slug: topic.slug,
      title: topic.title,
      url: absoluteUrl(`/topic/${topic.slug}/`),
      description: topic.description,
      intro: topic.intro,
      editorialSections: topic.editorialSections,
      count: topic.count,
      topApis: topic.apis.slice(0, 12).map((api) => ({
        id: api.id,
        slug: api.slug,
        name: api.name,
        docsUrl: api.docsUrl
      }))
    }))
  });
}

export function renderPublicCapabilities(site: SiteData): string {
  return renderJson({
    schemaVersion: "1.0",
    generatedAt: site.generatedAt,
    total: site.capabilities.length,
    capabilities: site.capabilities.map((capability) => ({
      slug: capability.slug,
      title: capability.title,
      url: absoluteUrl(`/capability/${capability.slug}/`),
      description: capability.description,
      intro: capability.intro,
      editorialSections: capability.editorialSections,
      count: capability.count,
      topApis: capability.apis.slice(0, 12).map((api) => ({
        id: api.id,
        slug: api.slug,
        name: api.name,
        docsUrl: api.docsUrl
      }))
    }))
  });
}

export function renderPublicCollections(site: SiteData): string {
  return renderJson({
    schemaVersion: "1.0",
    generatedAt: site.generatedAt,
    total: site.collections.length,
    collections: site.collections.map((collection) => ({
      slug: collection.slug,
      title: collection.title,
      url: absoluteUrl(`/collections/${collection.slug}/`),
      description: collection.description,
      intro: collection.intro,
      editorialSections: collection.editorialSections,
      count: collection.apis.length,
      topApis: collection.apis.slice(0, 16).map((api) => ({
        id: api.id,
        slug: api.slug,
        name: api.name,
        docsUrl: api.docsUrl
      }))
    }))
  });
}

export function renderPublicUpdates(site: SiteData): string {
  return renderJson({
    schemaVersion: "1.0",
    generatedAt: site.generatedAt,
    snapshotId: site.generatedAt,
    updateType: "full_snapshot",
    summary: {
      apis: site.apis.length,
      topics: site.topics.length,
      capabilities: site.capabilities.length,
      collections: site.collections.length
    },
    endpoints: {
      manifest: absoluteUrl("/api/index.json"),
      catalog: absoluteUrl("/api/catalog.json"),
      apis: absoluteUrl("/api/apis.json"),
      topics: absoluteUrl("/api/topics.json"),
      capabilities: absoluteUrl("/api/capabilities.json"),
      collections: absoluteUrl("/api/collections.json")
    },
    notes: [
      "This endpoint currently announces full catalog snapshots only.",
      "Incremental add/change/remove diffs are not published yet."
    ]
  });
}

export function renderRobotsTxt(): string {
  return `# Public machine feeds: /llms.txt and /api/catalog.json
# These endpoints are intentionally open to AI agents and require no auth.

User-agent: *
Content-Signal: search=yes, ai-train=yes, ai-input=yes
Allow: /llms.txt
Allow: /llm.txt
Allow: /api/
Allow: /
Disallow: /apis/page/
Disallow: /404.html
Disallow: /contact/

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Google-CloudVertexBot
Allow: /

User-agent: Gemini-Deep-Research
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: Googlebot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;
}

export function renderLlmTxt(site: SiteData): string {
  const topTopics = site.topics.slice(0, 20).map((topic) => `- ${topic.title}: ${SITE_ORIGIN}/topic/${topic.slug}/`);
  const topCapabilities = site.capabilities
    .slice(0, 12)
    .map((capability) => `- ${capability.title}: ${SITE_ORIGIN}/capability/${capability.slug}/`);
  const collections = site.collections.map((collection) => `- ${collection.title}: ${SITE_ORIGIN}/collections/${collection.slug}/`);

  return [
    `site: ${SITE_NAME}`,
    `url: ${SITE_ORIGIN}`,
    `description: Public API directory for AI agents and developers.`,
    `contact: ${CONTACT_EMAIL}`,
    `sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    `robots: ${SITE_ORIGIN}/robots.txt`,
    `manifest: ${SITE_ORIGIN}/api/index.json`,
    `catalog_feed: ${SITE_ORIGIN}/api/catalog.json`,
    `api_feed: ${SITE_ORIGIN}/api/apis.json`,
    `topics_feed: ${SITE_ORIGIN}/api/topics.json`,
    `capabilities_feed: ${SITE_ORIGIN}/api/capabilities.json`,
    `collections_feed: ${SITE_ORIGIN}/api/collections.json`,
    `updates_feed: ${SITE_ORIGIN}/api/updates.json`,
    `search_index: ${SITE_ORIGIN}/search-index.json`,
    "",
    "overview:",
    "- saxi.ai aggregates public API repositories and normalizes them into a crawlable directory.",
    "- V1 focuses on public APIs for AI agents and developers.",
    "- Prefer canonical HTML pages for browsing and citation; use the JSON search index for machine-assisted filtering.",
    "",
    "key_pages:",
    `- Home: ${SITE_ORIGIN}/`,
    `- All APIs: ${SITE_ORIGIN}/apis/`,
    `- Categories: ${SITE_ORIGIN}/topic/`,
    `- Sections: ${SITE_ORIGIN}/category/`,
    `- Capabilities: ${SITE_ORIGIN}/capability/`,
    `- Collections: ${SITE_ORIGIN}/collections/`,
    `- Contact: ${SITE_ORIGIN}/contact/`,
    "",
    "top_categories:",
    ...topTopics,
    "",
    "top_capabilities:",
    ...topCapabilities,
    "",
    "collections:",
    ...collections,
    "",
    "machine_feeds:",
    `- Manifest: ${SITE_ORIGIN}/api/index.json`,
    `- Catalog: ${SITE_ORIGIN}/api/catalog.json`,
    `- APIs: ${SITE_ORIGIN}/api/apis.json`,
    `- Topics: ${SITE_ORIGIN}/api/topics.json`,
    `- Capabilities: ${SITE_ORIGIN}/api/capabilities.json`,
    `- Collections: ${SITE_ORIGIN}/api/collections.json`,
    `- Updates: ${SITE_ORIGIN}/api/updates.json`,
    "",
    "notes_for_agents:",
    "- These feeds are public, CORS-enabled, and do not require cookies, JS, or API keys.",
    "- Use /api/catalog.json for ingestion. It is compact enough for LLM fetch tools.",
    "- Use /api/apis.json only when you need the full snapshot.",
    "- Use /search-index.json for lightweight search only; it is optimized for the website UI.",
    "- Prefer docsUrl for execution and the static saxi.ai taxonomy pages for browsing and citation."
  ].join("\n");
}

export function renderLlmsTxt(site: SiteData): string {
  const collections = site.collections
    .slice(0, 8)
    .map((collection) => `- ${collection.title}: ${SITE_ORIGIN}/collections/${collection.slug}/`);

  return [
    `# ${SITE_NAME}`,
    "",
    "Public API directory for AI agents and developers.",
    "",
    "## Canonical HTML pages",
    `- Home: ${SITE_ORIGIN}/`,
    `- All APIs: ${SITE_ORIGIN}/apis/`,
    `- Categories: ${SITE_ORIGIN}/topic/`,
    `- Sections: ${SITE_ORIGIN}/category/`,
    `- Capabilities: ${SITE_ORIGIN}/capability/`,
    `- Collections: ${SITE_ORIGIN}/collections/`,
    "",
    "## Machine-readable feeds",
    `- Manifest: ${SITE_ORIGIN}/api/index.json`,
    `- Catalog: ${SITE_ORIGIN}/api/catalog.json`,
    `- APIs: ${SITE_ORIGIN}/api/apis.json`,
    `- Topics: ${SITE_ORIGIN}/api/topics.json`,
    `- Capabilities: ${SITE_ORIGIN}/api/capabilities.json`,
    `- Collections: ${SITE_ORIGIN}/api/collections.json`,
    `- Updates: ${SITE_ORIGIN}/api/updates.json`,
    `- Search Index: ${SITE_ORIGIN}/search-index.json`,
    "",
    "## Notes for agents",
    "- These feeds are public, CORS-enabled, and do not require cookies, JS, or API keys.",
    "- Fetch /api/catalog.json for ingestion. It is the compact catalog for LLM tools.",
    "- /api/apis.json is the full snapshot and is often too large for agent fetchers.",
    "- Use /search-index.json only for light search or ranking signals.",
    "- Prefer docsUrl when selecting execution targets.",
    "",
    "## Featured collections",
    ...collections
  ].join("\n");
}

export function renderSitemapXml(paths: string[], generatedAt: string): string {
  const lastmod = generatedAt.split("T")[0];
  const urls = paths
    .sort(compareStrings)
    .map(
      (path) => `<url>
  <loc>${SITE_ORIGIN}${path}</loc>
  <lastmod>${lastmod}</lastmod>
</url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function renderFaviconSvg(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none">
  <rect width="128" height="128" rx="28" fill="#08090a" />
  <path d="M40 88V40h20.5c11.8 0 19.5 6.4 19.5 16.2 0 6.8-3.8 12.1-10.2 14.4L86 88H72.4L57.8 70.6H52V88H40Zm12-28.6h7.6c5.2 0 8.4-2.7 8.4-6.8 0-4.2-3.2-6.7-8.4-6.7H52v13.5Z" fill="#f7f8f8" />
</svg>`;
}

export function renderSocialCardSvg(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
  <rect width="1200" height="630" fill="#08090a" />
  <rect x="72" y="72" width="1056" height="486" rx="16" fill="#121417" stroke="#ffffff14" />
  <text x="108" y="168" fill="#8b93c7" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="24">saxi.ai</text>
  <text x="108" y="268" fill="#f7f8f8" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="56">The API directory for</text>
  <text x="108" y="340" fill="#f7f8f8" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="56">agents and developers.</text>
  <text x="108" y="430" fill="#8a8f98" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="24">Free public APIs. Indexed, searchable, and ready to use.</text>
</svg>`;
}
