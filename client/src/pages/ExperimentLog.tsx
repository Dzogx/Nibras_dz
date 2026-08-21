import { useState, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Star,
  StarHalf,
  Trash2,
  Search,
  Sparkles,
  Clock,
  RotateCcw,
  MessageSquare,
  GraduationCap,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { OfficeHeader } from "@/components/OfficeChrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

const SITUATION_TYPE_LABELS: Record<string, string> = {
  learning: "وضعية تعلّمية",
  integrative: "وضعية إدماجية",
  assessment: "وضعية تقويمية",
};

const SUBJECT_OPTIONS = ["التاريخ", "الجغرافيا", "التربية المدنية", "التاريخ والجغرافيا"];

function SituationTypeBadge({ type }: { type: string }) {
  const label = SITUATION_TYPE_LABELS[type] || type;
  const variant =
    type === "integrative"
      ? "secondary"
      : type === "assessment"
        ? "destructive"
        : "default";
  return (
    <Badge variant={variant} className="text-[11px]">
      {label}
    </Badge>
  );
}

function StarRating({ value, readonly = false, onChange }: { value: number | null | undefined; readonly?: boolean; onChange?: (v: number) => void }) {
  return (
    <span className="inline-flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map(n => {
        const filled = value ? n <= Math.round(value) : false;
        const icon = filled ? (
          <Star className={`h-4 w-4 ${readonly ? "text-amber-400" : "text-amber-400"}`} fill="currentColor" />
        ) : (
          <Star className="h-4 w-4 text-muted-foreground/40" />
        );
        return (
          <button
            key={n}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(n)}
            className={readonly ? "" : "hover:scale-110 transition-transform"}
            aria-label={`تقييم ${n} من 5`}
          >
            {icon}
          </button>
        );
      })}
    </span>
  );
}

export default function ExperimentLog() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState<string>("");
  const [situationType, setSituationType] = useState<string>("");

  const listQuery = trpc.savedStrategies.list.useQuery(
    {
      subject: subject || undefined,
      situationType: situationType || undefined,
      search: search || undefined,
    },
  );

  const markUsedMutation = trpc.savedStrategies.markUsed.useMutation({
    onSuccess: (res, vars) => {
      toast.success(`سُجّل الاستخدام رقم ${res.useCount} — الاستراتيجية جاهزة في دفترك`);
      utils.savedStrategies.list.invalidate();
      utils.savedStrategies.getById.invalidate({ id: vars.id });
    },
    onError: e => toast.error(e.message),
  });

  type PhasesItem = { stage: string; minutes: number; teacherRole: string; studentRole: string; tips?: string };
  const getPhases = (data: any): PhasesItem[] => (Array.isArray(data?.phases) ? data.phases : []);
  const getTips = (data: any): string[] => (Array.isArray(data?.generalTips) ? data.generalTips : []);

  const deleteMutation = trpc.savedStrategies.delete.useMutation({
    onSuccess: () => {
      toast.success("حُذفت الاستراتيجية من الدفتر");
      utils.savedStrategies.list.invalidate();
      setDeleteTarget(null);
    },
    onError: e => toast.error(e.message),
  });

  const [detailId, setDetailId] = useState<number | null>(null);
  const detailQuery = trpc.savedStrategies.getById.useQuery(
    { id: detailId ?? 0 },
    { enabled: detailId !== null },
  );

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [reviewDialogId, setReviewDialogId] = useState<number | null>(null);

  const reviewMutation = trpc.savedStrategies.review.useMutation({
    onSuccess: () => {
      toast.success("حُفظ تقييمك وملاحظاتك في الدفتر");
      utils.savedStrategies.list.invalidate();
      utils.savedStrategies.getById.invalidate({ id: reviewDialogId ?? 0 });
      setReviewDialogId(null);
    },
    onError: e => toast.error(e.message),
  });

  const customMutation = trpc.savedStrategies.saveCustom.useMutation({
    onSuccess: () => {
      toast.success("أُضيفت الاستراتيجية إلى دفتر التجارب");
      utils.savedStrategies.list.invalidate();
      setAddDialogOpen(false);
    },
    onError: e => toast.error(e.message),
  });

  const [custom, setCustom] = useState({
    name: "",
    situationType: "learning" as "learning" | "integrative" | "assessment",
    subject: "",
    rationale: "",
    materials: "",
  });

  const stats = useMemo(() => {
    const rows = listQuery.data || [];
    const rated = rows.filter(r => r.rating).length;
    const avg = rated > 0 ? rows.filter(r => r.rating).reduce((s, r) => s + (r.rating || 0), 0) / rated : 0;
    return { total: rows.length, avg };
  }, [listQuery.data]);

  const openDetail = (id: number) => {
    setDetailId(id);
    // تسجيل الوصول للعرض ليس استخدامًا — الاستخدام يُسجّل من زر «وظّفها في حصة»
  };

  return (
    <div className="space-y-5">
      <OfficeHeader
        title="دفتر التجارب"
        subtitle="استراتيجياتك الناجحة التي جربتها في الحصة — احفظها وأعد توظيفها في أي قسم أو فصل لاحق."
      >
        <div className="office-header-actions">
          <Button onClick={() => setAddDialogOpen(true)} className="office-primary gap-2">
            <Plus className="h-4 w-4" />
            إضافة استراتيجية يدويًا
          </Button>
        </div>
      </OfficeHeader>

      {/* شريط الفلترة */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-4">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في دفتر التجارب..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="كل المواد" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المواد</SelectItem>
              {SUBJECT_OPTIONS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={situationType} onValueChange={setSituationType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="كل أنواع الوضعيات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              <SelectItem value="learning">وضعية تعلّمية</SelectItem>
              <SelectItem value="integrative">وضعية إدماجية</SelectItem>
              <SelectItem value="assessment">وضعية تقويمية</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>{stats.total} استراتيجية · متوسط التقييم {stats.avg > 0 ? stats.avg.toFixed(1) : "—"}/5</span>
          </div>
        </CardContent>
      </Card>

      {/* شبكة البطاقات */}
      {listQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse" />
          ))}
        </div>
      ) : !listQuery.data || listQuery.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="max-w-sm">
              <p className="font-semibold">دفتر التجارب فارغ حتى الآن</p>
              <p className="mt-1 text-sm text-muted-foreground">
                عندما تشاهد استراتيجية تسيير حصة وتنجح معك، اضغط «احفظ في دفتر التجارب» من بطاقة الاستراتيجية لتظهر هنا. يمكنك أيضًا إضافة تجاربك الشخصية يدويًا.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setLocation("/dashboard")} className="gap-2">
                <GraduationCap className="h-4 w-4" />
                اذهب إلى اليوم
              </Button>
              <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة يدوية
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listQuery.data.map(row => (
            <Card key={row.id} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-1">{row.subject}</p>
                    <CardTitle className="text-base leading-snug">{row.name}</CardTitle>
                  </div>
                  <SituationTypeBadge type={row.situationType} />
                </div>
                {row.situationTitle ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    جُرّبت أول مرة على: {row.situationTitle}
                  </p>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                <p className="text-xs text-muted-foreground line-clamp-3">{row.rationale}</p>
                <div className="flex items-center justify-between">
                  <StarRating value={row.rating} readonly />
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <RotateCcw className="h-3.5 w-3.5" />
                      {row.useCount || 0} استخدام
                    </span>
                    {row.totalMinutes ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {row.totalMinutes} د
                      </span>
                    ) : null}
                  </div>
                </div>
              </CardContent>
              <div className="border-t p-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 gap-1"
                  onClick={() => openDetail(row.id)}
                >
                  <FileText className="h-4 w-4" />
                  عرض التفاصيل
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => markUsedMutation.mutate({ id: row.id })}
                  disabled={markUsedMutation.isPending}
                >
                  <Sparkles className="h-4 w-4" />
                  وظّفها في حصة
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => setReviewDialogId(row.id)}
                  title="قيّم وملاحظات"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget({ id: row.id, name: row.name })}
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* حوار التفاصيل: عرض الاستراتيجية الكاملة */}
      <Dialog open={detailId !== null} onOpenChange={open => { if (!open) setDetailId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailQuery.data ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg">{detailQuery.data.name}</DialogTitle>
                  <SituationTypeBadge type={detailQuery.data.situationType} />
                  <Badge variant="outline">{detailQuery.data.subject}</Badge>
                </div>
                <DialogDescription className="text-right">
                  {detailQuery.data.rationale}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-between">
                <StarRating value={detailQuery.data.rating} readonly />
                <span className="text-xs text-muted-foreground">
                  {detailQuery.data.useCount || 0} استخدام · {detailQuery.data.totalMinutes || 55} دقيقة
                </span>
              </div>
              {getPhases(detailQuery.data).length > 0 ? (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">مراحل تسيير الحصة</p>
                    <div className="space-y-2">
                      {getPhases(detailQuery.data).map((phase, idx) => (
                        <div key={idx} className="rounded-lg border bg-muted/40 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{phase.stage}</span>
                            <Badge variant="outline" className="text-xs">{phase.minutes} د</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">دور الأستاذ:</span> {phase.teacherRole}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">دور التلاميذ:</span> {phase.studentRole}
                          </p>
                          {phase.tips ? (
                            <p className="text-xs text-primary/80 mt-1 flex gap-1">
                              <Sparkles className="h-3.5 w-3.5 shrink-0 mt-px" />
                              {phase.tips}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
              {getTips(detailQuery.data).length > 0 ? (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">نصائح عامة</p>
                    <ul className="list-disc space-y-1 pr-5 text-sm text-muted-foreground">
                      {getTips(detailQuery.data).map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}
              {detailQuery.data.materials ? (
                <>
                  <Separator />
                  <p className="text-sm"><span className="font-semibold">الوسائل المقترحة:</span> {detailQuery.data.materials}</p>
                </>
              ) : null}
              {detailQuery.data.experienceNotes ? (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">ملاحظات التجربة الميدانية</p>
                    {detailQuery.data.experienceNotes.split("\n---\n").map((note, i) => (
                      <p key={i} className="text-xs text-muted-foreground whitespace-pre-wrap rounded-lg bg-muted/50 p-2">
                        {note}
                      </p>
                    ))}
                  </div>
                </>
              ) : null}
              <DialogFooter className="gap-2">
                <Button
                  onClick={() => {
                    markUsedMutation.mutate({ id: detailQuery.data!.id });
                  }}
                  disabled={markUsedMutation.isPending}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  وظّفها في حصة جديدة
                </Button>
              </DialogFooter>
            </>
          ) : (
            <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p>
          )}
        </DialogContent>
      </Dialog>

      {/* حوار التقييم والملاحظات */}
      <RatingDialog
        open={reviewDialogId !== null}
        strategyName={detailQuery.data?.name || undefined}
        onOpenChange={open => { if (!open) setReviewDialogId(null); }}
        onSubmit={({ rating, notes }) =>
          reviewMutation.mutate({ id: reviewDialogId ?? 0, rating, experienceNotes: notes })
        }
        submitting={reviewMutation.isPending}
      />

      {/* حوار الإضافة اليدوية */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة استراتيجية من تجاربك</DialogTitle>
            <DialogDescription>
              سجّل استراتيجية جرّبتها خارج المنصة أو حسّنتها لتبقى مرجعًا دائريًا.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم الاستراتيجية</label>
              <Input
                value={custom.name}
                onChange={e => setCustom(c => ({ ...c, name: e.target.value }))}
                placeholder="مثال: البطاقات المقلوبة في مجموعات رباعية"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">نوع الوضعية</label>
                <Select value={custom.situationType} onValueChange={v => setCustom(c => ({ ...c, situationType: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="learning">وضعية تعلّمية</SelectItem>
                    <SelectItem value="integrative">وضعية إدماجية</SelectItem>
                    <SelectItem value="assessment">وضعية تقويمية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">المادة</label>
                <Select value={custom.subject || "none"} onValueChange={v => setCustom(c => ({ ...c, subject: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— اختر —</SelectItem>
                    {SUBJECT_OPTIONS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">لماذا تنجح؟ (التبرير التربوي)</label>
              <Textarea
                value={custom.rationale}
                onChange={e => setCustom(c => ({ ...c, rationale: e.target.value }))}
                placeholder="متى ولماذا أعطت نتيجة جيدة؟"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">الوسائل المطلوبة</label>
              <Input
                value={custom.materials}
                onChange={e => setCustom(c => ({ ...c, materials: e.target.value }))}
                placeholder="بطاقات، سبورة، وثائق..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={customMutation.isPending || !custom.name.trim() || !custom.subject}
              onClick={() => customMutation.mutate(custom as any)}
            >
              {customMutation.isPending ? "جارِ الحفظ..." : "احفظ في الدفتر"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف من دفتر التجارب؟</AlertDialogTitle>
            <AlertDialogDescription>
              ستُحذف «{deleteTarget?.name}» نهائيًا من دفترك. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate({ id: deleteTarget!.id })}
            >
              احذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RatingDialog({
  open,
  onOpenChange,
  strategyName,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  strategyName?: string;
  onSubmit: (payload: { rating?: number; notes?: string }) => void;
  submitting: boolean;
}) {
  const [rating, setRating] = useState<number>(4);
  const [notes, setNotes] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) {
          setNotes("");
          setRating(4);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>قيّم هذه التجربة</DialogTitle>
          <DialogDescription>
            {strategyName ? `استراتيجية «${strategyName}»` : "شارك تقييمك وملاحظاتك بعد الحصة"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <StarRating value={rating} onChange={setRating} />
            <span className="text-xs text-muted-foreground">تقييمك من 5</span>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">ماذا لاحظت في الحصة؟</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="مثال: التلاميذ تفاعلوا أكثر في مرحلة المراحل الجماعية، لكن المرحلة الثالثة استغرقت وقتًا أطول من المتوقع..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={submitting || !notes.trim()}
            onClick={() => onSubmit({ rating, notes: notes.trim() })}
          >
            {submitting ? "جارِ الحفظ..." : "احفظ التقييم"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
