import type { SearchableApi } from "./agent-search.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function isCatalogSlug(value: string): boolean {
  return /^[a-z0-9-]+$/.test(value);
}

function parseCatalogApis(payload: unknown): SearchableApi[] | null {
  if (!isRecord(payload) || !Array.isArray(payload.apis)) {
    return null;
  }

  const apis: SearchableApi[] = [];
  for (const entry of payload.apis) {
    if (!isRecord(entry)) {
      continue;
    }
    if (
      typeof entry.name !== "string" ||
      typeof entry.docsUrl !== "string" ||
      typeof entry.description !== "string" ||
      typeof entry.authType !== "string"
    ) {
      continue;
    }

    const api: SearchableApi = {
      name: entry.name,
      docsUrl: entry.docsUrl,
      description: entry.description,
      hasOpenApi: entry.hasOpenApi === true,
      isOfficial: entry.isOfficial === true,
      topics: stringArray(entry.topics),
      capabilities: stringArray(entry.capabilities),
      authType: entry.authType
    };
    if (typeof entry.section === "string") {
      api.section = entry.section;
    }
    apis.push(api);
  }

  return apis;
}

export interface CatalogSliceRef {
  slug: string;
  title: string;
  count: number;
  json: string;
}

export interface CatalogSliceIndex {
  capabilities: CatalogSliceRef[];
  topics: CatalogSliceRef[];
}

function parseSliceRefs(value: unknown): CatalogSliceRef[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const refs: CatalogSliceRef[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }
    if (
      typeof entry.slug !== "string" ||
      typeof entry.title !== "string" ||
      typeof entry.count !== "number" ||
      typeof entry.json !== "string"
    ) {
      continue;
    }
    refs.push({
      slug: entry.slug,
      title: entry.title,
      count: entry.count,
      json: entry.json
    });
  }
  return refs;
}

function parseSliceIndex(payload: unknown): CatalogSliceIndex | null {
  if (!isRecord(payload)) {
    return null;
  }

  return {
    capabilities: parseSliceRefs(payload.capabilities),
    topics: parseSliceRefs(payload.topics)
  };
}

let catalogApisCache: SearchableApi[] | null = null;
let sliceIndexCache: CatalogSliceIndex | null = null;

async function loadJson(env: Env, origin: string, pathname: string): Promise<unknown | null> {
  const response = await env.ASSETS.fetch(new Request(new URL(pathname, origin), { method: "GET" }));
  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function loadCatalogApis(env: Env, origin: string): Promise<SearchableApi[] | null> {
  if (catalogApisCache) {
    return catalogApisCache;
  }

  const payload = await loadJson(env, origin, "/api/catalog.json");
  const apis = parseCatalogApis(payload);
  if (!apis) {
    return null;
  }

  catalogApisCache = apis;
  return catalogApisCache;
}

export async function loadCatalogSliceIndex(env: Env, origin: string): Promise<CatalogSliceIndex | null> {
  if (sliceIndexCache) {
    return sliceIndexCache;
  }

  const payload = await loadJson(env, origin, "/api/catalog/index.json");
  const index = parseSliceIndex(payload);
  if (!index) {
    return null;
  }

  sliceIndexCache = index;
  return sliceIndexCache;
}

export async function loadCatalogSlice(
  env: Env,
  origin: string,
  kind: "capability" | "topic",
  slug: string
): Promise<unknown | null> {
  if (!isCatalogSlug(slug)) {
    return null;
  }

  const pathname = kind === "capability" ? `/api/catalog/${slug}.json` : `/api/catalog/topic/${slug}.json`;
  return loadJson(env, origin, pathname);
}
