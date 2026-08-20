import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Route,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useState } from "react";

type TourPanel = "season" | "today" | "planning" | "assessment";

const panels: Array<{ id: TourPanel; label: string; icon: typeof CalendarDays }> = [
  { id: "season", label: "تهيئة الموسم", icon: CalendarDays },
  { id: "today", label: "صفحة اليوم", icon: LayoutDashboard },
  { id: "planning", label: "التخطيط", icon: Route },
  { id: "assessment", label: "التقويم", icon: ClipboardCheck },
];

function SeasonPreview() {
  const steps = ["الأستاذ والمؤسسة", "الأقسام والمستويات", "قوائم التلاميذ", "جدول الخدمة", "مراجعة وانطلاق"];
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between border-b pb-4">
        <div>
          <p className="text-xs font-medium text-primary">تهيئة الموسم الدراسي</p>
          <h3 className="mt-1 text-lg font-bold">خطوات قصيرة تُنجز مرة واحدة</h3>
        </div>
        <Badge variant="secondary">للقراءة فقط</Badge>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5 sm:gap-3">
        {steps.map((step, index) => (
          <div key={step} className={`rounded-xl border p-3 ${index === 4 ? "border-primary bg-primary/5" : "bg-muted/35"}`}>
            <span className={`mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${index === 4 ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}>{index + 1}</span>
            <p className="text-xs font-semibold leading-5">{step}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-dashed bg-muted/25 p-4">
        <p className="text-sm font-semibold">المبدأ: تُحفظ البيانات أثناء العمل ويعود الأستاذ إلى أول خطوة ناقصة.</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">لا تعرض هذه الجولة اسماً أو مؤسسة أو قائمة تلاميذ حقيقية.</p>
      </div>
    </div>
  );
}

function TodayPreview() {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between border-b pb-4">
        <div><p className="text-xs font-medium text-primary">صفحة اليوم</p><h3 className="mt-1 text-lg font-bold">قرار الحصة التالية في مكان واحد</h3></div>
        <div className="h-9 w-9 rounded-full bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-xl border border-primary/20 bg-primary/[0.035] p-5">
          <div className="flex items-start justify-between"><div><p className="text-xs text-muted-foreground">الحصة التالية</p><p className="mt-1 font-bold">الوضعية التعلمية من التخطيط الرسمي</p></div><CalendarDays className="h-5 w-5 text-primary" /></div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-background p-2"><p className="text-muted-foreground">القسم</p><p className="mt-1 font-semibold">المسند</p></div><div className="rounded-lg bg-background p-2"><p className="text-muted-foreground">المادة</p><p className="mt-1 font-semibold">اجتماعيات</p></div><div className="rounded-lg bg-background p-2"><p className="text-muted-foreground">المدة</p><p className="mt-1 font-semibold">ساعة</p></div></div>
          <Button className="mt-4 w-full sm:w-auto">فتح المذكرة <ArrowLeft className="mr-2 h-4 w-4" /></Button>
        </div>
        <div className="space-y-3"><div className="rounded-xl border p-4"><FileText className="h-5 w-5 text-primary" /><p className="mt-2 text-sm font-semibold">المذكرة جاهزة</p><p className="mt-1 text-xs text-muted-foreground">معاينة أو PDF رسمي</p></div><div className="rounded-xl border p-4"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><p className="mt-2 text-sm font-semibold">متابعة التنفيذ</p><p className="mt-1 text-xs text-muted-foreground">إنجاز أو تأجيل واعٍ</p></div></div>
      </div>
    </div>
  );
}

function PlanningPreview() {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between border-b pb-4"><div><p className="text-xs font-medium text-primary">التخطيط التربوي</p><h3 className="mt-1 text-lg font-bold">من المخطط إلى المذكرة دون فقدان السياق</h3></div><Route className="h-5 w-5 text-primary" /></div>
      <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
        {[{ title: "المخطط السنوي", note: "الكفاءة والمقطع" }, { title: "الوضعية", note: "المورد والأهداف" }, { title: "المذكرة", note: "سير الحصة والنشاط" }].map((item, index) => (
          <div key={item.title} className="flex flex-1 items-center gap-3"><div className="flex-1 rounded-xl border p-4"><p className="text-xs text-muted-foreground">{index + 1}. خطوة التخطيط</p><p className="mt-1 font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.note}</p></div>{index < 2 && <ArrowLeft className="hidden h-5 w-5 shrink-0 text-primary md:block" />}</div>
        ))}
      </div>
      <p className="mt-5 rounded-xl bg-muted/40 p-3 text-sm leading-6">هذه الرحلة هي محور إعادة التنظيم المقترحة: تُعرض كمسار واحد، لا كصفحات متنافسة.</p>
    </div>
  );
}

function AssessmentPreview() {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between border-b pb-4"><div><p className="text-xs font-medium text-primary">التقويم والنتائج</p><h3 className="mt-1 text-lg font-bold">إنشاء، طباعة، نقاط، ثم علاج</h3></div><ClipboardCheck className="h-5 w-5 text-primary" /></div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[{ icon: Sparkles, label: "توليد مضبوط", note: "من الدروس المنجزة" }, { icon: FileText, label: "PDF رسمي", note: "محايد وجاهز للطباعة" }, { icon: UsersRound, label: "دفتر تنقيط", note: "تدوين منظم" }, { icon: GraduationCap, label: "علاج وإثراء", note: "من النتائج" }].map((item) => (
          <div key={item.label} className="rounded-xl border p-4"><item.icon className="h-5 w-5 text-primary" /><p className="mt-3 text-sm font-semibold">{item.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p></div>
        ))}
      </div>
      <p className="mt-5 text-sm leading-6 text-muted-foreground">تعرض هذه المعاينة مبدأ سير العمل فقط، ولا تتيح إنشاء اختبار أو الوصول إلى أي نتائج فعلية.</p>
    </div>
  );
}

export default function ExpertTour() {
  const [activePanel, setActivePanel] = useState<TourPanel>("season");

  const renderActivePanel = () => {
    if (activePanel === "today") return <TodayPreview />;
    if (activePanel === "planning") return <PlanningPreview />;
    if (activePanel === "assessment") return <AssessmentPreview />;
    return <SeasonPreview />;
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#fbfaf8] text-foreground">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">ن</div><div><p className="font-bold leading-5">نبراس <span className="font-normal text-muted-foreground">| NIBRAS</span></p><p className="text-[11px] text-muted-foreground">جولة خبير عامة</p></div></div>
          <Badge variant="outline" className="gap-1.5 border-emerald-700/25 bg-emerald-50 text-emerald-800"><ShieldCheck className="h-3.5 w-3.5" />قراءة فقط · بلا تسجيل دخول</Badge>
        </div>
      </header>

      <section className="border-b bg-[radial-gradient(circle_at_top_right,rgba(177,142,70,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(22,50,84,0.1),transparent_36%)]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <Badge className="mb-5 bg-primary/10 text-primary hover:bg-primary/10">معاينة محمية للخبير</Badge>
          <div className="max-w-3xl"><h1 className="text-3xl font-bold tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>كيف يساعد نبراس أستاذ الاجتماعيات طوال الموسم الدراسي؟</h1><p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">هذه جولة عامة في تجربة المنتج وبنيته التربوية. تعرض التدفقات والواجهات دون فتح مساحة الأستاذ أو بيانات المؤسسة أو قوائم التلاميذ.</p></div>
          <div className="mt-8 flex flex-wrap gap-3"><Button onClick={() => document.getElementById("tour-panels")?.scrollIntoView({ behavior: "smooth" })}>استكشف الجولة <ArrowLeft className="mr-2 h-4 w-4" /></Button><Button variant="outline" onClick={() => document.getElementById("review-scope")?.scrollIntoView({ behavior: "smooth" })}>نطاق المراجعة</Button></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8" id="tour-panels">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-primary">جولة منظمة</p><h2 className="mt-1 text-2xl font-bold">أربع لحظات من عمل الأستاذ</h2></div><p className="max-w-md text-sm leading-6 text-muted-foreground">اختر أي محطة لاستكشاف بنيتها. جميع الأمثلة إيضاحية وغير متصلة بقاعدة البيانات.</p></div>
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {panels.map((panel) => <button key={panel.id} type="button" onClick={() => setActivePanel(panel.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${activePanel === panel.id ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}><panel.icon className="h-4 w-4" />{panel.label}</button>)}
        </div>
        {renderActivePanel()}
      </section>

      <section id="review-scope" className="border-y bg-muted/25"><div className="mx-auto max-w-6xl px-5 py-12 sm:px-8"><div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]"><div><p className="text-sm font-semibold text-primary">نطاق مراجعة الخبير</p><h2 className="mt-2 text-2xl font-bold">المطلوب هو تبسيط الوصول، لا تغيير الهدف التربوي.</h2><p className="mt-4 leading-7 text-muted-foreground">نمت صفحات نبراس مع نمو القدرات. المطلوب من الخبير تقييم طريقة تجميعها حول مهام الأستاذ: اليوم، التخطيط، التقويم والنتائج، والمكتبة والممارسة.</p></div><div className="grid gap-3 sm:grid-cols-2">{["وضوح موقع الأستاذ وخطوته التالية في كل شاشة", "استقلال تهيئة الموسم عن التنقل اليومي المزدحم", "ربط المخطط والوضعية والمذكرة في سياق واحد", "تقليل عناصر الهاتف إلى النيات اليومية عالية التردد"].map((point) => <Card key={point} className="bg-background"><CardContent className="flex gap-3 p-4"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><p className="text-sm leading-6">{point}</p></CardContent></Card>)}</div></div></div></section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8"><div className="rounded-2xl border border-primary/20 bg-primary/[0.035] p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-primary" /><div><h2 className="font-bold">حدود هذه المعاينة</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">هذه الصفحة لا تطلب حساباً ولا تقرأ ملفات تعريف أو أقساماً أو تلاميذ أو نتائج، ولا تحتوي على أزرار تعديل أو توليد أو تصدير. تُمنح صلاحية العمليات فقط داخل مساحة الأستاذ بعد تسجيل الدخول.</p></div></div><Menu className="hidden h-7 w-7 text-primary sm:block" /></div></div></section>

      <footer className="border-t bg-background"><div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8"><p>نبراس — مساعد تدريس لأستاذ الاجتماعيات في التعليم المتوسط الجزائري.</p><p>رابط معاينة عام ومحدود الصلاحية.</p></div></footer>
    </main>
  );
}
