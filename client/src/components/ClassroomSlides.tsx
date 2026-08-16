import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, X, Maximize2, Minimize2, Printer, Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { lessonToSlides, type SlidesSource, type Slide } from "@shared/slides";

interface ClassroomSlidesProps {
  source: SlidesSource;
  onClose?: () => void;
}

const KIND_LABELS: Record<Slide["kind"], string> = {
  cover: "الغلاف",
  objectives: "الأهداف",
  stage: "مرحلة",
  assessment: "تقويم",
  closing: "ختام",
};

export function ClassroomSlides({ source, onClose }: ClassroomSlidesProps) {
  const slides = lessonToSlides(source);
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const next = useCallback(() => setIndex(i => Math.min(i + 1, slides.length - 1)), [slides.length]);
  const prev = useCallback(() => setIndex(i => Math.max(i - 1, 0)), []);

  // التنقل بلوحة المفاتيح
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") next();
      else if (e.key === "ArrowRight") prev();
      else if (e.key === " " || e.key === "PageDown") { e.preventDefault(); next(); }
      else if (e.key === "PageUp" || e.key === "Home") prev();
      else if (e.key === "End") setIndex(slides.length - 1);
      else if (e.key === "Escape" && !fullscreen) onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, slides.length, onClose, fullscreen]);

  // أزرار التحكم (يسار/يمين بصريًا حسب الشريحة الحالية)
  const isRtl = true;

  const slide = slides[index];
  if (!slide) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[100] flex flex-col bg-background print:static print:z-auto"
      style={fullscreen ? undefined : undefined}
    >
      {/* شريط علوي (يُخفى عند الطباعة) */}
      <div className="print:hidden flex items-center justify-between border-b bg-card px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <Presentation className="w-4 h-4 text-brand-copper-600" />
          <span className="text-sm font-semibold">خطة العرض الصفي</span>
          <span className="text-xs text-muted-foreground">
            {index + 1} / {slides.length}
            {slide.kind !== "cover" && slide.kind !== "closing" && ` — ${KIND_LABELS[slide.kind]}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setFullscreen(f => !f)} title={fullscreen ? "إلغاء ملء الشاشة" : "ملء الشاشة"}>
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => window.print()} title="طباعة الشرائح">
            <Printer className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} title="إغلاق">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* منطقة الشريحة (عرض تفاعلي) + جميع الشرائح عند الطباعة */}
      <div className="flex-1 overflow-auto flex items-center justify-center print:block print:overflow-visible print:h-auto">
        <div className="w-full max-w-5xl h-full flex items-center justify-center p-6 md:p-12 print:h-auto print:max-w-none print:p-0 print:hidden">
          <SlideView slide={slide} />
        </div>
        {/* نسخة الطباعة: كل الشرائح في تسلسل رأسى */}
        <div className="print:flex print:flex-col print:gap-4 hidden w-full max-w-5xl">
          {slides.map((s, i) => (
            <div key={i} className="print-nibras-slide">
              <SlideView slide={s} />
            </div>
          ))}
        </div>
      </div>

      {/* شريط سفلي للتنقل */}
      <div className="print:hidden flex items-center justify-center gap-3 border-t bg-card px-4 py-2.5">
        <Button variant="outline" size="sm" onClick={prev} disabled={index === 0} className="gap-1">
          <ChevronLeft className="w-4 h-4" />
          <span className={isRtl ? "" : ""}>السابق</span>
        </Button>
        <div className="flex gap-1.5">
          {slides.map((s, i) => (
            <button
              key={i}
              aria-label={`الانتقال إلى الشريحة ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-brand-copper-600" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"}`}
            />
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={next} disabled={index === slides.length - 1} className="gap-1">
          <span>التالي</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function SlideView({ slide }: { slide: Slide }) {
  if (slide.kind === "cover") {
    return (
      <div className="flex flex-col items-center text-center space-y-5 w-full">
        <div className="w-16 h-16 rounded-2xl bg-brand-ink-950 flex items-center justify-center shadow-lg">
          <Presentation className="w-8 h-8 text-brand-copper-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-brand-ink-950 max-w-2xl leading-relaxed">
          {slide.title}
        </h2>
        {slide.body && (
          <div className="space-y-2 text-sm md:text-base text-muted-foreground">
            {slide.body.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
        <div className="w-24 h-1 rounded-full bg-brand-copper-500" />
      </div>
    );
  }

  if (slide.kind === "closing") {
    return (
      <div className="flex flex-col items-center text-center space-y-5">
        <div className="w-16 h-16 rounded-full border-4 border-brand-copper-500 flex items-center justify-center">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-brand-ink-950">نهاية الحصة</h2>
        <p className="text-muted-foreground">شكرًا لتلاميذكم — نراكم في الحصة القادمة</p>
      </div>
    );
  }

  // أهداف / مراحل / تقويم
  const isAssessment = slide.kind === "assessment";
  return (
    <div className="w-full h-full flex flex-col">
      <div className={`mb-4 flex items-center gap-3 border-b-2 pb-3 ${isAssessment ? "border-brand-copper-600" : "border-brand-ink-950"}`}>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isAssessment ? "bg-brand-copper-600 text-copper-50" : "bg-brand-ink-950 text-ink-50"}`}>
          {isAssessment ? "تقويم / وضعيات" : slide.kind === "objectives" ? "الأهداف" : "مرحلة من الحصة"}
        </span>
        <h2 className="text-xl md:text-2xl font-bold text-brand-ink-950">{slide.title}</h2>
      </div>
      <div className="flex-1 overflow-auto">
        <MarkdownRenderer source={slide.body} className="prose max-w-none text-right" />
      </div>
    </div>
  );
}

/* CSS للطباعة: شريحة واحدة لكل صفحة */
/* (تُطبّق عبر @media print في index.css إن لزم — هنا نكتفي بتوزيع بسيط) */
