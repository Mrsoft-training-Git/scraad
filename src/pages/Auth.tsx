import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Sparkles,
  GraduationCap,
  Trophy,
  Users,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MRsoftAttribution } from "@/components/MRsoftAttribution";
import scraadLogo from "@/assets/scraad-logo-official.png";

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Forgot password state
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: { full_name: signupName },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Welcome to the platform. You're now logged in.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Please try again with different credentials.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetSent(true);
      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message || "Please check your email and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const highlights = [
    { icon: GraduationCap, text: "Industry-aligned tracks taught by senior practitioners" },
    { icon: Trophy, text: "Hands-on capstone projects you can showcase to employers" },
    { icon: Users, text: "Active learner community + dedicated mentor support" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* ─── LEFT: Branded panel ─── */}
      <aside className="relative hidden lg:flex lg:w-[42%] xl:w-[44%] flex-col justify-between overflow-hidden bg-[hsl(var(--primary))] text-primary-foreground p-12 xl:p-16">
        {/* Decorative gradients */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-90"
          style={{ background: "var(--hero-gradient)" }}
        />
        <div
          aria-hidden
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl opacity-30"
          style={{ background: "hsl(var(--secondary))" }}
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-20"
          style={{ background: "hsl(var(--accent))" }}
        />
        {/* Subtle grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo + back */}
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-flex flex-col items-start leading-none group bg-white rounded-lg px-3 py-2">
              <img src={scraadLogo} alt="ScraAD" className="h-8 w-auto object-contain" />
              <div className="text-[10px] uppercase tracking-[0.18em] text-foreground/60 mt-1">
                Scratch to Advance
              </div>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
          </div>

          {/* Hero copy */}
          <div className="flex-1 flex flex-col justify-center max-w-md py-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm w-fit mb-6">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              Learn. Build. Advance.
            </div>
            <h1 className="font-heading text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight mb-5">
              Your gateway to a future in tech.
            </h1>
            <p className="text-base text-primary-foreground/75 leading-relaxed mb-10">
              Join thousands of learners building real-world skills through hands-on
              programs, expert instructors, and a supportive community.
            </p>

            <ul className="space-y-4">
              {highlights.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10">
                    <Icon className="h-4 w-4 text-secondary" />
                  </div>
                  <span className="text-sm text-primary-foreground/85 leading-relaxed pt-1.5">
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 text-xs text-primary-foreground/60">
            <span>© {new Date().getFullYear()} ScraAD. All rights reserved.</span>
            <MRsoftAttribution
              textClassName="text-[10px] text-primary-foreground/50"
              logoClassName="h-3.5"
            />
          </div>
        </div>
      </aside>

      {/* ─── RIGHT: Auth form ─── */}
      <main className="flex-1 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-border">
          <Link to="/" className="flex items-center">
            <img src={scraadLogo} alt="ScraAD" className="h-7 w-auto object-contain" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-10 sm:py-14 lg:py-20">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
              <h2 className="font-heading text-3xl sm:text-[34px] font-bold text-foreground tracking-tight">
                {activeTab === "login" && "Welcome back"}
                {activeTab === "signup" && "Create your account"}
                {activeTab === "forgot" && "Reset your password"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {activeTab === "login" &&
                  "Sign in to continue your learning journey."}
                {activeTab === "signup" &&
                  "Start building skills that move your career forward."}
                {activeTab === "forgot" &&
                  "We'll email you a secure reset link."}
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-7 bg-muted/60 p-1 h-11 rounded-xl">
                <TabsTrigger
                  value="login"
                  className="rounded-lg text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-lg text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground"
                >
                  Sign Up
                </TabsTrigger>
                <TabsTrigger
                  value="forgot"
                  className="rounded-lg text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground"
                >
                  Reset
                </TabsTrigger>
              </TabsList>

              {/* ── Login ── */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-sm font-medium">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10 h-11 rounded-lg"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-sm font-medium">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => setActiveTab("forgot")}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 h-11 rounded-lg"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground pt-1">
                    New to ScraAD?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("signup")}
                      className="font-semibold text-primary hover:underline"
                    >
                      Create an account
                    </button>
                  </p>
                </form>
              </TabsContent>

              {/* ── Signup ── */}
              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="text-sm font-medium">
                      Full name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Jane Doe"
                        className="pl-10 h-11 rounded-lg"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-sm font-medium">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10 h-11 rounded-lg"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="6+ characters"
                          className="pl-10 pr-10 h-11 rounded-lg"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="signup-confirm-password"
                        className="text-sm font-medium"
                      >
                        Confirm
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Repeat password"
                          className="pl-10 pr-10 h-11 rounded-lg"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    By creating an account you agree to our{" "}
                    <a href="#" className="text-primary hover:underline">
                      Terms
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </p>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create account"}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground pt-1">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="font-semibold text-primary hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              </TabsContent>

              {/* ── Forgot ── */}
              <TabsContent value="forgot" className="mt-0">
                {resetSent ? (
                  <div className="text-center space-y-5 py-4">
                    <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7 text-success" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Check your email
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        We sent a reset link to{" "}
                        <strong className="text-foreground">{resetEmail}</strong>
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setResetSent(false);
                        setActiveTab("login");
                      }}
                      variant="outline"
                      className="w-full h-11 rounded-lg"
                    >
                      Back to sign in
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="reset-email" className="text-sm font-medium">
                        Email address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10 h-11 rounded-lg"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      disabled={loading}
                    >
                      {loading ? "Sending link..." : "Send reset link"}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground pt-1">
                      Remembered it?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("login")}
                        className="font-semibold text-primary hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Mobile-only attribution */}
        <div className="lg:hidden border-t border-border py-5 px-5">
          <MRsoftAttribution />
        </div>
      </main>
    </div>
  );
};

export default Auth;
