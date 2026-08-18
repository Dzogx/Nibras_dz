import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Trash2, Copy, Landmark } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { truncateMarkdown } from "@/components/MarkdownRenderer";

const gradeLevels = ["السنة الأولى متوسط", "السنة الثانية متوسط", "السنة الثالثة متوسط", "السنة الرابعة متوسط"];
const subjects = ["التاريخ والجغرافيا", "الجغرافيا", "التربية المدنية", "التاريخ والجغرافيا والتربية المدنية"];

export default function AnnualPlans() {
  const [, setLocation] = useLocation();
  const [isAdding, setIsAdding] = useState(false);
  const [referencePlanToCopy, setReferencePlanToCopy] = useState<{ id: number; title: string; subject: string; gradeLevel: string } | null>(null);
  const [copyClassId, setCopyClassId] = useState<string>("");
  const [copyAcademicYear, setCopyAcademicYear] = useState("2026-2027");
  const [newPlan, setNewPlan] = useState({
    classId: undefined as number | undefined,
    subject: subjects[0],
    gradeLevel: gradeLevels[0],
    academicYear: "2025-2026",
    title: "",
    content: "",
  });

  const utils = trpc.useUtils();
  const { data: plans, isLoading } = trpc.annualPlans.list.useQuery();
  const { data: classesList } = trpc.classes.list.useQuery();

  const createMutation = trpc.annualPlans.create.useMutation({
    onSuccess: (res) => {
      utils.annualPlans.list.invalidate();
      toast.success("تمت إضافة الخطة السنوية");
      setIsAdding(false);
      setNewPlan({ classId: undefined, subject: subjects[0], gradeLevel: gradeLevels[0], academicYear: "2025-2026", title: "", content: "" });
    },
    onError: () => toast.error("خطأ في إضافة الخطة"),
  });

  const deleteMutation = trpc.annualPlans.delete.useMutation({
    onSuccess: () => { utils.annualPlans.list.invalidate(); toast.success("تم حذف الخطة"); },
    onError: (error) => toast.error(error.message || "تعذر حذف الخطة"),
  });

  const copyReferenceMutation = trpc.annualPlans.copyReferenceToClass.useMutation({
    onSuccess: async (copiedPlan) => {
      await utils.annualPlans.list.invalidate();
      setReferencePlanToCopy(null);
      setCopyClassId("");
      toast.success("تم إنشاء نسخة صفية من المرجع الرسمي.");
      setLocation(`/annual-plans/${copiedPlan.id}`);
    },
    onError: (error) => toast.error(error.message || "تعذر نسخ المخطط إلى القسم."),
  });

  const openCopyDialog = (plan: { id: number; title: string | null; subject: string; gradeLevel: string }) => {
    setReferencePlanToCopy({
      id: plan.id,
      title: plan.title || "المخطط السنوي الرسمي",
      subject: plan.subject,
      gradeLevel: plan.gradeLevel,
    });
    const matchingClass = classesList?.find((classItem) => classItem.gradeLevel === plan.gradeLevel && classItem.subject === plan.subject);
    setCopyClassId(matchingClass?.id.toString() || "");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الخطط السنوية</h1>
          <p className="text-muted-foreground mt-1">إدارة الخطط السنوية للتدريس</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 ml-2" />خطة جديدة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>خطة سنوية جديدة</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>العنوان</Label>
                <Input value={newPlan.title} onChange={e => setNewPlan({ ...newPlan, title: e.target.value })} placeholder="عنوان الخطة" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>المادة</Label>
                  <Select value={newPlan.subject} onValueChange={v => setNewPlan({ ...newPlan, subject: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>المستوى</Label>
                  <Select value={newPlan.gradeLevel} onValueChange={v => setNewPlan({ ...newPlan, gradeLevel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{gradeLevels.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>القسم (اختياري)</Label>
                <Select value={newPlan.classId?.toString() || "none"} onValueChange={v => setNewPlan({ ...newPlan, classId: v === "none" ? undefined : parseInt(v) })}>
                  <SelectTrigger><SelectValue placeholder="اختر قسماً" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون قسم</SelectItem>
                    {classesList?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>المحتوى</Label>
                <Textarea value={newPlan.content} onChange={e => setNewPlan({ ...newPlan, content: e.target.value })} rows={8} placeholder="محتوى الخطة السنوية..." />
              </div>
              <Button onClick={() => createMutation.mutate(newPlan as any)} disabled={createMutation.isPending || !newPlan.title}>
                {createMutation.isPending ? "جاري الإضافة..." : "إنشاء"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={Boolean(referencePlanToCopy)} onOpenChange={(open) => !open && setReferencePlanToCopy(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>نسخ المخطط إلى قسم</DialogTitle>
            <DialogDescription>
              ستُنشأ نسخة تشغيلية مستقلة للقسم؛ يبقى المرجع الرسمي محفوظاً دون تعديل.
            </DialogDescription>
          </DialogHeader>
          {referencePlanToCopy && (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm">
                <p className="font-semibold">{referencePlanToCopy.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{referencePlanToCopy.subject} · {referencePlanToCopy.gradeLevel}</p>
              </div>
              {classesList && classesList.length > 0 ? <>
                <div className="space-y-1.5">
                  <Label>القسم المستهدف</Label>
                  <Select value={copyClassId} onValueChange={setCopyClassId}>
                    <SelectTrigger><SelectValue placeholder="اختر قسماً" /></SelectTrigger>
                    <SelectContent>
                      {classesList.map((classItem) => <SelectItem key={classItem.id} value={classItem.id.toString()}>{classItem.name} · {classItem.gradeLevel}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>السنة الدراسية للنسخة</Label>
                  <Input value={copyAcademicYear} onChange={(event) => setCopyAcademicYear(event.target.value)} placeholder="2026-2027" />
                </div>
                <Button
                  className="w-full"
                  disabled={!copyClassId || !copyAcademicYear.trim() || copyReferenceMutation.isPending}
                  onClick={() => copyReferenceMutation.mutate({
                    referencePlanId: referencePlanToCopy.id,
                    classId: Number(copyClassId),
                    academicYear: copyAcademicYear.trim(),
                  })}
                >
                  <Copy className="ml-2 h-4 w-4" />{copyReferenceMutation.isPending ? "جارٍ إنشاء النسخة…" : "إنشاء النسخة الصفية"}
                </Button>
              </> : <div className="space-y-3 rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">أضف قسماً أولاً لتتمكن من نسخ المخطط إليه.</p>
                <Button variant="outline" onClick={() => setLocation("/season-setup")}>الانتقال إلى تهيئة الموسم</Button>
              </div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isLoading ? <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      : plans && plans.length > 0 ? (
        <div className="space-y-3">
          {plans.map(plan => (
            <Card key={plan.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation(`/annual-plans/${plan.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {plan.isReference ? <Landmark className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-primary" />}
                      <h3 className="font-semibold">{plan.title || "خطة سنوية"}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {plan.isReference && <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">مرجع رسمي</span>}
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{plan.subject}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{plan.gradeLevel}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{plan.academicYear}</span>
                    </div>
                    {plan.isReference && <p className="text-xs text-muted-foreground">مرجع للقراءة والنسخ فقط؛ أنشئ نسخة صفية لتسجيل التقدم.</p>}
                    {plan.content && <p className="text-sm text-muted-foreground line-clamp-2">{truncateMarkdown(plan.content, 200)}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {plan.isReference ? <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={(event) => { event.stopPropagation(); openCopyDialog(plan); }}>
                      <Copy className="ml-1.5 h-3.5 w-3.5" />نسخ إلى قسم
                    </Button> : <Button variant="ghost" size="sm" aria-label="حذف الخطة" onClick={(event) => { event.stopPropagation(); deleteMutation.mutate({ id: plan.id }); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">لا توجد خطط سنوية</h3>
          <p className="text-muted-foreground">أضف خطتك السنوية الأولى</p>
        </CardContent></Card>
      )}
    </div>
  );
}
