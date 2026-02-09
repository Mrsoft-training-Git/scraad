import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const ZoomCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      setStatus("error");
      return;
    }

    // Call the edge function with code and state (JWT token)
    supabase.functions
      .invoke("zoom-oauth-callback", {
        method: "POST",
        body: { code, state },
      })
      .then(({ error }) => {
        if (error) {
          console.error("OAuth callback error:", error);
          setStatus("error");
        } else {
          setStatus("success");
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
