import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useZoom } from "@/hooks/useZoom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const ZoomCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useZoom();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      return;
    }

    handleOAuthCallback(code).then((success) => {
      setStatus(success ? "success" : "error");
      if (success) {
        setTimeout(() => navigate("/dashboard/classes"), 2000);
      }
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="text-lg text-muted-foreground">Connecting your Zoom account...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-10 w-10 mx-auto text-green-600" />
            <p className="text-lg">Zoom connected! Redirecting...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-10 w-10 mx-auto text-destructive" />
            <p className="text-lg">Failed to connect Zoom.</p>
            <a href="/dashboard/classes" className="text-primary underline">Return to Dashboard</a>
          </>
        )}
      </div>
    </div>
  );
};

export default ZoomCallback;
