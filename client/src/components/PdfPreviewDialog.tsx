import { Download, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string | null;
  filename?: string;
  isLoading?: boolean;
  onDownload: () => void;
}

/** معاينة ملف PDF المنتج فعلياً من XeLaTeX، لا محاكاة HTML للطباعة. */
export function PdfPreviewDialog({ open, onOpenChange, pdfUrl, filename, isLoading, onDownload }: PdfPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-[980px] h-[92vh] p-0 gap-0 overflow-hidden" dir="rtl">
        <DialogHeader className="px-5 pt-4 pb-3 border-b bg-muted/40 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base">معاينة PDF الاحترافية</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                هذه النسخة مُولّدة فعلياً من قالب الطباعة المختار وجاهزة للتنزيل.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" onClick={onDownload} disabled={!pdfUrl || isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Download className="w-4 h-4 ml-1" />}
                تنزيل PDF
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4 ml-1" />إغلاق
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 bg-muted/70 p-2 sm:p-4">
          {pdfUrl ? (
            <iframe title={filename || "معاينة PDF"} src={pdfUrl} className="w-full h-full rounded-md border bg-white" />
          ) : (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">يُجهّز نبراس ملف PDF للمعاينة…</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
