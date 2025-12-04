import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, CheckCircle2, PlayCircle, RotateCcw } from "lucide-react";

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
}

const Learning = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      
      setUserRole(roleData?.role || "student");
      fetchEnrolledCourses(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchEnrolledCourses = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("enrolled_courses")
      .select(`
        id,
        course_id,
        course_name,
        progress,
        enrolled_at,
        course:courses(id, title, description, image_url, category, instructor, duration, students_count, price)
      `)
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false });

    if (!error && data) {
      setEnrolledCourses(data as EnrolledCourse[]);
    }
    setLoading(false);
  };

  const getButtonState = (progress: number) => {
    if (progress === 100) return { label: "Review", icon: RotateCcw, variant: "outline" as const };
    if (progress > 0) return { label: "Continue", icon: PlayCircle, variant: "default" as const };
    return { label: "Start", icon: PlayCircle, variant: "default" as const };
  };

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-3xl font-bold">My Learning</h2>
          <p className="text-muted-foreground mt-1">Track your progress across enrolled courses</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading your courses...</div>
        ) : enrolledCourses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading font-bold text-xl mb-2">No Courses Yet</h3>
              <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet.</p>
              <Button asChild>
                <Link to="/dashboard/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((enrollment) => {
              const course = enrollment.course;
              const buttonState = getButtonState(enrollment.progress);
              const ButtonIcon = buttonState.icon;

              return (
                <Card
                  key={enrollment.id}
                  className="group overflow-hidden border-border/50 bg-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 flex flex-col"
                >
                  <div className="aspect-video overflow-hidden relative">
                    <Badge className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm text-primary border-0 z-10">
                      {course?.category || "Course"}
                    </Badge>
                    {enrollment.progress === 100 && (
                      <Badge className="absolute top-4 left-4 bg-green-500 text-white border-0 z-10">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                    <img
                      src={course?.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"}
                      alt={enrollment.course_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {course?.category || "Course"}
                      </Badge>
                    </div>
                    <h3 className="font-heading font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
                      {enrollment.course_name}
                    </h3>
                    
                    {course?.instructor && (
                      <p className="text-sm text-muted-foreground mb-3">
                        Instructor: {course.instructor}
                      </p>
                    )}

                    {/* Progress Section */}
                    <div className="mb-4 mt-auto">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold text-primary">{enrollment.progress}%</span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between mb-5">
                      {course?.price === 0 ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          Free
                        </Badge>
                      ) : (
                        <span className="text-lg font-bold text-primary">₦{course?.price?.toLocaleString()}</span>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" /> {course?.students_count || 0}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant={buttonState.variant}
                        className={buttonState.variant === "default" ? "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/20 font-semibold" : ""}
                      >
                        <ButtonIcon className="w-4 h-4 mr-2" />
                        {buttonState.label}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-2 hover:bg-accent/10"
                        asChild
                      >
                        <Link to={`/programs/${enrollment.course_id}`}>View Details</Link>
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