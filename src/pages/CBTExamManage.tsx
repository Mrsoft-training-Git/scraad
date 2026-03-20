import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { useCBTExamDetail } from "@/hooks/useCBTExams";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Plus, Trash2, GripVertical, Save, Eye, EyeOff } from "lucide-react";
import type { CBTQuestion, CBTOption } from "@/types/cbt";

interface QuestionForm {
  question_type: 'mcq' | 'theory';
  question_text: string;
  marks: number;
  options: { option_text: string; option_label: string; is_correct: boolean }[];
}

const emptyQuestion: QuestionForm = {
  question_type: 'mcq',
  question_text: '',
  marks: 1,
  options: [
    { option_text: '', option_label: 'A', is_correct: true },
    { option_text: '', option_label: 'B', is_correct: false },
    { option_text: '', option_label: 'C', is_correct: false },
    { option_text: '', option_label: 'D', is_correct: false },
  ],
};

const CBTExamManage = () => {
  const { examId } = useParams();
  const { user, profile, userRole, loading: authLoading } = useDashboardAuth();
  const { exam, questions, loading, refetch } = useCBTExamDetail(examId);
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [form, setForm] = useState<QuestionForm>({ ...emptyQuestion });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSaveQuestion = async () => {
    if (!examId || !form.question_text.trim()) {
      toast({ title: "Question text is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await supabase.from("cbt_questions").update({
          question_text: form.question_text,
          question_type: form.question_type,
          marks: form.marks,
        } as any).eq("id", editingId);
        if (form.question_type === 'mcq') {
          await supabase.from("cbt_options").delete().eq("question_id", editingId);
          await supabase.from("cbt_options").insert(
            form.options.map(o => ({ question_id: editingId, ...o })) as any
          );
        }
        toast({ title: "Question updated" });
      } else {
        const { data: q, error } = await supabase.from("cbt_questions").insert({
          exam_id: examId,
          question_type: form.question_type,
          question_text: form.question_text,
          marks: form.marks,
          order_index: questions.length,
        } as any).select().single();
        if (error) throw error;
        if (form.question_type === 'mcq' && q) {
          await supabase.from("cbt_options").insert(
            form.options.map(o => ({ question_id: (q as any).id, ...o })) as any
          );
        }
        toast({ title: "Question added" });
      }
      setForm({ ...emptyQuestion });
      setShowForm(false);
      setEditingId(null);
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (qId: string) => {
    await supabase.from("cbt_questions").delete().eq("id", qId);
    toast({ title: "Question deleted" });
    refetch();
  };

  const handleEdit = (q: CBTQuestion) => {
    setEditingId(q.id);
    setForm({
      question_type: q.question_type,
      question_text: q.question_text,
      marks: q.marks,
      options: q.options?.map(o => ({ option_text: o.option_text, option_label: o.option_label, is_correct: o.is_correct })) || emptyQuestion.options,
    });
    setShowForm(true);
  };

  const togglePublish = async () => {
    if (!exam) return;
    setPublishing(true);
    await supabase.from("cbt_exams").update({ is_published: !exam.is_published } as any).eq("id", exam.id);
    toast({ title: exam.is_published ? "Exam unpublished" : "Exam published!" });
    refetch();
    setPublishing(false);
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout user={user} userRole={userRole} profile={profile}>
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
      </DashboardLayout>
    );
  }

  if (!exam) {
    return (
      <DashboardLayout user={user} userRole={userRole} profile={profile}>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold">Exam not found</h2>
          <Button asChild className="mt-4"><Link to="/dashboard/cbt"><ArrowLeft className="w-4 h-4 mr-2" />Back</Link></Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <DashboardLayout user={user} userRole={userRole} profile={profile}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" className="-ml-2 mb-1" asChild>
              <Link to="/dashboard/cbt"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
            </Button>
            <h1 className="font-heading text-2xl font-bold">{exam.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={exam.is_published ? "default" : "outline"}>{exam.is_published ? "Published" : "Draft"}</Badge>
              <span className="text-sm text-muted-foreground">{questions.length} questions · {totalMarks} marks</span>
            </div>
          </div>
          <Button variant={exam.is_published ? "outline" : "default"} onClick={togglePublish} disabled={publishing}>
            {publishing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : exam.is_published ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {exam.is_published ? "Unpublish" : "Publish"}
          </Button>
        </div>

        {/* Questions list */}
        <div className="space-y-3">
          {questions.map((q, i) => (
            <Card key={q.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{q.question_type === 'mcq' ? 'MCQ' : 'Theory'}</Badge>
                      <span className="text-xs text-muted-foreground">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-sm font-medium">{q.question_text}</p>
                    {q.options && (
                      <div className="mt-2 space-y-1">
                        {q.options.map(o => (
                          <div key={o.id} className={`text-xs px-2 py-1 rounded ${o.is_correct ? 'bg-green-500/10 text-green-700 font-medium' : 'text-muted-foreground'}`}>
                            {o.option_label}. {o.option_text} {o.is_correct && '✓'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(q)}>
                      <Save className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(q.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add question form */}
        {showForm ? (
          <Card className="border-primary/30">
            <CardHeader><CardTitle className="text-lg">{editingId ? 'Edit' : 'Add'} Question</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Question Type</Label>
                  <Select value={form.question_type} onValueChange={(v: 'mcq' | 'theory') => setForm({ ...form, question_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">Objective (MCQ)</SelectItem>
                      <SelectItem value="theory">Theory (Essay)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Marks</Label>
                  <Input type="number" min={1} value={form.marks} onChange={e => setForm({ ...form, marks: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div>
                <Label>Question Text *</Label>
                <Textarea value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} rows={3} placeholder="Type your question..." />
              </div>
              {form.question_type === 'mcq' && (
                <div className="space-y-2">
                  <Label>Options (select the correct answer)</Label>
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, options: form.options.map((o, j) => ({ ...o, is_correct: j === i })) })}
                        className={`w-8 h-8 rounded-full text-xs font-bold flex-shrink-0 border-2 transition-colors ${
                          opt.is_correct ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        {opt.option_label}
                      </button>
                      <Input
                        value={opt.option_text}
                        onChange={e => {
                          const opts = [...form.options];
                          opts[i] = { ...opts[i], option_text: e.target.value };
                          setForm({ ...form, options: opts });
                        }}
                        placeholder={`Option ${opt.option_label}`}
                      />
                      {form.options.length > 2 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== i) })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {form.options.length < 6 && (
                    <Button variant="outline" size="sm" onClick={() => {
                      const labels = 'ABCDEF';
                      setForm({ ...form, options: [...form.options, { option_text: '', option_label: labels[form.options.length], is_correct: false }] });
                    }}>
                      <Plus className="w-3.5 h-3.5 mr-1" />Add Option
                    </Button>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleSaveQuestion} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                  {editingId ? 'Update' : 'Add'} Question
                </Button>
                <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...emptyQuestion }); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button variant="outline" className="w-full border-dashed" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />Add Question
          </Button>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CBTExamManage;
