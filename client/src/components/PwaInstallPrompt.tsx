import {
  applyPwaUpdate,
  getDeferredInstallPrompt,
  getInstallGuidance,
  isStandaloneApp,
  PWA_INSTALL_READY_EVENT,
  PWA_INSTALLED_EVENT,
  PWA_UPDATE_READY_EVENT,
  type DeferredInstallPrompt,
} from "@/lib/pwa";
import { Download, RefreshCcw, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(() => getDeferredInstallPrompt());
  const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [installed, setInstalled] = useState(() => isStandaloneApp());
  const [showGuidance, setShowGuidance] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleInstallReady = () => setDeferredPrompt(getDeferredInstallPrompt());
    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowGuidance(false);
    };
    const handleUpdateReady = (event: Event) => {
      const registration = (event as CustomEvent<ServiceWorkerRegistration>).detail;
      if (registration) setUpdateRegistration(registration);
    };

    window.addEventListener(PWA_INSTALL_READY_EVENT, handleInstallReady);
    window.addEventListener(PWA_INSTALLED_EVENT, handleInstalled);
    window.addEventListener(PWA_UPDATE_READY_EVENT, handleUpdateReady);
    return () => {
      window.removeEventListener(PWA_INSTALL_READY_EVENT, handleInstallReady);
      window.removeEventListener(PWA_INSTALLED_EVENT, handleInstalled);
      window.removeEventListener(PWA_UPDATE_READY_EVENT, handleUpdateReady);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) {
      setShowGuidance((current) => !current);
      return;
    }

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome !== "accepted") setShowGuidance(true);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(getDeferredInstallPrompt());
    }
  };

  if (installed && !updateRegistration) return null;

  return (
    <section className="mb-3 rounded-2xl border border-primary/15 bg-primary/[0.045] p-3 text-right md:hidden" aria-live="polite">
      {updateRegistration ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">تتوفر نسخة أحدث من نبراس</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">حدّث الآن لتطبيق التحسينات الأخيرة.</p>
          </div>
          <Button size="sm" className="shrink-0 gap-1.5" onClick={() => applyPwaUpdate(updateRegistration)}>
            <RefreshCcw className="h-3.5 w-3.5" />
            تحديث
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Smartphone className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">ثبّت نبراس على هاتفك</p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">يفتح كتطبيق مستقل ويجلب أحدث نسخة بأمان.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 gap-1.5 bg-background" onClick={() => void install()} disabled={isInstalling}>
              <Download className="h-3.5 w-3.5" />
              {isInstalling ? "جارٍ…" : "تثبيت"}
            </Button>
          </div>
          {showGuidance ? (
            <p className="mt-3 rounded-xl bg-background px-3 py-2 text-xs leading-6 text-muted-foreground">
              {getInstallGuidance(navigator.userAgent)}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
