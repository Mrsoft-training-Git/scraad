import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Edit, Eye, EyeOff, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  published: boolean;
  featured: boolean;
  instructor: string | null;
  duration: string | null;
  students_count: number;
  level: string | null;
}

const DashboardCourses = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    image_url: "",
    category: "",
    instructor: "",
    duration: "",
    level: "Beginner"
  });
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
      
      setUserRole(roleData?.role || "student");
      fetchCourses();
    };
    checkAuth();
  }, [navigate]);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast({ title: "Error", description: "Failed to fetch courses", variant: "destructive" });
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        description: course.description || "",
        price: course.price.toString(),
        image_url: course.image_url || "",
        category: course.category,
        instructor: course.instructor || "",
        duration: course.duration || "",
        level: course.level || "Beginner"
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: "",
        description: "",
        price: "",
        image_url: "",
        category: "",
        instructor: "",
        duration: "",
        level: "Beginner"
      });
    }
    setDialogOpen(true);
  };

  const handleSaveCourse = async () => {
    if (!formData.title || !formData.price || !formData.category) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }

    const courseData = {
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      image_url: formData.image_url,
      category: formData.category,
      instructor: formData.instructor,
      duration: formData.duration,
      level: formData.level
    };

    if (editingCourse) {
      const { error } = await supabase
        .from("courses")
        .update(courseData)
        .eq("id", editingCourse.id);
      
      if (error) {
        toast({ title: "Error", description: "Failed to update course", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Course updated successfully" });
        fetchCourses();
        setDialogOpen(false);
      }
    } else {
      const { error } = await supabase
        .from("courses")
        .insert([courseData]);
      
      if (error) {
        toast({ title: "Error", description: "Failed to create course", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Course created successfully" });
        fetchCourses();
        setDialogOpen(false);
      }
    }
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
      fetchCourses();
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
      fetchCourses();
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="font-heading text-3xl font-bold">Course Catalog</h2>
          {userRole === "admin" && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price (₦) *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g., Business, Technology"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="instructor">Instructor</Label>
                      <Input
                        id="instructor"
                        value={formData.instructor}
                        onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g., 8 weeks"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="level">Level</Label>
                    <Input
                      id="level"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleSaveCourse} className="w-full">
                    {editingCourse ? "Update Course" : "Create Course"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="group overflow-hidden border-border/50 bg-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 flex flex-col"
              >
                <div className="aspect-video overflow-hidden relative">
                  {userRole === "admin" && (
                    <div className="absolute top-4 left-4 flex gap-2 z-10">
                      <Button
                        size="icon"
                        variant={course.published ? "default" : "secondary"}
                        onClick={() => togglePublish(course)}
                        className="h-8 w-8"
                      >
                        {course.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant={course.featured ? "default" : "secondary"}
                        onClick={() => toggleFeatured(course)}
                        className="h-8 w-8"
                      >
                        <Star className={course.featured ? "w-4 h-4 fill-current" : "w-4 h-4"} />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleOpenDialog(course)}
                        className="h-8 w-8"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary z-10">
                    {course.category}
                  </div>
                  <img
                    src={course.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                      {course.category}
                    </div>
                    {!course.published && (
                      <div className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-semibold">
                        Draft
                      </div>
                    )}
                    {course.featured && (
                      <div className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">
                        Featured
                      </div>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-4 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
                    {course.title}
                  </h3>
                  <div className="flex items-center justify-between mb-5 mt-auto">
                    <span className="text-2xl font-bold text-primary">₦{course.price.toLocaleString()}</span>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {course.students_count}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/20 font-semibold">
                      Apply Now
                    </Button>
                    <Button
                      variant="outline"
                      className="border-2 hover:bg-accent/10"
                      asChild
                    >
                      <Link to={`/programs/${course.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardCourses;
