import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ZoomMeetingEmbed } from "@/components/zoom/ZoomMeetingEmbed";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, Play, Square, LogOut, Calendar, Clock, BookOpen, Users, ArrowLeft, Settings, ChevronDown } from "lucide-react";
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
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  course_title?: string;
  zoom_start_url?: string | null;
  zoom_join_url?: string | null;
}

const InstructorLiveClass = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [meetingActive, setMeetingActive] = useState(false);
  const { startLiveSession, endLiveSession } = useZoom();

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
        .select("id, title, course_id, scheduled_at, duration_minutes, status, zoom_start_url, zoom_join_url")
        .eq("id", sessionId)
        .single();

      if (error) throw error;

      let courseTitle = "";
      if (data.course_id) {
        const { data: courseData } = await supabase
          .from("courses")
          .select("title")
          .eq("id", data.course_id)
          .single();
        courseTitle = courseData?.title || "";
      }

      setSession({ ...data, course_title: courseTitle });
      setMeetingActive(data.status === "live");
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartClass = async () => {
    if (!sessionId) return;
    setMeetingLoading(true);
    
    const result = await startLiveSession(sessionId);
    if (result.success) {
      setMeetingActive(true);
      setSession(prev => prev ? { ...prev, status: "live" } : null);
    }
    
    setMeetingLoading(false);
  };

  const handleEndClass = async () => {
    if (!sessionId) return;
    setMeetingLoading(true);
    
    const success = await endLiveSession(sessionId);
    if (success) {
      setMeetingActive(false);
      setSession(prev => prev ? { ...prev, status: "ended" } : null);
      // TODO: Leave Zoom Web SDK meeting
    }
    
    setMeetingLoading(false);
  };

  const handleLeaveClass = () => {
    // TODO: Leave Zoom Web SDK meeting without ending
    navigate("/dashboard");
  };

  const getStatusBadge = () => {
    if (!session) return null;
    
    if (session.status === "live") {
      return <Badge className="bg-red-600 hover:bg-red-700 animate-pulse">Live</Badge>;
    }
    if (session.status === "ended") {
      return <Badge variant="secondary">Ended</Badge>;
    }
    return <Badge variant="default">Scheduled</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout user={user} userRole="instructor">
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
      <DashboardLayout user={user} userRole="instructor">
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
    <DashboardLayout user={user} userRole="instructor">
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

        {/* Meeting Area + Floating Controls */}
        <div className="relative">
          {/* Floating dropdown when meeting is active */}
          {meetingActive && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              {getStatusBadge()}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="shadow-lg">
                    <Settings className="h-4 w-4 mr-1" />
                    Class Options
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-3 space-y-3">
                  {/* Info Section */}
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">{session.title}</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(new Date(session.scheduled_at), "EEEE, MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{format(new Date(session.scheduled_at), "h:mm a")} ({session.duration_minutes} min)</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{session.course_title || "No course"}</span>
                    </div>
                  </div>
                  <div className="border-t border-border pt-3 space-y-2">
                    <Button
                      className="w-full"
                      variant="destructive"
                      size="sm"
                      onClick={handleEndClass}
                      disabled={meetingLoading}
                    >
                      <Square className="h-3.5 w-3.5 mr-2" />
                      End Class
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      size="sm"
                      onClick={handleLeaveClass}
                    >
                      <LogOut className="h-3.5 w-3.5 mr-2" />
                      Leave Class
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Meeting Container - full width when active */}
          <div className={meetingActive ? "" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
            <div className={meetingActive ? "" : "lg:col-span-2"}>
              {sessionId && user && (
                <ZoomMeetingEmbed
                  sessionId={sessionId}
                  role={1}
                  userName={user.user_metadata?.full_name || user.email || "Instructor"}
                  userEmail={user.email}
                  zoomFallbackUrl={session?.zoom_start_url}
                  onMeetingStart={() => {
                    setMeetingActive(true);
                    setSession(prev => prev ? { ...prev, status: "live" } : null);
                  }}
                  onMeetingEnd={() => {
                    setMeetingActive(false);
                    setSession(prev => prev ? { ...prev, status: "ended" } : null);
                  }}
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
                    <CardTitle className="text-lg">Controls</CardTitle>
                    <CardDescription>Manage your live class session</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {session.status !== "ended" && (
                      <Button
                        className="w-full"
                        onClick={handleStartClass}
                        disabled={meetingLoading}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Class
                      </Button>
                    )}
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleLeaveClass}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Leave Class
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

export default InstructorLiveClass;
