import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ZoomMeetingEmbed } from "@/components/zoom/ZoomMeetingEmbed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, LogOut, Calendar, Clock, BookOpen, User as UserIcon, ArrowLeft, Settings, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useZoom } from "@/hooks/useZoom";
import { format } from "date-fns";
import { User } from "@supabase/supabase-js";

interface SessionDetails {
  id: string;
  title: string;
  course_id: string | null;
  instructor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  course_title?: string;
  instructor_name?: string;
  zoom_join_url?: string | null;
}

const StudentLiveClass = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [meetingActive, setMeetingActive] = useState(false);
  const { joinLiveSession } = useZoom();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUser(session.user);
    }
  };

  const fetchSession = async () => {
    try {
      const { data, error } = await supabase
        .from("live_sessions")
        .select("id, title, course_id, instructor_id, scheduled_at, duration_minutes, status, zoom_join_url")
        .eq("id", sessionId)
        .single();

      if (error) throw error;

      let courseTitle = "";
      let instructorName = "";

      if (data.course_id) {
        const { data: courseData } = await supabase
          .from("courses")
          .select("title")
          .eq("id", data.course_id)
          .single();
        courseTitle = courseData?.title || "";
      }

      if (data.instructor_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.instructor_id)
          .single();
        instructorName = profileData?.full_name || "Instructor";
      }

      setSession({ 
        ...data, 
        course_title: courseTitle,
        instructor_name: instructorName,
      });
      setMeetingActive(data.status === "live");
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async () => {
    if (!sessionId) return;
    setMeetingActive(true);
  };

  const handleLeaveClass = () => {
    setMeetingActive(false);
  };

  const getStatusBadge = () => {
    if (!session) return null;
    
    if (session.status === "live") {
      return <Badge className="bg-red-600 hover:bg-red-700 animate-pulse">Live Now</Badge>;
    }
    if (session.status === "ended") {
      return <Badge variant="secondary">Ended</Badge>;
    }
    return <Badge variant="default">Upcoming</Badge>;
  };

  const canJoin = session?.status === "live";

  if (loading) {
    return (
      <DashboardLayout user={user} userRole="student">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-[500px] w-full" />
            </div>
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout user={user} userRole="student">
        <div className="text-center py-12">
          <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested live session could not be found.</p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} userRole="student">
      <div className="space-y-4">
        {/* Header - hidden when meeting is active */}
        {!meetingActive && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{session.title}</h1>
                  {getStatusBadge()}
                </div>
                <p className="text-sm text-muted-foreground">
                  {session.course_title || "No course assigned"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="relative">



          {/* Meeting Container - full width when active */}
          <div className={meetingActive ? "" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
            <div className={meetingActive ? "" : "lg:col-span-2"}>
              {sessionId && user && (
                <ZoomMeetingEmbed
                  sessionId={sessionId}
                  role={0}
                  userName={user.user_metadata?.full_name || user.email || "Student"}
                  userEmail={user.email}
                  zoomFallbackUrl={session?.zoom_join_url}
                  onMeetingStart={() => setMeetingActive(true)}
                  onMeetingEnd={() => setMeetingActive(false)}
                />
              )}
            </div>

            {/* Side panel - only shown when NOT active */}
            {!meetingActive && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Class Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{session.instructor_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(session.scheduled_at), "EEEE, MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(session.scheduled_at), "h:mm a")} ({session.duration_minutes} min)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{session.course_title || "No course"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Join Session</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {canJoin && (
                      <Button
                        className="w-full"
                        onClick={handleJoinClass}
                        disabled={meetingLoading}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Live Class
                      </Button>
                    )}

                    {!canJoin && session.status === "scheduled" && (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">
                          This session hasn't started yet.
                          <br />
                          Please wait for the instructor to start the class.
                        </p>
                      </div>
                    )}

                    {session.status === "ended" && (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">This session has ended.</p>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      variant="ghost"
                      onClick={() => navigate("/dashboard")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentLiveClass;
