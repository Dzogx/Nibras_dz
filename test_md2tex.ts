// اختبار سريع لدالة markdownToLatex (نسخة تجريبية من assessmentTemplate)
import { readFileSync } from "fs";

const src = readFileSync("/home/ubuntu/nibras/server/latex/assessmentTemplate.ts", "utf8");
// استخراج الدالتين المطلوبتين بـ eval مع mock
const extracted = src
  .replace(/import .*?from.*/g, "")
  .replace(/(const ASSESSMENT_PRINT_THEMES =[\s\S]*?};)/, "")
  .replace(/type [^{]+}/g, "");
console.log(extracted.slice(0, 200));
