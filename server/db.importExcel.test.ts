import { describe, expect, it } from "vitest";
import { parseImportExcelWorkbook } from "./db";
import * as XLSX from "xlsx";

function buildWorkbookFile(workbook: XLSX.WorkBook): Buffer {
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buffer as unknown as ArrayBuffer);
}

function makeWorkbook(
  classRows: (string | number | null)[][],
  scheduleRows: (string | number | null)[][],
): Buffer {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(classRows), "الأقسام");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(scheduleRows), "الجدول");
  return buildWorkbookFile(workbook);
}

describe("parseImportExcelWorkbook", () => {
  it("يحلّل ملف Excel صحيحًا إلى أقسام وحصص صالحة", () => {
    const buffer = makeWorkbook(
      [
        ["الاسم", "المستوى", "الشعبة", "المادة", "عدد التلاميذ"],
        ["1 متوسط 1", "السنة الأولى متوسط", "شعبة 1", "التاريخ والجغرافيا", 34],
        ["2 متوسط 3", "السنة الثانية متوسط", "شعبة 2", "التاريخ والجغرافيا", 30],
      ],
      [
        ["القسم", "اليوم", "الحصة", "المادة", "من", "إلى"],
        ["1 متوسط 1", "الأحد", 1, "التاريخ", "08:00", "09:00"],
        ["1 متوسط 1", "الأحد", 2, "الجغرافيا", "09:00", "09:55"],
        ["1 متوسط 1", "الاثنين", 3, "التربية المدنية", "10:05", "11:00"],
        ["2 متوسط 3", "الثلاثاء", 5, "التاريخ", "14:00", "15:00"],
      ],
    );

    const result = parseImportExcelWorkbook(buffer);
    expect(result.classes).toHaveLength(2);
    expect(result.classes[0].name).toBe("1 متوسط 1");
    expect(result.classes[0].gradeLevel).toBe("السنة الأولى متوسط");
    expect(result.classes[0].studentCount).toBe(34);
    expect(result.schedule).toHaveLength(4);
    expect(result.schedule[0]).toEqual({
      className: "1 متوسط 1",
      dayOfWeek: "الأحد",
      periodIndex: 1,
      subject: "التاريخ",
      startTime: "08:00",
      endTime: "09:00",
    });
    expect(result.issues).toHaveLength(0);
  });

  it("يقيّد رقم الحصة بين 1 و7 ويكتشف صفوف الجدول غير الصالحة", () => {
    const buffer = makeWorkbook(
      [["الاسم", "المستوى", "الشعبة", "المادة", "عدد التلاميذ"], ["3 متوسط 2", "السنة الثالثة متوسط", "شعبة 1", "", 28]],
      [
        ["القسم", "اليوم", "الحصة", "المادة", "من", "إلى"],
        ["3 متوسط 2", "الجمعة", 1, "التاريخ", "08:00", "09:00"],
        ["3 متوسط 2", "الأربعاء", 10, "الجغرافيا", "14:00", "15:00"],
        ["3 متوسط 2", "الخميس", 4, "الرياضيات", "11:00", "12:00"],
        ["3 متوسط 2", "الأحد", 2, "التاريخ", "08:60", "09:00"],
      ],
    );

    const result = parseImportExcelWorkbook(buffer);
    expect(result.schedule).toHaveLength(4);
    expect(result.schedule[0].dayOfWeek).toBeNull();
    expect(result.schedule[1].periodIndex).toBe(7);
    expect(result.schedule[2].subject).toBeNull();
    expect(result.schedule[3].startTime).toBeNull();
    // كل صف غير صالح يضيف ملاحظة واحدة؛ يوم «الجمعة» ورقم الحصة 10 والمادة «الرياضيات» والتوقيت «08:60» كلها تُكتشف.
    expect(result.issues.length).toBeGreaterThanOrEqual(3);
  });

  it("يرفض الملفات التالفة برمياً بدل الانهيار", () => {
    // ملف نصي عادي ليس أرشيف ZIP؛ xlsx يرمي خطأ قراءة بدل إرجاع بيانات مضللة.
    const textBuffer = Buffer.from("this is not a zip archive at all, just plain text");
    expect(() => parseImportExcelWorkbook(textBuffer)).toThrow();
  });

  it("يتجاهل الصفوف الفارغة ورأس الورقة", () => {
    const buffer = makeWorkbook(
      [
        ["الاسم", "المستوى", "الشعبة", "المادة", "عدد التلاميذ"],
        [null, null, null, null, null],
        ["4 متوسط 2", "السنة الرابعة متوسط", "شعبة 1", "", 26],
        [""],
      ],
      [
        ["القسم", "اليوم", "الحصة", "المادة", "من", "إلى"],
        [],
        ["4 متوسط 2", "الاثنين", 1, "التاريخ", "08:00", "09:00"],
      ],
    );

    const result = parseImportExcelWorkbook(buffer);
    expect(result.classes).toHaveLength(1);
    expect(result.schedule).toHaveLength(1);
  });
});
