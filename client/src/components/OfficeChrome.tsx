import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";

/**
 * ترويسة «مكتب الأستاذ»: مسار تربوي صغير + عنوان واضح + إجراء رئيسي واحد.
 * فلسفة: الصفحة لا تسأل «ماذا تريد؟» بل تجيب «ماذا أفعل الآن؟».
 */
export function OfficeHeader({
  crumbs,
  title,
  subtitle,
  children,
}: {
  crumbs?: Array<{ label: string; href?: string }>;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <header className="office-header">
      {crumbs && crumbs.length > 0 ? (
        <Breadcrumb dir="rtl">
          <BreadcrumbList>
            {crumbs.map((c, i) => (
              <BreadcrumbItem key={i}>
                {i < crumbs.length - 1 ? (
                  <>
                    <BreadcrumbLink href={c.href ?? "#"}>{c.label}</BreadcrumbLink>
                    <BreadcrumbSeparator><ChevronLeft className="h-3 w-3 text-muted-foreground" /></BreadcrumbSeparator>
                  </>
                ) : (
                  <BreadcrumbPage>{c.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}
      <h1 className="office-title">{title}</h1>
      {subtitle ? <p className="office-subtitle">{subtitle}</p> : null}
      {children ? <div className="office-header-actions">{children}</div> : null}
    </header>
  );
}

/** مسار خطوات مرقّم أفقي يوضح موقف الأستاذ في أي عملية. */
export function StepTrack({
  steps,
  activeIndex,
}: {
  steps: Array<{ label: string; href?: string; done?: boolean }>;
  activeIndex: number;
}) {
  const [, navigate] = useLocation();
  return (
    <div className="office-track" role="navigation" aria-label="خطوات">
      {steps.map((step, i) => {
        const isDone = i < activeIndex || step.done;
        const isActive = i === activeIndex;
        const content = (
          <>
            <span className={`office-step ${isDone ? "is-done" : ""} ${isActive ? "is-active" : ""}`} aria-hidden="true">
              {isDone ? "✓" : i + 1}
            </span>
            <span>{step.label}</span>
          </>
        );
        return (
          <div
            key={i}
            className={`office-track-item ${isActive ? "is-active" : ""} ${isDone ? "is-done" : ""}`}
            {...(step.href ? { role: "link" as const } : {})}
          >
            {step.href ? (
              <button type="button" onClick={() => navigate(step.href!)} className="contents cursor-pointer">
                {content}
              </button>
            ) : (
              content
            )}
          </div>
        );
      })}
    </div>
  );
}

/** بطاقة ورقة بيضاء بحد ذهبي جانبي — لبطاقات الحصة والموارد. */
export function LessonSheet({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`lesson-sheet p-4 md:p-5 ${className}`}>{children}</div>;
}

/** فاصل قسم بعنوان وقاعدة رفيع. */
export function OfficeSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`office-section ${className}`}>
      <div className="office-section-title">
        <h2>{title}</h2>
        <span className="office-rule" aria-hidden="true" />
      </div>
      {children}
    </section>
  );
}

/** وسم مادة/مستوى مكتبي. */
export function OfficeTag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`office-tag ${className}`}>{children}</span>;
}

/* ============================================================
   Nibras Signature — «المسار المضاء»
   مكونات إبداعية فوق المكتب: مسرح داكن افتتاحي، مسار مضاء، فاصل موقّع.
   ============================================================ */

/** ترويسة مسرح داكنة بتوقيع بصري: توهج ضوئي + عنوان مع سطر علوي ذهبي + مسار مضاء. */
export function StageHeader({
  eyebrow,
  title,
  subtitle,
  track,
  children,
}: {
  /** سطر علوي صغير ذهبي، مثال: «اليوم — الأربعاء 27 جانفي 2027» */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** خطوات مضاءة أعلى المسرح (نمط صفحة اليوم) */
  track?: Array<{ label: string; href?: string; done?: boolean }>;
  children?: ReactNode;
}) {
  return (
    <header className="nb-stage rounded-t-lg md:rounded-lg md:mb-0 px-5 md:px-7 pb-4 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {eyebrow ? <span className="nb-stage-eyebrow">{eyebrow}</span> : null}
          <h1 className="nb-stage-title nb-arrive nb-arrive-d1">{title}</h1>
          {subtitle ? <p className="nb-stage-sub nb-arrive nb-arrive-d2">{subtitle}</p> : null}
        </div>
        {children ? <div className="office-header-actions nb-arrive nb-arrive-d3">{children}</div> : null}
      </div>
      {track && track.length > 0 ? (
        <StageTrack steps={track} className="nb-arrive nb-arrive-d4" />
      ) : null}
    </header>
  );
}

/** مسار خطوات مضاء داخل المسرح الداكن مع موصلات خطية. */
export function StageTrack({
  steps,
  className = "",
}: {
  steps: Array<{ label: string; href?: string; done?: boolean }>;
  className?: string;
}) {
  const [, navigate] = useLocation();
  return (
    <div className={`nb-stage-track ${className}`} role="navigation" aria-label="خطوات">
      {steps.map((step, i) => {
        const isDone = i < steps.length - 1 && (i === 0 || step.done);
        const isActive = !isDone && (i === 0 || steps[i - 1].done || !steps[i - 1].done);
        // الخطوة النشطة = أول خطوة غير منجزة؛ المنجزة هي تلك الموسومة done
        const nodeState = step.done ? "is-done" : i === steps.findIndex(s => !s.done) ? "is-active" : "";
        const content = (
          <>
            <span className="nb-stage-node__dot" aria-hidden="true">
              {step.done ? "✓" : i + 1}
            </span>
            <span className="nb-stage-node__label">{step.label}</span>
          </>
        );
        return (
          <div key={i} className={`nb-stage-node ${nodeState}`} {...(step.href ? { role: "link" as const } : {})}>
            {step.href ? (
              <button type="button" onClick={() => navigate(step.href!)} className="contents cursor-pointer">
                {content}
              </button>
            ) : (
              content
            )}
            {i < steps.length - 1 ? <span className="nb-stage-connector" aria-hidden="true" /> : null}
          </div>
        );
      })}
    </div>
  );
}

/** فاصل قسم بتوقيع نبراس: خط مضاء ينتهي بنقطة ضوء + عنوان. */
export function SignatureSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`office-section ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="nb-lum nb-lum-ink" aria-hidden="true" />
        <h2 className="text-lg font-extrabold text-foreground">{title}</h2>
        <span className="flex-1 h-px bg-brand-ink-200" aria-hidden="true" />
      </div>
      {children}
    </section>
  );
}

/** خط مسار عمودي بلحظات متسلسلة (timeline). */
export function Trail({ children }: { children: ReactNode }) {
  return <div className="nb-trail">{children}</div>;
}

/** لحظة في المسار العمودي. */
export function TrailItem({
  title,
  children,
  state = "upcoming",
  className = "",
}: {
  title: string;
  children: ReactNode;
  /** upcoming | current | done */
  state?: "upcoming" | "current" | "done";
  className?: string;
}) {
  return (
    <div className={`nb-trail-item ${state === "current" ? "is-current" : ""} ${state === "done" ? "is-done" : ""} ${className}`}>
      <div className="nb-lum nb-story__title" style={{ fontSize: "1rem", marginBottom: "0.2rem" }}>
        {title}
      </div>
      {children}
    </div>
  );
}
