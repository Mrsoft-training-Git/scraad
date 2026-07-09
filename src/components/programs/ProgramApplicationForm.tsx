import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldAlert } from "lucide-react";

interface Props {
  programId: string;
  programTitle: string;
  userId: string | null;
  userEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ProgramApplicationForm = ({ programId, programTitle, userId, userEmail, open, onOpenChange, onSuccess }: Props) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const isAuthenticated = !!userId;
  const [password, setPassword] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: userEmail,
    phone: "",
    age: "",
    country: "Nigeria",
    gender: "",
    address: "",
    motivation: "",
    guardian_name: "",
    guardian_phone: "",
  });

  const age = form.age ? parseInt(form.age) : null;
  const isMinor = age !== null && age < 18;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${form.first_name} ${form.last_name}`.trim();

    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim() || !form.phone.trim() || !form.age || !form.country.trim() || !form.gender || !form.address.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (age !== null && age < 1) {
      toast({ title: "Please enter a valid age", variant: "destructive" });
      return;
    }

    if (!form.guardian_name.trim() || !form.guardian_phone.trim()) {
      toast({
        title: isMinor ? "Guardian details required" : "Guardian details required",
        description: "Please provide a guardian name and phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated && password.length < 6) {
      toast({ title: "Please choose a password (min 6 characters) to create your account", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let effectiveUserId = userId;

      if (!isAuthenticated) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard/learning`,
            data: { full_name: fullName },
          },
        });
        if (signUpError) {
          if (signUpError.message?.toLowerCase().includes("registered")) {
            toast({
              title: "Email already registered",
              description: "Please log in first, then apply.",
              variant: "destructive",
            });
          } else {
            throw signUpError;
          }
          setSubmitting(false);
          return;
        }
        effectiveUserId = signUpData.user?.id ?? null;
        if (!effectiveUserId) {
          throw new Error("Account created but session unavailable. Please log in and try again.");
        }
      }

      const { error } = await supabase.from("program_applications").upsert({
        program_id: programId,
        user_id: effectiveUserId,
        full_name: fullName,
        email: form.email.trim(),
        phone: form.phone.trim(),
        age,
        address: form.address.trim(),
        motivation: form.motivation.trim() || null,
        guardian_name: form.guardian_name.trim(),
        guardian_phone: form.guardian_phone.trim(),
        status: "pending",
      }, { onConflict: "program_id,user_id" });

      if (error) throw error;

      // Persist basic details on profile for logged-in users
      if (effectiveUserId) {
        await supabase.from("profiles").update({
          full_name: fullName,
          email: form.email.trim(),
          phone: form.phone.trim(),
          country: form.country.trim(),
          gender: form.gender,
          education_level: form.education_level,
        }).eq("id", effectiveUserId);
      }

      toast({
        title: "Application submitted!",
        description: isAuthenticated
          ? "We'll review your application and get back to you."
          : "Check your email to confirm your account, then log in to complete payment and access your program.",
      });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {programTitle}</DialogTitle>
          <DialogDescription>Fill out the form below to submit your application.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <h3 className="font-heading text-lg font-bold">Personal Information</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input id="first_name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input id="last_name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={isAuthenticated} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234 xxx xxx xxxx" required />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country of Residence *</Label>
              <Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input id="age" type="number" min="1" max="150" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Education Level *</Label>
              <Select value={form.education_level} onValueChange={(v) => setForm({ ...form, education_level: v })}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="secondary">Secondary School</SelectItem>
                  <SelectItem value="diploma">Diploma / OND</SelectItem>
                  <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                  <SelectItem value="masters">Master's Degree</SelectItem>
                  <SelectItem value="doctorate">Doctorate / PhD</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </div>

          {/* Guardian */}
          <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <Label className="text-sm font-semibold">Parent / Guardian Details *</Label>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guardian_name">Guardian Full Name *</Label>
                <Input
                  id="guardian_name"
                  value={form.guardian_name}
                  onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_phone">Guardian Phone *</Label>
                <Input
                  id="guardian_phone"
                  value={form.guardian_phone}
                  onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivation">Why do you want to join? (Short essay)</Label>
            <Textarea
              id="motivation"
              value={form.motivation}
              onChange={(e) => setForm({ ...form, motivation: e.target.value })}
              rows={4}
              maxLength={1000}
              placeholder="Tell us about your motivation and what you hope to gain..."
            />
          </div>

          {!isAuthenticated && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
              <Label htmlFor="new_password" className="text-sm font-semibold">Create a password *</Label>
              <p className="text-xs text-muted-foreground">
                We'll create your student account so you can log in later to complete payment and access the program.
              </p>
              <Input
                id="new_password"
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Application
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
