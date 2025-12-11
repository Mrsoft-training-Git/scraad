import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, BookOpen, ArrowLeft, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CourseWithEnrollments {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
  students_count: number;
  price: number;
}

interface EnrolledStudent {
  id: string;
  user_id: string;
  progress: number;
  enrolled_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

const ManageClasses = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [courses, setCourses] = useState<CourseWithEnrollments[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithEnrollments | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      
      const role = roleData?.role || "student";
      setUserRole(role);
      fetchCoursesWithEnrollments(session.user.id, role);
    };
    checkAuth();
  }, [navigate]);

  const fetchCoursesWithEnrollments = async (userId: string, role: string) => {
    setLoading(true);
    
    // Build query based on role
    let query = supabase
      .from("courses")
      .select("id, title, category, image_url, students_count, price")
      .eq("published", true)
      .order("students_count", { ascending: false });
    
    // Instructors only see their assigned courses
    if (role === "instructor") {
      query = query.eq("instructor_id", userId);
    }

    const { data: coursesData, error: coursesError } = await query;

    if (coursesError) {
      toast({ title: "Error", description: "Failed to fetch courses", variant: "destructive" });
    } else {
      setCourses(coursesData || []);
    }
    setLoading(false);
  };

  const fetchEnrolledStudents = async (courseId: string) => {
    setLoadingStudents(true);
    
    const { data, error } = await supabase
      .from("enrolled_courses")
      .select(`
        id,
        user_id,
        progress,
        enrolled_at
      `)
      .eq("course_id", courseId)
      .order("progress", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch enrolled students", variant: "destructive" });
      setEnrolledStudents([]);
    } else {
      // Fetch profiles separately
      const userIds = (data || []).map(d => d.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", userIds);

      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      
      const studentsWithProfiles = (data || []).map(enrollment => ({
        ...enrollment,
        profile: profilesMap.get(enrollment.user_id) || { full_name: null, email: null, phone: null }
      }));
      
      setEnrolledStudents(studentsWithProfiles);
    }
    setLoadingStudents(false);
  };

  const handleCourseClick = (course: CourseWithEnrollments) => {
    setSelectedCourse(course);
    fetchEnrolledStudents(course.id);
  };

  const handleBack = () => {
    setSelectedCourse(null);
    setEnrolledStudents([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        {selectedCourse ? (
          <>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Button>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <img
                    src={selectedCourse.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"}
                    alt={selectedCourse.title}
                    className="w-24 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <CardTitle>{selectedCourse.title}</CardTitle>
                    <CardDescription className="mt-1">
                      <Badge variant="secondary">{selectedCourse.category}</Badge>
                      <span className="ml-3">{selectedCourse.students_count} enrolled students</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingStudents ? (
                  <div className="text-center py-8">Loading students...</div>
                ) : enrolledStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No students enrolled yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Enrolled Date</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead className="text-right">Completion %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrolledStudents.map((student, index) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {(student.profile?.full_name || "U")[0].toUpperCase()}
                                </span>
                              </div>
                              {student.profile?.full_name || "Unknown User"}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {student.profile?.email || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {student.profile?.phone || "—"}
                          </TableCell>
                          <TableCell>{formatDate(student.enrolled_at)}</TableCell>
                          <TableCell className="w-48">
                            <Progress value={student.progress} className="h-2" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              className={
                                student.progress === 100 
                                  ? "bg-green-500/10 text-green-600 border-green-500/20" 
                                  : student.progress >= 50 
                                    ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                    : "bg-muted text-muted-foreground"
                              }
                            >
                              {student.progress}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <div>
              <h2 className="font-heading text-3xl font-bold">Manage Classes</h2>
              <p className="text-muted-foreground mt-1">View enrolled students and track their progress</p>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading courses...</div>
            ) : courses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-heading font-bold text-xl mb-2">No Courses Yet</h3>
                  <p className="text-muted-foreground">There are no published courses available.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Card
                    key={course.id}
                    className="group cursor-pointer overflow-hidden border-border/50 bg-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2"
                    onClick={() => handleCourseClick(course)}
                  >
                    <div className="aspect-video overflow-hidden relative">
                      <Badge className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm text-primary border-0 z-10">
                        {course.category}
                      </Badge>
                      <img
                        src={course.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-heading font-bold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{course.students_count} students</span>
                        </div>
                        {course.price === 0 ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            Free
                          </Badge>
                        ) : (
                          <span className="font-bold text-primary">₦{course.price.toLocaleString()}</span>
                        )}
                      </div>
                      <Button variant="outline" className="w-full mt-4">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Students
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageClasses;