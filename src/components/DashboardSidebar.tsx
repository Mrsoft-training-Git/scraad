import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, FileText, GraduationCap, Calendar, CreditCard, User,
  BookMarked, Shield, Users, ChevronLeft, Briefcase, FileClock, Megaphone,
  MessageSquare, ClipboardList, Video, UserPlus, Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import logo from "@/assets/scraad-logo-official.png";
import mrsoftLogo from "@/assets/mrsoft-logo.jpeg";
import { MRsoftAttribution } from "@/components/MRsoftAttribution";

const allMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", roles: ["admin", "student", "instructor"] },
  { icon: Briefcase, label: "Career", path: "/dashboard/career", roles: ["admin"] },
  { icon: BookOpen, label: "Course Allocation", path: "/dashboard/course-allocation", roles: ["admin"] },
  { icon: GraduationCap, label: "Programs", path: "/dashboard/programs", roles: ["admin", "instructor"] },
  { icon: FileText, label: "Courses", path: "/dashboard/courses", roles: ["admin", "instructor"] },
  { icon: FileText, label: "Create Content", path: "/dashboard/create-content", roles: ["admin", "instructor"] },
  { icon: FileClock, label: "Drafts", path: "/dashboard/drafts", roles: ["admin"] },
  { icon: GraduationCap, label: "Learning", path: "/dashboard/learning", roles: ["admin", "student", "instructor"] },
  { icon: Calendar, label: "Manage Classes", path: "/dashboard/classes", roles: ["admin", "instructor"] },
  { icon: Video, label: "Live Sessions", path: "/dashboard/live-sessions", roles: ["student", "instructor"] },
  { icon: Megaphone, label: "Announcements", path: "/dashboard/announcements", roles: ["admin", "student", "instructor"] },
  { icon: MessageSquare, label: "Discussions", path: "/dashboard/discussions", roles: ["admin", "student", "instructor"] },
  { icon: ClipboardList, label: "Assignments", path: "/dashboard/assignments", roles: ["admin", "student", "instructor"] },
  { icon: Monitor, label: "CBT Exams", path: "/dashboard/cbt", roles: ["admin", "student", "instructor"] },
  { icon: CreditCard, label: "Payments", path: "/dashboard/payments", roles: ["admin"] },
  { icon: UserPlus, label: "Enrollments", path: "/dashboard/enrollments", roles: ["admin"] },
  { icon: CreditCard, label: "Bills", path: "/dashboard/bills", roles: ["student", "instructor"] },
  { icon: User, label: "Profile Update", path: "/dashboard/profile", roles: ["admin", "student", "instructor"] },
  { icon: BookMarked, label: "References", path: "/dashboard/references", roles: ["admin"] },
  { icon: Shield, label: "Role Management", path: "/dashboard/roles", roles: ["admin"] },
  { icon: Users, label: "User Management", path: "/dashboard/users", roles: ["admin"] },
];

interface DashboardSidebarProps {
  userRole: string;
  unreadAnnouncementsCount?: number;
  unreadAssignmentsCount?: number;
  unreadDiscussionsCount?: number;
}

export const DashboardSidebar = ({ userRole, unreadAnnouncementsCount = 0, unreadAssignmentsCount = 0, unreadDiscussionsCount = 0 }: DashboardSidebarProps) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground h-screen lg:sticky top-0 flex flex-col transition-all duration-300",
        collapsed ? "lg:w-[72px]" : "lg:w-60",
        "w-full"
      )}
    >
      {/* Header */}
      <div className="px-4 py-5 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed ? (
          <Link to="/" className="flex flex-col items-start leading-none hover:opacity-80 transition-opacity">
            <img src={logo} alt="ScraAD" className="h-7 w-auto object-contain bg-white rounded-md px-1.5 py-1" />
            <div className="text-[9px] text-sidebar-foreground/50 tracking-[0.18em] uppercase mt-1 pl-0.5">
              Scratch to Advance
            </div>
          </Link>
        ) : (
          <Link to="/" className="hover:opacity-80 transition-opacity mx-auto bg-white rounded-md px-1 py-1 flex items-center justify-center">
            <img src={logo} alt="ScraAD" className="h-5 w-auto object-contain" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground hidden lg:flex h-7 w-7"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const badge = item.label === "Announcements" ? unreadAnnouncementsCount
            : item.label === "Assignments" ? unreadAssignmentsCount
            : item.label === "Discussions" ? unreadDiscussionsCount
            : 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm",
                "hover:bg-sidebar-accent",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                collapsed && "lg:justify-center lg:px-2"
              )}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{item.label}</span>
                  {badge > 0 && (
                    <Badge className="text-[10px] bg-destructive text-destructive-foreground border-0 h-5 min-w-5 flex items-center justify-center px-1.5">
                      {badge}
                    </Badge>
                  )}
                </div>
              )}
              {collapsed && <span className="text-sm lg:hidden">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer attribution */}
      <div className="border-t border-sidebar-border px-2 py-3">
        {!collapsed ? (
          <MRsoftAttribution
            textClassName="text-[10px] text-sidebar-foreground/50"
            logoClassName="h-3.5"
          />
        ) : (
          <a
            href="https://m-rinternational.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MRsoft - M-R International"
            className="bg-white rounded-md px-1.5 py-1 flex items-center justify-center hover:opacity-90 transition-opacity mx-auto w-fit"
          >
            <img src={mrsoftLogo} alt="MRsoft" className="h-3 w-auto object-contain" />
          </a>
        )}
      </div>
    </aside>
  );
};