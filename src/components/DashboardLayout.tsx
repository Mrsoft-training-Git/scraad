import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Menu, Bell, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

interface DashboardLayoutProps {
  children: ReactNode;
  user: User | null;
  userRole: string;
  hideTopBar?: boolean;
  profile?: { full_name?: string | null; avatar_url?: string | null } | null;
}

export const DashboardLayout = ({ children, user, userRole, hideTopBar = false, profile }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);
  const [unreadAssignmentsCount, setUnreadAssignmentsCount] = useState(0);
  const [unreadDiscussionsCount, setUnreadDiscussionsCount] = useState(0);

  useEffect(() => {
    if (userRole === "student" && user) {
      fetchUnreadCounts();
    }
  }, [user, userRole]);

  const fetchUnreadCounts = async () => {
    if (!user) return;
    const { data: enrollments } = await supabase
      .from("enrolled_courses")
      .select("course_id")
      .eq("user_id", user.id);

    if (!enrollments || enrollments.length === 0) {
      setUnreadAnnouncementsCount(0);
      setUnreadAssignmentsCount(0);
      setUnreadDiscussionsCount(0);
      return;
    }

    const courseIds = enrollments.map(e => e.course_id).filter(Boolean);

    // Fetch unread announcements
    const { data: announcements } = await supabase
      .from("course_announcements")
      .select("id")
      .in("course_id", courseIds);

    if (announcements) {
      const announcementIds = announcements.map(a => a.id);
      const { data: reads } = await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .eq("user_id", user.id)
        .in("announcement_id", announcementIds);

      const readSet = new Set(reads?.map(r => r.announcement_id) || []);
      setUnreadAnnouncementsCount(announcementIds.filter(id => !readSet.has(id)).length);
    }

    // Fetch unread assignments
    const { data: assignments } = await supabase
      .from("course_assignments")
      .select("id")
      .eq("is_published", true)
      .in("course_id", courseIds);

    if (assignments && assignments.length > 0) {
      const assignmentIds = assignments.map(a => a.id);
      const { data: submissions } = await supabase
        .from("assignment_submissions")
        .select("assignment_id, status")
        .eq("student_id", user.id)
        .in("assignment_id", assignmentIds);

      const submittedSet = new Set(
        submissions?.filter(s => s.status === "submitted" || s.status === "graded").map(s => s.assignment_id) || []
      );
      setUnreadAssignmentsCount(assignmentIds.filter(id => !submittedSet.has(id)).length);
    }

    // Fetch new discussions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentThreads } = await supabase
      .from("discussion_threads")
      .select("id")
      .in("course_id", courseIds)
      .gte("created_at", sevenDaysAgo.toISOString());

    if (recentThreads) {
      const { data: ownThreads } = await supabase
        .from("discussion_threads")
        .select("id")
        .in("course_id", courseIds)
        .gte("created_at", sevenDaysAgo.toISOString())
        .eq("user_id", user.id);

      const ownSet = new Set(ownThreads?.map(t => t.id) || []);
      setUnreadDiscussionsCount(recentThreads.filter(t => !ownSet.has(t.id)).length);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error logging out");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };

  const totalUnread = unreadAnnouncementsCount + unreadAssignmentsCount + unreadDiscussionsCount;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar
          userRole={userRole}
          unreadAnnouncementsCount={unreadAnnouncementsCount}
          unreadAssignmentsCount={unreadAssignmentsCount}
          unreadDiscussionsCount={unreadDiscussionsCount}
        />
      </div>

      <main className="flex-1 flex flex-col w-full min-w-0">
        {/* Sticky top bar */}
        {!hideTopBar && (
          <div className="sticky top-0 z-30 bg-card border-b border-border px-4 md:px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 text-muted-foreground">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-60">
                  <DashboardSidebar
                    userRole={userRole}
                    unreadAnnouncementsCount={unreadAnnouncementsCount}
                    unreadAssignmentsCount={unreadAssignmentsCount}
                    unreadDiscussionsCount={unreadDiscussionsCount}
                  />
                </SheetContent>
              </Sheet>

              <h1 className="font-heading text-base md:text-lg font-semibold text-foreground tracking-tight">Dashboard</h1>
            </div>

            {/* Right side: notifications + avatar */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/dashboard/announcements")}
              >
                <Bell className="w-[18px] h-[18px]" />
                {totalUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
              </Button>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded-lg transition-all cursor-pointer group">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-8 h-8 rounded-lg object-cover ring-1 ring-border" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center ring-1 ring-border">
                        <span className="text-xs font-semibold text-primary-foreground">
                          {(profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="text-left hidden sm:block">
                      <div className="font-medium text-sm text-foreground leading-tight">
                        {profile?.full_name || user?.email?.split("@")[0] || "User"}
                      </div>
                      <div className="text-[11px] text-muted-foreground capitalize leading-tight">{userRole}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 z-[100] bg-card border border-border shadow-lg rounded-xl p-1">
                  <DropdownMenuItem
                    onClick={() => navigate("/dashboard/profile")}
                    className="cursor-pointer hover:bg-muted px-3 py-2 rounded-lg text-sm"
                  >
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive cursor-pointer hover:bg-destructive/10 px-3 py-2 rounded-lg text-sm"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Scrollable content area */}
        <div className={hideTopBar ? "flex-1 overflow-y-auto p-0" : "flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"}>
          {children}
        </div>
      </main>
    </div>
  );
};
