import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Loader2, Copy, Download, GraduationCap, Brain, Users, Target, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Streamdown } from 'streamdown';
import { Separator } from "@/components/ui/separator";

const gradeLevels = ["السنة الأولى متوسط", "السنة الثانية متوسط", "السنة الثالثة متوسط", "السنة الرابعة متوسط"];
const subjects = ["التاريخ والجغرافيا", "الجغرافيا", "التربية المدنية", "التاريخ والجغرافيا والتربية المدنية"];
const contentTypes = [
  { value: "lessonPlan", label: "خطة درس" },
  { value: "activity", label: "نشاط تعلم نشط" },
  { value: "homework", label: "واجب منزلي" },
  { value: "classQuestions", label: "أسئلة صفية" },
  { value: "differentiation", label: "استراتيجيات تمييز" },
];

const studentLevels = [
  { value: "mixed", label: "مختلطة (جميع المستويات)", description: "مناسب لفصل متنوع المستويات" },
  { value: "advanced", label: "متقدمين (أقوياء)", description: "تلاميذ متميزون في المادة" },
  { value: "average", label: "متوسطين (عاديون)", description: "المستوى المتوسط للفصل" },
  { value: "needs_support", label: "يحتاجون دعماً إضافياً", description: "تلاميذ يعانون صعوبات" },
];

const learningStyles = [
  { value: "mixed", label: "متنوع (جميع الأنماط)", description: "يتضمن أساليب متنوعة" },
  { value: "visual", label: "بصري", description: "رسومات، خرائط، مخططات" },
  { value: "auditory", label: "سمعي", description: "مناقشات، استماع، شروحات" },
  { value: "kinesthetic", label: "حركي", description: "تمارين، ألعاب، عمل يدوي" },
];

const bloomLevels = [
  { value: "remember", label: "تذكر" },
  { value: "understand", label: "فهم" },
  { value: "apply", label: "تطبيق" },
  { value: "analyze", label: "تحليل" },
  { value: "evaluate", label: "تقييم" },
  { value: "create", label: "إبداع" },
];

const activityTypes = [
  { value: "mixed", label: "متنوع" },
  { value: "group_work", label: "عمل جماعي" },
  { value: "individual", label: "عمل فردي" },
  { value: "pair_work", label: "عمل ثنائي" },
  { value: "whole_class", label: "فوج كامل" },
];

const difficultyLevels = [
  { value: "progressive", label: "تصاعدي (من السهل إلى الصعب)" },
  { value: "easy", label: "سهل" },
  { value: "medium", label: "متوسط" },
  { value: "hard", label: "صعب" },
];

const supportStrategies = [
  { value: "scaffolding", label: "سقالة تعليمية (دعم تدريجي)" },
  { value: "extension", label: "توسيع وتعميق" },
  { value: "simplification", label: "تبسيط وتبديل" },
  { value: "enrichment", label: "إثراء" },
  { value: "none", label: "بدون استراتيجية محددة" },
];

export default function LessonGenerator() {
  const [, setLocation] = useLocation();
  const [generated, setGenerated] = useState<string>("");
  const [resourceId, setResourceId] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    classId: undefined as number | undefined,
    title: "",
    subject: subjects[0],
    gradeLevel: gradeLevels[0],
    unitTitle: "",
    unitNumber: undefined as number | undefined,
    lessonNumber: undefined as number | undefined,
    duration: "",
    contentType: "lessonPlan" as string,
    // Differentiation
    enableDifferentiation: false,
    studentLevel: "mixed" as string,
    learningStyle: "mixed" as string,
    bloomLevel: "apply" as string,
    activityType: "mixed" as string,
    difficultyLevel: "progressive" as string,
    supportStrategy: "scaffolding" as string,
  });

  const utils = trpc.useUtils();
  const { data: classesList } = trpc.classes.list.useQuery();

  const generateMutation = trpc.ai.generateLesson.useMutation({
    onSuccess: (data) => {
      setGenerated(data.content);
      setResourceId(data.resourceId ?? null);
      toast.success("تم توليد المحتوى بنجاح");
    },
    onError: () => toast.error("خطأ في التوليد"),
  });

  const copyContent = () => {
    navigator.clipboard.writeText(generated);
    toast.success("تم نسخ المحتوى");
  };

  const downloadContent = () => {
    const blob = new Blob([generated], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">مُولّد الدروس بالذكاء الاصطناعي</h1>
        <p className="text-muted-foreground mt-1">توليد خطط الدروس والأنشطة والأسئلة بالاستناد إلى المنهج الرسمي</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              إعدادات التوليد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Fields */}
            <div><Label>عنوان الدرس *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثال: الثورة الجزائرية" />
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
              <div><Label>نوع المحتوى</Label>
                <Select value={form.contentType} onValueChange={v => setForm({ ...form, contentType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{contentTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>المدة</Label>
                <Input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="1 ساعة" />
              </div>
            </div>
            <div><Label>عنوان الوحدة</Label>
              <Input value={form.unitTitle} onChange={e => setForm({ ...form, unitTitle: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>رقم الوحدة</Label>
                <Input type="number" value={form.unitNumber || ""} onChange={e => setForm({ ...form, unitNumber: e.target.value ? parseInt(e.target.value) : undefined })} />
              </div>
              <div><Label>رقم الدرس</Label>
                <Input type="number" value={form.lessonNumber || ""} onChange={e => setForm({ ...form, lessonNumber: e.target.value ? parseInt(e.target.value) : undefined })} />
              </div>
            </div>

            {/* Advanced Differentiation Toggle */}
            <Separator className="my-4" />
            <button
              type="button"
              className="w-full flex items-center justify-between text-right text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                خيارات تفريد التعليم المتقدمة
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="space-y-4 border border-primary/20 rounded-lg p-4 bg-primary/5">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <Label className="text-sm font-semibold">تفعيل تفريد التعليم</Label>
                  </div>
                  <Switch
                    checked={form.enableDifferentiation}
                    onCheckedChange={checked => setForm({ ...form, enableDifferentiation: checked })}
                  />
                </div>

                {form.enableDifferentiation && (
                  <>
                    <Separator />
                    <div>
                      <Label className="flex items-center gap-1.5 text-sm">
                        <Users className="w-3.5 h-3.5" />
                        مستوى التلاميذ
                      </Label>
                      <p className="text-xs text-muted-foreground mb-1.5">حدد المستوى التعليمي للتلاميذ المستهدفين</p>
                      <Select value={form.studentLevel} onValueChange={v => setForm({ ...form, studentLevel: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {studentLevels.map(l => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="flex items-center gap-1.5 text-sm">
                        <Layers className="w-3.5 h-3.5" />
                        نمط التعلم المفضل
                      </Label>
                      <p className="text-xs text-muted-foreground mb-1.5">حدد نمط التعلم لتخصيص الأنشطة</p>
                      <Select value={form.learningStyle} onValueChange={v => setForm({ ...form, learningStyle: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {learningStyles.map(l => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="flex items-center gap-1.5 text-sm">
                        <Brain className="w-3.5 h-3.5" />
                        مستوى تصنيف بلوم المستهدف
                      </Label>
                      <p className="text-xs text-muted-foreground mb-1.5">حدد المستوى المعرفي المطلوب</p>
                      <Select value={form.bloomLevel} onValueChange={v => setForm({ ...form, bloomLevel: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {bloomLevels.map(l => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="flex items-center gap-1.5 text-sm">
                        <Users className="w-3.5 h-3.5" />
                        نوع النشاط
                      </Label>
                      <p className="text-xs text-muted-foreground mb-1.5">حدد شكل تنظيم النشاط</p>
                      <Select value={form.activityType} onValueChange={v => setForm({ ...form, activityType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {activityTypes.map(l => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="flex items-center gap-1.5 text-sm">
                        <Target className="w-3.5 h-3.5" />
                        مستوى الصعوبة
                      </Label>
                      <p className="text-xs text-muted-foreground mb-1.5">حدد مستوى التحدي المطلوب</p>
                      <Select value={form.difficultyLevel} onValueChange={v => setForm({ ...form, difficultyLevel: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {difficultyLevels.map(l => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="flex items-center gap-1.5 text-sm">
                        <GraduationCap className="w-3.5 h-3.5" />
                        استراتيجية الدعم
                      </Label>
                      <p className="text-xs text-muted-foreground mb-1.5">حدد طريقة التكييف</p>
                      <Select value={form.supportStrategy} onValueChange={v => setForm({ ...form, supportStrategy: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {supportStrategies.map(l => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            )}

            <Button className="w-full" onClick={() => generateMutation.mutate(form as any)} disabled={generateMutation.isPending || !form.title}>
              {generateMutation.isPending ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري التوليد...</> : <>
                <Sparkles className="w-4 h-4 ml-2" />توليد
              </>}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>المحتوى المُولّد</CardTitle>
              {generated && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyContent}>
                    <Copy className="w-4 h-4 ml-1" />نسخ
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadContent}>
                    <Download className="w-4 h-4 ml-1" />تحميل
                  </Button>
                  {resourceId && (
                    <Button size="sm" onClick={() => setLocation(`/content-library/${resourceId}`)}>
                      عرض في المكتبة
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
              <div className="prose prose-sm max-w-none text-right" dir="rtl">
                <Streamdown>{generated}</Streamdown>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p>أدخل إعدادات الدرس ثم اضغط "توليد"</p>
                <p className="text-xs mt-2 text-muted-foreground/60">
                  فعّل خيارات تفريد التعليم لتخصيص المحتوى حسب مستوى تلاميذك
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
