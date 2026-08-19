import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const ts = await import("./server/latex/assessmentTemplate.ts");
const latex = ts.buildAssessmentLatexDocument({
  title: "اختبار فصلي أول — السنة الرابعة متوسط",
  content:
    "## السؤال الأول\n1. عرّف مفهوم الاستعمار الاستيطاني في الجزائر.\n2. اذكر نتيجة الاحتلال الفرنسي للجزائر عام 1830.\n\n## السؤال الثاني\n- حلل الخريطة المرفقة وحدد المناطق التي سيطر عليها الفرنسيون.\n- قارن بين سياسة الاحتلال العسكري وسياسة الاحتلال المدني.\n\n## الوضعية الإدماجية\nانطلاقاً من وثيقتين، أكتب نصاً من 8 إلى 12 سطراً تبيّن فيه أثر الاحتلال الفرنسي على المجتمع الجزائري.",
  subject: "التاريخ",
  gradeLevel: "السنة الرابعة متوسط",
  assessmentType: "exam",
  printTheme: "nibras",
  topic: "الجزائر تحت الاحتلال الفرنسي",
  duration: "ساعة ونصف",
  totalPoints: 20,
  teacherName: "أستاذ الاجتماعيات",
  school: "متوسطة الشهيد ...",
  className: "4م2",
  assessmentDate: "15 / 11 / 2026",
});
writeFileSync("/tmp/nibras-tex/sample.tex", latex);
console.log(latex.length, "bytes written");
