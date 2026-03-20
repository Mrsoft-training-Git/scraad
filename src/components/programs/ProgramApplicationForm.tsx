import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
  });
  const [cvFile, setCvFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let cv_url: string | null = null;

      // Upload CV if provided
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
        experience_level: form.experience_level || null,
        motivation: form.motivation.trim() || null,
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
            <Input id="age" type="number" min="1" max="150" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="address">Address *</Label>
            <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </div>
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
