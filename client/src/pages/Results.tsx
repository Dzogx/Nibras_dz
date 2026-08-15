import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, BarChart3, TrendingDown, Lightbulb, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function Results() {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newResult, setNewResult] = useState({
    title: "",
    totalStudents: 0,
    participatedStudents: 0,
    averageScore: 0,
    passedCount: 0,
    historyAverage: 0,
    geographyAverage: 0,
    notes: "",
  });

  const { data: classes } = trpc.classes.list.useQuery();

  const { data: results } = trpc.results.list.useQuery(
    { classId: selectedClassId! },
    { enabled: !!selectedClassId }
  );

  const { data: analysis } = trpc.results.analyze.useQuery(
    { classId: selectedClassId! },
    { enabled: !!selectedClassId }
  );

  const createMutation = trpc.results.create.useMutation({
    onSuccess: () => {
      utils.results.list.invalidate({ classId: selectedClassId! });
      utils.results.analyze.invalidate({ classId: selectedClassId! });
      toast.success("تم تسجيل النتائج");
      setAddOpen(false);
      setNewResult({ title: "", totalStudents: 0, participatedStudents: 0, averageScore: 0, passedCount: 0, historyAverage: 0, geographyAverage: 0, notes: "" });
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
            {classes && classes.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {classes.map(c => (
                  <Card
                    key={c.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedClassId(c.id)}
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
                {classes?.find(c => c.id === selectedClassId)?.name || "القسم"}
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
                          <p className="text-2xl font-bold text-brand-navy-700">{analysis.totalAssessments}</p>
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
                          <p className="text-2xl font-bold text-brand-navy-700">{analysis.avgHistory?.toFixed(1)}</p>
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
                            {analysis.weakDomains.map((domain, i) => (
                              <Badge key={i} variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {domain}
                              </Badge>
                            ))}
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
        </>
      )}
    </div>
  );
}
