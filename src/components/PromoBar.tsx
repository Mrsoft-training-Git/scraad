import { useEffect, useState } from "react";
import { Sparkles, X, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "scraad_promo_dismissed_v1";
const TARGET_OFFSET_MS = 1000 * 60 * 60 * 24 * 3; // 3 days from first mount

export const PromoBar = () => {
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") {
      setDismissed(true);
      return;
    }

    let target = Number(localStorage.getItem("scraad_promo_target") || 0);
    if (!target || target < Date.now()) {
      target = Date.now() + TARGET_OFFSET_MS;
      localStorage.setItem("scraad_promo_target", String(target));
    }

    const tick = () => {
      const ms = Math.max(0, target - Date.now());
      const d = Math.floor(ms / (1000 * 60 * 60 * 24));
      const h = Math.floor((ms / (1000 * 60 * 60)) % 24);
      const m = Math.floor((ms / (1000 * 60)) % 60);
      const s = Math.floor((ms / 1000) % 60);
      setTimeLeft({ d, h, m, s });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="relative bg-foreground text-background py-2 px-4 text-xs sm:text-sm overflow-hidden">
      <div className="container mx-auto flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
          Limited launch offer — Free trial on all programs
        </span>
        <span className="hidden sm:inline-block w-px h-4 bg-background/20" />
        <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
          <Clock className="w-3.5 h-3.5 text-secondary" />
          <span className="text-secondary font-semibold">
            {pad(timeLeft.d)}d {pad(timeLeft.h)}h {pad(timeLeft.m)}m {pad(timeLeft.s)}s
          </span>
        </span>
        <Link
          to="/auth"
          className="hidden sm:inline-block underline-offset-4 hover:underline font-semibold text-secondary"
        >
          Claim now →
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss promo"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-background/10 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
