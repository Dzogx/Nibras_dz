import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowRight, Save, Pencil, Copy, Printer, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { A4PrintButton, A4PrintContent } from "@/components/A4Print";
import { PrintPreviewDialog } from "@/components/PrintPreviewDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LOGO_URL } from "@/components/A4Print";
import { Eye } from "lucide-react";
import { VoicePlayer } from "@/components/VoicePlayer";
import { downloadGeneratedPdf } from "@/lib/pdfDownload";

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
  const [multiOpen, setMultiOpen] = useState(false);

  const exportAssessmentPdf = trpc.ai.exportAssessmentPdf.useMutation({
    onSuccess: (result) => {
      downloadGeneratedPdf(result);
      toast.success("تم تنزيل PDF عالي الجودة وجاهز للطباعة.");
    },
    onError: (error) => toast.error(error.message || "تعذر تجهيز ملف PDF الآن. أعد المحاولة لاحقًا."),
  });
  const exportLessonPlanPdf = trpc.ai.exportLessonPlanPdf.useMutation({
    onSuccess: (result) => {
      downloadGeneratedPdf(result);
      toast.success("تم تنزيل PDF عالي الجودة وجاهز للطباعة.");
    },
    onError: (error) => toast.error(error.message || "تعذر تجهيز ملف PDF الآن. أعد المحاولة لاحقًا."),
  });

  // الطباعة المتعددة للأقسام: التقويم التحصيلي وثيقة موحّدة لكل المستوى
  const { data: allClasses } = trpc.classes.list.useQuery(undefined, {
    enabled: Boolean(multiOpen) && (resource?.type === "exam" || resource?.type === "quiz"),
    staleTime: 60_000,
  });
  const levelClasses = useMemo(() => {
    const gl = meta?.gradeLevel || linkedClass?.gradeLevel;
    const year = linkedClass?.academicYear || profile?.academicYear;
    return (allClasses ?? []).filter((c) => c.gradeLevel === gl && (!year || !c.academicYear || c.academicYear === year));
  }, [allClasses, meta?.gradeLevel, linkedClass, profile?.academicYear]);

  // توليد HTML طباعة كامل لكل قسم (ترويسة رسمية + محتوى التقويم الموّحد)
  const buildMultiPrintHtml = (cls: { id: number; name: string; gradeLevel: string; section?: string | null; academicYear?: string | null }) => {
    const yearStr = cls.academicYear || profile?.academicYear || "";
    const sectionName = cls.section ? `القسم ${cls.section}` : cls.name;
    const safeTitle = String(docTitle).replace(/"/g, "&quot;");
    const safeContent = (resource?.content || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Noto Naskh Arabic', 'Cairo', 'Amiri', sans-serif;
    color: #0f172a; font-size: 11pt; line-height: 1.75;
    direction: rtl; text-align: right;
    background: #ffffff;
  }
  .page { padding: 16mm 14mm 20mm 14mm; }
  .page + .page { page-break-before: always; }
  .hr-top { display: flex; justify-content: space-between; align-items: flex-start; font-size: 9pt; }
  .hr-top > div { min-width: 30%; }
  .hr-logo { text-align: center; width: 110px; font-size: 9.5pt; font-weight: 700; line-height: 1.5; }
  .hr-divider { border-top: 1.5px solid #0f172a; margin: 5px 0; }
  .hr-row { display: flex; justify-content: space-between; font-size: 9pt; }
  .hr-row .main { font-weight: 600; }
  .hr-fields { font-size: 9pt; }
  .doc-title { text-align: center; font-weight: 700; font-size: 13pt; margin: 8px 0 6px; text-decoration: underline; }
  .body { margin-top: 10px; }
  .footer { display: flex; justify-content: space-between; align-items: center; gap: 8px;
    font-size: 8pt; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 4px; margin-top: 18px; }
  .footer img { display: none; }
</style>
</head>
<body>
<div class="page">
  <div class="hr-top">
    <div>مديرية التربية لولاية ${profile?.province || "..........................."}</div>
    <div class="hr-logo">الجمهورية الجزائرية الديمقراطية الشعبية<br/>وزارة التربية الوطنية</div>
    <div>متوسطة: ${profile?.school || "......................................."} – المحادمة</div>
    <div>المستوى: ${cls.gradeLevel}${cls.section ? ` - ${sectionName}` : ""}</div>
  </div>
  <div class="hr-divider"></div>
  <div class="hr-row">
    <div class="main">${safeTitle}${subject ? " في مادة: " + subject : ""}${yearStr ? " <br/><span style=\"font-size:8pt;font-weight:400\">الموسم الدراسي " + yearStr + "</span>" : ""}</div>
    <div>التاريخ: ............../............../..............</div>
    <div>المدة: ${meta?.duration || "......................."}</div>
  </div>
  <div class="hr-divider"></div>
  ${profile?.displayName ? '<div class="hr-fields">الأستاذ(ة): ' + profile.displayName + "</div><div class=\"hr-divider\"></div>" : ""}
  ${resource?.title ? '<div class="doc-title">' + resource.title.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</div>" : ""}
  <div class="body">${safeContent}</div>
  <div class="footer">
    <span>مذكرة بيداغوجية</span>
    <span>صفحة 1</span>
  </div>
</div>
</body>
</html>`;
  };

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

  const isAssessment = resource?.type === "quiz" || resource?.type === "exam" || resource?.type === "rubric" || resource?.type === "answerKey";
  const isLessonPlan = resource?.type === "lessonPlan";
  const canExportPdf = Boolean((isAssessment || isLessonPlan) && subject && gradeLevel && resource?.content);
  const isPdfExporting = exportAssessmentPdf.isPending || exportLessonPlanPdf.isPending;

  const exportPdf = () => {
    if (!resource || !canExportPdf) {
      toast.error("يلزم توفر المادة والمستوى ومحتوى الوثيقة قبل تصدير PDF.");
      return;
    }

    if (isLessonPlan) {
      exportLessonPlanPdf.mutate({
        title: resource.title || "مذكرة بيداغوجية",
        content: resource.content,
        subject,
        gradeLevel,
        printTheme: "official",
        unitTitle: meta?.unitTitle || linkedLesson?.unitTitle || undefined,
        duration: meta?.duration || linkedLesson?.duration || undefined,
        academicYear: linkedClass?.academicYear || profile?.academicYear || undefined,
        teacherName: profile?.displayName || undefined,
        school: profile?.school || undefined,
        province: profile?.province || undefined,
        className: linkedClass?.name || undefined,
        objectives: meta?.objectives || linkedLesson?.objectives || undefined,
        lessonNumber: meta?.lessonNumber || linkedLesson?.lessonNumber || undefined,
        unitNumber: meta?.unitNumber || linkedLesson?.unitNumber || undefined,
        serialNumber: resource.serialNumber || undefined,
      });
      return;
    }

    exportAssessmentPdf.mutate({
      title: resource.title || docTitle,
      content: resource.content,
      subject,
      gradeLevel,
      assessmentType: resource.type as "quiz" | "exam" | "rubric" | "answerKey",
      printTheme: "official",
      topic: meta?.topic || undefined,
      duration: meta?.duration || linkedLesson?.duration || undefined,
      totalPoints: meta?.totalPoints || undefined,
      teacherName: profile?.displayName || undefined,
      school: profile?.school || undefined,
      className: linkedClass?.name || undefined,
      assessmentDate: meta?.assessmentDate || undefined,
    });
  };

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
        {(resource?.type === "exam" || resource?.type === "quiz") && (
          <Button variant="outline" size="sm" className="print:hidden" onClick={() => setMultiOpen(true)}>
            <Printer className="w-4 h-4 ml-1" />
            طباعة لكل الأقسام
          </Button>
        )}
        {(isAssessment || isLessonPlan) && (
          <Button
            variant="outline"
            size="sm"
            className="print:hidden"
            disabled={!canExportPdf || isPdfExporting}
            onClick={exportPdf}
            title={canExportPdf ? "تنزيل نسخة PDF عالية الجودة" : "أكمل المادة والمستوى ومحتوى الوثيقة أولاً"}
          >
            {isPdfExporting ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <FileDown className="w-4 h-4 ml-1" />}
            {isPdfExporting ? "جارٍ تجهيز PDF..." : "تنزيل PDF"}
          </Button>
        )}
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

      {/* طباعة التقويم الموّحد لكل أقسام المستوى: كل قسم في صفحة مستقلة */}
      <Dialog open={multiOpen} onOpenChange={setMultiOpen}>
        <DialogContent className="max-w-[92vw] w-[900px] max-h-[92vh] p-0 gap-0 overflow-hidden" dir="rtl">
          <DialogHeader className="px-5 pt-4 pb-2 border-b bg-muted/40 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base">
                  {"طباعة التقويم لكل أقسام المستوى"}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {"التقويم التحصيلي وثيقة موحّدة للمستوى " + (meta?.gradeLevel || linkedClass?.gradeLevel || "") + " — نفس الورقة لجميع الأقسام (" + levelClasses.length + " أقسام)"}
                </DialogDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                                    const frames = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe[title^='نبراس - طباعة الأقسام:']"));
                  frames.forEach((f) => f.contentWindow?.print());
                }}
              >
                <Printer className="w-4 h-4 ml-1" />طباعة الآن
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-neutral-200/80 px-4 py-6 min-h-0 grid gap-6">
            {levelClasses.map((c) => (
              <iframe
                key={c.id}
                title={`نبراس - طباعة الأقسام: ${c.name}`}
                className="w-full border-0"
                style={{ minHeight: "1123px" }}
                srcDoc={buildMultiPrintHtml(c)}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

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
