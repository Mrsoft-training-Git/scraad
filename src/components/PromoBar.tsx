import { useEffect, useState } from "react";
import { Sparkles, X, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "scraad_promo_dismissed_v1";

interface PromoSettings {
  enabled: boolean;
  text: string;
  cta_text: string;
  cta_link: string;
  countdown_enabled: boolean;
  countdown_target: string;
}

export const PromoBar = () => {
  const [dismissed, setDismissed] = useState(false);
  const [settings, setSettings] = useState<PromoSettings | null>(null);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1") {
      setDismissed(true);
    }
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "promo_bar")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setSettings(data.value as unknown as PromoSettings);
      });
  }, []);

  useEffect(() => {
    if (!settings?.countdown_enabled || !settings?.countdown_target) return;
    const target = new Date(settings.countdown_target).getTime();
    const tick = () => {
      const ms = Math.max(0, target - Date.now());
      setTimeLeft({
        d: Math.floor(ms / 86400000),
        h: Math.floor((ms / 3600000) % 24),
        m: Math.floor((ms / 60000) % 60),
        s: Math.floor((ms / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [settings?.countdown_enabled, settings?.countdown_target]);

  if (dismissed || !settings || !settings.enabled) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="relative bg-foreground text-background py-2 px-4 text-xs sm:text-sm overflow-hidden">
      <div className="container mx-auto flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
        <span className="inline-flex items-center gap-1.5 font-medium">
          {settings.text}
        </span>
        {settings.countdown_enabled && (
          <>
            <span className="hidden sm:inline-block w-px h-4 bg-background/20" />
            <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
              <Clock className="w-3.5 h-3.5 text-secondary" />
              <span className="text-secondary font-semibold">
                {pad(timeLeft.d)}d {pad(timeLeft.h)}h {pad(timeLeft.m)}m {pad(timeLeft.s)}s
              </span>
            </span>
          </>
        )}
        {settings.cta_text && settings.cta_link && (
          <Link
            to={settings.cta_link}
            className="hidden sm:inline-block underline-offset-4 hover:underline font-semibold text-secondary"
          >
            {settings.cta_text}
          </Link>
        )}
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
