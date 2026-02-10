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
  onMeetingStart?: () => void;
  zoomFallbackUrl?: string | null;
  sessionStatus?: string;
}

type EmbedStatus = "idle" | "loading" | "active" | "error";

export const ZoomMeetingEmbed = ({
  sessionId,
  role,
  userName,
  userEmail = "",
  onMeetingEnd,
  onMeetingStart,
  zoomFallbackUrl,
  sessionStatus,
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
      onMeetingStart?.();

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
    <>
      {/* SDK container – fills entire parent; parent controls dimensions */}
      <div
        ref={containerRef}
        style={{
          display: status === "active" ? "block" : "none",
          position: status === "active" ? "absolute" as const : undefined,
          inset: status === "active" ? 0 : undefined,
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      />

      {status !== "active" && (
        <div className="w-full rounded-xl border border-border bg-muted/30 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-center py-10 px-6">
            {status === "idle" && sessionStatus === "ended" && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <Video className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">This session has ended</p>
              </div>
            )}

            {status === "idle" && sessionStatus !== "ended" && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Video className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Ready to connect</p>
                <div className="flex items-center gap-2">
                  <Button onClick={startMeeting} size="default">
                    <Video className="h-4 w-4 mr-2" />
                    {role === 1 ? "Start Meeting" : "Join Meeting"}
                  </Button>
                  {zoomFallbackUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(zoomFallbackUrl, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Zoom App
                    </Button>
                  )}
                </div>
              </div>
            )}

            {status === "loading" && (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Connecting to meeting...</p>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <p className="text-sm text-muted-foreground max-w-sm text-center">{errorMsg}</p>
                <div className="flex items-center gap-2">
                  <Button onClick={startMeeting} variant="outline" size="sm">
                    Try Again
                  </Button>
                  {zoomFallbackUrl && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => window.open(zoomFallbackUrl, "_blank")}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Open in Zoom
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
