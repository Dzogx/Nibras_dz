import { useState } from "react";
import { Link, useSearchParams } from "wouter";
import { QrCode, BadgeCheck, XCircle, Lock, Unlock, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * صفحة عامة للتحقق من صحة أي وثيقة صادرة من نبراس.
 * تستقبل الرقم التسلسلي عبر الرابط: /verify?serial=NIBRAS-YYYY-XXXXX
 * أو من خلال الإدخال اليدوي.
 */
export default function Verify() {
  const [searchParams] = useSearchParams();
  const initialSerial = searchParams.get("serial") ?? "";
  const [serial, setSerial] = useState(initialSerial);
  const [submitted, setSubmitted] = useState(Boolean(initialSerial));

  const query = trpc.aiResources.getBySerial.useQuery(
    { serialNumber: serial.trim() },
    { enabled: submitted && serial.trim().length > 3 },
  );

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const docTypeName: Record<string, string> = {
    lessonPlan: "مذكرة درس",
    activity: "نشاط تعليمي",
    homework: "فرض منزلي",
    classQuestions: "أسئلة صفيّة",
    differentiation: "استراتيجيات التفريد",
    quiz: "اختبار قصير",
    exam: "تقويم تحصيلي",
    rubric: "شبكة تقييم",
    answerKey: "نموذج إجابات",
    inspectorReview: "تقرير المفتش",
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <QrCode className="w-4 h-4" />
            <span>نبراس NIBRAS</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">التحقق من صحة الوثيقة</h1>
          <p className="text-slate-500 text-sm mt-1">
            أدخل الرقم التسلسلي المطبوع أسفل الوثيقة للتحقق من إصدارها
          </p>
        </header>

        <form onSubmit={handleVerify} className="mb-6">
          <div className="flex gap-2">
            <input
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="NIBRAS-YYYY-XXXXX"
              dir="ltr"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-center font-mono text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-teal-600 text-white px-5 py-2.5 font-semibold hover:bg-teal-700 transition-colors"
            >
              تحقق
            </button>
          </div>
        </form>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
          {query.isLoading ? (
            <div className="py-8 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm">جارٍ التحقق...</span>
            </div>
          ) : query.isError ? (
            <div className="py-8 text-red-500 text-sm">
              حدث خطأ أثناء الاتصال بالخادم. تحقق من اتصالك وحاول مجدداً.
            </div>
          ) : !submitted || query.data?.found === false ? (
            <div className="py-8 flex flex-col items-center gap-3 text-red-500">
              <XCircle className="w-12 h-12" />
              <p className="font-bold">وثيقة غير معروفة</p>
              <p className="text-sm text-slate-500">
                لا توجد وثيقة بهذا الرقم التسلسلي في منصة نبراس. قد يكون الرقم غير صحيح أو أن الوثيقة مزوّرة.
              </p>
            </div>
          ) : (
            query.data?.found && (
              <div className="py-4 flex flex-col items-center gap-4">
                <BadgeCheck className="w-14 h-14 text-teal-600" />
                <div>
                  <p className="font-bold text-teal-700 text-lg">وثيقة صادرة عن منصة نبراس</p>
                  <p className="text-sm text-slate-500 mt-1">تم التحقق من الرقم التسلسلي بنجاح</p>
                </div>
                <table className="w-full text-sm mt-2" dir="rtl">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 text-slate-500 text-right">نوع الوثيقة</td>
                      <td className="py-2 font-medium text-left">{docTypeName[query.data.type] ?? query.data.type}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 text-slate-500 text-right">العنوان</td>
                      <td className="py-2 font-medium text-left">{query.data.title}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 text-slate-500 text-right">تاريخ الإصدار</td>
                      <td className="py-2 font-medium text-left">
                        {new Date(query.data.createdAt).toLocaleDateString("ar-DZ")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-500 text-right">نموذج الإجابات</td>
                      <td className="py-2 font-medium text-left">
                        {query.data.answerRevealAt !== null ? (
                          query.data.answerVisible ? (
                            <span className="inline-flex items-center gap-1 text-teal-600">
                              <Unlock className="w-3.5 h-3.5" /> متاح الآن
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600">
                              <Lock className="w-3.5 h-3.5" /> مُقفَل حتى نهاية الاختبار
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400">لا ينطبق</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-slate-400 mt-2" dir="ltr">
                  {serial}
                </p>
              </div>
            )
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          منصة نبراس — مساعد التدريس الذكي لأساتذة الاجتماعيات في التعليم المتوسط الجزائري
        </p>
        <div className="text-center mt-2">
          <Link href="/dashboard" className="text-sm text-teal-600 hover:underline">
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  );
}
