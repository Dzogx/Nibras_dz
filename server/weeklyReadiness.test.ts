import { describe, expect, it } from "vitest";
import { buildWeeklyReadiness } from "../shared/seasonReadiness";

describe("buildWeeklyReadiness", () => {
  const schedule = [
    { classId: 1, dayOfWeek: "الأحد", periodIndex: 1, subject: "التاريخ" },
    { classId: 1, dayOfWeek: "الأحد", periodIndex: 2, subject: "الجغرافيا" },
    { classId: 1, dayOfWeek: "الاثنين", periodIndex: 3, subject: "التربية المدنية" },
    { classId: 2, dayOfWeek: "الاثنين", periodIndex: 1, subject: "التاريخ" },
    { classId: 2, dayOfWeek: "الثلاثاء", periodIndex: 2, subject: "الجغرافيا" },
  ];
  // قسمان بمخططين مستقلين: القسم الأول لديه وضعية مؤجلة، والقسم الثاني وضعيات منجزة ومتبقية فقط.
  const situationsClass1 = [
    { id: 10, situationNumber: 1, title: "وضعية 1", isCompleted: true, sessionStatus: null },
    { id: 11, situationNumber: 2, title: "وضعية 2", isCompleted: false, sessionStatus: "postponed" },
    { id: 12, situationNumber: 3, title: "وضعية 3", isCompleted: false, sessionStatus: null },
  ];
  const situationsClass2 = [
    { id: 20, situationNumber: 1, title: "وضعية 1", isCompleted: true, sessionStatus: null },
    { id: 21, situationNumber: 2, title: "وضعية 2", isCompleted: false, sessionStatus: null },
  ];

  it("يحسب الوضعية التالية وحصص الأسبوع المتبقية لكل قسم", () => {
    const result = buildWeeklyReadiness(
      schedule,
      [
        { id: 1, classId: 1, subject: "التاريخ", situationId: 10, situationTitle: "وضعية 1", isCompleted: true },
        { id: 2, classId: 2, subject: "التاريخ", situationId: 20, situationTitle: "وضعية 1", isCompleted: true },
      ],
      [...situationsClass1, ...situationsClass2],
    );

    // الوضعيات تمرر جماعية ولا تُقسَّم حسب القسم؛ لذا «التالية» والتأجيل يُحسبان على المستوى العام في هذا الإصدار.
    const class1 = result.items.find((item) => item.classId === 1)!;
    expect(class1.nextSituation?.id).toBe(11);
    expect(class1.pendingHours).toBe(2);
    expect(class1.pendingBySubject["الجغرافيا"]).toBe(1);
    expect(class1.pendingBySubject["التربية المدنية"]).toBe(1);
    expect(class1.hasDeferred).toBe(true);
    const class2 = result.items.find((item) => item.classId === 2)!;
    expect(class2.nextSituation?.id).toBe(11);
    expect(class2.hasDeferred).toBe(true);
    expect(result.classesWithDeferred).toBe(2);
    expect(result.totalScheduledHours).toBe(5);
    expect(result.totalPendingHours).toBe(3);
  });

  it("يعرض قسمًا بلا جدول خاليًا", () => {
    const result = buildWeeklyReadiness([], [], []);
    expect(result.items).toHaveLength(0);
    expect(result.totalPendingHours).toBe(0);
  });

  it("لا يعد الحصص التي ليست من مواد الموسم", () => {
    const result = buildWeeklyReadiness(
      [{ classId: 1, dayOfWeek: "الأحد", periodIndex: 1, subject: "الرياضيات" }],
      [],
      [],
    );
    expect(result.items[0].pendingHours).toBe(0);
    expect(result.items[0].nextSituation).toBeNull();
  });
});
