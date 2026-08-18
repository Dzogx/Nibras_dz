import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  ClipboardList,
  Sparkles,
  ArrowLeft,
  Target,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  BarChart3,
  MoreHorizontal,
  PauseCircle,
  CalendarClock,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { useMemo, useState } from "react";
import { usePreferredClass } from "@/hooks/usePreferredClass";
import { toast } from "sonner";
import { buildQuickAssessmentPath, buildQuickIntegrativeSituationPath, buildQuickLessonPath, findReadyLessonPlan, getScheduledSlotForNow } from "@shared/quick-click";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SessionStatus = "completed" | "partial" | "postponed" | "cancelled";

const sessionStatusOptions: Array<{
  value: SessionStatus;
  label: string;
  guidance: string;
  actionLabel: string;
  icon: typeof CheckCircle2;
}> = [
  {
    value: "completed",
    label: "مكتملة",
    guidance: "أُنجزت عناصر الوضعية، ويمكنك الانتقال إلى التقويم أو الوضعية التالية.",
    actionLabel: "سجّل الحصة مكتملة",
    icon: CheckCircle2,
  },
  {
    value: "partial",
    label: "منجزة جزئياً",
    guidance: "تبقى الوضعية مفتوحة لتستكمل عناصرها في الحصة القادمة.",
    actionLabel: "سجّل الإنجاز الجزئي",
    icon: PauseCircle,
  },
  {
    value: "postponed",
    label: "مؤجّلة",
    guidance: "تبقى الوضعية مفتوحة؛ أعد برمجتها في أقرب حصة مناسبة.",
    actionLabel: "سجّل تأجيل الحصة",
    icon: CalendarClock,
  },
  {
    value: "cancelled",
    label: "ملغاة",
    guidance: "يُحفظ سبب الإلغاء إن وجد، وتبقى الوضعية مفتوحة لتقرر موعد إعادتها.",
    actionLabel: "سجّل إلغاء الحصة",
    icon: XCircle,
  },
];

const openSessionGuidance: Partial<Record<SessionStatus, { label: string; nextStep: string }>> = {
  partial: {
    label: "وضعية قيد الاستكمال",
    nextStep: "أكمل العناصر المتبقية في هذه الوضعية قبل الانتقال إلى التقويم أو الوضعية التالية.",
  },
  postponed: {
    label: "حصة مؤجّلة",
    nextStep: "أعد تقديم هذه الوضعية في أقرب حصة مناسبة؛ ما زالت هي الخطوة التالية في خطتك.",
  },
  cancelled: {
    label: "حصة ملغاة",
    nextStep: "حدّد موعداً بديلاً لهذه الوضعية قبل تجاوزها؛ لم تُحسب ضمن الإنجاز.",
  },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: lessons, isLoading: lessonsLoading } = trpc.lessons.list.useQuery();
  const { data: situations } = trpc.situations.listPending.useQuery();
  const { data: classes, isLoading: classesLoading } = trpc.classes.list.useQuery();
  const { data: profile } = trpc.profile.get.useQuery();
  const academicYear = profile?.academicYear || "2025-2026";
  const { data: annualPlans, isLoading: plansLoading } = trpc.annualPlans.list.useQuery({ academicYear });
  const { data: resources, isLoading: resourcesLoading } = trpc.aiResources.list.useQuery();
  const { data: weeklySchedule } = trpc.weeklySchedule.get.useQuery({ academicYear });

  const isLoadingStats = classesLoading || lessonsLoading || plansLoading || resourcesLoading;

  const completedLessons = useMemo(() => lessons?.filter(l => l.isCompleted).length ?? 0, [lessons]);
  const completedSituations = useMemo(() => (situations ?? []).filter((s: any) => s.isCompleted).length ?? 0, [situations]);
  // الوضعيات المعلقة هي المرجع الحقيقي للعمل اليومي (Teacher OS)،
  // فبطاقة «الدروس المعلقة» تعرضها بدل جدول الدروس القديم
  const pendingSituations = useMemo(() => (situations ?? []).filter((s: any) => !s.isCompleted), [situations]);
  const pendingLessons = pendingSituations.length;
  const pendingLessonsList = pendingSituations;

  const [selectedClassId, setSelectedClassId] = usePreferredClass(academicYear);
  const [followSchedule, setFollowSchedule] = useState(true);
  const [finishSessionOpen, setFinishSessionOpen] = useState(false);
  const [sessionNote, setSessionNote] = useState("");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("completed");
  const utils = trpc.useUtils();
  const seasonClasses = useMemo(
    () => (classes ?? []).filter((classItem) => !classItem.academicYear || classItem.academicYear === academicYear),
    [classes, academicYear],
  );
  const scheduledSlot = useMemo(() => getScheduledSlotForNow(weeklySchedule), [weeklySchedule]);
  const preferredClassId = selectedClassId && seasonClasses.some((classItem) => classItem.id === selectedClassId)
    ? selectedClassId
    : undefined;
  const activeClassId = (followSchedule ? scheduledSlot?.classId : undefined) ?? preferredClassId ?? seasonClasses[0]?.id;
  const activeClass = seasonClasses.find((item) => item.id === activeClassId);
  const needsScheduleSetup = Boolean(activeClass && weeklySchedule && weeklySchedule.length === 0);
  const activePlan = annualPlans?.find((plan) => plan.classId === activeClassId && (!scheduledSlot?.subject || plan.subject === scheduledSlot.subject))
    ?? annualPlans?.find((plan) => plan.classId === activeClassId);
  const { data: teacherOSContext } = trpc.ai.getTeacherOSContext.useQuery(
    {
      classId: activeClassId ?? -1,
      academicYear,
      subject: scheduledSlot?.subject,
    },
    {
      enabled: Boolean(activeClassId),
    }
  );

  const dailySection = teacherOSContext?.currentSection;
  const dailySituation = teacherOSContext?.nextSituation;
  const lastCompletedSituation = teacherOSContext?.completedSituations?.[0];
  const contextualSituation = dailySituation ?? lastCompletedSituation;
  const currentSectionProgress = teacherOSContext?.currentSectionProgress ?? teacherOSContext?.sectionProgress;
  const hasDailySession = Boolean(activeClass && dailySituation);
  const readyLessonPlan = useMemo(() => {
    return findReadyLessonPlan(resources, activeClassId, dailySituation?.id);
  }, [activeClassId, dailySituation?.id, resources]);
  const completeSessionMutation = trpc.situations.completeSession.useMutation({
    onSuccess: async (result) => {
      await Promise.all([
        utils.ai.getTeacherOSContext.invalidate(),
        utils.situations.listPending.invalidate(),
        utils.teachingNotes.list.invalidate(),
      ]);
      setFinishSessionOpen(false);
      setSessionNote("");
      setSessionStatus("completed");
      const successMessage: Record<SessionStatus, string> = {
        completed: result.noteSaved ? "سُجّلت الحصة مكتملة وحُفظت ملاحظتك." : "سُجّلت الحصة مكتملة. يمكنك الانتقال إلى التقويم أو الوضعية التالية.",
        partial: "سُجّل الإنجاز الجزئي. تبقى الوضعية مفتوحة لتستكملها في الحصة القادمة.",
        postponed: "سُجّل تأجيل الحصة. تبقى الوضعية مفتوحة لإعادة برمجتها.",
        cancelled: "سُجّل إلغاء الحصة. تبقى الوضعية مفتوحة لتحديد موعد جديد لها.",
      };
      toast.success(successMessage[result.sessionStatus]);
    },
    onError: (error) => toast.error(error.message || "تعذر تسجيل انتهاء الحصة."),
  });

  const openFinishSessionDialog = () => {
    setSessionStatus("completed");
    setSessionNote("");
    setFinishSessionOpen(true);
  };
  const closeFinishSessionDialog = () => {
    setFinishSessionOpen(false);
    setSessionStatus("completed");
    setSessionNote("");
  };
  const selectedSessionStatus = sessionStatusOptions.find((option) => option.value === sessionStatus)!;
  const SelectedSessionStatusIcon = selectedSessionStatus.icon;
  const dailySituationGuidance = dailySituation?.sessionStatus
    ? openSessionGuidance[dailySituation.sessionStatus as SessionStatus]
    : undefined;


  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header — بطاقة hero بهوية نبراس */}
      <div className="nibras-glow-pattern rounded-2xl nibras-card-hero p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/manus-storage/nibras-monogram-192_8769c116.png"
              alt="شعار نبراس"
              className="w-14 h-14 rounded-xl bg-white/95 p-1 shrink-0"
            />
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                مرحباً، {user?.name || "أستاذ"}
              </h1>
              <p className="text-sm opacity-85 mt-1">
                {profile?.displayName || "منصّة نبراس — مساعدك التربوي اليومي"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm bg-white/10 border border-white/15 px-3 py-1.5 rounded-lg backdrop-blur">
              السنة الدراسية {profile?.academicYear || "2025-2026"}
            </span>
          </div>
        </div>
      </div>

      {/* نقطة العمل الأساسية: يقود نبراس الأستاذ إلى خطوة اليوم الواحدة. */}
      <Card className="overflow-hidden border-primary/20 shadow-md">
        <CardContent className="p-5 md:p-6 bg-gradient-to-bl from-brand-ink-900 via-brand-ink-800 to-brand-ink-700 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-wax-400 text-brand-ink-950 font-bold">1</span>
              <div>
                <p className="text-xs text-white/70">مساحة العمل اليومية</p>
                <h2 className="font-bold text-lg">خطوتك التالية</h2>
              </div>
            </div>
            {seasonClasses.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                    <MoreHorizontal className="ml-1 h-4 w-4" />تغيير القسم
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56">
                  <DropdownMenuLabel>اختيار قسم آخر</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {seasonClasses.map((classItem) => (
                    <DropdownMenuItem
                      key={classItem.id}
                      onSelect={() => {
                        setFollowSchedule(false);
                        setSelectedClassId(classItem.id);
                      }}
                    >
                      {classItem.name} — {classItem.gradeLevel}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {hasDailySession ? (
            <div className="pt-7">
              <p className="text-sm text-white/70">{activeClass?.name} · {scheduledSlot?.subject || activePlan?.subject || activeClass?.gradeLevel}</p>
              {scheduledSlot && followSchedule && <p className="mt-2 flex items-center gap-2 text-xs text-white/80"><Clock className="h-3.5 w-3.5" />حصة اليوم {scheduledSlot.startTime}–{scheduledSlot.endTime}{scheduledSlot.room ? ` · القاعة ${scheduledSlot.room}` : ""}</p>}
              <h3 className="mt-3 text-xl font-bold leading-relaxed md:text-2xl">{dailySituation?.title}</h3>
              <p className="mt-2 text-sm text-white/80">المقطع {dailySection?.number}: {dailySection?.title}</p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Button
                  className="bg-brand-wax-400 text-brand-ink-950 hover:bg-brand-wax-300"
                  onClick={() => dailySituation && setLocation(readyLessonPlan ? `/content-library/${readyLessonPlan.id}` : buildQuickLessonPath(dailySituation.id))}
                >
                  {readyLessonPlan ? <FileText className="ml-2 h-4 w-4" /> : <Sparkles className="ml-2 h-4 w-4" />}
                  {readyLessonPlan ? (dailySituationGuidance ? "استكمل مذكرة الحصة" : "افتح مذكرة الحصة") : "حضّر مذكرة الحصة"}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white"><MoreHorizontal className="ml-1 h-4 w-4" />المزيد</Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-60">
                    <DropdownMenuLabel>إجراءات مرتبطة بهذه الحصة</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={openFinishSessionDialog}><CheckCircle2 />سجّل نتيجة الحصة</DropdownMenuItem>
                    <DropdownMenuItem disabled={!contextualSituation} onSelect={() => contextualSituation && setLocation(`/lesson-generator?situationId=${contextualSituation.id}&contentType=activity`)}><BookOpen />أنشئ نشاطاً أو مورداً</DropdownMenuItem>
                    <DropdownMenuItem disabled={!contextualSituation} onSelect={() => contextualSituation && setLocation(buildQuickIntegrativeSituationPath(contextualSituation.id, activeClassId))}><Target />أنشئ وضعية إدماجية</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={!lastCompletedSituation || !activeClassId} onSelect={() => lastCompletedSituation && activeClassId && setLocation(buildQuickAssessmentPath(lastCompletedSituation.id, activeClassId))}><ClipboardList />أنشئ تقويماً</DropdownMenuItem>
                    <DropdownMenuItem disabled={!activeClassId} onSelect={() => activeClassId && setLocation(`/results?classId=${activeClassId}`)}><BarChart3 />سجّل النتائج أو عالج الصعوبات</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {dailySituationGuidance && (
                <div className="mt-4 rounded-xl border border-brand-wax-300/35 bg-white/10 px-3 py-3 text-sm text-white/90">
                  <p className="font-semibold text-brand-wax-300">{dailySituationGuidance.label}</p>
                  <p className="mt-1 leading-6">{dailySituationGuidance.nextStep}</p>
                  {dailySituation?.completionNotes && <p className="mt-2 border-t border-white/15 pt-2 text-xs leading-5 text-white/75">آخر ملاحظة: {dailySituation.completionNotes}</p>}
                </div>
              )}
              <p className="mt-4 text-xs text-white/65">{readyLessonPlan ? "مذكرتك جاهزة لهذه الوضعية. افتحها ثم سجّل نتيجة الحصة بعد تنفيذها." : "ابدأ بالمذكرة، ثم سجّل نتيجة الحصة. تظهر الإجراءات التالية عند الحاجة."}</p>
            </div>
          ) : needsScheduleSetup ? (
            <div className="pt-7">
              <p className="text-sm text-white/75">التهيئة الأولى</p>
              <h3 className="mt-2 text-xl font-bold">أضف جدول خدمتك الأسبوعي</h3>
              <p className="mt-2 text-sm text-white/75">أدخله مرة واحدة؛ بعدها يقترح نبراس حصة اليوم تلقائياً.</p>
              <Button className="mt-5 bg-brand-wax-400 text-brand-ink-950 hover:bg-brand-wax-300" onClick={() => setLocation("/season-setup")}><Clock className="ml-2 h-4 w-4" />إعداد جدولي الأسبوعي</Button>
            </div>
          ) : activeClass ? (
            <div className="pt-7">
              <h3 className="text-xl font-bold">لا توجد وضعية معلّقة في هذا القسم</h3>
              <p className="mt-2 text-sm text-white/75">راجع الخطة أو أضف وضعية تعلمية لتصبح الخطوة التالية واضحة.</p>
              <Button className="mt-5 bg-brand-wax-400 text-brand-ink-950 hover:bg-brand-wax-300" onClick={() => setLocation(activePlan ? `/annual-plans/${activePlan.id}` : "/annual-plans")}><ClipboardList className="ml-2 h-4 w-4" />الذهاب إلى الخطة</Button>
            </div>
          ) : (
            <div className="pt-7">
              <h3 className="text-xl font-bold">ابدأ بتهيئة موسمك الدراسي</h3>
              <p className="mt-2 text-sm text-white/75">أضف أقسامك وجدولك، وسيتولى نبراس اقتراح الحصة التالية.</p>
              <Button className="mt-5 bg-brand-wax-400 text-brand-ink-950 hover:bg-brand-wax-300" onClick={() => setLocation("/season-setup")}><Plus className="ml-2 h-4 w-4" />تهيئة الموسم الدراسي</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={finishSessionOpen} onOpenChange={(open) => open ? setFinishSessionOpen(true) : closeFinishSessionDialog()}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>إنهاء الحصة وتحديث المتابعة</DialogTitle>
            <DialogDescription>
              حدّد ما جرى في «{dailySituation?.title}». {selectedSessionStatus.guidance}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2" aria-label="حالة الحصة">
            {sessionStatusOptions.map((option) => {
              const StatusIcon = option.icon;
              const isSelected = sessionStatus === option.value;
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  aria-pressed={isSelected}
                  onClick={() => setSessionStatus(option.value)}
                  className={`h-auto min-h-16 justify-start gap-2 whitespace-normal px-3 py-3 text-right leading-snug ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary hover:bg-primary/15"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  <StatusIcon className="h-4 w-4 shrink-0" />
                  <span>{option.label}</span>
                </Button>
              );
            })}
          </div>
          <Textarea
            value={sessionNote}
            onChange={(event) => setSessionNote(event.target.value)}
            placeholder={sessionStatus === "completed" ? "مثال: يحتاج التلاميذ إلى مراجعة قراءة الخريطة في بداية الحصة القادمة." : "مثال: ما الذي أُنجز أو سبب التأجيل، وما الذي ستستكمله في الحصة القادمة؟"}
            className="min-h-28 resize-y"
            maxLength={3000}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeFinishSessionDialog}>العودة للحصة</Button>
            <Button
              onClick={() => dailySituation && completeSessionMutation.mutate({ situationId: dailySituation.id, note: sessionNote || undefined, sessionStatus })}
              disabled={!dailySituation || completeSessionMutation.isPending}
            >
              <SelectedSessionStatusIcon className="w-4 h-4 ml-2" />
              {completeSessionMutation.isPending ? "جارٍ الحفظ…" : selectedSessionStatus.actionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* المتابعة الثانوية لا تنافس خطوة الحصة. تفتح عند الحاجة فقط. */}
      <details className="group rounded-xl border bg-card shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <div>
            <h2 className="font-semibold">متابعة أوسع</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">التقدم والخطط والموارد الأخيرة — افتحها عند الحاجة.</p>
          </div>
          <span className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors group-open:border-primary/30 group-open:text-primary">عرض الملخص</span>
        </summary>
        <div className="space-y-5 border-t p-4 md:p-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "الأقسام", value: classes?.length ?? 0, path: "/classes" },
              { label: "الدروس", value: lessons?.length ?? 0, path: "/lessons" },
              { label: "الخطط", value: annualPlans?.length ?? 0, path: "/annual-plans" },
              { label: "الموارد", value: resources?.length ?? 0, path: "/content-library" },
            ].map((item) => (
              <Button key={item.label} variant="outline" className="h-auto justify-between px-3 py-3 text-right" onClick={() => setLocation(item.path)}>
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-lg font-bold text-foreground">{isLoadingStats ? "—" : item.value}</span>
              </Button>
            ))}
          </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-copper-700" />
              الدروس المنجزة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-3xl font-bold text-brand-copper-700">{completedSituations + completedLessons}</div>
              <div className="text-sm text-muted-foreground">
                من أصل {(situations?.length ?? 0) + (lessons?.length ?? 0)} وضعية ودرس
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-brand-copper-600 h-2 rounded-full transition-all"
                style={{ width: `${(situations?.length ?? 0) + (lessons?.length ?? 0) ? ((completedSituations + completedLessons) / ((situations?.length ?? 0) + (lessons?.length ?? 0))) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-wax-700" />
              الدروس المعلقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-3xl font-bold text-brand-wax-700">{pendingSituations.length}</div>
              <div className="text-sm text-muted-foreground">
                وضعية بحاجة إلى إنجاز
              </div>
            </div>
            {pendingSituations.length > 0 ? (
              <ul className="space-y-1.5 mb-3">
                {pendingSituations.slice(0, 3).map((situation: any) => (
                  <li
                    key={situation.id}
                    className="text-sm text-foreground/80 flex items-center gap-2 cursor-pointer hover:text-brand-copper-700 transition-colors"
                    onClick={() => setLocation(activePlan ? `/annual-plans/${activePlan.id}` : "/annual-plans")}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-wax-600 shrink-0" />
                    <span className="truncate">{situation.title}</span>
                  </li>
                ))}
                {pendingSituations.length > 3 && (
                  <li className="text-xs text-muted-foreground px-3.5">
                    + {pendingSituations.length - 3} وضعية أخرى
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-brand-copper-700 mb-3">لا توجد وضعيات معلقة — أحسنت!</p>
            )}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-brand-wax-600 h-2 rounded-full transition-all"
                style={{ width: `${situations?.length ? (pendingSituations.length / situations.length) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Lessons */}
      {lessonsLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground animate-pulse">جارٍ تحميل آخر الدروس…</CardContent>
        </Card>
      ) : lessons && lessons.length > 0 ? (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">آخر الدروس</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/lessons")}>
              عرض الكل
              <ArrowLeft className="w-4 h-4 mr-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lessons.slice(0, 5).map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/lessons/${lesson.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${lesson.isCompleted ? 'bg-brand-copper-600' : 'bg-brand-wax-600'}`} />
                    <span className="font-medium text-sm">{lesson.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {lesson.gradeLevel && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{lesson.gradeLevel}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded ${lesson.isCompleted ? 'nibras-tag-geography' : 'nibras-tag-civics'}`}>
                      {lesson.isCompleted ? 'منجز' : 'معلّق'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
                </Card>
      ) : null}
      {/* متابعة مختصرة: مكان الأستاذ في المقطع، لا عداد تقني بعيد عن الحصة */}
      <Card className="border-brand-copper-200 bg-brand-copper-50/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-ink-700" />
            أين وصلت في الخطة؟
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teacherOSContext?.currentSection ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs font-medium text-brand-ink-700">{activeClass?.name || "القسم المختار"} · المقطع الجاري</p>
                  <p className="text-lg font-bold text-brand-ink-800">
                    {teacherOSContext.currentSection.title} (المقطع {teacherOSContext.currentSection.number})
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-brand-ink-700">
                  {currentSectionProgress?.completed ?? 0}/{currentSectionProgress?.total ?? 0} داخل المقطع
                </span>
              </div>
              {teacherOSContext.nextSituation ? (
                <div className="bg-brand-copper-100/70 rounded-lg p-3">
                  <p className="text-xs text-brand-copper-800 font-medium mb-1">الخطوة التالية في حصتك</p>
                  <p className="text-sm font-medium">{teacherOSContext.nextSituation.title}</p>
                  <p className="text-xs text-muted-foreground mb-2">حضّر المذكرة، ثم سجّلها منجزة بعد التنفيذ.</p>
                </div>
              ) : (
                <p className="text-sm text-brand-copper-700">اكتمل هذا المقطع. انتقل إلى الخطة لمراجعة الخطوة التالية.</p>
              )}
              {teacherOSContext.competencies.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">الكفاءات المغطاة</p>
                  <div className="flex flex-wrap gap-1">
                    {teacherOSContext.competencies.slice(0, 5).map((c, i) => (
                      <span key={i} className="text-xs bg-brand-ink-100 text-brand-ink-700 px-2 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* دفتر المتابعة: نسبة إنجاز المخطط السنوي */}
              {(teacherOSContext.annualProgressPercent !== undefined || teacherOSContext.schedulePace) && (
                <div className="border-t border-brand-copper-200/70 pt-3 space-y-2">
                  <p className="text-xs font-medium text-brand-ink-700">دفتر متابعة التدريس</p>
                  {typeof teacherOSContext.annualProgressPercent === 'number' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">إنجاز المخطط السنوي</span>
                      <span className="text-xs font-bold">{teacherOSContext.annualProgressPercent}%</span>
                      <div className="flex-1 bg-muted rounded-full h-1.5">
                        <div
                          className="bg-brand-copper-600 h-1.5 rounded-full"
                          style={{ width: `${teacherOSContext.annualProgressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {teacherOSContext.schedulePace && (
                    <div className={`rounded-lg p-2 text-xs ${teacherOSContext.schedulePace.status === 'behind' ? 'nibras-tag-civics' : teacherOSContext.schedulePace.status === 'ahead' ? 'nibras-tag-geography' : teacherOSContext.schedulePace.status === 'not_started' ? 'bg-brand-wax-100 text-brand-wax-800 border border-brand-wax-300' : 'nibras-tag-history'}`}>
                      {teacherOSContext.schedulePace.note}
                    </div>
                  )}
                </div>
              )}

              {/* بطاقات تقدم المقاطع */}
              {teacherOSContext.sectionProgressDetailed && teacherOSContext.sectionProgressDetailed.length > 0 && (
                <div className="border-t border-brand-copper-200/70 pt-3 space-y-2">
                  <p className="text-xs font-medium text-brand-ink-700">خريطة المقاطع</p>
                  {teacherOSContext.sectionProgressDetailed.map((sec) => (
                    <div key={sec.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium truncate">{sec.title}</span>
                        <span className="text-muted-foreground">{sec.completed}/{sec.total}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-brand-ink-600"
                            style={{ width: `${sec.percent}%` }}
                          />
                        </div>
                        {sec.lastCompletedDate ? (
                          <span className="text-[10px] text-muted-foreground" title={`آخر إنجاز: ${new Date(sec.lastCompletedDate).toLocaleDateString('ar-DZ', { day: '2-digit', month: 'short', year: 'numeric' })}`}>
                            آخر إنجاز: {new Date(sec.lastCompletedDate).toLocaleDateString('ar-DZ', { day: '2-digit', month: 'short' })}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">لم يبدأ</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">اختر قسماً لعرض التقدم في المخطط السنوي</p>
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </details>
    </div>
  );
}
