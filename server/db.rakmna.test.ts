import { describe, expect, it } from "vitest";
import { parseRakmnaExcelWorkbook, computeTermAverage, termAverageEvaluation } from "./db";
import * as XLSX from "xlsx";

function buildWorkbookFile(workbook: XLSX.WorkBook): Buffer {
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buffer as unknown as ArrayBuffer);
}

function makeRakmnaWorkbook(sheets: { name: string; rows: (string | number | null)[][] }[]): Buffer {
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet.rows), sheet.name);
  }
  return buildWorkbookFile(workbook);
}

function makeGradeSheet(
  fogLabel: string,
  subject: string,
  students: (string | number | null)[][],
): (string | number | null)[][] {
  // الصف 5 (index 4) يحمل ترويسة حجز النقاط الرسمية.
  const headerRow = (rows: number): (string | number | null)[] => Array.from({ length: rows }, () => null);
  const rows: (string | number | null)[][] = [];
  for (let i = 0; i < 4; i++) rows.push(headerRow(8));
  // النص الفعلي في وثائق حجز النقاط يفصل بين مستوى الفوج و«متوسط» بفراغين أو أكثر.
  rows.push([`وثيقة حجز النقاط  الخاصة بـ:الفصل الثالث السنة الدراسية : 2025-2026  الفوج التربوي : ${fogLabel} مادة : ${subject}`]);
  rows.push(headerRow(8));
  rows.push(headerRow(8));
  rows.push(headerRow(8));
  rows.push(["رقم التعريف", "اللقب", "الاسم", "تاريخ الميلاد", "معدل تقويم النشاطات", "الفرض", "الإختبار"]);
  for (const student of students) rows.push(student);
  return rows;
}

const sampleStudents: (string | number | null)[][] = [
  ["22000010000001", "عبيدلي", "أيمن", "2012-05-03", 14.5, 12, 11],
  ["22000010000002", "هاشمي", "نور الهدى", "2012-01-14", 17, 15, 14.5],
  ["22000010000003", "بلقاسم", "زكرياء", "2011-11-30", 9, 6, 5],
];

describe("parseRakmnaExcelWorkbook", () => {
  it("يحلّل وثيقة حجز نقاط رسمية متعددة الأوراق إلى أفواج ومواد وتلاميذ", () => {
    const buffer = makeRakmnaWorkbook([
      { name: "2200003", rows: makeGradeSheet("ثانية  متوسط    3", "التاريخ والجغرافيا", sampleStudents) },
      { name: "22000034", rows: makeGradeSheet("ثانية  متوسط    3", "التربية المدنية", sampleStudents) },
    ]);

    const result = parseRakmnaExcelWorkbook(buffer);
    expect(result.sheets).toHaveLength(2);
    const historySheet = result.sheets.find((sheet) => sheet.subject === "التاريخ والجغرافيا")!;
    expect(historySheet.fogCode).toBe("2200003");
    expect(historySheet.term).toBe(3);
    expect(historySheet.academicYear).toBe("2025-2026");
    // الوثيقة الرسمية تكتب الفوج بلا لام التعريف («ثانية  متوسط    3») والمحلل يوحّد الاسم الرسمي.
    expect(historySheet.gradeLevel).toBe("السنة ثانية متوسط");
    expect(historySheet.students).toHaveLength(3);
    expect(historySheet.students[0]).toEqual({
      matricule: "22000010000001",
      fullName: "عبيدلي أيمن",
      birthDate: "2012-05-03",
      activityScore: 14.5,
      examQuizScore: 12,
      finalExamScore: 11,
    });
    const civicSheet = result.sheets.find((sheet) => sheet.subject === "التربية المدنية")!;
    expect(civicSheet.fogCode).toBe("22000034");
    expect(result.issues).toHaveLength(0);
  });

  it("يتجاهل الأوراق التي ليست وثائق حجز نقاط", () => {
    const buffer = makeRakmnaWorkbook([
      { name: "Worksheet", rows: [[""], [""], [""]] },
      { name: "2200003", rows: makeGradeSheet("ثانية  متوسط    3", "التاريخ والجغرافيا", sampleStudents) },
    ]);
    const result = parseRakmnaExcelWorkbook(buffer);
    expect(result.sheets).toHaveLength(1);
  });

  it("يقصّ النقاط خارج المجال 0–20 ويرفض الصفوف غير المكتملة", () => {
    const buffer = makeRakmnaWorkbook([
      {
        name: "2200003",
        rows: makeGradeSheet("ثانية  متوسط    3", "التاريخ والجغرافيا", [
          ["22000010000001", "عبيدلي", "أيمن", "", 25, -5, 11],
          ["0001234", "لقب", "اسم", "", 10, 10, 10],
          ["22000010000002", "هاشمي", "", "", 12, 12, 12],
        ]),
      },
    ]);
    const result = parseRakmnaExcelWorkbook(buffer);
    expect(result.sheets).toHaveLength(1);
    const students = result.sheets[0].students;
    expect(students).toHaveLength(1);
    expect(students[0].activityScore).toBe(20);
    expect(students[0].examQuizScore).toBe(0);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("يرفض الملفات التالفة برمياً", () => {
    expect(() => parseRakmnaExcelWorkbook(Buffer.from("plain text not a zip"))).toThrow();
  });
});

describe("computeTermAverage", () => {
  it("يحسب المعدل وفق المعادلة الرسمية (نشاطات + فرض + اختبار×3) / 5", () => {
    expect(computeTermAverage(14.5, 12, 11)).toBeCloseTo((14.5 + 12 + 33) / 5, 2);
    expect(computeTermAverage(null, 10, 10)).toBeCloseTo((0 + 10 + 30) / 5, 2);
    expect(computeTermAverage(10, null, 10)).toBeNull();
  });

  it("يقابل المعدل بالتقدير اللفظي الرسمي", () => {
    expect(termAverageEvaluation(16.5)).toBe("ممتاز");
    expect(termAverageEvaluation(15)).toBe("جيد جداً");
    expect(termAverageEvaluation(13)).toBe("جيد");
    expect(termAverageEvaluation(11)).toBe("متوسط");
    expect(termAverageEvaluation(8)).toBe("ضعيف");
    expect(termAverageEvaluation(5)).toBe("ضعيف جداً");
  });
});
