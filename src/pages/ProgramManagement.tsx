import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Check, X, Clock, User, Mail, Phone, FileText, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Program {
  id: string;
  title: string;
  status: string;
  start_date: string | null;
  mode: string;
}

interface Application {
  id: string;
  program_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  experience_level: string | null;
  motivation: string | null;
  cv_url: string | null;
  status: string;
  created_at: string;
}

const ProgramManagement = () => {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchPrograms();
    fetchApplications();
  }, [selectedProgram, statusFilter]);

  const fetchPrograms = async () => {
    const { data } = await supabase.from("programs").select("id, title, status, start_date, mode").order("created_at", { ascending: false });
    if (data) setPrograms(data);
  };

  const fetchApplications = async () => {
    setLoading(true);
    let query = supabase.from("program_applications").select("*").order("created_at", { ascending: false });
    if (selectedProgram !== "all") query = query.eq("program_id", selectedProgram);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    const { data } = await query;
    if (data) setApplications(data);
    setLoading(false);
  };

  const handleAction = async (appId: string, userId: string, programId: string, action: "approved" | "rejected") => {
    setProcessing(appId);
    try {
      const { error } = await supabase.from("program_applications").update({
        status: action,
        reviewed_at: new Date().toISOString(),
      }).eq("id", appId);

      if (error) throw error;

      if (action === "approved") {
        // Auto-enroll the user
        const { error: enrollError } = await supabase.from("program_enrollments").insert({
          program_id: programId,
          user_id: userId,
        });
        if (enrollError && enrollError.code !== "23505") throw enrollError;
      }

      toast({ title: action === "approved" ? "Application approved & user enrolled!" : "Application rejected" });
      fetchApplications();
    } catch (err: any) {
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const getProgramTitle = (programId: string) => programs.find(p => p.id === programId)?.title || "Unknown";

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-secondary/10 text-secondary border-secondary/20",
      approved: "bg-green-500/10 text-green-600 border-green-500/20",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return <Badge className={`capitalize ${styles[status] || ""}`}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Program Management</h1>
            <p className="text-sm text-muted-foreground">Review applications and manage training programs</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Program
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by program" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending", count: applications.filter(a => a.status === "pending").length, color: "text-secondary" },
            { label: "Approved", count: applications.filter(a => a.status === "approved").length, color: "text-green-600" },
            { label: "Rejected", count: applications.filter(a => a.status === "rejected").length, color: "text-destructive" },
          ].map(s => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading applications...</div>
        ) : applications.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="py-12 text-center text-muted-foreground">
              No applications found matching your filters.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map(app => (
              <Card key={app.id} className="border-border/60 hover:border-primary/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{app.full_name}</h3>
                        {statusBadge(app.status)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{getProgramTitle(app.program_id)}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.email}</span>
                        {app.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{app.phone}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(app.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setSelectedApp(app)}>
                        <FileText className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                      {app.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={processing === app.id}
                            onClick={() => handleAction(app.id, app.user_id, app.program_id, "approved")}
                          >
                            {processing === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={processing === app.id}
                            onClick={() => handleAction(app.id, app.user_id, app.program_id, "rejected")}
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>Review the applicant's information</DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground text-xs">Full Name</Label><p className="font-medium">{selectedApp.full_name}</p></div>
                <div><Label className="text-muted-foreground text-xs">Email</Label><p className="font-medium">{selectedApp.email}</p></div>
                <div><Label className="text-muted-foreground text-xs">Phone</Label><p className="font-medium">{selectedApp.phone || "—"}</p></div>
                <div><Label className="text-muted-foreground text-xs">Experience</Label><p className="font-medium capitalize">{selectedApp.experience_level || "—"}</p></div>
              </div>
              <div><Label className="text-muted-foreground text-xs">Program</Label><p className="font-medium">{getProgramTitle(selectedApp.program_id)}</p></div>
              {selectedApp.motivation && (
                <div><Label className="text-muted-foreground text-xs">Motivation</Label><p className="text-sm whitespace-pre-line">{selectedApp.motivation}</p></div>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <div>{statusBadge(selectedApp.status)}</div>
                <p className="text-xs text-muted-foreground">Applied {format(new Date(selectedApp.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
              </div>
              {selectedApp.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={processing === selectedApp.id}
                    onClick={() => { handleAction(selectedApp.id, selectedApp.user_id, selectedApp.program_id, "approved"); setSelectedApp(null); }}
                  >
                    <Check className="w-4 h-4 mr-2" /> Approve & Enroll
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={processing === selectedApp.id}
                    onClick={() => { handleAction(selectedApp.id, selectedApp.user_id, selectedApp.program_id, "rejected"); setSelectedApp(null); }}
                  >
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Program Dialog */}
      <CreateProgramDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onCreated={fetchPrograms} />
    </DashboardLayout>
  );
};

// Simple Create Program Dialog
const CreateProgramDialog = ({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", short_description: "", description: "", duration: "", mode: "physical", location: "", start_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("programs").insert({
        title: form.title.trim(),
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        duration: form.duration.trim() || null,
        mode: form.mode,
        location: form.location.trim() || null,
        start_date: form.start_date || null,
        status: "open",
      });
      if (error) throw error;
      toast({ title: "Program created!" });
      onCreated();
      onOpenChange(false);
      setForm({ title: "", short_description: "", description: "", duration: "", mode: "physical", location: "", start_date: "" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Training Program</DialogTitle>
          <DialogDescription>Set up a new training program for applicants.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
          <div><Label>Short Description</Label><Input value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} /></div>
          <div><Label>Full Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Duration</Label><Input placeholder="e.g. 4 weeks" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} /></div>
            <div>
              <Label>Mode</Label>
              <Select value={form.mode} onValueChange={v => setForm({ ...form, mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create Program
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProgramManagement;
