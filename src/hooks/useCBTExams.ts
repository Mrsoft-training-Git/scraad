import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CBTExam, CBTQuestion, CBTOption, CBTAttempt, CBTAnswer, CBTResult } from "@/types/cbt";

export const useCBTExams = (userRole: string) => {
  const [exams, setExams] = useState<CBTExam[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExams = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cbt_exams")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Error loading exams", description: error.message, variant: "destructive" });
    else setExams((data as unknown as CBTExam[]) || []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  return { exams, loading, refetch: fetchExams };
};

export const useCBTExamDetail = (examId: string | undefined) => {
  const [exam, setExam] = useState<CBTExam | null>(null);
  const [questions, setQuestions] = useState<CBTQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExam = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    const [examRes, questionsRes] = await Promise.all([
      supabase.from("cbt_exams").select("*").eq("id", examId).single(),
      supabase.from("cbt_questions").select("*").eq("exam_id", examId).order("order_index"),
    ]);
    if (examRes.data) setExam(examRes.data as unknown as CBTExam);
    if (questionsRes.data) {
      const qs = questionsRes.data as unknown as CBTQuestion[];
      const mcqIds = qs.filter(q => q.question_type === 'mcq').map(q => q.id);
      if (mcqIds.length > 0) {
        const { data: opts } = await supabase.from("cbt_options").select("*").in("question_id", mcqIds).order("option_label");
        if (opts) {
          const optsByQ: Record<string, CBTOption[]> = {};
          (opts as unknown as CBTOption[]).forEach(o => {
            if (!optsByQ[o.question_id]) optsByQ[o.question_id] = [];
            optsByQ[o.question_id].push(o);
          });
          qs.forEach(q => { if (optsByQ[q.id]) q.options = optsByQ[q.id]; });
        }
      }
      setQuestions(qs);
    }
    setLoading(false);
  }, [examId]);

  useEffect(() => { fetchExam(); }, [fetchExam]);

  return { exam, questions, loading, refetch: fetchExam };
};

export const useCBTAttempt = (examId: string | undefined, userId: string | undefined) => {
  const [attempts, setAttempts] = useState<CBTAttempt[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<CBTAttempt | null>(null);
  const [answers, setAnswers] = useState<CBTAnswer[]>([]);
  const [result, setResult] = useState<CBTResult | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAttempts = useCallback(async () => {
    if (!examId || !userId) return;
    setLoading(true);
    const [attRes, resRes] = await Promise.all([
      supabase.from("cbt_attempts").select("*").eq("exam_id", examId).eq("user_id", userId).order("started_at", { ascending: false }),
      supabase.from("cbt_results").select("*").eq("exam_id", examId).eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
    ]);
    const atts = (attRes.data as unknown as CBTAttempt[]) || [];
    setAttempts(atts);
    const inProgress = atts.find(a => a.status === 'in_progress');
    if (inProgress) {
      setCurrentAttempt(inProgress);
      const { data: ans } = await supabase.from("cbt_answers").select("*").eq("attempt_id", inProgress.id);
      setAnswers((ans as unknown as CBTAnswer[]) || []);
    }
    if (resRes.data && resRes.data.length > 0) setResult(resRes.data[0] as unknown as CBTResult);
    setLoading(false);
  }, [examId, userId]);

  useEffect(() => { fetchAttempts(); }, [fetchAttempts]);

  return { attempts, currentAttempt, answers, result, loading, refetch: fetchAttempts, setCurrentAttempt, setAnswers };
};
