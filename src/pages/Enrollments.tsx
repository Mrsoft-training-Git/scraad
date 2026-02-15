import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, TrendingUp, UserCheck, Search } from "lucide-react";
import { format } from "date-fns";

interface EnrollmentRecord {
  id: string;
  user_id: string;
  course_id: string;
  payment_status: string;
  access_status: string;
  created_at: string;
  student_name: string;
  student_email: string;
  student_gender: string | null;
  course_name: string;
  progress: number;
}

interface Stats {
  totalEnrollments: number;
  avgCompletion: number;
  maleCount: number;
  femaleCount: number;
  otherGenderCount: number;
  activeCount: number;
  lockedCount: number;
  paidCount: number;
  pendingCount: number;
}

const Enrollments = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState("student");
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalEnrollments: 0, avgCompletion: 0, maleCount: 0, femaleCount: 0,
    otherGenderCount: 0, activeCount: 0, lockedCount: 0, paidCount: 0, pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate("/auth");
      setUser(session.user);

      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
      const role = roleData?.role || "student";
      setUserRole(role);
      if (role !== "admin") return navigate("/dashboard");

      await fetchEnrollments();
    };
    init();
  }, [navigate]);

  const fetchEnrollments = async () => {
    try {
      // Fetch enrollments
      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("id, user_id, course_id, payment_status, access_status, created_at")
        .order("created_at", { ascending: false });

      if (!enrollmentData || enrollmentData.length === 0) {
        setLoading(false);
        return;
      }

      const userIds = [...new Set(enrollmentData.map(e => e.user_id))];
      const courseIds = [...new Set(enrollmentData.map(e => e.course_id))];

      // Fetch profiles and courses in parallel
      const [profilesRes, coursesRes, enrolledCoursesRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, gender").in("id", userIds),
        supabase.from("courses").select("id, title").in("id", courseIds),
        supabase.from("enrolled_courses").select("user_id, course_id, progress"),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const courseMap = new Map((coursesRes.data || []).map(c => [c.id, c]));
      const progressMap = new Map(
        (enrolledCoursesRes.data || []).map(ec => [`${ec.user_id}-${ec.course_id}`, ec.progress || 0])
      );

      const records: EnrollmentRecord[] = enrollmentData.map(e => {
        const profile = profileMap.get(e.user_id);
        const course = courseMap.get(e.course_id);
        return {
          ...e,
          student_name: profile?.full_name || "Unknown",
          student_email: profile?.email || "N/A",
          student_gender: profile?.gender || null,
          course_name: course?.title || "Unknown Course",
          progress: progressMap.get(`${e.user_id}-${e.course_id}`) || 0,
        };
      });

      setEnrollments(records);

      // Calculate stats
      const totalEnrollments = records.length;
      const avgCompletion = totalEnrollments > 0
        ? Math.round(records.reduce((sum, r) => sum + r.progress, 0) / totalEnrollments)
        : 0;
      const maleCount = records.filter(r => r.student_gender?.toLowerCase() === "male").length;
      const femaleCount = records.filter(r => r.student_gender?.toLowerCase() === "female").length;
      const otherGenderCount = totalEnrollments - maleCount - femaleCount;
      const activeCount = records.filter(r => r.access_status === "active").length;
      const lockedCount = records.filter(r => r.access_status === "locked").length;
      const paidCount = records.filter(r => r.payment_status === "paid").length;
      const pendingCount = records.filter(r => r.payment_status !== "paid").length;

      setStats({ totalEnrollments, avgCompletion, maleCount, femaleCount, otherGenderCount, activeCount, lockedCount, paidCount, pendingCount });
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = enrollments.filter(e =>
    e.student_name.toLowerCase().includes(search.toLowerCase()) ||
    e.student_email.toLowerCase().includes(search.toLowerCase()) ||
    e.course_name.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      paid: "bg-green-100 text-green-800",
      partial: "bg-yellow-100 text-yellow-800",
      pending: "bg-red-100 text-red-800",
      active: "bg-green-100 text-green-800",
      locked: "bg-red-100 text-red-800",
    };
    return <Badge className={variants[status] || "bg-muted text-muted-foreground"}>{status}</Badge>;
  };

  const statsConfig = [
    { title: "Total Enrollments", value: stats.totalEnrollments, icon: Users, accent: "bg-primary/10 text-primary" },
    { title: "Avg Completion", value: `${stats.avgCompletion}%`, icon: TrendingUp, accent: "bg-green-100 text-green-700" },
    { title: "Active Access", value: stats.activeCount, icon: UserCheck, accent: "bg-blue-100 text-blue-700" },
    { title: "Paid", value: stats.paidCount, icon: BookOpen, accent: "bg-emerald-100 text-emerald-700" },
    { title: "Male / Female", value: `${stats.maleCount} / ${stats.femaleCount}`, icon: Users, accent: "bg-purple-100 text-purple-700" },
  ];

  if (loading) {
    return (
      <DashboardLayout user={user} userRole={userRole}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Enrollments</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statsConfig.map((stat, i) => (
            <Card key={i} className="border border-border/60 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                    <p className="text-2xl font-heading font-bold mt-1 text-foreground">{stat.value}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-lg ${stat.accent} flex items-center justify-center`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-3 px-5 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-sm font-semibold">All Enrollments</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search student or course..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Student</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Gender</TableHead>
                    <TableHead className="text-xs">Course</TableHead>
                    <TableHead className="text-xs">Progress</TableHead>
                    <TableHead className="text-xs">Payment</TableHead>
                    <TableHead className="text-xs">Access</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                        No enrollments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm font-medium">{e.student_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.student_email}</TableCell>
                        <TableCell className="text-sm capitalize">{e.student_gender || "—"}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{e.course_name}</TableCell>
                        <TableCell className="text-sm">{e.progress}%</TableCell>
                        <TableCell>{statusBadge(e.payment_status)}</TableCell>
                        <TableCell>{statusBadge(e.access_status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(e.created_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Enrollments;
