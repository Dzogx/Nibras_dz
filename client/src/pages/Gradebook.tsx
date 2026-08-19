import { useMemo, useState } from "react";
import { toast } from "sonner";
// ملاحظة: useAuth تستورد داخل usePreferredClass عبر @/_core/hooks/useAuth
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Trash2,
  CalendarClock,
} from "lucide-react";

/**
 * دفتر التنقيط — وثيقة الأستاذ اليومية وفق الوثيقة الوزارية 2025-2026.
 * لكل تلميذ: الانضباط والمواظبة (/10) + إنجاز الأنشطة (/10) = التقويم المستمر (/20)،
 * ثم الفرض الكتابي (/20) والتقويم التحصيلي — الاختبار الفصلي (/20). لا تحسب المنصة المعدلات الفصلية
 * والسنوية — الرقمنة الرسمية هي المسؤولة عنها.
 */

type RosterRow = { fullName: string; matricule?: string | null };

type RowDraft = {
  studentName: string;
  studentMatricule: string | null;
  attendance: string;
  activity: string;
  continuous: string;
  quiz: string;
  assessment: string;
  notes: string;
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function parseNum(v: string): number | null {
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t.replace(",", "."));
  return Number.isNaN(n) ? null : clamp(n, 0, 20);
}

export default function Gradebook() {
  const utils = trpc.useUtils();
  const [, classes, setClassId] = usePreferredClass();
  const [term, setTerm] = useState("3");
  const [subject, setSubject] = useState<string>("");
  const list = trpc.gradebook.list.useQuery(
    { classId: classes?.id, term: Number(term), subject: subject || undefined },
    { enabled: !!classes && !!subject },
  );

  // رoster دفتر التنقيط: قائمة تلاميذ القسم المستقلة عن المادة،
  // تُصبّ تلقائيًا عند استيراد ملف الرقمنة وتُعرض كصفوف جاهزة للتنقيط.
  const roster = trpc.studentResults.roster.useQuery(
    { classId: classes?.id ?? 0 },
    { enabled: !!classes, staleTime: 5 * 60 * 1000 },
  );

  const rows = useMemo<RowDraft[]>(() => {
    if (!Array.isArray(list.data)) return [];
    const rosterRows = Array.isArray(roster.data)
      ? (roster.data as RosterRow[]).map((s) => ({
          studentName: s.fullName,
          studentMatricule: s.matricule ?? null,
          attendance: "", activity: "", continuous: "", quiz: "", assessment: "", notes: "",
        }))
      : [];
    // عند عدم وجود إدخالات: أدرج كل تلاميذ القسم من رoster دفتر التنقيط (المصبوب من استيراد الرقمنة) كصفوف فارغة جاهزة للإدخال.
    if (list.data.length === 0) return rosterRows;
    // دمج الإدخالات مع roster: يبدأ بأسماء الروفستر المحفوظة (بترتيب roster) ويُدمج عليها إدخالات إضافية.
    const byName = new Map<string, RowDraft>(
      rosterRows.map((r, idx) => [r.studentName, { ...r, _order: idx } as RowDraft & { _order?: number } ]),
    );
    for (const entry of list.data as Row[]) {
      const draft: RowDraft = {
        studentName: entry.studentName,
        studentMatricule: entry.studentMatricule ?? null,
        attendance: entry.attendanceScore != null ? String(entry.attendanceScore) : "",
        activity: entry.activityScore != null ? String(entry.activityScore) : "",
        continuous: entry.continuousScore != null ? String(entry.continuousScore) : "",
        quiz: entry.quizScore != null ? String(entry.quizScore) : "",
        assessment: entry.assessmentScore != null ? String(entry.assessmentScore) : "",
        notes: entry.notes ?? "",
      };
      if (byName.has(entry.studentName)) {
        const existing = byName.get(entry.studentName)! as RowDraft & { _order?: number };
        // تحديث صف roster الموجود بإدخالاته المحفوظة مع الحفاظ على ترتيبه الأصلي.
        byName.set(entry.studentName, {
          ...existing,
          attendance: draft.attendance,
          activity: draft.activity,
          continuous: draft.continuous,
          quiz: draft.quiz,
          assessment: draft.assessment,
          notes: draft.notes,
        });
      } else {
        // إدخالات لأسماء خارج roster: تُضاف في النهاية بترتيب وصولها.
        byName.set(entry.studentName, { ...draft, _order: rosterRows.length + byName.size } as RowDraft & { _order?: number });
      }
    }
    // ترتيب ثابت حسب roster أولًا ثم الإضافات — حتى لا ينزاح موقع الصف عند الإدخال.
    return Array.from(byName.values()).sort(
      (a, b) => (a as RowDraft & { _order?: number })._order! - (b as RowDraft & { _order?: number })._order!,
    );
  }, [list.data, roster.data]);

  // خريطة تعديلات مؤقتة بمفتاح مستقر (ماتريكول أو اسم) بدلًا من فهرس صفّي —
  // حتى لا ينزاح موقع الصف بين الإدخال والحفظ مهما تغيّر ترتيب المصدر.
  const [drafts, setDrafts] = useState<Map<string, Partial<RowDraft>>>(new Map());
  const [dirty, setDirty] = useState(false);

  const rowKey = (row: RowDraft): string => (row.studentMatricule && row.studentMatricule.trim() !== "") ? row.studentMatricule : row.studentName;

  const getDraft = (row: RowDraft): RowDraft => {
    if (!dirty) return row;
    const patch = drafts.get(rowKey(row)) ?? {};
    return { ...row, ...patch } as RowDraft;
  };

  const resetDrafts = () => {
    setDrafts(new Map());
    setDirty(false);
  };

  const startEditing = (source: string[]) => {
    // نمسح أي تعديلات سابقة قبل نمط تحرير جديد حتى لا تختلط القيم.
    setDrafts(new Map());
    setDirty(true);
  };

  const saveEntries = trpc.gradebook.saveEntries.useMutation({
    onSuccess: () => {
      utils.gradebook.list.invalidate({ classId: classes?.id, term: Number(term), subject: subject || undefined });
      setDirty(false);
      toast.success("حُفظ دفتر التنقيط بنجاح");
    },
    onError: (err) => toast.error(err.message),
  });

  const saveGroup = () => {
    if (!classes) return;
    // نبني الحمولات من ترتيب rows الثابت ونقرأ القيم المعدّلة من خريطة الدرافت —
    // فلا تنزاح قيمة تلميذ إلى اسم تلميذ آخر مهما تغيّر ترتيب المصدر.
    const entries = rows
      .map((row) => {
        const d = getDraft(row);
        const attendance = d.attendance.trim() === "" ? null : clamp(Number(d.attendance.replace(",", ".")), 0, 10);
        const activity = d.activity.trim() === "" ? null : clamp(Number(d.activity.replace(",", ".")), 0, 10);
        const continuous = d.continuous.trim() === "" ? null : clamp(Number(d.continuous.replace(",", ".")), 0, 20);
        return {
          studentName: d.studentName,
          studentMatricule: d.studentMatricule,
          attendanceScore: attendance,
          activityScore: activity,
          continuousScore: continuous,
          quizScore: parseNum(d.quiz),
          assessmentScore: parseNum(d.assessment),
          notes: d.notes.trim() === "" ? null : d.notes.trim(),
        };
      })
      .filter(
        (e) =>
          e.attendanceScore != null ||
          e.activityScore != null ||
          e.quizScore != null ||
          e.assessmentScore != null ||
          e.notes != null,
      );
    if (entries.length === 0) {
      toast.warning("لا توجد أي نقطة مكتوبة للحفظ.");
      return;
    }
    saveEntries.mutate({ classId: classes.id, term: Number(term), subject, entries });
  };

  const deleteGroup = trpc.gradebook.deleteGroup.useMutation({
    onSuccess: () => {
      utils.gradebook.list.invalidate({ classId: classes?.id, term: Number(term), subject: subject || undefined });
      toast.success("حُذف دفتر التنقيط لهذا القسم والمادة والفصل.");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateCell = (index: number, field: keyof RowDraft, value: string) => {
    const target = rows[index];
    if (!target) return;
    const key = rowKey(target);
    setDrafts((prev) => {
      const next = new Map(prev);
      const prevPatch = next.get(key) ?? {};
      next.set(key, { ...prevPatch, [field]: value });
      return next;
    });
    setDirty(true);
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8" dir="rtl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">دفتر التنقيط</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            علامة التقويم المستمر (/20 = انضباط ومواظبة /10 + إنجاز الأنشطة /10)، الفرض الكتابي /20، والتقويم التحصيلي (الاختبار الفصلي) /20 — المعدلات الفصلية والسنوية تُحسب في الرقمنة.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ClassSelect value={classes?.id ?? null} onChange={setClassId} />
        <Select value={term} onValueChange={setTerm}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="الفصل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">الفصل الأول</SelectItem>
            <SelectItem value="2">الفصل الثاني</SelectItem>
            <SelectItem value="3">الفصل الثالث</SelectItem>
          </SelectContent>
        </Select>
        <SubjectSelect value={subject} onChange={setSubject} />
        <Button
          variant="outline"
          disabled={!classes || !subject}
          onClick={() => startEditing(["attendance", "activity", "continuous", "quiz", "assessment"])}
        >
          <FileSpreadsheet className="ml-2 size-4" />
          إدخال النقاط
        </Button>
        <Button
          variant="outline"
          disabled={!classes || !subject}
          onClick={() => startEditing(["notes"])}
        >
          التقييمات النوعية
        </Button>
        <MonthlySummaryButton classId={classes?.id ?? null} subject={subject} term={Number(term)} className={classes?.name ?? ""} />
        <PrintButton enabled={!!classes && !!subject && Array.isArray(list.data)} entries={list.data ?? []} className={classes?.name ?? ""} subject={subject} term={Number(term)} />
        <Button
          variant="destructive"
          size="sm"
          disabled={!classes || !subject || !Array.isArray(list.data) || list.data.length === 0}
          onClick={() => {
            if (!classes) return;
            deleteGroup.mutate({ classId: classes.id, subject, term: Number(term) });
          }}
        >
          <Trash2 className="ml-2 size-4" />
          حذف الدفتر
        </Button>
      </div>

      {!classes ? (
        <p className="text-sm text-muted-foreground">أنشئ قسمًا أولًا من صفحة «الأقسام» ليظهر دفتر التنقيط.</p>
      ) : !subject ? (
        <p className="text-sm text-muted-foreground">اختر المادة لعرض دفتر التنقيط.</p>
      ) : list.isLoading ? (
        <div className="flex items-center justify-center py-16"><Spinner className="size-6" /></div>
      ) : dirty || Array.isArray(list.data) ? (
        <EntriesTable rows={rows} drafts={drafts} getDraft={getDraft} updateCell={updateCell} saving={saveEntries.isPending} dirty={dirty} saveGroup={saveGroup} />
      ) : (
        <EmptyState className={classes.name} subject={subject} />
      )}
    </div>
  );
}

function usePreferredClass(): [number, ClassItem | null, (id: number) => void] {
  // نفس نمط تفضيل القسم المستخدم في صفحات نبراس (من localStorage) مع بطلان استعلام تلقائي.
  const utils = trpc.useUtils();
  const [classId, setClassIdState] = useState<number | null>(() => {
    try {
      const v = localStorage.getItem("preferredClassId");
      return v ? Number(v) : null;
    } catch {
      return null;
    }
  });
  const classesQuery = trpc.classes.list.useQuery();
  const setClassId = (id: number) => {
    try {
      localStorage.setItem("preferredClassId", String(id));
    } catch {
      /* يتعذر الحفظ محليًا */
    }
    setClassIdState(id);
    void utils.classes.list.invalidate();
  };
  const classes = useMemo<ClassItem | null>(
    () =>
      (classesQuery.data ?? []).find((item: ClassItem) => item.id === classId) ?? (classesQuery.data ?? [])[0] ?? null,
    [classesQuery.data, classId],
  );
  return [classId ?? 0, classes, setClassId];
}

type ClassItem = { id: number; name: string; gradeLevel?: string | null; studentCount?: number | null };

function ClassSelect({ value, onChange }: { value: number | null; onChange: (id: number) => void }) {
  const { data: classes } = trpc.classes.list.useQuery();
  return (
    <Select value={value != null ? String(value) : undefined} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="القسم" />
      </SelectTrigger>
      <SelectContent>
        {(classes ?? []).map((item) => (
          <SelectItem key={item.id} value={String(item.id)}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SubjectSelect({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="المادة" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="التاريخ">التاريخ</SelectItem>
        <SelectItem value="الجغرافيا">الجغرافيا</SelectItem>
        <SelectItem value="التربية المدنية">التربية المدنية</SelectItem>
      </SelectContent>
    </Select>
  );
}

type Row = {
  id: number;
  studentName: string;
  studentMatricule?: string | null;
  attendanceScore?: number | null;
  activityScore?: number | null;
  continuousScore?: number | null;
  quizScore?: number | null;
  assessmentScore?: number | null;
  notes?: string | null;
};

function EntriesTable({
  rows,
  drafts: _drafts,
  getDraft,
  updateCell,
  saving,
  dirty,
  saveGroup,
}: {
  rows: RowDraft[];
  drafts: Map<string, Partial<RowDraft>>;
  getDraft: (row: RowDraft) => RowDraft;
  updateCell: (index: number, field: keyof RowDraft, value: string) => void;
  saving: boolean;
  dirty: boolean;
  saveGroup: () => void;
}) {
  // عرض دائم من ترتيب rows الثابت، مع قراءة قيم التعديل من خريطة مفاتيح مستقرة —
  // index عرضي = index مصدر دائمًا.
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap text-right">الاسم واللقب</TableHead>
            <TableHead className="w-24 text-center">الانضباط والمواظبة /10</TableHead>
            <TableHead className="w-24 text-center">إنجاز الأنشطة /10</TableHead>
            <TableHead className="w-24 text-center">التقويم المستمر /20</TableHead>
            <TableHead className="w-20 text-center">الفرض /20</TableHead>
            <TableHead className="w-20 text-center">التقويم التحصيلي /20</TableHead>
            <TableHead className="w-48">ملاحظات نوعية</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const display = getDraft(row);
            return (
              <TableRow key={`${row.studentName}-${row.studentMatricule ?? ""}-${index}`}>
                <TableCell className="whitespace-nowrap font-medium">{row.studentName}</TableCell>
                <TableCell>
                  <NumberInput value={display.attendance} onChange={(v) => updateCell(index, "attendance", v)} max={10} />
                </TableCell>
                <TableCell>
                  <NumberInput value={display.activity} onChange={(v) => updateCell(index, "activity", v)} max={10} />
                </TableCell>
                <TableCell>
                  <NumberInput value={display.continuous} onChange={(v) => updateCell(index, "continuous", v)} max={20} highlight />
                </TableCell>
                <TableCell>
                  <NumberInput value={display.quiz} onChange={(v) => updateCell(index, "quiz", v)} max={20} />
                </TableCell>
                <TableCell>
                  <NumberInput value={display.assessment} onChange={(v) => updateCell(index, "assessment", v)} max={20} />
                </TableCell>
                <TableCell>
                  <input
                    className="w-full bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-muted-foreground/60"
                    placeholder="ملاحظة لدفتر المراسلة"
                    value={display.notes}
                    onChange={(e) => updateCell(index, "notes", e.target.value)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {dirty && (
        <div className="flex items-center justify-between gap-3 border-t bg-muted/40 p-3">
          <span className="text-sm text-muted-foreground">
            {saving ? <Spinner className="ml-2 inline size-4" /> : "عدّل أي خانة ثم احفظ الدفتر."}
          </span>
          <Button onClick={saveGroup} disabled={saving} size="sm">
            <RefreshCw className={saving ? "ml-2 size-4 animate-spin" : "ml-2 size-4"} />
            حفظ الدفتر
          </Button>
        </div>
      )}
    </div>
  );
}

function NumberInput({ value, onChange, max, highlight }: { value: string; onChange: (v: string) => void; max: number; highlight?: boolean }) {
  const invalid = value.trim() !== "" && (Number.isNaN(Number(value.replace(",", "."))) || Number(value.replace(",", ".")) > max || Number(value.replace(",", ".")) < 0);
  return (
    <Input
      inputMode="decimal"
      className={`h-8 w-full text-center ${highlight ? "bg-primary/10 font-semibold text-primary" : ""} ${invalid ? "border-destructive text-destructive" : ""}`}
      value={value}
      placeholder="— /"
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => {
        const n = Number((e.target.value || "").replace(",", "."));
        if (!Number.isNaN(n)) onChange(String(Math.max(0, Math.min(max, n))));
      }}
    />
  );
}

function EmptyState({ className, subject }: { className: string; subject: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-card p-10 text-center">
      <FileSpreadsheet className="mx-auto mb-3 size-8 text-muted-foreground/60" />
      <p className="mb-1 font-medium">{subject} — {className}</p>
      <p className="text-sm text-muted-foreground">لا توجد بعد أي نقطة مسجلة لهذا الفصل. اضغط «إدخال النقاط» لبدء الدفتر.</p>
    </div>
  );
}

const MONTH_KEYS = [
  { key: "10", label: "أكتوبر" },
  { key: "11", label: "نوفمبر" },
  { key: "12", label: "ديسمبر" },
  { key: "01", label: "يناير" },
  { key: "02", label: "فبراير" },
  { key: "03", label: "مارس" },
  { key: "04", label: "أفريل" },
  { key: "05", label: "ماي" },
  { key: "06", label: "جوان" },
];

/** زر الاستيفائي الشهري: يعرض ملخص تقويم الشهر (الانضباط، الأنشطة، الفرض) للطباعة. */
function MonthlySummaryButton({
  classId,
  subject,
  term,
  className,
}: {
  classId: number | null;
  subject: string;
  term: number;
  className: string;
}) {
  const [printOpen, setPrintOpen] = useState(false);
  const today = new Date();
  const academicYearStart = today.getMonth() >= 9; // الموسم يبدأ سبتمبر/أكتوبر
  const defaultMonthKey = `${today.getFullYear() - (academicYearStart && today.getMonth() < 9 ? 1 : 0)}-${today.getMonth() + 1 === 0 ? "10" : String(today.getMonth() + 1).padStart(2, "0")}`;
  const [monthKey, setMonthKey] = useState<string>(() => {
    const m = today.getMonth() + 1;
    const y = today.getMonth() >= 9 ? today.getFullYear() : today.getFullYear() - 1;
    return `${y}-${String(m).padStart(2, "0")}`;
  });
  const enabled = classId != null;
  const { data: summary, isLoading } = trpc.gradebook.monthlySummary.useQuery(
    { classId: classId ?? 0, term, subject, monthKey },
    { enabled: enabled && printOpen },
  );
  const yearLabel = monthKey.startsWith("0") || monthKey.split("-")[1] === "10" || monthKey.split("-")[1] === "11" || monthKey.split("-")[1] === "12"
    ? `${Number(monthKey.split("-")[0])}/${Number(monthKey.split("-")[0]) + 1}`
    : `${Number(monthKey.split("-")[0]) - 1}/${monthKey.split("-")[0]}`;
  const buildPrintHtml = (): string => {
    const rows = (summary ?? []).map((row, i) => `
<tr><td>${i + 1}</td><td class="name">${row.studentName}</td>
<td>${row.attendanceTotal != null ? row.attendanceTotal : ""}</td><td>${row.activityTotal != null ? row.activityTotal : ""}</td>
<td>${row.quizTotal != null ? row.quizTotal : ""}</td><td>${row.continuousTotal != null ? row.continuousTotal : ""}</td><td>${row.notes ?? ""}</td></tr>`).join("");
    return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>الاستيفائي الشهري — ${className} — ${subject}</title>
<style>
@page { size: A4 portrait; margin: 20mm 16mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: "Amiri", serif; color: #111; background: #fff; }
.doc { padding: 6mm 0; }
.center { text-align: center; }
.small { font-size: 10.5pt; }
.hdr { border-bottom: 2px solid #111; padding-bottom: 3mm; margin-bottom: 4mm; }
.hdr tr td { vertical-align: top; width: 33%; }
table.sheet { width: 100%; border-collapse: collapse; margin-top: 4mm; }
table.sheet th, table.sheet td { border: 1px solid #222; padding: 2.2mm 2mm; font-size: 10.5pt; text-align: center; }
table.sheet th { background: #f0f0f0; }
td.name { text-align: right; }
.sig { margin-top: 14mm; display: flex; justify-content: space-between; }
</style></head><body><div class="doc">
<div class="hdr"><table class="small"><tr>
<td><div>الجمهورية الجزائرية الديمقراطية الشعبية</div><div>وزارة التربية الوطنية</div></td>
<td class="center"><div class="small" style="font-weight:bold;">الاستيفائي الشهري للتقويم المستمر</div><div>${className} — ${subject}</div><div>${MONTH_KEYS.find((m) => m.key === monthKey.split("-")[1])?.label} ${yearLabel}</div></td>
<td class="center"><div>عدد التلاميذ: ${(summary ?? []).length}</div></td>
</tr></table></div>
<table class="sheet"><thead><tr>
<th>الترتيب</th><th>الاسم واللقب</th><th>الانضباط والمواظبة<br>(مجموع الشهر)</th><th>إنجاز الأنشطة<br>(مجموع الشهر)</th><th>الفروض<br>(مجموع الشهر)</th><th>التقويم المستمر<br>/20</th><th>ملاحظات</th>
</tr></thead><tbody>${rows}
</tbody></table>
<div class="sig"><div class="small">إمضاء الأستاذ(ة)</div><div class="small">إمضاء مدير(ة) المؤسسة</div></div>
</div></body></html>`;
  };
  const printFromFrame = (iframe: HTMLIFrameElement | null) => {
    const win = iframe?.contentWindow;
    if (!win) return;
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        /* ignore */
      }
    }, 600);
  };
  return (
    <>
      <Button variant="outline" disabled={!enabled} onClick={() => setPrintOpen(true)}>
        <CalendarClock className="ml-2 size-4" />
        الاستيفائي الشهري
      </Button>
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden p-0 flex flex-col">
          <DialogHeader className="px-5 pt-4 pb-2">
            <DialogTitle className="text-right">{`الاستيفائي الشهري — ${className} · ${subject}`}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 px-5 pb-4 flex flex-col gap-3 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">اختر الشهر:</span>
              <Select value={monthKey} onValueChange={setMonthKey}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTH_KEYS.map((m) => (
                    <SelectItem key={m.key} value={monthKey.split("-")[0] + "-" + m.key}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoading && <Spinner className="size-4" />}
            </div>
            {!isLoading && summary && summary.length > 0 ? (
              <>
                <div className="text-xs text-muted-foreground">
                  يجمع هذا الملخص خانات الانضباط والأنشطة والفروض المسجلة خلال الشهر، ويعتمد آخر إدخال للتقويم المستمر.
                </div>
                <iframe
                  title="معاينة الاستيفائي الشهري"
                  srcDoc={buildPrintHtml()}
                  className="w-full flex-1 min-h-[50vh] border rounded bg-white"
                  onLoad={(e) => printFromFrame(e.currentTarget)}
                />
                <Button onClick={() => printFromFrame(document.querySelector<HTMLIFrameElement>('iframe[title="معاينة الاستيفائي الشهري"]'))}>
                  <Printer className="ml-2 size-4" />
                  طباعة الآن (Ctrl+P)
                </Button>
              </>
            ) : !isLoading ? (
              <div className="rounded-lg border border-dashed bg-card p-8 text-center">
                <CalendarClock className="mx-auto mb-3 size-8 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">
                  لا توجد نقاط مسجلة لهذا الشهر في دفتر التنقيط. سجّل نقاط التلاميذ أولًا ثم افتح الاستيفائي.
                </p>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PrintButton({ enabled, entries, className, subject, term }: { enabled: boolean; entries: unknown; className: string; subject: string; term: number }) {
  const [printOpen, setPrintOpen] = useState(false);
  const print = () => {
    if (!Array.isArray(entries) || entries.length === 0) {
      toast.warning("لا توجد نقاط لطباعتها بعد.");
      return;
    }
    setPrintOpen(true);
  };
  const rows = (Array.isArray(entries) ? entries : []) as Row[];
  const TERM_LABELS: Record<number, string> = { 1: "الفصل الأول", 2: "الفصل الثاني", 3: "الفصل الثالث" };
  const termLabel = TERM_LABELS[term] ?? `الفصل ${term}`;
  const buildPrintHtml = (): string => `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>دفتر التنقيط — ${className} — ${subject}</title>
<style>
@page { size: A4 landscape; margin: 18mm 14mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: "Amiri", serif; color: #111; background: #fff; }
.doc { padding: 6mm 0; }
.center { text-align: center; }
.small { font-size: 10.5pt; }
.hdr { border-bottom: 2px solid #111; padding-bottom: 3mm; margin-bottom: 4mm; }
.hdr tr td { vertical-align: top; width: 33%; }
table.sheet { width: 100%; border-collapse: collapse; margin-top: 4mm; }
table.sheet th, table.sheet td { border: 1px solid #222; padding: 2.2mm 2mm; font-size: 10.5pt; text-align: center; }
table.sheet th { background: #f0f0f0; }
td.name { text-align: right; }
.sig { margin-top: 12mm; display: flex; justify-content: space-between; }
</style></head><body><div class="doc">
<div class="hdr"><table class="small"><tr>
<td><div>الجمهورية الجزائرية الديمقراطية الشعبية</div><div>وزارة التربية الوطنية</div></td>
<td class="center"><div class="small" style="font-weight:bold;">دفتر التنقيط</div><div>${className} — ${subject}</div><div>${termLabel} — السنة الدراسية</div></td>
<td class="center"><div>عدد التلاميذ: ${rows.length}</div></td>
</tr></table></div>
<table class="sheet"><thead><tr>
<th>الترتيب</th><th>الاسم واللقب</th><th>الانضباط والمواظبة<br>/10</th><th>إنجاز الأنشطة<br>/10</th><th>التقويم المستمر<br>/20</th><th>الفرض الكتابي<br>/20</th><th>التقويم التحصيلي (الاختبار الفصلي)<br>/20</th><th>ملاحظات نوعية</th>
</tr></thead><tbody>
${rows.map((row, i) => `
<tr><td>${i + 1}</td><td class="name">${row.studentName}</td>
<td>${row.attendanceScore ?? ""}</td><td>${row.activityScore ?? ""}</td><td>${row.continuousScore ?? ""}</td>
<td>${row.quizScore ?? ""}</td><td>${row.assessmentScore ?? ""}</td><td>${row.notes ?? ""}</td></tr>
`).join("")}
</tbody></table>
<div class="sig"><div class="small">إمضاء الأستاذ(ة)</div><div class="small">إمضاء مدير(ة) المؤسسة</div></div>
</div></body></html>`;
  const printFromFrame = (iframe: HTMLIFrameElement | null) => {
    const win = iframe?.contentWindow;
    if (!win) return;
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        /* ignore */
      }
    }, 600);
  };
  return (
    <>
      <Button variant="outline" disabled={!enabled} onClick={print}>
        <Printer className="ml-2 size-4" />
        طباعة الدفتر
      </Button>
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden p-0 flex flex-col">
          <DialogHeader className="px-5 pt-4 pb-2">
            <DialogTitle className="text-right">{`معاينة دفتر التنقيط — ${className} · ${subject} · ${termLabel}`}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 px-5 pb-4 flex flex-col gap-3">
            <iframe
              title="دفتر التنقيط للمعاينة"
              srcDoc={buildPrintHtml()}
              className="w-full flex-1 min-h-[50vh] border rounded bg-white"
              onLoad={(e) => printFromFrame(e.currentTarget)}
            />
            <Button onClick={() => printFromFrame(document.querySelector<HTMLIFrameElement>('iframe[title="دفتر التنقيط للمعاينة"]'))}>
              <Printer className="ml-2 size-4" />
              طباعة الآن (Ctrl+P)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
