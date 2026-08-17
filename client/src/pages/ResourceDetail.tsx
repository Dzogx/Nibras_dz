import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowRight, Save, Pencil, Copy, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { A4PrintButton, A4PrintContent } from "@/components/A4Print";
import { PrintPreviewDialog } from "@/components/PrintPreviewDialog";
import { Eye } from "lucide-react";
import { VoicePlayer } from "@/components/VoicePlayer";

const typeLabels: Record<string, string> = {
  lessonPlan: "خطة درس",
  activity: "نشاط تعلم",
  homework: "واجب منزلي",
  classQuestions: "أسئلة صفية",
  differentiation: "استراتيجيات تمييز",
  quiz: "اختبار قصير",
  exam: "امتحان",
  rubric: "معايير تقييم",
  answerKey: "مفتاح إجابات",
  inspectorReview: "مراجعة مفتش",
};

export default function ResourceDetail({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const resourceId = parseInt(id);
  const utils = trpc.useUtils();
  const { data: resource, isLoading } = trpc.aiResources.getById.useQuery({ id: resourceId });
  const meta = (resource?.metadata as any) || {};
  const { data: linkedLesson } = trpc.lessons.getById.useQuery(
    { id: resource?.lessonId ?? 0 },
    { enabled: Boolean(resource?.lessonId) }
  );
  const { data: linkedClass } = trpc.classes.getById.useQuery(
    { id: (resource?.classId ?? linkedLesson?.classId) ?? 0 },
    { enabled: Boolean(resource?.classId ?? linkedLesson?.classId) }
  );
  const { data: profile } = trpc.profile.get.useQuery(undefined, { staleTime: 60_000 });
  const [isEditing, setIsEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const subject = meta?.subject || linkedLesson?.subject || profile?.subject;
  const gradeLevel = meta?.gradeLevel || linkedLesson?.gradeLevel;
  const levelSection = linkedClass ? `${linkedClass.gradeLevel}${linkedClass.section ? ` — القسم ${linkedClass.section}` : ""}` : gradeLevel;

  const docTitle =
    meta?.resourceKind === "integrativeSituation"
      ? "وضعية إدماجية"
      : resource?.type === "quiz" || resource?.type === "exam"
      ? `اختبار في ${subject || "الاجتماعيات"}`
      : resource?.type === "answerKey"
        ? "مفتاح الإجابات"
        : resource?.type === "rubric"
          ? "شبكة التقويم"
          : (resource?.type ? typeLabels[resource?.type] : undefined) || "وثيقة تربوية";

  const resourcePrintMeta = useMemo(() => ({
    title: docTitle,
    subtitle: resource?.title || undefined,
    teacherName: profile?.displayName || undefined,
    school: linkedClass?.name || profile?.school || undefined,
    province: profile?.province || undefined,
    subject,
    levelSection,
    duration: meta?.duration || linkedLesson?.duration || undefined,
    extra: linkedClass?.academicYear ? `الموسم الدراسي ${linkedClass.academicYear}` : (profile?.academicYear ? `الموسم الدراسي ${profile.academicYear}` : undefined),
    serialNumber: resource?.serialNumber || undefined,
    examEndsAt: (resource as any)?.examEndsAt ?? null,
  }), [docTitle, resource, profile, linkedClass, subject, levelSection, meta, linkedLesson]);

  const [editForm, setEditForm] = useState({
    title: resource?.title || "",
    content: resource?.content || "",
  });

  if (resource && !editForm.title) {
    setEditForm({
      title: resource.title || "",
      content: resource.content || "",
    });
  }

  const updateMutation = trpc.aiResources.update.useMutation({
    onSuccess: () => {
      utils.aiResources.getById.invalidate({ id: resourceId });
      utils.aiResources.list.invalidate();
      toast.success("تم التحديث");
      setIsEditing(false);
    },
    onError: () => toast.error("خطأ في التحديث"),
  });

  const copyContent = () => {
    if (resource?.content) {
      navigator.clipboard.writeText(resource.content);
      toast.success("تم النسخ");
    }
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;
  if (!resource) return <div className="text-center py-12">المورد غير موجود</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/content-library")}>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">{resource.title}</h1>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded ${resource.type === 'quiz' || resource.type === 'exam' ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary'}`}>
          {meta?.resourceKind === "integrativeSituation" ? "وضعية إدماجية" : (typeLabels[resource.type] || resource.type)}
        </span>
        {(resource.metadata as any)?.subject && <span className="text-xs bg-muted px-2 py-0.5 rounded">{(resource.metadata as any).subject}</span>}
        {(resource.metadata as any)?.gradeLevel && <span className="text-xs bg-muted px-2 py-0.5 rounded">{(resource.metadata as any).gradeLevel}</span>}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
          <Pencil className="w-4 h-4 ml-1" />{isEditing ? "عرض" : "تحرير"}
        </Button>
        <Button variant="outline" size="sm" onClick={copyContent}>
          <Copy className="w-4 h-4 ml-1" />نسخ
        </Button>
        <Button variant="outline" size="sm" className="print:hidden" onClick={() => setPreviewOpen(true)}>
          <Eye className="w-4 h-4 ml-1" />
          معاينة
        </Button>
        <A4PrintButton title={docTitle} subtitle={levelSection || undefined} />
        <VoicePlayer text={resource?.content || ""} label="النسخة الصوتية" />
      </div>

      {/* المعاينة الاحترافية: ترويسة رسمية جزائرية عند الطباعة */}
      <A4PrintContent
        title={docTitle}
        subtitle={resource?.title || undefined}
        teacherName={profile?.displayName || undefined}
        school={linkedClass?.name || profile?.school || undefined}
        province={profile?.province || undefined}
        subject={subject}
        levelSection={levelSection}
        duration={meta?.duration || linkedLesson?.duration || undefined}
        extra={linkedClass?.academicYear ? `الموسم الدراسي ${linkedClass.academicYear}` : (profile?.academicYear ? `الموسم الدراسي ${profile.academicYear}` : undefined)}
      >
        <div className="prose prose-sm max-w-none text-right mt-6" dir="rtl">
          <MarkdownRenderer source={resource?.content || ""} />
        </div>
      </A4PrintContent>

      {/* نافذة المعاينة قبل الطباعة */}
      <PrintPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        meta={resourcePrintMeta}
      >
        <div className="prose prose-sm max-w-none text-right mt-4" dir="rtl">
          <MarkdownRenderer source={resource?.content || ""} />
        </div>
      </PrintPreviewDialog>

      {isEditing ? (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div><Label>العنوان</Label>
              <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div><Label>المحتوى</Label>
              <Textarea value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} rows={16} />
            </div>
            <Button onClick={() => updateMutation.mutate({ id: resourceId, ...editForm } as any)}>
              <Save className="w-4 h-4 ml-2" />حفظ
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            {resource.content ? (
              <div className="prose prose-sm max-w-none text-right" dir="rtl">
                <MarkdownRenderer source={resource.content} />
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">لا يوجد محتوى</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
