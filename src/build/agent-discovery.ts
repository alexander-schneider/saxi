import { SITE_NAME, SITE_ORIGIN, SITE_TAGLINE } from "./constants.js";

function renderJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

const MCP_DESCRIPTION = "Public API directory for AI agents and developers.";

export function renderMcpServerCard(): string {
  return renderJson({
    serverInfo: {
      name: SITE_NAME,
      version: "1.0.0"
    },
    description: MCP_DESCRIPTION,
    url: `${SITE_ORIGIN}/mcp`,
    endpoint: `${SITE_ORIGIN}/mcp`,
    transport: {
      type: "streamable-http"
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: false
    }
  });
}

export function renderApiCatalog(): string {
  return renderJson({
    linkset: [
      {
        anchor: SITE_ORIGIN,
        "service-desc": [
          {
            href: `${SITE_ORIGIN}/api/openapi.json`,
            type: "application/json"
          }
        ],
        "service-doc": [
          {
            href: `${SITE_ORIGIN}/llms.txt`,
            type: "text/plain"
          },
          {
            href: `${SITE_ORIGIN}/`,
            type: "text/html"
          }
        ],
        status: [
          {
            href: `${SITE_ORIGIN}/health`,
            type: "application/json"
          }
        ]
      }
    ]
  });
}

export function renderOpenApi(): string {
  return renderJson({
    openapi: "3.1.0",
    info: {
      title: SITE_NAME,
      version: "1.0.0",
      description: MCP_DESCRIPTION
    },
    servers: [{ url: SITE_ORIGIN }],
    paths: {
      "/api/search.json": {
        get: {
          operationId: "searchApis",
          summary: "Search the API directory",
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string", minLength: 1, maxLength: 120 }
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 }
            }
          ]
        }
      },
      "/api/catalog/index.json": {
        get: {
          operationId: "listCatalogSlices",
          summary: "List capability and topic slice URLs"
        }
      },
      "/health": {
        get: {
          operationId: "health",
          summary: "Liveness check"
        }
      },
      "/mcp": {
        post: {
          operationId: "mcp",
          summary: "MCP Streamable HTTP endpoint",
          description: "Tools: search_apis, list_capabilities, get_slice. No auth."
        }
      }
    }
  });
}

export function renderA2aAgentCard(): string {
  return renderJson({
    name: SITE_NAME,
    version: "1.0.0",
    description: SITE_TAGLINE,
    url: `${SITE_ORIGIN}/mcp`,
    supportedInterfaces: [
      {
        url: `${SITE_ORIGIN}/mcp`,
        protocol: "JSONRPC",
        transport: "HTTP"
      }
    ],
    capabilities: {
      streaming: true,
      pushNotifications: false
    },
    skills: [
      {
        id: "search_apis",
        name: "Search APIs",
        description: "Search the public API directory. Returns name, docsUrl, description, and authType."
      },
      {
        id: "list_capabilities",
        name: "List capabilities",
        description: "List compact catalog slice slugs for capabilities and topics."
      },
      {
        id: "get_slice",
        name: "Get catalog slice",
        description: "Fetch one capability or topic slice by slug."
      }
    ]
  });
}

export function renderAgentSkillsIndex(skills: Array<{ name: string; description: string; url: string; digest: string }>): string {
  return renderJson({
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: skills.map((skill) => ({
      name: skill.name,
      type: "skill-md",
      description: skill.description,
      url: skill.url,
      digest: skill.digest
    }))
  });
}
