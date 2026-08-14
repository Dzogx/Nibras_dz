import { invokeLLM } from "./server/_core/llm.ts";

const response = await invokeLLM({
  model: "gemini-2.5-flash",
  messages: [
    { role: "system", content: "أنت مساعد ذكي لتعليم الدراسات الاجتماعية. أنشئ مذكرة درس قصيرة (عناصر مختصرة) للموضوع: التعرف على موقع الجزائر وأهميته، المستوى: السنة الرابعة متوسط، المدة: ساعة ونصف." },
  ],
});
console.log("RESPONSE KEYS:", Object.keys(response || {}));
console.log("RAW:", JSON.stringify(response).substring(0, 800));
function getText(r) {
  const c = r?.content?.[0];
  if (typeof c === "string") return c;
  return c?.text;
}
console.log("TEXT:", getText(response)?.substring(0, 300));
