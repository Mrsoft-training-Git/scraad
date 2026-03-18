import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, Users, CheckCircle2, PlayCircle, RotateCcw, CreditCard, Search, Filter } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";

interface EnrolledCourse {
  id: string;
  course_id: string | null;
  course_name: string;
  progress: number;
  enrolled_at: string;
  course?: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    category: string;
    instructor: string | null;
    duration: string | null;
    students_count: number | null;
    price: number;
  };
  enrollment?: {
    payment_status: string;
    access_status: string;
  } | null;
}

const Learning = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [profile, setProfile] = useState<any>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "in-progress" | "completed" | "not-started">("all");
  const navigate = useNavigate();
  const { initializePayment, loading: paymentLoading } = usePayment();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      
      const [roleData, profileData] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("profiles").select("full_name, avatar_url").eq("id", session.user.id).maybeSingle(),
      ]);
      
      setUserRole(roleData.data?.role || "student");
      if (profileData.data) setProfile(profileData.data);
      fetchEnrolledCourses(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchEnrolledCourses = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("enrolled_courses")
      .select(`id, course_id, course_name, progress, enrolled_at, course:courses(id, title, description, image_url, category, instructor, duration, students_count, price)`)
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false });

    if (!error && data) {
      const courseIds = data.map(d => d.course_id).filter(Boolean) as string[];
      let enrollmentMap = new Map<string, { payment_status: string; access_status: string }>();
      if (courseIds.length > 0) {
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("course_id, payment_status, access_status")
          .eq("user_id", userId)
          .in("course_id", courseIds);
        enrollments?.forEach(e => enrollmentMap.set(e.course_id, { payment_status: e.payment_status, access_status: e.access_status }));
      }
      setEnrolledCourses((data as EnrolledCourse[]).map(d => ({
        ...d,
        enrollment: d.course_id ? enrollmentMap.get(d.course_id) || null : null,
      })));
    }
    setLoading(false);
  };

  const getButtonState = (progress: number, enrollment?: { payment_status: string; access_status: string } | null) => {
    if (enrollment && (enrollment.payment_status === "pending" || enrollment.access_status === "locked")) {
      return { label: "Pay Now", icon: CreditCard, variant: "destructive" as const, action: "pay" as const };
    }
    if (progress === 100) return { label: "Review", icon: RotateCcw, variant: "outline" as const, action: "view" as const };
    if (progress > 0) return { label: "Resume", icon: PlayCircle, variant: "default" as const, action: "view" as const };
    return { label: "Start", icon: PlayCircle, variant: "default" as const, action: "view" as const };
  };

  const filteredCourses = enrolledCourses.filter(c => {
    const matchesSearch = c.course_name.toLowerCase().includes(searchQuery.toLowerCase());
    const progress = c.progress ?? 0;
    const matchesFilter = filterStatus === "all" ||
      (filterStatus === "completed" && progress >= 100) ||
      (filterStatus === "in-progress" && progress > 0 && progress < 100) ||
      (filterStatus === "not-started" && progress === 0);
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout user={user} userRole={userRole} profile={profile}>
      <div className="space-y-6">
        {/* Header with search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">My Learning</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''} enrolled
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-[200px] text-sm"
              />
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {(["all", "in-progress", "completed", "not-started"] as const).map(status => (
            <Badge
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-xs whitespace-nowrap hover:bg-primary hover:text-primary-foreground transition-colors capitalize"
              onClick={() => setFilterStatus(status)}
            >
              {status === "all" ? "All" : status.replace("-", " ")}
            </Badge>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-xl mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card className="border border-border/60 shadow-none">
            <CardContent className="py-16 text-center">
              <BookOpen className="w-14 h-14 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-heading font-semibold text-lg mb-2">
                {enrolledCourses.length === 0 ? "No Courses Yet" : "No results"}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {enrolledCourses.length === 0 ? "Start your learning journey today" : "Try adjusting your filters"}
              </p>
              {enrolledCourses.length === 0 && (
                <Button asChild className="bg-primary hover:bg-accent text-primary-foreground">
                  <Link to="/courses">Browse Courses</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((enrollment) => {
              const course = enrollment.course;
              const buttonState = getButtonState(enrollment.progress, enrollment.enrollment);
              const ButtonIcon = buttonState.icon;
              const progress = enrollment.progress ?? 0;

              return (
                <Card
                  key={enrollment.id}
                  className="group overflow-hidden border border-border bg-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className="aspect-video overflow-hidden relative">
                    {progress >= 100 && (
                      <Badge className="absolute top-2.5 left-2.5 bg-success text-success-foreground border-0 z-10 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-0.5" /> Completed
                      </Badge>
                    )}
                    {buttonState.action === "pay" && (
                      <Badge className="absolute top-2.5 left-2.5 bg-destructive text-destructive-foreground border-0 z-10 text-[10px]">
                        <CreditCard className="w-3 h-3 mr-0.5" /> Payment Required
                      </Badge>
                    )}
                    <img
                      src={course?.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80"}
                      alt={enrollment.course_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {/* Progress overlay */}
                    {progress > 0 && progress < 100 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-1.5 flex-1 bg-white/30" />
                          <span className="text-[11px] font-bold text-white">{progress}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 flex flex-col flex-grow">
                    <Badge variant="secondary" className="w-fit text-[10px] bg-muted text-muted-foreground mb-2">
                      {course?.category || "Course"}
                    </Badge>
                    <h3 className="font-heading font-bold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors text-foreground">
                      {enrollment.course_name}
                    </h3>
                    {course?.instructor && (
                      <p className="text-xs text-muted-foreground mb-3">{course.instructor}</p>
                    )}

                    <div className="mt-auto pt-3 border-t border-border">
                      <Button
                        variant={buttonState.variant}
                        className={`w-full ${buttonState.variant === "default" ? "bg-primary hover:bg-accent text-primary-foreground font-semibold" : ""}`}
                        size="sm"
                        onClick={() => {
                          if (buttonState.action === "pay" && enrollment.course_id) {
                            navigate(`/enroll/${enrollment.course_id}`);
                          } else {
                            navigate(`/dashboard/learn/${enrollment.course_id}`);
                          }
                        }}
                        disabled={buttonState.action === "pay" && paymentLoading}
                      >
                        <ButtonIcon className="w-4 h-4 mr-2" />
                        {buttonState.label}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Learning;
