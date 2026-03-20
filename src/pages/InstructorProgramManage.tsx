import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { format } from "date-fns";
import {
  ArrowLeft, BookOpen, ClipboardList, FileText, Users, Video,
  Plus, Loader2, Pencil, Trash2, CheckCircle, Clock, Calendar,
} from "lucide-react";

const InstructorProgramManage = () => {
  const { programId } = useParams();
  const { toast } = useToast();
  const { user, profile, userRole, loading: authLoading } = useDashboardAuth();
  const [program, setProgram] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog states
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);

  useEffect(() => {
    if (programId && user) fetchAll();
  }, [programId, user]);

  const fetchAll = async () => {
    if (!user || !programId) return;
    setLoading(true);
    const [progRes, modRes, matRes, asgRes, subRes, examRes, enrollRes, sessRes] = await Promise.all([
      supabase.from("programs").select("*").eq("id", programId).single(),
      supabase.from("program_modules").select("*").eq("program_id", programId).order("order_index"),
      supabase.from("program_materials").select("*").eq("program_id", programId).order("order_index"),
      supabase.from("program_assignments").select("*").eq("program_id", programId).order("created_at"),
      supabase.from("program_submissions").select("*, program_assignments(title)"),
      supabase.from("program_exams").select("*").eq("program_id", programId),
      supabase.from("program_enrollments").select("*, profiles:user_id(full_name, email)").eq("program_id", programId),
      supabase.from("live_sessions").select("*").eq("instructor_id", user.id).is("course_id", null).order("scheduled_at", { ascending: false }),
    ]);
    if (progRes.data) setProgram(progRes.data);
    if (modRes.data) setModules(modRes.data);
    if (matRes.data) setMaterials(matRes.data);
    if (asgRes.data) setAssignments(asgRes.data);
    if (subRes.data) setSubmissions(subRes.data);
    if (examRes.data) setExams(examRes.data);
    if (enrollRes.data) setEnrollments(enrollRes.data);
    if (sessRes.data) setSessions(sessRes.data);
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout user={user} userRole={userRole} profile={profile}>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading program...
        </div>
      </DashboardLayout>
    );
  }

  if (!program) {
    return (
      <DashboardLayout user={user} userRole={userRole} profile={profile}>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold mb-2">Program Not Found</h2>
          <Button asChild><Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Dashboard</Link></Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} userRole={userRole} profile={profile}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
            <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Link>
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">{program.title}</h1>
              <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                
                <Badge className="capitalize">{program.status}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Modules", value: modules.length, icon: BookOpen },
            { label: "Materials", value: materials.length, icon: FileText },
            { label: "Assignments", value: assignments.length, icon: ClipboardList },
            { label: "Students", value: enrollments.length, icon: Users },
            { label: "Sessions", value: sessions.length, icon: Video },
          ].map(s => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-3 flex items-center gap-2">
                <s.icon className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">Modules</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="sessions">Live Sessions</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          {/* Modules & Materials */}
          <TabsContent value="overview" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Modules & Materials</h3>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setShowModuleDialog(true)}><Plus className="w-4 h-4 mr-1" />Module</Button>
                <Button size="sm" variant="outline" onClick={() => setShowMaterialDialog(true)}><Plus className="w-4 h-4 mr-1" />Material</Button>
              </div>
            </div>
            {modules.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No modules yet. Create one to get started.</p>
            ) : (
              modules.map(mod => (
                <Card key={mod.id} className="border-l-4 border-l-primary border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{mod.title}</h4>
                        {mod.description && <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>}
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setEditingModule(mod)}><Pencil className="w-3.5 h-3.5" /></Button>
                    </div>
                    {/* Materials under this module */}
                    {materials.filter(m => m.module_id === mod.id).length > 0 && (
                      <div className="mt-3 space-y-2 pl-4 border-l-2 border-border">
                        {materials.filter(m => m.module_id === mod.id).map(mat => (
                          <div key={mat.id} className="flex items-center gap-2 text-sm">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{mat.title}</span>
                            <Badge variant="outline" className="text-[10px]">{mat.material_type}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Assignments</h3>
              <Button size="sm" onClick={() => setShowAssignmentDialog(true)}><Plus className="w-4 h-4 mr-1" />Assignment</Button>
            </div>
            {assignments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No assignments created yet.</p>
            ) : (
              assignments.map(a => {
                const subs = submissions.filter((s: any) => s.assignment_id === a.id);
                return (
                  <Card key={a.id} className="border-border/60">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{a.title}</h4>
                          {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                          <div className="flex gap-2 mt-2">
                            <Badge variant={a.is_published ? "default" : "outline"}>{a.is_published ? "Published" : "Draft"}</Badge>
                            {a.due_date && <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />Due {format(new Date(a.due_date), "MMM d")}</Badge>}
                            <Badge variant="secondary" className="text-xs">{subs.length} submissions</Badge>
                          </div>
                        </div>
                      </div>
                      {/* Submissions */}
                      {subs.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {subs.map((sub: any) => (
                            <GradeSubmission key={sub.id} submission={sub} maxScore={a.max_score || 100} onGraded={fetchAll} />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Exams */}
          <TabsContent value="exams" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">CBT Exams</h3>
              <Button size="sm" asChild>
                <Link to={`/dashboard/cbt/create?programId=${programId}`}><Plus className="w-4 h-4 mr-1" />Create Exam</Link>
              </Button>
            </div>
            {exams.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No exams yet. Create one from CBT Exams.</p>
            ) : (
              exams.map(exam => (
                <Card key={exam.id} className="border-border/60">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{exam.title}</h4>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={exam.is_published ? "default" : "outline"}>{exam.is_published ? "Published" : "Draft"}</Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/dashboard/cbt/${exam.id}/manage`}>Manage</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Live Sessions */}
          <TabsContent value="sessions" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Live Sessions</h3>
              <Button size="sm" onClick={() => setShowSessionDialog(true)}><Plus className="w-4 h-4 mr-1" />Schedule Session</Button>
            </div>
            {sessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No live sessions scheduled.</p>
            ) : (
              sessions.map(sess => (
                <Card key={sess.id} className="border-border/60">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{sess.title}</h4>
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(sess.scheduled_at), "MMM d, yyyy h:mm a")}</span>
                        <Badge className="capitalize text-[10px]">{sess.status}</Badge>
                      </div>
                    </div>
                    {sess.status === "scheduled" && (
                      <Button size="sm" asChild>
                        <Link to={`/dashboard/live-class/${sess.id}`}>Start</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Students */}
          <TabsContent value="students" className="mt-6 space-y-4">
            <h3 className="font-semibold">Enrolled Students ({enrollments.length})</h3>
            {enrollments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No students enrolled yet.</p>
            ) : (
              <div className="space-y-2">
                {enrollments.map((enr: any) => (
                  <Card key={enr.id} className="border-border/60">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{enr.profiles?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{enr.profiles?.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={enr.payment_status === "paid" ? "default" : "outline"} className="text-xs capitalize">{enr.payment_status}</Badge>
                        <Badge variant="secondary" className="text-xs capitalize">{enr.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Module Dialog */}
      <AddModuleDialog
        open={showModuleDialog || !!editingModule}
        onOpenChange={() => { setShowModuleDialog(false); setEditingModule(null); }}
        programId={programId!}
        editing={editingModule}
        onSaved={fetchAll}
      />

      {/* Add Material Dialog */}
      <AddMaterialDialog
        open={showMaterialDialog}
        onOpenChange={setShowMaterialDialog}
        programId={programId!}
        modules={modules}
        onSaved={fetchAll}
      />

      {/* Add Assignment Dialog */}
      <AddAssignmentDialog
        open={showAssignmentDialog}
        onOpenChange={setShowAssignmentDialog}
        programId={programId!}
        modules={modules}
        onSaved={fetchAll}
      />

      {/* Schedule Session Dialog */}
      <ScheduleProgramSessionDialog
        open={showSessionDialog}
        onOpenChange={setShowSessionDialog}
        onSaved={fetchAll}
      />
    </DashboardLayout>
  );
};

/* ─── Grade Submission ─── */
const GradeSubmission = ({ submission, maxScore, onGraded }: { submission: any; maxScore: number; onGraded: () => void }) => {
  const { toast } = useToast();
  const [score, setScore] = useState(String(submission.score || ""));
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const [saving, setSaving] = useState(false);

  const handleGrade = async () => {
    setSaving(true);
    const { error } = await supabase.from("program_submissions").update({
      score: parseInt(score) || 0,
      feedback: feedback.trim() || null,
      status: "graded",
      graded_at: new Date().toISOString(),
    }).eq("id", submission.id);
    if (error) toast({ title: "Failed to grade", variant: "destructive" });
    else { toast({ title: "Graded!" }); onGraded(); }
    setSaving(false);
  };

  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
      <p className="text-sm font-medium">Submission #{submission.id.slice(0, 8)}</p>
      {submission.text_content && <p className="text-sm text-muted-foreground">{submission.text_content}</p>}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label className="text-xs">Score (/{maxScore})</Label>
          <Input type="number" min="0" max={maxScore} value={score} onChange={e => setScore(e.target.value)} className="h-8" />
        </div>
        <div className="flex-[2]">
          <Label className="text-xs">Feedback</Label>
          <Input value={feedback} onChange={e => setFeedback(e.target.value)} className="h-8" placeholder="Optional feedback" />
        </div>
        <Button size="sm" onClick={handleGrade} disabled={saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}Grade
        </Button>
      </div>
    </div>
  );
};

/* ─── Add Module Dialog ─── */
const AddModuleDialog = ({ open, onOpenChange, programId, editing, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; programId: string; editing: any; onSaved: () => void }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) { setTitle(editing.title); setDescription(editing.description || ""); }
    else { setTitle(""); setDescription(""); }
  }, [editing]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from("program_modules").update({ title: title.trim(), description: description.trim() || null }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("program_modules").insert({ program_id: programId, title: title.trim(), description: description.trim() || null });
        if (error) throw error;
      }
      toast({ title: editing ? "Module updated!" : "Module created!" });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Module</DialogTitle><DialogDescription>Organize program content into modules.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} /></div>
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editing ? "Update" : "Create"} Module</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ─── Add Material Dialog ─── */
const AddMaterialDialog = ({ open, onOpenChange, programId, modules, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; programId: string; modules: any[]; onSaved: () => void }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [type, setType] = useState("document");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !moduleId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("program_materials").insert({
        program_id: programId, module_id: moduleId, title: title.trim(),
        material_type: type, content_url: url.trim() || null,
      });
      if (error) throw error;
      toast({ title: "Material added!" });
      onSaved();
      onOpenChange(false);
      setTitle(""); setUrl("");
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Material</DialogTitle><DialogDescription>Add a learning resource to a module.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><Label>Module *</Label>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
              <SelectContent>{modules.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="link">Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>URL</Label><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." /></div>
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add Material</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ─── Add Assignment Dialog ─── */
const AddAssignmentDialog = ({ open, onOpenChange, programId, modules, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; programId: string; modules: any[]; onSaved: () => void }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [publish, setPublish] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("program_assignments").insert({
        program_id: programId, title: title.trim(), description: description.trim() || null,
        module_id: moduleId || null, due_date: dueDate || null,
        max_score: parseInt(maxScore) || 100, is_published: publish,
      });
      if (error) throw error;
      toast({ title: "Assignment created!" });
      onSaved();
      onOpenChange(false);
      setTitle(""); setDescription(""); setDueDate("");
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Assignment</DialogTitle><DialogDescription>Create a new assignment for this program.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Module</Label>
              <Select value={moduleId} onValueChange={setModuleId}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>{modules.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Due Date</Label><Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Max Score</Label><Input type="number" value={maxScore} onChange={e => setMaxScore(e.target.value)} /></div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={publish} onChange={e => setPublish(e.target.checked)} className="rounded border-border" />
              <Label>Publish immediately</Label>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create Assignment</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ─── Schedule Session Dialog ─── */
const ScheduleProgramSessionDialog = ({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !scheduledAt) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("live_sessions").insert({
        title: title.trim(),
        instructor_id: user.id,
        scheduled_at: scheduledAt,
        duration_minutes: parseInt(duration) || 60,
        course_id: null,
      });
      if (error) throw error;
      toast({ title: "Session scheduled!" });
      onSaved();
      onOpenChange(false);
      setTitle(""); setScheduledAt("");
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Schedule Live Session</DialogTitle><DialogDescription>Schedule a live class for this program.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><Label>Date & Time *</Label><Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} /></div>
          <div><Label>Duration (minutes)</Label><Input type="number" value={duration} onChange={e => setDuration(e.target.value)} /></div>
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Schedule Session</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstructorProgramManage;
