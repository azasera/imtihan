export const AI_MODELS = [
  {
    chef: "OpenAI",
    chefSlug: "openai",
    id: "gpt-4o",
    name: "GPT-4o",
    providers: ["openai", "azure"],
  },
  {
    chef: "OpenAI",
    chefSlug: "openai",
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    providers: ["openai", "azure"],
  },
  {
    chef: "Anthropic",
    chefSlug: "anthropic",
    id: "claude-opus-4-20250514",
    name: "Claude 4 Opus",
    providers: ["anthropic", "azure", "google", "amazon-bedrock"],
  },
  {
    chef: "Anthropic",
    chefSlug: "anthropic",
    id: "claude-sonnet-4-20250514",
    name: "Claude 4 Sonnet",
    providers: ["anthropic", "azure", "google", "amazon-bedrock"],
  },
  {
    chef: "Google",
    chefSlug: "google",
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    providers: ["google"],
  },
] as const;

export type AIModel = (typeof AI_MODELS)[number];

