import { useMemo } from "react";
import { useLocation } from "wouter";
import { CalendarDays, Clock3, FileText, Sparkles, BookOpenCheck, MapPinned } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { buildQuickLessonPath, findReadyLessonPlan } from "@shared/quick-click";
import { groupWeeklyScheduleByDay } from "@shared/weeklyPlan";

type ScheduleSlot = {
  id: number;
  classId: number;
  dayOfWeek: string;
  periodIndex: number;
  subject: string;
  startTime: string;
  endTime: string;
  room?: string | null;
};

type PlanResource = {
  id: number;
  type: string;
  classId: number | null;
  metadata: unknown;
};

type ClassSummary = {
  id: number;
  name: string;
  gradeLevel?: string | null;
};

const subjectLabels: Record<string, string> = {
  "التاريخ": "تاريخ",
  "الجغرافيا": "جغرافيا",
  "التربية المدنية": "تربية مدنية",
};

function WeeklySessionCard({
  slot,
  classItem,
  academicYear,
  resources,
}: {
  slot: ScheduleSlot;
  classItem?: ClassSummary;
  academicYear: string;
  resources?: PlanResource[];
}) {
  const [, setLocation] = useLocation();
  const { data: context, isLoading, isError } = trpc.ai.getTeacherOSContext.useQuery({
    classId: slot.classId,
    academicYear,
    subject: slot.subject,
  });
  const nextSituation = context?.nextSituation;
  const readyLessonPlan = findReadyLessonPlan(resources, slot.classId, nextSituation?.id);
  const subjectLabel = subjectLabels[slot.subject] ?? slot.subject;

  return (
    <article className="rounded-xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold leading-6 text-foreground">{classItem?.name ?? "قسم غير متاح"}</p>
          <p className="text-xs text-muted-foreground">{classItem?.gradeLevel ?? ""}</p>
        </div>
        <Badge variant="secondary" className="shrink-0">{subjectLabel}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{slot.startTime}–{slot.endTime}</span>
        {slot.room && <span className="inline-flex items-center gap-1"><MapPinned className="h-3.5 w-3.5" />{slot.room}</span>}
      </div>

      <div className="mt-4 min-h-20 border-t pt-3">
        {isLoading ? (
          <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-full" /></div>
        ) : isError ? (
          <p className="text-sm leading-6 text-destructive">تعذر جلب سياق الحصة الآن. أعد المحاولة لاحقاً.</p>
        ) : nextSituation ? (
          <>
            <p className="text-xs text-muted-foreground">الوضعية التالية · المقطع {context?.currentSection?.number}</p>
            <p className="mt-1 line-clamp-2 text-sm font-medium leading-6">{nextSituation.title}</p>
          </>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">لا توجد وضعية تالية متاحة لهذه المادة. راجع نسختك الصفية من المخطط.</p>
        )}
      </div>

      {nextSituation ? (
        <Button
          size="sm"
          className="mt-3 w-full"
          variant={readyLessonPlan ? "outline" : "default"}
          onClick={() => setLocation(readyLessonPlan ? `/content-library/${readyLessonPlan.id}` : buildQuickLessonPath(nextSituation.id))}
        >
          {readyLessonPlan ? <FileText className="ml-2 h-4 w-4" /> : <Sparkles className="ml-2 h-4 w-4" />}
          {readyLessonPlan ? "افتح مذكرة الحصة" : "حضّر مذكرة الحصة"}
        </Button>
      ) : (
        <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setLocation("/annual-plans")}>
          <BookOpenCheck className="ml-2 h-4 w-4" />راجع المخطط
        </Button>
      )}
    </article>
  );
}

export default function WeeklyPlan() {
  const [, setLocation] = useLocation();
  const { data: profile } = trpc.profile.get.useQuery();
  const academicYear = profile?.academicYear || "2025-2026";
  const { data: schedule, isLoading: scheduleLoading } = trpc.weeklySchedule.get.useQuery({ academicYear });
  const { data: classes } = trpc.classes.list.useQuery();
  const { data: resources } = trpc.aiResources.list.useQuery();

  const seasonClasses = useMemo(
    () => (classes ?? []).filter((classItem) => !classItem.academicYear || classItem.academicYear === academicYear),
    [classes, academicYear],
  );
  const classesById = useMemo(
    () => new Map(seasonClasses.map((classItem) => [classItem.id, classItem as ClassSummary])),
    [seasonClasses],
  );
  const weekDays = useMemo(
    () => groupWeeklyScheduleByDay((schedule ?? []) as ScheduleSlot[]),
    [schedule],
  );
  const weeklySessionCount = schedule?.length ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="nibras-glow-pattern rounded-2xl nibras-card-hero p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white"><CalendarDays className="h-5 w-5" /></span>
            <div>
              <p className="text-sm text-white/75">خطة العمل المتكررة</p>
              <h1 className="mt-1 text-xl font-bold md:text-2xl">خطة الأسبوع</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">راجع حصصك القادمة، وضعياتها الرسمية، وجاهزية مذكراتها قبل بداية كل يوم.</p>
            </div>
          </div>
          <Badge className="border-white/15 bg-white/10 px-3 py-1.5 text-white hover:bg-white/10">{weeklySessionCount} حصة أسبوعية · {academicYear}</Badge>
        </div>
      </section>

      {scheduleLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-xl" />)}
        </div>
      ) : weeklySessionCount === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="h-5 w-5" /></span>
            <div>
              <h2 className="font-bold">لم يُسجَّل جدول خدمة لهذا الموسم بعد</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">أدخل حصص التاريخ والجغرافيا والتربية المدنية مرة واحدة، وستظهر هنا تلقائياً مع وضعياتها التالية.</p>
            </div>
            <Button onClick={() => setLocation("/season-setup")}>إعداد جدول الخدمة</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {weekDays.map(({ day, slots }) => (
            <Card key={day} className={slots.length === 0 ? "border-dashed bg-muted/20" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-lg">{day}</CardTitle>
                  <Badge variant="outline">{slots.length} {slots.length === 1 ? "حصة" : "حصص"}</Badge>
                </div>
                <CardDescription>{slots.length ? "حضّر الحصة التالية لكل بطاقة قبل موعدها." : "لا توجد حصة مجدولة في هذا اليوم."}</CardDescription>
              </CardHeader>
              {slots.length > 0 && (
                <CardContent className="space-y-3">
                  {slots.map((slot) => (
                    <WeeklySessionCard
                      key={slot.id}
                      slot={slot}
                      classItem={classesById.get(slot.classId)}
                      academicYear={academicYear}
                      resources={resources as PlanResource[] | undefined}
                    />
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
