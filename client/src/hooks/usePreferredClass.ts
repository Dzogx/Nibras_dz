import { useCallback, useState } from "react";

const PREFERRED_CLASS_KEY = "nibras.preferred-class-id";

function readPreferredClassId(): number | undefined {
  if (typeof window === "undefined") return undefined;
  const stored = Number(window.localStorage.getItem(PREFERRED_CLASS_KEY));
  return Number.isInteger(stored) && stored > 0 ? stored : undefined;
}

/**
 * يحتفظ بالقسم الذي يعمل عليه الأستاذ غالباً، كي لا يعيد اختياره عند
 * الانتقال بين لوحة الحصة والمذكرة والتقويم والنتائج.
 */
export function usePreferredClass() {
  const [preferredClassId, setPreferredClassState] = useState<number | undefined>(readPreferredClassId);

  const setPreferredClassId = useCallback((classId: number | undefined) => {
    setPreferredClassState(classId);
    if (typeof window === "undefined") return;
    if (classId) window.localStorage.setItem(PREFERRED_CLASS_KEY, String(classId));
    else window.localStorage.removeItem(PREFERRED_CLASS_KEY);
  }, []);

  return [preferredClassId, setPreferredClassId] as const;
}
