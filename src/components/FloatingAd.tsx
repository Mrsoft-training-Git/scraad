import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AdView {
  title: string;
  image_url: string;
  href: string;
}

export const FloatingAd = () => {
  const [ad, setAd] = useState<AdView | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ads")
        .select("title,image_url,link_type,link_id")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data || !data.link_id) return;

      let title = data.title;
      let image_url = data.image_url;

      if (data.link_type === "course") {
        const { data: c } = await supabase
          .from("courses")
          .select("title,image_url")
          .eq("id", data.link_id)
          .maybeSingle();
        if (c) { title = c.title; image_url = c.image_url || image_url; }
      } else if (data.link_type === "program") {
        const { data: p } = await supabase
          .from("programs")
          .select("title,banner_image_url")
          .eq("id", data.link_id)
          .maybeSingle();
        if (p) { title = p.title; image_url = p.banner_image_url || image_url; }
      }

      const href =
        data.link_type === "course"
          ? `/courses/${data.link_id}`
          : `/programs/${data.link_id}`;

      setAd({ title, image_url, href });
    })();
  }, []);

  if (!ad) return null;

  return (
    <div className="absolute top-1/2 -translate-y-1/2 -right-2 lg:-right-6 z-10 animate-bounce-soft">
      <Link to={ad.href}>
        <div className="group relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-card/40 hover:ring-secondary/50 transition-all">
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="text-xs font-semibold text-white line-clamp-2">{ad.title}</p>
          </div>
          <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-bold">
            Featured
          </span>
        </div>
      </Link>
    </div>
  );
};
