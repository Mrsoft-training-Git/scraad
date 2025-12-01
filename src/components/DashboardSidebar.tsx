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
import logo from "@/assets/uniport-logo.png";

const allMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", roles: ["admin", "student"] },
  { icon: BookOpen, label: "Course Allocation", path: "/dashboard/course-allocation", roles: ["admin"] },
  { icon: FileText, label: "Courses", path: "/dashboard/courses", roles: ["admin"] },
  { icon: FileText, label: "Create Content", path: "/dashboard/create-content", roles: ["admin"] },
  { icon: GraduationCap, label: "Learning", path: "/dashboard/learning", roles: ["admin", "student"] },
  { icon: Calendar, label: "Manage Classes", path: "/dashboard/classes", roles: ["admin"] },
  { icon: CreditCard, label: "Payments", path: "/dashboard/payments", roles: ["admin"] },
  { icon: User, label: "Profile Update", path: "/dashboard/profile", roles: ["admin", "student"] },
  { icon: BookMarked, label: "References", path: "/dashboard/references", roles: ["admin"] },
  { icon: Shield, label: "Role Management", path: "/dashboard/roles", roles: ["admin"] },
  { icon: Users, label: "User Management", path: "/dashboard/users", roles: ["admin"] },
];

interface DashboardSidebarProps {
  userRole: string;
}

export const DashboardSidebar = ({ userRole }: DashboardSidebarProps) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground h-screen sticky top-0 flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logo} alt="UNIPORT Logo" className="w-10 h-10 object-contain" />
            <div className="text-sm">
              <div className="font-bold">University of</div>
              <div className="text-xs opacity-80">Port Harcourt</div>
            </div>
          </Link>
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

    </aside>
  );
};
