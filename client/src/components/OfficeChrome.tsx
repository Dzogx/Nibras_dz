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
