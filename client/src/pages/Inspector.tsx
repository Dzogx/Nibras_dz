import { trpc } from "@/lib/trpc";
import { OfficeHeader } from "@/components/OfficeChrome";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Eye, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { MarkdownRenderer, truncateMarkdown } from "@/components/MarkdownRenderer";
import { A4PrintButton, A4PrintContent } from "@/components/A4Print";
import { PrintPreviewDialog } from "@/components/PrintPreviewDialog";

function InspectorResult({ result, rawResult, printMeta }: { result: any; rawResult: string; printMeta?: { subject?: string; gradeLevel?: string } }) {
  const criteria = result?.criteria || {};
  const [previewOpen, setPreviewOpen] = useState(false);

  const inspectorPrintMeta = useMemo(() => ({
    title: "تقرير التفتيش التربوي",
    subject: printMeta?.subject || undefined,
    levelSection: printMeta?.gradeLevel || undefined,
  }), [printMeta]);
  const criteriaLabels: Record<string, string> = {
    curriculumAlignment: "التوافق مع المنهج",
    learningObjectives: "أهداف التعلم",
    assessmentQuality: "جودة التقييم",
    bloomsTaxonomy: "تصنيف بلوم",
    activeLearning: "التعلم النشط",
  };

  const getScoreColor = (score: number) => {
    if (score >= 16) return "text-emerald-600";
    if (score >= 12) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-4 print-container">
      <div className="flex justify-between items-center print:hidden">
        <span></span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="w-4 h-4 ml-1" />
            معاينة
          </Button>
          <A4PrintButton title="تقرير التفتيش" subtitle="" />
        </div>
      </div>
      {/* الترويسة الرسمية الجزائرية تظهر عند الطباعة فقط */}
      <A4PrintContent {...inspectorPrintMeta}>
      {/* Overall Score */}
      <div className="text-center py-4">
        <div className={`text-4xl font-bold ${getScoreColor(result?.overallScore || 0)}`}>
          {result?.overallScore || 0}/100
        </div>
        <p className="text-sm text-muted-foreground mt-1">التقييم العام</p>
      </div>

      {/* Criteria */}
      <div className="space-y-3">
        {Object.entries(criteria).map(([key, value]: [string, any]) => (
          <div key={key} className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{criteriaLabels[key] || key}</span>
              <span className={`text-sm font-bold ${getScoreColor(value?.score || 0)}`}>
                {value?.score || 0}/20
              </span>
            </div>
            {value?.findings && (
              <p className="text-xs text-muted-foreground mt-1">{value.findings}</p>
            )}
          </div>
        ))}
      </div>

      {/* Critical Errors */}
      {result?.criticalErrors?.length > 0 && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="font-medium text-sm text-red-700 mb-2">أخطاء جوهرية:</p>
          <ul className="space-y-1">
            {result.criticalErrors.map((err: string, i: number) => (
              <li key={i} className="text-sm text-red-600">• {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {result?.recommendations?.length > 0 && (
        <div className="p-3 rounded-lg bg-brand-copper-50 border border-brand-copper-200">
          <p className="font-medium text-sm text-brand-ink-700 mb-2">توصيات:</p>
          <ul className="space-y-1">
            {result.recommendations.map((rec: string, i: number) => (
              <li key={i} className="text-sm text-brand-copper-700">• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Fallback for raw result */}
      {rawResult && !result?.criteria && (
        <div>
          <div className="prose prose-sm max-w-none text-right mt-4" dir="rtl">
            <MarkdownRenderer source={rawResult} />
          </div>
        </div>
      )}
      </A4PrintContent>

      {/* نافذة المعاينة قبل الطباعة */}
      <PrintPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        meta={inspectorPrintMeta}
      >
        {/* التقييم العام */}
        <div className="text-center py-4">
          <div className={`text-4xl font-bold ${getScoreColor(result?.overallScore || 0)}`}>
            {result?.overallScore || 0}/100
          </div>
          <p className="text-sm text-muted-foreground mt-1">التقييم العام</p>
        </div>
        {/* المعايير */}
        <div className="space-y-3">
          {Object.entries(criteria).map(([key, value]: [string, any]) => (
            <div key={key} className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{criteriaLabels[key] || key}</span>
                <span className={`text-sm font-bold ${getScoreColor(value?.score || 0)}`}>
                  {value?.score || 0}/20
                </span>
              </div>
              {value?.findings && (
                <p className="text-xs text-muted-foreground mt-1">{value.findings}</p>
              )}
            </div>
          ))}
        </div>
        {/* الأخطاء الجوهرية */}
        {result?.criticalErrors?.length > 0 && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="font-medium text-sm text-red-700 mb-2">أخطاء جوهرية:</p>
            <ul className="space-y-1">
              {result.criticalErrors.map((err: string, i: number) => (
                <li key={i} className="text-sm text-red-600">• {err}</li>
              ))}
            </ul>
          </div>
        )}
        {/* التوصيات */}
        {result?.recommendations?.length > 0 && (
          <div className="p-3 rounded-lg bg-brand-copper-50 border border-brand-copper-200">
            <p className="font-medium text-sm text-brand-ink-700 mb-2">توصيات:</p>
            <ul className="space-y-1">
              {result.recommendations.map((rec: string, i: number) => (
                <li key={i} className="text-sm text-brand-copper-700">• {rec}</li>
              ))}
            </ul>
          </div>
        )}
        {/* النص الكامل */}
        <div className="prose prose-sm max-w-none text-right mt-4" dir="rtl">
          <MarkdownRenderer source={rawResult} />
        </div>
      </PrintPreviewDialog>
    </div>
  );
}

export default function Inspector() {
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  const [reviewType, setReviewType] = useState<"lesson" | "assessment">("lesson");
  const [result, setResult] = useState<any>(null);
  const [rawResult, setRawResult] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: lessons } = trpc.lessons.list.useQuery();
  const { data: resources } = trpc.aiResources.list.useQuery({ type: "quiz" });
  const { data: reviews } = trpc.inspector.reviews.useQuery();
  const [printMeta, setPrintMeta] = useState<{ subject?: string; gradeLevel?: string }>({});
  const [selectedLesson, setSelectedLesson] = useState<{ subject?: string; gradeLevel?: string } | null>(null);

  const reviewLessonMutation = trpc.inspector.reviewLesson.useMutation({
    onSuccess: (data: any) => {
      utils.inspector.reviews.invalidate();
      setPrintMeta({ subject: selectedLesson?.subject, gradeLevel: selectedLesson?.gradeLevel });
      const evalStr = data?.evaluation || "";
      try {
        const parsed = JSON.parse(evalStr);
        setResult(parsed);
      } catch {
        setRawResult(evalStr);
        setResult(null);
      }
      toast.success("تم تقييم الدرس");
    },
    onError: () => toast.error("خطأ في التقييم"),
  });

  const reviewAssessmentMutation = trpc.inspector.reviewAssessment.useMutation({
    onSuccess: (data: any) => {
      utils.inspector.reviews.invalidate();
      // الموارد لا تحمل حقول مادة/مستوى مباشرة؛ نستخرجها من الدرس المرتبط إن وجد
      const res = resources?.find(r => r.id === selectedResourceId);
      if (res?.lessonId) {
        const lesson = lessons?.find(l => l.id === res.lessonId);
        setPrintMeta({ subject: lesson?.subject ?? undefined, gradeLevel: lesson?.gradeLevel ?? undefined });
      } else {
        setPrintMeta({});
      }
      const evalStr = data?.evaluation || "";
      try {
        const parsed = JSON.parse(evalStr);
        setResult(parsed);
      } catch {
        setRawResult(evalStr);
        setResult(null);
      }
      toast.success("تم تقييم التقييم");
    },
    onError: () => toast.error("خطأ في التقييم"),
  });

  const handleReview = () => {
    if (reviewType === "lesson" && selectedLessonId) {
      reviewLessonMutation.mutate({ lessonId: selectedLessonId });
    } else if (reviewType === "assessment" && selectedResourceId) {
      reviewAssessmentMutation.mutate({ resourceId: selectedResourceId });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <OfficeHeader title="وضع المفتش" subtitle="مراجعة وتقييم الدروس والتقييمات بالذكاء الاصطناعي" />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              اختيار للمراجعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>نوع المراجعة</Label>
              <Select value={reviewType} onValueChange={v => setReviewType(v as "lesson" | "assessment")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lesson">مراجعة درس</SelectItem>
                  <SelectItem value="assessment">مراجعة تقييم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {reviewType === "lesson" ? (
              <div>
                <Label>اختر الدرس</Label>
                <Select value={selectedLessonId?.toString() || ""} onValueChange={v => {
                const id = v ? parseInt(v) : null;
                setSelectedLessonId(id);
                if (id) {
                  const lesson = lessons?.find(l => l.id === id);
                  setSelectedLesson({ subject: lesson?.subject ?? undefined, gradeLevel: lesson?.gradeLevel ?? undefined });
                } else {
                  setSelectedLesson(null);
                }
              }}>
                  <SelectTrigger><SelectValue placeholder="اختر درساً" /></SelectTrigger>
                  <SelectContent>
                    {(lessons && lessons.length > 0) ? lessons.map(l => (
                      <SelectItem key={l.id} value={l.id.toString()}>{l.title}</SelectItem>
                    )) : (
                      <SelectItem value="__none__" disabled>لا توجد دروس مسجلة بعد</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {(!lessons || lessons.length === 0) && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    لم تسجل أي درس بعد — سجّل دروسك من صفحة الدروس أو حضّر الحصة من لوحة التحكم، ثم عُد للمراجعة هنا.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Label>اختر التقييم</Label>
                <Select value={selectedResourceId?.toString() || ""} onValueChange={v => setSelectedResourceId(v ? parseInt(v) : null)}>
                  <SelectTrigger><SelectValue placeholder="اختر تقييماً" /></SelectTrigger>
                  <SelectContent>
                    {(resources && resources.length > 0) ? resources.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.title}</SelectItem>
                    )) : (
                      <SelectItem value="__none__" disabled>لا توجد تقييمات مولدة بعد</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {(!resources || resources.length === 0) && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    لم تُولّد أي تقييمات بعد — أنشئ تقييمًا من استوديو التقويمات ثم عُد للمراجعة هنا.
                  </p>
                )}
              </div>
            )}
            <Button className="w-full" onClick={handleReview} disabled={!selectedLessonId && !selectedResourceId}>
              {(reviewLessonMutation.isPending || reviewAssessmentMutation.isPending)
                ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري المراجعة...</>
                : <><Sparkles className="w-4 h-4 ml-2" />بدء المراجعة</>}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نتيجة المراجعة</CardTitle>
          </CardHeader>
          <CardContent>
            {(reviewLessonMutation.isPending || reviewAssessmentMutation.isPending) ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : result ? (
              <InspectorResult result={result} rawResult={rawResult} printMeta={printMeta} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p>اختر درساً أو تقييماً لبدء المراجعة</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Previous Reviews */}
      {reviews && reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>سجل المراجعات السابقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {review.resourceType === "lesson" ? "مراجعة درس" : "مراجعة تقييم"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("ar-DZ")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{truncateMarkdown(review.evaluation ?? "", 260)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
