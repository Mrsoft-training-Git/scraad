import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { format } from "date-fns";
import { Check, X, Clock, Mail, Phone, FileText, Loader2, Plus, ImagePlus, Pencil, MapPin, Calendar, Users } from "lucide-react";

interface FullProgram {
  id: string; title: string; status: string; start_date: string | null; mode: string;
  short_description: string | null; description: string | null; duration: string | null;
  location: string | null; banner_image_url: string | null; created_at: string;
  max_participants: number | null; learning_outcomes: string[] | null; requirements: string[] | null;
  track: string | null; instructor_id: string | null; instructor_name: string | null;
}
interface Application { id: string; program_id: string; user_id: string; full_name: string; email: string; phone: string | null; experience_level: string | null; motivation: string | null; cv_url: string | null; status: string; created_at: string; }
interface InstructorOption { id: string; full_name: string | null; email: string | null; }

const ProgramManagement = () => {
  const { toast } = useToast();
  const { user, profile, userRole, loading: authLoading } = useDashboardAuth();
  const [programs, setPrograms] = useState<FullProgram[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<FullProgram | null>(null);

  useEffect(() => { if (!authLoading) { fetchPrograms(); fetchApplications(); } }, [authLoading, selectedProgram, statusFilter]);

  const fetchPrograms = async () => {
    const { data } = await supabase.from("programs").select("*").order("created_at", { ascending: false });
    if (data) setPrograms(data as FullProgram[]);
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
      const { error } = await supabase.from("program_applications").update({ status: action, reviewed_at: new Date().toISOString() }).eq("id", appId);
      if (error) throw error;
      if (action === "approved") {
        const { error: enrollError } = await supabase.from("program_enrollments").insert({ program_id: programId, user_id: userId });
        if (enrollError && enrollError.code !== "23505") throw enrollError;
      }
      toast({ title: action === "approved" ? "Application approved & user enrolled!" : "Application rejected" });
      fetchApplications();
    } catch (err: any) {
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
    } finally { setProcessing(null); }
  };

  const getProgramTitle = (pid: string) => programs.find(p => p.id === pid)?.title || "Unknown";
  const statusBadge = (status: string) => {
    const s: Record<string, string> = { pending: "bg-secondary/10 text-secondary border-secondary/20", approved: "bg-green-500/10 text-green-600 border-green-500/20", rejected: "bg-destructive/10 text-destructive border-destructive/20" };
    return <Badge className={`capitalize ${s[status] || ""}`}>{status}</Badge>;
  };
  const programStatusBadge = (status: string) => {
    const s: Record<string, string> = { open: "bg-green-500/10 text-green-600 border-green-500/20", ongoing: "bg-secondary/10 text-secondary border-secondary/20", closed: "bg-muted text-muted-foreground border-border" };
    return <Badge className={`capitalize ${s[status] || ""}`}>{status}</Badge>;
  };

  if (authLoading) return null;

  // Instructor view: show only assigned programs with manage link
  if (userRole === "instructor") {
    const assignedPrograms = programs.filter(p => p.instructor_id === user?.id);
    return (
      <DashboardLayout user={user} userRole={userRole} profile={profile}>
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">My Programs</h1>
            <p className="text-sm text-muted-foreground">Programs assigned to you</p>
          </div>
          {assignedPrograms.length === 0 ? (
            <Card className="border-border/60"><CardContent className="py-12 text-center text-muted-foreground">No programs assigned to you yet.</CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {assignedPrograms.map(program => (
                <Card key={program.id} className="border-border/60 overflow-hidden hover:border-primary/20 transition-colors">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {program.banner_image_url && (
                        <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0">
                          <img src={program.banner_image_url} alt={program.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg truncate">{program.title}</h3>
                              {programStatusBadge(program.status)}
                            </div>
                            {program.short_description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{program.short_description}</p>}
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {program.track && <Badge variant="secondary" className="text-xs">{program.track}</Badge>}
                              {program.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{program.duration}</span>}
                            </div>
                          </div>
                          <Button size="sm" asChild>
                            <Link to={`/dashboard/programs/${program.id}/manage`}>Manage</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} userRole={userRole} profile={profile}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Program Management</h1>
            <p className="text-sm text-muted-foreground">Manage training programs and review applications</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}><Plus className="w-4 h-4 mr-2" /> Create Program</Button>
        </div>

        <Tabs defaultValue="programs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="programs">Programs ({programs.length})</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="programs" className="space-y-4">
            {programs.length === 0 ? (
              <Card className="border-border/60"><CardContent className="py-12 text-center text-muted-foreground">No programs created yet.</CardContent></Card>
            ) : (
              <div className="grid gap-4">
                {programs.map(program => (
                  <Card key={program.id} className="border-border/60 overflow-hidden hover:border-primary/20 transition-colors">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        {program.banner_image_url && (
                          <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0">
                            <img src={program.banner_image_url} alt={program.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg truncate">{program.title}</h3>
                                {programStatusBadge(program.status)}
                              </div>
                              {program.short_description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{program.short_description}</p>
                              )}
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                {program.track && (
                                  <Badge variant="secondary" className="text-xs">{program.track}</Badge>
                                )}
                                {program.instructor_name && (
                                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />Instructor: {program.instructor_name}</span>
                                )}
                                {program.mode && (
                                  <span className="capitalize flex items-center gap-1">
                                    <Users className="w-3 h-3" />{program.mode}
                                  </span>
                                )}
                                {program.location && (
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{program.location}</span>
                                )}
                                {program.duration && (
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{program.duration}</span>
                                )}
                                {program.start_date && (
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(program.start_date), "MMM d, yyyy")}</span>
                                )}
                              </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setEditingProgram(program)}>
                              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
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

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading applications...</div>
            ) : applications.length === 0 ? (
              <Card className="border-border/60"><CardContent className="py-12 text-center text-muted-foreground">No applications found.</CardContent></Card>
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
                          <Button size="sm" variant="outline" onClick={() => setSelectedApp(app)}><FileText className="w-3.5 h-3.5 mr-1" /> View</Button>
                          {app.status === "pending" && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={processing === app.id} onClick={() => handleAction(app.id, app.user_id, app.program_id, "approved")}>
                                {processing === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}Approve
                              </Button>
                              <Button size="sm" variant="destructive" disabled={processing === app.id} onClick={() => handleAction(app.id, app.user_id, app.program_id, "rejected")}>
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Application Details Dialog */}
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
              {selectedApp.motivation && <div><Label className="text-muted-foreground text-xs">Motivation</Label><p className="text-sm whitespace-pre-line">{selectedApp.motivation}</p></div>}
              <div className="flex items-center justify-between pt-2 border-t">
                <div>{statusBadge(selectedApp.status)}</div>
                <p className="text-xs text-muted-foreground">Applied {format(new Date(selectedApp.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
              </div>
              {selectedApp.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={processing === selectedApp.id} onClick={() => { handleAction(selectedApp.id, selectedApp.user_id, selectedApp.program_id, "approved"); setSelectedApp(null); }}>
                    <Check className="w-4 h-4 mr-2" /> Approve & Enroll
                  </Button>
                  <Button variant="destructive" className="flex-1" disabled={processing === selectedApp.id} onClick={() => { handleAction(selectedApp.id, selectedApp.user_id, selectedApp.program_id, "rejected"); setSelectedApp(null); }}>
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CreateProgramDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onCreated={fetchPrograms} />
      <EditProgramDialog program={editingProgram} onOpenChange={() => setEditingProgram(null)} onUpdated={fetchPrograms} />
    </DashboardLayout>
  );
};

/* ─── Image Upload Field ─── */
const ImageUploadField = ({ imagePreview, onImageChange, onClear }: { imagePreview: string | null; onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onClear: () => void }) => (
  <div>
    <Label>Banner Image</Label>
    <div className="mt-1.5">
      {imagePreview ? (
        <div className="relative group">
          <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-border" />
          <button type="button" onClick={onClear} className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/40 transition-colors bg-muted/30">
          <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Click to upload banner image</span>
          <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
        </label>
      )}
    </div>
  </div>
);

/* ─── Program Form Fields ─── */
const ProgramFormFields = ({ form, setForm, instructors }: { form: any; setForm: (f: any) => void; instructors?: InstructorOption[] }) => (
  <>
    <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
    <div><Label>Track *</Label><Input placeholder="e.g. Python Programming" value={form.track} onChange={e => setForm({ ...form, track: e.target.value })} required /></div>
    <div><Label>Short Description</Label><Input value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} /></div>
    <div><Label>Full Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
    <div className="grid grid-cols-2 gap-4">
      <div><Label>Duration</Label><Input placeholder="e.g. 4 weeks" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} /></div>
      <div><Label>Mode</Label>
        <Select value={form.mode} onValueChange={v => setForm({ ...form, mode: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="physical">Physical</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
      <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
    </div>
    {instructors && (
      <div><Label>Assign Instructor</Label>
        <Select value={form.instructor_id || "none"} onValueChange={v => {
          const inst = instructors.find(i => i.id === v);
          setForm({ ...form, instructor_id: v === "none" ? "" : v, instructor_name: inst ? (inst.full_name || inst.email || "") : "" });
        }}>
          <SelectTrigger><SelectValue placeholder="Select instructor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No instructor</SelectItem>
            {instructors.map(inst => (
              <SelectItem key={inst.id} value={inst.id}>{inst.full_name || inst.email || inst.id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )}
    <div><Label>Price (₦) *</Label><Input type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" /></div>
    <div className="flex items-center gap-2">
      <input type="checkbox" id="allows_part_payment" checked={form.allows_part_payment} onChange={e => setForm({ ...form, allows_part_payment: e.target.checked })} className="rounded border-border" />
      <Label htmlFor="allows_part_payment">Allow Part Payment (Installments)</Label>
    </div>
    {form.allows_part_payment && (
      <div className="grid grid-cols-2 gap-4">
        <div><Label>First Tranche (₦)</Label><Input type="number" min="0" value={form.first_tranche_amount} onChange={e => setForm({ ...form, first_tranche_amount: e.target.value })} /></div>
        <div><Label>Second Tranche (₦)</Label><Input type="number" min="0" value={form.second_tranche_amount} onChange={e => setForm({ ...form, second_tranche_amount: e.target.value })} /></div>
      </div>
    )}
    {form.allows_part_payment && (
      <div><Label>Second Payment Due (days after first)</Label><Input type="number" min="1" value={form.second_payment_due_days} onChange={e => setForm({ ...form, second_payment_due_days: e.target.value })} placeholder="30" /></div>
    )}
    <div><Label>Status</Label>
      <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="ongoing">Ongoing</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent>
      </Select>
    </div>
  </>
);

/* ─── Upload Helper ─── */
const uploadBannerImage = async (imageFile: File) => {
  const fileExt = imageFile.name.split(".").pop();
  const filePath = `${crypto.randomUUID()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage.from("program-images").upload(filePath, imageFile);
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from("program-images").getPublicUrl(filePath);
  return urlData.publicUrl;
};

/* ─── Create Program Dialog ─── */
const CreateProgramDialog = ({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [form, setForm] = useState({ title: "", short_description: "", description: "", duration: "", mode: "physical", location: "", start_date: "", status: "open", price: "0", allows_part_payment: false, first_tranche_amount: "", second_tranche_amount: "", second_payment_due_days: "", instructor_id: "", instructor_name: "" });

  useEffect(() => {
    if (open) fetchInstructors();
  }, [open]);

  const fetchInstructors = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "instructor");
    if (!roles || roles.length === 0) return;
    const ids = roles.map(r => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
    if (profiles) setInstructors(profiles as InstructorOption[]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const bannerUrl = imageFile ? await uploadBannerImage(imageFile) : null;
      const { error } = await supabase.from("programs").insert({
        title: form.title.trim(), short_description: form.short_description.trim() || null, description: form.description.trim() || null,
        duration: form.duration.trim() || null, mode: form.mode, location: form.location.trim() || null, start_date: form.start_date || null, status: form.status,
        banner_image_url: bannerUrl, price: parseFloat(form.price) || 0, allows_part_payment: form.allows_part_payment,
        first_tranche_amount: form.allows_part_payment && form.first_tranche_amount ? parseInt(form.first_tranche_amount) : null,
        second_tranche_amount: form.allows_part_payment && form.second_tranche_amount ? parseInt(form.second_tranche_amount) : null,
        second_payment_due_days: form.allows_part_payment && form.second_payment_due_days ? parseInt(form.second_payment_due_days) : null,
        
        instructor_id: form.instructor_id || null, instructor_name: form.instructor_name.trim() || null,
      });
      if (error) throw error;
      toast({ title: "Program created!" });
      onCreated();
      onOpenChange(false);
      setForm({ title: "", short_description: "", description: "", duration: "", mode: "physical", location: "", start_date: "", status: "open", price: "0", allows_part_payment: false, first_tranche_amount: "", second_tranche_amount: "", second_payment_due_days: "", instructor_id: "", instructor_name: "" });
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Training Program</DialogTitle><DialogDescription>Set up a new training program.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUploadField imagePreview={imagePreview} onImageChange={handleImageChange} onClear={() => { setImageFile(null); setImagePreview(null); }} />
          <ProgramFormFields form={form} setForm={setForm} instructors={instructors} />
          <Button type="submit" className="w-full" disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create Program</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ─── Edit Program Dialog ─── */
const EditProgramDialog = ({ program, onOpenChange, onUpdated }: { program: FullProgram | null; onOpenChange: () => void; onUpdated: () => void }) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [form, setForm] = useState({ title: "", short_description: "", description: "", duration: "", mode: "physical", location: "", start_date: "", status: "open", price: "0", allows_part_payment: false, first_tranche_amount: "", second_tranche_amount: "", second_payment_due_days: "", instructor_id: "", instructor_name: "" });

  useEffect(() => {
    if (program) {
      setForm({
        title: program.title || "",
        short_description: program.short_description || "",
        description: program.description || "",
        duration: program.duration || "",
        mode: program.mode || "physical",
        location: program.location || "",
        start_date: program.start_date || "",
        status: program.status || "open",
        price: String((program as any).price || "0"),
        allows_part_payment: (program as any).allows_part_payment || false,
        first_tranche_amount: String((program as any).first_tranche_amount || ""),
        second_tranche_amount: String((program as any).second_tranche_amount || ""),
        second_payment_due_days: String((program as any).second_payment_due_days || ""),
        
        instructor_id: program.instructor_id || "",
        instructor_name: program.instructor_name || "",
      });
      setImagePreview(program.banner_image_url || null);
      setImageFile(null);
      fetchInstructors();
    }
  }, [program]);

  const fetchInstructors = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "instructor");
    if (!roles || roles.length === 0) return;
    const ids = roles.map(r => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
    if (profiles) setInstructors(profiles as InstructorOption[]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !form.title.trim()) return;
    setSubmitting(true);
    try {
      let bannerUrl = program.banner_image_url;
      if (imageFile) {
        bannerUrl = await uploadBannerImage(imageFile);
      }

      const { error } = await supabase.from("programs").update({
        title: form.title.trim(), short_description: form.short_description.trim() || null, description: form.description.trim() || null,
        duration: form.duration.trim() || null, mode: form.mode, location: form.location.trim() || null, start_date: form.start_date || null, status: form.status,
        banner_image_url: bannerUrl, price: parseFloat(form.price) || 0, allows_part_payment: form.allows_part_payment,
        first_tranche_amount: form.allows_part_payment && form.first_tranche_amount ? parseInt(form.first_tranche_amount) : null,
        second_tranche_amount: form.allows_part_payment && form.second_tranche_amount ? parseInt(form.second_tranche_amount) : null,
        second_payment_due_days: form.allows_part_payment && form.second_payment_due_days ? parseInt(form.second_payment_due_days) : null,
        
        instructor_id: form.instructor_id || null, instructor_name: form.instructor_name.trim() || null,
      }).eq("id", program.id);
      if (error) throw error;
      toast({ title: "Program updated!" });
      onUpdated();
      onOpenChange();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={!!program} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Program</DialogTitle><DialogDescription>Update program details.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUploadField imagePreview={imagePreview} onImageChange={handleImageChange} onClear={() => { setImageFile(null); setImagePreview(null); }} />
          <ProgramFormFields form={form} setForm={setForm} instructors={instructors} />
          <Button type="submit" className="w-full" disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Changes</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProgramManagement;
