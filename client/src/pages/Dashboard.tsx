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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useMemo } from "react";

const statCards = [
  { icon: GraduationCap, label: "الأقسام", path: "/classes", color: "bg-brand-ink-100 text-brand-ink-700" },
  { icon: ClipboardList, label: "الدروس", path: "/lessons", color: "bg-brand-copper-100 text-brand-copper-700" },
  { icon: FileText, label: "الخطط السنوية", path: "/annual-plans", color: "bg-brand-wax-100 text-brand-wax-800" },
  { icon: Library, label: "الموارد المُولّدة", path: "/content-library", color: "bg-brand-copper-100 text-brand-copper-800" },
];

const quickActions = [
  { icon: Sparkles, label: "توليد درس جديد", path: "/lesson-generator", color: "bg-brand-ink-800", iconColor: "text-brand-ink-50" },
  { icon: Library, label: "إنشاء تقييم", path: "/assessment", color: "bg-brand-copper-700", iconColor: "text-copper-50" },
  { icon: Eye, label: "مراجعة كمفتش", path: "/inspector", color: "bg-brand-ink-700", iconColor: "text-brand-wax-300" },
  { icon: BookOpen, label: "بحث في المنهج", path: "/curriculum", color: "bg-brand-wax-500", iconColor: "text-brand-ink-950" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: lessons, isLoading: lessonsLoading } = trpc.lessons.list.useQuery();
  const { data: classes, isLoading: classesLoading } = trpc.classes.list.useQuery();
  const { data: annualPlans, isLoading: plansLoading } = trpc.annualPlans.list.useQuery();
  const { data: resources, isLoading: resourcesLoading } = trpc.aiResources.list.useQuery();
  const { data: profile } = trpc.profile.get.useQuery();

  const isLoadingStats = classesLoading || lessonsLoading || plansLoading || resourcesLoading;

  const completedLessons = useMemo(() => lessons?.filter(l => l.isCompleted).length ?? 0, [lessons]);
  const pendingLessons = useMemo(() => lessons?.filter(l => !l.isCompleted).length ?? 0, [lessons]);

  const { data: teacherOSContext } = trpc.ai.getTeacherOSContext.useQuery({
    classId: classes?.[0]?.id,
  });


  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header — بطاقة hero بهوية نبراس */}
      <div className="nibras-glow-pattern rounded-2xl nibras-card-hero p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/manus-storage/nibras-monogram-192_9c2a7efa.png"
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
        <h2 className="text-lg font-semibold mb-3">إجراءات سريعة</h2>
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
              <div className="text-3xl font-bold text-brand-copper-700">{completedLessons}</div>
              <div className="text-sm text-muted-foreground">
                من أصل {lessons?.length ?? 0} درس
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-brand-copper-600 h-2 rounded-full transition-all"
                style={{ width: `${lessons?.length ? (completedLessons / lessons.length) * 100 : 0}%` }}
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
              <div className="text-3xl font-bold text-brand-wax-700">{pendingLessons}</div>
              <div className="text-sm text-muted-foreground">
                درس بحاجة إلى إنجاز
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-brand-wax-600 h-2 rounded-full transition-all"
                style={{ width: `${lessons?.length ? (pendingLessons / lessons.length) * 100 : 0}%` }}
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
      {/* Teacher OS Progress — بطاقة بتدرج هوية نبراس */}
      <Card className="border-brand-copper-200 bg-brand-copper-50/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-ink-700" />
            تقدم Teacher OS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teacherOSContext?.currentSection ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">المقطع الحالي</p>
                  <p className="text-lg font-bold text-brand-ink-800">
                    {teacherOSContext.currentSection.title} (المقطع {teacherOSContext.currentSection.number})
                  </p>
                </div>
              </div>
              {teacherOSContext.nextSituation ? (
                <div className="bg-brand-copper-100/70 rounded-lg p-3">
                  <p className="text-xs text-brand-copper-800 font-medium mb-1">الوضعية التالية</p>
                  <p className="text-sm font-medium">{teacherOSContext.nextSituation.title}</p>
                  <p className="text-xs text-muted-foreground mb-2">المقطع {teacherOSContext.nextSituation.sectionNumber}</p>
                  <Button size="sm" variant="secondary" className="w-full gap-1" onClick={() => setLocation(`/lesson-generator?situationId=${teacherOSContext.nextSituation!.id}`)}>
                    <BookOpen className="w-3.5 h-3.5" />
                    حضّر الحصة
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد وضعيات متبقية</p>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {teacherOSContext.sectionProgress.completed}/{teacherOSContext.sectionProgress.total} وضعية منجزة
                </span>
                <div className="flex-1 bg-muted rounded-full h-1.5">
                  <div
                    className="bg-brand-ink-600 h-1.5 rounded-full"
                    style={{ width: `${teacherOSContext.sectionProgress.total ? (teacherOSContext.sectionProgress.completed / teacherOSContext.sectionProgress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
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
                    <div className={`rounded-lg p-2 text-xs ${teacherOSContext.schedulePace.status === 'behind' ? 'nibras-tag-civics' : teacherOSContext.schedulePace.status === 'ahead' ? 'nibras-tag-geography' : 'nibras-tag-history'}`}>
                      {teacherOSContext.schedulePace.note}
                    </div>
                  )}
                </div>
              )}

              {/* بطاقات تقدم المقاطع */}
              {teacherOSContext.sectionProgressDetailed && teacherOSContext.sectionProgressDetailed.length > 0 && (
                <div className="border-t border-brand-copper-200/70 pt-3 space-y-2">
                  <p className="text-xs font-medium text-brand-ink-700">تقدم المقاطع</p>
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
