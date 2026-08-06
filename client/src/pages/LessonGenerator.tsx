import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Streamdown } from 'streamdown';

const gradeLevels = ["السنة الأولى متوسط", "السنة الثانية متوسط", "السنة الثالثة متوسط", "السنة الرابعة متوسط"];
const subjects = ["التاريخ والجغرافيا", "التربية المدنية", "التاريخ والجغرافيا والتربية المدنية"];
const contentTypes = [
  { value: "lessonPlan", label: "خطة درس" },
  { value: "activity", label: "نشاط تعلم نشط" },
  { value: "homework", label: "واجب منزلي" },
  { value: "classQuestions", label: "أسئلة صفية" },
  { value: "differentiation", label: "استراتيجيات تمييز" },
];

export default function LessonGenerator() {
  const [, setLocation] = useLocation();
  const [generated, setGenerated] = useState<string>("");
  const [resourceId, setResourceId] = useState<number | null>(null);
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
