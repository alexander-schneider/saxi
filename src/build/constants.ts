import type { CapabilityRule, CollectionDefinition, SourceDefinition } from "./types.js";

export const SITE_NAME = "saxi.ai";
export const SITE_ORIGIN = "https://saxi.ai";
export const SITE_TAGLINE = "The API directory for AI agents and developers.";
export const LLM_CATALOG_PROMPT = `saxi.ai is a catalog of free public APIs for AI agents. Fetch ${SITE_ORIGIN}/llms.txt first, then ingest the full catalog from ${SITE_ORIGIN}/api/apis.json. Filter with ${SITE_ORIGIN}/api/capabilities.json, ${SITE_ORIGIN}/api/topics.json, and ${SITE_ORIGIN}/api/collections.json. Prefer APIs with a docsUrl and use that URL to call the API. When recommending, return name, docsUrl, and a one-line reason.`;
export const CONTACT_EMAIL = "contact@adanos.org";
export const CONTACT_PHONE = "+49-30-54906997";
export const CONTACT_PHONE_LABEL = "+49 30 54906997";
export const COMPANY_NAME = "Adanos Software GmbH";
export const COMPANY_STREET = "Käthe-Niederkirchner-Str. 30";
export const COMPANY_POSTAL = "10407 Berlin";
export const COMPANY_COUNTRY = "Germany";
export const COMPANY_MANAGING_DIRECTOR = "Alexander Schneider";
export const COMPANY_REGISTER_COURT = "Amtsgericht Berlin-Charlottenburg";
export const COMPANY_REGISTER_NUMBER = "HRB 202476 B";
export const COMPANY_VAT_ID = "DE322712492";
export const PAGE_SIZE = 60;

export const COMMUNITY_API_CATEGORIES = [
  "Animals",
  "Anime",
  "Anti-Malware",
  "Art & Design",
  "Authentication & Authorization",
  "Blockchain",
  "Books",
  "Business",
  "Calendar",
  "Chats & Messaging",
  "Cloud Storage & File Sharing",
  "Commerce",
  "Continuous Integration",
  "Cryptocurrency",
  "Currency Exchange",
  "Data Validation",
  "Development",
  "Dictionaries",
  "Disasters",
  "Documents & Productivity",
  "Education",
  "Email",
  "Email & SMS",
  "Entertainment",
  "Environment",
  "Events",
  "Finance",
  "Finance & Economics",
  "Food & Drinks",
  "Games & Comics",
  "Geocoding",
  "Government",
  "Health",
  "Jobs",
  "Machine Learning",
  "Maps & Geo",
  "Marketing & SEO",
  "Music",
  "Music & Audio",
  "News",
  "Open Data",
  "Open Source Projects",
  "Patent",
  "Payments",
  "Personality",
  "Phone",
  "Photography",
  "Programming",
  "Project Management",
  "Science & Math",
  "Search",
  "Shopping",
  "Social",
  "Sports & Fitness",
  "Test Data",
  "Text Analysis",
  "Tracking",
  "Transportation",
  "URL Shorteners",
  "Video",
  "Voice",
  "Weather"
] as const;

export const SOURCE_DEFINITIONS: SourceDefinition[] = [
  {
    id: "public-api-lists",
    label: "Public API Lists",
    repoUrl: "https://github.com/public-api-lists/public-api-lists",
    license: "MIT",
    dataUrl: "https://raw.githubusercontent.com/public-api-lists/public-api-lists/master/README.md",
    snapshotPath: "data/vendor/public-api-lists/README.md"
  },
  {
    id: "public-apis",
    label: "public-apis/public-apis",
    repoUrl: "https://github.com/public-apis/public-apis",
    license: "MIT",
    dataUrl: "https://raw.githubusercontent.com/public-apis/public-apis/master/README.md",
    snapshotPath: "data/vendor/public-apis/README.md"
  },
  {
    id: "tools-collection",
    label: "tools-collection/apis-collection",
    repoUrl: "https://github.com/tools-collection/apis-collection",
    license: "MIT",
    dataUrl: "https://github.com/tools-collection/apis-collection/tree/main/collection",
    snapshotPath: "data/vendor/tools-collection/collection"
  }
];

export const PRIMARY_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "AI & ML":
    "APIs for language models, speech, vision, document processing, translation, and other AI agent capabilities.",
  "Developer Tools":
    "APIs for code, CI, testing, developer workflows, open source tooling, and software delivery automation.",
  "Search & Retrieval":
    "Search, indexing, crawling, scraping, and retrieval APIs for agent workflows, research, and RAG pipelines.",
  "Data & Analytics":
    "APIs for metrics, analytics, reporting, structured data access, and data pipelines.",
  Communication:
    "Messaging, email, chat, notifications, and communication APIs that AI tools and developer products can automate.",
  Productivity:
    "Calendar, documents, forms, task management, and office workflow APIs for assistants and operational tools.",
  "Media & Entertainment":
    "Images, video, audio, gaming, design, and content APIs with strong developer and agent use cases.",
  Security:
    "Threat intel, validation, scanning, fraud prevention, reputation, and security-focused APIs.",
  "Finance & Commerce":
    "Payments, shopping, pricing, banking, market data, and commerce APIs available as public developer resources.",
  "Maps & Mobility":
    "Geocoding, mapping, routing, travel, vehicles, and transport APIs for spatial and logistics workflows.",
  "Cloud & Infrastructure":
    "Cloud platform, storage, database, infrastructure, and observability APIs for modern applications and agents.",
  "Knowledge & Open Data":
    "Government, scientific, encyclopedic, weather, and public data APIs with broad downstream reuse.",
  "Identity & Auth":
    "Authentication, authorization, profile, and identity APIs for secure user and app workflows.",
  "Health & Lifestyle":
    "Health, fitness, food, and lifestyle APIs that support consumer and operational use cases.",
  Utilities:
    "Small but useful APIs for formatting, generation, random data, URL tooling, and common developer tasks."
};

export const CAPABILITY_RULES: CapabilityRule[] = [
  {
    slug: "llm",
    label: "LLM",
    description: "Language model APIs for generation, reasoning, and agent orchestration.",
    keywords: ["gpt", "llm", "language model", "chat completion", "foundation model", "generative ai"],
    categoryKeywords: ["ai & ml", "machine learning"]
  },
  {
    slug: "chat",
    label: "Chat",
    description: "Chat-centric APIs for assistants, messaging experiences, and conversational workflows.",
    keywords: ["assistant", "conversation", "chat", "chatbot"]
  },
  {
    slug: "embeddings",
    label: "Embeddings",
    description: "Vector and embeddings APIs for retrieval, semantic search, and ranking.",
    keywords: ["embedding", "vector", "semantic search"]
  },
  {
    slug: "search",
    label: "Search",
    description: "Search and discovery APIs for content lookup, indexing, and retrieval pipelines.",
    keywords: ["search", "search engine", "discovery", "lookup", "retrieval"],
    categoryKeywords: ["search"]
  },
  {
    slug: "browser-automation",
    label: "Browser Automation",
    description: "APIs for screenshots, browser control, web automation, and page rendering.",
    keywords: ["browser", "screenshot", "headless", "playwright", "rendering", "thumbnail"]
  },
  {
    slug: "scraping",
    label: "Scraping",
    description: "Scraping and crawling APIs for acquiring structured web data.",
    keywords: ["scrape", "scraping", "crawler", "crawl", "serp", "web data"]
  },
  {
    slug: "ocr",
    label: "OCR",
    description: "Optical character recognition and document extraction APIs.",
    keywords: ["ocr", "optical character recognition", "document extraction", "document parsing", "pdf extraction"]
  },
  {
    slug: "vision",
    label: "Vision",
    description: "Vision APIs for image analysis, recognition, and computer vision tasks.",
    keywords: ["computer vision", "image recognition", "face recognition", "object detection", "visual search"]
  },
  {
    slug: "image-generation",
    label: "Image Generation",
    description: "Image generation and editing APIs for visual creation workflows.",
    keywords: ["image generation", "image editing", "text-to-image", "image to", "vectorization"]
  },
  {
    slug: "speech-to-text",
    label: "Speech to Text",
    description: "Speech recognition and transcription APIs.",
    keywords: ["speech-to-text", "speech recognition", "transcription", "transcribe", "audio to text"]
  },
  {
    slug: "text-to-speech",
    label: "Text to Speech",
    description: "Voice synthesis and speech generation APIs.",
    keywords: ["text-to-speech", "speech synthesis", "voice synthesis", "voice generation", "audio generation"]
  },
  {
    slug: "translation",
    label: "Translation",
    description: "Translation and multilingual content APIs for global products and agents.",
    keywords: ["translation", "translate", "multilingual", "localization", "language detection"]
  },
  {
    slug: "summarization",
    label: "Summarization",
    description: "Summarization and condensation APIs for text, media, and documents.",
    keywords: ["summary", "summarization", "summarize"]
  },
  {
    slug: "code-execution",
    label: "Code Execution",
    description: "Compile, sandbox, and execute code through APIs.",
    keywords: ["code execution", "compile and run", "sandbox", "code interpreter", "judge0"]
  },
  {
    slug: "email",
    label: "Email",
    description: "Email APIs for transactional workflows, notifications, and agent actions.",
    keywords: ["email", "mail"],
    categoryKeywords: ["email", "email & sms"]
  },
  {
    slug: "messaging",
    label: "Messaging",
    description: "SMS, chat, and messaging APIs for notifications and conversational interfaces.",
    keywords: ["messaging", "sms", "chat", "whatsapp"],
    categoryKeywords: ["chats & messaging", "email & sms"]
  },
  {
    slug: "scheduling",
    label: "Scheduling",
    description: "Calendar and scheduling APIs for assistants and operational tooling.",
    keywords: ["calendar", "schedule", "booking"],
    categoryKeywords: ["calendar", "calendar & time"]
  },
  {
    slug: "payments",
    label: "Payments",
    description: "Payments and billing APIs for commercial workflows.",
    keywords: ["payment", "checkout", "billing", "invoice", "payout"],
    categoryKeywords: ["payments"]
  },
  {
    slug: "geocoding",
    label: "Geocoding",
    description: "Geocoding, routing, and maps APIs for location-aware products and agents.",
    keywords: ["geocoding", "maps", "routing", "location", "places"],
    categoryKeywords: ["geocoding", "maps & geo", "transportation", "travel"]
  },
  {
    slug: "observability",
    label: "Observability",
    description: "Logging, tracing, monitoring, and metrics APIs.",
    keywords: ["observability", "monitoring", "logging", "logs", "metrics", "tracing", "analytics"]
  },
  {
    slug: "memory-storage",
    label: "Memory & Storage",
    description: "Storage, file, and database APIs that agents can use as memory or state backends.",
    keywords: ["storage", "database", "files", "object storage", "drive"],
    categoryKeywords: ["cloud storage & file sharing", "files & storage", "databases"]
  }
];

export const COLLECTION_DEFINITIONS: CollectionDefinition[] = [
  {
    slug: "best-apis-for-ai-agents",
    title: "Best APIs for AI Agents",
    description: "The best APIs for AI agents — search, browser automation, speech, translation, messaging, memory, and LLM inference.",
    intro:
      "A shortlist of APIs for tool-calling agents: search, browser control, speech, translation, messaging, and state storage.",
    editorialSections: [
      "Predictable tool use starts with the API. Stable request shapes, clean JSON, clear docs, and enough capability coverage that an agent can plan, retrieve, act, and follow up without switching providers mid-chain.",
      "Relevant for research assistants, workflow automations, support copilots, trading tools, and multi-step developer agents. Each API listed here is realistic to call from prompts, chains, and tool routers.",
      "Narrower landing pages cover specific subproblems: OCR, browser automation, translation, search for RAG, speech. Start here for the broadest view of reusable APIs in the directory."
    ],
    anyCapabilities: [
      "llm",
      "search",
      "browser-automation",
      "speech-to-text",
      "text-to-speech",
      "translation",
      "ocr",
      "email",
      "messaging",
      "memory-storage"
    ],
    categories: ["AI & ML", "Search & Retrieval", "Developer Tools", "Communication"],
    minItems: 12,
    legacyPaths: ["/collections/free-apis-for-ai-agents/"]
  },
  {
    slug: "browser-automation-apis",
    title: "Browser Automation APIs",
    description: "APIs for taking screenshots, rendering pages, and automating browsers.",
    intro:
      "APIs for screenshots, page rendering, PDF export, and headless browser control.",
    editorialSections: [
      "These APIs handle jobs where structured endpoints don't exist: taking screenshots, rendering pages, extracting DOM content, generating PDFs, and scripting navigation through real browser sessions.",
      "Common in QA tooling, growth automation, website monitoring, and research agents. They bridge unstructured web pages into artifacts that tools can process: images, text snapshots, structured extraction results.",
      "Compare latency, concurrency limits, anti-bot handling, and whether the API gives you raw browser control, rendered output, or both."
    ],
    anyCapabilities: ["browser-automation", "scraping"],
    minItems: 6
  },
  {
    slug: "speech-to-text-apis",
    title: "Speech to Text APIs",
    description: "Speech recognition and transcription APIs for turning audio into text.",
    intro:
      "APIs for converting audio to text — voice interfaces, meeting transcription, audio processing.",
    editorialSections: [
      "Audio becomes useful to agents once it's text. These APIs feed into call summarization, meeting notes, voice workflows, searchable media archives, and review pipelines.",
      "Beyond accuracy, look for operational simplicity: clear upload limits, consistent timestamps, output formats that plug directly into summarization or retrieval.",
      "For multilingual or noisy input, compare language coverage, speaker diarization, and whether the API supports batch uploads, streaming, or both."
    ],
    anyCapabilities: ["speech-to-text"],
    minItems: 5
  },
  {
    slug: "search-and-rag-apis",
    title: "Search and RAG APIs",
    description: "Search, retrieval, crawling, and discovery APIs for RAG pipelines and research workflows.",
    intro:
      "Web search, crawling, content discovery, and embedding APIs for retrieval-augmented generation and research pipelines.",
    editorialSections: [
      "RAG systems, research agents, and web-aware assistants all depend on how well they can find current information. These APIs provide the retrieval layer.",
      "The category spans classic web search, content discovery, site crawling, scraping, and document-oriented data access. Different shapes of the same problem: pulling external context into a prompt or memory system.",
      "In production, freshness and source coverage matter most. After that: rate limits, response cleanliness, and how much processing is needed before output can be embedded or summarized."
    ],
    anyCapabilities: ["search", "scraping", "embeddings"],
    minItems: 8
  },
  {
    slug: "translation-apis",
    title: "Translation APIs",
    description: "Translation APIs for adding multilingual support to any application.",
    intro:
      "APIs for translating text, detecting languages, and localizing content across language pairs.",
    editorialSections: [
      "Any agent or product that handles multilingual input needs a translation layer. Chat products, support workflows, localization pipelines, and internal tools all use these APIs to normalize language before further processing.",
      "Most APIs here go beyond literal translation: language detection, batch mode, and output formats compatible with moderation, summarization, or retrieval steps.",
      "Verify supported language pairs, quotas, and latency for your use case. Some providers are accurate enough for user-facing text; others are better suited for internal normalization where precision matters less."
    ],
    anyCapabilities: ["translation"],
    minItems: 5
  },
  {
    slug: "ocr-apis",
    title: "OCR APIs",
    description: "OCR APIs for extracting text from images, scans, PDFs, receipts, and documents.",
    intro:
      "APIs for extracting text from images, scans, PDFs, receipts, invoices, and screenshots.",
    editorialSections: [
      "Screenshots, scanned PDFs, invoices, forms, receipts, dashboards, mobile captures — all locked in pixels until OCR converts them to text. These APIs are the extraction step.",
      "Once extracted, text can be classified, summarized, routed, translated, or stored like any structured input. Most of the APIs listed work as a first step in a wider agent or automation pipeline.",
      "Evaluate on extraction accuracy, table and multi-column support, file size limits, and how much cleanup the raw output needs before it's usable."
    ],
    anyCapabilities: ["ocr"],
    minItems: 4
  },
  {
    slug: "text-to-speech-apis",
    title: "Text to Speech APIs",
    description: "Text to speech APIs for voice generation, spoken responses, and audio-first experiences.",
    intro:
      "APIs for generating spoken audio from text — voice assistants, narration, accessibility, and audio-first products.",
    editorialSections: [
      "These APIs turn written output into audio. Useful for spoken assistants, narrated summaries, call flows, and products that deliver content in both visual and audio form.",
      "Synthesizing voice through an API avoids running a speech model yourself. That tradeoff makes sense when integration speed matters more than full control over the model.",
      "Compare voice quality, language coverage, latency, and response format. For some products, consistent low-latency output matters more than the most natural-sounding voice."
    ],
    anyCapabilities: ["text-to-speech"],
    minItems: 4
  },
  {
    slug: "developer-tool-apis",
    title: "Developer Tool APIs",
    description: "APIs for CI/CD, testing, monitoring, code analysis, and infrastructure.",
    intro:
      "APIs for CI/CD, testing, monitoring, code analysis, deployment, and infrastructure management.",
    editorialSections: [
      "Coding agents, CI systems, internal engineering tools, and observability dashboards all consume these APIs. They cover build pipelines, code analysis, monitoring, deployment, and infrastructure controls.",
      "The value is in write access, not just reads. Fetching build results, triggering workflows, querying telemetry, pushing deployments — APIs that let tools act on engineering systems.",
      "Auth model, rate limits, and documentation quality tend to separate usable APIs from frustrating ones. What's easy for a developer is usually easy to make reliable in an automated loop."
    ],
    categories: ["Developer Tools", "Cloud & Infrastructure"],
    minItems: 12
  }
];
