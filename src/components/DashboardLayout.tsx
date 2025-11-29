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
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      <DashboardSidebar userRole={userRole} />
      <main className="flex-1 flex flex-col">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-30 bg-card border-b border-border px-8 py-6 flex justify-between items-center">
          <div>
            <div className="inline-block px-4 py-1 bg-primary text-primary-foreground rounded-lg text-sm font-semibold mb-2">
              Dashboard
            </div>
            <p className="text-muted-foreground">Welcome back</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/10 rounded-lg transition-all cursor-pointer border-2 border-border hover:border-primary bg-background shadow-sm">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {(user?.email?.split("@")[0]?.charAt(0).toUpperCase()) || "U"}
                  </span>
                </div>
                <div className="text-left">
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
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
