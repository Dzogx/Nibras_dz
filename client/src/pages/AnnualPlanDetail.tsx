import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Save, Pencil, Plus, CheckCircle2, Circle, Trash2, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useState } from "react";
import { Streamdown } from 'streamdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AnnualPlanDetail({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const planId = parseInt(id);
  const utils = trpc.useUtils();
  const { data: plan, isLoading } = trpc.annualPlans.getById.useQuery({ id: planId });
  const { data: sections, isLoading: sectionsLoading } = trpc.sections.list.useQuery(
    { annualPlanId: planId },
    { enabled: !!planId }
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", subject: "", gradeLevel: "", content: "" });
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSection, setNewSection] = useState({ title: "", duration: "", competencies: "", objectives: "", resources: "" });
  const [addSituationOpen, setAddSituationOpen] = useState(false);
  const [newSituation, setNewSituation] = useState({ sectionId: 0, title: "", objectives: "", content: "" });
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

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

  const createSectionMutation = trpc.sections.create.useMutation({
    onSuccess: () => {
      utils.sections.list.invalidate({ annualPlanId: planId });
      toast.success("تمت إضافة المقطع");
      setAddSectionOpen(false);
      setNewSection({ title: "", duration: "", competencies: "", objectives: "", resources: "" });
    },
    onError: () => toast.error("خطأ في إضافة المقطع"),
  });

  const toggleSectionMutation = trpc.sections.update.useMutation({
    onSuccess: () => utils.sections.list.invalidate({ annualPlanId: planId }),
  });

  const deleteSectionMutation = trpc.sections.delete.useMutation({
    onSuccess: () => utils.sections.list.invalidate({ annualPlanId: planId }),
  });

  const createSituationMutation = trpc.situations.create.useMutation({
    onSuccess: () => {
      utils.sections.list.invalidate({ annualPlanId: planId });
      toast.success("تمت إضافة الوضعية");
      setAddSituationOpen(false);
      setNewSituation({ sectionId: 0, title: "", objectives: "", content: "" });
    },
    onError: () => toast.error("خطأ في إضافة الوضعية"),
  });

  const toggleSituationMutation = trpc.situations.toggleCompleted.useMutation({
    onSuccess: () => utils.sections.list.invalidate({ annualPlanId: planId }),
  });

  const createLessonFromSituationMutation = trpc.sections.createLessonFromSituation.useMutation({
    onSuccess: (data: any) => {
      toast.success("تم إنشاء المذكرة");
      if (data?.id) setLocation(`/lessons/${data.id}`);
    },
    onError: () => toast.error("خطأ في إنشاء المذكرة"),
  });
  const deleteSituationMutation = trpc.situations.delete.useMutation({
    onSuccess: () => utils.sections.list.invalidate({ annualPlanId: planId }),
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;
  if (!plan) return <div className="text-center py-12">الخطة غير موجودة</div>;

  const totalSituations = sections?.reduce((acc, s) => acc + (s.situations?.length || 0), 0) || 0;
  const completedSituations = sections?.reduce((acc, s) => acc + (s.situations?.filter(si => si.isCompleted).length || 0), 0) || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/annual-plans")}>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">{plan.title || "خطة سنوية"}</h1>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {plan.subject && <Badge variant="secondary">{plan.subject}</Badge>}
        {plan.gradeLevel && <Badge variant="outline">{plan.gradeLevel}</Badge>}
        {plan.academicYear && <Badge variant="outline">{plan.academicYear}</Badge>}
        <span className="text-sm text-muted-foreground mr-2">
          {completedSituations}/{totalSituations} وضعية منجزة
        </span>
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
              <Textarea value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} rows={8} />
            </div>
            <Button onClick={() => updateMutation.mutate({ id: planId, ...editForm } as any)}>
              <Save className="w-4 h-4 ml-2" />حفظ
            </Button>
          </CardContent>
        </Card>
      ) : plan.content ? (
        <Card>
          <CardContent className="p-4">
            <div className="prose prose-sm max-w-none text-right" dir="rtl">
              <Streamdown>{plan.content}</Streamdown>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ─── Sections ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">المقاطع والوضعيات التعليمية</h2>
        <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 ml-1" />مقطع جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>مقطع جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>عنوان المقطع</Label>
                <Input value={newSection.title} onChange={e => setNewSection({ ...newSection, title: e.target.value })} placeholder="مثال: الثورة الجزائرية" />
              </div>
              <div><Label>المدة (اختياري)</Label>
                <Input value={newSection.duration} onChange={e => setNewSection({ ...newSection, duration: e.target.value })} placeholder="مثال: 3 أسابيع" />
              </div>
              <div><Label>الكفاءات المستهدفة</Label>
                <Textarea value={newSection.competencies} onChange={e => setNewSection({ ...newSection, competencies: e.target.value })} rows={3} placeholder="الكفاءات..." />
              </div>
              <div><Label>الأهداف</Label>
                <Textarea value={newSection.objectives} onChange={e => setNewSection({ ...newSection, objectives: e.target.value })} rows={3} />
              </div>
              <div><Label>الموارد</Label>
                <Textarea value={newSection.resources} onChange={e => setNewSection({ ...newSection, resources: e.target.value })} rows={2} />
              </div>
              <Button
                onClick={() => {
                  const sectionNum = (sections?.length || 0) + 1;
                  createSectionMutation.mutate({ annualPlanId: planId, sectionNumber: sectionNum, ...newSection });
                }}
                disabled={createSectionMutation.isPending || !newSection.title}
              >
                {createSectionMutation.isPending ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري الإضافة...</> : "إضافة المقطع"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sectionsLoading ? (
        <div className="text-center py-8 text-muted-foreground">جاري تحميل المقاطع...</div>
      ) : sections && sections.length > 0 ? (
        <div className="space-y-4">
          {sections.map(section => (
            <Card key={section.id} className={section.isCompleted ? "border-green-200 bg-green-50/50" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}>
                  <div className="flex items-start gap-3 flex-1">
                    {section.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">المقطع {section.sectionNumber}: {section.title}</h3>
                        {section.duration && <Badge variant="outline" className="text-xs">{section.duration}</Badge>}
                      </div>
                      {section.competencies && <p className="text-sm text-muted-foreground mt-1">{section.competencies}</p>}
                      <span className="text-xs text-muted-foreground mt-1 inline-block">
                        {section.situations?.filter(s => s.isCompleted).length || 0}/{section.situations?.length || 0} وضعية
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSectionMutation.mutate({ id: section.id, isCompleted: !section.isCompleted });
                      }}
                    >
                      {section.isCompleted ? <Circle className="w-4 h-4 text-green-600" /> : <CheckCircle2 className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteSectionMutation.mutate({ id: section.id }); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {expandedSection === section.id && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {section.objectives && (
                      <div><Label className="text-sm font-medium text-muted-foreground">الأهداف</Label>
                        <p className="text-sm mt-1">{section.objectives}</p>
                      </div>
                    )}
                    {section.resources && (
                      <div><Label className="text-sm font-medium text-muted-foreground">الموارد</Label>
                        <p className="text-sm mt-1">{section.resources}</p>
                      </div>
                    )}

                    {/* Situations list */}
                    <div className="space-y-2">
                      {section.situations?.map(sit => (
                        <div key={sit.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                          {sit.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{sit.title}</p>
                            {sit.objectives && <p className="text-xs text-muted-foreground truncate">{sit.objectives}</p>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSituationMutation.mutate({ id: sit.id, isCompleted: !sit.isCompleted })}
                          >
                            {sit.isCompleted ? <Circle className="w-3.5 h-3.5 text-green-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => createLessonFromSituationMutation.mutate({ situationId: sit.id, classId: plan?.classId || undefined })}
                            disabled={createLessonFromSituationMutation.isPending}
                            title="إنشاء مذكرة من هذه الوضعية"
                          >
                            <FileText className="w-3.5 h-3.5 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSituationMutation.mutate({ id: sit.id })}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Add situation button */}
                    <Dialog open={addSituationOpen && newSituation.sectionId === section.id} onOpenChange={open => { setAddSituationOpen(open); if (open) setNewSituation(prev => ({ ...prev, sectionId: section.id })); }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <Plus className="w-3.5 h-3.5 ml-1" />إضافة وضعية تعليمية
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>وضعية تعليمية جديدة</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <div><Label>عنوان الوضعية</Label>
                            <Input
                              value={newSituation.title}
                              onChange={e => setNewSituation(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="مثال: وضعية إدماجية"
                            />
                          </div>
                          <div><Label>الأهداف</Label>
                            <Textarea value={newSituation.objectives} onChange={e => setNewSituation(prev => ({ ...prev, objectives: e.target.value }))} rows={2} />
                          </div>
                          <div><Label>المحتوى / الوصف</Label>
                            <Textarea value={newSituation.content} onChange={e => setNewSituation(prev => ({ ...prev, content: e.target.value }))} rows={3} />
                          </div>
                          <Button
                            onClick={() => {
                              const sitNum = (section.situations?.length || 0) + 1;
                              createSituationMutation.mutate({
                                sectionId: section.id,
                                situationNumber: sitNum,
                                title: newSituation.title,
                                objectives: newSituation.objectives || undefined,
                                content: newSituation.content || undefined,
                              });
                            }}
                            disabled={createSituationMutation.isPending || !newSituation.title}
                          >
                            {createSituationMutation.isPending ? "جاري الإضافة..." : "إضافة الوضعية"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-8 text-center">
          <p className="text-muted-foreground">لا توجد مقاطع بعد. أضف المقاطع التعليمية والوضعيات.</p>
        </CardContent></Card>
      )}
    </div>
  );
}
