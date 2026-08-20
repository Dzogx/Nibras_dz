import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";
import { registerPwa, requestInstallPromptCapture } from "./lib/pwa";

const queryClient = new QueryClient();

// PWA keeps only a static offline page. It never caches API, roster or student data.
requestInstallPromptCapture();
registerPwa();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
    // إصلاح دفاعي للجلسات المتضررة: استعلامات تُخزَّن خطأ Validation
    // (مثل academicYear="" قبل التصحيح) لا تعاد المحاولة تلقائيًا. نبطلها
    // لنجبر إعادة التنفيذ — الخادم الآن يشتق السنة الفعالة بنفسه.
    if (error instanceof TRPCClientError && String(error.message).includes("too_small")) {
      void queryClient.invalidateQueries({ queryKey: event.query.queryKey, refetchType: "all" });
    }
  }
});

// مناعة ضد الكاش المسموم بمفتاح سنة فارغة: عند بدء التطبيق تُزال كل استجابات
// (حتى الناجحة الفارغة) المخزنة لمفتاح سنة "" أو أقل من 4 أحرف، فتُعاد من الخادم
// بالسنة المشتقة حديثًا. يحمي الهواتف والمتصفحات ذات الكاش القديم.
try {
  queryClient.getQueryCache().findAll().forEach(query => {
    const key = query.queryKey as unknown[];
    const hasEmptyYear = key.some(
      part =>
        typeof part === "object" && part !== null && "academicYear" in part &&
        typeof (part as { academicYear?: unknown }).academicYear === "string" &&
        String((part as { academicYear: string }).academicYear).length < 4,
    );
    if (hasEmptyYear) queryClient.removeQueries({ queryKey: query.queryKey });
  });
} catch {
  // لا نتوقف على أي استثناء أثناء تنظيف الكاش
}

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Preview auto-login fallback: when the browser blocks iframe cookies
        // (Safari ITP / private browsing / WebView), the runtime mirrors the
        // session into sessionStorage so we can forward it as a Bearer token.
        // The regular OAuth cookie flow keeps working and takes priority server-side.
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // sessionStorage unavailable
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
