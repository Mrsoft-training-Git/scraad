import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, CheckCircle, Trophy, ArrowUpRight, ArrowRight, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LiveSessionsList } from "@/components/zoom/LiveSessionsList";
import { PaymentCountdown } from "@/components/PaymentCountdown";

interface EnrolledCourse {
  id: string;
  course_name: string;
  progress: number;
  enrolled_at: string;
}

interface Assignment {
  id: string;
  title: string;
  due_date: string;
  status: string;
}

const INITIAL_COURSES_SHOWN = 4;

export const StudentDashboard = ({ userName }: { userName: string }) => {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllCourses, setShowAllCourses] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [coursesData, assignmentsData] = await Promise.all([
        supabase
          .from("enrolled_courses")
          .select("*")
          .eq("user_id", user.id)
          .order("enrolled_at", { ascending: false }),
        supabase
          .from("assignments")
          .select("*")
          .eq("user_id", user.id)
          .order("due_date", { ascending: true })
          .limit(5),
      ]);

      if (coursesData.data) setCourses(coursesData.data);
      if (assignmentsData.data) setAssignments(assignmentsData.data);
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const averageProgress = courses.length > 0
    ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length)
    : 0;

  const upcomingAssignments = assignments.filter(a => a.status === "pending");
  const completedAssignments = assignments.filter(a => a.status === "completed");

  const statsConfig = [
    { title: "Enrolled Courses", value: courses.length, icon: BookOpen, accent: "bg-primary/10 text-primary" },
    { title: "Avg. Progress", value: `${averageProgress}%`, icon: Trophy, accent: "bg-secondary/10 text-secondary" },
    { title: "Pending Tasks", value: upcomingAssignments.length, icon: Clock, accent: "bg-warning/10 text-warning-foreground" },
    { title: "Completed", value: completedAssignments.length, icon: CheckCircle, accent: "bg-secondary/10 text-secondary" },
  ];

  const visibleCourses = showAllCourses ? courses : courses.slice(0, INITIAL_COURSES_SHOWN);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
                      stat.value
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

      {/* Payment Countdown Alerts */}
      <PaymentCountdown />

      {/* Upcoming Live Sessions — collapsible */}
      <LiveSessionsList />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        {/* Course Progress */}
        <Card className="lg:col-span-3 border border-border/60 shadow-none">
          <CardHeader className="pb-3 px-5 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">My Courses</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground h-7 px-2" asChild>
                <Link to="/courses">
                  Browse <ArrowUpRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">No courses yet</p>
                <Button size="sm" asChild>
                  <Link to="/courses">Browse Courses <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {visibleCourses.map((course) => (
                  <div key={course.id} className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors -mx-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{course.course_name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Progress value={course.progress} className="h-1.5 flex-1" />
                        <span className="text-[11px] font-medium text-muted-foreground w-8 text-right">{course.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
                {courses.length > INITIAL_COURSES_SHOWN && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-foreground mt-2"
                    onClick={() => setShowAllCourses(!showAllCourses)}
                  >
                    {showAllCourses ? "Show Less" : `Show ${courses.length - INITIAL_COURSES_SHOWN} More`}
                    <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showAllCourses ? "rotate-180" : ""}`} />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card className="lg:col-span-2 border border-border/60 shadow-none">
          <CardHeader className="pb-3 px-5 pt-5">
            <CardTitle className="text-sm font-semibold text-foreground">Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No assignments yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors -mx-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{assignment.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Due {new Date(assignment.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 ${
                        assignment.status === "completed"
                          ? "bg-secondary/10 text-secondary"
                          : assignment.status === "submitted"
                          ? "bg-accent/10 text-accent"
                          : "bg-warning/10 text-warning-foreground"
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};