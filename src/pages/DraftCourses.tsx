import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Edit, Eye, X, User as UserIcon, MoreVertical, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { CourseFormDialog } from "@/components/CourseFormDialog";

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
  instructor_id: string | null;
  duration: string | null;
  students_count: number;
  level: string | null;
  what_you_learn: string[] | null;
  requirements: string[] | null;
  syllabus: any;
  pending_review: boolean;
}

const DraftCourses = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
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
        .single();
      
      const role = roleData?.role || "student";
      
      // Only admins can access this page
      if (role !== "admin") {
        navigate("/dashboard");
        return;
      }
      
      setUserRole(role);
      fetchDraftCourses();
    };
    checkAuth();
  }, [navigate]);

  const fetchDraftCourses = async () => {
    setLoading(true);
    
    // Only show courses that are pending review (explicitly sent by instructors)
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("published", false)
      .eq("pending_review", true)
      .order("created_at", { ascending: false });
    
    if (error) {
      toast({ title: "Error", description: "Failed to fetch draft courses", variant: "destructive" });
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (course: Course) => {
    setEditingCourse(course);
    setDialogOpen(true);
  };

  const publishCourse = async (course: Course) => {
    const { error } = await supabase
      .from("courses")
      .update({ published: true, pending_review: false })
      .eq("id", course.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to publish course", variant: "destructive" });
    } else {
      toast({ 
        title: "Success", 
        description: "Course published successfully" 
      });
      fetchDraftCourses();
    }
  };

  const rejectCourse = async (course: Course) => {
    const { error } = await supabase
      .from("courses")
      .update({ pending_review: false })
      .eq("id", course.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to reject course", variant: "destructive" });
    } else {
      toast({ 
        title: "Course Rejected", 
        description: "Course has been sent back to the instructor" 
      });
      fetchDraftCourses();
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold">Draft Courses</h2>
            <p className="text-muted-foreground mt-1">Review and publish courses pending approval</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {courses.length} Pending
          </Badge>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by title or instructor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">Loading draft courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No draft courses found</p>
            <p className="text-sm text-muted-foreground mt-2">All courses have been published!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="group overflow-hidden border-border/50 bg-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 flex flex-col"
              >
                <div className="aspect-video overflow-hidden relative">
                  <div className="absolute top-4 right-4 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="secondary" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(course)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => rejectCourse(course)}
                          className="text-destructive"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Badge className="absolute top-4 left-4 bg-orange-500 text-white border-0 z-10">
                    Pending Review
                  </Badge>
                  <img
                    src={course.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6 flex flex-col flex-grow">
                  <Badge variant="secondary" className="bg-primary/10 text-primary w-fit mb-3">
                    {course.category}
                  </Badge>
                  <h3 className="font-heading font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
                    {course.title}
                  </h3>
                  {course.instructor && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <UserIcon className="w-4 h-4" />
                      <span>By {course.instructor}</span>
                    </div>
                  )}
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
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/dashboard/learn/${course.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => publishCourse(course)}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Publish
                    </Button>
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
        onSave={fetchDraftCourses}
        userRole={userRole}
      />
    </DashboardLayout>
  );
};

export default DraftCourses;
