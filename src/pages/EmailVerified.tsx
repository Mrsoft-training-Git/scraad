import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const EmailVerified = () => {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Email verified — ScraAD";
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const signOutAndLogin = async () => {
    await supabase.auth.signOut();
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-16">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-10 pb-8 px-6 space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-9 w-9 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Email verified successfully</h1>
          <p className="text-muted-foreground">
            {email ? (
              <>
                Your email <span className="font-medium text-foreground">{email}</span> has been
                confirmed. You can now log in and start learning.
              </>
            ) : (
              <>Your email address has been confirmed. You can now log in and start learning.</>
            )}
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full" size="lg" onClick={signOutAndLogin}>
              <Link to="/auth">Go to login</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default EmailVerified;
