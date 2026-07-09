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
    <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-40 animate-bounce-soft">
      <Link to={ad.href} className="block">
        <div className="group relative rounded-2xl overflow-hidden shadow-2xl ring-2 ring-card/40 hover:ring-secondary/50 transition-all">
          <img
            src={ad.image_url}
            alt={ad.title}
            className="block w-auto h-auto max-w-[140px] sm:max-w-[180px] max-h-[180px] sm:max-h-[220px] object-contain group-hover:scale-[1.03] transition-transform duration-500"
          />
          <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-bold shadow">
            Apply Now
          </span>

        </div>
      </Link>

    </div>
  );
};
