import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: ReactNode;
  user: User | null;
  userRole: string;
}

export const DashboardLayout = ({ children, user, userRole }: DashboardLayoutProps) => {
  const navigate = useNavigate();

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
    <div className="flex min-h-screen bg-muted/30">
      <DashboardSidebar userRole={userRole} />
      <main className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border px-8 py-6 flex justify-between items-center">
          <div>
            <div className="inline-block px-4 py-1 bg-primary text-primary-foreground rounded-lg text-sm font-semibold mb-2">
              Dashboard
            </div>
            <p className="text-muted-foreground">Welcome back</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-lg transition-colors">
              <div className="text-right">
                <div className="font-semibold text-sm">
                  {user?.email?.split("@")[0] || "User"}
                </div>
                <div className="text-xs text-muted-foreground capitalize">{userRole}</div>
              </div>
              <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
