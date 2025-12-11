import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  category: string;
  instructor_id: string | null;
  published: boolean;
}

interface Instructor {
  id: string;
  full_name: string | null;
  email: string | null;
}

const CourseAllocation = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  
  // Form state
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");
  
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
      
      await Promise.all([fetchCourses(), fetchInstructors()]);
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, category, instructor_id, published")
      .order("title");
    
    if (!error && data) {
      setCourses(data);
    }
  };

  const fetchInstructors = async () => {
    // Get all users with instructor role
    const { data: instructorRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "instructor");
    
    if (rolesError || !instructorRoles) return;
    
    const instructorIds = instructorRoles.map(r => r.user_id);
    
    if (instructorIds.length === 0) {
      setInstructors([]);
      return;
    }
    
    // Get profiles for these instructors
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", instructorIds);
    
    if (!profilesError && profiles) {
      setInstructors(profiles);
    }
  };

  const handleAssignInstructor = async () => {
    if (!selectedCourse || !selectedInstructor) {
      toast({ title: "Error", description: "Please select both course and instructor", variant: "destructive" });
      return;
    }
    
    setAssigning(selectedCourse);
    
    const { error } = await supabase
      .from("courses")
      .update({ instructor_id: selectedInstructor })
      .eq("id", selectedCourse);
    
    if (error) {
      toast({ title: "Error", description: "Failed to assign instructor", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Instructor assigned successfully" });
      setSelectedCourse("");
      setSelectedInstructor("");
      fetchCourses();
    }
    
    setAssigning(null);
  };

  const handleRemoveInstructor = async (courseId: string) => {
    setAssigning(courseId);
    
    const { error } = await supabase
      .from("courses")
      .update({ instructor_id: null })
      .eq("id", courseId);
    
    if (error) {
      toast({ title: "Error", description: "Failed to remove instructor", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Instructor removed from course" });
      fetchCourses();
    }
    
    setAssigning(null);
  };

  const getInstructorName = (instructorId: string | null) => {
    if (!instructorId) return null;
    const instructor = instructors.find(i => i.id === instructorId);
    return instructor?.full_name || instructor?.email || "Unknown";
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unassigned courses for the dropdown
  const unassignedCourses = courses.filter(c => !c.instructor_id);

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-3xl font-bold">Course Allocation</h2>
          <p className="text-muted-foreground mt-1">Assign instructors to courses</p>
        </div>

        {/* Assignment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Assign Instructor to Course</CardTitle>
            <CardDescription>Select a course and instructor to create an assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {instructors.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>No instructors found. Please assign the "Instructor" role to users in Role Management first.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {unassignedCourses.length === 0 ? (
                          <SelectItem value="none" disabled>All courses are assigned</SelectItem>
                        ) : (
                          unassignedCourses.map(course => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Instructor</Label>
                    <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an instructor" />
                      </SelectTrigger>
                      <SelectContent>
                        {instructors.map(instructor => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.full_name || instructor.email || "Unknown Instructor"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={handleAssignInstructor} 
                  disabled={!selectedCourse || !selectedInstructor || assigning !== null}
                >
                  {assigning ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Assign Instructor
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Current Allocations */}
        <Card>
          <CardHeader>
            <CardTitle>Course Assignments</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No courses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{course.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {course.instructor_id ? (
                            <span className="text-foreground">{getInstructorName(course.instructor_id)}</span>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={course.published ? "default" : "secondary"}>
                            {course.published ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {course.instructor_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveInstructor(course.id)}
                              disabled={assigning === course.id}
                            >
                              {assigning === course.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <X className="w-4 h-4 mr-1" />
                                  Remove
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CourseAllocation;
