import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { useZoom, ZoomSignatureData } from "@/hooks/useZoom";

interface ZoomMeetingEmbedProps {
  sessionId: string;
  role: 0 | 1; // 0 = attendee, 1 = host
  userName: string;
  userEmail?: string;
  onMeetingEnd?: () => void;
  zoomFallbackUrl?: string | null;
}

type EmbedStatus = "idle" | "loading" | "active" | "error";

export const ZoomMeetingEmbed = ({
  sessionId,
  role,
  userName,
  userEmail = "",
  onMeetingEnd,
  zoomFallbackUrl,
}: ZoomMeetingEmbedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const [status, setStatus] = useState<EmbedStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { getZoomSignature } = useZoom();

  const destroyClient = useCallback(() => {
    if (clientRef.current) {
      try {
        clientRef.current.endMeeting();
      } catch {
        // ignore
      }
      try {
        clientRef.current.leaveMeeting();
      } catch {
        // ignore
      }
      clientRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      destroyClient();
    };
  }, [destroyClient]);

  const startMeeting = async () => {
    setStatus("loading");
    setStatus("loading");
    setErrorMsg("");

    try {
      // 1. Get signature from backend
      const sigData = await getZoomSignature(sessionId, role);
      if (!sigData) throw new Error("Failed to get meeting credentials");

      // 2. Dynamically import the embedded SDK
      const ZoomMtgEmbedded = (await import("@zoom/meetingsdk/embedded")).default;

      // 3. Create client
      const client = ZoomMtgEmbedded.createClient();
      clientRef.current = client;

      // 4. Init
      await client.init({
        zoomAppRoot: containerRef.current,
        language: "en-US",
        patchJsMedia: true,
        leaveOnPageUnload: true,
      });

      // 5. Join
      await client.join({
        signature: sigData.signature,
        sdkKey: sigData.sdkKey,
        meetingNumber: sigData.meetingNumber,
        password: sigData.password,
        userName,
        userEmail,
      });

      setStatus("active");

      // Listen for meeting end
      client.on("connection-change", (payload: any) => {
        if (payload?.state === "Closed") {
          setStatus("idle");
          onMeetingEnd?.();
        }
      });
    } catch (err: any) {
      console.error("Zoom SDK error:", err);
      setStatus("error");
      setErrorMsg(
        err?.message || "Failed to load the meeting. Try the external link."
      );
    }
  };

  return (
    <Card className="w-full h-full min-h-[400px] md:min-h-[500px] lg:min-h-[600px] bg-muted/50 overflow-hidden">
      {/* Always-mounted container for the SDK to render into */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ display: status === "active" ? "block" : "none", minHeight: status === "active" ? "500px" : undefined }}
      />

      {status !== "active" && (
        <CardContent className="flex items-center justify-center h-full min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
          {status === "idle" && (
            <div className="text-center space-y-4 p-8">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Video className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Meeting Area</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Click the button below to join the meeting directly in your browser.
                </p>
              </div>
              <Button onClick={startMeeting} size="lg">
                <Video className="h-4 w-4 mr-2" />
                {role === 1 ? "Start Meeting" : "Join Meeting"}
              </Button>
              {zoomFallbackUrl && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(zoomFallbackUrl, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open in Zoom app instead
                  </Button>
                </div>
              )}
            </div>
          )}

          {status === "loading" && (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading Zoom meeting...</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4 p-8">
              <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Could not load meeting</h3>
                <p className="text-sm text-muted-foreground max-w-md">{errorMsg}</p>
              </div>
              <div className="flex flex-col gap-2 items-center">
                <Button onClick={startMeeting} variant="outline">
                  Try Again
                </Button>
                {zoomFallbackUrl && (
                  <Button
                    variant="default"
                    onClick={() => window.open(zoomFallbackUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Zoom App
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
