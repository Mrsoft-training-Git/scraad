import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { useCBTExams } from "@/hooks/useCBTExams";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Clock, BookOpen, GraduationCap, Calendar } from "lucide-react";
import { format, isPast, isFuture } from "date-fns";

const CBTExamList = () => {
  const { user, profile, userRole, loading: authLoading } = useDashboardAuth();
  const { exams, loading } = useCBTExams(userRole);

  const getExamStatus = (exam: any) => {
    const now = new Date();
    if (isFuture(new Date(exam.start_time))) return { label: "Upcoming", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
    if (isPast(new Date(exam.end_time))) return { label: "Ended", color: "bg-muted text-muted-foreground border-border" };
    return { label: "Active", color: "bg-green-500/10 text-green-600 border-green-500/20" };
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout user={user} userRole={userRole} profile={profile}>
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading exams...</div>
      </DashboardLayout>
    );
  }

  const isAdmin = userRole === "admin" || userRole === "instructor";

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

        {exams.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No exams available</p>
            {isAdmin && <p className="text-sm mt-1">Create your first CBT exam to get started.</p>}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {exams.map(exam => {
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
                          <Link to={`/dashboard/cbt/${exam.id}`}>View Exam</Link>
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
