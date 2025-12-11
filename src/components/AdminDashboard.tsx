import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, GraduationCap, BookOpen, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface DashboardStats {
  totalUsers: number;
  admins: number;
  students: number;
  courses: number;
  enrollments: number;
}

interface RecentStudent {
  name: string;
  date: string;
}

interface RecentEnrollment {
  user: string;
  date: string;
  course: string;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    admins: 0,
    students: 0,
    courses: 0,
    enrollments: 0,
  });
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total users count
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch admin count
      const { count: admins } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      // Fetch student count
      const { count: students } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student");

      // Fetch courses count
      const { count: courses } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true });

      // Fetch enrollments count
      const { count: enrollments } = await supabase
        .from("enrolled_courses")
        .select("*", { count: "exact", head: true });

      setStats({
        totalUsers: totalUsers || 0,
        admins: admins || 0,
        students: students || 0,
        courses: courses || 0,
        enrollments: enrollments || 0,
      });

      // Fetch recent students (profiles with student role)
      const { data: recentStudentData } = await supabase
        .from("profiles")
        .select("full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(4);

      if (recentStudentData) {
        setRecentStudents(
          recentStudentData.map((s) => ({
            name: s.full_name || "Unknown",
            date: s.created_at ? format(new Date(s.created_at), "MMM d, yyyy") : "N/A",
          }))
        );
      }

      // Fetch recent enrollments
      const { data: recentEnrollmentData } = await supabase
        .from("enrolled_courses")
        .select("course_name, enrolled_at, user_id")
        .order("enrolled_at", { ascending: false })
        .limit(4);

      if (recentEnrollmentData) {
        // Get user names for enrollments
        const userIds = recentEnrollmentData.map((e) => e.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

        setRecentEnrollments(
          recentEnrollmentData.map((e) => ({
            user: profileMap.get(e.user_id) || "Unknown",
            date: e.enrolled_at ? format(new Date(e.enrolled_at), "MMM d, yyyy") : "N/A",
            course: e.course_name,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    { title: "TOTAL USERS", value: stats.totalUsers, icon: Users, color: "bg-blue-100 text-blue-600" },
    { title: "ADMINS", value: stats.admins, icon: ShieldCheck, color: "bg-blue-100 text-blue-600" },
    { title: "STUDENTS", value: stats.students, icon: GraduationCap, color: "bg-blue-100 text-blue-600" },
    { title: "COURSES", value: stats.courses, icon: BookOpen, color: "bg-blue-100 text-blue-600" },
    { title: "ENROLLMENTS", value: stats.enrollments, icon: CreditCard, color: "bg-blue-100 text-blue-600" },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
        {statsConfig.map((stat, index) => (
          <Card key={index} className="border-none shadow-card hover:shadow-card-hover transition-all duration-300">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 md:mb-2 truncate">{stat.title}</p>
                  <p className="text-2xl md:text-4xl font-bold text-primary">
                    {loading ? "..." : stat.value}
                  </p>
                </div>
                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0 ml-2`}>
                  <stat.icon className="w-5 h-5 md:w-7 md:h-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tables Section */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
        {/* Recent Students */}
        <Card className="border-none shadow-card">
          <CardHeader className="bg-foreground text-background p-4 md:p-6">
            <CardTitle className="text-base md:text-lg font-heading">Recent Students</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[300px]">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold">Student</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold">Joined</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold hidden sm:table-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentStudents.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={3} className="px-3 md:px-6 py-6 text-center text-muted-foreground">
                        No students yet
                      </td>
                    </tr>
                  ) : (
                    recentStudents.map((student, index) => (
                      <tr key={index} className="hover:bg-muted/50 transition-colors">
                        <td className="px-3 md:px-6 py-3 md:py-4">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-accent rounded-full flex-shrink-0"></div>
                            <span className="font-medium text-sm md:text-base truncate max-w-[100px] md:max-w-none">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-muted-foreground">{student.date}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 hidden sm:table-cell">
                          <Button variant="link" size="sm" className="text-accent text-xs md:text-sm">
                            View Info
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 md:p-4 border-t border-border">
              <Button variant="link" className="text-accent text-sm">
                See All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Enrollments */}
        <Card className="border-none shadow-card">
          <CardHeader className="bg-foreground text-background p-4 md:p-6">
            <CardTitle className="text-base md:text-lg font-heading">Recent Enrollments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold">Student</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold hidden md:table-cell">Course</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentEnrollments.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={3} className="px-3 md:px-6 py-6 text-center text-muted-foreground">
                        No enrollments yet
                      </td>
                    </tr>
                  ) : (
                    recentEnrollments.map((enrollment, index) => (
                      <tr key={index} className="hover:bg-muted/50 transition-colors">
                        <td className="px-3 md:px-6 py-3 md:py-4">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-accent rounded-full flex-shrink-0"></div>
                            <span className="font-medium text-sm md:text-base">{enrollment.user}</span>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm max-w-[150px] truncate hidden md:table-cell">{enrollment.course}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-muted-foreground">{enrollment.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 md:p-4 border-t border-border">
              <Button variant="link" className="text-accent text-sm">
                See All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};