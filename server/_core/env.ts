export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Optional external LLM provider (OpenAI-compatible, e.g. AgentRouter). When set, overrides Manus gateway.
  llmApiUrl: process.env.LLM_API_URL ?? "",
  llmApiKey: process.env.LLM_API_KEY ?? "",
  // Optional Google Gemini API key (free tier via Google AI Studio).
  // When present, model ids with the "gemini/" prefix are routed to the
  // Gemini REST API instead of the OpenAI-compatible external provider.
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
};
