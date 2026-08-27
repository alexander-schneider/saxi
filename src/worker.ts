import {
  AGENT_SEARCH_DEFAULT_LIMIT,
  AGENT_SEARCH_MAX_QUERY_LENGTH,
  clampSearchLimit,
  searchApis
} from "./agent-search.js";
import { loadCatalogApis } from "./catalog-feed.js";
import { handleSaxiMcp } from "./mcp.js";

const MACHINE_FEED_PATHS = new Set([
  "/llms.txt",
  "/llm.txt",
  "/robots.txt",
  "/search-index.json",
  "/.well-known/mcp.json"
]);

const MARKDOWN_SKIP_PATHS = new Set([
  "/health",
  "/favicon.ico",
  "/favicon.svg",
  "/sitemap.xml",
  "/social-card.png",
  "/social-card.svg",
  "/llms.txt",
  "/llm.txt",
  "/robots.txt",
  "/search-index.json"
]);

function isMcpPath(pathname: string): boolean {
  return pathname === "/mcp" || pathname.startsWith("/mcp/");
}

function isMachineFeed(pathname: string): boolean {
  return MACHINE_FEED_PATHS.has(pathname) || pathname.startsWith("/api/") || isMcpPath(pathname);
}

function corsHeaders(): Headers {
  return new Headers({
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, HEAD, OPTIONS",
    "access-control-allow-headers": "*",
    "access-control-expose-headers": "x-markdown-tokens, content-signal",
    "access-control-max-age": "86400",
    "cross-origin-resource-policy": "cross-origin"
  });
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of corsHeaders()) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function appendVary(headers: Headers, value: string): void {
  const existing = headers.get("vary");
  if (!existing) {
    headers.set("vary", value);
    return;
  }

  const alreadyListed = existing
    .split(",")
    .some((part) => part.trim().toLowerCase() === value.toLowerCase());
  if (!alreadyListed) {
    headers.set("vary", `${existing}, ${value}`);
  }
}

function withAcceptVary(response: Response): Response {
  const headers = new Headers(response.headers);
  appendVary(headers, "Accept");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...init?.headers
    }
  });
}

function jsonFeed(body: unknown, status = 200, cacheControl = "public, max-age=3600"): Response {
  const headers = corsHeaders();
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", cacheControl);
  return new Response(JSON.stringify(body), { status, headers });
}

async function agentSearchResponse(env: Env, requestUrl: URL, method: string): Promise<Response> {
  const query = requestUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return jsonFeed(
      {
        error: "Missing query parameter q",
        usage: "GET /api/search.json?q=weather"
      },
      400,
      "no-store"
    );
  }
  if (query.length > AGENT_SEARCH_MAX_QUERY_LENGTH) {
    return jsonFeed(
      {
        error: `Query exceeds ${AGENT_SEARCH_MAX_QUERY_LENGTH} characters`
      },
      400,
      "no-store"
    );
  }

  const limitParam = requestUrl.searchParams.get("limit");
  const limit = limitParam
    ? clampSearchLimit(Number.parseInt(limitParam, 10))
    : AGENT_SEARCH_DEFAULT_LIMIT;

  const apis = await loadCatalogApis(env, requestUrl.origin);
  if (!apis) {
    return jsonFeed({ error: "Catalog is unavailable" }, 503, "no-store");
  }

  const result = searchApis(apis, query, limit);
  const body = {
    schemaVersion: "1.0",
    query: result.query,
    limit: result.limit,
    total: apis.length,
    matched: result.matched,
    apis: result.apis
  };

  if (method === "HEAD") {
    const headers = corsHeaders();
    headers.set("content-type", "application/json; charset=utf-8");
    headers.set("cache-control", "public, max-age=3600");
    return new Response(null, { status: 200, headers });
  }

  return jsonFeed(body);
}

function redirectToCanonical(url: URL, status = 308): Response {
  const target = new URL(url.toString());
  target.protocol = "https:";
  target.hostname = "saxi.ai";
  target.port = "";
  return Response.redirect(target.toString(), status);
}

function redirectToPath(url: URL, pathname: string, status = 308): Response {
  const target = new URL(url.toString());
  target.protocol = "https:";
  target.hostname = "saxi.ai";
  target.port = "";
  target.pathname = pathname;
  target.search = "";
  return Response.redirect(target.toString(), status);
}

function parseAcceptRanges(header: string): Array<{ type: string; subtype: string; q: number }> {
  return header.split(",").flatMap((part) => {
    const [rawType, ...params] = part.trim().split(";");
    const media = rawType?.trim().toLowerCase() ?? "";
    const [type, subtype] = media.split("/");
    if (!type || !subtype) {
      return [];
    }

    const qParam = params.find((param) => param.trim().toLowerCase().startsWith("q="));
    const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
    if (!Number.isFinite(q) || q <= 0) {
      return [];
    }

    return [{ type, subtype, q }];
  });
}

function mediaQuality(
  ranges: Array<{ type: string; subtype: string; q: number }>,
  type: string,
  subtype: string
): { q: number; specificity: number } {
  let best = { q: 0, specificity: 0 };

  for (const range of ranges) {
    let specificity = 0;
    if (range.type === type && range.subtype === subtype) {
      specificity = 3;
    } else if (range.type === type && range.subtype === "*") {
      specificity = 2;
    } else if (range.type === "*" && range.subtype === "*") {
      specificity = 1;
    } else {
      continue;
    }

    if (specificity > best.specificity || (specificity === best.specificity && range.q > best.q)) {
      best = { q: range.q, specificity };
    }
  }

  return best;
}

function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) {
    return false;
  }

  const ranges = parseAcceptRanges(acceptHeader);
  const hasExplicitMarkdown = ranges.some(
    (range) => range.type === "text" && range.subtype === "markdown"
  );
  if (!hasExplicitMarkdown) {
    return false;
  }

  const markdown = mediaQuality(ranges, "text", "markdown");
  const html = mediaQuality(ranges, "text", "html");
  if (html.specificity > markdown.specificity) {
    return markdown.q > html.q;
  }

  return markdown.q >= html.q;
}

function markdownAssetPath(pathname: string): string | null {
  if (isMachineFeed(pathname) || MARKDOWN_SKIP_PATHS.has(pathname)) {
    return null;
  }
  if (pathname.startsWith("/assets/") || pathname.startsWith("/internal/")) {
    return null;
  }
  if (pathname.endsWith(".md")) {
    return null;
  }
  if (
    pathname !== "/404.html" &&
    /\.(css|js|png|jpe?g|gif|webp|svg|woff2?|json|xml|txt|ico|map)$/i.test(pathname)
  ) {
    return null;
  }

  if (pathname === "/" || pathname === "") {
    return "/index.md";
  }
  if (pathname.endsWith("/")) {
    return `${pathname}index.md`;
  }
  if (pathname.endsWith(".html")) {
    return pathname.replace(/\.html$/i, ".md");
  }

  return `${pathname}/index.md`;
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

async function markdownResponse(
  env: Env,
  origin: string,
  assetPath: string,
  method: string,
  status?: number
): Promise<Response | null> {
  const asset = await env.ASSETS.fetch(new Request(new URL(assetPath, origin), { method: "GET" }));
  if (!asset.ok) {
    return null;
  }

  const body = await asset.text();
  const headers = corsHeaders();
  headers.set("content-type", "text/markdown; charset=utf-8");
  headers.set("vary", "Accept");
  headers.set("x-markdown-tokens", String(estimateTokens(body)));
  headers.set("content-signal", "ai-train=yes, search=yes, ai-input=yes");
  headers.set("cache-control", "public, max-age=3600");

  if (method === "HEAD") {
    return new Response(null, { status: status ?? asset.status, headers });
  }

  return new Response(body, { status: status ?? asset.status, headers });
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    const isWorkersDevHost = hostname.endsWith(".workers.dev");
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
    const method = request.method.toUpperCase();
    const acceptMarkdown = prefersMarkdown(request.headers.get("accept"));

    if (method === "OPTIONS" && (isMachineFeed(url.pathname) || acceptMarkdown) && !isMcpPath(url.pathname)) {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (!isWorkersDevHost && !isLocalHost && hostname === "www.saxi.ai") {
      return redirectToCanonical(url);
    }

    if (
      !isWorkersDevHost &&
      !isLocalHost &&
      url.protocol !== "https:" &&
      request.headers.has("cf-connecting-ip")
    ) {
      return redirectToCanonical(url);
    }

    if (url.pathname === "/mcp/") {
      return redirectToPath(url, "/mcp");
    }

    if (url.pathname === "/mcp") {
      return handleSaxiMcp(request, env, ctx);
    }

    if (url.pathname === "/collections/free-apis-for-ai-agents/" || url.pathname === "/collections/free-apis-for-ai-agents") {
      return redirectToPath(url, "/collections/best-apis-for-ai-agents/");
    }

    if (url.pathname === "/health") {
      return json({
        ok: true,
        app: "saxi",
        timestamp: new Date().toISOString()
      });
    }

    if (url.pathname === "/internal/screenshot") {
      return json(
        {
          ok: false,
          error:
            "Screenshot capture is not configured yet. The build pipeline falls back to generated placeholders."
        },
        { status: 501 }
      );
    }

    if (url.pathname === "/favicon.ico") {
      return env.ASSETS.fetch(new Request(new URL("/favicon.svg", url), request));
    }

    if (
      (method === "GET" || method === "HEAD") &&
      (url.pathname === "/api/search.json" || url.pathname === "/api/search.json/")
    ) {
      return agentSearchResponse(env, url, method);
    }

    if ((method === "GET" || method === "HEAD") && url.pathname.endsWith(".md")) {
      const markdown = await markdownResponse(env, url.origin, url.pathname, method);
      if (markdown) {
        return markdown;
      }
    }

    if ((method === "GET" || method === "HEAD") && acceptMarkdown) {
      const assetPath = markdownAssetPath(url.pathname);
      if (assetPath) {
        const markdown = await markdownResponse(env, url.origin, assetPath, method);
        if (markdown) {
          return markdown;
        }
      }
    }

    const response = await env.ASSETS.fetch(request);

    if ((method === "GET" || method === "HEAD") && acceptMarkdown && response.status === 404) {
      const notFound = await markdownResponse(env, url.origin, "/404.md", method, 404);
      if (notFound) {
        return notFound;
      }
    }

    if (isMachineFeed(url.pathname)) {
      return withCors(response);
    }

    return markdownAssetPath(url.pathname) ? withAcceptVary(response) : response;
  }
} satisfies ExportedHandler<Env>;
