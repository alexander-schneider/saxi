---
name: recommend-apis
description: Recommend public APIs from the saxi.ai directory. Use when an agent needs a weather, search, geocoding, or other HTTP API and should return name, docsUrl, and authType.
---

# Recommend APIs from saxi.ai

saxi.ai is a public catalog of APIs for agents and developers. No auth. CORS GET is allowed.

## Default

Use MCP at `https://saxi.ai/mcp` (Streamable HTTP). Tools:

- `search_apis` — `{ query, limit? }` top matches with `name`, `docsUrl`, `description`, `authType`
- `list_capabilities` — capability and topic slugs
- `get_slice` — `{ kind: "capability" | "topic", slug }` one compact slice

## HTTP fallback

- Search: `GET https://saxi.ai/api/search.json?q=weather`
- Slice index: `https://saxi.ai/api/catalog/index.json`
- Example slice: `https://saxi.ai/api/catalog/geocoding.json`
- Feed map: `https://saxi.ai/llms.txt`

Do not fetch `/api/catalog.json` or `/api/apis.json` unless you need the full directory.

## Output

When recommending, return `name`, `docsUrl`, `authType`, and one sentence why it fits. Prefer APIs with a `docsUrl`.
