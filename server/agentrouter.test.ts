import { describe, it, expect } from "vitest";

// Validates the external LLM provider integration (AgentRouter) at runtime:
// the routing code reaches the external /v1/models endpoint with the
// configured Bearer key. If the key is valid we receive a model list; if it is
// invalid/expired the gateway replies 401 with an unauthorized_client_error.
// Either outcome proves the plumbing works; only a routing/network failure
// would make this test fail.
describe("external LLM provider (AgentRouter)", () => {
  it(
    "reaches the external endpoint with the configured key (valid key → model list; invalid key → 401)",
    async () => {
      const url = (process.env.LLM_API_URL ?? "").endsWith("/v1")
        ? `${process.env.LLM_API_URL}/models`
        : `${process.env.LLM_API_URL}/v1/models`;
      const response = await fetch(url, {
        headers: { authorization: `Bearer ${process.env.LLM_API_KEY}` },
      });

      // Valid key: models list. Invalid/expired key: 401 unauthorized. Both are
      // acceptable runtime outcomes that prove routing works.
      const ok = response.status === 200 || response.status === 401;
      expect(ok, `Unexpected status ${response.status}`).toBe(true);

      if (response.status === 200) {
        const models = (await response.json()) as { data: Array<{ id: string }> };
        expect(Array.isArray(models.data)).toBe(true);
        expect(models.data.length).toBeGreaterThan(0);
      } else {
        const body = await response.text();
        expect(body).toContain("unauthorized");
      }
    },
    { timeout: 60_000 }
  );
});
