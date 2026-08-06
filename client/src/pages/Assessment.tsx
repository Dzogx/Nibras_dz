import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Printer, Sparkles, Copy } from "lucide-react";
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

export default function Assessment() {
  const [, setLocation] = useLocation();
  const [generated, setGenerated] = useState<string>("");
  const [resourceId, setResourceId] = useState<number | null>(null);
  const [form, setForm] = useState({
    classId: undefined as number | undefined,
    title: "",
    subject: subjects[0],
    gradeLevel: gradeLevels[0],
    assessmentType: "quiz" as string,
    topic: "",
    duration: "",
    numQuestions: undefined as number | undefined,
  });

  const utils = trpc.useUtils();
  const { data: classesList } = trpc.classes.list.useQuery();

  const generateMutation = trpc.ai.generateAssessment.useMutation({
    onSuccess: (data) => {
      setGenerated(data.content);
      setResourceId(data.resourceId ?? null);
      toast.success("تم توليد التقييم بنجاح");
    },
    onError: () => toast.error("خطأ في التوليد"),
  });

  const copyContent = () => {
    navigator.clipboard.writeText(generated);
    toast.success("تم النسخ");
  };

  const printContent = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
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
          h1 { text-align: center; font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          h2 { font-size: 16px; color: #2563eb; margin-top: 24px; }
          pre { white-space: pre-wrap; font-family: 'Cairo', sans-serif; }
          .info { text-align: center; color: #666; margin-bottom: 20px; font-size: 13px; }
        </style>
      </head>
      <body>
        <h1>${form.title}</h1>
        <div class="info">
          <p>المادة: ${form.subject} | المستوى: ${form.gradeLevel} | النوع: ${form.assessmentType}</p>
        </div>
        <pre>${generated}</pre>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">استوديو التقييم</h1>
        <p className="text-muted-foreground mt-1">توليد الاختبارات والامتحانات والمعايير بالذكاء الاصطناعي</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              إعدادات التقييم
            </CardTitle>
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
              <div><Label>المدة</Label>
                <Input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="45 دقيقة" />
              </div>
            </div>
            <div><Label>الموضوع *</Label>
              <Input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="مثال: الثورة الجزائرية 1954" />
            </div>
            <div><Label>عدد الأسئلة (اختياري)</Label>
              <Input type="number" value={form.numQuestions || ""} onChange={e => setForm({ ...form, numQuestions: e.target.value ? parseInt(e.target.value) : undefined })} />
            </div>
            <Button className="w-full" onClick={() => generateMutation.mutate(form as any)} disabled={generateMutation.isPending || !form.title || !form.topic}>
              {generateMutation.isPending ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري التوليد...</> : <>
                <Sparkles className="w-4 h-4 ml-2" />توليد التقييم
              </>}
            </Button>
          </CardContent>
        </Card>

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
                <p>أدخل إعدادات التقييم ثم اضغط "توليد التقييم"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
