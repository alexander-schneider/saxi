import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { PAGE_SIZE } from "./constants.js";
import { applyIgnoreList, loadIgnoreList } from "./ignore-list.js";
import { buildSiteData, normalizeRecords } from "./normalize.js";
import {
  renderAddApiMarkdown,
  renderApisArchiveMarkdown,
  renderApisLandingMarkdown,
  renderCapabilityMarkdown,
  renderCategoryMarkdown,
  renderCollectionMarkdown,
  renderContactMarkdown,
  renderHomeMarkdown,
  renderNotFoundMarkdown,
  renderTaxonomyIndexMarkdown,
  renderTopicMarkdown
} from "./markdown.js";
import {
  renderAddApiPage,
  renderApisArchivePage,
  renderApisLandingPage,
  renderApiManifest,
  renderCapabilityPage,
  renderCategoryPage,
  renderCollectionPage,
  renderContactPage,
  renderFaviconSvg,
  renderHomePage,
  renderLlmTxt,
  renderLlmsTxt,
  renderMcpDiscovery,
  renderNotFoundPage,
  renderAgentCatalog,
  renderCatalogSlice,
  renderCatalogSliceIndex,
  renderPublicApis,
  renderPublicCapabilities,
  renderPublicCollections,
  renderPublicTopics,
  renderPublicUpdates,
  renderRobotsTxt,
  renderSearchIndex,
  renderSitemapXml,
  renderSocialCardSvg,
  renderTopicPage,
  renderTaxonomyIndexPage
} from "./render.js";
import { SOCIAL_CARD_PATH } from "./social-card.js";
import { materializeScreenshots } from "./screenshots.js";
import { loadSourceRecords } from "./sources.js";
import { chunk } from "./utils.js";

async function writeOutputFile(relativePath: string, content: string): Promise<void> {
  const targetPath = join("dist", relativePath);
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, content, "utf8");
}

function markdownPathFromHtml(htmlRelativePath: string): string {
  if (htmlRelativePath.endsWith("index.html")) {
    return `${htmlRelativePath.slice(0, -"index.html".length)}index.md`;
  }
  if (htmlRelativePath.endsWith(".html")) {
    return `${htmlRelativePath.slice(0, -".html".length)}.md`;
  }
  throw new Error(`Not an HTML path: ${htmlRelativePath}`);
}

async function writeHtmlPage(htmlRelativePath: string, html: string, markdown: string): Promise<void> {
  await writeOutputFile(htmlRelativePath, html);
  await writeOutputFile(markdownPathFromHtml(htmlRelativePath), markdown);
}

async function copyOutputFile(sourcePath: string, relativePath: string): Promise<void> {
  const targetPath = join("dist", relativePath);
  await mkdir(dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);
}

async function buildSite(): Promise<void> {
  const generatedAt = new Date().toISOString();
  const sourceRecords = await loadSourceRecords();
  const ignoreList = await loadIgnoreList();
  const normalized = applyIgnoreList(normalizeRecords(sourceRecords), ignoreList);
  const apisWithScreenshots = await materializeScreenshots(normalized);
  const site = buildSiteData(apisWithScreenshots, generatedAt);
  const sitemapPaths = new Set<string>(["/", "/apis/", "/topic/", "/category/", "/capability/", "/collections/", "/contact/"]);

  const apisLandingPager = { currentPage: 1, totalPages: Math.ceil(site.apis.length / PAGE_SIZE), basePath: "/apis/" };
  const topicIndexItems = site.topics.map((topic) => ({
    href: `/topic/${topic.slug}/`,
    title: topic.title,
    description: topic.description,
    count: topic.count
  }));
  const categoryIndexItems = site.categories.map((category) => ({
    href: `/category/${category.slug}/`,
    title: category.title,
    description: category.description,
    count: category.count
  }));
  const capabilityIndexItems = site.capabilities.map((capability) => ({
    href: `/capability/${capability.slug}/`,
    title: capability.title,
    description: capability.description,
    count: capability.count
  }));
  const collectionIndexItems = site.collections.map((collection) => ({
    href: `/collections/${collection.slug}/`,
    title: collection.title,
    description: collection.description,
    count: collection.apis.length
  }));

  await writeHtmlPage("index.html", renderHomePage(site), renderHomeMarkdown(site));
  await writeHtmlPage(
    "apis/index.html",
    renderApisLandingPage(site, apisLandingPager),
    renderApisLandingMarkdown(site, apisLandingPager)
  );
  await writeHtmlPage(
    "topic/index.html",
    renderTaxonomyIndexPage(site, "Categories", "Browse APIs by category.", "/topic/", topicIndexItems),
    renderTaxonomyIndexMarkdown("Categories", "Browse APIs by category.", "/topic/", topicIndexItems)
  );
  await writeHtmlPage(
    "category/index.html",
    renderTaxonomyIndexPage(site, "Sections", "Browse free APIs by domain.", "/category/", categoryIndexItems),
    renderTaxonomyIndexMarkdown("Sections", "Browse free APIs by domain.", "/category/", categoryIndexItems)
  );
  await writeHtmlPage(
    "capability/index.html",
    renderTaxonomyIndexPage(site, "Capabilities", "Browse APIs by what they do.", "/capability/", capabilityIndexItems),
    renderTaxonomyIndexMarkdown("Capabilities", "Browse APIs by what they do.", "/capability/", capabilityIndexItems)
  );
  await writeHtmlPage(
    "collections/index.html",
    renderTaxonomyIndexPage(site, "Collections", "Browse APIs grouped by workflow.", "/collections/", collectionIndexItems),
    renderTaxonomyIndexMarkdown("Collections", "Browse APIs grouped by workflow.", "/collections/", collectionIndexItems)
  );
  await writeHtmlPage("add-api/index.html", renderAddApiPage(site), renderAddApiMarkdown());
  await writeHtmlPage("contact/index.html", renderContactPage(site), renderContactMarkdown());
  await writeHtmlPage("404.html", renderNotFoundPage(), renderNotFoundMarkdown());
  await writeOutputFile("favicon.svg", renderFaviconSvg());
  await writeOutputFile("social-card.svg", renderSocialCardSvg());
  await copyOutputFile("src/assets/social-card.png", SOCIAL_CARD_PATH.slice(1));
  await writeOutputFile("llm.txt", renderLlmTxt(site));
  await writeOutputFile("llms.txt", renderLlmsTxt(site));
  await writeOutputFile(".well-known/mcp.json", renderMcpDiscovery());
  await writeOutputFile("robots.txt", renderRobotsTxt());
  await writeOutputFile("search-index.json", renderSearchIndex(site));
  await writeOutputFile("api/index.json", renderApiManifest(site));
  await writeOutputFile("api/catalog.json", renderAgentCatalog(site));
  await writeOutputFile("api/catalog/index.json", renderCatalogSliceIndex(site));
  await writeOutputFile("api/apis.json", renderPublicApis(site));
  await writeOutputFile("api/topics.json", renderPublicTopics(site));
  await writeOutputFile("api/capabilities.json", renderPublicCapabilities(site));
  await writeOutputFile("api/collections.json", renderPublicCollections(site));
  await writeOutputFile("api/updates.json", renderPublicUpdates(site));

  const archivePages = chunk(site.apis, PAGE_SIZE);
  for (const [index, apis] of archivePages.entries()) {
    const currentPage = index + 1;
    const totalPages = archivePages.length;
    if (currentPage === 1) {
      continue;
    }

    const path = `apis/page/${currentPage}/index.html`;
    const pager = { currentPage, totalPages, basePath: "/apis/" };
    await writeHtmlPage(path, renderApisArchivePage(site, apis, pager), renderApisArchiveMarkdown(apis, pager));
    sitemapPaths.add(`/apis/page/${currentPage}/`);
  }

  for (const category of site.categories) {
    const path = `category/${category.slug}/index.html`;
    await writeHtmlPage(path, renderCategoryPage(site, category), renderCategoryMarkdown(category));
    sitemapPaths.add(`/category/${category.slug}/`);
  }

  for (const topic of site.topics) {
    const path = `topic/${topic.slug}/index.html`;
    await writeHtmlPage(path, renderTopicPage(site, topic), renderTopicMarkdown(topic));
    await writeOutputFile(`api/catalog/topic/${topic.slug}.json`, renderCatalogSlice("topic", topic, generatedAt));
    sitemapPaths.add(`/topic/${topic.slug}/`);
  }

  for (const capability of site.capabilities) {
    if (capability.slug === "index" || capability.slug === "topic") {
      throw new Error(`Reserved catalog slice slug: ${capability.slug}`);
    }

    const path = `capability/${capability.slug}/index.html`;
    await writeHtmlPage(path, renderCapabilityPage(site, capability), renderCapabilityMarkdown(capability));
    await writeOutputFile(`api/catalog/${capability.slug}.json`, renderCatalogSlice("capability", capability, generatedAt));
    sitemapPaths.add(`/capability/${capability.slug}/`);
  }

  for (const collection of site.collections) {
    const path = `collections/${collection.slug}/index.html`;
    await writeHtmlPage(path, renderCollectionPage(site, collection), renderCollectionMarkdown(collection));
    sitemapPaths.add(`/collections/${collection.slug}/`);
  }

  await writeOutputFile("sitemap.xml", renderSitemapXml([...sitemapPaths], generatedAt));

  console.log(
    JSON.stringify(
      {
        generatedAt,
        sourceRecords: sourceRecords.length,
        apis: site.apis.length,
        categories: site.categories.length,
        topics: site.topics.length,
        capabilities: site.capabilities.length,
        collections: site.collections.length
      },
      null,
      2
    )
  );
}

await buildSite();
