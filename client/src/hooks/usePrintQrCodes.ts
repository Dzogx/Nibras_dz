import { useMemo, useState, useEffect } from "react";
import QRCode from "qrcode";

/**
 * يولّد رموز QR كصور dataURL للطباعة:
 * - رمز التحقق: يعرض صفحة عامة تؤكد إصدار الوثيقة من منصة نبراس.
 * - رمز نموذج الإجابات: يعرض صفحة الكشف المؤقت التي تُفعَّل فقط بعد نهاية الاختبار.
 * يستخدم useEffect داخلياً لتحويل الاستجابة إلى string جاهز للرسم.
 */
export interface PrintQrCodes {
  verification?: string;
  answer?: string;
}

export function usePrintQrCodes(serialNumber?: string, examEndsAt?: number | null) {
  const [urls, setUrls] = useState<PrintQrCodes>({});

  const inputKey = useMemo(() => `${serialNumber ?? ""}:${examEndsAt ?? ""}`, [serialNumber, examEndsAt]);

  useEffect(() => {
    let cancelled = false;
    if (!serialNumber) {
      setUrls({});
      return;
    }

    const base = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    const safeSerial = encodeURIComponent(serialNumber.trim());
    if (!safeSerial) return;

    void Promise.all([
      QRCode.toDataURL(`${base}/verify?serial=${safeSerial}`, { margin: 1, scale: 6, errorCorrectionLevel: "M" })
        .catch(() => undefined),
      examEndsAt
        ? QRCode.toDataURL(`${base}/verify/answer/${safeSerial}`, { margin: 1, scale: 6, errorCorrectionLevel: "M" })
            .catch(() => undefined)
        : Promise.resolve(undefined),
    ]).then(([verification, answer]) => {
      if (!cancelled) setUrls({ verification, answer });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputKey]);

  return urls;
}
