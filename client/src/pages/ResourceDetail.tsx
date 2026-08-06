import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowRight, Save, Pencil, Copy, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useState } from "react";
import { Streamdown } from 'streamdown';

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
  const [isEditing, setIsEditing] = useState(false);

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

  const printContent = () => {
    if (!resource) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${resource.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 2cm; }
          body { font-family: 'Cairo', sans-serif; direction: rtl; font-size: 14px; line-height: 1.8; color: #1a1a2e; }
          h1 { text-align: center; font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          .info { text-align: center; color: #666; margin-bottom: 20px; font-size: 13px; }
          pre { white-space: pre-wrap; font-family: 'Cairo', sans-serif; }
        </style>
      </head>
      <body>
        <h1>${resource.title}</h1>
        <div class="info">
          <p>${(resource.metadata as any)?.subject || resource.type} | ${(resource.metadata as any)?.gradeLevel || ""}</p>
        </div>
        <pre>${resource.content}</pre>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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
          {typeLabels[resource.type] || resource.type}
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
        <Button variant="outline" size="sm" onClick={printContent}>
          <Printer className="w-4 h-4 ml-1" />طباعة A4
        </Button>
      </div>

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
                <Streamdown>{resource.content}</Streamdown>
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
