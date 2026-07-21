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
import { ContentPreview } from "@/components/ContentPreview";
import { KnowledgeCheckPlayer } from "@/components/KnowledgeCheckPlayer";
import { format } from "date-fns";
import {
  BookOpen, Calendar, FileText, ClipboardList, BarChart3,
  CheckCircle, Clock, Upload, Loader2, Play, ArrowLeft,
  Video, File, ExternalLink, CreditCard, Wallet, Download, HelpCircle, Link as LinkIcon,
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
    if (programId && user) {
      fetchAll();
      // If returning from payment gateway, verify payment directly
      const params = new URLSearchParams(window.location.search);
      const reference = params.get("trxref") || params.get("reference");
      if (reference) {
        const verifyPayment = async () => {
          try {
            const { data } = await supabase.functions.invoke("verify-payment", {
              body: { reference },
            });
            if (data?.verified) {
              toast({ title: "Payment Confirmed", description: "Your payment has been verified successfully." });
              fetchAll();
            }
          } catch (err) {
            console.error("Payment verification error:", err);
          } finally {
            window.history.replaceState({}, "", window.location.pathname);
          }
        };
        verifyPayment();
      }
    }
  }, [programId, user]);

  const fetchAll = async () => {
    if (!user || !programId) return;
    setLoading(true);

    const [programRes, enrollRes, modulesRes, materialsRes, assignmentsRes, subsRes, cbtExamsRes] = await Promise.all([
      supabase.from("programs").select("*").eq("id", programId).single(),
      supabase.from("program_enrollments").select("*").eq("program_id", programId).eq("user_id", user.id).maybeSingle(),
      supabase.from("program_modules").select("*").eq("program_id", programId).order("order_index"),
      supabase.from("program_materials").select("*").eq("program_id", programId).order("order_index"),
      supabase.from("program_assignments").select("*").eq("program_id", programId).eq("is_published", true).order("due_date"),
      supabase.from("program_submissions").select("*").eq("user_id", user.id),
      supabase.from("cbt_exams").select("*").eq("program_id", programId).eq("is_published", true).eq("exam_type", "program").order("start_time"),
    ]);

    if (programRes.data) setProgram(programRes.data as ProgramInfo);
    if (enrollRes.data) setEnrollment(enrollRes.data);
    if (modulesRes.data) setModules(modulesRes.data);
    if (materialsRes.data) setMaterials(materialsRes.data);
    if (assignmentsRes.data) setAssignments(assignmentsRes.data);
    if (subsRes.data) setSubmissions(subsRes.data);
    if (cbtExamsRes.data) setExams(cbtExamsRes.data as any[]);
    setExamResults([]);
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

  const paymentStatus = enrollment.payment_status || "unpaid";
  const hasPaid = paymentStatus === "paid";
  const isPartial = paymentStatus === "partial";
  const hasAccess = hasPaid || isPartial;

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
            <Link to="/dashboard/learning?tab=programs"><ArrowLeft className="w-4 h-4 mr-1" /> My Learning</Link>
          </Button>
          <h1 className="font-heading text-2xl font-bold">{program.title}</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
            {program.duration && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{program.duration}</span>}
            {program.instructor_name && <span>Instructor: {program.instructor_name}</span>}
            <Badge className="capitalize">{program.mode}</Badge>
          </div>
        </div>

        {/* Payment Section - only for unpaid */}
        {paymentStatus === "unpaid" && (
          <ProgramPaymentCard
            program={program}
            paymentStatus={paymentStatus}
            onPaymentComplete={fetchAll}
          />
        )}

        {/* Second tranche reminder for partial/defaulted */}
        {(isPartial || paymentStatus === "defaulted") && program.second_tranche_amount && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-sm">Second Payment Due</h3>
                <p className="text-xs text-muted-foreground">Complete your second installment of ₦{program.second_tranche_amount.toLocaleString()}</p>
              </div>
              <SecondTrancheButton program={program} onPaymentComplete={fetchAll} />
            </CardContent>
          </Card>
        )}

        {/* Admission Letter - show when paid or partial (has active access) */}
        {(hasPaid || isPartial) && (
          <AdmissionLetterCard program={program} profile={profile} enrollment={enrollment} />
        )}

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
            {!hasAccess ? (
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Materials Locked</h3>
                  <p className="text-sm text-muted-foreground">Complete your payment to access program materials.</p>
                </CardContent>
              </Card>
            ) : materials.length > 0 ? (
              <ProgramMaterialsList materials={materials} modules={modules} />
            ) : (
              <p className="text-center text-muted-foreground py-8">No materials available yet.</p>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            {!hasAccess ? (
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-8 text-center">
                  <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Assignments Locked</h3>
                  <p className="text-sm text-muted-foreground">Complete your payment to access assignments.</p>
                </CardContent>
              </Card>
            ) : (
              <AssignmentsList assignments={assignments} submissions={submissions} onSubmit={fetchAll} />
            )}
          </TabsContent>

          <TabsContent value="exams" className="mt-6">
            {!hasAccess ? (
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-8 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Exams Locked</h3>
                  <p className="text-sm text-muted-foreground">Complete your payment to access exams.</p>
                </CardContent>
              </Card>
            ) : exams.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No exams available yet.</p>
            ) : (
              <div className="space-y-3">
                {exams.map((exam: any) => {
                  const now = new Date();
                  const start = new Date(exam.start_time);
                  const end = new Date(exam.end_time);
                  const isUpcoming = now < start;
                  const isEnded = now > end;
                  const isActive = !isUpcoming && !isEnded;
                  const statusLabel = isUpcoming ? "Upcoming" : isEnded ? "Ended" : "Active";
                  const statusColor = isUpcoming ? "bg-blue-500/10 text-blue-600" : isEnded ? "bg-muted text-muted-foreground" : "bg-green-500/10 text-green-600";
                  return (
                    <Card key={exam.id} className="border-border/60">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{exam.title}</h4>
                          <p className="text-xs text-muted-foreground">{exam.duration_minutes} min · {format(start, "MMM d, h:mm a")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColor}>{statusLabel}</Badge>
                          <Button size="sm" asChild>
                            <Link to={`/dashboard/cbt/${exam.id}`}>
                              {isActive ? "Take Exam" : isUpcoming ? "View Details" : "View Result"}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

/* ─── Program Materials List ─── */
const ProgramMaterialsList = ({ materials, modules }: { materials: any[]; modules: any[] }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMat, setPreviewMat] = useState<any>(null);
  const [quizMat, setQuizMat] = useState<any>(null);

  const getIcon = (type: string) => {
    if (type === "video") return <Video className="w-4 h-4 text-primary" />;
    if (type === "quiz") return <HelpCircle className="w-4 h-4 text-primary" />;
    if (type === "link") return <LinkIcon className="w-4 h-4 text-primary" />;
    return <File className="w-4 h-4 text-primary" />;
  };

  const handleOpenMaterial = (mat: any) => {
    if (mat.material_type === "quiz") {
      setQuizMat(mat);
    } else if (mat.material_type === "link") {
      window.open(mat.content_url, "_blank");
    } else {
      setPreviewMat(mat);
      setPreviewOpen(true);
    }
  };

  if (quizMat) {
    const quizData = (quizMat.quiz_data || []) as any[];
    const questions = quizData.map((q: any, i: number) => ({
      id: q.id || `q-${i}`,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      order_index: q.order_index ?? i,
    }));

    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setQuizMat(null)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Materials
        </Button>
        <KnowledgeCheckPlayer
          questions={questions}
          contentTitle={quizMat.title}
          contentId={quizMat.id}
          onComplete={() => {}}
          onGoBack={() => setQuizMat(null)}
        />
      </div>
    );
  }

  // Group by module
  const grouped = modules.map(mod => ({
    ...mod,
    items: materials.filter(m => m.module_id === mod.id),
  })).filter(g => g.items.length > 0);

  const ungrouped = materials.filter(m => !m.module_id);

  return (
    <div className="space-y-4">
      {grouped.map(group => (
        <div key={group.id} className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">{group.title}</h4>
          {group.items.map((mat: any) => (
            <Card key={mat.id} className="border-border/60 hover:border-primary/20 transition-colors cursor-pointer" onClick={() => handleOpenMaterial(mat)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {getIcon(mat.material_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{mat.title}</h4>
                  {mat.description && <p className="text-xs text-muted-foreground truncate">{mat.description}</p>}
                </div>
                <Badge variant="outline" className="text-[10px] capitalize">{mat.material_type}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
      {ungrouped.map((mat: any) => (
        <Card key={mat.id} className="border-border/60 hover:border-primary/20 transition-colors cursor-pointer" onClick={() => handleOpenMaterial(mat)}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {getIcon(mat.material_type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{mat.title}</h4>
              {mat.description && <p className="text-xs text-muted-foreground truncate">{mat.description}</p>}
            </div>
            <Badge variant="outline" className="text-[10px] capitalize">{mat.material_type}</Badge>
          </CardContent>
        </Card>
      ))}
      <ContentPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        content={previewMat ? {
          title: previewMat.title,
          description: previewMat.description,
          content_type: previewMat.material_type === "document" ? "document" : "video",
          content_url: previewMat.content_url,
        } : null}
      />
    </div>
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

/* ─── Program Payment Card ─── */
const ProgramPaymentCard = ({ program, paymentStatus, onPaymentComplete }: { program: ProgramInfo; paymentStatus: string; onPaymentComplete: () => void }) => {
  const { initializePayment, loading } = usePayment({ onSuccess: onPaymentComplete });

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-6">
        <h3 className="font-heading text-lg font-bold mb-2">
          {paymentStatus === "unpaid" ? "Complete Your Payment" : "Complete Second Payment"}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {paymentStatus === "unpaid"
            ? "You've been admitted! Please complete payment to access program content."
            : "Your first payment has been received. Please complete the second installment."}
        </p>
        <div className="space-y-2">
          {paymentStatus === "unpaid" && (
            <>
              <Button
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
                onClick={() => initializePayment(program.id, "full", "program")}
                disabled={loading}
              >
                <Wallet className="w-4 h-4 mr-2" />
                {loading ? "Processing..." : `Pay Full Amount — ₦${program.price.toLocaleString()}`}
              </Button>
              {program.allows_part_payment && program.first_tranche_amount && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => initializePayment(program.id, "first", "program")}
                  disabled={loading}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {loading ? "Processing..." : `Pay First Tranche — ₦${program.first_tranche_amount.toLocaleString()}`}
                </Button>
              )}
            </>
          )}
          {(paymentStatus === "partial" || paymentStatus === "defaulted") && program.second_tranche_amount && (
            <Button
              className="w-full"
              onClick={() => initializePayment(program.id, "second", "program")}
              disabled={loading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? "Processing..." : `Pay Second Tranche — ₦${program.second_tranche_amount.toLocaleString()}`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/* ─── Second Tranche Button ─── */
const SecondTrancheButton = ({ program, onPaymentComplete }: { program: ProgramInfo; onPaymentComplete: () => void }) => {
  const { initializePayment, loading } = usePayment({ onSuccess: onPaymentComplete });
  return (
    <Button
      size="sm"
      onClick={() => initializePayment(program.id, "second", "program")}
      disabled={loading}
    >
      <CreditCard className="w-4 h-4 mr-2" />
      {loading ? "Processing..." : `Pay ₦${(program.second_tranche_amount || 0).toLocaleString()}`}
    </Button>
  );
};

/* ─── Admission Letter Card ─── */
import mrsoftLogoAsset from "@/assets/mrsoft-letter-logo.jpeg.asset.json";
import scraadLogoAsset from "@/assets/scraad-email-logo.png.asset.json";
import { jsPDF } from "jspdf";

const loadImageAsDataUrl = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });

const AdmissionLetterCard = ({ program, profile, enrollment }: { program: ProgramInfo; profile: any; enrollment: any }) => {
  const handleDownload = async () => {
    const studentName = profile?.full_name || "Student";
    const enrolledDate = enrollment?.enrolled_at ? format(new Date(enrollment.enrolled_at), "MMMM d, yyyy") : format(new Date(), "MMMM d, yyyy");
    const startDate = program.start_date ? format(new Date(program.start_date), "MMMM d, yyyy") : "TBD";
    const mode = program.mode ? program.mode.charAt(0).toUpperCase() + program.mode.slice(1) : "—";
    const venue = program.location || (program.mode === "online" ? "Online (Virtual Classroom)" : "MRsoft Technology Complex, Port Harcourt");
    const fee = `NGN ${(program.price || 0).toLocaleString()}`;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = margin;

    // Logos - ScraAD and MRsoft side by side (matches email header)
    try {
      const [scraadData, mrsoftData] = await Promise.all([
        loadImageAsDataUrl(scraadLogoAsset.url),
        loadImageAsDataUrl(mrsoftLogoAsset.url),
      ]);
      const logoH = 48;
      const scraadW = 130;
      const mrsoftW = 48;
      const gap = 20;
      const totalW = scraadW + gap + mrsoftW;
      const startX = (pageW - totalW) / 2;
      doc.addImage(scraadData, "PNG", startX, y, scraadW, logoH);
      // vertical divider
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.8);
      doc.line(startX + scraadW + gap / 2, y + 6, startX + scraadW + gap / 2, y + logoH - 6);
      doc.addImage(mrsoftData, "JPEG", startX + scraadW + gap, y, mrsoftW, logoH);
      y += logoH + 8;
    } catch {
      // proceed without logos
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(15, 15, 15);
    doc.text("M-R International (MRsoft)", pageW / 2, y, { align: "center" });
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("Training and Development Department", pageW / 2, y, { align: "center" });
    y += 18;

    // Title bar
    doc.setFillColor(20, 96, 61);
    doc.rect(margin, y, pageW - margin * 2, 26, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("ADMISSION LETTER", pageW / 2, y + 17, { align: "center" });
    y += 26 + 16;

    // Date
    doc.setTextColor(26, 26, 26);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Date:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(enrolledDate, margin + 32, y);
    y += 16;

    // Salutation
    doc.setFont("helvetica", "normal");
    doc.text("Dear ", margin, y);
    doc.setFont("helvetica", "bold");
    doc.text(`${studentName},`, margin + 26, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    const p1 = doc.splitTextToSize(
      "Congratulations! We are pleased to inform you that you have been successfully admitted into the following training programme:",
      pageW - margin * 2
    );
    doc.text(p1, margin, y);
    y += p1.length * 12 + 8;

    // Details table
    const rows: [string, string][] = [
      ["Program", program.title],
      ["Fee", fee],
      ["Mode", mode],
      ["Training Venue", venue],
    ];
    if (program.duration) rows.push(["Duration", program.duration]);
    rows.push(["Start Date", startDate]);

    const labelW = 130;
    const valueW = pageW - margin * 2 - labelW;
    rows.forEach(([label, value]) => {
      const valueLines = doc.splitTextToSize(String(value), valueW - 16);
      const rowH = Math.max(22, valueLines.length * 12 + 10);
      doc.setDrawColor(207, 216, 211);
      doc.setFillColor(234, 245, 239);
      doc.rect(margin, y, labelW, rowH, "FD");
      doc.setFillColor(255, 255, 255);
      doc.rect(margin + labelW, y, valueW, rowH, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(20, 96, 61);
      doc.text(label, margin + 8, y + 14);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(26, 26, 26);
      doc.text(valueLines, margin + labelW + 8, y + 14);
      y += rowH;
    });
    y += 12;

    doc.setFontSize(10);
    const body = [
      "Your payment has been successfully confirmed and your enrolment is now active.",
      "You will have access to learning materials, instructor-led sessions, practical exercises, assessments and a Certificate of Completion upon successfully completing the programme.",
      "We look forward to welcoming you to M-R International (MRsoft) Training and Development Department and wish you a rewarding learning experience.",
    ];
    body.forEach((para) => {
      const lines = doc.splitTextToSize(para, pageW - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 12 + 6;
    });

    y += 10;
    doc.text("Best Regards,", margin, y);
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Admissions Team", margin, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.text("M-R International (MRsoft)", margin, y);
    y += 12;
    doc.text("Training and Development Department", margin, y);

    // Footer
    const footerY = pageH - 46;
    doc.setDrawColor(221, 221, 221);
    doc.line(margin, footerY, pageW - margin, footerY);
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.text(
      "www.m-rinternational.com  |  training@m-rinternational.com  |  +234 806 729 3772",
      pageW / 2,
      footerY + 12,
      { align: "center" }
    );
    const addr = doc.splitTextToSize(
      "MRsoft Technology Complex, Plot 3, Road 1, Centenary Garden Estate, Eneka Link Road, Off G.U. Ake Road, Port Harcourt.",
      pageW - margin * 2
    );
    doc.text(addr, pageW / 2, footerY + 24, { align: "center" });

    doc.save(`Admission_Letter_${program.title.replace(/[^a-z0-9]+/gi, "_")}.pdf`);
  };

  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-green-700">✅ Payment Complete</h3>
          <p className="text-sm text-muted-foreground">Your admission is confirmed. Download your admission letter below.</p>
        </div>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" /> Admission Letter
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProgramDashboard;
