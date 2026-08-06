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
  { icon: GraduationCap, label: "الفصول", path: "/classes", color: "bg-blue-500/10 text-blue-600" },
  { icon: ClipboardList, label: "الدروس", path: "/lessons", color: "bg-emerald-500/10 text-emerald-600" },
  { icon: FileText, label: "الخطط السنوية", path: "/annual-plans", color: "bg-violet-500/10 text-violet-600" },
  { icon: Library, label: "الموارد المُولّدة", path: "/content-library", color: "bg-amber-500/10 text-amber-600" },
];

const quickActions = [
  { icon: Sparkles, label: "توليد درس جديد", path: "/lesson-generator", color: "from-violet-500 to-purple-600" },
  { icon: Library, label: "إنشاء تقييم", path: "/assessment", color: "from-blue-500 to-cyan-600" },
  { icon: Eye, label: "مراجعة كمفتش", path: "/inspector", color: "from-emerald-500 to-teal-600" },
  { icon: BookOpen, label: "بحث في المنهج", path: "/curriculum", color: "from-amber-500 to-orange-600" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: lessons } = trpc.lessons.list.useQuery();
  const { data: classes } = trpc.classes.list.useQuery();
  const { data: annualPlans } = trpc.annualPlans.list.useQuery();
  const { data: resources } = trpc.aiResources.list.useQuery();
  const { data: profile } = trpc.profile.get.useQuery();

  const completedLessons = useMemo(() => lessons?.filter(l => l.isCompleted).length ?? 0, [lessons]);
  const pendingLessons = useMemo(() => lessons?.filter(l => !l.isCompleted).length ?? 0, [lessons]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            مرحباً، {user?.name || "أستاذ"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {profile?.displayName || "لوحة التحكم الخاصة بك"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
            {profile?.academicYear || "2025-2026"}
          </span>
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
              <p className="text-2xl font-bold">
                {card.label === "الفصول" ? classes?.length ?? 0 :
                 card.label === "الدروس" ? lessons?.length ?? 0 :
                 card.label === "الخطط السنوية" ? annualPlans?.length ?? 0 :
                 resources?.length ?? 0}
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
              className={`h-auto py-4 flex flex-col items-center gap-2 border-2 hover:border-primary/30 transition-all ${action.color.split(' ')[0].replace('500', '100')}`}
              onClick={() => setLocation(action.path)}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                <action.icon className="w-5 h-5 text-white" />
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
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              الدروس المنجزة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-3xl font-bold text-emerald-600">{completedLessons}</div>
              <div className="text-sm text-muted-foreground">
                من أصل {lessons?.length ?? 0} درس
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${lessons?.length ? (completedLessons / lessons.length) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              الدروس المعلقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-3xl font-bold text-amber-600">{pendingLessons}</div>
              <div className="text-sm text-muted-foreground">
                درس بحاجة إلى إنجاز
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all"
                style={{ width: `${lessons?.length ? (pendingLessons / lessons.length) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Lessons */}
      {lessons && lessons.length > 0 && (
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
                    <div className={`w-2 h-2 rounded-full ${lesson.isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-medium text-sm">{lesson.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {lesson.gradeLevel && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{lesson.gradeLevel}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded ${lesson.isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {lesson.isCompleted ? 'منجز' : 'معلّق'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
