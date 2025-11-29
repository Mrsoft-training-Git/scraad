import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, Crown } from "lucide-react";

const RoleManagement = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
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
  const roles = [
    { id: 1, name: "Admin", users: 3, permissions: "Full access", icon: Crown, color: "text-yellow-600" },
    { id: 2, name: "Student", users: 245, permissions: "View courses, submit assignments", icon: Users, color: "text-blue-600" },
    { id: 3, name: "Instructor", users: 12, permissions: "Manage courses, grade assignments", icon: Shield, color: "text-green-600" },
  ];

  const userRoles = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Student" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Admin" },
    { id: 3, name: "Dr. Wilson", email: "wilson@example.com", role: "Instructor" },
    { id: 4, name: "Sarah Brown", email: "sarah@example.com", role: "Student" },
  ];

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Card key={role.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Icon className={`w-8 h-8 ${role.color}`} />
                      <span className="text-2xl font-bold">{role.users}</span>
                    </div>
                    <CardTitle className="mt-4">{role.name}</CardTitle>
                    <CardDescription>{role.permissions}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">Manage</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Role Assignment</CardTitle>
              <CardDescription>Assign or modify user roles</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRoles.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-muted">
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select defaultValue={user.role.toLowerCase()}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="instructor">Instructor</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
    </DashboardLayout>
  );
};

export default RoleManagement;
