import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Edit, Eye, EyeOff, Star, Award, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CourseFormDialog } from "@/components/CourseFormDialog";
import { useEnrollment } from "@/hooks/useEnrollment";

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  published: boolean;
  featured: boolean;
  top_rated: boolean;
  instructor: string | null;
  duration: string | null;
  students_count: number;
  level: string | null;
  what_you_learn: string[] | null;
  requirements: string[] | null;
  syllabus: any;
  pending_review: boolean;
}

const DashboardCourses = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { enrollInCourse, enrolling } = useEnrollment();

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
        .single();
      
      const role = roleData?.role || "student";
      setUserRole(role);
      fetchCourses(session.user.id, role);
    };
    checkAuth();
  }, [navigate]);

  const fetchCourses = async (userId: string, role: string) => {
    setLoading(true);
    
    let query = supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    
    // Instructors only see their assigned courses
    if (role === "instructor") {
      query = query.eq("instructor_id", userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      toast({ title: "Error", description: "Failed to fetch courses", variant: "destructive" });
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const refreshCourses = () => {
    if (user?.id) fetchCourses(user.id, userRole);
  };

  const handleOpenDialog = (course?: Course) => {
    setEditingCourse(course || null);
    setDialogOpen(true);
  };

  const togglePublish = async (course: Course) => {
    const { error } = await supabase
      .from("courses")
      .update({ published: !course.published })
      .eq("id", course.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update course", variant: "destructive" });
    } else {
      toast({ 
        title: "Success", 
        description: `Course ${!course.published ? "published" : "unpublished"} successfully` 
      });
      refreshCourses();
    }
  };

  const toggleFeatured = async (course: Course) => {
    const { error } = await supabase
      .from("courses")
      .update({ featured: !course.featured })
      .eq("id", course.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update course", variant: "destructive" });
    } else {
      toast({ 
        title: "Success", 
        description: `Course ${!course.featured ? "featured" : "unfeatured"} successfully` 
      });
      refreshCourses();
    }
  };

  const toggleTopRated = async (course: Course) => {
    const { error } = await supabase
      .from("courses")
      .update({ top_rated: !course.top_rated })
      .eq("id", course.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update course", variant: "destructive" });
    } else {
      toast({ 
        title: "Success", 
        description: `Course ${!course.top_rated ? "marked as top rated" : "removed from top rated"} successfully` 
      });
      refreshCourses();
    }
  };

  const handleEnroll = async (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      await enrollInCourse(courseId, course.title);
    }
  };

  const sendForReview = async (course: Course) => {
    const { error } = await supabase
      .from("courses")
      .update({ pending_review: true })
      .eq("id", course.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to send course for review", variant: "destructive" });
    } else {
      toast({ 
        title: "Sent for Review", 
        description: `"${course.title}" has been sent to admin for review and publishing.` 
      });
      refreshCourses();
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground">Course Catalog</h2>
          {(userRole === "admin" || userRole === "instructor") && (
            <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          )}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">No courses found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="group overflow-hidden border border-border/60 shadow-none bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300 flex flex-col"
              >
                <div className="aspect-video overflow-hidden relative">
                  {userRole === "admin" && (
                    <div className="absolute top-4 left-4 flex gap-1 z-10 flex-wrap max-w-[calc(100%-80px)]">
                      <Button
                        size="icon"
                        variant={course.published ? "default" : "secondary"}
                        onClick={() => togglePublish(course)}
                        className="h-8 w-8"
                        title={course.published ? "Unpublish" : "Publish"}
                      >
                        {course.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant={course.featured ? "default" : "secondary"}
                        onClick={() => toggleFeatured(course)}
                        className="h-8 w-8"
                        title={course.featured ? "Unfeature" : "Feature"}
                      >
                        <Star className={course.featured ? "w-4 h-4 fill-current" : "w-4 h-4"} />
                      </Button>
                      <Button
                        size="icon"
                        variant={course.top_rated ? "default" : "secondary"}
                        onClick={() => toggleTopRated(course)}
                        className="h-8 w-8 bg-yellow-500 hover:bg-yellow-600"
                        title={course.top_rated ? "Remove Top Rated" : "Mark Top Rated"}
                      >
                        <Award className={course.top_rated ? "w-4 h-4 fill-current" : "w-4 h-4"} />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleOpenDialog(course)}
                        className="h-8 w-8"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {userRole === "instructor" && (
                    <div className="absolute top-4 left-4 flex gap-1 z-10">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleOpenDialog(course)}
                        className="h-8 w-8"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <Badge className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm text-primary border-0 z-10">
                    {course.category}
                  </Badge>
                  {course.top_rated && (
                    <Badge className="absolute bottom-4 left-4 bg-yellow-500 text-white border-0 z-10">
                      <Award className="w-3 h-3 mr-1" />
                      Top Rated
                    </Badge>
                  )}
                  <img
                    src={course.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {course.category}
                    </Badge>
                    {!course.published && !course.pending_review && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Draft
                      </Badge>
                    )}
                    {course.pending_review && !course.published && (
                      <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                        Pending Review
                      </Badge>
                    )}
                    {course.featured && (
                      <Badge className="bg-accent/10 text-accent border-0">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-4 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
                    {course.title}
                  </h3>
                  <div className="flex items-center justify-between mb-5 mt-auto">
                    {course.price === 0 ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-lg px-3 py-1">
                        Free
                      </Badge>
                    ) : (
                      <span className="text-2xl font-bold text-primary">₦{course.price.toLocaleString()}</span>
                    )}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {course.students_count || 0}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {userRole === "instructor" ? (
                      <>
                        <Button 
                          variant="outline"
                          className="flex-1"
                          onClick={() => navigate(`/dashboard/learn/${course.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        {!course.published && (
                          course.pending_review ? (
                            <Button 
                              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                              disabled
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Under Review
                            </Button>
                          ) : (
                            <Button 
                              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                              onClick={() => sendForReview(course)}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Send Review
                            </Button>
                          )
                        )}
                        {course.published && (
                          <Button
                            variant="outline"
                            className="border-2 hover:bg-accent/10"
                            asChild
                          >
                            <Link to={`/programs/${course.id}`}>View Details</Link>
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Button 
                          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/20 font-semibold"
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrolling}
                        >
                          Apply Now
                        </Button>
                        <Button
                          variant="outline"
                          className="border-2 hover:bg-accent/10"
                          asChild
                        >
                          <Link to={`/programs/${course.id}`}>View Details</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CourseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingCourse={editingCourse}
        onSave={refreshCourses}
        userRole={userRole}
      />
    </DashboardLayout>
  );
};

export default DashboardCourses;
