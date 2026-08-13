import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Trash2, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLocation } from "wouter";

const gradeLevels = ["السنة الأولى متوسط", "السنة الثانية متوسط", "السنة الثالثة متوسط", "السنة الرابعة متوسط"];
const subjects = ["التاريخ والجغرافيا", "الجغرافيا", "التربية المدنية", "التاريخ والجغرافيا والتربية المدنية"];

export default function AnnualPlans() {
  const [, setLocation] = useLocation();
  const [isAdding, setIsAdding] = useState(false);
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
  });

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

      {isLoading ? <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      : plans && plans.length > 0 ? (
        <div className="space-y-3">
          {plans.map(plan => (
            <Card key={plan.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation(`/annual-plans/${plan.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">{plan.title || "خطة سنوية"}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{plan.subject}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{plan.gradeLevel}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{plan.academicYear}</span>
                    </div>
                    {plan.content && <p className="text-sm text-muted-foreground line-clamp-2">{plan.content}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: plan.id }); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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
