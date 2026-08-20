export type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export const PWA_INSTALL_READY_EVENT = "nibras:pwa-install-ready";
export const PWA_INSTALLED_EVENT = "nibras:pwa-installed";
export const PWA_UPDATE_READY_EVENT = "nibras:pwa-update-ready";

let deferredInstallPrompt: DeferredInstallPrompt | null = null;

export function isAppleMobile(userAgent: string) {
  return /iphone|ipad|ipod/i.test(userAgent);
}

export function getInstallGuidance(userAgent: string) {
  if (isAppleMobile(userAgent)) {
    return "في Safari: اضغط زر المشاركة، ثم اختر «إضافة إلى الشاشة الرئيسية».";
  }

  return "من قائمة المتصفح اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».";
}

export function isStandaloneApp() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

export function getDeferredInstallPrompt() {
  return deferredInstallPrompt;
}

export function requestInstallPromptCapture() {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as DeferredInstallPrompt;
    window.dispatchEvent(new Event(PWA_INSTALL_READY_EVENT));
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    window.dispatchEvent(new Event(PWA_INSTALLED_EVENT));
  });
}

export function registerPwa() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  let hadController = Boolean(navigator.serviceWorker.controller);
  let registration: ServiceWorkerRegistration | undefined;

  const notifyWhenUpdateWaits = () => {
    if (registration?.waiting && navigator.serviceWorker.controller) {
      window.dispatchEvent(new CustomEvent(PWA_UPDATE_READY_EVENT, { detail: registration }));
    }
  };

  void navigator.serviceWorker
    .register("/sw.js", { updateViaCache: "none" })
    .then((registered) => {
      registration = registered;
      notifyWhenUpdateWaits();

      registered.addEventListener("updatefound", () => {
        const installing = registered.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed") notifyWhenUpdateWaits();
        });
      });

      const checkForUpdate = () => void registered.update();
      window.addEventListener("focus", checkForUpdate);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });
    })
    .catch(() => {
      // The app remains fully usable when a browser or embedded WebView blocks service workers.
    });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) {
      hadController = true;
      return;
    }

    const reloadKey = "nibras:pwa-reloaded-after-update";
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, "true");
      window.location.reload();
    }
  });
}

export function applyPwaUpdate(registration: ServiceWorkerRegistration) {
  registration.waiting?.postMessage({ type: "SKIP_WAITING" });
}
