import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Clock, Calendar, Users, Play, Eye, Plus, Loader2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ScheduleSessionDialog } from "./ScheduleSessionDialog";
import { format } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [open, setOpen] = useState(false);
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
        .select(`id, title, course_id, scheduled_at, duration_minutes, status`)
        .order("scheduled_at", { ascending: true });

      if (isInstructor) {
        query = query.eq("instructor_id", user.id);
      } else {
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
      return <Badge className="bg-red-600 hover:bg-red-700 animate-pulse text-[10px] px-1.5 py-0">Live</Badge>;
    }
    if (status === "ended") {
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Ended</Badge>;
    }
    if (status === "cancelled") {
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Cancelled</Badge>;
    }
    if (sessionTime < now) {
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Missed</Badge>;
    }
    return <Badge variant="default" className="text-[10px] px-1.5 py-0">Upcoming</Badge>;
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

  const liveCount = sessions.filter(s => s.status === "live").length;
  const upcomingCount = sessions.filter(s => s.status === "scheduled").length;

  const summaryText = loading
    ? "Loading..."
    : sessions.length === 0
    ? "No sessions"
    : liveCount > 0
    ? `${liveCount} live now`
    : `${upcomingCount} upcoming`;

  return (
    <>
      <Card className="border border-border/60 shadow-none overflow-hidden">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left cursor-pointer">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Video className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {isInstructor ? "My Live Sessions" : "Live Sessions"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{summaryText}</p>
              </div>
              {liveCount > 0 && (
                <Badge className="bg-red-600/90 hover:bg-red-700 animate-pulse text-[10px] px-2 py-0.5 flex-shrink-0">
                  {liveCount} Live
                </Badge>
              )}
              {liveCount === 0 && sessions.length > 0 && (
                <span className="text-[11px] font-medium text-muted-foreground flex-shrink-0">
                  {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="px-5 pb-4 pt-0 border-t border-border/40">
              <div className="pt-3">
                {isInstructor && (
                  <div className="mb-3">
                    <Button onClick={() => setDialogOpen(true)} size="sm" className="h-8 text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Schedule Session
                    </Button>
                  </div>
                )}

                {sessions.length === 0 ? (
                  <div className="text-center py-6">
                    <Video className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">
                      {isInstructor
                        ? "No sessions scheduled yet."
                        : "No live sessions for your courses."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-border/40 rounded-lg gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-medium truncate">{session.title}</h4>
                            {getStatusBadge(session.status, session.scheduled_at)}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 truncate">
                            {session.course?.title || "No course assigned"}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
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
                              {session.duration_minutes}m
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {isInstructor && (session.status === "live" || session.status === "scheduled") && (
                            <Button size="sm" className="h-7 text-xs px-2.5" onClick={() => handleStartClass(session.id)}>
                              <Play className="h-3 w-3 mr-1" />
                              {session.status === "live" ? "Continue" : "Start"}
                            </Button>
                          )}
                          {!isInstructor && session.status === "live" && (
                            <Button size="sm" className="h-7 text-xs px-2.5" onClick={() => handleViewDetails(session.id)}>
                              <Video className="h-3 w-3 mr-1" />
                              Join
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={() => handleViewDetails(session.id)}>
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <ScheduleSessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSessionCreated={fetchSessions}
      />
    </>
  );
};
