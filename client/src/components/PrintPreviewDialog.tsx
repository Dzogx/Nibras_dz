/**
 * PrintPreviewDialog — نافذة معاينة قبل الطباعة.
 *
 * تعرض الوثيقة كما ستُطبع فعلياً:
 * - صفحة A4 بيضاء بمحاكاة بصرية دقيقة (ظل وحواف صفحة)
 * - الترويسة الرسمية الجزائرية (وزارة التربية / المؤسسة / الأستاذ / المادة / المستوى / المدة / التاريخ)
 * - التذييل مع اسم نبراس
 *
 * أزرار: «طباعة الآن» (window.print على الصفحة المعروضة فعلاً) + «إغلاق».
 */
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PrintMeta } from "@/components/A4Print";
import { cn } from "@/lib/utils";

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta: Omit<PrintMeta, "children">;
  children: React.ReactNode;
}

export function PrintPreviewDialog({ open, onOpenChange, meta, children }: PrintPreviewDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] w-[900px] max-h-[92vh] p-0 gap-0 overflow-hidden" dir="rtl">
        <DialogHeader className="px-5 pt-4 pb-2 border-b bg-muted/40 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base">معاينة قبل الطباعة</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                هذا هو شكل الوثيقة على صفحة A4 بالترويسة الرسمية والتذييل
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 ml-1" />
                طباعة الآن
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
                إغلاق
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* منطقة المعاينة: خلفية رمادية تحاكي سطح المكتب، والصفحة بيضاء بحجم A4 */}
        <div className="flex-1 overflow-y-auto bg-neutral-200/80 px-4 py-6 min-h-0">
          {/* صفحة A4 محاكاة (210mm × 297mm بمقياس 72% لعرضها داخل الشاشة) */}
          <div
            className="print-preview-page mx-auto"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "16mm 14mm 20mm 14mm",
              background: "#ffffff",
              boxShadow: "0 4px 24px rgba(15, 23, 42, 0.18)",
              fontSize: "12pt",
              lineHeight: "1.8",
              fontFamily: "'Noto Naskh Arabic', 'Cairo', sans-serif",
              color: "#0f172a",
            }}
          >
            {/* الترويسة الرسمية الجزائرية (تطابق نسخة الطباعة تماماً) */}
            <div className="print-header-official">
              <div className="print-header-row print-header-top">
                <div className="print-header-right">
                  <div className="print-republic">الجمهورية الجزائرية الديمقراطية الشعبية</div>
                  <div className="print-ministry">وزارة التربية الوطنية</div>
                </div>
                <div className="print-header-left">
                  <div className="print-office">مديرية التربية لولاية: {meta.province || "..........................."}</div>
                  <div className="print-office">المؤسسة التعليمية: {meta.school || "..............................."}</div>
                </div>
              </div>
              <div className="print-header-divider" />
              <div className="print-header-fields">
                <div className="print-field">
                  <span className="print-field-label">الأستاذ(ة):</span>
                  <span className="print-field-value">{meta.teacherName || "................................"}</span>
                </div>
                {meta.subject && (
                  <div className="print-field">
                    <span className="print-field-label">المادة:</span>
                    <span className="print-field-value">{meta.subject}</span>
                  </div>
                )}
                {meta.levelSection && (
                  <div className="print-field">
                    <span className="print-field-label">المستوى/القسم:</span>
                    <span className="print-field-value">{meta.levelSection}</span>
                  </div>
                )}
                {meta.duration && (
                  <div className="print-field">
                    <span className="print-field-label">المدة:</span>
                    <span className="print-field-value">{meta.duration}</span>
                  </div>
                )}
                {meta.date && (
                  <div className="print-field">
                    <span className="print-field-label">التاريخ:</span>
                    <span className="print-field-value">{meta.date}</span>
                  </div>
                )}
              </div>
              <div className="print-header-divider" />
              <div className="print-doc-title">
                {meta.title}
                {meta.subtitle ? <span className="print-doc-subtitle">{meta.subtitle}</span> : null}
                {meta.extra ? <span className="print-doc-extra">{meta.extra}</span> : null}
              </div>
            </div>

            {/* محتوى الوثيقة */}
            <div className="print-body">{children}</div>

            {/* التذييل */}
            <div
              className={cn(
                "flex justify-between items-center gap-2",
                "text-[8.5pt] text-slate-500 border-t border-slate-300 pt-1.5 mt-5"
              )}
            >
              <span>نبراس — مساعد التدريس الذكي لأستاذ الاجتماعيات</span>
              <span>صفحة 1</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t bg-muted/40 shrink-0 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            ملاحظة: عند الضغط على «طباعة الآن» تُطبع الوثيقة الكاملة بالترويسة الرسمية والترقيم التلقائي للصفحات.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
            <Button size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 ml-1" />
              طباعة الآن
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
