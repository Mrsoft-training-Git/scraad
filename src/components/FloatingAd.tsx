import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AdView {
  title: string;
  image_url: string;
  href: string;
}

export const FloatingAd = () => {
  const [ads, setAds] = useState<AdView[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ads")
        .select("title,image_url,link_type,link_id")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (!data) return;

      const courseIds = data.filter(a => a.link_type === "course" && a.link_id).map(a => a.link_id!);
      const programIds = data.filter(a => a.link_type === "program" && a.link_id).map(a => a.link_id!);

      const [coursesRes, programsRes] = await Promise.all([
        courseIds.length
          ? supabase.from("courses").select("id,title,image_url").in("id", courseIds)
          : Promise.resolve({ data: [] as any[] }),
        programIds.length
          ? supabase.from("programs").select("id,title,banner_image_url").in("id", programIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const courseMap = new Map((coursesRes.data || []).map((c: any) => [c.id, c]));
      const programMap = new Map((programsRes.data || []).map((p: any) => [p.id, p]));

      const views: AdView[] = data
        .filter(a => a.link_id)
        .map(a => {
          let title = a.title;
          let image_url = a.image_url;
          if (a.link_type === "course") {
            const c = courseMap.get(a.link_id!);
            if (c) { title = c.title; image_url = c.image_url || image_url; }
            return { title, image_url, href: `/courses/${a.link_id}` };
          }
          const p = programMap.get(a.link_id!);
          if (p) { title = p.title; image_url = p.banner_image_url || image_url; }
          return { title, image_url, href: `/programs/${a.link_id}` };
        });

      setAds(views);
    })();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const t = setInterval(() => setIndex(i => (i + 1) % ads.length), 5000);
    return () => clearInterval(t);
  }, [ads.length]);

  if (ads.length === 0) return null;
  const ad = ads[index];

  return (
    <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-40 animate-bounce-soft">
      <Link to={ad.href} className="block">
        <div key={index} className="group relative rounded-2xl overflow-hidden shadow-2xl ring-2 ring-card/40 hover:ring-secondary/50 transition-all animate-fade-in">
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
