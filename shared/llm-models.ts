// Curated list of LLM models usable through the external provider (OpenRouter).
// Shared between server (llm.ts) and client (LessonGenerator/Assessment) so
// the model selector in the UI stays consistent with what the server supports.
//
// `free: true` models cost no credits on OpenRouter free plans; premium ones
// give higher Arabic pedagogical quality but consume credits.

export type LlmModelOption = {
  id: string;
  label: string;
  description: string;
  free: boolean;
};

export const LLM_MODEL_OPTIONS: LlmModelOption[] = [
  {
    id: "openai/gpt-4.1-mini",
    label: "GPT-4.1-mini (افتراضي)",
    description: "توازن جيد بين الجودة والسرعة — مناسب للمذكرات والتقويمات",
    free: false,
  },
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o-mini",
    description: "سريع واقتصادي بجودة عالية للعربية",
    free: false,
  },
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    description: "سريع جدًا — مناسب للتوليد المتكرر",
    free: true,
  },
  {
    id: "deepseek/deepseek-chat-v3-0324:free",
    label: "DeepSeek Chat v3 (مجاني)",
    description: "نموذج مجاني — جودة مقبولة للتجربة فقط",
    free: true,
  },
  {
    id: "qwen/qwen3-30b-a3b:free",
    label: "Qwen3 30B A3B (مجاني)",
    description: "نموذج مجاني — قد يحتوي أخطاء صياغة",
    free: true,
  },
];
