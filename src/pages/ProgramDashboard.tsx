import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { usePayment } from "@/hooks/usePayment";
import { format } from "date-fns";
import {
  BookOpen, Calendar, FileText, ClipboardList, BarChart3,
  CheckCircle, Clock, Upload, Loader2, Play, ArrowLeft,
  Video, File, ExternalLink, CreditCard, Wallet, Download,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgramInfo {
  id: string;
  title: string;
  description: string | null;
  duration: string | null;
  mode: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  schedule: any;
  instructor_name: string | null;
  price: number;
  allows_part_payment: boolean;
  first_tranche_amount: number | null;
  second_tranche_amount: number | null;
}

const ProgramDashboard = () => {
  const { programId } = useParams();
  const { toast } = useToast();
  const { user, profile, userRole, loading: authLoading } = useDashboardAuth();
  const [program, setProgram] = useState<ProgramInfo | null>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (programId && user) fetchAll();
  }, [programId, user]);

  const fetchAll = async () => {
    if (!user || !programId) return;
    setLoading(true);

    const [programRes, enrollRes, modulesRes, materialsRes, assignmentsRes, subsRes, examsRes, resultsRes] = await Promise.all([
      supabase.from("programs").select("*").eq("id", programId).single(),
      supabase.from("program_enrollments").select("*").eq("program_id", programId).eq("user_id", user.id).maybeSingle(),
      supabase.from("program_modules").select("*").eq("program_id", programId).order("order_index"),
      supabase.from("program_materials").select("*").eq("program_id", programId).order("order_index"),
      supabase.from("program_assignments").select("*").eq("program_id", programId).eq("is_published", true).order("due_date"),
      supabase.from("program_submissions").select("*").eq("user_id", user.id),
      supabase.from("program_exams").select("*").eq("program_id", programId).eq("is_published", true),
      supabase.from("program_exam_results").select("*").eq("user_id", user.id),
    ]);

    if (programRes.data) setProgram(programRes.data as ProgramInfo);
    if (enrollRes.data) setEnrollment(enrollRes.data);
    if (modulesRes.data) setModules(modulesRes.data);
    if (materialsRes.data) setMaterials(materialsRes.data);
    if (assignmentsRes.data) setAssignments(assignmentsRes.data);
    if (subsRes.data) setSubmissions(subsRes.data);
    if (examsRes.data) setExams(examsRes.data);
    if (resultsRes.data) setExamResults(resultsRes.data);
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

  if (!program || !enrollment) {
    return (
      <DashboardLayout user={user} userRole={userRole} profile={profile}>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You don't have access to this program.</p>
          <Button asChild><Link to="/programs"><ArrowLeft className="w-4 h-4 mr-2" />Browse Programs</Link></Button>
        </div>
      </DashboardLayout>
    );
  }

  const completedAssignments = assignments.filter(a =>
    submissions.some(s => s.assignment_id === a.id && s.status === "graded")
  ).length;
  const completedExams = exams.filter(e =>
    examResults.some(r => r.exam_id === e.id)
  ).length;
  const totalItems = assignments.length + exams.length;
  const completedItems = completedAssignments + completedExams;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <DashboardLayout user={user} userRole={userRole} profile={profile}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
            <Link to="/programs"><ArrowLeft className="w-4 h-4 mr-1" /> All Programs</Link>
          </Button>
          <h1 className="font-heading text-2xl font-bold">{program.title}</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
            {program.duration && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{program.duration}</span>}
            {program.instructor_name && <span>Instructor: {program.instructor_name}</span>}
            <Badge className="capitalize">{program.mode}</Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-bold text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{completedItems}/{totalItems} tasks completed</p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-1 hidden sm:inline" />Overview</TabsTrigger>
            <TabsTrigger value="schedule"><Calendar className="w-4 h-4 mr-1 hidden sm:inline" />Schedule</TabsTrigger>
            <TabsTrigger value="materials"><BookOpen className="w-4 h-4 mr-1 hidden sm:inline" />Materials</TabsTrigger>
            <TabsTrigger value="assignments"><ClipboardList className="w-4 h-4 mr-1 hidden sm:inline" />Assignments</TabsTrigger>
            <TabsTrigger value="exams"><FileText className="w-4 h-4 mr-1 hidden sm:inline" />Exams</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Modules", value: modules.length, icon: BookOpen },
                { label: "Assignments", value: `${completedAssignments}/${assignments.length}`, icon: ClipboardList },
                { label: "Exams", value: `${completedExams}/${exams.length}`, icon: FileText },
              ].map(s => (
                <Card key={s.label} className="border-border/60">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {program.description && (
              <Card className="border-border/60">
                <CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground whitespace-pre-line">{program.description}</p></CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            {modules.length > 0 ? (
              <div className="space-y-3">
                {modules.map((mod, i) => (
                  <Card key={mod.id} className="border-l-4 border-l-primary border-border/60">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                          {mod.week_number || i + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold">{mod.title}</h3>
                          {mod.description && <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Schedule will be available soon.</p>
            )}
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            {materials.length > 0 ? (
              <div className="space-y-3">
                {materials.map(mat => {
                  const icons: Record<string, React.ReactNode> = {
                    video: <Video className="w-4 h-4 text-primary" />,
                    document: <File className="w-4 h-4 text-primary" />,
                    link: <ExternalLink className="w-4 h-4 text-primary" />,
                    file: <File className="w-4 h-4 text-primary" />,
                  };
                  return (
                    <Card key={mat.id} className="border-border/60 hover:border-primary/20 transition-colors">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {icons[mat.material_type] || icons.file}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{mat.title}</h4>
                          {mat.description && <p className="text-xs text-muted-foreground truncate">{mat.description}</p>}
                        </div>
                        {mat.content_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={mat.content_url} target="_blank" rel="noopener noreferrer">Open</a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No materials available yet.</p>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            <AssignmentsList assignments={assignments} submissions={submissions} onSubmit={fetchAll} />
          </TabsContent>

          <TabsContent value="exams" className="mt-6">
            <ExamsList exams={exams} results={examResults} onComplete={fetchAll} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const AssignmentsList = ({ assignments, submissions, onSubmit }: { assignments: any[]; submissions: any[]; onSubmit: () => void }) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<Record<string, string>>({});

  const handleSubmit = async (assignmentId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSubmitting(assignmentId);
    try {
      const { error } = await supabase.from("program_submissions").insert({
        assignment_id: assignmentId,
        user_id: user.id,
        text_content: textInput[assignmentId]?.trim() || null,
      });
      if (error) throw error;
      toast({ title: "Assignment submitted!" });
      onSubmit();
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(null);
    }
  };

  if (assignments.length === 0) return <p className="text-center text-muted-foreground py-8">No assignments yet.</p>;

  return (
    <div className="space-y-4">
      {assignments.map(a => {
        const sub = submissions.find((s: any) => s.assignment_id === a.id);
        return (
          <Card key={a.id} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h4 className="font-semibold">{a.title}</h4>
                  {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                </div>
                {sub ? (
                  <Badge className={sub.status === "graded" ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-secondary/10 text-secondary border-secondary/20"}>
                    {sub.status === "graded" ? `Graded: ${sub.score}/${a.max_score}` : "Submitted"}
                  </Badge>
                ) : a.due_date ? (
                  <Badge variant="outline" className="text-xs">Due {format(new Date(a.due_date), "MMM d")}</Badge>
                ) : null}
              </div>
              {sub?.feedback && (
                <div className="bg-muted/50 rounded-lg p-3 mt-2 text-sm">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Feedback</p>
                  <p>{sub.feedback}</p>
                </div>
              )}
              {!sub && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder="Type your answer..."
                    value={textInput[a.id] || ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextInput({ ...textInput, [a.id]: e.target.value })}
                    rows={3}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSubmit(a.id)}
                    disabled={submitting === a.id || !textInput[a.id]?.trim()}
                  >
                    {submitting === a.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                    Submit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const ExamsList = ({ exams, results, onComplete }: { exams: any[]; results: any[]; onComplete: () => void }) => {
  const { toast } = useToast();
  const [activeExam, setActiveExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitExam = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !activeExam) return;
    setSubmitting(true);

    const questions = Array.isArray(activeExam.questions) ? activeExam.questions : [];
    let score = 0;
    questions.forEach((q: any, i: number) => {
      if (answers[i] === q.correct_answer) score++;
    });

    try {
      const { error } = await supabase.from("program_exam_results").insert({
        exam_id: activeExam.id,
        user_id: user.id,
        answers,
        score,
        total_questions: questions.length,
      });
      if (error) throw error;
      toast({ title: `Exam completed! Score: ${score}/${questions.length}` });
      setActiveExam(null);
      onComplete();
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (activeExam) {
    const questions = Array.isArray(activeExam.questions) ? activeExam.questions : [];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-xl font-bold">{activeExam.title}</h3>
          <Button variant="outline" size="sm" onClick={() => setActiveExam(null)}>Cancel</Button>
        </div>
        {questions.map((q: any, qi: number) => (
          <Card key={qi} className="border-border/60">
            <CardContent className="p-4">
              <p className="font-medium mb-3">{qi + 1}. {q.question}</p>
              <div className="space-y-2">
                {(q.options || []).map((opt: string, oi: number) => (
                  <button
                    key={oi}
                    onClick={() => setAnswers({ ...answers, [qi]: oi })}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border transition-colors text-sm ${
                      answers[qi] === oi
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        <Button onClick={handleSubmitExam} disabled={submitting || Object.keys(answers).length < questions.length} className="w-full">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          Submit Exam ({Object.keys(answers).length}/{questions.length} answered)
        </Button>
      </div>
    );
  }

  if (exams.length === 0) return <p className="text-center text-muted-foreground py-8">No exams available yet.</p>;

  return (
    <div className="space-y-3">
      {exams.map((exam: any) => {
        const result = results.find((r: any) => r.exam_id === exam.id);
        const questions = Array.isArray(exam.questions) ? exam.questions : [];
        return (
          <Card key={exam.id} className="border-border/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{exam.title}</h4>
                <p className="text-xs text-muted-foreground">{questions.length} questions · {exam.time_limit_minutes} min</p>
              </div>
              {result ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  Score: {result.score}/{result.total_questions}
                </Badge>
              ) : (
                <Button size="sm" onClick={() => { setActiveExam(exam); setAnswers({}); }}>
                  <Play className="w-3.5 h-3.5 mr-1" /> Start Exam
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProgramDashboard;
