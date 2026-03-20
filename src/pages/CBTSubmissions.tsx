import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { useCBTExamDetail } from "@/hooks/useCBTExams";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, CheckCircle, User, Eye } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CBTSubmissions = () => {
  const { examId } = useParams();
  const { user, profile, userRole, loading: authLoading } = useDashboardAuth();
  const { exam, questions, loading: examLoading } = useCBTExamDetail(examId);
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [grading, setGrading] = useState(false);
  const [theoryScores, setTheoryScores] = useState<Record<string, { marks: number; feedback: string }>>({});

  useEffect(() => {
    if (examId) fetchSubmissions();
  }, [examId]);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data: results } = await supabase
      .from("cbt_results")
      .select("*, cbt_attempts(*)")
      .eq("exam_id", examId!)
      .order("created_at", { ascending: false });

    if (results) {
      // Get user profiles
      const userIds = [...new Set(results.map((r: any) => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      const profileMap: Record<string, any> = {};
      profiles?.forEach((p: any) => { profileMap[p.id] = p; });
      setSubmissions(results.map((r: any) => ({ ...r, profile: profileMap[r.user_id] })));
    }
    setLoading(false);
  };

  const viewSubmission = async (sub: any) => {
    setSelectedSub(sub);
    const { data } = await supabase.from("cbt_answers").select("*").eq("attempt_id", sub.attempt_id);
    setAnswers(data || []);
    const scores: Record<string, { marks: number; feedback: string }> = {};
    (data || []).forEach((a: any) => {
      if (a.marks_awarded !== null) scores[a.question_id] = { marks: a.marks_awarded, feedback: '' };
    });
    setTheoryScores(scores);
  };

  const handleGrade = async () => {
    if (!selectedSub) return;
    setGrading(true);

    let theoryTotal = 0;
    for (const [qId, score] of Object.entries(theoryScores)) {
      const q = questions.find(qu => qu.id === qId);
      if (q?.question_type === 'theory') {
        theoryTotal += score.marks;
        await supabase.from("cbt_answers").update({
          marks_awarded: score.marks,
          is_correct: score.marks > 0,
        } as any).eq("attempt_id", selectedSub.attempt_id).eq("question_id", qId);
      }
    }

    const newObtained = selectedSub.mcq_score + theoryTotal;
    const pct = selectedSub.total_marks > 0 ? Math.round((newObtained / selectedSub.total_marks) * 100 * 100) / 100 : 0;

    await supabase.from("cbt_results").update({
      theory_score: theoryTotal,
      obtained_marks: newObtained,
      percentage: pct,
      theory_graded: true,
      graded_by: user?.id,
      graded_at: new Date().toISOString(),
    } as any).eq("id", selectedSub.id);

    toast({ title: "Grading saved!" });
    setSelectedSub(null);
    fetchSubmissions();
    setGrading(false);
  };

  if (authLoading || examLoading || loading) {
    return (
      <DashboardLayout user={user} userRole={userRole} profile={profile}>
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
      </DashboardLayout>
    );
  }

  const avgScore = submissions.length > 0 ? Math.round(submissions.reduce((s, r) => s + r.percentage, 0) / submissions.length) : 0;
  const passCount = submissions.filter(s => s.percentage >= 50).length;

  return (
    <DashboardLayout user={user} userRole={userRole} profile={profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/dashboard/cbt"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold">Submissions: {exam?.title}</h1>
          <p className="text-sm text-muted-foreground">{submissions.length} submission(s)</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Submissions", value: submissions.length },
            { label: "Avg Score", value: `${avgScore}%` },
            { label: "Pass Rate", value: submissions.length > 0 ? `${Math.round((passCount / submissions.length) * 100)}%` : "N/A" },
          ].map(s => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submissions table */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {submissions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{sub.profile?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{sub.profile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold">{sub.obtained_marks}/{sub.total_marks} ({sub.percentage}%)</p>
                      <div className="flex gap-1">
                        {!sub.theory_graded && <Badge variant="outline" className="text-[10px]">Theory pending</Badge>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => viewSubmission(sub)}>
                      <Eye className="w-3.5 h-3.5 mr-1" />Review
                    </Button>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No submissions yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Review dialog */}
        <Dialog open={!!selectedSub} onOpenChange={(o) => !o && setSelectedSub(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review: {selectedSub?.profile?.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {questions.map((q, i) => {
                const ans = answers.find((a: any) => a.question_id === q.id);
                return (
                  <Card key={q.id} className="border-border/60">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
                        <Badge variant="outline" className="text-xs">{q.question_type === 'mcq' ? 'MCQ' : 'Theory'}</Badge>
                        <span className="text-xs text-muted-foreground">{q.marks} marks</span>
                      </div>
                      <p className="text-sm font-medium mb-2">{q.question_text}</p>

                      {q.question_type === 'mcq' && q.options && (
                        <div className="space-y-1">
                          {q.options.map(o => (
                            <div key={o.id} className={`text-xs px-2 py-1 rounded ${
                              o.is_correct ? 'bg-green-500/10 text-green-700 font-medium' :
                              ans?.selected_option_id === o.id ? 'bg-red-500/10 text-red-700' : 'text-muted-foreground'
                            }`}>
                              {o.option_label}. {o.option_text}
                              {o.is_correct && ' ✓'}
                              {ans?.selected_option_id === o.id && !o.is_correct && ' ✗ (selected)'}
                              {ans?.selected_option_id === o.id && o.is_correct && ' (selected)'}
                            </div>
                          ))}
                          <div className="mt-1">
                            <Badge className={ans?.is_correct ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>
                              {ans?.is_correct ? `✓ ${q.marks}/${q.marks}` : `✗ 0/${q.marks}`}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {q.question_type === 'theory' && (
                        <div className="space-y-2">
                          <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                            {ans?.theory_answer || <span className="text-muted-foreground italic">No answer provided</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Score (max {q.marks})</Label>
                            <Input
                              type="number"
                              min={0}
                              max={q.marks}
                              className="w-20 h-8"
                              value={theoryScores[q.id]?.marks ?? ''}
                              onChange={e => setTheoryScores({ ...theoryScores, [q.id]: { ...theoryScores[q.id], marks: Math.min(q.marks, parseInt(e.target.value) || 0), feedback: theoryScores[q.id]?.feedback || '' } })}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {questions.some(q => q.question_type === 'theory') && (
                <Button className="w-full" onClick={handleGrade} disabled={grading}>
                  {grading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                  <CheckCircle className="w-4 h-4 mr-1" />Save Grades
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CBTSubmissions;
