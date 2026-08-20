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
import { OfficialDocumentFooter, OfficialDocumentHeader } from "@/components/OfficialDocumentChrome";

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
      <DialogContent className="w-[min(94vw,900px)] max-h-[92vh] p-0 gap-0 overflow-hidden rounded-2xl" dir="rtl">
        <DialogHeader className="px-5 pt-4 pb-3 border-b bg-brand-sand-50 shrink-0">
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
        <div className="print-preview-surface flex-1 overflow-y-auto px-4 py-6 min-h-0">
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
            <OfficialDocumentHeader meta={meta} />

            {/* محتوى الوثيقة */}
            <div className="print-body">{children}</div>

            {/* التذييل */}
            <OfficialDocumentFooter title={meta.title} subject={meta.subject} pageLabel="صفحة 1">
              {meta.serialNumber && <span className="print-serial" dir="ltr">{meta.serialNumber}</span>}
            </OfficialDocumentFooter>
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
