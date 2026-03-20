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
  userId: string;
  userEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ProgramApplicationForm = ({ programId, programTitle, userId, userEmail, open, onOpenChange, onSuccess }: Props) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: userEmail,
    phone: "",
    age: "",
    address: "",
    experience_level: "",
    motivation: "",
    guardian_name: "",
    guardian_phone: "",
    guardian_email: "",
    guardian_relationship: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);

  const age = form.age ? parseInt(form.age) : null;
  const isMinor = age !== null && age < 18;
  const guardianRequired = isMinor;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.age || !form.address.trim()) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    if (age !== null && age < 1) {
      toast({ title: "Please enter a valid age", variant: "destructive" });
      return;
    }

    if (guardianRequired && (!form.guardian_name.trim() || !form.guardian_phone.trim())) {
      toast({ title: "Parent/Guardian details are required for applicants under 18", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let cv_url: string | null = null;

      if (cvFile) {
        const ext = cvFile.name.split(".").pop();
        const path = `program-applications/${programId}/${userId}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("cv-uploads")
          .upload(path, cvFile, { upsert: true });
        if (!uploadError) cv_url = path;
      }

      const { error } = await supabase.from("program_applications").insert({
        program_id: programId,
        user_id: userId,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        age: age,
        address: form.address.trim() || null,
        experience_level: form.experience_level || null,
        motivation: form.motivation.trim() || null,
        guardian_name: form.guardian_name.trim() || null,
        guardian_phone: form.guardian_phone.trim() || null,
        guardian_email: form.guardian_email.trim() || null,
        guardian_relationship: form.guardian_relationship || null,
        cv_url,
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "You've already applied to this program", variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Application submitted!", description: "We'll review your application and get back to you." });
        onSuccess();
      }
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {programTitle}</DialogTitle>
          <DialogDescription>Fill out the form below to submit your application.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="age">Age *</Label>
            <Input id="age" type="number" min="10" max="150" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="address">Address *</Label>
            <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </div>

          {/* Parent/Guardian Section */}
          {age !== null && (
            <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-primary" />
                <Label className="text-sm font-semibold">
                  Parent/Guardian Details {guardianRequired ? "*" : "(Optional)"}
                </Label>
              </div>
              {guardianRequired && (
                <p className="text-xs text-muted-foreground">Required for applicants under 18 years old.</p>
              )}
              <div>
                <Label htmlFor="guardian_name">Guardian Full Name {guardianRequired ? "*" : ""}</Label>
                <Input
                  id="guardian_name"
                  value={form.guardian_name}
                  onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                  required={guardianRequired}
                />
              </div>
              <div>
                <Label htmlFor="guardian_phone">Guardian Phone {guardianRequired ? "*" : ""}</Label>
                <Input
                  id="guardian_phone"
                  value={form.guardian_phone}
                  onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })}
                  required={guardianRequired}
                />
              </div>
              <div>
                <Label htmlFor="guardian_email">Guardian Email</Label>
                <Input
                  id="guardian_email"
                  type="email"
                  value={form.guardian_email}
                  onChange={(e) => setForm({ ...form, guardian_email: e.target.value })}
                />
              </div>
              <div>
                <Label>Relationship to Applicant</Label>
                <Select value={form.guardian_relationship} onValueChange={(v) => setForm({ ...form, guardian_relationship: v })}>
                  <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label>Experience Level</Label>
            <Select value={form.experience_level} onValueChange={(v) => setForm({ ...form, experience_level: v })}>
              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
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
          <div>
            <Label htmlFor="cv">Upload CV (optional)</Label>
            <Input id="cv" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Application
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
