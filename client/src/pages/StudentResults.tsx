import { trpc } from "@/lib/trpc";
import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Upload, BarChart3, TrendingDown, FileSpreadsheet, Trash2, Loader2, AlertTriangle, CheckCircle2, Printer } from "lucide-react";
import { toast } from "sonner";
import { usePreferredClass } from "@/hooks/usePreferredClass";

function averageEvaluationClass(avg: number | null): string {
  if (avg == null) return "";
  if (avg >= 16) return "text-emerald-600";
  if (avg >= 10) return "text-primary";
  return "text-red-500";
}

export default function StudentResults() {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<{ classId: number; subject: string; term: number } | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importStep, setImportStep] = useState<"upload" | "preview" | "mapping" | "saved">("upload");
  const [importFileName, setImportFileName] = useState("");
  const [importIssues, setImportIssues] = useState<string[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [studentFilter, setStudentFilter] = useState("");

  const { data: profile } = trpc.profile.get.useQuery(undefined, { staleTime: 60_000 });
  const { data: classes } = trpc.classes.list.useQuery();
  const seasonClasses = useMemo(
    () => (classes ?? []).filter((c) => !c.academicYear || c.academicYear === profile?.academicYear),
    [classes, profile?.academicYear],
  );

  const { data: filtersData, isLoading: filtersLoading } = trpc.studentResults.list.useQuery(
    { classId: selectedClassId ?? undefined },
    { enabled: !!selectedClassId },
  );
  const { data: analytics, isLoading: analyticsLoading } = trpc.studentResults.analytics.useQuery(
    selectedFilters ?? { classId: selectedClassId!, subject: undefined, term: undefined },
    { enabled: !!selectedFilters || !!selectedClassId, staleTime: 30_000 },
  );
  const { data: grades, isLoading: gradesLoading } = trpc.studentResults.list.useQuery(
    { classId: selectedClassId! },
    { enabled: !!selectedClassId },
  );

  const [preferredClassId, setPreferredClassId] = usePreferredClass(profile?.academicYear);
  void preferredClassId;

  const importMut = trpc.studentResults.parseExcel.useMutation({
    onSuccess: (data) => {
      if (!data?.sheets || data.sheets.length === 0) {
        toast.error("لا توجد أوراق صالحة في الملف. تأكد أنه وثيقة حجز نقاط من منصة الرقمنة.");
        return;
      }
      const issues = Array.isArray(data.issues) ? data.issues : [];
      setImportIssues(issues);
      setSheets(data.sheets);
      setMappings(
        data.sheets.map((sheet: any) => ({
          ...sheet,
          classId: null as number | null,
          overrideExisting: false,
          classOptions: seasonClasses.filter((c) => c.gradeLevel === sheet.gradeLevel) as any[],
        })),
      );
      void importFileName;
      setImportStep("mapping");
      toast.success(`تمت قراءة ${data.sheets.length} ورقة من الملف`);
    },
    onError: (err) => toast.error(err.message),
  });

  const saveMut = trpc.studentResults.saveImport.useMutation({
    onSuccess: (data) => {
      setImportStep("saved");
      toast.success(`حُفظت نقاط ${data?.saved?.length ?? 0} أفواج بنجاح`);
      utils.studentResults.list.invalidate({ classId: selectedClassId ?? undefined });
      utils.studentResults.analytics.invalidate();
      setTimeout(() => {
        setImportDialogOpen(false);
        setImportStep("upload");
        setSelectedClassId(data?.saved?.[0] ? null : selectedClassId);
      }, 1500);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteGroupMut = trpc.studentResults.deleteGroup.useMutation({
    onSuccess: () => {
      utils.studentResults.list.invalidate({ classId: selectedClassId ?? undefined });
      utils.studentResults.analytics.invalidate();
      toast.success("تم حذف المجموعة");
    },
  });

  const deleteStudentMut = trpc.studentResults.deleteStudent.useMutation({
    onSuccess: () => {
      utils.studentResults.list.invalidate({ classId: selectedClassId ?? undefined });
      utils.studentResults.analytics.invalidate();
      toast.success("تم الحذف");
    },
  });

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("يرجى رفع ملف Excel (.xlsx)");
      return;
    }
    setImportFileName(file.name);
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
    }
    importMut.mutate({ fileContent: btoa(binary) });
  };

  const canSave = mappings.length > 0 && mappings.every((m) => m.classId != null && m.term != null && m.subject && m.students.length > 0);

  const filteredGrades = useMemo(() => {
    if (!selectedFilters || !grades) return null;
    const list = grades.filter((g: any) => g.subject === selectedFilters.subject && g.term === selectedFilters.term);
    if (!studentFilter.trim()) return list;
    return list.filter((g: any) => g.fullName.includes(studentFilter) || g.matricule.includes(studentFilter));
  }, [grades, selectedFilters, studentFilter]);

  const filteredGroups = useMemo(() => {
    const raw = (filtersData ?? []) as any[];
    if (!studentFilter.trim()) return raw;
    return raw;
  }, [filtersData, studentFilter]);

  const openImport = () => {
    setImportDialogOpen(true);
    setImportStep("upload");
    setSheets([]);
    setMappings([]);
    setImportIssues([]);
  };

  const selectClass = (classId: number) => {
    setSelectedClassId(classId);
    setPreferredClassId(classId);
    setSelectedFilters(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">نتائج التلاميذ</h1>
          <p className="text-muted-foreground mt-1">استيراد وثيقة حجز النقاط من الرقمنة وتحليل أداء الفوج</p>
        </div>
        <Button onClick={openImport}>
          <Upload className="w-4 h-4 ml-2" />استيراد ملف الرقمنة
        </Button>
      </div>

      {!selectedClassId ? (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">اختر القسم</h2>
            {seasonClasses.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {seasonClasses.map((c) => (
                  <Card
                    key={c.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => selectClass(c.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <p className="font-medium">{c.name}</p>
                      {c.gradeLevel && <p className="text-xs text-muted-foreground mt-1">{c.gradeLevel}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">لا توجد أقسام لهذا الموسم. أنشئ الأقسام أولاً من صفحة الإعداد.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedClassId(null)}>
                تغيير القسم
              </Button>
              <h2 className="text-lg font-semibold">{seasonClasses.find((c) => c.id === selectedClassId)?.name}</h2>
            </div>
            <Button variant="outline" size="sm" onClick={openImport}>
              <Upload className="w-4 h-4 ml-2" />رفع ملف جديد
            </Button>
          </div>

          {/* مجموعات المحفوظة (فصل/مادة) */}
          {filtersLoading ? (
            <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 mx-auto animate-spin" /></CardContent></Card>
          ) : (filteredGroups as any[]).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-primary/45" />
                <p className="font-semibold">لا توجد نقاط تلاميذ لهذا القسم بعد</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  ارفع وثيقة حجز النقاط التي صدّرتها من منصة الرقمنة (xlsx) — يستخرج نبراس الأفواج والمواد والنقاط تلقائياً ويحسب المعدل الفصلي وفق المعادلة الرسمية.
                </p>
                <Button className="mt-5" onClick={openImport}>
                  <Upload className="w-4 h-4 ml-2" />استيراد ملف الرقمنة
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(filteredGroups as any[]).map((f: any) => (
                <Card key={`${f.classId}-${f.subject}-${f.term}`} className="cursor-pointer hover:border-primary transition-colors">
                  <CardContent className="p-4 flex items-center justify-between" onClick={() => setSelectedFilters({ classId: f.classId, subject: f.subject, term: f.term })}>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{f.subject}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline">الفصل {f.term}</Badge>
                        <Badge variant="secondary">{f.count} تلميذ</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGroupMut.mutate({ classId: f.classId, subject: f.subject, term: f.term });
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* تفاصيل المجموعة + التحليل */}
          {selectedFilters && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex flex-wrap items-center gap-2">
                  {selectedFilters.subject} — الفصل {selectedFilters.term}
                  {analytics && <Badge variant="outline">{analytics.classAverage.toFixed(1)} / 20 معدل القسم</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="grades">
                  <TabsList>
                    <TabsTrigger value="grades">نقاط التلاميذ</TabsTrigger>
                    <TabsTrigger value="analysis">التحليل</TabsTrigger>
                  </TabsList>

                  <TabsContent value="grades">
                    <div className="flex flex-wrap items-center gap-3 mt-4 mb-2">
                      <Input
                        placeholder="بحث بالاسم أو رقم التعريف..."
                        className="max-w-xs"
                        value={studentFilter}
                        onChange={(e) => setStudentFilter(e.target.value)}
                      />
                      <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 ml-2" />طباعة الجدول
                      </Button>
                    </div>
                    {gradesLoading ? (
                      <div className="text-center py-8 text-muted-foreground"><Loader2 className="h-6 w-6 mx-auto animate-spin" /></div>
                    ) : filteredGrades && filteredGrades.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse print-table">
                          <thead>
                            <tr className="border-b bg-muted/50 text-right">
                              <th className="py-2 px-2 font-medium">الموقف</th>
                              <th className="py-2 px-2 font-medium">التعريف</th>
                              <th className="py-2 px-2 font-medium">الاسم واللقب</th>
                              <th className="py-2 px-2 font-medium">النشاطات /20</th>
                              <th className="py-2 px-2 font-medium">الفرض /20</th>
                              <th className="py-2 px-2 font-medium">الاختبار /20</th>
                              <th className="py-2 px-2 font-medium">المعدل /20</th>
                              <th className="py-2 px-2 font-medium">التقدير</th>
                              <th className="py-2 px-2 font-medium"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredGrades.map((g: any, idx: number) => (
                              <tr key={g.id} className="border-b last:border-0 hover:bg-muted/40">
                                <td className="py-2 px-2 text-muted-foreground">{idx + 1}</td>
                                <td className="py-2 px-2 font-mono text-xs">{g.matricule}</td>
                                <td className="py-2 px-2 font-medium">{g.fullName}</td>
                                <td className="py-2 px-2">{g.activityScore ?? "—"}</td>
                                <td className="py-2 px-2">{g.examQuizScore ?? "—"}</td>
                                <td className="py-2 px-2">{g.finalExamScore ?? "—"}</td>
                                <td className={`py-2 px-2 font-semibold ${averageEvaluationClass(g.computedAverage)}`}>
                                  {g.computedAverage?.toFixed(2) ?? "—"}
                                </td>
                                <td className="py-2 px-2">{g.officialEvaluation ?? "—"}</td>
                                <td className="py-2 px-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteStudentMut.mutate({ id: g.id })}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center py-6 text-muted-foreground">لا توجد نتائج مطابقة للبحث.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="analysis">
                    {analyticsLoading ? (
                      <div className="text-center py-8 text-muted-foreground"><Loader2 className="h-6 w-6 mx-auto animate-spin" /></div>
                    ) : analytics ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-xs text-muted-foreground">معدل القسم</p>
                            <p className="text-2xl font-bold mt-1">{analytics.classAverage.toFixed(1)}<span className="text-sm text-muted-foreground">/20</span></p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-xs text-muted-foreground">نسبة النجاح (≥ 10)</p>
                            <p className="text-2xl font-bold mt-1">{Math.round(((analytics.gradedCount - analytics.weakCount) / analytics.gradedCount) * 100)}%</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-xs text-muted-foreground">الأعلى / الأدنى</p>
                            <p className="text-lg font-semibold mt-1">{analytics.topStudent?.computedAverage?.toFixed(1)}<span className="text-sm text-muted-foreground"> / {analytics.lowestStudent?.computedAverage?.toFixed(1)}</span></p>
                            <p className="text-[11px] text-muted-foreground truncate mt-1">{analytics.topStudent?.fullName} / {analytics.lowestStudent?.fullName}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-xs text-muted-foreground">تحت المعدل (&lt; 10)</p>
                            <p className="text-2xl font-bold mt-1 text-red-500">{analytics.weakCount}<span className="text-sm text-muted-foreground">/{analytics.gradedCount}</span></p>
                          </CardContent>
                        </Card>

                        <Card className="col-span-2 md:col-span-4">
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-sm mb-3">توزع التقديرات</h3>
                            <div className="space-y-2">
                              {Object.entries(analytics.distribution).map(([ev, count]) => (
                                <div key={ev} className="flex items-center gap-3">
                                  <span className="w-20 text-xs">{ev}</span>
                                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                                    <div
                                      className="h-full bg-primary/70 rounded-full transition-all"
                                      style={{ width: `${analytics.gradedCount > 0 ? Math.round((count / analytics.gradedCount) * 100) : 0}%` }}
                                    />
                                  </div>
                                  <span className="w-8 text-xs text-muted-foreground text-left">{count}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="col-span-2 md:col-span-4">
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <TrendingDown className="w-4 h-4 text-red-500" />
                              التلاميذ المحتاجون للعلاج (أقل من 10)
                            </h3>
                            {analytics.weakCount === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">لا يوجد تلاميذ تحت المعدل. أداء جيد للفوج.</p>
                            ) : (
                              <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                                {analytics.weakStudents.map((w: any) => (
                                  <li key={w.id} className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0">
                                    <span>{w.fullName} <span className="text-xs text-muted-foreground font-mono">({w.matricule})</span></span>
                                    <span className="text-red-500 font-semibold">{w.computedAverage?.toFixed(2)}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </CardContent>
                        </Card>

                        <Card className="col-span-2 md:col-span-4">
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4" />
                              المتوسطات حسب نوع المحصلة
                            </h3>
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div>
                                <p className="text-xs text-muted-foreground">معدل النشاطات</p>
                                <p className="text-xl font-semibold">{analytics.averageActivity.toFixed(1)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">الفروض</p>
                                <p className="text-xl font-semibold">{analytics.averageQuiz.toFixed(1)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">الاختبارات</p>
                                <p className="text-xl font-semibold">{analytics.averageExam.toFixed(1)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <p className="text-center py-6 text-muted-foreground">لا توجد بيانات للتحليل.</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* حوار الاستيراد */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        if (!open && importStep !== "saved") setImportStep("upload");
        setImportDialogOpen(open);
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>استيراد وثيقة حجز النقاط (الرقمنة)</DialogTitle>
            <DialogDescription>
              ارفع ملف xlsx الذي صدّرته من منصة الرقمنة. سيقوم نبراس بقراءة الأفواج والمواد والنقاط تلقائياً.
            </DialogDescription>
          </DialogHeader>

          {importStep === "upload" && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <FileSpreadsheet className="h-10 w-10 mx-auto text-primary/60 mb-3" />
                <p className="font-medium">اضغط لاختيار ملف الرقمنة</p>
                <p className="text-xs text-muted-foreground mt-2">xlsx — وثيقة حجز النقاط بصيغة الرقمنة الرسمية (الأقسام / الفوج / المادة)</p>
                {importMut.isPending && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري قراءة الملف...
                  </div>
                )}
              </div>
            </div>
          )}

                  {importStep === "mapping" && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        وجدنا <strong>{sheets.length}</strong> أفواج (ورقات) في الملف{importFileName ? ` — ${importFileName}` : ""}. اربط كل فوج بالقسم المناسب في نبراس:
                      </p>
              {importIssues.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {importIssues.slice(0, 5).map((issue, i) => (
                      <p key={i}>{issue}</p>
                    ))}
                    {importIssues.length > 5 && <p>+{importIssues.length - 5} ملاحظات أخرى</p>}
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {mappings.map((m: any, idx: number) => (
                  <Card key={m.sheetName}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div>
                  <h3 className="font-semibold text-sm">{m.subject ?? "مادة غير معروفة"} — فوج {m.fogLabel || m.sheetName}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.gradeLevel || "مستوى غير معروف"} · الفصل {m.term ?? "?"} · {m.students.length} تلميذ
                            {m.rowErrors && m.rowErrors.length > 0 && <span className="text-amber-600"> · {m.rowErrors.length} صف مشكل</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Checkbox
                              checked={m.overrideExisting}
                              onCheckedChange={(checked) => setMappings(mappings.map((mm: any, i) => (i === idx ? { ...mm, overrideExisting: Boolean(checked) } : mm)))}
                            />
                            استبدال الموجود
                          </label>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Select
                          value={m.classId ? String(m.classId) : undefined}
                          onValueChange={(value) => setMappings(mappings.map((mm: any, i) => (i === idx ? { ...mm, classId: parseInt(value) } : mm)))}
                        >
                          <SelectTrigger className="w-56">
                            <SelectValue placeholder="اختر القسم المطابق..." />
                          </SelectTrigger>
                          <SelectContent>
                            {m.classOptions.length > 0 ? (
                              m.classOptions.map((c: any) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name} — {c.gradeLevel}</SelectItem>
                              ))
                            ) : (
                              seasonClasses.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name} — {c.gradeLevel}</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {!m.classId && <span className="text-xs text-red-500">اختر القسم</span>}
                        {m.classId && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />جاهز</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setImportStep("upload")}>تغيير الملف</Button>
                <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate({
                  mappings: mappings.map((m: any) => ({
                    sheetFogCode: m.sheetName,
                    classId: m.classId,
                    subject: m.subject,
                    term: m.term,
                    overrideExisting: m.overrideExisting,
                    students: m.students,
                  })),
                })}>
                  {saveMut.isPending ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري الحفظ...</> : "حفظ النقاط"}
                </Button>
              </div>
            </div>
          )}

          {importStep === "saved" && (
            <div className="text-center py-6">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
              <p className="font-semibold">تم حفظ النقاط بنجاح</p>
              <p className="text-sm text-muted-foreground mt-1">يمكنك الآن عرض جدول النقاط والتحليل من صفحة نتائج التلاميذ.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
