import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import {
  Lightbulb,
  Map as MapIcon,
  BookOpen,
  ClipboardList,
  BarChart3,
  HeartPulse,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

const LOGO = {
  svg: "/manus-storage/nibras-monogram_d4bfe5a9.svg",
  png512: "/manus-storage/nibras-monogram-512_47321ae0.png",
  png192: "/manus-storage/nibras-monogram-192_37a89801.png",
  png96: "/manus-storage/nibras-monogram-96_44fab3e5.png",
  mono512: "/manus-storage/nibras-monogram-mono_6e9d1db3.svg",
};

const colors = [
  { name: "Ink (الحبر) — لون الثقة والمؤسسة", group: "ink", shades: [950, 900, 800, 700, 600, 500, 100, 50] },
  { name: "Copper (النحاس)", group: "copper", shades: [900, 800, 700, 600, 500, 100, 50] },
  { name: "Wax (شمعة النبراس — الضوء)", group: "wax", shades: [900, 800, 700, 600, 500, 100, 50] },
  { name: "Sand (الرمل — الأرضيات)", group: "sand", shades: [900, 700, 500, 300, 200, 100, 50] },
];

const HORIZONTAL = {
  light: "/manus-storage/nibras-horizontal-light_35dcf41f.svg",
  mono: "/manus-storage/nibras-horizontal-mono_2d8435be.svg",
  white: "/manus-storage/nibras-horizontal-white_0bc6fd5f.svg",
};

const pipeline = [
  { icon: ClipboardList, label: "التخطيط", desc: "الخطط السنوية والمقاطع والوضعيات وفق المنهاج الرسمي" },
  { icon: BookOpen, label: "الحصة", desc: "المذكرات والأنشطة التعليمية والإثرائية" },
  { icon: Lightbulb, label: "المورد", desc: "مكتبة موارد موحّدة بهوية نبراس ورمز تسلسلي" },
  { icon: MapIcon, label: "التقويم", desc: "اختبارات وفق قواعد 10+10 / 13+7 / 20 مستقلة" },
  { icon: BarChart3, label: "تحليل النتائج", desc: "نسب الإتقان حسب المجالات والمهارات" },
  { icon: HeartPulse, label: "العلاج والإثراء", desc: "اقتراحات مبنية على النتائج الفعلية" },
];

function copyToken(token: string) {
  navigator.clipboard?.writeText(token);
  toast.success("تم نسخ المتغير");
}

export default function Brand() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div dir="rtl" className="min-h-screen bg-background font-sans">
      {/* Hero */}
      <section className="nibras-glow-pattern border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-20 text-center">
          <img src={LOGO.svg} alt="شعار نبراس" className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-6 drop-shadow-sm" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-brand-ink-950" style={{ fontFamily: "var(--font-display)" }}>
            نبراس
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            <span className="text-brand-ink-800 font-semibold">NIBRAS</span> — منصّة إنتاج تربوي ومساعد يومي
            لأستاذ الاجتماعيات في التعليم المتوسط الجزائري
          </p>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
            الجوهر: تحويل المعرفة والمنهاج إلى فعل تربوي.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            {user ? (
              <Button onClick={() => setLocation("/dashboard")}>
                إلى لوحة التحكم
              </Button>
            ) : (
              <Button onClick={() => setLocation("/dashboard")}>تسجيل الدخول</Button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-14">
        {/* المعنى */}
        <section>
          <h2 className="text-2xl font-bold text-brand-ink-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>
            مفهوم العلامة
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <Lightbulb className="w-6 h-6 text-brand-wax-600 mb-3" />
                <h3 className="font-bold text-brand-ink-900 mb-1">النون — بنية الشعار</h3>
                <p className="text-sm text-muted-foreground">
                  حرف «ن» الكوفي مبني من خط Noto Kufi Arabic الرسمي نفسه؛ ذروة الفم الصاعدة هي حامل المصباح،
                  والنقطة هي لهب النبراس.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <MapIcon className="w-6 h-6 text-brand-copper-700 mb-3" />
                <h3 className="font-bold text-brand-ink-900 mb-1">النبراس</h3>
                <p className="text-sm text-muted-foreground">
                  فانوس عربي معلق عضوياً من ذروة فم النون — المعرفة يضيئها الأستاذ؛ الحرف هو المسار والضوء منه.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <Copy className="w-6 h-6 text-brand-ink-700 mb-3" />
                <h3 className="font-bold text-brand-ink-900 mb-1">المرجعية</h3>
                <p className="text-sm text-muted-foreground">
                  الكوفي الهندسي يعطي الشعار ثبات المخطوط وصرامة الوثيقة الرسمية — مرجعية الأستاذ الجزائري.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* الشعار — الأحجام */}
        <section>
          <h2 className="text-2xl font-bold text-brand-ink-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>
            الشعار — الأحجام والنسخ
          </h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader><CardTitle className="text-base">النسخة الملونة</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center gap-3 pb-6">
                <img src={LOGO.png512} alt="شعار 512" className="w-24 h-24 rounded-2xl bg-muted/50 p-2" />
                <img src={LOGO.png96} alt="شعار 96" className="w-12 h-12 rounded-lg" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">أحادي اللون (monochrome)</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center gap-3 pb-6">
                <img src={LOGO.mono512} alt="شعار أحادي" className="w-24 h-24 rounded-2xl bg-muted/50 p-2" />
                <img src={LOGO.svg} alt="شعار SVG" className="w-12 h-12" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">استخدامات</CardTitle></CardHeader>
              <CardContent className="pb-6 text-sm text-muted-foreground space-y-2">
                <p><span className="font-semibold text-foreground">App Icon / Favicon:</span> PNG بمقاسات 512 / 192 / 96 / 32</p>
                <p><span className="font-semibold text-foreground">المطبوعات:</span> SVG في ترويسة الوثائق A4</p>
                <p><span className="font-semibold text-foreground">القاعدة:</span> لا يُشوَّه ولا يُمدَّد؛ الحد الأدنى 24px للـmonogram</p>
              </CardContent>
            </Card>
          </div>
          <h3 className="text-lg font-bold text-brand-ink-900 mb-3">النسخ الأفقية — Wordmark</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">النسخة الملونة (خلفية فاتحة)</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center gap-4 pb-6">
                <img src={HORIZONTAL.light} alt="النسخة الأفقية الملونة" className="h-16 w-auto" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">أحادي (طباعة)</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center gap-4 pb-6">
                <img src={HORIZONTAL.mono} alt="النسخة الأفقية الأحادية" className="h-16 w-auto" />
              </CardContent>
            </Card>
            <Card className="bg-brand-ink-950">
              <CardHeader><CardTitle className="text-base text-brand-ink-100">أبيض (خلفية داكنة)</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center gap-4 pb-6">
                <img src={HORIZONTAL.white} alt="النسخة الأفقية البيضاء" className="h-16 w-auto" />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* الألوان */}
        <section>
          <h2 className="text-2xl font-bold text-brand-ink-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>
            نظام الألوان
          </h2>
          <div className="space-y-6">
            {colors.map((c) => (
              <div key={c.group}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-brand-ink-900">{c.name}</h3>
                  <span className="text-xs text-muted-foreground">brand-{c.group}-*</span>
                </div>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${c.shades.length}, 1fr)` }}>
                  {c.shades.map((s) => {
                    const isLight = [100, 50].includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        className={`h-14 first:rounded-r-lg last:rounded-l-lg cursor-pointer transition-transform active:scale-95`}
                        style={{ backgroundColor: `var(--brand-${c.group}-${s})`, color: isLight ? "var(--brand-ink-900)" : "#fff" }}
                        onClick={() => copyToken(`var(--brand-${c.group}-${s})`)}
                        title={`brand-${c.group}-${s}`}
                      >
                        <span className="block text-[10px] font-mono">{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Ink هو لون الحبر والوثيقة، Copper لون النحاس الدافئ، Wax هو «شمعة النبراس» يُستخدم للضوء والتمييز، Sand أرضية الواجهة.
            القاعدة: خلفيات فاتحة Sand، نصوص Ink، تمييز Wax/Copper بسخاء قليل.
          </p>
        </section>

        {/* الخطوط */}
        <section>
          <h2 className="text-2xl font-bold text-brand-ink-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>
            الخطوط — Typography
          </h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <Badge variant="outline" className="mb-2">العناوين — font-display (Cairo / Noto Kufi Arabic)</Badge>
                <p className="text-3xl font-black text-brand-ink-950" style={{ fontFamily: "var(--font-display)" }}>
                  نبراس — من المعرفة إلى الفعل التربوي
                </p>
                <p className="text-xl font-bold text-brand-ink-900" style={{ fontFamily: "var(--font-display)" }}>
                  Nibras — From Knowledge to Teaching Action
                </p>
              </div>
              <div>
                <Badge variant="outline" className="mb-2">النصوص — font-sans (Noto Naskh Arabic / Inter)</Badge>
                <p className="text-base text-foreground leading-relaxed">
                  نص أساسي للواجهة: مذكرات الدروس، التقويمات التحصيلية، تقارير المفتش. مكتوب بخط واضح مريح للقراءة والطباعة.
                </p>
              </div>
              <div>
                <Badge variant="outline" className="mb-2">الوثائق المطبوعة — font-doc (Noto Naskh Arabic)</Badge>
                <p className="text-base text-foreground leading-loose font-doc" style={{ fontFamily: "var(--font-doc)" }}>
                  نص الوثائق الرسمية A4: الترويسة، الأسئلة، شبكة التنقيط، الإجابات النموذجية.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* المسار التربوي */}
        <section>
          <h2 className="text-2xl font-bold text-brand-ink-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>
            المسار التربوي — جوهر العلامة
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pipeline.map((p, i) => (
              <Card key={p.label} className="nibras-card-hero">
                <CardContent className="p-5 text-center">
                  <p className="text-xs font-bold text-brand-wax-700 mb-2">{i + 1}</p>
                  <p.icon className="w-7 h-7 text-brand-ink-700 mx-auto mb-2" />
                  <h3 className="font-bold text-brand-ink-900 mb-1">{p.label}</h3>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* النمط الجرافيكي */}
        <section>
          <h2 className="text-2xl font-bold text-brand-ink-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>
            نمط النبراس الجرافيكي
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="nibras-glow-pattern rounded-2xl border border-border h-40 flex items-center justify-center">
              <span className="bg-background/85 border border-border rounded-full px-4 py-2 text-sm font-semibold text-brand-ink-900">
                Glow Pattern — خلفيات الأقسام الرئيسية
              </span>
            </div>
            <div className="nibras-path-pattern rounded-2xl border border-border h-40 flex items-center justify-center">
              <span className="bg-background/85 border border-border rounded-full px-4 py-2 text-sm font-semibold text-brand-ink-900">
                Path Pattern — رؤوس الجداول وأقسام الوثائق
              </span>
            </div>
          </div>
        </section>

        {/* هوية المخرجات التربوية */}
        <section>
          <h2 className="text-2xl font-bold text-brand-ink-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>
            هوية المخرجات التربوية (A4)
          </h2>
          <div className="nibras-identity-bar mb-3 rounded-xl h-24 flex items-center px-6">
            <img src={LOGO.png96} alt="" className="w-14 h-14 rounded-lg bg-white/90 p-0.5 -mt-2" />
            <div className="mr-4 text-white">
              <p className="font-black text-lg" style={{ fontFamily: "var(--font-display)" }}>شريط هوية نبراس</p>
              <p className="text-xs opacity-90">يظهر أعلى الترويسة الرسمية في كل وثيقة مطبوعة</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-5 grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-bold text-brand-ink-900 mb-2">وسوم المواد</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge className="nibras-tag-history">التاريخ</Badge>
                  <Badge className="nibras-tag-geography">الجغرافيا</Badge>
                  <Badge className="nibras-tag-civics">التربية المدنية</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-brand-ink-900 mb-2">عناصر الوثيقة الرسمية</h3>
                <ul className="text-muted-foreground space-y-1 list-disc pr-4">
                  <li>الترويسة الرسمية (المديرية / الاختبار / التاريخ / المدة)</li>
                  <li>الرقم التسلسلي NIBRAS-YYYY-XXXXX</li>
                  <li>رموز QR (تحقق + إجابات مقفلة زمنياً)</li>
                  <li>التذييل الموحد وترقيم الصفحات</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* مكونات */}
        <section>
          <h2 className="text-2xl font-bold text-brand-ink-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>
            المكونات الموحدة
          </h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Button>زر أساسي</Button>
              <Button variant="secondary">زر ثانوي</Button>
              <Button variant="outline">زر خارجي</Button>
              <Button variant="ghost">زر شبح</Button>
              <Button variant="destructive">زر حذف</Button>
              <Badge>وسم</Badge>
              <Badge variant="outline">وسم خارجي</Badge>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">بطاقة قياسية</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                بطاقات المحتوى والجداول والتنبيهات تتبع System tokens الموحدة بحيث تتحول تلقائياً مع وضع العرض.
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
