import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  GraduationCap,
  Calendar,
  CreditCard,
  User,
  BookMarked,
  Shield,
  Users,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "Course Allocation", path: "/dashboard/course-allocation" },
  { icon: FileText, label: "Courses", path: "/dashboard/courses" },
  { icon: FileText, label: "Create Content", path: "/dashboard/create-content" },
  { icon: GraduationCap, label: "Learning", path: "/dashboard/learning" },
  { icon: Calendar, label: "Manage Classes", path: "/dashboard/classes" },
  { icon: CreditCard, label: "Payments", path: "/dashboard/payments" },
  { icon: User, label: "Profile Update", path: "/dashboard/profile" },
  { icon: BookMarked, label: "References", path: "/dashboard/references" },
  { icon: Shield, label: "Role Management", path: "/dashboard/roles" },
  { icon: Users, label: "User Management", path: "/dashboard/users" },
];

export const DashboardSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground min-h-screen transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sidebar-primary rounded-full flex items-center justify-center font-bold">
              ODEL
            </div>
            <div className="text-sm">
              <div className="font-bold">University of</div>
              <div className="text-xs opacity-80">Port Harcourt</div>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-sidebar-accent"
        >
          <ChevronLeft
            className={cn(
              "w-5 h-5 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-lg",
                collapsed && "justify-center"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-10 h-10 bg-sidebar-primary rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">Ngozi</div>
              <div className="text-xs opacity-70">Admin</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
