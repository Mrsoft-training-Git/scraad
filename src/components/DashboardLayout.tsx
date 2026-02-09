import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Menu } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
  user: User | null;
  userRole: string;
  hideTopBar?: boolean;
}

export const DashboardLayout = ({ children, user, userRole, hideTopBar = false }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);
  const [unreadAssignmentsCount, setUnreadAssignmentsCount] = useState(0);

  useEffect(() => {
    if (userRole === "student" && user) {
      const fetchUnreadCounts = async () => {
        // Get all enrollments
        const { data: enrollments } = await supabase
          .from("enrolled_courses")
          .select("course_id")
          .eq("user_id", user.id);

        if (!enrollments || enrollments.length === 0) {
          setUnreadAnnouncementsCount(0);
          setUnreadAssignmentsCount(0);
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
          const unread = announcementIds.filter(id => !readSet.has(id)).length;
          setUnreadAnnouncementsCount(unread);
        }

        // Fetch unread assignments (not submitted)
        const { data: assignments } = await supabase
          .from("course_assignments")
          .select("id")
          .eq("is_published", true)
          .in("course_id", courseIds);

        if (assignments && assignments.length > 0) {
          const assignmentIds = assignments.map(a => a.id);
          
          // Get student's submissions
          const { data: submissions } = await supabase
            .from("assignment_submissions")
            .select("assignment_id, status")
            .eq("student_id", user.id)
            .in("assignment_id", assignmentIds);

          const submittedSet = new Set(
            submissions?.filter(s => s.status === "submitted" || s.status === "graded").map(s => s.assignment_id) || []
          );
          
          const unsubmitted = assignmentIds.filter(id => !submittedSet.has(id)).length;
          setUnreadAssignmentsCount(unsubmitted);
        }
      };

      fetchUnreadCounts();
    }
  }, [user, userRole]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error logging out");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar 
          userRole={userRole} 
          unreadAnnouncementsCount={unreadAnnouncementsCount}
          unreadAssignmentsCount={unreadAssignmentsCount}
        />
      </div>
      
      <main className="flex-1 flex flex-col w-full">
        {/* Sticky top bar */}
        {!hideTopBar && (
        <div className="sticky top-0 z-30 bg-card border-b border-border px-4 md:px-8 py-4 md:py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <DashboardSidebar 
                  userRole={userRole} 
                  unreadAnnouncementsCount={unreadAnnouncementsCount}
                  unreadAssignmentsCount={unreadAssignmentsCount}
                />
              </SheetContent>
            </Sheet>
            
            <div>
              <div className="inline-block px-3 md:px-4 py-1 bg-primary text-primary-foreground rounded-lg text-xs md:text-sm font-semibold mb-1 md:mb-2">
                Dashboard
              </div>
              <p className="text-muted-foreground text-sm hidden sm:block">Welcome back</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-2.5 hover:bg-accent/10 rounded-lg transition-all cursor-pointer border-2 border-border hover:border-primary bg-background shadow-sm">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs md:text-sm font-bold text-primary">
                    {(user?.email?.split("@")[0]?.charAt(0).toUpperCase()) || "U"}
                  </span>
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-sm text-foreground">
                    {user?.email?.split("@")[0] || "User"}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">{userRole}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[100] bg-popover border-2 shadow-lg">
              <DropdownMenuItem 
                onClick={() => navigate("/dashboard/profile")} 
                className="cursor-pointer hover:bg-accent focus:bg-accent px-4 py-3"
              >
                <span className="font-medium">Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-destructive cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 px-4 py-3"
              >
                <span className="font-medium">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        )}
        
        {/* Scrollable content area */}
        <div className={hideTopBar ? "flex-1 overflow-y-auto p-0" : "flex-1 overflow-y-auto p-4 md:p-8"}>
          {children}
        </div>
      </main>
    </div>
  );
};