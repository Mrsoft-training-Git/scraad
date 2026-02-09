import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, TrendingUp, Clock, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ZoomConnectionStatus } from "@/components/zoom/ZoomConnectionStatus";
import { LiveSessionsList } from "@/components/zoom/LiveSessionsList";

interface InstructorDashboardProps {
  userName: string;
  userId: string;
}

interface CourseStats {
  totalCourses: number;
  totalStudents: number;
  publishedCourses: number;
  avgProgress: number;
}

interface RecentEnrollment {
  id: string;
  studentName: string;
  courseName: string;
  enrolledAt: string;
  progress: number;
  initials: string;
}

export const InstructorDashboard = ({ userName, userId }: InstructorDashboardProps) => {
  const [stats, setStats] = useState<CourseStats>({
    totalCourses: 0,
    totalStudents: 0,
    publishedCourses: 0,
    avgProgress: 0,
  });
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, published, students_count")
        .eq("instructor_id", userId);

      const courseIds = courses?.map(c => c.id) || [];
      const totalCourses = courses?.length || 0;
      const publishedCourses = courses?.filter(c => c.published).length || 0;
      const totalStudents = courses?.reduce((sum, c) => sum + (c.students_count || 0), 0) || 0;

      let avgProgress = 0;
      let enrollmentsData: RecentEnrollment[] = [];

      if (courseIds.length > 0) {
        const { data: enrollments } = await supabase
          .from("enrolled_courses")
          .select("id, user_id, course_name, enrolled_at, progress, course_id")
          .in("course_id", courseIds)
          .order("enrolled_at", { ascending: false })
          .limit(10);

        if (enrollments && enrollments.length > 0) {
          avgProgress = Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length);

          const userIds = enrollments.map(e => e.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);

          const profilesMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

          enrollmentsData = enrollments.map(e => {
            const name = profilesMap.get(e.user_id) || "Unknown";
            return {
              id: e.id,
              studentName: name,
              courseName: e.course_name,
              enrolledAt: e.enrolled_at,
              progress: e.progress || 0,
              initials: name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
            };
          });
        }
      }

      setStats({ totalCourses, totalStudents, publishedCourses, avgProgress });
      setRecentEnrollments(enrollmentsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    { title: "My Courses", value: stats.totalCourses, subtitle: `${stats.publishedCourses} published`, icon: BookOpen, accent: "bg-primary/10 text-primary" },
    { title: "Total Students", value: stats.totalStudents, subtitle: "Enrolled overall", icon: Users, accent: "bg-secondary/10 text-secondary" },
    { title: "Avg. Progress", value: `${stats.avgProgress}%`, subtitle: "Completion rate", icon: TrendingUp, accent: "bg-accent/10 text-accent" },
    { title: "Published", value: stats.publishedCourses, subtitle: "Active courses", icon: Clock, accent: "bg-warning/10 text-warning-foreground" },
  ];

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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
      {/* Stats Grid */}
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

      {/* Zoom & Live Sessions — compact collapsible row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <ZoomConnectionStatus />
        <LiveSessionsList isInstructor />
      </div>

      {/* Recent Enrollments */}
      <Card className="border border-border/60 shadow-none">
        <CardHeader className="pb-3 px-5 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Recent Enrollments</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Students who recently joined your courses</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          {recentEnrollments.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No enrollments yet</p>
              <p className="text-xs text-muted-foreground mt-1">Students will appear here once they enroll in your courses.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors -mx-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary">{enrollment.initials}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{enrollment.studentName}</p>
                      <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatDate(enrollment.enrolledAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[11px] text-muted-foreground truncate flex-shrink-0">{enrollment.courseName}</p>
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