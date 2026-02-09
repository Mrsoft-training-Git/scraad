import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, CheckCircle, RefreshCw, Loader2, ChevronDown } from "lucide-react";
import { useZoom } from "@/hooks/useZoom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const ZoomConnectionStatus = () => {
  const { isConnected, zoomConnection, loading, connecting, connectZoom } = useZoom();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <Card className="border border-border/60 shadow-none">
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Video className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Zoom Integration</p>
          </div>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-border/60 shadow-none overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Video className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Zoom Integration</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isConnected ? "Connected" : "Not connected"}
              </p>
            </div>
            {isConnected ? (
              <Badge variant="default" className="bg-green-600/90 hover:bg-green-700 text-[10px] px-2 py-0.5 flex-shrink-0">
                <CheckCircle className="h-2.5 w-2.5 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 flex-shrink-0">
                Inactive
              </Badge>
            )}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-5 pb-4 pt-0 border-t border-border/40">
            <div className="pt-3">
              {isConnected ? (
                <div className="space-y-3">
                  {zoomConnection?.zoom_email && (
                    <p className="text-xs text-muted-foreground">
                      Linked to <span className="font-medium text-foreground">{zoomConnection.zoom_email}</span>
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={connectZoom}
                    disabled={connecting}
                    className="h-8 text-xs"
                  >
                    {connecting ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Reconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Connect your Zoom account to schedule and host live classes.
                  </p>
                  <Button
                    onClick={connectZoom}
                    disabled={connecting}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    {connecting ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Video className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Connect Zoom
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
