/**
 * A4 Print — طباعة احترافية A4 باللغة العربية (RTL) مع الترويسة الرسمية الجزائرية.
 *
 * الترويسة الرسمية تتضمن:
 * - الجمهورية الجزائرية الديمقراطية الشعبية + وزارة التربية الوطنية (يمين)
 * - المديرية: الولاية / المؤسسة التعليمية (يسار)
 * - الأستاذ(ة) / المادة / المستوى والقسم / المدة / التاريخ
 * - عنوان الوثيقة في الوسط
 *
 * عند الطباعة (@media print): تخفي CSS كل عناصر الصفحة ويُظهر فقط
 * العنصر الذي يحمل الفئة .print-container مع ترويسته الرسمية وتذييله.
 */
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePrintQrCodes } from "@/hooks/usePrintQrCodes";
import { OfficialDocumentFooter, OfficialDocumentHeader } from "@/components/OfficialDocumentChrome";

const NIBRAS_BASE_URL = (() => {
  if (typeof window !== "undefined") return window.location.origin;
  return "";
})();

export const LOGO_URL = "/manus-storage/nibras-bilingual-lockup_5621b048.svg";
// نسخة الشعار المزدوج باللغتين: «نبراس» بخط Amiri و«NIBRAS» بخط Latin Modern Roman، بينهما خط رفيع عمودي.

export interface PrintMeta {
  /** عنوان الوثيقة، مثل: "مذكرة بيداغوجية" أو "اختبار فصلي في التاريخ والجغرافيا" */
  title: string;
  /** سطر فرعي تحت العنوان */
  subtitle?: string;
  /** اسم الأستاذ من الملف الشخصي (تُخفى الهوية البرمجية من التذييل التزامًا بحياد الوثائق الرسمية) */
  teacherName?: string;
  /** اسم المؤسسة التعليمية (المدرسة المتوسطة) */
  school?: string;
  /** الولاية أو المديرية */
  province?: string;
  /** المادة، مثل: التاريخ والجغرافيا / التربية المدنية */
  subject?: string;
  /** المستوى والقسم، مثل: السنة الرابعة متوسط - القسم 2 */
  levelSection?: string;
  /** المدة الزمنية، مثل: ساعة ونصف */
  duration?: string;
  /** تاريخ الحصة أو الاختبار بصيغة نصية عربية */
  date?: string;
  /** معلومات إضافية تظهر في سطر مستقل (مثل: الموسم الدراسي أو رقم الفرض) */
  extra?: string;
  /** الرقم التسلسلي الرسمي للوثيقة (يُطبَع مع رمز QR للتحقق) */
  serialNumber?: string;
  /** وقت نهاية الاختبار (millis) — إن وُجد يُطبع تحته رمز QR لنموذج الإجابات المؤقت */
  examEndsAt?: number | null;
  /** محتوى الوثيقة القابل للطباعة */
  children?: React.ReactNode;
}

/** زر الطباعة: يستدعي window.print() مع إخفاء نفسه أثناء الطباعة */
export function A4PrintButton(props: Omit<PrintMeta, "children"> & { className?: string }) {
  const { className } = props;
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("print:hidden", className)}
      onClick={() => window.print()}
    >
      <Printer className="w-4 h-4 ml-1" />
      طباعة A4
    </Button>
  );
}

/**
 * غلاف الطباعة الاحترافية.
 * - على الشاشة: يعرض عنوان الوثيقة فقط (الترويسة الرسمية تُخفى بـ print:hidden).
 * - عند الطباعة (@media print): تظهر الترويسة الرسمية كاملة والتذييل ورقم الصفحة.
 */
export function A4PrintContent({
  title,
  subtitle,
  teacherName,
  school,
  province,
  subject,
  levelSection,
  duration,
  date,
  extra,
  serialNumber,
  examEndsAt,
  children,
}: PrintMeta) {
  const qrCodeUrls = usePrintQrCodes(serialNumber, examEndsAt);
  return (
    <div className="print-container" dir="rtl">
      <div className="print-hidden-screen">
        <OfficialDocumentHeader meta={{ title, subtitle, teacherName, school, province, subject, levelSection, duration, date, extra, serialNumber, examEndsAt }} />
      </div>
      {/* عنوان مبسط للمعاينة على الشاشة فقط */}
      <div className="screen-only print-container-preview-title">
        <h1 className="text-xl font-bold mb-1">
          {title}
          {subject ? <> — {subject}</> : null}
        </h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {/* ===== محتوى الوثيقة ===== */}
      <div className="print-body">{children}</div>
      {/* ===== تذييل: الترويسة البصرية، الرمز التسلسلي، رموز QR للتحقق والإجابات ===== */}
      <OfficialDocumentFooter title={title} subject={subject}>
        {serialNumber && (
          <div className="print-qr-block">
            {qrCodeUrls.verification && (
              <div className="print-qr-item">
                <img src={qrCodeUrls.verification} alt="QR التحقق" className="print-qr-img" />
                <span className="print-qr-caption">تحقق من الوثيقة</span>
              </div>
            )}
            {qrCodeUrls.answer && (
              <div className="print-qr-item">
                <img src={qrCodeUrls.answer} alt="QR نموذج الإجابات" className="print-qr-img" />
                <span className="print-qr-caption">أفحص الرمز للحصول على الإجابة النموذجية</span>
              </div>
            )}
            <span className="print-serial" dir="ltr">{serialNumber}</span>
          </div>
        )}
      </OfficialDocumentFooter>
    </div>
  );
}
