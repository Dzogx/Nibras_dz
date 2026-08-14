import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, Save, CheckCircle2, Clock, Plus, FileText, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { A4PrintButton, A4PrintContent } from "@/components/A4Print";
import { PrintPreviewDialog } from "@/components/PrintPreviewDialog";
import { Eye } from "lucide-react";
import { TEACHING_TEMPLATES, type TeachingTemplateKey } from "@shared/teachingTemplates";

export default function LessonDetail({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const lessonId = parseInt(id);
  const utils = trpc.useUtils();
  const { data: lesson, isLoading } = trpc.lessons.getById.useQuery({ id: lessonId });
  const { data: cls } = trpc.classes.getById.useQuery(
    { id: lesson?.classId ?? 0 },
    { enabled: Boolean(lesson?.classId) }
  );
  const { data: profile } = trpc.profile.get.useQuery(undefined, { staleTime: 60_000 });
  const [previewOpen, setPreviewOpen] = useState(false);

  const printMeta = useMemo(() => ({
    title: "مذكرة بيداغوجية",
    subtitle: lesson?.unitTitle || undefined,
    teacherName: profile?.displayName || undefined,
    school: cls?.name || profile?.school || undefined,
    province: profile?.province || undefined,
    subject: lesson?.subject || undefined,
    levelSection: cls ? `${cls.gradeLevel}${cls.section ? ` — القسم ${cls.section}` : ""}` : (lesson?.gradeLevel || undefined),
    duration: lesson?.duration || undefined,
    date: lesson?.date ? new Date(lesson.date).toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" }) : undefined,
    extra: cls?.academicYear ? `الموسم الدراسي ${cls.academicYear}` : (profile?.academicYear ? `الموسم الدراسي ${profile.academicYear}` : undefined),
  }), [lesson, cls, profile]);

  const [editForm, setEditForm] = useState({
    title: lesson?.title || "",
    subject: lesson?.subject || "",
    gradeLevel: lesson?.gradeLevel || "",
    unitTitle: lesson?.unitTitle || "",
    content: lesson?.content || "",
    plan: lesson?.plan || "",
    objectives: lesson?.objectives || "",
    duration: lesson?.duration || "",
    notes: lesson?.notes || "",
  });

  // Sync when data loads
  if (lesson && !editForm.title) {
    setEditForm({
      title: lesson.title || "",
      subject: lesson.subject || "",
      gradeLevel: lesson.gradeLevel || "",
      unitTitle: lesson.unitTitle || "",
      content: lesson.content || "",
      plan: lesson.plan || "",
      objectives: lesson.objectives || "",
      duration: lesson.duration || "",
      notes: lesson.notes || "",
    });
  }

  const updateMutation = trpc.lessons.update.useMutation({
    onSuccess: () => {
      utils.lessons.getById.invalidate({ id: lessonId });
      utils.lessons.list.invalidate();
      toast.success("تم تحديث الدرس");
    },
    onError: () => toast.error("خطأ في التحديث"),
  });

  const toggleMutation = trpc.lessons.toggleCompleted.useMutation({
    onSuccess: () => {
      utils.lessons.getById.invalidate({ id: lessonId });
      utils.lessons.list.invalidate();
      toast.success("تم تحديث الحالة");
    },
  });

  // Notes
  const { data: notes } = trpc.teachingNotes.list.useQuery({ lessonId });
  const [newNote, setNewNote] = useState("");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<TeachingTemplateKey>("guided_inquiry");

  const addNoteMutation = trpc.teachingNotes.create.useMutation({
    onSuccess: () => {
      utils.teachingNotes.list.invalidate({ lessonId });
      setNewNote("");
      toast.success("تمت إضافة الملاحظة");
    },
  });

  useEffect(() => {
    const templateTag = Array.isArray(lesson?.tags)
      ? lesson.tags.find(tag => typeof tag === "string" && tag.startsWith("قالب تدريس:"))
      : undefined;
    const matchedTemplate = TEACHING_TEMPLATES.find(template => templateTag === `قالب تدريس: ${template.label}`);
    if (matchedTemplate) setSelectedTemplateKey(matchedTemplate.key);
  }, [lesson?.id, lesson?.tags]);

  const generateMemoMutation = trpc.ai.generateLesson.useMutation({
    onSuccess: async (data) => {
      await updateMutation.mutateAsync({ id: lessonId, content: data.content });
      utils.aiResources.list.invalidate();
      toast.success(`تم توليد المذكرة وفق قالب «${data.teachingTemplate?.label || "الحصة"}»`);
    },
    onError: () => toast.error("تعذر توليد المذكرة. حاول مجدداً."),
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;
  if (!lesson) return <div className="text-center py-12">الدرس غير موجود</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/lessons")}>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <Button
          variant={lesson.isCompleted ? "default" : "outline"}
          size="sm"
          onClick={() => toggleMutation.mutate({ id: lessonId, isCompleted: !lesson.isCompleted })}
        >
          {lesson.isCompleted ? <><CheckCircle2 className="w-4 h-4 ml-1" />منجز</> : <><Clock className="w-4 h-4 ml-1" />معلّق</>}
        </Button>
        {lesson.subject && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{lesson.subject}</span>}
        {lesson.gradeLevel && <span className="text-xs bg-muted px-2 py-0.5 rounded">{lesson.gradeLevel}</span>}
        {lesson.unitTitle && <span className="text-xs bg-muted px-2 py-0.5 rounded">{lesson.unitTitle}</span>}
        <Button variant="outline" size="sm" className="print:hidden" onClick={() => setPreviewOpen(true)}>
          <Eye className="w-4 h-4 ml-1" />
          معاينة
        </Button>
        <A4PrintButton
          title="مذكرة بيداغوجية"
          subtitle={`${cls?.name || lesson.gradeLevel || ""}${cls?.section ? ` — القسم ${cls.section}` : ""}`}
        />
      </div>

      {/* المعاينة الاحترافية: ترويسة رسمية عند الطباعة */}
      <A4PrintContent {...printMeta}>
        <div id="lesson-print-body" className="prose prose-sm max-w-none text-right mt-6" dir="rtl">
          {lesson.plan && (
            <div className="mb-5">
              <h2 className="text-base font-bold mb-2">خطة سير الحصة</h2>
              <div className="whitespace-pre-wrap">{lesson.plan}</div>
            </div>
          )}
          {lesson.objectives && (
            <div className="mb-5">
              <h2 className="text-base font-bold mb-2">الأهداف</h2>
              <div className="whitespace-pre-wrap">{lesson.objectives}</div>
            </div>
          )}
          {lesson.content && (
            <div className="mb-5">
              <h2 className="text-base font-bold mb-2">المحتوى</h2>
              <div className="whitespace-pre-wrap">{lesson.content}</div>
            </div>
          )}
        </div>
      </A4PrintContent>

      {/* نافذة المعاينة قبل الطباعة */}
      <PrintPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        meta={printMeta}
      >
        <div className="prose prose-sm max-w-none text-right mt-4" dir="rtl">
          {lesson.plan && (
            <div className="mb-5">
              <h2 className="text-base font-bold mb-2">خطة سير الحصة</h2>
              <div className="whitespace-pre-wrap">{lesson.plan}</div>
            </div>
          )}
          {lesson.objectives && (
            <div className="mb-5">
              <h2 className="text-base font-bold mb-2">الأهداف</h2>
              <div className="whitespace-pre-wrap">{lesson.objectives}</div>
            </div>
          )}
          {lesson.content && (
            <div className="mb-5">
              <h2 className="text-base font-bold mb-2">المحتوى</h2>
              <div className="whitespace-pre-wrap">{lesson.content}</div>
            </div>
          )}
        </div>
      </PrintPreviewDialog>

      {/* Edit Form */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            إطار بناء المذكرة
          </CardTitle>
          <p className="text-sm text-muted-foreground">اختر طريقة سير الحصة قبل التوليد. لا يغيّر القالب الوضعية أو أهدافها الرسمية.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {TEACHING_TEMPLATES.map(template => {
              const isSelected = selectedTemplateKey === template.key;
              return (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => setSelectedTemplateKey(template.key)}
                  className={`rounded-lg border p-3 text-right transition-colors ${isSelected ? "border-primary bg-background shadow-sm" : "border-border bg-background/70 hover:border-primary/50"}`}
                  aria-pressed={isSelected}
                >
                  <span className="block text-sm font-semibold">{template.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{template.description}</span>
                </button>
              );
            })}
          </div>
          <Button
            onClick={() => generateMemoMutation.mutate({
              lessonId,
              classId: lesson.classId || undefined,
              title: lesson.title,
              subject: lesson.subject || "الاجتماعيات",
              gradeLevel: lesson.gradeLevel || "",
              unitTitle: lesson.unitTitle || undefined,
              unitNumber: lesson.unitNumber || undefined,
              lessonNumber: lesson.lessonNumber || undefined,
              duration: lesson.duration || undefined,
              contentType: "lessonPlan",
              teachingTemplateKey: selectedTemplateKey,
            })}
            disabled={generateMemoMutation.isPending}
          >
            {generateMemoMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
            {lesson.content ? "إعادة توليد محتوى المذكرة" : "توليد محتوى المذكرة"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="w-4 h-4 text-primary" />
            تحرير الدرس
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>العنوان</Label>
            <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>المادة</Label>
              <Input value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })} />
            </div>
            <div><Label>المستوى</Label>
              <Input value={editForm.gradeLevel} onChange={e => setEditForm({ ...editForm, gradeLevel: e.target.value })} />
            </div>
          </div>
          <div><Label>عنوان الوضعية التعليمية</Label>
            <Input value={editForm.unitTitle} onChange={e => setEditForm({ ...editForm, unitTitle: e.target.value })} placeholder="مثال: الحياة الجماعية" />
          </div>
          <div><Label>المدة</Label>
            <Input value={editForm.duration} onChange={e => setEditForm({ ...editForm, duration: e.target.value })} />
          </div>
          <div><Label>الأهداف</Label>
            <Textarea value={editForm.objectives} onChange={e => setEditForm({ ...editForm, objectives: e.target.value })} rows={3} />
          </div>
          <div><Label>الخطة</Label>
            <Textarea value={editForm.plan} onChange={e => setEditForm({ ...editForm, plan: e.target.value })} rows={4} />
          </div>
          <div><Label>المحتوى</Label>
            <Textarea value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} rows={6} />
          </div>
          <Button onClick={() => updateMutation.mutate({ id: lessonId, ...editForm } as any)}>
            <Save className="w-4 h-4 ml-2" />حفظ التغييرات
          </Button>
        </CardContent>
      </Card>

      {/* Teaching Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            ملاحظات التدريس
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="أضف ملاحظة..." />
            <Button size="sm" onClick={() => addNoteMutation.mutate({ lessonId, content: newNote })} disabled={!newNote}>
              <Plus className="w-4 h-4 ml-1" />إضافة
            </Button>
          </div>
          {notes && notes.length > 0 ? (
            <div className="space-y-2">
              {notes.map(note => (
                <div key={note.id} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(note.createdAt).toLocaleDateString("ar-DZ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">لا توجد ملاحظات</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
