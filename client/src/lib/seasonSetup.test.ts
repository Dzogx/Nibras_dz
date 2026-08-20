import { describe, expect, it } from "vitest";
import { getSeasonSetupResumeStep } from "./seasonSetup";

describe("getSeasonSetupResumeStep", () => {
  const profile = { displayName: "الهاشمي عبيدلي", school: "متوسطة النور", academicYear: "2026-2027" };

  it("يبدأ من بيانات الأستاذ عند نقص بيانات الترويسة", () => {
    expect(getSeasonSetupResumeStep({ profile: { displayName: "الأستاذ" }, classCount: 0, savedScheduleCount: 0 })).toBe(1);
  });

  it("يفتح أول صفحة ناقصة وفق ما حُفظ فعلاً", () => {
    expect(getSeasonSetupResumeStep({ profile, classCount: 0, savedScheduleCount: 0 })).toBe(2);
    expect(getSeasonSetupResumeStep({ profile, classCount: 3, savedScheduleCount: 0 })).toBe(3);
    expect(getSeasonSetupResumeStep({ profile, classCount: 3, savedScheduleCount: 9 })).toBe(5);
  });
});
