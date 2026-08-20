import { describe, expect, it } from "vitest";
import { getInstallGuidance, isAppleMobile } from "./pwa";

describe("PWA install guidance", () => {
  it("detects iPhone, iPad and iPod user agents", () => {
    expect(isAppleMobile("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(true);
    expect(isAppleMobile("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe(true);
    expect(isAppleMobile("Mozilla/5.0 (Linux; Android 14)")).toBe(false);
  });

  it("gives Arabic Safari guidance for Apple mobile and generic Android guidance elsewhere", () => {
    expect(getInstallGuidance("iPhone")).toContain("Safari");
    expect(getInstallGuidance("Android")).toContain("تثبيت التطبيق");
  });
});
