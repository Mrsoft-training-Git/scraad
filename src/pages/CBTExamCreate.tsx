import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const CBTExamCreate = () => {
  const { user, profile, userRole, loading: authLoading } = useDashboardAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    exam_type: "course" as "course" | "program",
    course_id: "",
    program_id: "",
    track: "",
    start_time: "",
    end_time: "",
    duration_minutes: 60,
    shuffle_questions: false,
    allow_retake: false,
    max_attempts: 1,
    auto_submit: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      const [c, p] = await Promise.all([
        supabase.from("courses").select("id, title").order("title"),
        supabase.from("programs").select("id, title, track").order("title"),
      ]);
      if (c.data) setCourses(c.data);
      if (p.data) {
        setPrograms(p.data);
        const uniqueTracks = [...new Set(p.data.map((pr: any) => pr.track).filter(Boolean))] as string[];
        setTracks(uniqueTracks);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title || !form.start_time || !form.end_time) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (form.exam_type === "course" && !form.course_id) {
      toast({ title: "Please select a course", variant: "destructive" });
      return;
    }
    if (form.exam_type === "program" && !form.program_id) {
      toast({ title: "Please select a program", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.from("cbt_exams").insert({
      title: form.title,
      description: form.description || null,
      exam_type: form.exam_type,
      course_id: form.exam_type === "course" ? form.course_id : null,
      program_id: form.exam_type === "program" ? form.program_id : null,
      start_time: form.start_time,
      end_time: form.end_time,
      duration_minutes: form.duration_minutes,
      shuffle_questions: form.shuffle_questions,
      allow_retake: form.allow_retake,
      max_attempts: form.max_attempts,
      auto_submit: form.auto_submit,
      created_by: user.id,
    } as any).select().single();

    if (error) {
      toast({ title: "Error creating exam", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Exam created!" });
      navigate(`/dashboard/cbt/${(data as any).id}/manage`);
    }
    setSaving(false);
  };

  if (authLoading) {
    return (
      <DashboardLayout user={user} userRole={userRole} profile={profile}>
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} userRole={userRole} profile={profile}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/dashboard/cbt"><ArrowLeft className="w-4 h-4 mr-1" />Back to Exams</Link>
        </Button>
        <h1 className="font-heading text-2xl font-bold">Create CBT Exam</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Basic Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Exam Title *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Midterm Examination" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." rows={3} />
              </div>
              <div>
                <Label>Exam Type *</Label>
                <Select value={form.exam_type} onValueChange={(v: "course" | "program") => setForm({ ...form, exam_type: v, course_id: "", program_id: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Course Exam</SelectItem>
                    <SelectItem value="program">Program Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.exam_type === "course" ? (
                <div>
                  <Label>Select Course *</Label>
                  <Select value={form.course_id} onValueChange={v => setForm({ ...form, course_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose course..." /></SelectTrigger>
                    <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label>Select Program *</Label>
                  <Select value={form.program_id} onValueChange={v => setForm({ ...form, program_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose program..." /></SelectTrigger>
                    <SelectContent>{programs.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Timing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date & Time *</Label>
                  <Input type="datetime-local" value={form.start_time} onChange={e => {
                    const start = e.target.value;
                    const updated = { ...form, start_time: start };
                    if (start && form.end_time) {
                      updated.duration_minutes = Math.max(1, Math.round((new Date(form.end_time).getTime() - new Date(start).getTime()) / 60000));
                    }
                    setForm(updated);
                  }} />
                </div>
                <div>
                  <Label>End Date & Time *</Label>
                  <Input type="datetime-local" value={form.end_time} onChange={e => {
                    const end = e.target.value;
                    const updated = { ...form, end_time: end };
                    if (form.start_time && end) {
                      updated.duration_minutes = Math.max(1, Math.round((new Date(end).getTime() - new Date(form.start_time).getTime()) / 60000));
                    }
                    setForm(updated);
                  }} />
                </div>
              </div>
              {form.start_time && form.end_time && (
                <p className="text-sm text-muted-foreground">
                  Duration: <strong>{form.duration_minutes} minutes</strong> (auto-calculated from start & end time)
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Shuffle Questions</Label>
                <Switch checked={form.shuffle_questions} onCheckedChange={v => setForm({ ...form, shuffle_questions: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow Retake</Label>
                <Switch checked={form.allow_retake} onCheckedChange={v => setForm({ ...form, allow_retake: v })} />
              </div>
              {form.allow_retake && (
                <div>
                  <Label>Max Attempts</Label>
                  <Input type="number" min={1} value={form.max_attempts} onChange={e => setForm({ ...form, max_attempts: parseInt(e.target.value) || 1 })} />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label>Auto-submit when time ends</Label>
                <Switch checked={form.auto_submit} onCheckedChange={v => setForm({ ...form, auto_submit: v })} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Create Exam
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CBTExamCreate;
