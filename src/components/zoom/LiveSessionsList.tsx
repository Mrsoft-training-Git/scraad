import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Clock, Calendar, Users, Play, Eye, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ScheduleSessionDialog } from "./ScheduleSessionDialog";
import { format } from "date-fns";

interface LiveSession {
  id: string;
  title: string;
  course_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  course?: {
    title: string;
  } | null;
}

interface LiveSessionsListProps {
  isInstructor?: boolean;
}

export const LiveSessionsList = ({ isInstructor = false }: LiveSessionsListProps) => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("live_sessions")
        .select(`
          id,
          title,
          course_id,
          scheduled_at,
          duration_minutes,
          status
        `)
        .order("scheduled_at", { ascending: true });

      if (isInstructor) {
        query = query.eq("instructor_id", user.id);
      } else {
        // For students/admins, only show sessions for courses they're enrolled in
        const { data: enrollments } = await supabase
          .from("enrolled_courses")
          .select("course_id")
          .eq("user_id", user.id);

        const enrolledCourseIds = enrollments?.map(e => e.course_id).filter(Boolean) as string[];
        
        if (!enrolledCourseIds || enrolledCourseIds.length === 0) {
          setSessions([]);
          setLoading(false);
          return;
        }

        query = query.in("course_id", enrolledCourseIds);
      }

      const { data: sessionsData, error } = await query;
      if (error) throw error;

      // Fetch course titles separately
      if (sessionsData && sessionsData.length > 0) {
        const courseIds = [...new Set(sessionsData.map(s => s.course_id).filter(Boolean))];
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, title")
          .in("id", courseIds);

        const coursesMap = new Map(coursesData?.map(c => [c.id, c]) || []);
        
        const sessionsWithCourses = sessionsData.map(session => ({
          ...session,
          course: session.course_id ? coursesMap.get(session.course_id) : null,
        }));

        setSessions(sessionsWithCourses);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, scheduledAt: string) => {
    const now = new Date();
    const sessionTime = new Date(scheduledAt);
    
    if (status === "live") {
      return <Badge className="bg-red-600 hover:bg-red-700 animate-pulse">Live Now</Badge>;
    }
    if (status === "ended") {
      return <Badge variant="secondary">Ended</Badge>;
    }
    if (status === "cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (sessionTime < now) {
      return <Badge variant="outline">Missed</Badge>;
    }
    return <Badge variant="default">Upcoming</Badge>;
  };

  const handleViewDetails = (sessionId: string) => {
    if (isInstructor) {
      navigate(`/dashboard/live-class/${sessionId}`);
    } else {
      navigate(`/dashboard/join-class/${sessionId}`);
    }
  };

  const handleStartClass = (sessionId: string) => {
    navigate(`/dashboard/live-class/${sessionId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {isInstructor ? "My Live Sessions" : "Upcoming Live Sessions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              {isInstructor ? "My Live Sessions" : "Upcoming Live Sessions"}
            </CardTitle>
            <CardDescription>
              {isInstructor 
                ? "Manage your scheduled live classes" 
                : "Join live sessions from your enrolled courses"
              }
            </CardDescription>
          </div>
          {isInstructor && (
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {isInstructor 
                  ? "No live sessions scheduled. Create your first session!" 
                  : "No upcoming live sessions for your courses."
                }
              </p>
              {isInstructor && (
                <Button onClick={() => setDialogOpen(true)} className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Session
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{session.title}</h4>
                      {getStatusBadge(session.status, session.scheduled_at)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {session.course?.title || "No course assigned"}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(session.scheduled_at), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(session.scheduled_at), "h:mm a")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {session.duration_minutes} min
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {isInstructor && session.status === "live" && (
                      <Button size="sm" onClick={() => handleStartClass(session.id)}>
                        <Play className="h-4 w-4 mr-1" />
                        Continue
                      </Button>
                    )}
                    {isInstructor && session.status === "scheduled" && (
                      <Button size="sm" onClick={() => handleStartClass(session.id)}>
                        <Play className="h-4 w-4 mr-1" />
                        Start Class
                      </Button>
                    )}
                    {!isInstructor && session.status === "live" && (
                      <Button size="sm" onClick={() => handleViewDetails(session.id)}>
                        <Video className="h-4 w-4 mr-1" />
                        Join Class
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(session.id)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ScheduleSessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSessionCreated={fetchSessions}
      />
    </>
  );
};
