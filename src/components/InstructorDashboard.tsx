import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, TrendingUp, Clock, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { ZoomConnectionStatus } from "@/components/zoom/ZoomConnectionStatus";
import { LiveSessionsList } from "@/components/zoom/LiveSessionsList";

interface InstructorDashboardProps {
  userName: string;
  userId: string;
}

interface InstructorStats {
  totalCourses: number;
  totalPrograms: number;
  totalStudents: number;
  publishedCourses: number;
  avgProgress: number;
}

interface RecentEnrollment {
  id: string;
  studentName: string;
  itemName: string;
  itemType: "course" | "program";
  enrolledAt: string;
  progress: number;
  initials: string;
}

export const InstructorDashboard = ({ userName, userId }: InstructorDashboardProps) => {
  const [stats, setStats] = useState<InstructorStats>({
    totalCourses: 0, totalPrograms: 0, totalStudents: 0, publishedCourses: 0, avgProgress: 0,
  });
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      // Fetch courses and programs in parallel
      const [{ data: courses }, { data: programs }] = await Promise.all([
        supabase.from("courses").select("id, title, published, students_count").eq("instructor_id", userId),
        supabase.from("programs").select("id, title, status").eq("instructor_id", userId),
      ]);

      const courseIds = courses?.map(c => c.id) || [];
      const programIds = programs?.map(p => p.id) || [];
      const totalCourses = courses?.length || 0;
      const totalPrograms = programs?.length || 0;
      const publishedCourses = courses?.filter(c => c.published).length || 0;
      let totalStudents = courses?.reduce((sum, c) => sum + (c.students_count || 0), 0) || 0;

      const enrollmentsData: RecentEnrollment[] = [];
      let allProgress: number[] = [];

      // Fetch course enrollments
      if (courseIds.length > 0) {
        const { data: enrollments } = await supabase
          .from("enrolled_courses")
          .select("id, user_id, course_name, enrolled_at, progress, course_id")
          .in("course_id", courseIds)
          .order("enrolled_at", { ascending: false })
          .limit(10);

        if (enrollments && enrollments.length > 0) {
          allProgress.push(...enrollments.map(e => e.progress || 0));
          const userIds = enrollments.map(e => e.user_id);
          const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
          const profilesMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

          enrollments.forEach(e => {
            const name = profilesMap.get(e.user_id) || "Unknown";
            enrollmentsData.push({
              id: e.id,
              studentName: name,
              itemName: e.course_name,
              itemType: "course",
              enrolledAt: e.enrolled_at || "",
              progress: e.progress || 0,
              initials: name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
            });
          });
        }
      }

      // Fetch program enrollments
      if (programIds.length > 0) {
        const { data: progEnrollments } = await supabase
          .from("program_enrollments")
          .select("id, user_id, program_id, enrolled_at, progress")
          .in("program_id", programIds)
          .order("enrolled_at", { ascending: false })
          .limit(10);

        if (progEnrollments && progEnrollments.length > 0) {
          totalStudents += progEnrollments.length;
          allProgress.push(...progEnrollments.map(e => e.progress || 0));
          const userIds = progEnrollments.map(e => e.user_id);
          const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
          const profilesMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
          const progNameMap = new Map(programs?.map(p => [p.id, p.title]) || []);

          progEnrollments.forEach(e => {
            const name = profilesMap.get(e.user_id) || "Unknown";
            enrollmentsData.push({
              id: e.id,
              studentName: name,
              itemName: progNameMap.get(e.program_id) || "Unknown Program",
              itemType: "program",
              enrolledAt: e.enrolled_at || "",
              progress: e.progress || 0,
              initials: name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
            });
          });
        }
      }

      // Sort combined by date
      enrollmentsData.sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime());

      const avgProgress = allProgress.length > 0
        ? Math.round(allProgress.reduce((s, p) => s + p, 0) / allProgress.length)
        : 0;

      setStats({ totalCourses, totalPrograms, totalStudents, publishedCourses, avgProgress });
      setRecentEnrollments(enrollmentsData.slice(0, 10));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    { title: "My Courses", value: stats.totalCourses, subtitle: `${stats.publishedCourses} published`, icon: BookOpen, accent: "bg-primary/10 text-primary" },
    { title: "My Programs", value: stats.totalPrograms, subtitle: "Assigned", icon: GraduationCap, accent: "bg-accent/10 text-accent" },
    { title: "Total Students", value: stats.totalStudents, subtitle: "Enrolled overall", icon: Users, accent: "bg-secondary/10 text-secondary" },
    { title: "Avg. Progress", value: `${stats.avgProgress}%`, subtitle: "Completion rate", icon: TrendingUp, accent: "bg-warning/10 text-warning-foreground" },
  ];

  const formatDate = (dateString: string) =>
    dateString ? new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statsConfig.map((stat) => (
          <Card key={stat.title} className="group relative overflow-hidden border border-border/60 shadow-none hover:border-primary/20 hover:shadow-md transition-all duration-300">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                  <p className="text-2xl md:text-3xl font-heading font-bold mt-1 text-foreground">{stat.value}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <ZoomConnectionStatus />
        <LiveSessionsList isInstructor />
      </div>

      <Card className="border border-border/60 shadow-none">
        <CardHeader className="pb-3 px-5 pt-5">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">Recent Enrollments</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Students who recently joined your courses & programs</p>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          {recentEnrollments.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No enrollments yet</p>
              <p className="text-xs text-muted-foreground mt-1">Students will appear here once they enroll.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentEnrollments.map((enrollment) => (
                <div key={`${enrollment.itemType}-${enrollment.id}`} className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors -mx-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary">{enrollment.initials}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{enrollment.studentName}</p>
                      <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatDate(enrollment.enrolledAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[11px] text-muted-foreground truncate flex-shrink-0">{enrollment.itemName}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                        enrollment.itemType === "course" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                      }`}>
                        {enrollment.itemType}
                      </span>
                      <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                        <Progress value={enrollment.progress} className="h-1.5 w-16" />
                        <span className="text-[11px] font-medium text-muted-foreground w-7 text-right">{enrollment.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
