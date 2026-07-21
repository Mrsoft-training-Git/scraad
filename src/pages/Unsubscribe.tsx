import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "validating" | "ready" | "already" | "invalid" | "confirming" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("validating");
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setState("invalid");
          setError(data.error || "This unsubscribe link is invalid or has expired.");
          return;
        }
        if (data.alreadyUnsubscribed || data.already_unsubscribed) {
          setEmail(data.email || "");
          setState("already");
          return;
        }
        setEmail(data.email || "");
        setState("ready");
      } catch {
        setState("invalid");
        setError("Could not validate this link. Please try again.");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setState("confirming");
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON, "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error("Failed");
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card border rounded-xl shadow-sm p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <MailX className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-heading text-2xl font-bold mb-2">Email Preferences</h1>

        {state === "validating" && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Validating your link…
          </div>
        )}

        {state === "ready" && (
          <>
            <p className="text-muted-foreground mb-6">
              Unsubscribe {email && <span className="font-medium text-foreground">{email}</span>} from
              ScraAD emails? You can re-subscribe any time from your account settings.
            </p>
            <Button onClick={confirm} size="lg" className="w-full">Confirm unsubscribe</Button>
          </>
        )}

        {state === "confirming" && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Unsubscribing…
          </div>
        )}

        {(state === "done" || state === "already") && (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <p className="text-muted-foreground mb-6">
              {email && <span className="font-medium text-foreground">{email}</span>} has been
              unsubscribed from ScraAD emails.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Back to home</Link>
            </Button>
          </>
        )}

        {(state === "invalid" || state === "error") && (
          <>
            <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <p className="text-muted-foreground mb-6">
              {error || "This link is invalid or has expired."}
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Back to home</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
