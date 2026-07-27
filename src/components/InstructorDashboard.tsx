import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, TrendingUp, Clock, GraduationCap, ChevronRight, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { getEffectiveProgramStatus } from "@/lib/program-status";
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

interface AssignedItem {
  id: string;
  title: string;
  type: "course" | "program";
  state: "ongoing" | "upcoming";
  startDate: string | null;
  endDate: string | null;
  students: number;
  href: string;
}

export const InstructorDashboard = ({ userName, userId }: InstructorDashboardProps) => {
  const [stats, setStats] = useState<InstructorStats>({
    totalCourses: 0, totalPrograms: 0, totalStudents: 0, publishedCourses: 0, avgProgress: 0,
  });
  const [assignedItems, setAssignedItems] = useState<AssignedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      // Fetch courses and programs in parallel
      const [{ data: courses }, { data: programs }] = await Promise.all([
        supabase.from("courses").select("id, title, published, students_count").eq("instructor_id", userId),
        supabase.from("programs").select("id, title, status, start_date, end_date").eq("instructor_id", userId),
      ]);

      const courseIds = courses?.map(c => c.id) || [];
      const programIds = programs?.map(p => p.id) || [];
      const totalCourses = courses?.length || 0;
      const totalPrograms = programs?.length || 0;
      const publishedCourses = courses?.filter(c => c.published).length || 0;
      let totalStudents = courses?.reduce((sum, c) => sum + (c.students_count || 0), 0) || 0;

      let allProgress: number[] = [];
      const programStudentCounts = new Map<string, number>();

      // Fetch course enrollments (for progress stats)
      if (courseIds.length > 0) {
        const { data: enrollments } = await supabase
          .from("enrolled_courses")
          .select("id, progress, course_id")
          .in("course_id", courseIds);

        if (enrollments && enrollments.length > 0) {
          allProgress.push(...enrollments.map(e => e.progress || 0));
        }
      }

      // Fetch program enrollments (for student counts + progress stats)
      if (programIds.length > 0) {
        const { data: progEnrollments } = await supabase
          .from("program_enrollments")
          .select("id, program_id, progress")
          .in("program_id", programIds);

        if (progEnrollments && progEnrollments.length > 0) {
          totalStudents += progEnrollments.length;
          allProgress.push(...progEnrollments.map(e => e.progress || 0));
          progEnrollments.forEach(e => {
            programStudentCounts.set(e.program_id, (programStudentCounts.get(e.program_id) || 0) + 1);
          });
        }
      }

      // Build the list of assigned programs & courses that are active or upcoming
      const items: AssignedItem[] = [];

      (programs || []).forEach(p => {
        const effective = getEffectiveProgramStatus({ status: p.status, start_date: p.start_date, end_date: p.end_date });
        if (effective === "closed") return;
        items.push({
          id: p.id,
          title: p.title,
          type: "program",
          state: effective === "ongoing" ? "ongoing" : "upcoming",
          startDate: p.start_date,
          endDate: p.end_date,
          students: programStudentCounts.get(p.id) || 0,
          href: `/dashboard/programs/${p.id}/manage`,
        });
      });

      (courses || []).forEach(c => {
        items.push({
          id: c.id,
          title: c.title,
          type: "course",
          state: c.published ? "ongoing" : "upcoming",
          startDate: null,
          endDate: null,
          students: c.students_count || 0,
          href: `/dashboard/courses`,
        });
      });

      items.sort((a, b) => (a.state === b.state ? a.title.localeCompare(b.title) : a.state === "ongoing" ? -1 : 1));

      const avgProgress = allProgress.length > 0
        ? Math.round(allProgress.reduce((s, p) => s + p, 0) / allProgress.length)
        : 0;

      setStats({ totalCourses, totalPrograms, totalStudents, publishedCourses, avgProgress });
      setAssignedItems(items);
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
            <CardTitle className="text-sm font-semibold text-foreground">My Programs & Courses</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Active and upcoming items assigned to you</p>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          {assignedItems.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Nothing active or upcoming</p>
              <p className="text-xs text-muted-foreground mt-1">Programs and courses assigned to you will appear here.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {assignedItems.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={item.href}
                  className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors -mx-3"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.type === "program" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                  }`}>
                    {item.type === "program" ? <GraduationCap className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <Badge variant={item.state === "ongoing" ? "default" : "secondary"} className="text-[9px] uppercase font-semibold px-1.5 py-0">
                        {item.state === "ongoing" ? "Active" : "Upcoming"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span className="uppercase font-semibold tracking-wide">{item.type}</span>
                      {item.startDate && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {item.state === "upcoming" ? `Starts ${formatDate(item.startDate)}` : `${formatDate(item.startDate)}${item.endDate ? ` – ${formatDate(item.endDate)}` : ""}`}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {item.students} student{item.students === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
