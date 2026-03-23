import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Clock, BookOpen, GraduationCap, Calendar } from "lucide-react";
import { format, isPast, isFuture } from "date-fns";
import type { CBTExam } from "@/types/cbt";

type ExamStatus = "upcoming" | "active" | "ended" | "completed";

const CBTExamList = () => {
  const { user, profile, userRole, loading: authLoading } = useDashboardAuth();
  const [exams, setExams] = useState<CBTExam[]>([]);
  const [completedExamIds, setCompletedExamIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ExamStatus>("all");

  const isAdmin = userRole === "admin" || userRole === "instructor";

  const fetchExams = useCallback(async () => {
    if (!user || authLoading) return;
    setLoading(true);

    // Fetch user's completed exams
    const { data: results } = await supabase
      .from("cbt_results")
      .select("exam_id")
      .eq("user_id", user.id);
    setCompletedExamIds(new Set((results || []).map(r => r.exam_id)));

    if (isAdmin) {
      const { data } = await supabase
        .from("cbt_exams")
        .select("*")
        .order("created_at", { ascending: false });
      setExams((data as unknown as CBTExam[]) || []);
    } else {
      const [courseEnr, progEnr] = await Promise.all([
        supabase.from("enrollments").select("course_id").eq("user_id", user.id),
        supabase.from("program_enrollments").select("program_id").eq("user_id", user.id),
      ]);

      const courseIds = (courseEnr.data || []).map(e => e.course_id);
      const programIds = (progEnr.data || []).map(e => e.program_id);

      let allExams: CBTExam[] = [];
      if (courseIds.length > 0) {
        const { data } = await supabase.from("cbt_exams").select("*").eq("is_published", true).eq("exam_type", "course").in("course_id", courseIds);
        if (data) allExams.push(...(data as unknown as CBTExam[]));
      }
      if (programIds.length > 0) {
        const { data } = await supabase.from("cbt_exams").select("*").eq("is_published", true).eq("exam_type", "program").in("program_id", programIds);
        if (data) allExams.push(...(data as unknown as CBTExam[]));
      }

      const unique = Array.from(new Map(allExams.map(e => [e.id, e])).values());
      unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setExams(unique);
    }
    setLoading(false);
  }, [user, isAdmin, authLoading]);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const getExamStatus = (exam: CBTExam): { label: string; status: ExamStatus; color: string } => {
    if (completedExamIds.has(exam.id)) return { label: "Completed", status: "completed", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" };
    if (isFuture(new Date(exam.start_time))) return { label: "Upcoming", status: "upcoming", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
    if (isPast(new Date(exam.end_time))) return { label: "Ended", status: "ended", color: "bg-muted text-muted-foreground border-border" };
    return { label: "Active", status: "active", color: "bg-green-500/10 text-green-600 border-green-500/20" };
  };

  const filteredExams = exams.filter(e => {
    if (filter === "all") return true;
    return getExamStatus(e).status === filter;
  });

  if (authLoading || loading) {
    return (
      <DashboardLayout user={user} userRole={userRole} profile={profile}>
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading exams...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} userRole={userRole} profile={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">CBT Exams</h1>
            <p className="text-sm text-muted-foreground">Computer-Based Test examinations</p>
          </div>
          {isAdmin && (
            <Button asChild>
              <Link to="/dashboard/cbt/create"><Plus className="w-4 h-4 mr-2" />Create Exam</Link>
            </Button>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {(["all", "upcoming", "active", "completed", "ended"] as const).map(status => (
            <Badge
              key={status}
              variant={filter === status ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-xs whitespace-nowrap hover:bg-primary hover:text-primary-foreground transition-colors capitalize"
              onClick={() => setFilter(status)}
            >
              {status === "all" ? `All (${exams.length})` : `${status.charAt(0).toUpperCase() + status.slice(1)} (${exams.filter(e => getExamStatus(e).status === status).length})`}
            </Badge>
          ))}
        </div>

        {filteredExams.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">{exams.length === 0 ? "No exams available" : "No exams match this filter"}</p>
            {isAdmin && exams.length === 0 && <p className="text-sm mt-1">Create your first CBT exam to get started.</p>}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredExams.map(exam => {
              const status = getExamStatus(exam);
              return (
                <Card key={exam.id} className="border-border/60 hover:border-primary/20 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{exam.title}</h3>
                        {exam.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{exam.description}</p>}
                      </div>
                      <Badge className={`ml-2 ${status.color}`}>{status.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        {exam.exam_type === 'course' ? <BookOpen className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                        {exam.exam_type === 'course' ? 'Course' : 'Program'} Exam
                        {exam.track && <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0">{exam.track}</Badge>}
                      </span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{exam.duration_minutes} min</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(exam.start_time), "MMM d, h:mm a")}</span>
                    </div>
                    <div className="flex gap-2">
                      {isAdmin ? (
                        <>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/dashboard/cbt/${exam.id}/manage`}>Manage</Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/dashboard/cbt/${exam.id}/submissions`}>Submissions</Link>
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" asChild>
                          <Link to={`/dashboard/cbt/${exam.id}`}>
                            {status.status === "completed" ? "View Result" : status.status === "active" ? "Take Exam" : status.status === "upcoming" ? "View Details" : "View Result"}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CBTExamList;
