// Curated list of LLM models usable through the external provider (OpenRouter).
// Shared between server (llm.ts) and client (LessonGenerator/Assessment) so
// the model selector in the UI stays consistent with what the server supports.
//
// Selection criteria (Aug 2026, verified against the live OpenRouter catalog):
// - Arabic pedagogical quality (official lesson plans, assessments).
// - Free variants where available; cheap reliable paid ones for official docs.
// - Removed models that no longer exist or showed poor Arabic quality.

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
    description: "توازن ممتاز بين الجودة والسرعة — مناسب للمذكرات والتقويمات الرسمية",
    free: false,
  },
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    description: "سريع ودقيق بالعربية — مناسب للتوليد المتكرر",
    free: false,
  },
  {
    id: "minimax/minimax-m2.5",
    label: "MiniMax M2.5",
    description: "مجاني تقريبًا ويدعم العربية بطلاقة — الأنسب للتجارب الطويلة",
    free: true,
  },
  {
    id: "deepseek/deepseek-chat-v3.1",
    label: "DeepSeek V3.1",
    description: "مجاني تقريبًا بجودة عالية جدًا للعربية — بديل قوي",
    free: true,
  },
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o-mini",
    description: "سريع واقتصادي بجودة عالية",
    free: false,
  },
];
