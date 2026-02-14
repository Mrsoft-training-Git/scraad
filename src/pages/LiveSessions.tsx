import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, Clock, Users, Play, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface LiveSession {
  id: string;
  title: string;
  course_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  course_title?: string;
}

const LiveSessions = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const role = roleData?.role || "student";
      setUserRole(role);
      fetchSessions(session.user.id, role);
    };
    checkAuth();
  }, [navigate]);

  const fetchSessions = async (userId: string, role: string) => {
    try {
      let query = supabase
        .from("live_sessions")
        .select("id, title, course_id, scheduled_at, duration_minutes, status")
        .order("scheduled_at", { ascending: false });

      if (role === "instructor") {
        query = query.eq("instructor_id", userId);
      } else {
        const { data: enrollments } = await supabase
          .from("enrolled_courses")
          .select("course_id")
          .eq("user_id", userId);

        const courseIds = enrollments?.map(e => e.course_id).filter(Boolean) as string[];
        if (!courseIds || courseIds.length === 0) {
          setSessions([]);
          setLoading(false);
          return;
        }
        query = query.in("course_id", courseIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        const courseIds = [...new Set(data.map(s => s.course_id).filter(Boolean))];
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, title")
          .in("id", courseIds);

        const coursesMap = new Map(coursesData?.map(c => [c.id, c.title]) || []);

        setSessions(data.map(s => ({
          ...s,
          course_title: s.course_id ? coursesMap.get(s.course_id) || "Unknown" : "No course",
        })));
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, scheduledAt: string, durationMinutes: number) => {
    const now = new Date();
    const sessionTime = new Date(scheduledAt);
    const sessionEndTime = new Date(sessionTime.getTime() + durationMinutes * 60 * 1000);

    if (status === "live") return <Badge className="bg-red-600 hover:bg-red-700 animate-pulse">Live</Badge>;
    if (status === "ended") return <Badge variant="secondary">Ended</Badge>;
    if (status === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
    if (sessionTime < now && now < sessionEndTime) return <Badge className="bg-orange-500 hover:bg-orange-600">In Progress</Badge>;
    if (sessionTime < now) return <Badge variant="outline">Missed</Badge>;
    return <Badge variant="default">Upcoming</Badge>;
  };

  const handleViewSession = (sessionId: string) => {
    if (userRole === "instructor") {
      navigate(`/dashboard/live-class/${sessionId}`);
    } else {
      navigate(`/dashboard/join-class/${sessionId}`);
    }
  };

  // Split into past and upcoming/live
  const now = new Date();
  const pastSessions = sessions.filter(s => {
    const endTime = new Date(new Date(s.scheduled_at).getTime() + s.duration_minutes * 60 * 1000);
    return s.status === "ended" || s.status === "cancelled" || (s.status === "scheduled" && endTime < now);
  });
  const currentSessions = sessions.filter(s => !pastSessions.includes(s));

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Live Sessions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">View all your live class sessions</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <Card className="border border-border/60 shadow-none">
            <CardContent className="py-12 text-center">
              <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading font-bold text-xl mb-2">No Live Sessions</h3>
              <p className="text-muted-foreground">No live sessions available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Current / Upcoming */}
            {currentSessions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Upcoming & Active</h3>
                {currentSessions.map(session => (
                  <Card key={session.id} className="border border-border/60 shadow-none">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-medium">{session.title}</h4>
                          {getStatusBadge(session.status, session.scheduled_at, session.duration_minutes)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{session.course_title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(session.scheduled_at), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(session.scheduled_at), "h:mm a")}
                          </span>
                          <span>{session.duration_minutes}m</span>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleViewSession(session.id)}>
                        {userRole === "instructor" ? (
                          <><Play className="h-3 w-3 mr-1" /> Open</>
                        ) : (
                          <><Video className="h-3 w-3 mr-1" /> Join</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Past Sessions */}
            {pastSessions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Past Sessions</h3>
                {pastSessions.map(session => (
                  <Card key={session.id} className="border border-border/60 shadow-none">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-medium text-muted-foreground">{session.title}</h4>
                          {getStatusBadge(session.status, session.scheduled_at, session.duration_minutes)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{session.course_title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(session.scheduled_at), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(session.scheduled_at), "h:mm a")}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleViewSession(session.id)}>
                        <Eye className="h-3 w-3 mr-1" /> Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LiveSessions;