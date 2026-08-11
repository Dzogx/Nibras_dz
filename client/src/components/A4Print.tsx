import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

/**
 * A4 Print component - wraps content in an A4-optimized container
 * and provides a print button that triggers the browser's print dialog.
 * Uses @media print CSS for A4 formatting.
 */
export function A4PrintButton({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="print:hidden"
    >
      <Printer className="w-4 h-4 ml-1" />
      طباعة A4
    </Button>
  );
}

export function A4PrintContent({ children, title, subtitle, className = "" }: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`${className} print-container`} dir="rtl">
      {title && (
        <div className="print-header text-center mb-6 pb-4 border-b-2 border-primary">
          <h1 className="text-xl font-bold mb-1">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-2 text-xs text-muted-foreground">
            الجمهورية الجزائرية الديمقراطية الشعبية - وزارة التربية الوطنية
          </div>
        </div>
      )}
      <div className="print-body">
        {children}
      </div>
    </div>
  );
}
