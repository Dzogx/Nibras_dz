import { useEffect, useRef, useState } from "react";

/**
 * يحفظ إعدادات النموذج تلقائيًا في localStorage ويستعيدها عند فتح الصفحة لاحقًا.
 * هدفه تقليل إعادة الإدخال المتكرر في مولد الدروس واستوديو التقويمات.
 *
 * @param key مفتاح التخزين الفريد (مثال "nibras.lesson-generator")
 * @param initialValue القيم الافتراضية للنموذج
 */
export function usePersistedForm<T extends Record<string, unknown>>(
  key: string,
  initialValue: T,
  /** دمج القيم المحفوظة مع الافتراضية — افتراضيًا دمج سطحي */
  merge: (defaults: T, saved: Partial<T>) => T = (defaults, saved) => ({ ...defaults, ...saved }) as T
) {
  const [form, setForm] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) return merge(initialValue, JSON.parse(raw));
    } catch {
      /* تجاهل أي بيانات فاسدة */
    }
    return initialValue;
  });

  // حفظ متغيّر أولي لتتبع ما إذا كانت الحالة الحالية من localStorage أم من تعبئة رابط مباشر
  const wasRestored = useRef(false);
  useEffect(() => {
    try {
      wasRestored.current = Boolean(window.localStorage.getItem(key));
    } catch {
      wasRestored.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(form));
    } catch {
      /* localStorage غير متاح */
    }
  }, [key, form]);

  /** يمحو الإعدادات المحفوظة صراحة (بعد توليد ناجح يمكن الاستمرار، لا نمسحها) */
  const clearSaved = () => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* تجاهل */
    }
  };

  return { form, setForm, wasRestored: () => wasRestored.current, clearSaved };
}
