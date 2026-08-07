import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type OtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change";

const AuthConfirm = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenHash = params.get("token_hash");
    const type = (params.get("type") || "signup") as OtpType;
    const next = params.get("next") || (type === "recovery" ? "/reset-password" : "/email-verified");

    const run = async () => {
      if (!tokenHash) {
        setError("This link is missing its verification token. Please request a new email.");
        return;
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });

      if (verifyError) {
        setError(
          verifyError.message ||
            "This link is invalid or has expired. Please request a new email.",
        );
        return;
      }

      navigate(next, { replace: true });
    };

    run();
  }, [params, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-card border border-border rounded-xl p-8 shadow-lg text-center space-y-4">
            {error ? (
              <>
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  Link not valid
                </h1>
                <p className="text-muted-foreground">{error}</p>
                <Button className="w-full" onClick={() => navigate("/auth")}>
                  Go to login
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  Verifying your link…
                </h1>
                <p className="text-muted-foreground">This only takes a moment.</p>
              </>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default AuthConfirm;
