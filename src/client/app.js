const MAX_RENDERED_RESULTS = 120;
const REPORT_API_ISSUE_URL = "https://github.com/alexander-schneider/saxi.ai/issues/new";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createReportIssueBody(api) {
  const categories = api.categories || api.sourceCategories || [];
  const ignoreEntry = {
    id: api.id || "",
    name: api.name || "",
    docsUrl: api.docsUrl || "",
    reason: "user_reported_broken_or_outdated",
    checkedAt: new Date().toISOString()
  };

  return `<!-- Generated from saxi.ai report link. -->

## API listing

- ID: ${api.id || ""}
- Name: ${api.name || ""}
- Docs URL: ${api.docsUrl || ""}
- Website URL: ${api.websiteUrl || ""}
- Domain: ${api.domain || ""}
- Section: ${api.primaryCategory || ""}
- Categories: ${categories.join(", ")}

## Problem

This listing appears broken, outdated, unrelated, or points to the wrong target.

## Suggested removal code

If this report is valid, add this object to the \`entries\` array in \`data/api-ignore-list.json\`:

\`\`\`json
${JSON.stringify(ignoreEntry, null, 2)}
\`\`\`

## Reviewer checklist

- [ ] I checked the docs URL.
- [ ] The target is broken, unrelated, private, or no longer API documentation.
- [ ] I added the suggested ignore-list entry or removed the source/community entry.`;
}

function createReportIssueUrl(api, includeBody = true) {
  const params = new URLSearchParams({
    template: "report-api.md",
    title: `Report API listing: ${api.name || "Unknown API"}`
  });

  if (includeBody) {
    params.set("body", createReportIssueBody(api));
  }

  return `${REPORT_API_ISSUE_URL}?${params.toString()}`;
}

function reportDataAttributes(api) {
  return [
    `data-report-id="${escapeHtml(api.id || "")}"`,
    `data-report-name="${escapeHtml(api.name || "")}"`,
    `data-report-docs-url="${escapeHtml(api.docsUrl || "")}"`,
    `data-report-website-url="${escapeHtml(api.websiteUrl || "")}"`,
    `data-report-domain="${escapeHtml(api.domain || "")}"`,
    `data-report-section="${escapeHtml(api.primaryCategory || "")}"`,
    `data-report-categories="${escapeHtml((api.sourceCategories || []).join("|"))}"`
  ].join(" ");
}

function apiFromReportLink(link) {
  const categories = (link.dataset.reportCategories || "")
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    id: link.dataset.reportId || "",
    name: link.dataset.reportName || "",
    docsUrl: link.dataset.reportDocsUrl || "",
    websiteUrl: link.dataset.reportWebsiteUrl || "",
    domain: link.dataset.reportDomain || "",
    primaryCategory: link.dataset.reportSection || "",
    categories
  };
}

function hydrateReportLink(link) {
  link.href = createReportIssueUrl(apiFromReportLink(link));
}

function renderCard(api) {
  const capabilityBadges = api.capabilities
    .slice(0, 4)
    .map((capability) => `<span class="badge">${escapeHtml(capability)}</span>`)
    .join("");

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
    data-categories="${escapeHtml((api.sourceCategories || []).join("|"))}"
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
          ${capabilityBadges}
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
      href="${escapeHtml(createReportIssueUrl(api, false))}"
      target="_blank"
      rel="noreferrer"
      class="api-card-report"
      title="Report this API listing"
      aria-label="Report ${escapeHtml(api.name)} listing"
      data-report-api
      ${reportDataAttributes(api)}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
        <path d="M5 17V4.5M5 4.5H14.5L12.7 8L14.5 11.5H5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="sr-only">Report listing</span>
    </a>
  </article>`;
}

function getFieldValue(form, name) {
  const field = form.elements.namedItem(name);
  return field && typeof field.value === "string" ? field.value : "";
}

function hydrateSearchPage() {
  const form = document.querySelector("[data-filter-form]");
  const container = document.querySelector("[data-search-index]");
  const grid = container?.querySelector("[data-results-grid]");
  const count = document.querySelector("[data-results-count]");

  if (!(form instanceof HTMLFormElement) || !(container instanceof HTMLElement) || !(grid instanceof HTMLElement)) {
    return;
  }

  const indexPath = container.dataset.searchIndex;
  if (!indexPath) {
    return;
  }

  const params = new URLSearchParams(window.location.search);

  for (const [key, value] of params.entries()) {
    const field = form.elements.namedItem(key);
    if (field && "value" in field) {
      field.value = value;
    }
  }

  fetch(indexPath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch search index: ${response.status}`);
      }

      return response.json();
    })
    .then((payload) => {
      const allApis = Array.isArray(payload.apis) ? payload.apis : [];

      const updateQueryString = () => {
        const nextParams = new URLSearchParams();
        const formData = new FormData(form);

        for (const [key, value] of formData.entries()) {
          if (typeof value === "string" && value.trim().length > 0) {
            nextParams.set(key, value);
          }
        }

        const nextUrl = `${window.location.pathname}${nextParams.size > 0 ? `?${nextParams.toString()}` : ""}`;
        window.history.replaceState({}, "", nextUrl);
      };

      const renderResults = () => {
        const q = getFieldValue(form, "q").trim().toLowerCase();
        const category = getFieldValue(form, "category");
        const section = getFieldValue(form, "section");
        const capability = getFieldValue(form, "capability");
        const auth = getFieldValue(form, "auth");
        const official = getFieldValue(form, "official");
        const openapi = getFieldValue(form, "openapi");
        const sort = getFieldValue(form, "sort") || "relevance";

        const filtered = allApis.filter((api) => {
          const matchesQuery = q.length === 0 || api.searchText.includes(q);
          const matchesCategory = !category || (Array.isArray(api.sourceCategories) && api.sourceCategories.includes(category));
          const matchesSection = !section || api.primaryCategory === section;
          const matchesCapability = !capability || api.capabilities.includes(capability);
          const matchesAuth = !auth || api.authType === auth;
          const matchesOfficial =
            !official || (official === "yes" ? api.isOfficial === true : api.isOfficial === false);
          const matchesOpenApi =
            !openapi || (openapi === "yes" ? api.hasOpenApi === true : api.hasOpenApi === false);

          return (
            matchesQuery &&
            matchesCategory &&
            matchesSection &&
            matchesCapability &&
            matchesAuth &&
            matchesOfficial &&
            matchesOpenApi
          );
        });

        filtered.sort((left, right) => {
          if (sort === "alphabetical") {
            return left.name.localeCompare(right.name, "en", { sensitivity: "base" });
          }

          if (sort === "freshness") {
            return right.freshnessScore - left.freshnessScore || right.weight - left.weight;
          }

          return right.weight - left.weight || left.name.localeCompare(right.name, "en", { sensitivity: "base" });
        });

        const visible = filtered.slice(0, MAX_RENDERED_RESULTS);
        grid.innerHTML =
          visible.length > 0
            ? visible.map((api) => renderCard(api)).join("")
            : `<div class="glass-callout md:col-span-2 xl:col-span-3">
                No APIs match the current filters. Try clearing one or two constraints.
              </div>`;

        if (count) {
          count.textContent =
            filtered.length > MAX_RENDERED_RESULTS
              ? `${MAX_RENDERED_RESULTS} / ${filtered.length} APIs`
              : `${filtered.length} APIs`;
        }

        updateQueryString();
      };

      form.addEventListener("input", renderResults);
      form.addEventListener("change", renderResults);
      renderResults();
    })
    .catch((error) => {
      console.error(error);
    });
}

function hydrateReportLinks() {
  const updateLink = (event) => {
    const link = event.target instanceof Element ? event.target.closest("[data-report-api]") : null;
    if (link instanceof HTMLAnchorElement) {
      hydrateReportLink(link);
    }
  };

  document.addEventListener("pointerdown", updateLink);
  document.addEventListener("focusin", updateLink);
  document.addEventListener("click", updateLink);
}

hydrateSearchPage();
hydrateReportLinks();
hydrateThemeToggle();
hydrateLlmCopy();
hydrateMobileNav();

function hydrateLlmCopy() {
  const root = document.querySelector("[data-llm-copy]");
  if (!(root instanceof HTMLElement)) {
    return;
  }

  const input = root.querySelector(".header-llm-input");
  const button = root.querySelector("[data-llm-copy-button]");
  if (!(input instanceof HTMLInputElement) || !(button instanceof HTMLButtonElement)) {
    return;
  }

  const idleLabel = button.textContent || "Copy";
  let resetTimer = 0;

  const selectPrompt = () => {
    input.focus();
    input.select();
  };

  const markCopied = () => {
    button.dataset.copied = "true";
    button.textContent = "Copied";
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      button.dataset.copied = "false";
      button.textContent = idleLabel;
    }, 1600);
  };

  const copyPrompt = async () => {
    selectPrompt();
    try {
      await navigator.clipboard.writeText(input.value);
      markCopied();
    } catch {
      const copied = document.execCommand("copy");
      if (copied) {
        markCopied();
      }
    }
  };

  input.addEventListener("focus", selectPrompt);
  input.addEventListener("click", selectPrompt);
  button.addEventListener("click", () => {
    void copyPrompt();
  });
}

function currentTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(theme, persist) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "light" ? "#f7f8f8" : "#08090a");
  }
  if (persist) {
    try {
      localStorage.setItem("saxi-theme", theme);
    } catch {
      // ignore
    }
  }
  syncThemeToggle(theme);
}

function syncThemeToggle(theme) {
  const isLight = theme === "light";
  for (const button of document.querySelectorAll("[data-theme-toggle]")) {
    if (!(button instanceof HTMLButtonElement)) {
      continue;
    }
    button.setAttribute("aria-pressed", isLight ? "true" : "false");
    button.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
  }
}

function hydrateThemeToggle() {
  applyTheme(currentTheme(), false);
  for (const button of document.querySelectorAll("[data-theme-toggle]")) {
    if (button instanceof HTMLButtonElement) {
      button.addEventListener("click", () => {
        applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
      });
    }
  }
}

function hydrateMobileNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-site-nav]");
  const backdrop = document.querySelector("[data-nav-backdrop]");
  const main = document.querySelector(".site-main");
  if (!(toggle instanceof HTMLButtonElement) || !(nav instanceof HTMLElement)) {
    return;
  }

  const desktopQuery = window.matchMedia("(min-width: 80rem)");
  let lastFocus = null;

  const getFocusable = () => {
    const nodes = [toggle, ...nav.querySelectorAll("a[href], button:not([disabled]), input, select, textarea")];
    return nodes.filter((node) => node instanceof HTMLElement && !node.hasAttribute("disabled"));
  };

  const setOpen = (open) => {
    const isDesktop = desktopQuery.matches;
    if (isDesktop) {
      open = false;
    }

    document.documentElement.toggleAttribute("data-nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.inert = isDesktop ? false : !open;
    if (backdrop instanceof HTMLElement) {
      backdrop.hidden = !open;
    }
    if (main instanceof HTMLElement) {
      main.inert = open;
    }

    if (open) {
      lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
      nav.focus({ preventScroll: true });
      return;
    }

    if (lastFocus) {
      lastFocus.focus({ preventScroll: true });
      lastFocus = null;
    }
  };

  toggle.addEventListener("click", () => {
    setOpen(!document.documentElement.hasAttribute("data-nav-open"));
  });

  if (backdrop instanceof HTMLElement) {
    backdrop.addEventListener("click", () => setOpen(false));
  }

  nav.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (link) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!document.documentElement.hasAttribute("data-nav-open")) {
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key !== "Tab") {
      return;
    }
    const focusable = getFocusable();
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  desktopQuery.addEventListener("change", () => setOpen(false));
  setOpen(false);
}
