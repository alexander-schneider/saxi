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
  SITE_TAGLINE
} from "./constants.js";
import { SOCIAL_CARD_PATH } from "./social-card.js";
import type { ApiEntry, CollectionPage, SiteData, TaxonomyPage } from "./types.js";

interface MarkdownPage {
  title: string;
  description: string;
  body: string;
  structuredData?: unknown[];
}

interface PagerState {
  currentPage: number;
  totalPages: number;
}

function yamlScalar(value: string): string {
  return JSON.stringify(value);
}

function escapeLinkText(value: string): string {
  return value.replaceAll("[", "\\[").replaceAll("]", "\\]");
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

function collectionPageSchema(name: string, description: string, path: string): unknown {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: `${SITE_ORIGIN}${path}`
  };
}

function renderMarkdownDocument(page: MarkdownPage): string {
  const frontmatter = [
    "---",
    `title: ${yamlScalar(page.title)}`,
    `description: ${yamlScalar(page.description)}`,
    `image: ${yamlScalar(`${SITE_ORIGIN}${SOCIAL_CARD_PATH}`)}`,
    "---",
    ""
  ].join("\n");

  const jsonLd =
    page.structuredData && page.structuredData.length > 0
      ? `\n\n\`\`\`json\n${page.structuredData.map((entry) => JSON.stringify(entry)).join("\n")}\n\`\`\`\n`
      : "\n";

  return `${frontmatter}${page.body.trim()}${jsonLd}`;
}

function apiListItem(api: ApiEntry): string {
  const flags = [api.authType];
  if (api.hasOpenApi) {
    flags.push("OpenAPI");
  }
  const description = api.description.replaceAll("\n", " ").trim();
  return `- [${escapeLinkText(api.name)}](${api.docsUrl}) — ${description} (${flags.join(", ")})`;
}

function apiList(apis: ApiEntry[]): string {
  return apis.map(apiListItem).join("\n");
}

function taxonomyIndexList(
  items: Array<{ href: string; title: string; description: string; count: number }>
): string {
  return items
    .map(
      (item) =>
        `- [${escapeLinkText(item.title)}](${SITE_ORIGIN}${item.href}) — ${item.description} (${item.count} APIs)`
    )
    .join("\n");
}

function taxonomyBody(item: TaxonomyPage | CollectionPage, heading: string): string {
  const editorial = item.editorialSections.map((paragraph) => paragraph.trim()).filter(Boolean);
  return [
    `# ${heading}`,
    "",
    item.description,
    "",
    item.intro,
    ...(editorial.length > 0 ? ["", ...editorial] : []),
    "",
    `## APIs (${item.apis.length})`,
    "",
    apiList(item.apis)
  ].join("\n");
}

export function renderHomeMarkdown(site: SiteData): string {
  const featured = site.featuredApis.slice(0, 9);
  const newest = site.newestApis.slice(0, 6);
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

  return renderMarkdownDocument({
    title: "Public API Directory for AI Agents and Developers",
    description:
      "Browse public APIs across AI, browser automation, search, speech, developer tools, messaging, maps, and infrastructure.",
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
        image: `${SITE_ORIGIN}${SOCIAL_CARD_PATH}`,
        logo: `${SITE_ORIGIN}/favicon.svg`,
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
        numberOfItems: featured.length,
        itemListElement: featured.map((api, index) => ({
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
        numberOfItems: newest.length,
        itemListElement: newest.map((api, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: api.name,
          url: api.docsUrl
        }))
      }
    ],
    body: [
      `# ${SITE_TAGLINE}`,
      "",
      "Discover free APIs across AI, search, browser automation, developer tools, messaging, maps, payments, and infrastructure.",
      "",
      `${site.apis.length} free APIs. ${site.topics.length} categories. Open data.`,
      "",
      "Send `Accept: text/markdown` to any HTML page on this site to receive this chrome-free representation. To recommend APIs, use MCP at https://saxi.ai/mcp or GET https://saxi.ai/api/search.json?q=YOUR_QUERY. Capability slices such as https://saxi.ai/api/catalog/geocoding.json are small enough for any fetcher.",
      "",
      newest.length > 0 ? "## Newest APIs\n" : "",
      newest.length > 0 ? apiList(newest) : "",
      newest.length > 0 ? "" : "",
      "## Featured APIs",
      "",
      apiList(featured),
      "",
      "## Collections",
      "",
      taxonomyIndexList(collectionTiles),
      "",
      "## Top Capabilities",
      "",
      taxonomyIndexList(capabilityTiles),
      "",
      "## Machine feeds",
      "",
      `- MCP: ${SITE_ORIGIN}/mcp`,
      `- MCP server card: ${SITE_ORIGIN}/.well-known/mcp/server-card.json`,
      `- Search: ${SITE_ORIGIN}/api/search.json?q=weather`,
      `- Catalog slices: ${SITE_ORIGIN}/api/catalog/index.json`,
      `- Catalog: ${SITE_ORIGIN}/api/catalog.json`,
      `- Manifest: ${SITE_ORIGIN}/api/index.json`,
      `- llms.txt: ${SITE_ORIGIN}/llms.txt`
    ]
      .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
      .join("\n")
  });
}

export function renderApisLandingMarkdown(site: SiteData, pager: PagerState): string {
  const preview = site.apis.slice(0, PAGE_SIZE);
  return renderMarkdownDocument({
    title: "All APIs",
    description: "Search and filter the saxi.ai directory of public APIs for AI agents and developers.",
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: "/apis/", label: "All APIs" }
      ]),
      collectionPageSchema(
        "All APIs",
        "Search and filter the saxi.ai directory of public APIs for AI agents and developers.",
        "/apis/"
      )
    ],
    body: [
      "# All APIs",
      "",
      "Filter by category, capability, auth type, or search. Every API links directly to its documentation.",
      "",
      `${site.apis.length} APIs in the directory. Search with ${SITE_ORIGIN}/api/search.json?q= or browse capability slices via ${SITE_ORIGIN}/api/catalog/index.json.`,
      "",
      `## First ${preview.length} APIs`,
      "",
      apiList(preview),
      "",
      pager.totalPages > 1
        ? `Further archive pages: ${SITE_ORIGIN}/apis/page/2/ through ${SITE_ORIGIN}/apis/page/${pager.totalPages}/. Send \`Accept: text/markdown\` to those URLs as well.`
        : ""
    ].join("\n")
  });
}

export function renderApisArchiveMarkdown(apis: ApiEntry[], pager: PagerState): string {
  const path = pager.currentPage === 1 ? "/apis/" : `/apis/page/${pager.currentPage}/`;
  const title = pager.currentPage === 1 ? "All APIs" : `All APIs - Page ${pager.currentPage}`;
  return renderMarkdownDocument({
    title,
    description: "Browse the crawlable archive of public APIs for AI agents and developers.",
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: "/apis/", label: "All APIs" }
      ])
    ],
    body: [
      `# ${pager.currentPage === 1 ? "All APIs" : `All APIs — page ${pager.currentPage}`}`,
      "",
      "The complete list of public APIs in the directory. Prefer https://saxi.ai/api/search.json?q= or a capability slice from https://saxi.ai/api/catalog/index.json.",
      "",
      apiList(apis)
    ].join("\n")
  });
}

export function renderTaxonomyIndexMarkdown(
  title: string,
  description: string,
  path: string,
  items: Array<{ href: string; title: string; description: string; count: number }>
): string {
  return renderMarkdownDocument({
    title,
    description,
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: path, label: title }
      ]),
      collectionPageSchema(title, description, path)
    ],
    body: [`# ${title}`, "", description, "", taxonomyIndexList(items)].join("\n")
  });
}

export function renderTopicMarkdown(topic: TaxonomyPage): string {
  const path = `/topic/${topic.slug}/`;
  const title = `${topic.title} APIs`;
  return renderMarkdownDocument({
    title,
    description: topic.description,
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: "/topic/", label: "Categories" },
        { href: path, label: title }
      ]),
      collectionPageSchema(title, topic.description, path)
    ],
    body: taxonomyBody(topic, title)
  });
}

export function renderCategoryMarkdown(category: TaxonomyPage): string {
  const path = `/category/${category.slug}/`;
  const title = `${category.title} APIs`;
  return renderMarkdownDocument({
    title,
    description: category.description,
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: "/category/", label: "Sections" },
        { href: path, label: title }
      ]),
      collectionPageSchema(title, category.description, path)
    ],
    body: taxonomyBody(category, title)
  });
}

export function renderCapabilityMarkdown(capability: TaxonomyPage): string {
  const path = `/capability/${capability.slug}/`;
  const title = `${capability.title} APIs`;
  return renderMarkdownDocument({
    title,
    description: capability.description,
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: "/capability/", label: "Capabilities" },
        { href: path, label: title }
      ]),
      collectionPageSchema(title, capability.description, path)
    ],
    body: taxonomyBody(capability, title)
  });
}

export function renderCollectionMarkdown(collection: CollectionPage): string {
  const path = `/collections/${collection.slug}/`;
  return renderMarkdownDocument({
    title: collection.title,
    description: collection.description,
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: "/collections/", label: "Collections" },
        { href: path, label: collection.title }
      ]),
      collectionPageSchema(collection.title, collection.description, path)
    ],
    body: taxonomyBody(collection, collection.title)
  });
}

export function renderAddApiMarkdown(): string {
  return renderMarkdownDocument({
    title: "Add your API",
    description: "How to submit a public API to saxi.ai through GitHub pull requests.",
    structuredData: [
      breadcrumbSchema([
        { href: "/", label: "Home" },
        { href: "/add-api/", label: "Add your API" }
      ])
    ],
    body: [
      "# Add your API",
      "",
      "saxi.ai accepts public APIs through GitHub pull requests. Add a JSON file under [`data/community-apis`](https://github.com/alexander-schneider/saxi.ai/tree/main/data/community-apis), then open a pull request.",
      "",
      "Submission rules: https://github.com/alexander-schneider/saxi.ai/blob/main/data/community-apis/README.md",
      "",
      "## Before opening the PR",
      "",
      "- Rename the file to lowercase kebab-case, for example `my-example-api.json`.",
      "- Replace every placeholder value, especially `Example API` and `example.com`.",
      "- Use 1-3 categories copied from the allowed category list.",
      "- Submit only APIs with public docs and accurate availability metadata."
    ].join("\n")
  });
}

export function renderContactMarkdown(): string {
  return renderMarkdownDocument({
    title: "Contact & Imprint",
    description: "Contact and legal company information for the saxi.ai project.",
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
    body: [
      "# Contact & Imprint",
      "",
      "saxi.ai is operated by Adanos Software GmbH. Reach out for corrections, broken links, partnership requests, or legal inquiries.",
      "",
      "## Primary contact",
      "",
      `- Email: ${CONTACT_EMAIL}`,
      `- Phone: ${CONTACT_PHONE_LABEL} (business line only; no product support by phone)`,
      "",
      "## Company",
      "",
      COMPANY_NAME,
      COMPANY_STREET,
      COMPANY_POSTAL,
      COMPANY_COUNTRY,
      "",
      `- Managing Director: ${COMPANY_MANAGING_DIRECTOR}`,
      `- Responsible for content: ${COMPANY_MANAGING_DIRECTOR}`,
      "",
      "## Legal company details",
      "",
      `- Registered at: ${COMPANY_REGISTER_COURT}`,
      `- Registration number: ${COMPANY_REGISTER_NUMBER}`,
      `- VAT ID: ${COMPANY_VAT_ID}`,
      "",
      "## Consumer arbitration",
      "",
      "Adanos Software GmbH does not participate in consumer arbitration proceedings and is not obliged to do so.",
      "",
      "EU online dispute resolution platform: https://ec.europa.eu/consumers/odr"
    ].join("\n")
  });
}

export function renderNotFoundMarkdown(): string {
  return renderMarkdownDocument({
    title: "Page not found",
    description: "The page you requested does not exist in the saxi.ai directory.",
    body: [
      "# This route does not exist.",
      "",
      "Use the directory homepage or the full API search to get back to a valid section of saxi.ai.",
      "",
      `- Home: ${SITE_ORIGIN}/`,
      `- All APIs: ${SITE_ORIGIN}/apis/`
    ].join("\n")
  });
}
