import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { PAGE_SIZE } from "./constants.js";
import { applyIgnoreList, loadIgnoreList } from "./ignore-list.js";
import { buildSiteData, normalizeRecords } from "./normalize.js";
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
  renderNotFoundPage,
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
import { materializeScreenshots } from "./screenshots.js";
import { loadSourceRecords } from "./sources.js";
import { chunk } from "./utils.js";

async function writeOutputFile(relativePath: string, content: string): Promise<void> {
  const targetPath = join("dist", relativePath);
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, content, "utf8");
}

async function buildSite(): Promise<void> {
  const generatedAt = new Date().toISOString();
  const sourceRecords = await loadSourceRecords();
  const ignoreList = await loadIgnoreList();
  const normalized = applyIgnoreList(normalizeRecords(sourceRecords), ignoreList);
  const apisWithScreenshots = await materializeScreenshots(normalized);
  const site = buildSiteData(apisWithScreenshots, generatedAt);
  const sitemapPaths = new Set<string>(["/", "/apis/", "/topic/", "/category/", "/capability/", "/collections/", "/contact/"]);

  await writeOutputFile("index.html", renderHomePage(site));
  await writeOutputFile("apis/index.html", renderApisLandingPage(site, { currentPage: 1, totalPages: Math.ceil(site.apis.length / PAGE_SIZE), basePath: "/apis/" }));
  await writeOutputFile("topic/index.html", renderTaxonomyIndexPage(
    site,
    "Categories",
    "Browse APIs by category.",
    "/topic/",
    site.topics.map((topic) => ({
      href: `/topic/${topic.slug}/`,
      title: topic.title,
      description: topic.description,
      count: topic.count
    }))
  ));
  await writeOutputFile("category/index.html", renderTaxonomyIndexPage(
    site,
    "Sections",
    "Browse free APIs by domain.",
    "/category/",
    site.categories.map((category) => ({
      href: `/category/${category.slug}/`,
      title: category.title,
      description: category.description,
      count: category.count
    }))
  ));
  await writeOutputFile("capability/index.html", renderTaxonomyIndexPage(
    site,
    "Capabilities",
    "Browse APIs by what they do.",
    "/capability/",
    site.capabilities.map((capability) => ({
      href: `/capability/${capability.slug}/`,
      title: capability.title,
      description: capability.description,
      count: capability.count
    }))
  ));
  await writeOutputFile("collections/index.html", renderTaxonomyIndexPage(
    site,
    "Collections",
    "Browse APIs grouped by workflow.",
    "/collections/",
    site.collections.map((collection) => ({
      href: `/collections/${collection.slug}/`,
      title: collection.title,
      description: collection.description,
      count: collection.apis.length
    }))
  ));
  await writeOutputFile("add-api/index.html", renderAddApiPage(site));
  await writeOutputFile("contact/index.html", renderContactPage(site));
  await writeOutputFile("404.html", renderNotFoundPage());
  await writeOutputFile("favicon.svg", renderFaviconSvg());
  await writeOutputFile("social-card.svg", renderSocialCardSvg());
  await writeOutputFile("llm.txt", renderLlmTxt(site));
  await writeOutputFile("llms.txt", renderLlmsTxt(site));
  await writeOutputFile("robots.txt", renderRobotsTxt());
  await writeOutputFile("search-index.json", renderSearchIndex(site));
  await writeOutputFile("api/index.json", renderApiManifest(site));
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
    await writeOutputFile(path, renderApisArchivePage(site, apis, { currentPage, totalPages, basePath: "/apis/" }));
    sitemapPaths.add(`/apis/page/${currentPage}/`);
  }

  for (const category of site.categories) {
    const path = `category/${category.slug}/index.html`;
    await writeOutputFile(path, renderCategoryPage(site, category));
    sitemapPaths.add(`/category/${category.slug}/`);
  }

  for (const topic of site.topics) {
    const path = `topic/${topic.slug}/index.html`;
    await writeOutputFile(path, renderTopicPage(site, topic));
    sitemapPaths.add(`/topic/${topic.slug}/`);
  }

  for (const capability of site.capabilities) {
    const path = `capability/${capability.slug}/index.html`;
    await writeOutputFile(path, renderCapabilityPage(site, capability));
    sitemapPaths.add(`/capability/${capability.slug}/`);
  }

  for (const collection of site.collections) {
    const path = `collections/${collection.slug}/index.html`;
    await writeOutputFile(path, renderCollectionPage(site, collection));
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
