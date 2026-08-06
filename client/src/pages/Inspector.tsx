import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Eye, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from 'streamdown';

export default function Inspector() {
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  const [reviewType, setReviewType] = useState<"lesson" | "assessment">("lesson");
  const [result, setResult] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: lessons } = trpc.lessons.list.useQuery();
  const { data: resources } = trpc.aiResources.list.useQuery({ type: "quiz" });
  const { data: reviews } = trpc.inspector.reviews.useQuery();

  const reviewLessonMutation = trpc.inspector.reviewLesson.useMutation({
    onSuccess: (data: any) => {
      utils.inspector.reviews.invalidate();
      setResult(data?.evaluation || "تم التقييم بنجاح");
      toast.success("تم تقييم الدرس");
    },
    onError: () => toast.error("خطأ في التقييم"),
  });

  const reviewAssessmentMutation = trpc.inspector.reviewAssessment.useMutation({
    onSuccess: (data: any) => {
      utils.inspector.reviews.invalidate();
      setResult(data?.evaluation || "تم التقييم بنجاح");
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
      <div>
        <h1 className="text-2xl font-bold">وضع المفتش</h1>
        <p className="text-muted-foreground mt-1">مراجعة وتقييم الدروس والتقييمات بالذكاء الاصطناعي</p>
      </div>

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
                <Select value={selectedLessonId?.toString() || ""} onValueChange={v => setSelectedLessonId(v ? parseInt(v) : null)}>
                  <SelectTrigger><SelectValue placeholder="اختر درساً" /></SelectTrigger>
                  <SelectContent>
                    {lessons?.map(l => (
                      <SelectItem key={l.id} value={l.id.toString()}>{l.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label>اختر التقييم</Label>
                <Select value={selectedResourceId?.toString() || ""} onValueChange={v => setSelectedResourceId(v ? parseInt(v) : null)}>
                  <SelectTrigger><SelectValue placeholder="اختر تقييماً" /></SelectTrigger>
                  <SelectContent>
                    {resources?.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="prose prose-sm max-w-none text-right" dir="rtl">
                <Streamdown>{result}</Streamdown>
              </div>
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
                  <p className="text-sm text-muted-foreground line-clamp-3">{review.evaluation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
