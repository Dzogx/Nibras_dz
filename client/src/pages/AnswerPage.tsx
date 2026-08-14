import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { QrCode, Lock, Clock, BadgeCheck, Loader2, FileKey } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * صفحة عامة لكشف نموذج الإجابات المرتبط بالتقويم التحصيلي.
 * الرابط: /verify/answer/:serial
 * لا يظهر المحتوى إلا بعد مرور وقت نهاية الاختبار (answerRevealAt).
 */
export default function AnswerPage() {
  const [, params] = useRoute("/verify/answer/:serial");
  const serial = params?.serial ?? "";

  const query = trpc.aiResources.getAnswer.useQuery(
    { serialNumber: serial },
    { enabled: serial.trim().length > 3 },
  );

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (query.data?.status === "locked" && query.data?.revealAt) {
      const t = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(t);
    }
  }, [query.data?.status, query.data?.revealAt]);

  const formatCountdown = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <QrCode className="w-4 h-4" />
            <span>نبراس NIBRAS</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">نموذج الإجابات</h1>
          <p className="text-slate-500 text-sm mt-1">
            يظهر نموذج الإجابات تلقائياً بعد نهاية وقت الاختبار
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          {query.isLoading ? (
            <div className="py-8 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">جارٍ جلب البيانات...</span>
            </div>
          ) : query.isError ? (
            <div className="py-8 text-red-500 text-sm">
              حدث خطأ أثناء الاتصال بالخادم. تحقق من اتصالك وحاول مجدداً.
            </div>
          ) : !query.data || query.data.status === "not_found" ? (
            <div className="py-8 flex flex-col items-center gap-3 text-red-500">
              <Lock className="w-12 h-12" />
              <p className="font-bold">رقم تسلسلي غير صحيح</p>
              <p className="text-sm text-slate-500">
                لا يوجد تقويم تحصيلي بهذا الرقم التسلسلي في منصة نبراس.
              </p>
            </div>
          ) : query.data.status === "locked" ? (
            <div className="py-8 flex flex-col items-center gap-4">
              <Clock className="w-12 h-12 text-amber-500" />
              {query.data.revealAt ? (
                <>
                  <p className="font-bold text-slate-700">الاختبار لم ينته بعد</p>
                  <p className="text-sm text-slate-500">
                    نموذج الإجابات مقفَل حتى تاريخ: {" "}
                    {new Date(query.data.revealAt).toLocaleString("ar-DZ")}
                  </p>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-6 py-4 font-mono text-2xl font-bold text-slate-700" dir="ltr">
                    {formatCountdown(query.data.revealAt - now)}
                  </div>
                  <p className="text-xs text-slate-400">عد تنازلي حتى فتح الإجابات</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-slate-700">نموذج الإجابات غير مفعّل</p>
                  <p className="text-sm text-slate-500">
                    الأستاذ لم يحدد وقت نهاية الاختبار لهذا التقويم،
                    لذلك لا يمكن عرض الإجابات حالياً.
                  </p>
                </>
              )}
            </div>
          ) : (
            query.data.status === "revealed" && (
              <div className="text-right">
                <div className="flex items-center justify-center gap-2 text-teal-700 mb-6">
                  <BadgeCheck className="w-10 h-10" />
                  <div className="text-center">
                    <p className="font-bold text-lg">نموذج الإجابات متاح</p>
                    <p className="text-sm text-slate-500">{query.data.status === "revealed" ? query.data.title : undefined}</p>
                  </div>
                </div>
                <div className="prose prose-slate max-w-none text-sm leading-7 whitespace-pre-wrap text-right">
                  {query.data.content}
                </div>
                <p className="text-xs text-slate-400 text-center mt-6 border-t border-slate-100 pt-4" dir="ltr">
                  NIBRAS Answer Key · {serial}
                </p>
              </div>
            )
          )}
        </div>

        <div className="text-center mt-8">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:underline">
            <FileKey className="w-4 h-4" />
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  );
}
