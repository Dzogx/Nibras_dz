import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  GraduationCap,
  ClipboardList,
  Library,
  Sparkles,
  Eye,
  ArrowLeft,
  Target,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { useMemo, useState } from "react";
import { usePreferredClass } from "@/hooks/usePreferredClass";
import { toast } from "sonner";
import { buildQuickAssessmentPath, buildQuickLessonPath, getScheduledSlotForNow } from "@shared/quick-click";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statCards = [
  { icon: GraduationCap, label: "الأقسام", path: "/classes", color: "bg-brand-ink-100 text-brand-ink-700" },
  { icon: ClipboardList, label: "الدروس", path: "/lessons", color: "bg-brand-copper-100 text-brand-copper-700" },
  { icon: FileText, label: "الخطط السنوية", path: "/annual-plans", color: "bg-brand-wax-100 text-brand-wax-800" },
  { icon: Library, label: "الموارد المُولّدة", path: "/content-library", color: "bg-brand-copper-100 text-brand-copper-800" },
];

const quickActions = [
  { icon: FileText, label: "إدارة الخطط", path: "/annual-plans", color: "bg-brand-ink-800", iconColor: "text-brand-ink-50" },
  { icon: BarChart3, label: "سجّل النتائج", path: "/results", color: "bg-brand-copper-700", iconColor: "text-copper-50" },
  { icon: Eye, label: "مراجعة كمفتش", path: "/inspector", color: "bg-brand-ink-700", iconColor: "text-brand-wax-300" },
  { icon: BookOpen, label: "بحث في المنهج", path: "/curriculum", color: "bg-brand-wax-500", iconColor: "text-brand-ink-950" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: lessons, isLoading: lessonsLoading } = trpc.lessons.list.useQuery();
  const { data: situations } = trpc.situations.listPending.useQuery();
  const { data: classes, isLoading: classesLoading } = trpc.classes.list.useQuery();
  const { data: annualPlans, isLoading: plansLoading } = trpc.annualPlans.list.useQuery();
  const { data: resources, isLoading: resourcesLoading } = trpc.aiResources.list.useQuery();
  const { data: profile } = trpc.profile.get.useQuery();
  const academicYear = profile?.academicYear || "2025-2026";
  const { data: weeklySchedule } = trpc.weeklySchedule.get.useQuery({ academicYear });

  const isLoadingStats = classesLoading || lessonsLoading || plansLoading || resourcesLoading;

  const completedLessons = useMemo(() => lessons?.filter(l => l.isCompleted).length ?? 0, [lessons]);
  const completedSituations = useMemo(() => (situations ?? []).filter((s: any) => s.isCompleted).length ?? 0, [situations]);
  // الوضعيات المعلقة هي المرجع الحقيقي للعمل اليومي (Teacher OS)،
  // فبطاقة «الدروس المعلقة» تعرضها بدل جدول الدروس القديم
  const pendingSituations = useMemo(() => (situations ?? []).filter((s: any) => !s.isCompleted), [situations]);
  const pendingLessons = pendingSituations.length;
  const pendingLessonsList = pendingSituations;

  const [selectedClassId, setSelectedClassId] = usePreferredClass();
  const [followSchedule, setFollowSchedule] = useState(true);
  const [finishSessionOpen, setFinishSessionOpen] = useState(false);
  const [sessionNote, setSessionNote] = useState("");
  const utils = trpc.useUtils();
  const { data: teacherOSContext } = trpc.ai.getTeacherOSContext.useQuery(
    {
      classId: selectedClassId ?? classes?.[0]?.id ?? -1,
    },
    {
      enabled: Boolean(selectedClassId ?? classes?.[0]?.id),
    }
  );

  const scheduledSlot = useMemo(() => getScheduledSlotForNow(weeklySchedule), [weeklySchedule]);
  const preferredClassId = selectedClassId && classes?.some((classItem) => classItem.id === selectedClassId)
    ? selectedClassId
    : undefined;
  const activeClassId = (followSchedule ? scheduledSlot?.classId : undefined) ?? preferredClassId ?? classes?.[0]?.id;
  const activeClass = classes?.find((item) => item.id === activeClassId);
  const needsScheduleSetup = Boolean(activeClass && weeklySchedule && weeklySchedule.length === 0);
  const activePlan = annualPlans?.find((plan) => plan.classId === activeClassId);
  const dailySection = teacherOSContext?.currentSection;
  const dailySituation = teacherOSContext?.nextSituation;
  const lastCompletedSituation = teacherOSContext?.completedSituations?.[0];
  const currentSectionProgress = teacherOSContext?.currentSectionProgress ?? teacherOSContext?.sectionProgress;
  const hasDailySession = Boolean(activeClass && dailySituation);
  const completeSessionMutation = trpc.situations.completeSession.useMutation({
    onSuccess: async (result) => {
      await Promise.all([
        utils.ai.getTeacherOSContext.invalidate(),
        utils.situations.listPending.invalidate(),
        utils.teachingNotes.list.invalidate(),
      ]);
      setFinishSessionOpen(false);
      setSessionNote("");
      toast.success(result.noteSaved ? "سُجّلت الحصة وملاحظة الأستاذ." : "سُجّلت الحصة كمنجزة.");
    },
    onError: (error) => toast.error(error.message || "تعذر تسجيل انتهاء الحصة."),
  });


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

      {/* نقطة العمل الأساسية: تجعل الخطوة التالية للأستاذ واضحة من أول شاشة */}
      <Card className="overflow-hidden border-primary/20 shadow-md">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-[1.45fr_0.85fr]">
            <div className="p-5 md:p-6 bg-gradient-to-bl from-brand-ink-900 via-brand-ink-800 to-brand-ink-700 text-white">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-wax-400 text-brand-ink-950 font-bold">1</span>
                  <div>
                    <p className="text-xs text-white/70">مساحة العمل اليومية</p>
                    <h2 className="font-bold text-lg">ابدأ حصتك الآن</h2>
                  </div>
                </div>
                <div className="w-full sm:w-60">
                  <Select
                    value={activeClassId?.toString()}
                    onValueChange={(value) => {
                      setFollowSchedule(false);
                      setSelectedClassId(Number(value));
                    }}
                  >
                    <SelectTrigger className="h-9 border-white/25 bg-white/10 text-white [&>svg]:text-white" aria-label="اختيار القسم للحصة اليومية">
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id.toString()}>
                          {classItem.name} — {classItem.gradeLevel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {needsScheduleSetup && (
                <div className="mb-4 flex flex-col gap-2 rounded-xl border border-brand-wax-300/40 bg-brand-wax-300/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2 text-white/90">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-wax-300" />
                    <span>لم تُضف جدول خدمتك بعد. أعدّه مرة واحدة ليقترح نبراس حصة اليوم تلقائياً.</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-brand-wax-300/60 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => setLocation("/season-setup")}
                  >
                    إعداد جدولي الأسبوعي
                  </Button>
                </div>
              )}

              {hasDailySession ? (
                <>
                  <p className="text-sm text-white/70 mb-1">
                    {activeClass?.name} · {activePlan?.subject || activeClass?.gradeLevel}
                  </p>
                  {scheduledSlot && followSchedule && (
                    <div className="mb-3 flex items-center gap-2 text-xs text-white/80">
                      <Clock className="h-3.5 w-3.5" />
                      <span>حصة اليوم {scheduledSlot.startTime}–{scheduledSlot.endTime}{scheduledSlot.room ? ` · القاعة ${scheduledSlot.room}` : ""}</span>
                      <button
                        type="button"
                        className="underline underline-offset-2 hover:text-white"
                        onClick={() => setFollowSchedule(false)}
                      >
                        اختر قسماً آخر
                      </button>
                    </div>
                  )}
                  <h3 className="text-xl md:text-2xl font-bold leading-relaxed">
                    {dailySituation?.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-white/80 mt-3 flex-wrap">
                    <span className="rounded-md bg-white/10 px-2.5 py-1">
                      المقطع {dailySection?.number}: {dailySection?.title}
                    </span>
                    <span className="rounded-md bg-white/10 px-2.5 py-1">وضعية غير منجزة</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-5">
                    <Button
                      className="bg-brand-wax-400 text-brand-ink-950 hover:bg-brand-wax-300"
                      onClick={() => dailySituation && setLocation(buildQuickLessonPath(dailySituation.id))}
                    >
                      <Sparkles className="w-4 h-4 ml-2" />حضّر المذكرة
                    </Button>
                    <Button
                      variant="outline"
                      className="border-emerald-300/45 bg-emerald-500/15 text-white hover:bg-emerald-500/25 hover:text-white"
                      onClick={() => setFinishSessionOpen(true)}
                    >
                      <CheckCircle2 className="w-4 h-4 ml-2" />أنهِ الحصة
                    </Button>
                  </div>
                </>
              ) : activeClass ? (
                <div className="py-3">
                  <h3 className="text-xl font-bold">لا توجد وضعية معلّقة في هذا القسم</h3>
                  <p className="text-sm text-white/75 mt-2">راجِع الخطة أو أنشئ وضعية تعلمية جديدة لتبدأ الحصة التالية.</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      className="bg-brand-wax-400 text-brand-ink-950 hover:bg-brand-wax-300"
                      onClick={() => setLocation(activePlan ? `/annual-plans/${activePlan.id}` : "/annual-plans")}
                    >
                      <ClipboardList className="w-4 h-4 ml-2" />الذهاب إلى الخطة
                    </Button>
                    {needsScheduleSetup && (
                      <Button
                        variant="outline"
                        className="border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                        onClick={() => setLocation("/season-setup")}
                      >
                        <Clock className="w-4 h-4 ml-2" />إعداد جدولي الأسبوعي
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-3">
                  <h3 className="text-xl font-bold">ابدأ بتعريف قسمك</h3>
                  <p className="text-sm text-white/75 mt-2">بعد إضافة القسم والخطة، سيقترح نبراس الحصة التالية تلقائياً.</p>
                  <Button className="mt-5 bg-brand-wax-400 text-brand-ink-950 hover:bg-brand-wax-300" onClick={() => setLocation("/season-setup")}>
                    <Plus className="w-4 h-4 ml-2" />تهيئة الموسم الدراسي
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-card p-5 md:p-6">
              <p className="text-xs font-semibold text-primary mb-1">نقرات الحصة السريعة</p>
              <h3 className="font-bold text-lg mb-4">نفّذ الخطوة التالية فقط</h3>
              <ol className="space-y-3">
                {[
                  {
                    label: "حضّر المذكرة",
                    detail: hasDailySession ? "جاهزة بعنوان الوضعية الرسمية" : "اختر قسمًا وخطة أولاً",
                    ready: hasDailySession,
                    onClick: () => dailySituation && setLocation(buildQuickLessonPath(dailySituation.id)),
                  },
                  {
                    label: "سجّل الإنجاز",
                    detail: "نقرة واحدة بعد تنفيذ الحصة",
                    ready: hasDailySession,
                    onClick: () => setFinishSessionOpen(true),
                  },
                  {
                    label: "أنشئ التقويم",
                    detail: lastCompletedSituation ? "يبنى من آخر وضعية منجزة" : "يتاح بعد تسجيل إنجاز وضعية",
                    ready: Boolean(lastCompletedSituation),
                    onClick: () => lastCompletedSituation && setLocation(buildQuickAssessmentPath(lastCompletedSituation.id, activeClassId)),
                  },
                  {
                    label: "شخّص النتائج والعلاج",
                    detail: "سجّل النتائج ثم أنشئ نشاط الدعم",
                    ready: Boolean(activeClassId),
                    onClick: () => setLocation("/results"),
                  },
                ].map((step, index) => (
                  <li key={step.label} className="flex gap-3 items-start">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto w-full justify-start gap-3 whitespace-normal p-0 text-right hover:bg-transparent disabled:opacity-55"
                      disabled={!step.ready}
                      onClick={step.onClick}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.ready ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {index + 1}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{step.label}</span>
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{step.detail}</span>
                      </span>
                    </Button>
                  </li>
                ))}
              </ol>
              <p className="mt-5 rounded-lg bg-muted/70 p-3 text-xs leading-relaxed text-muted-foreground">
                لا يُنشئ نبراس تقويماً من دروس غير مسجّلة كمنجزة، حتى يبقى التقويم مرتبطاً بما دُرّس فعلياً.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={finishSessionOpen} onOpenChange={setFinishSessionOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>إنهاء الحصة وتحديث المتابعة</DialogTitle>
            <DialogDescription>
              ستُسجَّل «{dailySituation?.title}» كمنجزة. أضف ملاحظة مختصرة إن وجدت؛ تحفظ في دفتر الأستاذ.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={sessionNote}
            onChange={(event) => setSessionNote(event.target.value)}
            placeholder="مثال: يحتاج التلاميذ إلى مراجعة قراءة الخريطة في بداية الحصة القادمة."
            className="min-h-28 resize-y"
            maxLength={3000}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFinishSessionOpen(false)}>متابعة الحصة</Button>
            <Button
              onClick={() => dailySituation && completeSessionMutation.mutate({ situationId: dailySituation.id, note: sessionNote || undefined })}
              disabled={!dailySituation || completeSessionMutation.isPending}
            >
              <CheckCircle2 className="w-4 h-4 ml-2" />
              {completeSessionMutation.isPending ? "جارٍ الحفظ…" : "سجّل الحصة منجزة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.label}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setLocation(card.path)}
          >
            <CardContent className="p-4">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${card.color} mb-3`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold min-h-[2rem]">
                {isLoadingStats ? (
                  <span className="inline-block w-12 h-3 bg-muted rounded-full animate-pulse" />
                ) : (
                  card.label === "الأقسام" ? classes?.length ?? 0 :
                  card.label === "الدروس" ? lessons?.length ?? 0 :
                  card.label === "الخطط السنوية" ? annualPlans?.length ?? 0 :
                  resources?.length ?? 0
                )}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">أدوات إضافية</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border transition-all shadow-sm hover:shadow-md"
              onClick={() => setLocation(action.path)}
            >
              <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                <action.icon className={`w-5 h-5 ${action.iconColor}`} />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
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
                  <Button size="sm" variant="secondary" className="w-full gap-1" onClick={() => setLocation(`/lesson-generator?situationId=${teacherOSContext.nextSituation!.id}`)}>
                    <BookOpen className="w-3.5 h-3.5" />
                    افتح مذكرة هذه الحصة
                  </Button>
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
  );
}
