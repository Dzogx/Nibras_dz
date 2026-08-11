import { trpc } from "@/lib/trpc";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Printer, Sparkles, Copy, GraduationCap, BookOpen, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Scale, Clock, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Streamdown } from 'streamdown';

const gradeLevels = ["السنة الأولى متوسط", "السنة الثانية متوسط", "السنة الثالثة متوسط", "السنة الرابعة متوسط"];
const subjects = ["التاريخ والجغرافيا", "التربية المدنية", "التاريخ والجغرافيا والتربية المدنية"];
const assessmentTypes = [
  { value: "quiz", label: "اختبار قصير" },
  { value: "exam", label: "امتحان فصلي" },
  { value: "rubric", label: "معايير تقييم" },
  { value: "answerKey", label: "مفتاح إجابات" },
];

interface LessonSummary {
  id: number;
  title: string;
  unitTitle?: string;
  unitNumber?: number;
  lessonNumber?: number;
  objectives?: string;
  date?: string;
}

export default function Assessment() {
  const [, setLocation] = useLocation();
  const [generated, setGenerated] = useState<string>("");
  const [resourceId, setResourceId] = useState<number | null>(null);
  const [rulesInfo, setRulesInfo] = useState<{ rulesApplied: boolean; pointDistribution: { subject: string; points: number; label: string }[]; totalPoints: number; duration: string } | null>(null);
  const [curriculumCitations, setCurriculumCitations] = useState<{ referenceNumber: number; docId: number; title: string; sourceReference: string; type: string; unitNumber?: number | null; lessonNumber?: number | null }[]>([]);
  type WeightInfo = { subject?: string; points?: number; label?: string };
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [importedLessons, setImportedLessons] = useState<LessonSummary[]>([]);
  const [selectedLessonIds, setSelectedLessonIds] = useState<number[]>([]);
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([]);

  const [form, setForm] = useState({
    classId: undefined as number | undefined,
    title: "",
    subject: subjects[0],
    gradeLevel: gradeLevels[0],
    assessmentType: "exam" as string,
    topic: "",
    duration: "",
    numQuestions: undefined as number | undefined,
    autoImport: true,
    useNationalRules: true,
  });

  const utils = trpc.useUtils();
  const { data: classesList } = trpc.classes.list.useQuery();
  const { data: teacherOSContext } = trpc.ai.getTeacherOSContext.useQuery(
    { classId: form.classId, gradeLevel: form.gradeLevel, subject: form.subject },
    { enabled: form.autoImport }
  );
  const { data: competencyCategories } = trpc.ai.getCompetencyCategories.useQuery();
  const { data: assessmentRules } = trpc.ai.getAssessmentRules.useQuery(
    { gradeLevel: form.gradeLevel, subject: form.subject },
    { enabled: form.useNationalRules }
  );

  // Auto-import completed lessons and competencies when Teacher OS context loads
  useEffect(() => {
    if (teacherOSContext && form.autoImport && teacherOSContext.completedLessons.length > 0) {
      setImportedLessons(teacherOSContext.completedLessons);
      setSelectedLessonIds(teacherOSContext.completedLessons.map(l => l.id));
      // Auto-select competencies derived from completed lessons
      if (teacherOSContext.competencies.length > 0 && selectedCompetencies.length === 0) {
        setSelectedCompetencies(teacherOSContext.competencies);
      }
    } else {
      setImportedLessons([]);
      setSelectedLessonIds([]);
    }
  }, [teacherOSContext, form.autoImport]);

  // Auto-set duration from national rules
  useEffect(() => {
    if (form.useNationalRules && assessmentRules && assessmentRules.length > 0) {
      const rule = assessmentRules[0];
      if (rule && !form.duration) {
        setForm(prev => ({ ...prev, duration: rule.duration }));
      }
      if (rule && !form.numQuestions) {
        setForm(prev => ({ ...prev, numQuestions: rule.maxQuestions }));
      }
    }
  }, [form.useNationalRules, assessmentRules]);

  // Auto-set subject for combined subjects
  useEffect(() => {
    if (form.subject === "التاريخ والجغرافيا والتربية المدنية") {
      // Default to history and geography for combined
    }
  }, [form.subject]);

  const generateMutation = trpc.ai.generateAssessment.useMutation({
    onSuccess: (data) => {
      setGenerated(data.content);
      setResourceId(data.resourceId ?? null);
      setRulesInfo({
        rulesApplied: data.rulesApplied,
        pointDistribution: data.pointDistribution as any,
        totalPoints: data.totalPoints,
        duration: data.duration,
      });
      setCurriculumCitations(data.curriculumCitations || []);
      if (data.curriculumCitations && data.curriculumCitations.length > 0) {
        toast.success(`تم التوليد مع الاستشهاد بـ ${data.curriculumCitations.length} وثيقة من قاعدة المنهاج`);
      } else {
        toast.warning("تم التوليد — لم يتم العثور على وثائق منهاج مطابقة للاستشهاد");
      }
    },
    onError: () => toast.error("خطأ في التوليد"),
  });

  const handleGenerate = useCallback(() => {
    const payload = {
      ...form,
      lessonIds: selectedLessonIds.length > 0 ? selectedLessonIds : undefined,
      competencyIds: selectedCompetencies.length > 0 ? selectedCompetencies : undefined,
    };
    generateMutation.mutate(payload as any);
  }, [form, selectedLessonIds, selectedCompetencies, generateMutation]);

  const copyContent = () => {
    navigator.clipboard.writeText(generated);
    toast.success("تم النسخ");
  };

  const printContent = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const pointDistHtml = rulesInfo && rulesInfo.pointDistribution.length > 0
      ? `<div style="text-align:center; margin:10px 0; padding:10px; border:1px solid #ddd; border-radius:8px; background:#f8fafc;">
          <strong>توزيع النقاط:</strong> ${rulesInfo.pointDistribution.map((w: WeightInfo) => `${w.label}: ${w.points} نقطة`).join(" | ")}
          <br/><strong>المجموع:</strong> ${rulesInfo.totalPoints} نقطة | <strong>المدة:</strong> ${rulesInfo.duration}
        </div>`
      : "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${form.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 2cm; }
          body { font-family: 'Cairo', sans-serif; direction: rtl; font-size: 14px; line-height: 1.8; color: #1a1a2e; }
          h1 { text-align: center; font-size: 20px; margin-bottom: 10px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          h2 { font-size: 16px; color: #2563eb; margin-top: 20px; }
          pre { white-space: pre-wrap; font-family: 'Cairo', sans-serif; }
          .info { text-align: center; color: #666; margin-bottom: 15px; font-size: 13px; }
          .rules-badge { display:inline-block; background:#2563eb; color:white; padding:2px 8px; border-radius:4px; font-size:12px; margin:5px; }
          .citations { margin-top:15px; padding:10px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; font-size:12px; }
          .citations h3 { margin:0 0 8px 0; color:#1e40af; font-size:13px; }
          .citations .cit-item { margin-bottom:4px; color:#1e3a5f; }
          .citations .cit-ref { display:inline-block; background:#1e40af; color:white; padding:1px 6px; border-radius:3px; font-size:11px; margin-left:5px; }
        </style>
      </head>
      <body>
        <h1>${form.title}</h1>
        <div class="info">
          <p>المادة: ${form.subject} | المستوى: ${form.gradeLevel}</p>
          ${pointDistHtml}
        </div>
        <pre>${generated}</pre>
        ${curriculumCitations.length > 0 ? `<div class="citations">
          <h3>الاستشهادات من وثائق المنهاج الرسمية (${curriculumCitations.length} وثيقة)</h3>
          ${curriculumCitations.map(c => `<div class="cit-item"><span class="cit-ref">[${c.referenceNumber}]</span> ${c.title} — ${c.sourceReference}${c.unitNumber ? ` (الوحدة ${c.unitNumber})` : ''}${c.lessonNumber ? ` — الدرس ${c.lessonNumber}` : ''}</div>`).join('')}
        </div>` : ''}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const toggleLessonSelection = (id: number) => {
    setSelectedLessonIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleCompetency = (name: string) => {
    setSelectedCompetencies(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const rule = assessmentRules?.[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">استوديو التقييم</h1>
        <p className="text-muted-foreground mt-1">توليد الاختبارات والامتحانات بالذكاء الاصطناعي — مرتبط بمحرك القواعد الوطنية وبيانات Teacher OS</p>
      </div>

      {/* National Rules Info Banner */}
      {form.useNationalRules && rule && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-3">
            <Scale className="w-5 h-5 text-primary shrink-0" />
            <div className="text-sm flex-1">
              <span className="font-semibold">القواعد الوطنية مطبقة تلقائياً:</span>
              <span className="mr-2">
                {rule.weights.map((w: WeightInfo) => `${w.label}: ${w.points} نقطة`).join(" | ")} | المدة: {rule.duration} | المجموع: {rule.totalPoints} نقطة
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              إعدادات التقييم
            </CardTitle>
            {teacherOSContext && teacherOSContext.completedLessons.length > 0 && (
              <CardDescription className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {teacherOSContext.completedLessons.length} درس منجز مستورد من Teacher OS
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>عنوان التقييم *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثال: اختبار الفصل الأول" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>المادة</Label>
                <Select value={form.subject} onValueChange={v => setForm({ ...form, subject: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>المستوى</Label>
                <Select value={form.gradeLevel} onValueChange={v => setForm({ ...form, gradeLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{gradeLevels.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>نوع التقييم</Label>
                <Select value={form.assessmentType} onValueChange={v => setForm({ ...form, assessmentType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{assessmentTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>المدة (تلقائي من القواعد)</Label>
                <Input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="ساعة ونصف" />
              </div>
            </div>

            <div><Label>الموضوع *</Label>
              <Input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="مثال: الثورة الجزائرية 1954" />
            </div>

            <div><Label>عدد الأسئلة (تلقائي من القواعد: {rule?.maxQuestions || 8})</Label>
              <Input type="number" value={form.numQuestions || ""} onChange={e => setForm({ ...form, numQuestions: e.target.value ? parseInt(e.target.value) : undefined })} />
            </div>

            {/* National Rules Toggle */}
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
              <Checkbox
                id="useNationalRules"
                checked={form.useNationalRules}
                onCheckedChange={(c) => setForm({ ...form, useNationalRules: c === true })}
              />
              <Label htmlFor="useNationalRules" className="cursor-pointer text-sm">
                تطبيق القواعد الوطنية للتقويم
              </Label>
              <Badge variant="outline" className="text-xs">تلقائي</Badge>
            </div>

            {/* Advanced: Teacher OS Integration */}
            <div>
              <Button
                variant="outline"
                className="w-full flex items-center justify-between"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  خيارات Teacher OS المتقدمة
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {showAdvanced && (
                <div className="mt-3 space-y-4 border rounded-lg p-4 bg-card">
                  {/* Auto Import Toggle */}
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="autoImport"
                      checked={form.autoImport}
                      onCheckedChange={(c) => setForm({ ...form, autoImport: c === true })}
                    />
                    <Label htmlFor="autoImport" className="text-sm cursor-pointer">
                      استيراد تلقائي للدروس المنجزة من Teacher OS
                    </Label>
                  </div>

                  {/* Completed Lessons Selection */}
                  <div>
                    <Label className="mb-2 block text-sm">الدروس المنجزة ({importedLessons.length} درس)</Label>
                    <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3">
                      {importedLessons.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {form.autoImport
                            ? "لا توجد دروس منجزة مسجلة بعد. أضف دروساً في Teacher OS وعلّمها كمكتملة."
                            : "فعّل الاستيراد التلقائي لعرض الدروس المنجزة."}
                        </p>
                      ) : (
                        importedLessons.map(lesson => (
                          <div key={lesson.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`lesson-${lesson.id}`}
                              checked={selectedLessonIds.includes(lesson.id)}
                              onCheckedChange={() => toggleLessonSelection(lesson.id)}
                            />
                            <Label htmlFor={`lesson-${lesson.id}`} className="text-sm cursor-pointer flex-1">
                              {lesson.unitTitle && <span className="text-xs text-muted-foreground">[{lesson.unitTitle}] </span>}
                              {lesson.title}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Competency Selection */}
                  <div>
                    <Label className="mb-2 block text-sm">الكفاءات المستهدفة</Label>
                    <div className="flex flex-wrap gap-2">
                      {competencyCategories?.map(cat => (
                        <Badge
                          key={cat.id}
                          variant={selectedCompetencies.includes(cat.name) ? "default" : "outline"}
                          className="cursor-pointer text-xs py-1"
                          onClick={() => toggleCompetency(cat.name)}
                        >
                          {selectedCompetencies.includes(cat.name) && <CheckCircle2 className="w-3 h-3 ml-1" />}
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Class Selection */}
                  {classesList && classesList.length > 0 && (
                    <div>
                      <Label>الفلترة حسب الفصل</Label>
                      <Select value={form.classId ? String(form.classId) : "all"} onValueChange={v => setForm({ ...form, classId: v === "all" ? undefined : parseInt(v) })}>
                        <SelectTrigger><SelectValue placeholder="جميع الفصول" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع الفصول</SelectItem>
                          {classesList.map(c => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button className="w-full" onClick={handleGenerate} disabled={generateMutation.isPending || !form.title || !form.topic}>
              {generateMutation.isPending ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري التوليد...</> : <>
                <Sparkles className="w-4 h-4 ml-2" />توليد التقييم
              </>}
            </Button>
          </CardContent>
        </Card>

        {/* Output Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>التقييم المُولّد</CardTitle>
              {generated && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyContent}>
                    <Copy className="w-4 h-4 ml-1" />نسخ
                  </Button>
                  <Button variant="outline" size="sm" onClick={printContent}>
                    <Printer className="w-4 h-4 ml-1" />طباعة A4
                  </Button>
                  {resourceId && (
                    <Button size="sm" onClick={() => setLocation(`/content-library/${resourceId}`)}>
                      <BookOpen className="w-4 h-4 ml-1" />المكتبة
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generateMutation.isPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : generated ? (
              <div>
                {/* Rules Applied Info */}
                {rulesInfo && rulesInfo.rulesApplied && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-800">تم تطبيق القواعد الوطنية</span>
                    </div>
                    <div className="text-green-700">
                      توزيع النقاط: {rulesInfo.pointDistribution.map(w => `${w.label}: ${w.points} نقطة`).join(" | ")}
                    </div>
                    <div className="text-green-700">
                      المدة: {rulesInfo.duration} | المجموع: {rulesInfo.totalPoints} نقطة
                    </div>
                  </div>
                )}

                {/* Curriculum Citations */}
                {curriculumCitations.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-800">الاستشهادات من وثائق المنهاج الرسمية ({curriculumCitations.length} وثيقة)</span>
                    </div>
                    <div className="space-y-1">
                      {curriculumCitations.map(c => (
                        <div key={c.referenceNumber} className="flex items-start gap-2 text-blue-700">
                          <Badge variant="outline" className="text-xs shrink-0">[مرجع: {c.referenceNumber}]</Badge>
                          <span>
                            {c.title} — {c.sourceReference}
                            {c.unitNumber ? ` (الوحدة ${c.unitNumber})` : ""}
                            {c.lessonNumber ? ` — الدرس ${c.lessonNumber}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-blue-500 italic">كل سؤال في التقييم مرتبط بوثيقة المنهاج المرجعية المناسبة من القائمة أعلاه.</p>
                  </div>
                )}
                <div className="prose prose-sm max-w-none text-right" dir="rtl">
                  <Streamdown>{generated}</Streamdown>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p>أدخل إعدادات التقييم ثم اضغط "توليد التقييم"</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>القواعد الوطنية تُطبق تلقائياً حسب المستوى والمادة</span>
                </div>
                <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <ListChecks className="w-4 h-4" />
                  <span>الدروس المنجزة تُستورد من Teacher OS</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
