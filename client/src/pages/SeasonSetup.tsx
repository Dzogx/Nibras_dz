import { Fragment, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { BookCopy, CalendarDays, CheckCircle2, ChevronLeft, CircleAlert, ClipboardList, Clock3, Copy, GraduationCap, ListChecks, Plus, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"] as const;
const GRADE_LEVELS = ["السنة الأولى متوسط", "السنة الثانية متوسط", "السنة الثالثة متوسط", "السنة الرابعة متوسط"];
const SUBJECTS = ["التاريخ والجغرافيا", "الجغرافيا", "التربية المدنية", "التاريخ والجغرافيا والتربية المدنية"];
const SCHEDULE_SUBJECTS = ["التاريخ", "الجغرافيا", "التربية المدنية"] as const;
const DEFAULT_PERIODS = [
  { index: 1, startTime: "08:00", endTime: "09:00" },
  { index: 2, startTime: "09:00", endTime: "09:55" },
  { index: 3, startTime: "10:05", endTime: "11:00" },
  { index: 4, startTime: "11:00", endTime: "12:00" },
  { index: 5, startTime: "14:00", endTime: "15:00" },
  { index: 6, startTime: "15:00", endTime: "15:55" },
  { index: 7, startTime: "16:05", endTime: "17:00" },
];
const BREAKS_AFTER_PERIOD: Record<number, string> = {
  2: "استراحة صباحية · 09:55–10:05",
  6: "استراحة مسائية · 15:55–16:05",
};

type Period = (typeof DEFAULT_PERIODS)[number];
type ScheduleSubject = (typeof SCHEDULE_SUBJECTS)[number];
type SlotDraft = { classId?: number; subject?: ScheduleSubject; room: string };
type ClassDraft = { name: string; gradeLevel: string; subject: string; studentCount: string };

function slotKey(day: string, periodIndex: number) {
  return `${day}-${periodIndex}`;
}

function isScheduleSubject(subject: string | null | undefined): subject is ScheduleSubject {
  return SCHEDULE_SUBJECTS.includes(subject as ScheduleSubject);
}

export default function SeasonSetup() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: profile } = trpc.profile.get.useQuery();
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [periods, setPeriods] = useState<Period[]>(DEFAULT_PERIODS);
  const [schedule, setSchedule] = useState<Record<string, SlotDraft>>({});
  const [scheduleInitialized, setScheduleInitialized] = useState(false);
  const [previousSeason, setPreviousSeason] = useState<string>("");
  const [classDraft, setClassDraft] = useState<ClassDraft>({
    name: "",
    gradeLevel: GRADE_LEVELS[0],
    subject: SUBJECTS[0],
    studentCount: "",
  });

  useEffect(() => {
    if (profile?.academicYear) setAcademicYear(profile.academicYear);
  }, [profile?.academicYear]);

  const { data: classes = [], isLoading: classesLoading } = trpc.classes.list.useQuery();
  const { data: savedSchedule = [], isLoading: scheduleLoading } = trpc.weeklySchedule.get.useQuery({ academicYear });
  const { data: scheduleSeasons = [] } = trpc.weeklySchedule.listSeasons.useQuery();
  const { data: readiness, isLoading: readinessLoading } = trpc.seasonReadiness.get.useQuery({ academicYear });
  const previousScheduleSeasons = useMemo(
    () => scheduleSeasons.filter((season) => season !== academicYear),
    [scheduleSeasons, academicYear],
  );

  const seasonClasses = useMemo(
    () => classes.filter((classItem) => !classItem.academicYear || classItem.academicYear === academicYear),
    [classes, academicYear],
  );
  const readinessByClass = useMemo(
    () => new Map((readiness?.items ?? []).map((item) => [item.classId, item])),
    [readiness],
  );

  useEffect(() => {
    if (scheduleInitialized || scheduleLoading) return;
    const nextSchedule: Record<string, SlotDraft> = {};
    const nextPeriods = DEFAULT_PERIODS.map((period) => ({ ...period }));
    savedSchedule.forEach((entry) => {
      nextSchedule[slotKey(entry.dayOfWeek, entry.periodIndex)] = {
        classId: entry.classId,
        subject: isScheduleSubject(entry.subject) ? entry.subject : "التاريخ",
        room: entry.room || "",
      };
      const period = nextPeriods.find((item) => item.index === entry.periodIndex);
      if (period) {
        period.startTime = entry.startTime;
        period.endTime = entry.endTime;
      }
    });
    setSchedule(nextSchedule);
    setPeriods(nextPeriods);
    setScheduleInitialized(true);
  }, [savedSchedule, scheduleInitialized, scheduleLoading]);

  useEffect(() => {
    setScheduleInitialized(false);
  }, [academicYear]);

  const createClassMutation = trpc.classes.create.useMutation({
    onSuccess: async () => {
      await utils.classes.list.invalidate();
      await utils.seasonReadiness.get.invalidate({ academicYear });
      setClassDraft({ name: "", gradeLevel: GRADE_LEVELS[0], subject: SUBJECTS[0], studentCount: "" });
      toast.success("أُضيف القسم. يمكنك وضعه الآن في جدول الخدمة.");
    },
    onError: (error) => toast.error(error.message || "تعذرت إضافة القسم."),
  });

  const saveScheduleMutation = trpc.weeklySchedule.save.useMutation({
    onSuccess: async (result) => {
      await utils.weeklySchedule.get.invalidate({ academicYear });
      await utils.seasonReadiness.get.invalidate({ academicYear });
      toast.success(`حُفظ جدول الخدمة: ${result.count} حصة أسبوعية.`);
    },
    onError: (error) => toast.error(error.message || "تعذر حفظ جدول الخدمة."),
  });

  const copyScheduleMutation = trpc.weeklySchedule.copyFromSeason.useMutation({
    onSuccess: async (result) => {
      await Promise.all([
        utils.weeklySchedule.get.invalidate({ academicYear }),
        utils.weeklySchedule.listSeasons.invalidate(),
        utils.seasonReadiness.get.invalidate({ academicYear }),
      ]);
      setScheduleInitialized(false);
      toast.success(`نُسخ جدول موسم ${previousSeason}: ${result.count} حصة. راجعه ثم احفظ التعديلات إن وجدت.`);
    },
    onError: (error) => toast.error(error.message || "تعذر نسخ جدول الموسم السابق."),
  });

  const scheduledCount = Object.values(schedule).filter((entry) => entry.classId).length;
  const scheduledSubjectsByClass = useMemo(() => {
    const subjectSets = new Map<number, Set<ScheduleSubject>>();
    Object.values(schedule).forEach((entry) => {
      if (!entry.classId || !entry.subject) return;
      const subjects = subjectSets.get(entry.classId) ?? new Set<ScheduleSubject>();
      subjects.add(entry.subject);
      subjectSets.set(entry.classId, subjects);
    });
    return subjectSets;
  }, [schedule]);

  const suggestSubjectForClass = (classId: number) => {
    const usedSubjects = scheduledSubjectsByClass.get(classId) ?? new Set<ScheduleSubject>();
    return SCHEDULE_SUBJECTS.find((subject) => !usedSubjects.has(subject)) ?? SCHEDULE_SUBJECTS[0];
  };

  const updateSlot = (day: string, periodIndex: number, update: Partial<SlotDraft>) => {
    const key = slotKey(day, periodIndex);
    setSchedule((current) => ({
      ...current,
      [key]: { ...(current[key] ?? { room: "" }), ...update },
    }));
  };

  const clearSlot = (day: string, periodIndex: number) => {
    const key = slotKey(day, periodIndex);
    setSchedule((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const saveSchedule = () => {
    const incompleteClass = seasonClasses.find((classItem) => {
      const scheduledSubjects = scheduledSubjectsByClass.get(classItem.id) ?? new Set<ScheduleSubject>();
      return SCHEDULE_SUBJECTS.some((subject) => !scheduledSubjects.has(subject));
    });
    if (incompleteClass) {
      const missingSubjects = SCHEDULE_SUBJECTS.filter((subject) => !(scheduledSubjectsByClass.get(incompleteClass.id) ?? new Set<ScheduleSubject>()).has(subject));
      toast.error(`${incompleteClass.name}: أضف حصة أسبوعية لـ${missingSubjects.join(" و")} قبل الحفظ.`);
      return;
    }
    const entries = DAYS.flatMap((day) => periods.flatMap((period) => {
      const entry = schedule[slotKey(day, period.index)];
      if (!entry?.classId) return [];
      return [{
        classId: entry.classId,
        dayOfWeek: day,
        periodIndex: period.index,
        subject: entry.subject ?? "التاريخ",
        startTime: period.startTime,
        endTime: period.endTime,
        room: entry.room.trim() || undefined,
      }];
    }));
    saveScheduleMutation.mutate({ academicYear, entries });
  };

  const copyPreviousSchedule = () => {
    if (!previousSeason) return;
    copyScheduleMutation.mutate({ fromAcademicYear: previousSeason, toAcademicYear: academicYear });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <div className="nibras-card-hero nibras-glow-pattern rounded-2xl p-5 text-white md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-brand-wax-300">تهيئة تُجرى مرة واحدة في بداية الموسم</p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">جهّز موسمك الدراسي في دقائق</h1>
            <p className="mt-2 text-sm leading-6 text-white/80">
              أضف أقسامك وجدول خدمتك فقط. بعدها سيقترح نبراس حصة اليوم والوضعية الرسمية التالية تلقائياً.
            </p>
          </div>
          <div className="w-full sm:w-44">
            <Label htmlFor="academic-year" className="mb-2 block text-xs text-white/75">السنة الدراسية</Label>
            <Input
              id="academic-year"
              value={academicYear}
              onChange={(event) => setAcademicYear(event.target.value)}
              className="border-white/25 bg-white/10 text-center text-white placeholder:text-white/60"
              aria-label="السنة الدراسية"
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-primary/15">
        <CardHeader className="border-b bg-primary/[0.035] pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-primary"><ListChecks className="h-5 w-5" /><span className="text-sm font-semibold">فحص البداية</span></div>
              <CardTitle className="mt-1 text-lg">هل موسمك جاهز للاستعمال اليومي؟</CardTitle>
              <CardDescription>لكل قسم ثلاث حصص أسبوعية وثلاثة مخططات صفية: تاريخ وجغرافيا وتربية مدنية.</CardDescription>
            </div>
            {!readinessLoading && readiness && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${readiness.incompleteClasses === 0 && readiness.totalClasses > 0 ? "bg-emerald-100 text-emerald-800" : "bg-brand-wax-100 text-brand-ink-800"}`}>{readiness.readyClasses}/{readiness.totalClasses} أقسام مكتملة</span>}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {readinessLoading ? <p className="text-sm text-muted-foreground">جارٍ فحص جاهزية الموسم…</p> : !readiness || readiness.totalClasses === 0 ? (
            <div className="flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm leading-6 text-muted-foreground">أضف أول قسم لتظهر قائمة جاهزيته للموسم.</p><Button size="sm" onClick={() => document.getElementById("season-classes")?.scrollIntoView({ behavior: "smooth", block: "start" })}>أضف قسماً</Button></div>
          ) : readiness.incompleteClasses === 0 ? (
            <div className="flex gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-900"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><p className="text-sm leading-6">كل الأقسام مكتملة: الجداول والمخططات الصفية جاهزة. يمكنك الانتقال إلى خطة اليوم.</p></div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {readiness.items.map((item) => item.isReady ? <div key={item.classId} className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-900"><CheckCircle2 className="h-4 w-4 shrink-0" /><span>{item.className}: مكتمل</span></div> : <div key={item.classId} className="rounded-xl border bg-muted/20 p-3"><div className="flex items-center gap-2"><CircleAlert className="h-4 w-4 shrink-0 text-brand-wax-500" /><p className="font-semibold text-sm">{item.className}</p></div><div className="mt-2 space-y-2 text-xs leading-5 text-muted-foreground">{item.missingScheduleSubjects.length > 0 && <div className="flex flex-wrap items-center justify-between gap-2"><span>ينقص الجدول: {item.missingScheduleSubjects.join("، ")}</span><Button size="sm" variant="outline" className="h-7" onClick={() => document.getElementById("weekly-schedule")?.scrollIntoView({ behavior: "smooth", block: "start" })}>أكمل الجدول</Button></div>}{item.missingPlanSubjects.length > 0 && <div className="flex flex-wrap items-center justify-between gap-2"><span>ينقص المخطط: {item.missingPlanSubjects.join("، ")}</span><Button size="sm" variant="outline" className="h-7" onClick={() => setLocation("/annual-plans")}><BookCopy className="ml-1 h-3.5 w-3.5" />انسخ المخطط</Button></div>}</div></div>)}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[0.86fr_1.14fr]">
        <Card id="season-classes">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 text-primary"><GraduationCap className="h-5 w-5" /><span className="text-sm font-semibold">1. الأقسام</span></div>
            <CardTitle className="text-lg">أقسامك في هذا الموسم</CardTitle>
            <CardDescription>يكفي الاسم والمستوى وعدد التلاميذ. المخططات والوضعيات الرسمية موجودة مسبقاً في نبراس.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>اسم القسم</Label><Input value={classDraft.name} onChange={(event) => setClassDraft((current) => ({ ...current, name: event.target.value }))} placeholder="مثال: 2 متوسط 5" /></div>
                <div className="space-y-1.5"><Label>عدد التلاميذ</Label><Input type="number" min="1" value={classDraft.studentCount} onChange={(event) => setClassDraft((current) => ({ ...current, studentCount: event.target.value }))} placeholder="35" /></div>
                <div className="space-y-1.5"><Label>المستوى</Label><Select value={classDraft.gradeLevel} onValueChange={(gradeLevel) => setClassDraft((current) => ({ ...current, gradeLevel }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{GRADE_LEVELS.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>المادة</Label><Select value={classDraft.subject} onValueChange={(subject) => setClassDraft((current) => ({ ...current, subject }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SUBJECTS.map((subject) => <SelectItem key={subject} value={subject}>{subject}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <Button className="mt-3 w-full" onClick={() => createClassMutation.mutate({ ...classDraft, academicYear, studentCount: Number(classDraft.studentCount) || undefined })} disabled={!classDraft.name.trim() || createClassMutation.isPending}>
                <Plus className="ml-2 h-4 w-4" />{createClassMutation.isPending ? "جارٍ إضافة القسم…" : "أضف القسم"}
              </Button>
            </div>

            <div className="space-y-2" aria-live="polite">
            {classesLoading ? <p className="text-sm text-muted-foreground">جارٍ تحميل الأقسام…</p> : seasonClasses.length === 0 ? <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">أضف أقسامك أولاً، ثم ضَعها في جدول الخدمة.</p> : seasonClasses.map((classItem) => {
              const classReadiness = readinessByClass.get(classItem.id);
              return <div key={classItem.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0"><p className="font-semibold">{classItem.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{classItem.gradeLevel} · {classItem.studentCount || "—"} تلميذاً</p><p className="mt-1 text-xs text-muted-foreground">الحصص الأسبوعية: {scheduledSubjectsByClass.get(classItem.id)?.size || 0}/3 مواد</p></div>
                {classReadiness?.missingPlanSubjects.length === 0 ? <span className="shrink-0 rounded-md bg-emerald-100 px-2 py-1 text-xs text-emerald-800">المخططات الصفية مكتملة</span> : <Button variant="outline" size="sm" onClick={() => setLocation("/annual-plans")}>
                    <Copy className="ml-1.5 h-3.5 w-3.5" />نسخ من المرجع الرسمي
                  </Button>}
              </div>;
            })}
            </div>
            {seasonClasses.some((classItem) => readinessByClass.get(classItem.id)?.missingPlanSubjects.length) && <p className="rounded-lg border border-dashed px-3 py-2 text-center text-xs leading-5 text-muted-foreground">انسخ مخططات التاريخ والجغرافيا والتربية المدنية من المرجع إلى القسم حتى يسجّل نبراس التقدم بصورة مستقلة.</p>}
          </CardContent>
        </Card>

	        <Card id="weekly-schedule" className="overflow-hidden">
	          <CardHeader className="border-b bg-muted/25 pb-4">
	            <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-primary"><CalendarDays className="h-5 w-5" /><span className="text-sm font-semibold">2. جدول الخدمة</span></div><CardTitle className="mt-1 text-lg">ضع كل قسم في حصته الأسبوعية</CardTitle><CardDescription>لكل قسم ثلاث حصص: تاريخ وجغرافيا وتربية مدنية. التوقيت الافتراضي يتضمن الاستراحتين ويمكن تعديله عند الحاجة.</CardDescription></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{scheduledCount} حصة مسجلة</span></div>
            {previousScheduleSeasons.length > 0 && (
              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-primary/15 bg-primary/[0.035] p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted-foreground">لديك جدول محفوظ من موسم سابق. انسخه إلى هذا الموسم ثم راجع الأقسام والأوقات قبل المتابعة.</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select value={previousSeason} onValueChange={setPreviousSeason}>
                    <SelectTrigger className="h-9 min-w-40 bg-background text-xs" aria-label="اختيار موسم لنسخ الجدول"><SelectValue placeholder="اختر الموسم" /></SelectTrigger>
                    <SelectContent>{previousScheduleSeasons.map((season) => <SelectItem key={season} value={season}>{season}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={copyPreviousSchedule} disabled={!previousSeason || copyScheduleMutation.isPending}>
                    <Copy className="ml-2 h-4 w-4" />{copyScheduleMutation.isPending ? "جارٍ النسخ…" : "نسخ جدول موسم سابق"}
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
	          <CardContent className="p-0">
	            <p className="border-b bg-brand-wax-50 px-4 py-2 text-center text-xs font-medium text-brand-ink-800 md:hidden">اسحب الجدول جانبياً لرؤية بقية الأيام، ثم اختر القسم في الخانة المناسبة.</p>
	            <div className="overflow-x-auto" aria-label="جدول الخدمة الأسبوعي؛ يُمرر أفقياً على الهاتف">
              <div className="min-w-[860px] p-4">
                <div className="grid grid-cols-[112px_repeat(5,minmax(138px,1fr))] gap-2 text-center text-xs">
                  <div className="flex items-center justify-center rounded-lg bg-muted font-semibold text-muted-foreground">الفترة</div>
                  {DAYS.map((day) => <div key={day} className="rounded-lg bg-brand-ink-900 px-2 py-2 font-semibold text-white">{day}</div>)}
	                  {periods.map((period, periodIndex) => (
	                    <Fragment key={period.index}>
	                      {period.index === 5 && <div className="col-span-6 rounded-lg border border-primary/15 bg-primary/[0.045] px-3 py-2 text-right font-semibold text-primary">الفترة المسائية · 14:00–17:00</div>}
	                      <div key={`time-${period.index}`} className="rounded-lg border bg-muted/40 p-2 text-right">
                        <div className="flex items-center gap-1 font-semibold"><Clock3 className="h-3.5 w-3.5" />الحصة {period.index}</div>
                        <div className="mt-1 flex items-center gap-1"><Input aria-label={`بداية الحصة ${period.index}`} type="time" value={period.startTime} onChange={(event) => setPeriods((current) => current.map((item, index) => index === periodIndex ? { ...item, startTime: event.target.value } : item))} className="h-7 px-1 text-[10px]" /><span>–</span><Input aria-label={`نهاية الحصة ${period.index}`} type="time" value={period.endTime} onChange={(event) => setPeriods((current) => current.map((item, index) => index === periodIndex ? { ...item, endTime: event.target.value } : item))} className="h-7 px-1 text-[10px]" /></div>
                      </div>
                      {DAYS.map((day) => {
                        const entry = schedule[slotKey(day, period.index)];
                        return <div key={slotKey(day, period.index)} className={`rounded-lg border p-2 text-right transition-colors ${entry?.classId ? "border-primary/25 bg-primary/[0.035]" : "bg-background"}`}>
	                          <Select value={entry?.classId?.toString() || "empty"} onValueChange={(value) => value === "empty" ? clearSlot(day, period.index) : updateSlot(day, period.index, { classId: Number(value), subject: entry?.subject ?? suggestSubjectForClass(Number(value)) })}>
	                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="فارغة" /></SelectTrigger>
	                            <SelectContent><SelectItem value="empty">فارغة</SelectItem>{seasonClasses.map((classItem) => <SelectItem key={classItem.id} value={classItem.id.toString()}>{classItem.name}</SelectItem>)}</SelectContent>
	                          </Select>
	                          {entry?.classId && <><Select value={entry.subject || "التاريخ"} onValueChange={(subject) => updateSlot(day, period.index, { subject: subject as ScheduleSubject })}><SelectTrigger className="mt-1.5 h-7 text-xs" aria-label={`مادة ${day} الحصة ${period.index}`}><SelectValue /></SelectTrigger><SelectContent>{SCHEDULE_SUBJECTS.map((subject) => <SelectItem key={subject} value={subject}>{subject}</SelectItem>)}</SelectContent></Select><Input aria-label={`قاعة ${day} الحصة ${period.index}`} value={entry.room} onChange={(event) => updateSlot(day, period.index, { room: event.target.value })} placeholder="القاعة" className="mt-1.5 h-7 text-xs" /></>}
	                        </div>;
	                      })}
	                      {BREAKS_AFTER_PERIOD[period.index] && <div className="col-span-6 rounded-lg border border-dashed border-brand-wax-300 bg-brand-wax-50 px-3 py-2 text-center font-medium text-brand-ink-800">{BREAKS_AFTER_PERIOD[period.index]}</div>}
	                    </Fragment>
	                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-muted-foreground">بعد الحفظ، ستستعمل صفحة «اليوم» هذا الجدول لاختيار الحصة التالية تلقائياً.</p><Button onClick={saveSchedule} disabled={saveScheduleMutation.isPending || seasonClasses.length === 0}><CheckCircle2 className="ml-2 h-4 w-4" />{saveScheduleMutation.isPending ? "جارٍ الحفظ…" : "حفظ جدول الخدمة"}</Button></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/15 bg-primary/[0.025]"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h2 className="font-semibold">انتهت التهيئة؟</h2><p className="mt-1 text-sm text-muted-foreground">افتح خطة اليوم؛ سيقترح لك نبراس الوضعية الرسمية التالية لكل قسم وفق تقدمك.</p></div></div><Button variant="outline" onClick={() => setLocation("/dashboard")}>اذهب إلى خطة اليوم<ChevronLeft className="mr-2 h-4 w-4" /></Button></CardContent></Card>
    </div>
  );
}
