import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, CheckCircle, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LiveSessionsList } from "@/components/zoom/LiveSessionsList";

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

export const StudentDashboard = ({ userName }: { userName: string }) => {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="border-none shadow-card">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 md:mb-2 truncate">ENROLLED</p>
                <p className="text-2xl md:text-4xl font-bold text-primary">{courses.length}</p>
              </div>
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 ml-2">
                <BookOpen className="w-5 h-5 md:w-7 md:h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-card">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 md:mb-2 truncate">PROGRESS</p>
                <p className="text-2xl md:text-4xl font-bold text-primary">{averageProgress}%</p>
              </div>
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 ml-2">
                <Trophy className="w-5 h-5 md:w-7 md:h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-card">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 md:mb-2 truncate">PENDING</p>
                <p className="text-2xl md:text-4xl font-bold text-primary">{upcomingAssignments.length}</p>
              </div>
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 ml-2">
                <Clock className="w-5 h-5 md:w-7 md:h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-card">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 md:mb-2 truncate">COMPLETED</p>
                <p className="text-2xl md:text-4xl font-bold text-primary">{completedAssignments.length}</p>
              </div>
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 ml-2">
                <CheckCircle className="w-5 h-5 md:w-7 md:h-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Live Sessions */}
      <LiveSessionsList />

      {/* Course Progress */}
      <Card className="border-none shadow-card">
        <CardHeader className="bg-foreground text-background">
          <CardTitle className="text-lg font-heading">My Courses</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-muted-foreground">Loading courses...</p>
          ) : courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet.</p>
              <Button asChild>
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {courses.map((course) => (
                <div key={course.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">{course.course_name}</h4>
                    <span className="text-sm text-muted-foreground">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Assignments */}
      <Card className="border-none shadow-card">
        <CardHeader className="bg-foreground text-background">
          <CardTitle className="text-lg font-heading">Upcoming Assignments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-muted-foreground p-6">Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No assignments yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Assignment</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Due Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{assignment.title}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            assignment.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : assignment.status === "submitted"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};