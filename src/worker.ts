const MACHINE_FEED_PATHS = new Set([
  "/llms.txt",
  "/llm.txt",
  "/robots.txt",
  "/search-index.json"
]);

function isMachineFeed(pathname: string): boolean {
  return MACHINE_FEED_PATHS.has(pathname) || pathname.startsWith("/api/");
}

function corsHeaders(): Headers {
  return new Headers({
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, HEAD, OPTIONS",
    "access-control-allow-headers": "*",
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

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    const isWorkersDevHost = hostname.endsWith(".workers.dev");
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";

    if (request.method === "OPTIONS" && isMachineFeed(url.pathname)) {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (!isWorkersDevHost && !isLocalHost && (hostname === "www.saxi.ai" || url.protocol !== "https:")) {
      return redirectToCanonical(url);
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

    const response = await env.ASSETS.fetch(request);
    return isMachineFeed(url.pathname) ? withCors(response) : response;
  }
} satisfies ExportedHandler<Env>;
