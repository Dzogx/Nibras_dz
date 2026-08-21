import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { OfficeHeader } from "@/components/OfficeChrome";
import {
  Award,
  Target,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  TrendingUp,
  BookOpenCheck,
  FileText,
  Lightbulb,
  Printer,
  Brain,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";
import { buildActiveLearningCardHtml } from "@/lib/activeLearningCardPrint";

const SUBJECTS = ["التاريخ والجغرافيا", "التاريخ", "الجغرافيا", "التربية المدنية"] as const;
const GRADE_LEVELS = ["السنة الأولى متوسط", "السنة الثانية متوسط", "السنة الثالثة متوسط", "السنة الرابعة متوسط"] as const;

/** ألوان دلالية لإجراء الكفاءة (تنصيب / إنماء / إدماج). */
function actionStyles(action?: string): { label: string; className: string } {
  if (!action) return { label: "", className: "bg-muted text-muted-foreground" };
  if (action.includes("تنصيب")) return { label: action, className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" };
  if (action.includes("إدماج")) return { label: action, className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" };
  return { label: action, className: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200" };
}

/** بناء HTML طباعة مسار الكفاءات A4 محايد (بلا إشارة للمنصة). */
function buildCompetencyPathPrintHtml(opts: {
  gradeLevel: string;
  subject: string;
  globalCompetency: string;
  sections: Array<{
    sectionNumber: number;
    sectionTitle: string;
    termCompetency: string;
    competencyAction?: string | null;
    durationLabel?: string | null;
    durationHours?: number | null;
    completionPct?: number;
    situationDone?: number;
    situationTotal?: number;
  }>;
}): string {
  const now = new Date().toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" });
  const rows = opts.sections
    .sort((a, b) => Number(a.sectionNumber) - Number(b.sectionNumber))
    .map(s => {
      const pct = s.completionPct ?? 0;
      const bar = `<div style="background:#e5e7eb;border-radius:4px;height:8px;width:100%;"><div style="background:${pct >= 80 ? "#16a34a" : pct >= 40 ? "#d97706" : "#6b7280"};height:8px;border-radius:4px;width:${pct}%;"></div></div>`;
      return `<tr>
        <td style="white-space:nowrap">${s.sectionNumber}</td>
        <td>${s.sectionTitle || "—"}</td>
        <td style="font-size:9pt">${s.termCompetency || "—"}</td>
        <td style="white-space:nowrap">${s.competencyAction || "—"}</td>
        <td style="white-space:nowrap">${s.durationLabel || (s.durationHours ? `${s.durationHours} سا` : "—")}</td>
        <td>${bar}<div style="font-size:8pt;text-align:center;margin-top:2px">${pct}% (${s.situationDone ?? 0}/${s.situationTotal ?? 0})</div></td>
      </tr>`;
    }).join("");
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A4 landscape; margin: 12mm 14mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:"Amiri","Noto Naskh Arabic",serif; color:#111827; font-size:10pt; line-height:1.6; }
  .header { text-align:center; border-bottom:2px solid #1f2937; padding-bottom:8px; margin-bottom:12px; }
  .header .line1 { font-size:11pt; font-weight:bold; }
  .header .line2 { font-size:10pt; }
  .meta { display:flex; justify-content:space-between; font-size:9.5pt; margin-bottom:10px; }
  h1 { font-size:13pt; text-align:center; margin:8px 0 6px; }
  .global { border:1px solid #d1d5db; border-radius:6px; padding:8px 12px; margin:8px 0 14px; background:#fffbeb; font-size:10pt; }
  table { width:100%; border-collapse:collapse; font-size:9pt; }
  th { background:#f3f4f6; border:1px solid #9ca3af; padding:5px 8px; text-align:right; }
  td { border:1px solid #d1d5db; padding:5px 8px; vertical-align:middle; text-align:right; }
  .footer { margin-top:18px; display:flex; justify-content:space-between; font-size:9.5pt; }
  .sig { border-top:1px solid #111827; padding-top:4px; margin-top:26px; min-width:30%; }
</style>
</head>
<body>
  <div class="header">
    <div class="line1">الجمهورية الجزائرية الديمقراطية الشعبية</div>
    <div class="line1">وزارة التربية الوطنية</div>
    <div class="line2">مادة: ${opts.subject} — ${opts.gradeLevel}</div>
  </div>
  <div class="meta">
    <div>التاريخ: ${now}</div>
    <div>بطاقة متابعة مسار الكفاءات</div>
  </div>
  <h1>بطاقة متابعة مسار الكفاءات</h1>
  <div class="global"><strong>الكفاءة الشاملة:</strong> ${opts.globalCompetency || "—"}</div>
  <table>
    <thead>
      <tr>
        <th>رقم المقطع</th>
        <th>عنوان المقطع</th>
        <th>الكفاءة الختامية</th>
        <th>الإجراء</th>
        <th>الحجم الساعي</th>
        <th>نسبة البلوغ</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <div class="sig">إمضاء الأستاذ</div>
    <div class="sig">إمضاء مدير المؤسسة</div>
  </div>
</body>
</html>`;
}

/** بناء HTML كشف التقدم الفصلي للكفاءات A4 محايد (بلا إشارة للمنصة). */
function buildTermCompetencyPrintHtml(opts: {
  gradeLevel: string;
  subject: string;
  academicYear: string;
  globalCompetency: string;
  terms: Array<{
    label: string;
    pct: number;
    total: number;
    done: number;
    rows: Array<{
      sectionNumber: number;
      sectionTitle: string;
      termCompetency: string;
      competencyAction: string;
      situationsTotal: number;
      situationsCompleted: number;
      situationsPartial: number;
      situationsPostponed: number;
      situationsCancelled: number;
      masteryPct: number;
    }>;
  }>;
  overallPct: number;
  overallTotal: number;
  overallDone: number;
}): string {
  const now = new Date().toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" });
  const bar = (pct: number) => `<div style="background:#e5e7eb;border-radius:4px;height:8px;width:100%;"><div style="background:${pct >= 80 ? "#16a34a" : pct >= 40 ? "#d97706" : "#6b7280"};height:8px;border-radius:4px;width:${pct}%;"></div></div>`;
  const termHtml = opts.terms.map(t => `{
    <div style="margin-top:14px;border:1px solid #9ca3af;border-radius:6px;overflow:hidden;page-break-inside:avoid;">
      <div style="background:#f3f4f6;padding:6px 10px;font-weight:bold;font-size:10.5pt;border-bottom:1px solid #9ca3af;display:flex;justify-content:space-between;">
        <span>${t.label}</span>
        <span>${t.pct}% (${t.done}/${t.total} وضعية)</span>
      </div>
      ${t.rows.length === 0
        ? `<div style="padding:8px 10px;font-size:9pt;color:#6b7280">لا توجد مقاطع لهذا الفصل</div>`
        : `<table style="width:100%;border-collapse:collapse;font-size:9pt;margin:0;">
        <thead><tr>
          <th style="background:#f9fafb;border-bottom:1px solid #d1d5db;padding:4px 6px;text-align:right;width:5%">رقم</th>
          <th style="background:#f9fafb;border-bottom:1px solid #d1d5db;padding:4px 6px;text-align:right">المقطع</th>
          <th style="background:#f9fafb;border-bottom:1px solid #d1d5db;padding:4px 6px;text-align:right">الكفاءة الختامية</th>
          <th style="background:#f9fafb;border-bottom:1px solid #d1d5db;padding:4px 6px;text-align:right;width:7%">الإجراء</th>
          <th style="background:#f9fafb;border-bottom:1px solid #d1d5db;padding:4px 6px;text-align:right;width:13%">الوضعيات</th>
          <th style="background:#f9fafb;border-bottom:1px solid #d1d5db;padding:4px 6px;text-align:right;width:16%">نسبة البلوغ</th>
        </tr></thead>
        <tbody>${t.rows.map(r => `<tr>
          <td style="border-bottom:1px solid #e5e7eb;padding:5px 6px;text-align:center">${r.sectionNumber}</td>
          <td style="border-bottom:1px solid #e5e7eb;padding:5px 6px">${r.sectionTitle}</td>
          <td style="border-bottom:1px solid #e5e7eb;padding:5px 6px;font-size:8.5pt">${r.termCompetency}</td>
          <td style="border-bottom:1px solid #e5e7eb;padding:5px 6px;text-align:center">${r.competencyAction}</td>
          <td style="border-bottom:1px solid #e5e7eb;padding:5px 6px;text-align:center;font-size:8.5pt">${r.situationsCompleted} منجز · ${r.situationsPartial} جزئي · ${r.situationsPostponed} مؤجل · ${r.situationsCancelled} ملغى</td>
          <td style="border-bottom:1px solid #e5e7eb;padding:5px 6px">${bar(r.masteryPct)}<div style="font-size:8pt;text-align:center;margin-top:2px">${r.masteryPct}%</div></td>
        </tr>`).join("")}</tbody>
      </table>`}
    </div>
  }`.replaceAll("{\n", "<div").replaceAll("\n}", "</div>")).join("");
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 14mm 15mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:"Amiri","Noto Naskh Arabic",serif; color:#111827; font-size:10pt; line-height:1.65; }
  .header { text-align:center; border-bottom:2px solid #1f2937; padding-bottom:8px; margin-bottom:12px; }
  .header .line1 { font-size:11pt; font-weight:bold; }
  .header .line2 { font-size:10pt; }
  .meta { display:flex; justify-content:space-between; font-size:9.5pt; margin-bottom:10px; }
  h1 { font-size:13pt; text-align:center; margin:8px 0 6px; }
  .global { border:1px solid #d1d5db; border-radius:6px; padding:8px 12px; margin:8px 0 6px; background:#fffbeb; font-size:10pt; }
  .overall { text-align:center; font-size:11pt; margin:10px 0; }
  .overall b { font-size:14pt; }
  .footer { margin-top:18px; display:flex; justify-content:space-between; font-size:9.5pt; }
  .sig { border-top:1px solid #111827; padding-top:4px; margin-top:26px; min-width:30%; }
</style>
</head>
<body>
  <div class="header">
    <div class="line1">الجمهورية الجزائرية الديمقراطية الشعبية</div>
    <div class="line1">وزارة التربية الوطنية</div>
    <div class="line2">مادة: ${opts.subject} — ${opts.gradeLevel}</div>
  </div>
  <div class="meta">
    <div>التاريخ: ${now}</div>
    <div>السنة الدراسية: ${opts.academicYear}</div>
  </div>
  <h1>كشف التقدم الفصلي نحو الكفاءة الشاملة</h1>
  <div class="global"><strong>الكفاءة الشاملة:</strong> ${opts.globalCompetency || "—"}</div>
  <div class="overall">نسبة البلوغ الإجمالية في الموسم: <b>${opts.overallPct}%</b> (${opts.overallDone}/${opts.overallTotal} وضعية)</div>
  ${termHtml}
  <div class="footer">
    <div class="sig">إمضاء الأستاذ</div>
    <div class="sig">إمضاء مدير المؤسسة</div>
  </div>
</body>
</html>`;
}

/** طباعة HTML في iframe مخفي. */
function printHtml(html: string) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-10000px;left:-10000px;width:0;height:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    try { iframe.contentWindow!.print(); } catch { /* blocked */ }
    setTimeout(() => document.body.removeChild(iframe), 1500);
  }, 400);
}

// ─── مكوّن بطاقة استراتيجية التسيير لمقطع الكفاءة ────────────────────────
interface SectionStrategyDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subject: string;
  gradeLevel: string;
  sectionNumber: number;
  sectionTitle: string;
}
function SectionStrategyDialog({ open, onOpenChange, subject, gradeLevel, sectionNumber, sectionTitle }: SectionStrategyDialogProps) {
  const [aiMode, setAiMode] = useState(false);
  const strategyQuery = trpc.competencyModel.sectionStrategy.useQuery(
    { subject, gradeLevel, sectionNumber, mode: aiMode ? "ai" : "static" },
    { enabled: open },
  );
  const data = strategyQuery.data;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="size-5 text-amber-500" />
            استراتيجية التسيير — المقطع {sectionNumber}: {sectionTitle}
          </DialogTitle>
        </DialogHeader>
        {strategyQuery.isLoading && (
          <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            {aiMode ? "جارٍ تصميم الاستراتيجية بالذكاء الاصطناعي من سياق الكفاءات..." : "جارٍ اقتراح الاستراتيجية..."}
          </div>
        )}
        {strategyQuery.error && (
          <p className="text-sm text-destructive py-4 text-center">{strategyQuery.error.message}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="size-4" />
            <span>المصدر: {strategyQuery.data?.source === "ai" ? "الذكاء الاصطناعي (توليد مخصص من سياق الكفاءات)" : "مصفوفة التعلم النشط الثابتة"}</span>
          </div>
          <Button
            variant={aiMode ? "default" : "outline"}
            size="sm"
            className={aiMode ? "bg-amber-600 hover:bg-amber-700" : ""}
            disabled={strategyQuery.isLoading}
            onClick={() => setAiMode(m => !m)}
          >
            {aiMode ? "الاستراتيجية المخصصة (AI)" : "ولّد استراتيجية مخصصة بالذكاء الاصطناعي"}
            <Sparkles className="size-3.5 ml-1" />
          </Button>
        </div>
        {data?.note && (
          <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">{data.note}</p>
        )}
        {data && (
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 text-sm">
              <p className="font-bold text-amber-900 dark:text-amber-200 mb-1">الوضعية: {data.situation.title}</p>
              <p><strong>الاستراتيجية المقترحة:</strong> {data.strategy.name}</p>
              <p className="text-muted-foreground mt-1">{data.strategy.rationale}</p>
            </div>
            <div>
              <p className="text-sm font-bold mb-2">مراحل التسيير الزمني</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border p-2 text-right">المرحلة</th>
                      <th className="border p-2 text-right">المدة</th>
                      <th className="border p-2 text-right">دور الأستاذ</th>
                      <th className="border p-2 text-right">دور التلميذ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.strategy.phases.map((p, i) => (
                      <tr key={i} className="even:bg-muted/30">
                        <td className="border p-2">{p.stage}</td>
                        <td className="border p-2 whitespace-nowrap">{p.minutes} د</td>
                        <td className="border p-2">{p.teacherRole}</td>
                        <td className="border p-2">{p.studentRole}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {data.strategy.generalTips.length > 0 && (
              <div>
                <p className="text-sm font-bold mb-1">توصيات إضافية</p>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  {data.strategy.generalTips.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
            <div className="flex justify-start pt-1">
              <Button variant="outline" size="sm" onClick={() => {
                const { buildStrategyPrintHtmlLocal } = {
                  buildStrategyPrintHtmlLocal: () => {
                    const now = new Date().toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" });
                    return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><style>@page{size:A4 portrait;margin:15mm 14mm;}*{margin:0;padding:0;box-sizing:border-box;}body{font-family:"Amiri","Noto Naskh Arabic",serif;color:#111827;font-size:11pt;line-height:1.7;}.header{text-align:center;border-bottom:2px solid #1f2937;padding-bottom:8px;margin-bottom:14px;}.header .line1{font-size:10.5pt;font-weight:bold;}.meta{display:flex;justify-content:space-between;font-size:10pt;margin-bottom:10px;}h1{font-size:13pt;text-align:center;margin:10px 0 6px;}h2{font-size:11.5pt;margin:12px 0 6px;border-right:3px solid #d97706;padding-right:8px;}.card{border:1px solid #d1d5db;border-radius:6px;padding:10px 12px;margin:6px 0 12px;background:#fffbeb;}table{width:100%;border-collapse:collapse;font-size:10pt;margin:8px 0 12px;}th{background:#f3f4f6;border:1px solid #9ca3af;padding:5px 8px;text-align:right;}td{border:1px solid #d1d5db;padding:5px 8px;vertical-align:top;text-align:right;}.footer{margin-top:18px;display:flex;justify-content:space-between;font-size:10pt;}.sig{border-top:1px solid #111827;padding-top:4px;margin-top:26px;}</style></head><body><div class="header"><div class="line1">الجمهورية الجزائرية الديمقراطية الشعبية</div><div class="line1">وزارة التربية الوطنية</div><div class="line1">مادة: ${subject} — ${gradeLevel}</div></div><div class="meta"><div>التاريخ: ${now}</div><div>الوضعية: ${data!.situation.title}</div></div><h1>بطاقة استراتيجية تسيير الحصة</h1><div class="card"><strong>${data!.strategy.name}</strong> (${data!.strategy.totalMinutes} دقيقة)<div style="margin-top:6px;">${data!.strategy.rationale}</div></div><h2>مراحل التسيير الزمني</h2><table><thead><tr><th>المرحلة</th><th>المدة</th><th>دور الأستاذ</th><th>دور التلميذ</th><th>ملاحظة</th></tr></thead><tbody>${data!.strategy.phases.map(p => `<tr><td>${p.stage}</td><td>${p.minutes} د</td><td>${p.teacherRole}</td><td>${p.studentRole}</td><td>${p.tips}</td></tr>`).join("")}</tbody></table>${data!.strategy.generalTips.length > 0 ? `<h2>توصيات إضافية</h2><ul>${data!.strategy.generalTips.map(t => `<li>${t}</li>`).join("")}</ul>` : ""}<div class="footer"><div class="sig">إمضاء الأستاذ</div><div class="sig">إمضاء مدير المؤسسة</div></div></body></html>`;
                  },
                };
                printHtml(buildActiveLearningCardHtml({
                  dateLabel: new Date().toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" }),
                  subject,
                  gradeLevel,
                  situationTitle: data!.situation.title,
                  strategyName: data!.strategy.name,
                  totalMinutes: data!.strategy.totalMinutes,
                  rationale: data!.strategy.rationale,
                  phases: data!.strategy.phases,
                  tips: data!.strategy.generalTips,
                }));
                toast.success("جارٍ فتح بطاقة الاستراتيجية للطباعة");
              }}>
                <Printer className="size-4 ml-1" />
                طباعة بطاقة التسيير
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── مكوّن حوار كشف التقدم الفصلي للكفاءات ────────────────────────
function TermReportDialog({ open, onOpenChange, subject, gradeLevel }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subject: string;
  gradeLevel: string;
}) {
  const reportQuery = trpc.competencyModel.termReport.useQuery(
    { subject, gradeLevel },
    { enabled: open },
  );
  const data = reportQuery.data;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="size-5 text-amber-500" />
            كشف التقدم الفصلي نحو الكفاءة الشاملة — {subject} / {gradeLevel}
          </DialogTitle>
        </DialogHeader>
        {reportQuery.isLoading && (
          <div className="flex items-center gap-2 py-10 justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> جارٍ تجميع حصيلة الوضعيات عبر الفصول…
          </div>
        )}
        {reportQuery.error && (
          <p className="text-sm text-destructive py-6 text-center">{reportQuery.error.message}</p>
        )}
        {data?.model && data.terms.length > 0 && (
          <ScrollArea className="max-h-[62vh] px-1">
            <div className="space-y-3">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 text-sm">
                <p className="font-bold text-amber-900 dark:text-amber-200 mb-1">الكفاءة الشاملة</p>
                <p className="leading-relaxed">{data.model.globalCompetency}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">البلوغ الإجمالي في الموسم:</span>
                <Progress value={data.overallPct} className="h-2 flex-1" />
                <span className="font-bold shrink-0">{data.overallPct}% ({data.overallDone}/{data.overallTotal})</span>
              </div>
              {data.terms.map((term, ti) => (
                <div key={ti} className="rounded-lg border">
                  <div className="flex items-center justify-between bg-muted/60 px-3 py-2">
                    <span className="text-sm font-bold">{term.label}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{term.done}/{term.total} وضعية</span>
                      <span className="font-bold text-foreground">{term.pct}%</span>
                      <Progress value={term.pct} className="h-1.5 w-24" />
                    </div>
                  </div>
                  <div className="divide-y">
                    {term.rows.length === 0 ? (
                      <p className="px-3 py-2.5 text-xs text-muted-foreground">لا توجد مقاطع مخصصة لهذا الفصل</p>
                    ) : term.rows.map(r => (
                      <div key={r.sectionNumber} className="px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Badge className="bg-amber-600 text-white">{r.sectionNumber}</Badge>
                            <span className="font-medium">{r.sectionTitle}</span>
                            <Badge className={actionStyles(r.competencyAction).className}>{actionStyles(r.competencyAction).label}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {r.situationsCompleted} منجز · {r.situationsPartial} جزئي · {r.situationsPostponed} مؤجل · {r.situationsCancelled} ملغى
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-foreground/80">{r.termCompetency}</p>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <Progress value={r.masteryPct} className="h-1.5 flex-1" />
                          <span className="shrink-0">نسبة البلوغ: <strong className="text-foreground">{r.masteryPct}%</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
          <Button
            disabled={!data?.model || data.terms.length === 0}
            onClick={() => {
              if (!data?.model) return;
              const printData = {
                gradeLevel: data.model.gradeLevel,
                subject: data.model.subject,
                academicYear: data.academicYear,
                globalCompetency: data.model.globalCompetency,
                terms: data.terms.map(t => ({ ...t, rows: t.rows })),
                overallPct: data.overallPct,
                overallTotal: data.overallTotal,
                overallDone: data.overallDone,
              };
              printHtml(buildTermCompetencyPrintHtml(printData));
              toast.success("جارٍ فتح كشف التقدم الفصلي للطباعة");
            }}
          >
            <Printer className="size-4 ml-1" />اطبع الكشف الفصلي
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Competencies() {
  const [, setLocation] = useLocation();
  const [selectedGrade, setSelectedGrade] = useState<string>(GRADE_LEVELS[0]);
  const [selectedSubject, setSelectedSubject] = useState<string>(SUBJECTS[0]);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [strategySection, setStrategySection] = useState<{ sectionNumber: number; sectionTitle: string } | null>(null);
  const [termReportOpen, setTermReportOpen] = useState(false);

  const modelsQuery = trpc.competencyModel.list.useQuery(undefined);
  const progressQuery = trpc.competencyModel.progress.useQuery(
    { subject: selectedSubject, gradeLevel: selectedGrade },
  );

  const models = useMemo(() => modelsQuery.data || [], [modelsQuery.data]);
  const filteredModels = useMemo(
    () =>
      models.filter(
        m =>
          (!selectedGrade || m.gradeLevel === selectedGrade) &&
          (!selectedSubject || m.subject === selectedSubject),
      ),
    [models, selectedGrade, selectedSubject],
  );
  const currentModel = models.find(m => m.id === selectedModel);

  /**
   * ربط التقدم بالمقاطع عبر رقم المقطع (sectionNumber).
   */
  const progressByNumber = useMemo(() => {
    const map = new Map<string, { title: string; completionPct: number; situationDone: number; situationTotal: number }>();
    for (const s of progressQuery.data?.sections || []) {
      map.set(String(s.sectionNumber), { title: s.title, completionPct: s.completionPct, situationDone: s.situationDone, situationTotal: s.situationTotal });
    }
    return map;
  }, [progressQuery.data]);

  return (
    <div className="container py-6 space-y-6">
      {/* الترويسة */}
      <OfficeHeader
        title="سلم الكفاءات"
        subtitle="المسار نحو الكفاءة الشاملة — لكل مادة في كل مستوى كفاءة شاملة تتحقق عبر الكفاءات الختامية لمقاطع المخطط السنوي، ويُبلَّغ كل مقطع بوضعيات تعليمية-تعلمية وإدماجية، مع معايير ومؤشرات لقياس التملك وحجم ساعي مقدّر. حدّث إنجاز الوضعيات في صفحات اليوم والتخطيط لتتابع نسبة البلوغ."
      />

      {/* الفلاتر */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="المستوى" /></SelectTrigger>
          <SelectContent>
            {GRADE_LEVELS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-[260px]"><SelectValue placeholder="المادة" /></SelectTrigger>
          <SelectContent>
            {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="gap-1.5 bg-white dark:bg-zinc-900"
          onClick={() => setTermReportOpen(true)}
        >
          <BarChart3 className="size-4 text-amber-600" />
          كشف التقدم الفصلي
        </Button>
      </div>

      {modelsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : filteredModels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Target className="size-10 mx-auto mb-3 opacity-50" />
            لا يوجد نموذج كفاءات لهذا المستوى والمادة.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredModels.map(model => (
            <Card
              key={model.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${selectedModel === model.id ? "ring-2 ring-amber-500 shadow-md" : ""}`}
              onClick={() => setSelectedModel(model.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{model.gradeLevel}</CardTitle>
                  <Badge variant="outline" className="shrink-0">{model.subject}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Award className="size-5 shrink-0 text-amber-600 mt-0.5" />
                  <p className="text-sm leading-relaxed">
                    <strong>الكفاءة الشاملة:</strong> {model.globalCompetency || "غير معرّفة"}
                  </p>
                </div>
                <div className="border-t pt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    الكفاءات الختامية للمقاطع ({model.sections.length})
                  </p>
                  <div className="space-y-2">
                    {model.sections.map(s => {
                      const ref = progressByNumber.get(String(s.sectionNumber));
                      return (
                        <div key={s.id} className="rounded-md border bg-muted/40 p-2 text-sm">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium">المقطع {s.sectionNumber}: {s.sectionTitle}</span>
                            {s.competencyAction && (
                              <Badge className={`shrink-0 ${actionStyles(s.competencyAction).className}`}>
                                {actionStyles(s.competencyAction).label}
                              </Badge>
                            )}
                          </div>
                          {ref ? (
                            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <Progress value={ref.completionPct} className="h-1.5 flex-1" />
                              <span>{ref.completionPct}%</span>
                              <span>({ref.situationDone}/{ref.situationTotal} وضعية)</span>
                            </div>
                          ) : (
                            <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <Circle className="size-3" />
                              لا توجد خطة تشغيلية لهذا المستوى والمادة بعد
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* تفاصيل النموذج المختار */}
      {currentModel && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpenCheck className="size-5 text-amber-600" />
                تفصيل نموذج الكفاءات: {currentModel.gradeLevel} — {currentModel.subject}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const sections = currentModel.sections.map(s => {
                    const ref = progressByNumber.get(String(s.sectionNumber));
                    return {
                      sectionNumber: s.sectionNumber,
                      sectionTitle: s.sectionTitle,
                      termCompetency: s.termCompetency,
                      competencyAction: s.competencyAction,
                      durationLabel: s.durationLabel,
                      durationHours: s.durationHours,
                      completionPct: ref?.completionPct ?? 0,
                      situationDone: ref?.situationDone ?? 0,
                      situationTotal: ref?.situationTotal ?? 0,
                    };
                  });
                  printHtml(buildCompetencyPathPrintHtml({
                    gradeLevel: currentModel.gradeLevel,
                    subject: currentModel.subject,
                    globalCompetency: currentModel.globalCompetency,
                    sections,
                  }));
                  toast.success("جارٍ فتح بطاقة متابعة الكفاءات للطباعة");
                }}
              >
                <Printer className="size-4 ml-1" />
                طباعة مسار الكفاءات
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-4 space-y-1">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">الكفاءة الشاملة</p>
              <p className="text-sm leading-relaxed">{currentModel.globalCompetency || "غير معرّفة"}</p>
              {currentModel.sourceDocTitle && (
                <p className="text-xs text-muted-foreground">المصدر: {currentModel.sourceDocTitle}</p>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold">الكفاءات الختامية لمقاطع المخطط السنوي</p>
              {currentModel.sections
                .sort((a, b) => Number(a.sectionNumber) - Number(b.sectionNumber))
                .map(s => (
                  <Card key={s.id} className="border-muted">
                    <CardContent className="py-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-amber-600 text-white">المقطع {s.sectionNumber}</Badge>
                          {s.competencyAction && (
                            <Badge className={actionStyles(s.competencyAction).className}>{actionStyles(s.competencyAction).label}</Badge>
                          )}
                          {s.durationLabel && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="size-3.5" />
                              {s.durationLabel}
                            </span>
                          )}
                        </div>
                        {/* أزرار الإجراءات التربوية */}
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={e => {
                              e.stopPropagation();
                              setStrategySection({ sectionNumber: s.sectionNumber, sectionTitle: s.sectionTitle });
                            }}
                          >
                            <Lightbulb className="size-3.5 text-amber-500" />
                            استراتيجية التسيير
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={e => {
                              e.stopPropagation();
                              setLocation(`/lesson-generator?subject=${encodeURIComponent(currentModel.subject)}&gradeLevel=${encodeURIComponent(currentModel.gradeLevel)}`);
                            }}
                          >
                            <FileText className="size-3.5 text-primary" />
                            أنشئ مذكرة
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed">
                        <strong>الكفاءة الختامية:</strong> {s.termCompetency || "غير معرّفة"}
                      </p>
                      {(s.criteria as unknown as unknown[] | undefined)?.length ? (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground mb-1">المعايير والمؤشرات</p>
                          <ul className="space-y-1">
                            {(s.criteria as unknown as unknown[]).map((c: unknown, i: number) => (
                              <li key={i} className="text-sm flex gap-1.5 items-start">
                                <Target className="size-3.5 shrink-0 text-emerald-600 mt-0.5" />
                                {String(typeof c === "string" ? c : (c as { criterion?: string })?.criterion || JSON.stringify(c))}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {(s.knowledgeResources as unknown as unknown[] | undefined)?.length ? (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground mb-1">الموارد المعرفية</p>
                          <ul className="space-y-1">
                            {(s.knowledgeResources as unknown as unknown[]).map((r: unknown, i: number) => (
                              <li key={i} className="text-sm flex gap-1.5 items-start">
                                <CheckCircle2 className="size-3.5 shrink-0 text-sky-600 mt-0.5" />
                                {String(typeof r === "string" ? r : (r as { title?: string })?.title || JSON.stringify(r))}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}

              {progressQuery.data && progressQuery.data.sections.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-bold mb-3">الارتباط بالخطة التشغيلية (مقاطعك المنجزة)</p>
                  <div className="space-y-2">
                    {currentModel.sections
                      .sort((a, b) => Number(a.sectionNumber) - Number(b.sectionNumber))
                      .map(s => {
                        const ref = progressByNumber.get(String(s.sectionNumber));
                        return (
                          <div key={s.id} className="rounded-lg border bg-muted/40 p-3 text-sm">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Badge className="bg-amber-600 text-white">المقطع {s.sectionNumber}</Badge>
                                <span className="font-medium mr-2">{s.sectionTitle}</span>
                              </div>
                              {s.durationLabel && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="size-3.5" />
                                  {s.durationLabel}
                                </span>
                              )}
                            </div>
                            {ref ? (
                              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <Progress value={ref.completionPct} className="h-2 flex-1" />
                                <span className="shrink-0">{ref.completionPct}%</span>
                                <span className="shrink-0">({ref.situationDone}/{ref.situationTotal} وضعية)</span>
                              </div>
                            ) : (
                              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                <Circle className="size-3.5" />
                                لم تنطلق بعد في هذا المقطع
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {progressQuery.isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                جارٍ جلب تقدمك في بلوغ الكفاءات...
              </div>
            )}

            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-bold mb-2 flex items-center gap-1.5">
                <TrendingUp className="size-4" />
                كيف تُستعمل هذه الصفحة؟
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                الكفاءة الشاملة لا تُقاس مباشرة؛ بل تُقاس كفاءات المقاطع عبر معاييرها ومؤشراتها.
                كلما حدّثت إنجاز الوضعيات التعلمية والإدماجية في صفحة اليوم أو صفحة التخطيط،
                يرتفع مؤشر بلوغ الكفاءة الختامية للمقطع، وتقترب من تحقيق الكفاءة الشاملة للمادة على مستوى الفصل.
                استخدم زر <strong>«استراتيجية التسيير»</strong> لاقتراح طريقة تدريس مناسبة لكل مقطع،
                وزر <strong>«أنشئ مذكرة»</strong> للانتقال مباشرة إلى مولّد المذكرة بالمادة والمستوى المحددين.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* حوار كشف التقدم الفصلي للكفاءات */}
      <TermReportDialog
        open={termReportOpen}
        onOpenChange={setTermReportOpen}
        subject={selectedSubject}
        gradeLevel={selectedGrade}
      />
      {/* حوار استراتيجية التسيير لمقطع الكفاءة */}
      {strategySection && currentModel && (
        <SectionStrategyDialog
          open={!!strategySection}
          onOpenChange={v => { if (!v) setStrategySection(null); }}
          subject={currentModel.subject}
          gradeLevel={currentModel.gradeLevel}
          sectionNumber={strategySection.sectionNumber}
          sectionTitle={strategySection.sectionTitle}
        />
      )}
    </div>
  );
}
