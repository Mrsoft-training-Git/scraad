import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Users, ShieldCheck, GraduationCap, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface UserWithRole {
  id: string;
  full_name: string | null;
  created_at: string | null;
  role: string;
}

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();
      
      setUserRole(roleData?.role || "student");
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      
      // Fetch all profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, created_at");

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        setLoading(false);
        return;
      }

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        setLoading(false);
        return;
      }

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRoleData = roles?.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name,
          created_at: profile.created_at,
          role: userRoleData?.role || "student"
        };
      });

      setUsers(usersWithRoles);
      setLoading(false);
    };

    fetchUsers();
  }, []);

  // Calculate stats from real data
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === "admin").length;
  const studentCount = users.filter(u => u.role === "student").length;

  const statsConfig = [
    { title: "Total Users", value: totalUsers, icon: Users, accent: "bg-primary/10 text-primary" },
    { title: "Students", value: studentCount, subtitle: `${totalUsers > 0 ? Math.round((studentCount / totalUsers) * 100) : 0}% of users`, icon: GraduationCap, accent: "bg-secondary/10 text-secondary" },
    { title: "Admins", value: adminCount, subtitle: "System access", icon: ShieldCheck, accent: "bg-accent/10 text-accent" },
  ];

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">View and manage user accounts</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {statsConfig.map((stat) => (
            <Card key={stat.title} className="border border-border/60 shadow-none hover:border-primary/20 hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                    <p className="text-2xl md:text-3xl font-heading font-bold mt-1 text-foreground">
                      {loading ? <span className="inline-block w-8 h-7 bg-muted animate-pulse rounded" /> : stat.value}
                    </p>
                  </div>
                  <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg ${stat.accent} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-3 px-5 pt-5">
            <CardTitle className="text-sm font-semibold text-foreground">All Users</CardTitle>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="pr-5 hidden sm:table-cell">Join Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-10 text-sm">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((userData) => (
                        <TableRow key={userData.id} className="hover:bg-muted/30">
                          <TableCell className="pl-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-primary">
                                  {userData.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                                </span>
                              </div>
                              <span className="text-sm font-medium">{userData.full_name || 'Unknown User'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                              userData.role === "admin" 
                                ? "bg-warning/10 text-warning-foreground" 
                                : userData.role === "instructor" 
                                  ? "bg-secondary/10 text-secondary" 
                                  : "bg-muted text-muted-foreground"
                            }`}>
                              {userData.role}
                            </span>
                          </TableCell>
                          <TableCell className="pr-5 text-sm text-muted-foreground hidden sm:table-cell">
                            {userData.created_at 
                              ? format(new Date(userData.created_at), 'MMM d, yyyy')
                              : 'N/A'
                            }
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
