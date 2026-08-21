import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Save, Pencil, Plus, CheckCircle2, Circle, Trash2, Loader2, FileText, PauseCircle, CalendarClock, XCircle, Landmark, Compass } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { OfficeHeader, OfficeTag, OfficeSection } from "@/components/OfficeChrome";
import { useMemo, useState } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type SessionStatus = "completed" | "partial" | "postponed" | "cancelled";

const sessionOutcomeOptions: Array<{ value: SessionStatus; label: string; guidance: string; icon: typeof CheckCircle2 }> = [
  { value: "completed", label: "مكتملة", guidance: "تُغلق الوضعية وتصبح جاهزة للتقويم أو الانتقال إلى التالية.", icon: CheckCircle2 },
  { value: "partial", label: "منجزة جزئياً", guidance: "تبقى الوضعية مفتوحة لتستكمل عناصرها في الحصة القادمة.", icon: PauseCircle },
  { value: "postponed", label: "مؤجّلة", guidance: "تبقى الوضعية مفتوحة؛ ستظهر مجدداً كخطوتك التالية في لوحة اليوم.", icon: CalendarClock },
  { value: "cancelled", label: "ملغاة", guidance: "تبقى الوضعية مفتوحة حتى تقرر متى تعيد تقديمها.", icon: XCircle },
];

const pendingStatusLabels: Partial<Record<SessionStatus, string>> = {
  partial: "قيد الاستكمال",
  postponed: "مؤجّلة",
  cancelled: "ملغاة",
};

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
  const [sessionDialogSituation, setSessionDialogSituation] = useState<{ id: number; title: string } | null>(null);
  const [strategySituationId, setStrategySituationId] = useState<number | null>(null);
  const strategiesBySection = useMemo(
    () => (sections || []).flatMap((section) => section.situations || []),
    [sections]
  );
  const strategyQuery = trpc.situations.suggestStrategy.useQuery(
    { id: strategySituationId ?? 0 },
    { enabled: strategySituationId !== null && strategySituationId > 0 }
  );
  // توحيد شكل الإرجاع: الاستراتيجية المقترحة مباشرةً (الموقع كله مبني على الحقول المباشرة)
  const suggestedStrategy = strategyQuery.data?.strategy;
  const [strategySaved, setStrategySaved] = useState(false);
  const saveToLogMutation = trpc.savedStrategies.save.useMutation({
    onSuccess: () => {
      setStrategySaved(true);
      toast.success("حُفظت الاستراتيجية في دفتر التجارب — ستجدها في صفحة «دفتر التجارب»");
    },
    onError: e => toast.error(e.message),
  });
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("completed");
  const [sessionNote, setSessionNote] = useState("");

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
    onSuccess: () => {
      utils.sections.list.invalidate({ annualPlanId: planId });
      utils.ai.getTeacherOSContext.invalidate();
      toast.success("أُعيد فتح الوضعية؛ لن تُحسب منجزة حتى تسجّل نتيجتها الفعلية.");
    },
    onError: (error) => toast.error(error.message || "تعذر تحديث الوضعية."),
  });

  const closeSessionDialog = () => {
    setSessionDialogSituation(null);
    setSessionStatus("completed");
    setSessionNote("");
  };
  const openSessionDialog = (situation: { id: number; title: string }) => {
    setSessionDialogSituation(situation);
    setSessionStatus("completed");
    setSessionNote("");
  };
  const completeSessionMutation = trpc.situations.completeSession.useMutation({
    onSuccess: (result) => {
      utils.sections.list.invalidate({ annualPlanId: planId });
      utils.ai.getTeacherOSContext.invalidate();
      const successMessage: Record<SessionStatus, string> = {
        completed: "سُجّلت الحصة مكتملة.",
        partial: "سُجّل الإنجاز الجزئي؛ ستبقى الوضعية مفتوحة للمتابعة.",
        postponed: "سُجّل تأجيل الحصة؛ ستظهر الوضعية في متابعة اليوم.",
        cancelled: "سُجّل إلغاء الحصة؛ لن تُحسب ضمن الإنجاز.",
      };
      toast.success(successMessage[result.sessionStatus]);
      closeSessionDialog();
    },
    onError: (error) => toast.error(error.message || "تعذر تسجيل نتيجة الحصة."),
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

  const isReferencePlan = plan.isReference === true;
  const totalSituations = sections?.reduce((acc, s) => acc + (s.situations?.length || 0), 0) || 0;
  const completedSituations = sections?.reduce((acc, s) => acc + (s.situations?.filter(si => si.isCompleted).length || 0), 0) || 0;

  return (
    <div className="max-w-4xl mx-auto">
      <OfficeHeader
        crumbs={[{ label: "المخططات", href: "/annual-plans" }]}
        title={plan.title || "خطة سنوية"}
        subtitle={
          [
            plan.subject && plan.subject,
            plan.gradeLevel && plan.gradeLevel,
            plan.academicYear && plan.academicYear,
            `${completedSituations}/${totalSituations} وضعية منجزة`,
          ]
            .filter(Boolean)
            .join(" · ")
        }
      >
        {isReferencePlan && (
          <OfficeTag className="gap-1"><Landmark className="h-3 w-3" />مرجع رسمي</OfficeTag>
        )}
        {!isReferencePlan && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
            <Pencil className="w-4 h-4 ml-1" />{isEditing ? "عرض" : "تحرير"}
          </Button>
        )}
      </OfficeHeader>

      {isReferencePlan && (
        <p className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm leading-6 text-muted-foreground">
          هذا مخطط مرجعي رسمي للقراءة فقط. انسخه إلى أحد أقسامك من قائمة المخططات لتسجيل التقدم أو تعديل محتواه.
        </p>
      )}

      {isEditing ? (
        <div className="office-card">
          <div className="space-y-4 p-4 md:p-5">
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
          </div>
        </div>
      ) : plan.content ? (
        <div className="office-card">
          <div className="prose prose-sm max-w-none p-4 text-right md:p-5" dir="rtl">
            <MarkdownRenderer source={plan.content} />
          </div>
        </div>
      ) : null}

      {/* ─── Sections ─────────────────────────────────── */}
      <OfficeSection
        title="المقاطع والوضعيات التعليمية"
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
          {!isReferencePlan && <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 ml-1" />مقطع جديد</Button>
          </DialogTrigger>}
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
        {!isReferencePlan && (
          <Button size="sm" onClick={() => setAddSectionOpen(true)}>
            <Plus className="w-4 h-4 ml-1" />مقطع جديد
          </Button>
        )}
      </OfficeSection>
      {sectionsLoading ? (
        <div className="text-center py-8 text-muted-foreground">جاري تحميل المقاطع...</div>
      ) : sections && sections.length > 0 ? (
        <div className="space-y-4">
          {sections.map(section => (
            <div key={section.id} className={`office-card ${section.isCompleted ? "border-green-200 bg-green-50/50" : ""}`}>
              <div className="p-4">
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
                  <div className={isReferencePlan ? "hidden" : "flex gap-1"}>
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
                        <div key={sit.id} className="lesson-sheet flex items-center gap-2 rounded-lg p-3 flex-wrap sm:flex-nowrap">
                          {sit.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium">{sit.title}</p>
                              {!sit.isCompleted && sit.sessionStatus && pendingStatusLabels[sit.sessionStatus as SessionStatus] && (
                                <Badge variant="outline" className="border-amber-400/60 bg-amber-50 text-amber-800">
                                  {pendingStatusLabels[sit.sessionStatus as SessionStatus]}
                                </Badge>
                              )}
                            </div>
                            {sit.objectives && <p className="text-xs text-muted-foreground truncate">{sit.objectives}</p>}
                            {!sit.isCompleted && sit.completionNotes && <p className="mt-1 text-xs leading-5 text-muted-foreground">آخر ملاحظة: {sit.completionNotes}</p>}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className={isReferencePlan ? "hidden" : "border-amber-400/60 text-amber-800"}
                            onClick={() => setStrategySituationId(sit.id)}
                          >
                            <Compass className="w-3.5 h-3.5 ml-1" />
                            استراتيجية التسيير
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={isReferencePlan ? "hidden" : undefined}
                            onClick={() => createLessonFromSituationMutation.mutate({ situationId: sit.id, classId: plan?.classId || undefined })}
                            disabled={createLessonFromSituationMutation.isPending}
                          >
                            {createLessonFromSituationMutation.isPending ? <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" /> : <FileText className="w-3.5 h-3.5 ml-1 text-primary" />}
                            مذكرة
                          </Button>
                          <Button
                            variant={sit.isCompleted ? "secondary" : "outline"}
                            size="sm"
                            className={isReferencePlan ? "hidden" : undefined}
                            onClick={() => sit.isCompleted ? toggleSituationMutation.mutate({ id: sit.id, isCompleted: false }) : openSessionDialog({ id: sit.id, title: sit.title })}
                            disabled={toggleSituationMutation.isPending}
                          >
                            {sit.isCompleted ? <Circle className="w-3.5 h-3.5 ml-1 text-green-600" /> : <CheckCircle2 className="w-3.5 h-3.5 ml-1 text-muted-foreground" />}
                            {sit.isCompleted ? "إعادة فتح" : "سجّل نتيجة الحصة"}
                          </Button>
                          {!isReferencePlan && sit.isCompleted && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-primary/30 text-primary"
                              onClick={() => setLocation(`/assessment?classId=${plan.classId}&situationId=${sit.id}`)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 ml-1" />أنشئ تقويماً
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className={isReferencePlan ? "hidden" : "mr-auto"}
                            onClick={() => deleteSituationMutation.mutate({ id: sit.id })}
                            aria-label={`حذف ${sit.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Add situation button */}
                    <Dialog open={addSituationOpen && newSituation.sectionId === section.id} onOpenChange={open => { setAddSituationOpen(open); if (open) setNewSituation(prev => ({ ...prev, sectionId: section.id })); }}>
                      {!isReferencePlan && <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <Plus className="w-3.5 h-3.5 ml-1" />إضافة وضعية تعليمية
                        </Button>
                      </DialogTrigger>}
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
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="office-card p-8 text-center">
          <p className="text-muted-foreground">لا توجد مقاطع بعد. أضف المقاطع التعليمية والوضعيات.</p>
        </div>
      )}




      <Dialog open={Boolean(sessionDialogSituation)} onOpenChange={(open) => !open && closeSessionDialog()}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>سجّل نتيجة الحصة</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">حدّد ما جرى في «{sessionDialogSituation?.title}». لا تُغلق الوضعية إلا عند اختيار «مكتملة».</p>
          <div className="grid grid-cols-2 gap-2" aria-label="حالة الحصة">
            {sessionOutcomeOptions.map((option) => {
              const StatusIcon = option.icon;
              const selected = option.value === sessionStatus;
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  aria-pressed={selected}
                  onClick={() => setSessionStatus(option.value)}
                  className={`h-auto min-h-16 justify-start gap-2 whitespace-normal px-3 py-3 text-right leading-snug ${selected ? "border-primary bg-primary/10 text-primary hover:bg-primary/15" : "border-border bg-background text-foreground hover:bg-muted"}`}
                >
                  <StatusIcon className="h-4 w-4 shrink-0" />
                  <span>{option.label}</span>
                </Button>
              );
            })}
          </div>
          <p className="rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
            {sessionOutcomeOptions.find((option) => option.value === sessionStatus)?.guidance}
          </p>
          <Textarea
            value={sessionNote}
            onChange={(event) => setSessionNote(event.target.value)}
            maxLength={3000}
            className="min-h-24 resize-y"
            placeholder="ملاحظة اختيارية: ما الذي أُنجز، أو ما الذي ستستكمله في الحصة القادمة؟"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" type="button" onClick={closeSessionDialog}>إلغاء</Button>
            <Button
              type="button"
              disabled={!sessionDialogSituation || completeSessionMutation.isPending}
              onClick={() => sessionDialogSituation && completeSessionMutation.mutate({
                situationId: sessionDialogSituation.id,
                sessionStatus,
                note: sessionNote || undefined,
              })}
            >
              {completeSessionMutation.isPending ? "جارٍ الحفظ…" : "حفظ نتيجة الحصة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── بطاقة استراتيجية تسيير الحصة ─────────────────────────── */}
      <Dialog open={strategySituationId !== null} onOpenChange={(open) => { if (!open) setStrategySituationId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-600" />
              بطاقة استراتيجية تسيير الحصة
              <span className="text-sm font-normal text-muted-foreground">
                {strategiesBySection.find((s) => s.id === strategySituationId)?.title}
              </span>
            </DialogTitle>
          </DialogHeader>
          {strategyQuery.isLoading ? (
            <div className="py-8 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
          ) : strategyQuery.error ? (
            <div className="py-4 text-center text-destructive">تعذر اقتراح الاستراتيجية — تحقق من بيانات الوضعية.</div>
          ) : strategyQuery.data ? (
            <div className="space-y-4 text-right">
              <div className="rounded-lg border border-amber-400/60 bg-amber-50 p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-amber-900">{suggestedStrategy!.name}</span>
                  <Badge variant="outline" className="text-xs text-amber-800 border-amber-400/60">
                    {suggestedStrategy!.kind === "integrative" ? "وضعية إدماجية" : "وضعية تعلّمية"}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-amber-800 border-amber-400/60">
                    {suggestedStrategy!.totalMinutes} دقيقة
                  </Badge>
                </div>
                <p className="text-sm text-amber-900/80 mt-2 leading-6">{suggestedStrategy!.rationale}</p>
              </div>
              {suggestedStrategy!.phases.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="px-3 py-2 text-right font-medium">المرحلة</th>
                        <th className="px-3 py-2 text-right font-medium">المدة</th>
                        <th className="px-3 py-2 text-right font-medium">دور الأستاذ</th>
                        <th className="px-3 py-2 text-right font-medium">دور التلميذ</th>
                        <th className="px-3 py-2 text-right font-medium">ملاحظة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {suggestedStrategy!.phases.map((phase, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium whitespace-nowrap">{phase.stage}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{phase.minutes} د</td>
                          <td className="px-3 py-2 leading-5">{phase.teacherRole}</td>
                          <td className="px-3 py-2 leading-5">{phase.studentRole}</td>
                          <td className="px-3 py-2 leading-5 text-muted-foreground">{phase.tips}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {suggestedStrategy!.generalTips.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-1">توصيات تسيير إضافية</p>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc pr-5">
                    {suggestedStrategy!.generalTips.map((tip, idx) => <li key={idx}>{tip}</li>)}
                  </ul>
                </div>
              )}
              <div className="flex justify-start gap-2 pt-1">
                <Button
                  variant={strategySaved ? "secondary" : "default"}
                  size="sm"
                  disabled={strategySaved || saveToLogMutation.isPending}
                  onClick={() => {
                    const sit = strategiesBySection.find((s) => s.id === strategySituationId);
                    saveToLogMutation.mutate({
                      strategy: {
                        kind: suggestedStrategy!.kind,
                        name: suggestedStrategy!.name,
                        rationale: suggestedStrategy!.rationale,
                        phases: suggestedStrategy!.phases,
                        totalMinutes: suggestedStrategy!.totalMinutes,
                        generalTips: suggestedStrategy!.generalTips,
                      },
                      situationType: suggestedStrategy!.kind === "integrative" ? "integrative" : "learning",
                      subject: plan?.subject || "",
                      situationTitle: sit?.title,
                    } as any);
                  }}
                >
                  <Save className="w-4 h-4 ml-1" />
                  {strategySaved ? "محفوظة في دفتر التجارب" : "احفظ في دفتر التجارب"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const sit = strategiesBySection.find((s) => s.id === strategySituationId);
                    const html = buildStrategyPrintHtml({
                      title: sit?.title || "",
                      strategyName: suggestedStrategy!.name,
                      kindLabel: suggestedStrategy!.kind === "integrative" ? "وضعية إدماجية" : "وضعية تعلّمية",
                      totalMinutes: suggestedStrategy!.totalMinutes,
                      rationale: suggestedStrategy!.rationale,
                      phases: suggestedStrategy!.phases,
                      generalTips: suggestedStrategy!.generalTips,
                      subject: plan?.subject || "",
                      gradeLevel: plan?.gradeLevel || "",
                    });
                    const iframe = document.createElement("iframe");
                    iframe.style.cssText = "position:fixed;top:-10000px;left:-10000px;width:0;height:0;";
                    document.body.appendChild(iframe);
                    const doc = iframe.contentDocument!;
                    doc.open();
                    doc.write(html);
                    doc.close();
                    setTimeout(() => {
                      try { iframe.contentWindow!.print(); } catch (e) { /* blocked */ }
                      setTimeout(() => document.body.removeChild(iframe), 1500);
                    }, 400);
                    toast.success("جاري فتح بطاقة الاستراتيجية للطباعة");
                  }}
                >
                  <FileText className="w-4 h-4 ml-1" />طباعة بطاقة التسيير
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── قالب طباعة بطاقة استراتيجية التسيير (حيادي، ترويسة وزارية) ─────
interface StrategyPrintInput {
  title: string;
  strategyName: string;
  kindLabel: string;
  totalMinutes: number;
  rationale: string;
  phases: Array<{ stage: string; minutes: number; teacherRole: string; studentRole: string; tips: string }>;
  generalTips: string[];
  subject: string;
  gradeLevel: string;
}

function buildStrategyPrintHtml(input: StrategyPrintInput): string {
  const now = new Date().toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" });
  const subjectLabel =
    input.subject === "جغرافيا" ? "الجغرافيا" : input.subject === "تربية مدنية" ? "التربية المدنية" : input.subject || "التاريخ";
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4 portrait; margin: 15mm 14mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Amiri", "Noto Naskh Arabic", serif; color: #111827; font-size: 11pt; line-height: 1.7; }
  .header { text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 8px; margin-bottom: 14px; }
  .header .line1 { font-size: 10.5pt; font-weight: bold; }
  .header .line2 { font-size: 10pt; }
  .meta { display: flex; justify-content: space-between; font-size: 10pt; margin-bottom: 10px; }
  h1 { font-size: 13pt; text-align: center; margin: 10px 0 6px; }
  h2 { font-size: 11.5pt; margin: 12px 0 6px; border-right: 3px solid #d97706; padding-right: 8px; }
  .card { border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; margin: 6px 0 12px; background: #fffbeb; }
  .card .kind { font-weight: bold; color: #92400e; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; margin: 8px 0 12px; }
  th { background: #f3f4f6; border: 1px solid #9ca3af; padding: 5px 8px; text-align: right; }
  td { border: 1px solid #d1d5db; padding: 5px 8px; vertical-align: top; text-align: right; }
  ul { padding-right: 18px; }
  li { margin-bottom: 2px; }
  .footer { margin-top: 18px; display: flex; justify-content: space-between; font-size: 10pt; }
  .footer div { min-width: 30%; }
  .sig { border-top: 1px solid #111827; padding-top: 4px; margin-top: 26px; }
</style>
</head>
<body>
  <div class="header">
    <div class="line1">الجمهورية الجزائرية الديمقراطية الشعبية</div>
    <div class="line1">وزارة التربية الوطنية</div>
    <div class="line2">${input.subject ? `مادة: ${subjectLabel}` : "المادة: علوم اجتماعية"} ${input.gradeLevel ? `— ${input.gradeLevel}` : ""}</div>
  </div>
  <div class="meta">
    <div>التاريخ: ${now}</div>
    <div>الوضعية: ${input.title || "—"}</div>
  </div>
  <h1>بطاقة استراتيجية تسيير الحصة</h1>
  <div class="card">
    <span class="kind">${input.kindLabel}</span> — الاستراتيجية المقترحة: <strong>${input.strategyName}</strong> (المدة الإجمالية: ${input.totalMinutes} دقيقة)
    <div style="margin-top:6px;">لماذا هذه الاستراتيجية؟ ${input.rationale}</div>
  </div>
  <h2>مراحل التسيير الزمني</h2>
  <table>
    <thead><tr><th>المرحلة</th><th>المدة</th><th>دور الأستاذ</th><th>دور التلميذ</th><th>ملاحظة</th></tr></thead>
    <tbody>
      ${input.phases.map(p => `<tr><td>${p.stage}</td><td style="white-space:nowrap">${p.minutes} د</td><td>${p.teacherRole}</td><td>${p.studentRole}</td><td>${p.tips}</td></tr>`).join("")}
    </tbody>
  </table>
  ${input.generalTips.length > 0 ? `<h2>توصيات تسيير إضافية</h2><ul>${input.generalTips.map(t => `<li>${t}</li>`).join("")}</ul>` : ""}
  <div class="footer">
    <div class="sig">إمضاء الأستاذ</div>
    <div class="sig">إمضاء مدير المؤسسة</div>
  </div>
</body>
</html>`;
}
