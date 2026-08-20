type StorageWriter = Pick<Storage, "setItem">;

/**
 * يكتب قيمة اختيارية في تخزين المتصفح دون أن يسمح لقيود الخصوصية أو WebView
 * بإسقاط واجهة التطبيق. بعض متصفحات الهاتف تحجب localStorage رغم اكتمال OAuth.
 */
export function safelySetStorageItem(
  storage: StorageWriter | null | undefined,
  key: string,
  value: string
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safelySetLocalStorageItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  return safelySetStorageItem(window.localStorage, key, value);
}
