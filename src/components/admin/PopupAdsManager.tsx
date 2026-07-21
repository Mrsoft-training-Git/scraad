import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Trash2, Upload, MonitorPlay, Loader2 } from "lucide-react";

interface PopupAd {
  id: string;
  image_url: string;
  link_url: string;
  active: boolean;
  created_at: string;
}

export const PopupAdsManager = () => {
  const [ads, setAds] = useState<PopupAd[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("popup_ads")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAds(data as PopupAd[]);
  };

  useEffect(() => { load(); }, []);

  const onFile = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const save = async () => {
    if (!file) return toast({ title: "Select an image", variant: "destructive" });
    if (!linkUrl.trim()) return toast({ title: "Enter a redirect URL", variant: "destructive" });
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `popup-ads/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("program-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("program-images").getPublicUrl(path);
      const { error } = await supabase.from("popup_ads").insert({
        image_url: pub.publicUrl,
        link_url: linkUrl.trim(),
        active: true,
      });
      if (error) throw error;
      toast({ title: "Popup ad created" });
      setLinkUrl(""); setFile(null); setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
      load();
    } catch (e: any) {
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const toggle = async (ad: PopupAd) => {
    await supabase.from("popup_ads").update({ active: !ad.active }).eq("id", ad.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this popup ad?")) return;
    await supabase.from("popup_ads").delete().eq("id", id);
    load();
  };

  return (
    <Card className="border border-border/60 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <MonitorPlay className="w-4 h-4" /> Popup Ads
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Upload an image and add a redirect URL. The whole image will be clickable and shown as a popup on the homepage.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 p-4 rounded-lg border border-dashed">
          <div>
            <Label>Image</Label>
            <Input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
          </div>
          {preview && (
            <img src={preview} alt="Preview" className="max-h-48 rounded-md object-contain bg-muted/40" />
          )}
          <div>
            <Label>Redirect URL</Label>
            <Input
              placeholder="https://example.com/apply"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>
          <Button onClick={save} disabled={uploading} className="w-full">
            {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
            Create Popup Ad
          </Button>
        </div>

        <div className="space-y-2">
          {ads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No popup ads yet.</p>
          ) : ads.map((ad) => (
            <div key={ad.id} className="flex items-center gap-3 p-3 rounded-lg border">
              <img src={ad.image_url} alt="Ad" className="w-14 h-14 rounded-md object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{ad.link_url}</p>
              </div>
              <Switch checked={ad.active} onCheckedChange={() => toggle(ad)} />
              <Button size="icon" variant="ghost" onClick={() => remove(ad.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
