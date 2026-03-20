import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { useCBTExamDetail, useCBTAttempt } from "@/hooks/useCBTExams";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Clock, Calendar, AlertTriangle, CheckCircle, PlayCircle } from "lucide-react";
import { format, isPast, isFuture } from "date-fns";

const CBTExamView = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, profile, userRole, loading: authLoading } = useDashboardAuth();
  const { exam, questions, loading } = useCBTExamDetail(examId);
  const { attempts, currentAttempt, result, loading: attLoading } = useCBTAttempt(examId, user?.id);
  const { toast } = useToast();
  const [starting, setStarting] = useState(false);

  const canStart = exam && !isPast(new Date(exam.end_time)) && !isFuture(new Date(exam.start_time));
  const hasSubmitted = attempts.some(a => a.status === 'submitted' || a.status === 'auto_submitted');
  const attemptCount = attempts.filter(a => a.status !== 'in_progress').length;
  const canRetake = exam?.allow_retake && attemptCount < exam.max_attempts;

  const handleStart = async () => {
    if (!user || !exam) return;
    setStarting(true);

    if (currentAttempt) {
      navigate(`/dashboard/cbt/${exam.id}/take`);
      return;
    }

    if (hasSubmitted && !canRetake) {
      toast({ title: "You've used all attempts", variant: "destructive" });
      setStarting(false);
      return;
    }

    const { data, error } = await supabase.from("cbt_attempts").insert({
      exam_id: exam.id,
      user_id: user.id,
      time_remaining_seconds: exam.duration_minutes * 60,
    } as any).select().single();

    if (error) {
      toast({ title: "Error starting exam", description: error.message, variant: "destructive" });
      setStarting(false);
      return;
    }

    navigate(`/dashboard/cbt/${exam.id}/take`);
  };

  if (authLoading || loading || attLoading) {
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

  return (
    <DashboardLayout user={user} userRole={userRole} profile={profile}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/dashboard/cbt"><ArrowLeft className="w-4 h-4 mr-1" />Back to Exams</Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{exam.title}</CardTitle>
            {exam.description && <p className="text-sm text-muted-foreground mt-1">{exam.description}</p>}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><span>Duration: <strong>{exam.duration_minutes} min</strong></span></div>
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span>Questions: <strong>{questions.length}</strong></span></div>
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span>Starts: <strong>{format(new Date(exam.start_time), "MMM d, h:mm a")}</strong></span></div>
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span>Ends: <strong>{format(new Date(exam.end_time), "MMM d, h:mm a")}</strong></span></div>
            </div>

            {exam.allow_retake && (
              <p className="text-sm text-muted-foreground">Attempts: {attemptCount}/{exam.max_attempts}</p>
            )}

            {result && (
              <Card className="bg-muted/30 border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">Your Result</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-2xl font-bold text-primary">{result.obtained_marks}/{result.total_marks}</p><p className="text-xs text-muted-foreground">Score</p></div>
                    <div><p className="text-2xl font-bold">{result.percentage}%</p><p className="text-xs text-muted-foreground">Percentage</p></div>
                    <div>
                      <Badge className={result.passed ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>
                        {result.passed ? "PASSED" : result.theory_graded ? "FAILED" : "Pending"}
                      </Badge>
                      {!result.theory_graded && <p className="text-xs text-muted-foreground mt-1">Theory pending review</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isFuture(new Date(exam.start_time)) && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4" />Exam hasn't started yet
              </div>
            )}
            {isPast(new Date(exam.end_time)) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Clock className="w-4 h-4" />Exam period has ended
              </div>
            )}

            {canStart && (!hasSubmitted || canRetake) && (
              <Button className="w-full" size="lg" onClick={handleStart} disabled={starting}>
                {starting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlayCircle className="w-5 h-5 mr-2" />}
                {currentAttempt ? "Resume Exam" : "Start Exam"}
              </Button>
            )}

            {currentAttempt && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4" />You have an in-progress attempt. Click above to resume.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CBTExamView;
