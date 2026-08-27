export const AGENT_SEARCH_DEFAULT_LIMIT = 20;
export const AGENT_SEARCH_MAX_LIMIT = 50;
export const AGENT_SEARCH_MAX_QUERY_LENGTH = 120;

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "api",
  "apis",
  "best",
  "find",
  "for",
  "free",
  "get",
  "in",
  "list",
  "of",
  "on",
  "or",
  "please",
  "public",
  "recommend",
  "recommended",
  "recommendations",
  "show",
  "some",
  "the",
  "to",
  "with"
]);

export interface SearchableApi {
  name: string;
  docsUrl: string;
  description: string;
  authType: string;
  hasOpenApi?: boolean;
  isOfficial?: boolean;
  section?: string;
  topics?: string[];
  capabilities?: string[];
}

export interface AgentSearchHit {
  name: string;
  docsUrl: string;
  description: string;
  authType: string;
}

export interface AgentSearchResult {
  query: string;
  tokens: string[];
  limit: number;
  matched: number;
  apis: AgentSearchHit[];
}

export function tokenizeSearchQuery(query: string): string[] {
  const tokens = query
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const meaningful = tokens.filter((token) => !STOPWORDS.has(token));
  return meaningful;
}

function scoreApi(api: SearchableApi, tokens: string[]): number {
  const name = api.name.toLowerCase();
  const description = api.description.toLowerCase();
  const section = (api.section ?? "").toLowerCase();
  const topics = (api.topics ?? []).map((topic) => topic.toLowerCase());
  const capabilities = (api.capabilities ?? []).map((capability) => capability.toLowerCase());
  const taxonomy = [section, ...topics, ...capabilities];

  let score = 0;

  for (const token of tokens) {
    if (name === token) {
      score += 80;
    } else if (name.split(/[^a-z0-9]+/).includes(token)) {
      score += 40;
    } else if (name.includes(token)) {
      score += 24;
    }

    if (capabilities.includes(token) || topics.includes(token) || section === token) {
      score += 28;
    } else if (taxonomy.some((value) => value.includes(token))) {
      score += 12;
    }

    if (description.includes(token)) {
      score += 6;
    }
  }

  if (score === 0) {
    return 0;
  }

  if (api.hasOpenApi) {
    score += 2;
  }
  if (api.isOfficial) {
    score += 1;
  }

  return score;
}

export function clampSearchLimit(value: number): number {
  if (!Number.isFinite(value)) {
    return AGENT_SEARCH_DEFAULT_LIMIT;
  }

  return Math.min(AGENT_SEARCH_MAX_LIMIT, Math.max(1, Math.trunc(value)));
}

export function searchApis(apis: SearchableApi[], query: string, limit = AGENT_SEARCH_DEFAULT_LIMIT): AgentSearchResult {
  const normalizedQuery = query.trim();
  const tokens = tokenizeSearchQuery(normalizedQuery);
  const clampedLimit = clampSearchLimit(limit);

  if (tokens.length === 0) {
    return {
      query: normalizedQuery,
      tokens,
      limit: clampedLimit,
      matched: 0,
      apis: []
    };
  }

  const scored = apis
    .map((api) => ({ api, score: scoreApi(api, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.api.name.localeCompare(right.api.name, "en", { sensitivity: "base" }));

  return {
    query: normalizedQuery,
    tokens,
    limit: clampedLimit,
    matched: scored.length,
    apis: scored.slice(0, clampedLimit).map((entry) => ({
      name: entry.api.name,
      docsUrl: entry.api.docsUrl,
      description: entry.api.description,
      authType: entry.api.authType
    }))
  };
}
