import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, GraduationCap, BookOpen, CreditCard, ChevronDown, ChevronUp, TrendingUp, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts";

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
  initials: string;
}

interface CourseEnrollmentData {
  courseName: string;
  enrollmentCount: number;
  avgCompletion: number;
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
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllCourses, setShowAllCourses] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: admins } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      const { count: students } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student");

      const { count: courses } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true });

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

      const { data: recentStudentData } = await supabase
        .from("profiles")
        .select("full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentStudentData) {
        setRecentStudents(
          recentStudentData.map((s) => ({
            name: s.full_name || "Unknown",
            date: s.created_at ? format(new Date(s.created_at), "MMM d, yyyy") : "N/A",
            initials: (s.full_name || "U").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
          }))
        );
      }

      const { data: enrollmentData } = await supabase
        .from("enrolled_courses")
        .select("course_name, progress");

      if (enrollmentData) {
        const courseMap = new Map<string, { count: number; totalProgress: number }>();
        
        enrollmentData.forEach((enrollment) => {
          const courseName = enrollment.course_name;
          const progress = enrollment.progress || 0;
          
          if (courseMap.has(courseName)) {
            const existing = courseMap.get(courseName)!;
            existing.count += 1;
            existing.totalProgress += progress;
          } else {
            courseMap.set(courseName, { count: 1, totalProgress: progress });
          }
        });

        const courseData: CourseEnrollmentData[] = Array.from(courseMap.entries())
          .map(([courseName, data]) => ({
            courseName,
            enrollmentCount: data.count,
            avgCompletion: Math.round(data.totalProgress / data.count),
          }))
          .sort((a, b) => b.enrollmentCount - a.enrollmentCount);

        setCourseEnrollments(courseData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const displayedCourses = showAllCourses ? courseEnrollments : courseEnrollments.slice(0, 10);

  const chartConfig = {
    avgCompletion: {
      label: "Avg Completion",
      color: "hsl(var(--primary))",
    },
  };

  const statsConfig = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, accent: "bg-primary/10 text-primary" },
    { title: "Administrators", value: stats.admins, icon: ShieldCheck, accent: "bg-accent/10 text-accent" },
    { title: "Students", value: stats.students, icon: GraduationCap, accent: "bg-secondary/10 text-secondary" },
    { title: "Courses", value: stats.courses, icon: BookOpen, accent: "bg-warning/10 text-warning-foreground" },
    { title: "Enrollments", value: stats.enrollments, icon: CreditCard, accent: "bg-primary/10 text-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {statsConfig.map((stat, index) => (
          <Card key={index} className="group relative overflow-hidden border border-border/60 shadow-none hover:border-primary/20 hover:shadow-md transition-all duration-300">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                  <p className="text-2xl md:text-3xl font-heading font-bold mt-1 text-foreground">
                    {loading ? (
                      <span className="inline-block w-8 h-7 bg-muted animate-pulse rounded" />
                    ) : (
                      stat.value.toLocaleString()
                    )}
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

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        {/* Recent Students */}
        <Card className="lg:col-span-2 border border-border/60 shadow-none">
          <CardHeader className="pb-3 px-5 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Recent Students</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground h-7 px-2">
                View all <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            {recentStudents.length === 0 && !loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No students yet
              </div>
            ) : (
              <div className="space-y-1">
                {recentStudents.map((student, index) => (
                  <div key={index} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors -mx-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">{student.initials}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{student.name}</p>
                      <p className="text-[11px] text-muted-foreground">{student.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Enrollments Chart */}
        <Card className="lg:col-span-3 border border-border/60 shadow-none">
          <CardHeader className="pb-3 px-5 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">Course Performance</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Average completion by course</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                Completion %
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            {courseEnrollments.length === 0 && !loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No enrollments yet
              </div>
            ) : (
              <>
                 <ChartContainer config={chartConfig} className="h-[280px] w-full">
                   <BarChart
                     data={displayedCourses}
                     layout="vertical"
                     margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
                   >
                     <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} fontSize={10} tickLine={false} axisLine={false} />
                     <YAxis
                       type="category"
                       dataKey="courseName"
                       width={100}
                       tickFormatter={(value) => value.length > 14 ? `${value.substring(0, 14)}…` : value}
                       fontSize={10}
                       tickLine={false}
                       axisLine={false}
                     />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as CourseEnrollmentData;
                          return (
                            <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium text-sm mb-1.5">{data.courseName}</p>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex justify-between gap-4">
                                  Enrollments <span className="font-semibold text-foreground">{data.enrollmentCount}</span>
                                </p>
                                <p className="text-xs text-muted-foreground flex justify-between gap-4">
                                  Avg Completion <span className="font-semibold text-foreground">{data.avgCompletion}%</span>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="avgCompletion" radius={[0, 4, 4, 0]} barSize={20}>
                      {displayedCourses.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`hsl(var(--primary) / ${0.35 + (entry.avgCompletion / 100) * 0.65})`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>

                {courseEnrollments.length > 10 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setShowAllCourses(!showAllCourses)}
                    >
                      {showAllCourses ? (
                        <><ChevronUp className="w-3.5 h-3.5 mr-1" /> Show Top 10</>
                      ) : (
                        <><ChevronDown className="w-3.5 h-3.5 mr-1" /> Show All {courseEnrollments.length} Courses</>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};