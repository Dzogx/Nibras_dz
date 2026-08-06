import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowRight, Save, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useState } from "react";
import { Streamdown } from 'streamdown';

export default function AnnualPlanDetail({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const planId = parseInt(id);
  const utils = trpc.useUtils();
  const { data: plan, isLoading } = trpc.annualPlans.getById.useQuery({ id: planId });
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    title: plan?.title || "",
    subject: plan?.subject || "",
    gradeLevel: plan?.gradeLevel || "",
    content: plan?.content || "",
  });

  if (plan && !editForm.title) {
    setEditForm({
      title: plan.title || "",
      subject: plan.subject || "",
      gradeLevel: plan.gradeLevel || "",
      content: plan.content || "",
    });
  }

  const updateMutation = trpc.annualPlans.update.useMutation({
    onSuccess: () => {
      utils.annualPlans.getById.invalidate({ id: planId });
      utils.annualPlans.list.invalidate();
      toast.success("تم تحديث الخطة");
      setIsEditing(false);
    },
    onError: () => toast.error("خطأ في التحديث"),
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;
  if (!plan) return <div className="text-center py-12">الخطة غير موجودة</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/annual-plans")}>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">{plan.title || "خطة سنوية"}</h1>
      </div>

      <div className="flex items-center gap-2">
        {plan.subject && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{plan.subject}</span>}
        {plan.gradeLevel && <span className="text-xs bg-muted px-2 py-0.5 rounded">{plan.gradeLevel}</span>}
        {plan.academicYear && <span className="text-xs bg-muted px-2 py-0.5 rounded">{plan.academicYear}</span>}
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
          <Pencil className="w-4 h-4 ml-1" />{isEditing ? "عرض" : "تحرير"}
        </Button>
      </div>

      {isEditing ? (
        <Card>
          <CardContent className="p-4 space-y-4">
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
            <div><Label>المحتوى</Label>
              <Textarea value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} rows={12} />
            </div>
            <Button onClick={() => updateMutation.mutate({ id: planId, ...editForm } as any)}>
              <Save className="w-4 h-4 ml-2" />حفظ
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            {plan.content ? (
              <div className="prose prose-sm max-w-none text-right" dir="rtl">
                <Streamdown>{plan.content}</Streamdown>
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
