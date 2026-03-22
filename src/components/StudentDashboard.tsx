import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, CheckCircle, Trophy, ArrowRight, Flame, TrendingUp, Star, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { LiveSessionsList } from "@/components/zoom/LiveSessionsList";
import { PaymentCountdown } from "@/components/PaymentCountdown";

interface EnrolledCourse {
  id: string;
  course_id: string | null;
  course_name: string;
  progress: number;
  enrolled_at: string;
  course?: {
    image_url: string | null;
    instructor: string | null;
    category: string;
    students_count: number | null;
  } | null;
}

interface PopularCourse {
  id: string;
  title: string;
  image_url: string | null;
  instructor: string | null;
  category: string;
  price: number;
  students_count: number | null;
  top_rated: boolean | null;
}

export const StudentDashboard = ({ userName }: { userName: string }) => {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [popularCourses, setPopularCourses] = useState<PopularCourse[]>([]);
  const [programEnrollments, setProgramEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [coursesData, popularData, progressData, programEnrollData] = await Promise.all([
        supabase
          .from("enrolled_courses")
          .select("id, course_id, course_name, progress, enrolled_at, course:courses(image_url, instructor, category, students_count)")
          .eq("user_id", user.id)
          .order("enrolled_at", { ascending: false }),
        supabase
          .from("courses")
          .select("id, title, image_url, instructor, category, price, students_count, top_rated")
          .eq("published", true)
          .order("students_count", { ascending: false })
          .limit(8),
        supabase
          .from("content_progress")
          .select("completed_at")
          .eq("user_id", user.id)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(30),
        supabase
          .from("program_enrollments")
          .select("id, status, progress, program_id")
          .eq("user_id", user.id),
      ]);

      if (coursesData.data) setCourses(coursesData.data as EnrolledCourse[]);
      if (popularData.data) setPopularCourses(popularData.data);
      if (programEnrollData.data) setProgramEnrollments(programEnrollData.data);

      // Calculate streak from content_progress
      if (progressData.data && progressData.data.length > 0) {
        let streakCount = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const uniqueDays = new Set<string>();
        progressData.data.forEach((p) => {
          if (p.completed_at) {
            const d = new Date(p.completed_at);
            uniqueDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
          }
        });
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
          if (uniqueDays.has(key)) {
            streakCount++;
          } else if (i > 0) {
            break;
          }
        }
        setStreak(streakCount);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const inProgressCourses = courses.filter(c => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100);
  const completedCourses = courses.filter(c => (c.progress ?? 0) >= 100);
  const averageProgress = courses.length > 0
    ? Math.round(courses.reduce((acc, c) => acc + (c.progress ?? 0), 0) / courses.length)
    : 0;

  // Filter popular courses that user isn't already enrolled in
  const enrolledIds = new Set(courses.map(c => c.course_id).filter(Boolean));
  const recommended = popularCourses.filter(c => !enrolledIds.has(c.id));

  const statsConfig = [
    { title: "Enrolled", value: courses.length, icon: BookOpen, accent: "bg-primary/10 text-primary" },
    { title: "Progress", value: `${averageProgress}%`, icon: TrendingUp, accent: "bg-secondary/15 text-secondary" },
    { title: "In Progress", value: inProgressCourses.length, icon: Clock, accent: "bg-warning/15 text-warning-foreground" },
    { title: "Completed", value: completedCourses.length, icon: CheckCircle, accent: "bg-success/15 text-success" },
  ];

  const CourseScrollSection = ({ title, children, viewAllLink }: { title: string; children: React.ReactNode; viewAllLink?: string }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-base md:text-lg text-foreground">{title}</h2>
        {viewAllLink && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary" asChild>
            <Link to={viewAllLink}>View All <ArrowRight className="w-3 h-3 ml-1" /></Link>
          </Button>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero Welcome */}
      <div className="relative bg-hero-gradient rounded-2xl p-6 md:p-8 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading font-bold text-xl md:text-2xl lg:text-3xl">
              Welcome back, {userName} 👋
            </h1>
            <p className="text-primary-foreground/80 text-sm mt-1">
              {inProgressCourses.length > 0
                ? `You have ${inProgressCourses.length} course${inProgressCourses.length > 1 ? 's' : ''} in progress`
                : "Ready to start your learning journey?"}
            </p>
            {/* Streak */}
            {streak > 0 && (
              <div className="flex items-center gap-2 mt-3 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
                <Flame className="w-4 h-4 text-secondary" />
                <span className="text-xs font-semibold">{streak} day streak 🔥</span>
              </div>
            )}
          </div>
          {inProgressCourses.length > 0 && (
            <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold shadow-lg w-fit" asChild>
              <Link to="/dashboard/learning">
                Continue Learning <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statsConfig.map((stat, index) => (
          <Card key={index} className="border border-border bg-card hover:shadow-card-hover transition-all duration-300">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                  <p className="text-2xl md:text-3xl font-heading font-bold mt-1 text-foreground">
                    {loading ? <span className="inline-block w-8 h-7 bg-muted animate-pulse rounded" /> : stat.value}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.accent} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PaymentCountdown />
      <LiveSessionsList />

      {/* Continue Learning - Horizontal scroll on mobile */}
      {inProgressCourses.length > 0 && (
        <CourseScrollSection title="Continue Learning" viewAllLink="/dashboard/learning">
          {inProgressCourses.map((course) => (
            <Link
              key={course.id}
              to={`/dashboard/learn/${course.course_id}`}
              className="min-w-[260px] md:min-w-0 snap-start flex-shrink-0 md:flex-shrink group"
            >
              <Card className="overflow-hidden border border-border bg-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="aspect-video overflow-hidden relative">
                  <img
                    src={course.course?.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80"}
                    alt={course.course_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <div className="flex items-center gap-1.5">
                      <Progress value={course.progress ?? 0} className="h-1.5 flex-1 bg-white/30" />
                      <span className="text-[11px] font-bold text-white">{course.progress ?? 0}%</span>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="font-heading font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">{course.course_name}</p>
                  {course.course?.instructor && (
                    <p className="text-xs text-muted-foreground mt-1">{course.course.instructor}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </CourseScrollSection>
      )}

      {/* Recommended For You */}
      {recommended.length > 0 && (
        <CourseScrollSection title="Recommended for You" viewAllLink="/courses">
          {recommended.slice(0, 4).map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="min-w-[260px] md:min-w-0 snap-start flex-shrink-0 md:flex-shrink group"
            >
              <Card className="overflow-hidden border border-border bg-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="aspect-video overflow-hidden relative">
                  {course.top_rated && (
                    <Badge className="absolute top-2 left-2 bg-secondary text-secondary-foreground border-0 z-10 text-[10px]">
                      <Star className="w-3 h-3 mr-0.5 fill-current" /> Top Rated
                    </Badge>
                  )}
                  <img
                    src={course.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80"}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-4">
                  <p className="font-heading font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">{course.title}</p>
                  {course.instructor && (
                    <p className="text-xs text-muted-foreground mt-1">{course.instructor}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-foreground">
                      {course.price === 0 ? "Free" : `₦${course.price.toLocaleString()}`}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" /> {course.students_count || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </CourseScrollSection>
      )}
    </div>
  );
};
