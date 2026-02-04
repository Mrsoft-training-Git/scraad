import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, GraduationCap, BookOpen, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

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

      // Fetch course enrollments grouped by course with average completion
      const { data: enrollmentData } = await supabase
        .from("enrolled_courses")
        .select("course_name, progress");

      if (enrollmentData) {
        // Group by course and calculate stats
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

        {/* Course Enrollments Chart */}
        <Card className="border-none shadow-card">
          <CardHeader className="bg-foreground text-background p-4 md:p-6">
            <CardTitle className="text-base md:text-lg font-heading">
              Top Enrolled Courses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {courseEnrollments.length === 0 && !loading ? (
              <div className="py-8 text-center text-muted-foreground">
                No enrollments yet
              </div>
            ) : (
              <>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart
                    data={displayedCourses}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <YAxis 
                      type="category" 
                      dataKey="courseName" 
                      width={150}
                      tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as CourseEnrollmentData;
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium text-sm mb-1">{data.courseName}</p>
                              <p className="text-xs text-muted-foreground">
                                Enrollments: <span className="font-semibold text-foreground">{data.enrollmentCount}</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Avg Completion: <span className="font-semibold text-foreground">{data.avgCompletion}%</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="avgCompletion" radius={[0, 4, 4, 0]}>
                      {displayedCourses.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`hsl(var(--primary) / ${0.4 + (entry.avgCompletion / 100) * 0.6})`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>

                {courseEnrollments.length > 10 && (
                  <div className="mt-4 border-t border-border pt-4">
                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-center gap-2 text-accent"
                      onClick={() => setShowAllCourses(!showAllCourses)}
                    >
                      {showAllCourses ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Show Top 10 Only
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show All {courseEnrollments.length} Courses
                        </>
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