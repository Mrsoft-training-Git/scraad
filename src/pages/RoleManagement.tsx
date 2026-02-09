import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, Users, Loader2, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  id: string;
  full_name: string | null;
  role: AppRole;
  role_id: string;
}

const RoleManagement = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
      setUserRole(roleData?.role || "student");
    };
    checkAuth();
  }, [navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name");
    const { data: roles } = await supabase.from("user_roles").select("id, user_id, role");
    const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
      const userRoleData = roles?.find(r => r.user_id === profile.id);
      return { id: profile.id, full_name: profile.full_name, role: (userRoleData?.role as AppRole) || "student", role_id: userRoleData?.id || "" };
    });
    setUsers(usersWithRoles);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId: string, roleId: string, newRole: AppRole) => {
    setUpdating(userId);
    const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("id", roleId);
    if (error) { toast({ title: "Error", description: "Failed to update user role", variant: "destructive" }); }
    else { toast({ title: "Success", description: "User role updated successfully" }); setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u)); }
    setUpdating(null);
  };

  const adminCount = users.filter(u => u.role === "admin").length;
  const instructorCount = users.filter(u => u.role === "instructor").length;
  const studentCount = users.filter(u => u.role === "student").length;

  const rolesConfig = [
    { title: "Admins", value: adminCount, subtitle: "Full access", icon: Crown, accent: "bg-warning/10 text-warning-foreground" },
    { title: "Instructors", value: instructorCount, subtitle: "Manage courses", icon: GraduationCap, accent: "bg-secondary/10 text-secondary" },
    { title: "Students", value: studentCount, subtitle: "View & submit", icon: Users, accent: "bg-primary/10 text-primary" },
  ];

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Role Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Assign and modify user roles</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {rolesConfig.map((stat) => (
            <Card key={stat.title} className="border border-border/60 shadow-none hover:border-primary/20 hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                    <p className="text-2xl md:text-3xl font-heading font-bold mt-1 text-foreground">
                      {loading ? <span className="inline-block w-8 h-7 bg-muted animate-pulse rounded" /> : stat.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{stat.subtitle}</p>
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
            <CardTitle className="text-sm font-semibold text-foreground">User Role Assignment</CardTitle>
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
                      <TableHead className="pl-5">Name</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead className="pr-5">Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-10 text-sm">No users found</TableCell></TableRow>
                    ) : (
                      users.map((userData) => (
                        <TableRow key={userData.id} className="hover:bg-muted/30">
                          <TableCell className="pl-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-primary">
                                  {(userData.full_name || "U")[0].toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm font-medium">{userData.full_name || 'Unknown User'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                              userData.role === "admin" ? "bg-warning/10 text-warning-foreground"
                              : userData.role === "instructor" ? "bg-secondary/10 text-secondary"
                              : "bg-muted text-muted-foreground"
                            }`}>
                              {userData.role}
                            </span>
                          </TableCell>
                          <TableCell className="pr-5">
                            <Select defaultValue={userData.role} onValueChange={(value) => handleRoleChange(userData.id, userData.role_id, value as AppRole)} disabled={updating === userData.id}>
                              <SelectTrigger className="w-[130px] h-8 text-xs">
                                {updating === userData.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SelectValue />}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="instructor">Instructor</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                              </SelectContent>
                            </Select>
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

export default RoleManagement;
