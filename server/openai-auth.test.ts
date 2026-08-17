/**
 * OpenAI secret validation: confirms the supplied OPENAI_API_KEY is a live,
 * working key against the official API WITHOUT consuming inference quota
 * (the /v1/models listing is a permission check, not a billable request).
 */
import { test, expect } from "vitest";
import { ENV } from "./_core/env";

test("OPENAI_API_KEY is configured and accepted by the official API", async () => {
  expect(ENV.openaiApiKey).toBeTruthy();
  if (!ENV.openaiApiKey) return;

  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { authorization: `Bearer ${ENV.openaiApiKey}` },
  });
  expect(res.status).toBe(200);
  const data = (await res.json()) as { data?: Array<{ id: string }> };
  const ids = (data.data ?? []).map(m => m.id);
  // The curated models added to the UI must all be reachable with this key.
  expect(ids).toContain("gpt-4.1-mini");
  expect(ids).toContain("gpt-4o-mini");
  expect(ids).toContain("gpt-4.1-nano");
});
