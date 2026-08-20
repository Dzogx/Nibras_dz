import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import {
  Lightbulb,
  Map as MapIcon,
  BookOpen,
  ClipboardList,
  BarChart3,
  HeartPulse,
  FileText,
  Printer,
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const go = (path: string) => {
    if (user) setLocation(path);
    else window.location.href = "/dashboard";
  };

  if (loading) {
    return (
      <div className="nibras-glow-pattern min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <img
            src="/manus-storage/nibras-bilingual-lockup_8f848dcc.png"
            alt="نبراس | NIBRAS"
            className="h-14 w-auto mx-auto mb-4 animate-pulse"
          />
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background font-sans">
      {/* Hero */}
      <section className="nibras-glow-pattern">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
          <img
            src="/manus-storage/nibras-bilingual-lockup_8f848dcc.png"
            alt="نبراس | NIBRAS"
            className="h-24 md:h-32 w-auto mx-auto mb-6"
          />
          <p className="mt-4 text-lg md:text-xl text-muted-foreground leading-relaxed">
            مساعد التدريس الذكي لأستاذ الاجتماعيات في التعليم المتوسط الجزائري
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            التخطيط ← الحصة ← المورد ← التقويم ← تحليل النتائج ← العلاج والإثراء
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" onClick={() => go("/dashboard")}>
              إلى لوحة التحكم
            </Button>
            <Button size="lg" variant="outline" onClick={() => go("/brand")}>
              الهوية البصرية
            </Button>
          </div>
        </div>
      </section>

      {/* المسار */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-brand-ink-900 text-center mb-8" style={{ fontFamily: "var(--font-display)" }}>
          الحلقة التربوية الكاملة
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: ClipboardList, label: "التخطيط", desc: "خطط سنوية ومقاطع ووضعيات وفق المنهاج الرسمي" },
            { icon: BookOpen, label: "الحصة", desc: "مذكرات وأنشطة تعليمية وإثرائية جاهزة" },
            { icon: Lightbulb, label: "المورد", desc: "مكتبة موارد منظمة للمذكرات والأنشطة والوثائق" },
            { icon: MapIcon, label: "التقويم", desc: "اختبارات وفق قواعد 10+10 و13+7 و20" },
            { icon: BarChart3, label: "تحليل النتائج", desc: "نسب الإتقان حسب المجالات والمهارات" },
            { icon: HeartPulse, label: "العلاج والإثراء", desc: "اقتراحات مبنية على النتائج الفعلية" },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-5 text-center">
                <item.icon className="w-7 h-7 text-brand-copper-700 mx-auto mb-2" />
                <h3 className="font-bold text-brand-ink-900 mb-1">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* هوية الوثائق */}
      <section className="border-t border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold text-brand-ink-900 text-center mb-8" style={{ fontFamily: "var(--font-display)" }}>
            وثائق رسمية محايدة وجاهزة للطباعة
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: FileText, label: "ترويسة مؤسساتية", desc: "الجهة والمؤسسة والمستوى والتاريخ والمادة والمدة في مواضعها الرسمية" },
              { icon: ClipboardList, label: "تنسيق حسب المستوى", desc: "مساحة إجابة مدمجة للأولى والثانية، وورقة أسئلة مستقلة للثالثة والرابعة" },
              { icon: Printer, label: "جاهزة للطباعة", desc: "إخراج A4 عربي من اليمين إلى اليسار دون شعار منصة أو رموز إضافية" },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="p-5 text-center">
                  <item.icon className="w-7 h-7 text-brand-wax-700 mx-auto mb-2" />
                  <h3 className="font-bold text-brand-ink-900 mb-1">{item.label}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
