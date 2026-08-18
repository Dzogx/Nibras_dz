import { describe, expect, it } from "vitest";
import { groupWeeklyScheduleByDay } from "./weeklyPlan";

describe("groupWeeklyScheduleByDay", () => {
  it("keeps all school days and orders each day's sessions by period", () => {
    const weeklyPlan = groupWeeklyScheduleByDay([
      { dayOfWeek: "الأحد", periodIndex: 4, id: "late" },
      { dayOfWeek: "الأربعاء", periodIndex: 2, id: "wednesday" },
      { dayOfWeek: "الأحد", periodIndex: 1, id: "early" },
    ]);

    expect(weeklyPlan.map((day) => day.day)).toEqual(["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"]);
    expect(weeklyPlan[0].slots.map((slot) => slot.id)).toEqual(["early", "late"]);
    expect(weeklyPlan[1].slots).toEqual([]);
    expect(weeklyPlan[3].slots.map((slot) => slot.id)).toEqual(["wednesday"]);
  });
});
