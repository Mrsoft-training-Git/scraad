import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Ad {
  id: string;
  title: string;
  image_url: string;
  link_type: "course" | "program" | "url";
  link_id: string | null;
  link_url: string | null;
}

export const FloatingAd = () => {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    supabase
      .from("ads")
      .select("id,title,image_url,link_type,link_id,link_url")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => data && setAd(data as Ad));
  }, []);

  if (!ad) return null;

  const href =
    ad.link_type === "course" && ad.link_id
      ? `/courses/${ad.link_id}`
      : ad.link_type === "program" && ad.link_id
      ? `/programs/${ad.link_id}`
      : ad.link_url || "#";

  const isExternal = ad.link_type === "url";

  const inner = (
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
  );

  return (
    <div className="absolute top-1/2 -translate-y-1/2 -right-2 lg:-right-6 z-10 animate-bounce-soft">
      {isExternal ? (
        <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>
      ) : (
        <Link to={href}>{inner}</Link>
      )}
    </div>
  );
};
