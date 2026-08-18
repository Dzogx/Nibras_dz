import { trpc } from "@/lib/trpc";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BarChart3, TrendingDown, Lightbulb, Loader2, Trash2, AlertTriangle, NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { usePreferredClass } from "@/hooks/usePreferredClass";

export default function Results() {
  const [, setLocation] = useLocation();
  const classIdFromSearch = typeof window === "undefined" ? null : Number(new URLSearchParams(window.location.search).get("classId")) || null;
  const remediationFromSearch = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("action") === "remediation";
  const [selectedClassId, setSelectedClassId] = useState<number | null>(classIdFromSearch);
  const [preferredClassId, setPreferredClassId] = usePreferredClass();
  const [addOpen, setAddOpen] = useState(false);
  const [remediationOpen, setRemediationOpen] = useState(false);
  const [remediationSituationId, setRemediationSituationId] = useState<number | null>(null);
  const [remediationTitle, setRemediationTitle] = useState("");
  const [remediationTitleEdited, setRemediationTitleEdited] = useState(false);
  const [newResult, setNewResult] = useState({
    title: "",
    totalStudents: 0,
    participatedStudents: 0,
    averageScore: 0,
    passedCount: 0,
    historyAverage: 0,
    geographyAverage: 0,
    weakAreas: "",
    notes: "",
  });

  const { data: classes } = trpc.classes.list.useQuery();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { staleTime: 60_000 });
  const seasonClasses = useMemo(
    () => (classes ?? []).filter((classItem) => !classItem.academicYear || classItem.academicYear === profile?.academicYear),
    [classes, profile?.academicYear],
  );

  useEffect(() => {
    if (classIdFromSearch && selectedClassId !== classIdFromSearch) setSelectedClassId(classIdFromSearch);
    if (!classIdFromSearch && !selectedClassId && preferredClassId && seasonClasses.some((classItem) => classItem.id === preferredClassId)) {
      setSelectedClassId(preferredClassId);
    }
  }, [classIdFromSearch, preferredClassId, seasonClasses, selectedClassId]);

  const { data: results } = trpc.results.list.useQuery(
    { classId: selectedClassId! },
    { enabled: !!selectedClassId }
  );

  const { data: analysis } = trpc.results.analyze.useQuery(
    { classId: selectedClassId! },
    { enabled: !!selectedClassId }
  );

  const { data: teacherOSContext } = trpc.ai.getTeacherOSContext.useQuery(
    { classId: selectedClassId!, academicYear: profile?.academicYear },
    { enabled: !!selectedClassId }
  );
  const completedSituations = teacherOSContext?.completedSituations ?? [];
  const selectedRemediationSituation = completedSituations.find(
    (situation) => situation.id === remediationSituationId
  );

  const openRemediationActivity = () => {
    const latestOfficialSituation = completedSituations[0];
    if (!latestOfficialSituation) {
      toast.error("أكمل وضعية تعليمية من المخطط السنوي أولاً حتى يُربط النشاط بعنوانها الرسمي.");
      return;
    }
    setRemediationSituationId(latestOfficialSituation.id);
    setRemediationTitle(latestOfficialSituation.title);
    setRemediationTitleEdited(false);
    setRemediationOpen(true);
  };

  useEffect(() => {
    if (remediationFromSearch && selectedClassId && completedSituations.length > 0 && !remediationOpen) {
      openRemediationActivity();
    }
  }, [remediationFromSearch, selectedClassId, completedSituations.length, remediationOpen]);

  const createMutation = trpc.results.create.useMutation({
    onSuccess: () => {
      utils.results.list.invalidate({ classId: selectedClassId! });
      utils.results.analyze.invalidate({ classId: selectedClassId! });
      toast.success("تم تسجيل النتائج");
      setAddOpen(false);
      setNewResult({ title: "", totalStudents: 0, participatedStudents: 0, averageScore: 0, passedCount: 0, historyAverage: 0, geographyAverage: 0, weakAreas: "", notes: "" });
    },
    onError: () => toast.error("خطأ في تسجيل النتائج"),
  });

  const deleteMutation = trpc.results.delete.useMutation({
    onSuccess: () => {
      utils.results.list.invalidate({ classId: selectedClassId! });
      utils.results.analyze.invalidate({ classId: selectedClassId! });
      toast.success("تم الحذف");
    },
  });

  const remediationActivityMutation = trpc.aiResources.create.useMutation({
    onSuccess: (resource) => {
      toast.success("حُفظ النشاط العلاجي في مكتبة المحتوى.");
      setRemediationOpen(false);
      setLocation(`/content-library/${resource?.id}`);
    },
    onError: (error) => toast.error(error.message || "تعذر حفظ النشاط العلاجي."),
  });

  const utils = trpc.useUtils();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">نتائج التقويم</h1>
        <p className="text-muted-foreground mt-1">إدخال النتائج المجمعة وتحليل الأداء</p>
      </div>

      {/* Class Selection */}
      {!selectedClassId ? (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">اختر القسم</h2>
            {seasonClasses.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {seasonClasses.map(c => (
                  <Card
                    key={c.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => {
                      setSelectedClassId(c.id);
                      setPreferredClassId(c.id);
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <p className="font-medium">{c.name}</p>
                      {c.gradeLevel && <p className="text-xs text-muted-foreground mt-1">{c.gradeLevel}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">لا توجد أقسام. أنشئ قسماً أولاً من صفحة الأقسام.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedClassId(null)}>
                تغيير القسم
              </Button>
              <h2 className="text-lg font-semibold">
                {seasonClasses.find(c => c.id === selectedClassId)?.name || "القسم"}
              </h2>
            </div>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 ml-1" />تسجيل نتيجة</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>تسجيل نتائج تقويم</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>عنوان التقويم</Label>
                    <Input value={newResult.title} onChange={e => setNewResult({ ...newResult, title: e.target.value })} placeholder="مثال: اختبار الفصل الأول" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>عدد التلاميذ</Label>
                      <Input type="number" value={newResult.totalStudents || ""} onChange={e => setNewResult({ ...newResult, totalStudents: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div><Label>عدد المشاركين</Label>
                      <Input type="number" value={newResult.participatedStudents || ""} onChange={e => setNewResult({ ...newResult, participatedStudents: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>المتوسط العام</Label>
                      <Input type="number" step="0.1" value={newResult.averageScore || ""} onChange={e => setNewResult({ ...newResult, averageScore: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div><Label>عدد الناجحين</Label>
                      <Input type="number" value={newResult.passedCount || ""} onChange={e => setNewResult({ ...newResult, passedCount: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>متوسط التاريخ</Label>
                      <Input type="number" step="0.1" value={newResult.historyAverage || ""} onChange={e => setNewResult({ ...newResult, historyAverage: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div><Label>متوسط الجغرافيا</Label>
                      <Input type="number" step="0.1" value={newResult.geographyAverage || ""} onChange={e => setNewResult({ ...newResult, geographyAverage: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div><Label>مواطن الضعف (أسئلة/نوع وضعيات/محاور)</Label>
                    <Textarea value={newResult.weakAreas || ""} onChange={e => setNewResult({ ...newResult, weakAreas: e.target.value })} rows={2} placeholder="مثال: الوضعية الثانية نوع تحليل، محور الموارد 1/4" />
                  </div>
                  <div><Label>ملاحظات</Label>
                    <Textarea value={newResult.notes} onChange={e => setNewResult({ ...newResult, notes: e.target.value })} rows={2} />
                  </div>
                  <Button
                    onClick={() => {
                      createMutation.mutate({
                        classId: selectedClassId,
                        title: newResult.title,
                        totalStudents: newResult.totalStudents,
                        participatedStudents: newResult.participatedStudents || undefined,
                        averageScore: newResult.averageScore || undefined,
                        passedCount: newResult.passedCount || undefined,
                        historyAverage: newResult.historyAverage || undefined,
                        geographyAverage: newResult.geographyAverage || undefined,
                        weakAreas: newResult.weakAreas?.trim() || undefined,
                        notes: newResult.notes || undefined,
                      });
                    }}
                    disabled={createMutation.isPending || !newResult.title}
                  >
                    {createMutation.isPending ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري التسجيل...</> : "تسجيل"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">النتائج</TabsTrigger>
              <TabsTrigger value="analysis">التحليل</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              {results && results.length > 0 ? (
                <div className="space-y-3 mt-4">
                  {results.map(r => (
                    <Card key={r.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{r.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline">
                              المتوسط: {r.averageScore?.toFixed(1) || "—"}
                            </Badge>
                            <Badge variant="outline">
                              التاريخ: {r.historyAverage?.toFixed(1) || "—"} | الجغرافيا: {r.geographyAverage?.toFixed(1) || "—"}
                            </Badge>
                            <Badge variant="secondary">
                              ناجحون: {r.passedCount || 0}/{r.totalStudents}
                            </Badge>
                          </div>
                          {r.notes && <p className="text-sm text-muted-foreground mt-2">{r.notes}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate({ id: r.id })}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="mt-4"><CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">لم يتم تسجيل أي نتائج بعد لهذا القسم.</p>
                </CardContent></Card>
              )}
            </TabsContent>

            <TabsContent value="analysis">
              <div className="mt-4 space-y-4">
                {analysis && analysis.totalAssessments > 0 ? (
                  <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-brand-ink-700">{analysis.totalAssessments}</p>
                          <p className="text-sm text-muted-foreground">تقويمات</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold">{analysis.overallAverage?.toFixed(1)}</p>
                          <p className="text-sm text-muted-foreground">المتوسط العام</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-brand-ink-700">{analysis.avgHistory?.toFixed(1)}</p>
                          <p className="text-sm text-muted-foreground">متوسط التاريخ</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-green-600">{analysis.avgGeography?.toFixed(1)}</p>
                          <p className="text-sm text-muted-foreground">متوسط الجغرافيا</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Weak Domains */}
                    {analysis.weakDomains.length > 0 && (
                      <Card className="border-red-200 bg-red-50/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2 text-red-700">
                            <TrendingDown className="w-4 h-4" />
                            مواطن الضعف
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {analysis.weakDomains.slice(0, 6).map((domain, i) => {
                              const detail = analysis.weakDomainDetails?.find(d => d.label === domain);
                              return (
                                <Badge key={i} variant="destructive" className="flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  {domain}{detail ? ` (${detail.avg} نقطة)` : ''}
                                </Badge>
                              );
                            })}
                            {analysis.weakDomains.length > 6 && (
                              <Badge variant="outline" className="text-red-700">
                                +{analysis.weakDomains.length - 6} محاور أخرى
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Suggestions */}
                    {analysis.suggestions.length > 0 && (
                      <Card className="border-amber-200 bg-amber-50/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                            <Lightbulb className="w-4 h-4" />
                            اقتراحات العلاج والإثراء
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysis.suggestions.map((s, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">•</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-5 border-t border-amber-200/80 pt-4">
                            <p className="text-xs leading-relaxed text-amber-900/75 mb-3">
                              حوّل هذه التوصيات إلى نشاط قصير للحصة القادمة، ثم عدّله أو اطبعه من المكتبة.
                            </p>
                            <Button size="sm" onClick={openRemediationActivity}>
                              <NotebookPen className="w-4 h-4 ml-2" />إنشاء نشاط علاجي للحصة القادمة
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="mt-4"><CardContent className="p-8 text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">سجّل نتائج تقويم واحدة على الأقل لعرض التحليل.</p>
                  </CardContent></Card>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Dialog open={remediationOpen} onOpenChange={setRemediationOpen}>
            <DialogContent className="max-w-xl" dir="rtl">
              <DialogHeader>
                <DialogTitle>نشاط علاجي للحصة القادمة</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 rounded-lg border border-brand-teal-100 bg-brand-teal-50/40 p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="remediation-situation">الوضعية المرجعية من المخطط السنوي</Label>
                  <Select
                    value={remediationSituationId?.toString() ?? ""}
                    onValueChange={(value) => {
                      const situation = completedSituations.find((item) => item.id === Number(value));
                      if (!situation) return;
                      setRemediationSituationId(situation.id);
                      setRemediationTitle(situation.title);
                      setRemediationTitleEdited(false);
                    }}
                  >
                    <SelectTrigger id="remediation-situation" className="bg-background">
                      <SelectValue placeholder="اختر وضعية منجزة" />
                    </SelectTrigger>
                    <SelectContent>
                      {completedSituations.map((situation) => (
                        <SelectItem key={situation.id} value={situation.id.toString()}>
                          {situation.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="remediation-title">عنوان بطاقة النشاط</Label>
                  <Input
                    id="remediation-title"
                    value={remediationTitle}
                    onChange={(event) => {
                      const title = event.target.value;
                      setRemediationTitle(title);
                      setRemediationTitleEdited(title.trim() !== (selectedRemediationSituation?.title ?? ""));
                    }}
                    disabled={!selectedRemediationSituation}
                  />
                  <p className="text-xs text-muted-foreground">
                    {remediationTitleEdited
                      ? "سيُحفظ التعديل اليدوي للأستاذ مع بقاء الوضعية الرسمية مرجعاً في بيانات النشاط."
                      : "يُعبّأ العنوان الرسمي تلقائياً من الوضعية المختارة، ويمكنك تعديله عند الحاجة."}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-7 max-h-80 overflow-y-auto">
                <p className="font-semibold">عنوان الوضعية: {remediationTitle || selectedRemediationSituation?.title || "—"}</p>
                <p className="font-semibold">القسم: {classes?.find((item) => item.id === selectedClassId)?.name || "القسم الحالي"}</p>
                <p className="mt-2"><strong>المدة المقترحة:</strong> 20 دقيقة</p>
                <p className="mt-2"><strong>مواطن العلاج:</strong> {analysis?.weakDomains?.join("، ") || "النتائج المسجلة"}</p>
                <p className="mt-3 font-semibold">خطوات النشاط</p>
                <ol className="list-decimal pr-5 space-y-1">
                  <li>استرجاع سريع للمعارف السابقة بسؤالين قصيرين.</li>
                  <li>تقسيم التلاميذ إلى ثنائيات لمعالجة المثال أو السند الذي يختاره الأستاذ.</li>
                  <li>عرض الحلول ومناقشة الخطأ الشائع المرتبط بمواطن الضعف.</li>
                  <li>بطاقة خروج قصيرة للتحقق من التحسن قبل متابعة التعلم.</li>
                </ol>
                <p className="mt-3 text-xs text-muted-foreground">يُحفظ النشاط قابلًا للتعديل؛ أضف السند أو المثال المطابق لما دُرّس فعليًا قبل طباعته.</p>
              </div>
              <Button
                disabled={remediationActivityMutation.isPending || !selectedClassId || !analysis || !selectedRemediationSituation}
                onClick={() => {
                  const className = classes?.find((item) => item.id === selectedClassId)?.name || "القسم";
                  const officialSituationTitle = selectedRemediationSituation?.title;
                  const canonicalTitle = remediationTitle.trim() || officialSituationTitle;
                  if (!selectedRemediationSituation || !canonicalTitle) {
                    toast.error("اختر وضعية منجزة حتى يُحفظ النشاط بعنوانها الرسمي.");
                    return;
                  }
                  const weakDomains = analysis?.weakDomains?.join("، ") || "مواطن الضعف المسجلة";
                  const suggestions = analysis?.suggestions?.map((suggestion, index) => `${index + 1}. ${suggestion}`).join("\n") || "- راجع النتائج المسجلة وحدد الهدف الدقيق للنشاط.";
                  remediationActivityMutation.mutate({
                    classId: selectedClassId,
                    type: "activity",
                    title: canonicalTitle,
                    content: `# نشاط علاجي صفي\n\n**عنوان الوضعية:** ${canonicalTitle}\n\n**القسم:** ${className}\n\n**المدة المقترحة:** 20 دقيقة\n\n## مواطن العلاج\n${weakDomains}\n\n## هدف النشاط\nمعالجة مواطن الضعف التي ظهرت في التقويم، مع التحقق من تحسن الأداء بنهاية الحصة.\n\n## خطوات التنفيذ\n1. استرجاع سريع للمعارف السابقة بسؤالين قصيرين.\n2. عمل ثنائي على مثال أو سند يختاره الأستاذ من الدرس المنجز.\n3. عرض الحلول ومناقشة الخطأ الشائع.\n4. بطاقة خروج قصيرة للتحقق من التحسن.\n\n## توصيات التحليل المعتمدة\n${suggestions}\n\n## ملاحظة للأستاذ\nأضف السند أو المثال المطابق لما دُرّس فعليًا قبل التنفيذ أو الطباعة.`,
                    metadata: {
                      source: "assessment_results",
                      situationId: selectedRemediationSituation.id,
                      officialSituationTitle,
                      titleSource: remediationTitleEdited ? "teacher_edit" : "official_situation",
                      weakDomains: analysis?.weakDomains ?? [],
                      suggestions: analysis?.suggestions ?? [],
                    },
                    tags: ["علاج تربوي", "نشاط صفي", "نتائج التقويم"],
                  });
                }}
              >
                {remediationActivityMutation.isPending ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جارٍ الحفظ…</> : <><NotebookPen className="w-4 h-4 ml-2" />حفظ وفتح النشاط</>}
              </Button>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
