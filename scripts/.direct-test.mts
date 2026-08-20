import { buildLLMPrompt } from "../server/strategies";
const ctx = {
  subject: "التاريخ",
  gradeLevel: "السنة الرابعة متوسط",
  situationTitle: "وضعية إدماجية جزئية: المقاومة المسلحة بعد 1945",
  sectionNumber: 3,
  competencyAction: "إدماج",
  termCompetency: "يوظف مفهوم المقاومة المسلحة لتحليل دور الشباب الجزائري في التحرر الوطني",
  globalCompetency: "يكون المتعلم قادراً على إبراز قيمة الموروث التاريخي الوطني كمكون من مكونات الهوية الوطنية",
  durationHours: 2,
  knowledgeResources: [{ title: "الوقائع التاريخية", action: "إدماج" }, { title: "التواريخ والشخصيات", action: "إدماج" }],
  criteria: [{ criterion: "يوظف المفهوم", indicators: ["في وضعية جديدة"] }],
};
const p = buildLLMPrompt(ctx as any);
console.log("contains الممارسة المستقلة:", p.includes("الممارسة المستقلة"));
console.log("contains أول تماس للتلاميذ:", p.includes("أول تماس للتلاميذ"));
