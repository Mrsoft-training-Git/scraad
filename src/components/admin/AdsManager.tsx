import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus, Megaphone } from "lucide-react";

type LinkType = "course" | "program" | "url";

interface Ad {
  id: string;
  title: string;
  image_url: string;
  link_type: LinkType;
  link_id: string | null;
  link_url: string | null;
  active: boolean;
  sort_order: number;
}

interface RefItem { id: string; title: string; }

const emptyDraft = {
  title: "",
  image_url: "",
  link_type: "course" as LinkType,
  link_id: "" as string,
  link_url: "",
  active: true,
  sort_order: 0,
};

export const AdsManager = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [courses, setCourses] = useState<RefItem[]>([]);
  const [programs, setPrograms] = useState<RefItem[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [adsRes, coursesRes, programsRes] = await Promise.all([
      supabase.from("ads").select("*").order("sort_order").order("created_at", { ascending: false }),
      supabase.from("courses").select("id,title").order("title"),
      supabase.from("programs").select("id,title").order("title"),
    ]);
    if (adsRes.data) setAds(adsRes.data as Ad[]);
    if (coursesRes.data) setCourses(coursesRes.data as RefItem[]);
    if (programsRes.data) setPrograms(programsRes.data as RefItem[]);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft.title || !draft.image_url) {
      toast({ title: "Title and image URL required", variant: "destructive" });
      return;
    }
    if (draft.link_type !== "url" && !draft.link_id) {
      toast({ title: "Select a course or program", variant: "destructive" });
      return;
    }
    if (draft.link_type === "url" && !draft.link_url) {
      toast({ title: "Enter a URL", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: draft.title,
      image_url: draft.image_url,
      link_type: draft.link_type,
      link_id: draft.link_type === "url" ? null : draft.link_id,
      link_url: draft.link_type === "url" ? draft.link_url : null,
      active: draft.active,
      sort_order: draft.sort_order,
    };
    const { error } = await supabase.from("ads").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save ad", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ad created" });
    setDraft(emptyDraft);
    load();
  };

  const toggleActive = async (ad: Ad) => {
    const { error } = await supabase.from("ads").update({ active: !ad.active }).eq("id", ad.id);
    if (error) return toast({ title: "Failed", variant: "destructive" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this ad?")) return;
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (error) return toast({ title: "Failed", variant: "destructive" });
    load();
  };

  return (
    <Card className="border border-border/60 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Megaphone className="w-4 h-4" /> Ads
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Square ads shown on the landing page. Link each to a course, program, or external URL.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-lg border border-dashed">
          <div className="md:col-span-2">
            <Label>Title</Label>
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. New Data Analysis Cohort" />
          </div>
          <div className="md:col-span-2">
            <Label>Image URL (square recommended)</Label>
            <Input value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} placeholder="https://…" />
          </div>
          <div>
            <Label>Link type</Label>
            <Select value={draft.link_type} onValueChange={(v: LinkType) => setDraft({ ...draft, link_type: v, link_id: "", link_url: "" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="program">Program</SelectItem>
                <SelectItem value="url">External URL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{draft.link_type === "url" ? "URL" : draft.link_type === "course" ? "Course" : "Program"}</Label>
            {draft.link_type === "url" ? (
              <Input value={draft.link_url} onChange={(e) => setDraft({ ...draft, link_url: e.target.value })} placeholder="https://…" />
            ) : (
              <Select value={draft.link_id} onValueChange={(v) => setDraft({ ...draft, link_id: v })}>
                <SelectTrigger><SelectValue placeholder={`Select a ${draft.link_type}`} /></SelectTrigger>
                <SelectContent>
                  {(draft.link_type === "course" ? courses : programs).map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label>Sort order</Label>
            <Input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} />
            <span className="text-sm">Active</span>
          </div>
          <div className="md:col-span-2">
            <Button onClick={save} disabled={saving} className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Create Ad
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {ads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No ads yet.</p>
          ) : ads.map((ad) => {
            const linkLabel = ad.link_type === "url"
              ? ad.link_url
              : ad.link_type === "course"
                ? courses.find(c => c.id === ad.link_id)?.title
                : programs.find(p => p.id === ad.link_id)?.title;
            return (
              <div key={ad.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <img src={ad.image_url} alt={ad.title} className="w-14 h-14 rounded-md object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ad.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {ad.link_type} → {linkLabel || "—"}
                  </p>
                </div>
                <Switch checked={ad.active} onCheckedChange={() => toggleActive(ad)} />
                <Button size="icon" variant="ghost" onClick={() => remove(ad.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
