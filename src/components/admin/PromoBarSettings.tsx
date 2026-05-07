import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Megaphone } from "lucide-react";

interface PromoSettings {
  enabled: boolean;
  text: string;
  cta_text: string;
  cta_link: string;
  countdown_enabled: boolean;
  countdown_target: string;
}

const DEFAULTS: PromoSettings = {
  enabled: true,
  text: "Limited launch offer — Free trial on all programs",
  cta_text: "Claim now →",
  cta_link: "/auth",
  countdown_enabled: true,
  countdown_target: new Date(Date.now() + 3 * 86400000).toISOString(),
};

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};

export const PromoBarSettings = () => {
  const [settings, setSettings] = useState<PromoSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "promo_bar")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setSettings({ ...DEFAULTS, ...(data.value as unknown as PromoSettings) });
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        [{ key: "promo_bar", value: settings as unknown as Record<string, unknown>, updated_by: user?.id }],
        { onConflict: "key" }
      );
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Promo bar updated." });
    }
  };

  if (loading) return null;

  return (
    <Card className="border border-border/60 shadow-none">
      <CardHeader className="pb-3 px-5 pt-5">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-secondary" /> Promo Bar & Countdown
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0 space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
          <div>
            <p className="text-sm font-medium">Show promo bar</p>
            <p className="text-xs text-muted-foreground">Toggle the top announcement banner.</p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
          <div>
            <p className="text-sm font-medium">Show countdown</p>
            <p className="text-xs text-muted-foreground">Display the timer next to the message.</p>
          </div>
          <Switch
            checked={settings.countdown_enabled}
            onCheckedChange={(v) => setSettings({ ...settings, countdown_enabled: v })}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Message</Label>
          <Input
            value={settings.text}
            onChange={(e) => setSettings({ ...settings, text: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">CTA text</Label>
            <Input
              value={settings.cta_text}
              onChange={(e) => setSettings({ ...settings, cta_text: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">CTA link</Label>
            <Input
              value={settings.cta_link}
              onChange={(e) => setSettings({ ...settings, cta_link: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Countdown target (date & time)</Label>
          <Input
            type="datetime-local"
            value={toLocalInput(settings.countdown_target)}
            onChange={(e) =>
              setSettings({
                ...settings,
                countdown_target: new Date(e.target.value).toISOString(),
              })
            }
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
