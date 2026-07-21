import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface PopupAd {
  id: string;
  image_url: string;
  link_url: string;
}

const STORAGE_KEY = "popup_ad_dismissed";

export const PopupAd = () => {
  const [ad, setAd] = useState<PopupAd | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("popup_ads")
        .select("id,image_url,link_url")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) return;
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (dismissed === data.id) return;
      setAd(data as PopupAd);
      setTimeout(() => setOpen(true), 600);
    })();
  }, []);

  const close = () => {
    if (ad) sessionStorage.setItem(STORAGE_KEY, ad.id);
    setOpen(false);
  };

  if (!ad || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
      onClick={close}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Close ad"
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white text-black shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>
        <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={ad.image_url}
            alt="Advertisement"
            className="block max-w-[90vw] max-h-[90vh] w-auto h-auto rounded-lg shadow-2xl"
          />
        </a>
      </div>
    </div>
  );
};
