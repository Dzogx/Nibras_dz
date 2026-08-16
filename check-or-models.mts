const key = process.env.LLM_API_KEY;
const res = await fetch("https://openrouter.ai/api/v1/models", {
  headers: { authorization: `Bearer ${key}` },
});
const j = (await res.json()) as { data: Array<{ id: string; name: string }> };
const free = j.data.filter((m) => m.id.endsWith(":free"));
console.log("total models:", j.data.length, "| free models:", free.length);
console.log(free.map((m) => m.id).join("\n"));
