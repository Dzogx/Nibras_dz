import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

function getNumericSearchParam(name: string) {
  if (typeof window === "undefined") return undefined;
  const value = Number(new URLSearchParams(window.location.search).get(name));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * مسار قصير لإنتاج وضعية إدماجية. لا يُطلب من الأستاذ إدخال العنوان أو المستوى
 * مرة ثانية: تستعاد من الوضعية وخطتها السنوية ثم يفتح الناتج في المحرر القائم.
 */
export default function IntegrativeSituation() {
  const [, setLocation] = useLocation();
  const situationId = getNumericSearchParam("situationId");
  const classIdParam = getNumericSearchParam("classId");
  const { data: situation, isLoading: situationLoading } = trpc.situations.getById.useQuery(
    { id: situationId ?? 0 },
    { enabled: Boolean(situationId) },
  );
  const { data: section } = trpc.sections.getById.useQuery(
    { id: situation?.sectionId ?? 0 },
    { enabled: Boolean(situation?.sectionId) },
  );
  const { data: plan } = trpc.annualPlans.getById.useQuery(
    { id: section?.annualPlanId ?? 0 },
    { enabled: Boolean(section?.annualPlanId) },
  );

  const generateMutation = trpc.ai.generateLesson.useMutation({
    onSuccess: (result) => {
      toast.success("أُنشئت الوضعية الإدماجية. يمكنك الآن مراجعتها وتحريرها وطباعتها.");
      if (result.resourceId) setLocation(`/content-library/${result.resourceId}`);
    },
    onError: (error) => toast.error(error.message || "تعذر إنشاء الوضعية الإدماجية. حاول مجدداً بعد لحظات."),
  });

  const classId = plan?.classId ?? classIdParam;

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-3" onClick={() => setLocation("/dashboard")}>
          <ArrowRight className="ml-1 h-4 w-4" />العودة إلى مهامي اليوم
        </Button>
        <h1 className="text-2xl font-bold">إنشاء وضعية إدماجية</h1>
        <p className="mt-1 text-muted-foreground">يبني نبراس مسودة قابلة للتحرير والطباعة من سياق الوضعية الرسمية، دون إدخال متكرر للعنوان أو المستوى.</p>
      </div>

      {situationLoading ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">جارٍ استرجاع سياق الوضعية…</CardContent></Card>
      ) : !(situation && section && plan) ? (
        <Alert variant="destructive" className="break-words">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            يلزم فتح هذه الصفحة من وضعية مرتبطة بالخطة السنوية حتى يبقى المحتوى متوافقاً مع ما دُرّس فعلياً.
            <Button variant="link" className="h-auto px-1 text-destructive underline" onClick={() => setLocation("/dashboard")}>العودة إلى لوحة اليوم</Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="border-b bg-primary/[0.035]">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span>
              <div>
                <CardTitle className="text-lg">سياق محفوظ من الخطة السنوية</CardTitle>
                <CardDescription className="mt-1 leading-6">المقطع {section.sectionNumber}: {section.title} · الوضعية {situation.situationNumber}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs font-medium text-primary">عنوان الوضعية المرجعية</p>
              <p className="mt-1 text-lg font-semibold leading-7">{situation.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.subject} · {plan.gradeLevel} · {classId ? "القسم مرتبط تلقائياً" : "سياق القسم غير متاح"}</p>
            </div>
            <div className="rounded-xl bg-muted/70 p-4 text-sm leading-6 text-muted-foreground">
              سيُنتج نبراس سياقاً واقعياً، وسنداً قابلاً للاستعمال، وتعليمة إدماجية واحدة، وعناصر الإنجاز ومعايير تقويم موجزة. ستنتقل المسودة بعد إنشائها إلى محرر قابل للحفظ والطباعة.
            </div>
            <Button
              className="w-full sm:w-auto"
              disabled={generateMutation.isPending || !classId}
              onClick={() => {
                if (!situation || !plan || !classId) return;
                generateMutation.mutate({
                  classId,
                  situationId: situation.id,
                  title: situation.title,
                  subject: plan.subject,
                  gradeLevel: plan.gradeLevel,
                  unitTitle: situation.title,
                  unitNumber: situation.situationNumber,
                  duration: "حصة واحدة",
                  contentType: "integrativeSituation",
                  preferOfficialSituationTitle: true,
                });
              }}
            >
              {generateMutation.isPending ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جارٍ إنشاء الوضعية…</> : <><Sparkles className="ml-2 h-4 w-4" />أنشئ الوضعية الإدماجية</>}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
