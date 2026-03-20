import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCBTExamDetail, useCBTAttempt } from "@/hooks/useCBTExams";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight, Flag, Clock, AlertTriangle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CBTQuestion, CBTAnswer } from "@/types/cbt";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CBTExamTake = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useDashboardAuth();
  const { exam, questions: rawQuestions, loading: examLoading } = useCBTExamDetail(examId);
  const { currentAttempt, answers: savedAnswers, loading: attLoading, refetch } = useCBTAttempt(examId, user?.id);
  const { toast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<Record<string, { option_id?: string; theory?: string }>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [questions, setQuestions] = useState<CBTQuestion[]>([]);
  const tabSwitchRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize questions (shuffle if needed)
  useEffect(() => {
    if (rawQuestions.length > 0 && exam) {
      const qs = exam.shuffle_questions ? [...rawQuestions].sort(() => Math.random() - 0.5) : rawQuestions;
      setQuestions(qs);
    }
  }, [rawQuestions, exam]);

  // Initialize answers from saved
  useEffect(() => {
    if (savedAnswers.length > 0) {
      const map: Record<string, { option_id?: string; theory?: string }> = {};
      savedAnswers.forEach(a => {
        map[a.question_id] = { option_id: a.selected_option_id || undefined, theory: a.theory_answer || undefined };
      });
      setLocalAnswers(map);
    }
  }, [savedAnswers]);

  // Timer
  useEffect(() => {
    if (!currentAttempt) return;
    setTimeLeft(currentAttempt.time_remaining_seconds || 0);
    tabSwitchRef.current = currentAttempt.tab_switch_count;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentAttempt]);

  // Auto-save every 30s
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      saveProgress();
    }, 30000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [localAnswers, currentAttempt, timeLeft]);

  // Tab switch detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && currentAttempt) {
        tabSwitchRef.current += 1;
        supabase.from("cbt_attempts").update({ tab_switch_count: tabSwitchRef.current } as any).eq("id", currentAttempt.id).then(() => {});
        if (tabSwitchRef.current >= 2) {
          handleAutoSubmit();
          toast({ title: "Exam auto-submitted", description: "You switched tabs too many times.", variant: "destructive" });
        } else {
          setShowTabWarning(true);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [currentAttempt]);

  // Copy/paste prevention
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("copy", prevent);
    document.addEventListener("paste", prevent);
    document.addEventListener("contextmenu", prevent);
    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("contextmenu", prevent);
    };
  }, []);

  // Fullscreen on mount
  useEffect(() => {
    try { document.documentElement.requestFullscreen?.(); } catch {}
    return () => { try { document.exitFullscreen?.(); } catch {} };
  }, []);

  const saveProgress = useCallback(async () => {
    if (!currentAttempt) return;
    await supabase.from("cbt_attempts").update({ time_remaining_seconds: timeLeft } as any).eq("id", currentAttempt.id);
    const entries = Object.entries(localAnswers);
    for (const [qId, ans] of entries) {
      await supabase.from("cbt_answers").upsert({
        attempt_id: currentAttempt.id,
        question_id: qId,
        selected_option_id: ans.option_id || null,
        theory_answer: ans.theory || null,
      } as any, { onConflict: "attempt_id,question_id" });
    }
  }, [currentAttempt, localAnswers, timeLeft]);

  const handleAutoSubmit = async () => {
    await submitExam('auto_submitted');
  };

  const submitExam = async (status: 'submitted' | 'auto_submitted' = 'submitted') => {
    if (!currentAttempt || !exam || submitting) return;
    setSubmitting(true);
    await saveProgress();

    // Auto-grade MCQs
    let mcqScore = 0;
    let totalMarks = 0;
    for (const q of questions) {
      totalMarks += q.marks;
      if (q.question_type === 'mcq') {
        const ans = localAnswers[q.id];
        const correct = q.options?.find(o => o.is_correct);
        const isCorrect = ans?.option_id === correct?.id;
        if (isCorrect) mcqScore += q.marks;
        await supabase.from("cbt_answers").upsert({
          attempt_id: currentAttempt.id,
          question_id: q.id,
          selected_option_id: ans?.option_id || null,
          is_correct: isCorrect,
          marks_awarded: isCorrect ? q.marks : 0,
        } as any, { onConflict: "attempt_id,question_id" });
      }
    }

    const hasTheory = questions.some(q => q.question_type === 'theory');

    await supabase.from("cbt_attempts").update({
      status,
      submitted_at: new Date().toISOString(),
      time_remaining_seconds: timeLeft,
    } as any).eq("id", currentAttempt.id);

    await supabase.from("cbt_results").insert({
      attempt_id: currentAttempt.id,
      exam_id: exam.id,
      user_id: currentAttempt.user_id,
      total_marks: totalMarks,
      obtained_marks: mcqScore,
      mcq_score: mcqScore,
      theory_score: 0,
      theory_graded: !hasTheory,
      percentage: totalMarks > 0 ? Math.round((mcqScore / totalMarks) * 100 * 100) / 100 : 0,
    } as any);

    try { document.exitFullscreen?.(); } catch {}
    toast({ title: status === 'auto_submitted' ? "Exam auto-submitted" : "Exam submitted!" });
    navigate(`/dashboard/cbt/${exam.id}`);
  };

  const setAnswer = (questionId: string, option_id?: string, theory?: string) => {
    setLocalAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...(option_id !== undefined ? { option_id } : {}), ...(theory !== undefined ? { theory } : {}) },
    }));
  };

  if (authLoading || examLoading || attLoading) {
    return <div className="fixed inset-0 bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!exam || !currentAttempt || questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center flex-col gap-4">
        <p className="text-lg font-semibold">No active attempt found</p>
        <Button onClick={() => navigate(`/dashboard/cbt/${examId}`)}>Back to Exam</Button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(localAnswers).filter(k => localAnswers[k]?.option_id || localAnswers[k]?.theory?.trim()).length;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isLowTime = timeLeft < 300;

  return (
    <div className="fixed inset-0 bg-background flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card shadow-sm">
        <h2 className="font-heading font-bold text-sm md:text-base truncate">{exam.title}</h2>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono font-bold",
            isLowTime ? "bg-red-500/10 text-red-600 animate-pulse" : "bg-primary/10 text-primary"
          )}>
            <Clock className="w-4 h-4" />
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          <Button size="sm" variant="destructive" onClick={() => setShowSubmitDialog(true)}>
            <Send className="w-3.5 h-3.5 mr-1" />Submit
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question panel (hidden on mobile, shown as overlay) */}
        <div className="hidden md:flex w-52 border-r bg-card/50 flex-col p-3 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground mb-2">Questions ({answeredCount}/{questions.length} answered)</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, i) => {
              const answered = localAnswers[q.id]?.option_id || localAnswers[q.id]?.theory?.trim();
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "w-8 h-8 rounded text-xs font-medium transition-colors",
                    i === currentIndex ? "bg-primary text-primary-foreground" :
                    answered ? "bg-green-500/20 text-green-700 dark:text-green-400" :
                    "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question area */}
        <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs">{currentQ.question_type === 'mcq' ? 'Objective' : 'Theory'}</Badge>
              <span className="text-xs text-muted-foreground">{currentQ.marks} mark{currentQ.marks > 1 ? 's' : ''}</span>
              <span className="text-xs text-muted-foreground ml-auto">Question {currentIndex + 1} of {questions.length}</span>
            </div>

            <h3 className="text-lg md:text-xl font-semibold mb-6 leading-relaxed">{currentQ.question_text}</h3>

            {currentQ.question_type === 'mcq' && currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setAnswer(currentQ.id, opt.id)}
                    className={cn(
                      "w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm md:text-base flex items-center gap-3",
                      localAnswers[currentQ.id]?.option_id === opt.id
                        ? "border-primary bg-primary/5 font-medium shadow-sm"
                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border-2",
                      localAnswers[currentQ.id]?.option_id === opt.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground"
                    )}>
                      {opt.option_label}
                    </span>
                    {opt.option_text}
                  </button>
                ))}
              </div>
            )}

            {currentQ.question_type === 'theory' && (
              <Textarea
                value={localAnswers[currentQ.id]?.theory || ''}
                onChange={e => setAnswer(currentQ.id, undefined, e.target.value)}
                placeholder="Type your answer here..."
                className="min-h-[200px] md:min-h-[300px] text-base leading-relaxed"
              />
            )}
          </div>

          {/* Mobile question indicators */}
          <div className="flex flex-wrap gap-1.5 justify-center md:hidden mt-4 mb-2">
            {questions.map((q, i) => {
              const answered = localAnswers[q.id]?.option_id || localAnswers[q.id]?.theory?.trim();
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "w-7 h-7 rounded text-[10px] font-medium",
                    i === currentIndex ? "bg-primary text-primary-foreground" :
                    answered ? "bg-green-500/20 text-green-700" : "bg-muted text-muted-foreground"
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t max-w-2xl mx-auto w-full">
            <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" />Previous
            </Button>
            <span className="text-sm text-muted-foreground">{currentIndex + 1} / {questions.length}</span>
            <Button variant="outline" disabled={currentIndex === questions.length - 1} onClick={() => setCurrentIndex(currentIndex + 1)}>
              Next<ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Submit confirmation */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You've answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length && ` ${questions.length - answeredCount} question(s) are unanswered.`}
              {" "}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Exam</AlertDialogCancel>
            <AlertDialogAction onClick={() => submitExam('submitted')} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tab switch warning */}
      <AlertDialog open={showTabWarning} onOpenChange={setShowTabWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" />Warning!</AlertDialogTitle>
            <AlertDialogDescription>
              You switched away from the exam tab. This is your <strong>first and only warning</strong>.
              Switching tabs again will <strong>automatically submit your exam</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowTabWarning(false)}>I Understand</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CBTExamTake;
