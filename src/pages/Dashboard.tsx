import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminDashboard } from "@/components/AdminDashboard";
import { StudentDashboard } from "@/components/StudentDashboard";
import { InstructorDashboard } from "@/components/InstructorDashboard";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    } else {
      setUser(session.user);
      await fetchUserData(session.user.id);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      const [profileData, roleData] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId).single(),
      ]);

      if (profileData.data) setProfile(profileData.data);
      if (roleData.data) setUserRole(roleData.data.role);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-muted/30">
        <div className="w-64 bg-sidebar">
          <Skeleton className="h-full" />
        </div>
        <main className="flex-1">
          <Skeleton className="h-20" />
          <div className="p-8">
            <Skeleton className="h-64" />
          </div>
        </main>
      </div>
    );
  }

  const renderDashboard = () => {
    const userName = profile?.full_name || user?.email?.split("@")[0] || "User";
    
    switch (userRole) {
      case "admin":
        return <AdminDashboard />;
      case "instructor":
        return <InstructorDashboard userName={userName} userId={user?.id || ""} />;
      default:
        return <StudentDashboard userName={userName} />;
    }
  };

  return (
    <DashboardLayout user={user} userRole={userRole}>
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default Dashboard;