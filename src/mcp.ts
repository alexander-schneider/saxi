import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

import {
  AGENT_SEARCH_DEFAULT_LIMIT,
  AGENT_SEARCH_MAX_QUERY_LENGTH,
  searchApis
} from "./agent-search.js";
import { loadCatalogApis, loadCatalogSlice, loadCatalogSliceIndex } from "./catalog-feed.js";

function jsonTool(body: unknown, isError = false): { content: Array<{ type: "text"; text: string }>; isError?: boolean } {
  const result: { content: Array<{ type: "text"; text: string }>; isError?: boolean } = {
    content: [{ type: "text", text: JSON.stringify(body) }]
  };
  if (isError) {
    result.isError = true;
  }
  return result;
}

function createSaxiMcpServer(env: Env, origin: string): McpServer {
  const server = new McpServer({
    name: "saxi",
    version: "1.0.0"
  });

  server.registerTool(
    "search_apis",
    {
      title: "Search APIs",
      description:
        "Search the saxi.ai public API directory. Returns the top matches with name, docsUrl, description, and authType. Use this as the default way to recommend APIs for a task.",
      inputSchema: z.object({
        query: z.string().min(1).max(AGENT_SEARCH_MAX_QUERY_LENGTH),
        limit: z.number().int().min(1).max(50).optional()
      })
    },
    async ({ query, limit }) => {
      const apis = await loadCatalogApis(env, origin);
      if (!apis) {
        return jsonTool({ error: "Catalog is unavailable" }, true);
      }

      const result = searchApis(apis, query, limit ?? AGENT_SEARCH_DEFAULT_LIMIT);
      return jsonTool({
        schemaVersion: "1.0",
        query: result.query,
        limit: result.limit,
        total: apis.length,
        matched: result.matched,
        apis: result.apis
      });
    }
  );

  server.registerTool(
    "list_capabilities",
    {
      title: "List capabilities and topics",
      description:
        "List compact catalog slices. Use get_slice with kind=capability or kind=topic and a slug from this list.",
      inputSchema: z.object({})
    },
    async () => {
      const index = await loadCatalogSliceIndex(env, origin);
      if (!index) {
        return jsonTool({ error: "Slice index is unavailable" }, true);
      }

      return jsonTool({
        capabilities: index.capabilities.map((item) => ({
          slug: item.slug,
          title: item.title,
          count: item.count
        })),
        topics: index.topics.map((item) => ({
          slug: item.slug,
          title: item.title,
          count: item.count
        }))
      });
    }
  );

  server.registerTool(
    "get_slice",
    {
      title: "Get catalog slice",
      description:
        "Fetch one compact catalog slice by capability or topic slug, for example kind=capability slug=geocoding.",
      inputSchema: z.object({
        kind: z.enum(["capability", "topic"]),
        slug: z.string().min(1).max(80)
      })
    },
    async ({ kind, slug }) => {
      const slice = await loadCatalogSlice(env, origin, kind, slug);
      if (!slice) {
        return jsonTool({ error: `Unknown ${kind} slice: ${slug}` }, true);
      }

      return jsonTool(slice);
    }
  );

  return server;
}

export function handleSaxiMcp(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const origin = new URL(request.url).origin;
  return createMcpHandler(() => createSaxiMcpServer(env, origin), {
    route: "/mcp",
    allowedOriginHostnames: "*",
    corsOptions: {
      origin: "*",
      methods: "GET, POST, DELETE, OPTIONS",
      headers: "*"
    }
  })(request, env, ctx);
}
