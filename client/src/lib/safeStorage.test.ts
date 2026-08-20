import { describe, expect, it, vi } from "vitest";
import { safelySetStorageItem } from "./safeStorage";

describe("safelySetStorageItem", () => {
  it("يحفظ القيمة عند إتاحة التخزين", () => {
    const setItem = vi.fn();

    const result = safelySetStorageItem({ setItem }, "session", "teacher");

    expect(result).toBe(true);
    expect(setItem).toHaveBeenCalledWith("session", "teacher");
  });

  it("لا يرمي خطأ عندما يحجب المتصفح التخزين", () => {
    const setItem = vi.fn(() => {
      throw new Error("Storage access denied");
    });

    expect(safelySetStorageItem({ setItem }, "session", "teacher")).toBe(false);
  });

  it("يتعامل مع غياب واجهة التخزين", () => {
    expect(safelySetStorageItem(null, "session", "teacher")).toBe(false);
  });
});
