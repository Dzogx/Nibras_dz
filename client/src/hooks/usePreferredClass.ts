import { useCallback, useEffect, useState } from "react";

const PREFERRED_CLASS_KEY = "nibras.preferred-class-id";

function getPreferredClassKey(academicYear?: string): string {
  return academicYear ? `${PREFERRED_CLASS_KEY}:${academicYear}` : PREFERRED_CLASS_KEY;
}

function readPreferredClassId(academicYear?: string): number | undefined {
  if (typeof window === "undefined") return undefined;
  const stored = Number(window.localStorage.getItem(getPreferredClassKey(academicYear)));
  return Number.isInteger(stored) && stored > 0 ? stored : undefined;
}

/**
 * يحتفظ بالقسم الذي يعمل عليه الأستاذ غالباً داخل موسم محدد، كي لا يعود
 * قسم من موسم سابق عند الانتقال بين لوحة الحصة والمذكرة والتقويم والنتائج.
 */
export function usePreferredClass(academicYear?: string) {
  const storageKey = getPreferredClassKey(academicYear);
  const [preferredClassId, setPreferredClassState] = useState<number | undefined>(() => readPreferredClassId(academicYear));

  useEffect(() => {
    setPreferredClassState(readPreferredClassId(academicYear));
  }, [academicYear, storageKey]);

  const setPreferredClassId = useCallback((classId: number | undefined) => {
    setPreferredClassState(classId);
    if (typeof window === "undefined") return;
    if (classId) window.localStorage.setItem(storageKey, String(classId));
    else window.localStorage.removeItem(storageKey);
  }, [storageKey]);

  return [preferredClassId, setPreferredClassId] as const;
}
