import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ExpertTour from "./ExpertTour";

describe("جولة الخبير العامة", () => {
  it("تعرض حدود القراءة فقط ولا تسرب بيانات مساحة الأستاذ في المخرج الثابت", () => {
    const markup = renderToStaticMarkup(<ExpertTour />);

    expect(markup).toContain("قراءة فقط");
    expect(markup).toContain("لا تطلب حساباً");
    expect(markup).not.toContain("الهاشمي عبيدلي");
  });
});
