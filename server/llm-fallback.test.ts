import { describe, it, expect } from "vitest";
import { invokeLLM } from "./_core/llm";

// Validates the external-provider robustness rules added after the
// "400 No models provided" incident (2026-08-16):
// 1. A request WITHOUT an explicit model must succeed against the external
//    gateway (OpenRouter requires a model; invokeLLM must apply the default).
// 2. If the external gateway refuses the request with an auth/server error
//    (401/403/5xx), invokeLLM falls back to the Manus gateway automatically.
describe("LLM external-provider robustness", () => {
  it(
    "invokes without an explicit model (default model applied; no 'No models provided' error)",
    async () => {
      const response = await invokeLLM({
        messages: [{ role: "user", content: "قل: اختبار" }],
        max_tokens: 20,
      });
      const text = response.choices?.[0]?.message?.content ?? "";
      expect(text.length).toBeGreaterThan(0);
    },
    { timeout: 90_000 }
  );

  it(
    "falls back to the Manus gateway when the external key is invalid",
    async () => {
      const originalUrl = process.env.LLM_API_URL;
      const originalKey = process.env.LLM_API_KEY;
      try {
        process.env.LLM_API_URL = originalUrl || "https://openrouter.ai/api";
        process.env.LLM_API_KEY = "sk-or-v1-invalid-key-for-test-only";
        const response = await invokeLLM({
          messages: [{ role: "user", content: "قل: اختبار نبراس" }],
          max_tokens: 20,
        });
        const text = response.choices?.[0]?.message?.content ?? "";
        expect(text.length).toBeGreaterThan(0);
      } finally {
        process.env.LLM_API_URL = originalUrl;
        process.env.LLM_API_KEY = originalKey;
      }
    },
    { timeout: 90_000 }
  );
});
