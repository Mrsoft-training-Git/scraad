import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { ZoomConnectionStatus } from "@/components/zoom/ZoomConnectionStatus";
import { LiveSessionsList } from "@/components/zoom/LiveSessionsList";

interface InstructorDashboardProps {
  userName: string;
  userId: string;
}

interface CourseStats {
  totalCourses: number;
  totalStudents: number;
  publishedCourses: number;
  avgProgress: number;
}

interface RecentEnrollment {
  id: string;
  studentName: string;
  courseName: string;
  enrolledAt: string;
  progress: number;
}

export const InstructorDashboard = ({ userName, userId }: InstructorDashboardProps) => {
  const [stats, setStats] = useState<CourseStats>({
    totalCourses: 0,
    totalStudents: 0,
    publishedCourses: 0,
    avgProgress: 0,
  });
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      // Fetch instructor's courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, published, students_count")
        .eq("instructor_id", userId);

      const courseIds = courses?.map(c => c.id) || [];
      const totalCourses = courses?.length || 0;
      const publishedCourses = courses?.filter(c => c.published).length || 0;
      const totalStudents = courses?.reduce((sum, c) => sum + (c.students_count || 0), 0) || 0;

      // Fetch enrollments for instructor's courses
      let avgProgress = 0;
      let enrollmentsData: RecentEnrollment[] = [];

      if (courseIds.length > 0) {
        const { data: enrollments } = await supabase
          .from("enrolled_courses")
          .select("id, user_id, course_name, enrolled_at, progress, course_id")
          .in("course_id", courseIds)
          .order("enrolled_at", { ascending: false })
          .limit(10);

        if (enrollments && enrollments.length > 0) {
          avgProgress = Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length);

          // Fetch student profiles
          const userIds = enrollments.map(e => e.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);

          const profilesMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

          enrollmentsData = enrollments.map(e => ({
            id: e.id,
            studentName: profilesMap.get(e.user_id) || "Unknown",
            courseName: e.course_name,
            enrolledAt: e.enrolled_at,
            progress: e.progress || 0,
          }));
        }
      }

      setStats({
        totalCourses,
        totalStudents,
        publishedCourses,
        avgProgress,
      });
      setRecentEnrollments(enrollmentsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    { 
      title: "My Courses", 
      value: stats.totalCourses, 
      icon: BookOpen, 
      description: `${stats.publishedCourses} published`,
      color: "text-primary" 
    },
    { 
      title: "Total Students", 
      value: stats.totalStudents, 
      icon: Users, 
      description: "Enrolled in your courses",
      color: "text-green-600" 
    },
    { 
      title: "Avg. Progress", 
      value: `${stats.avgProgress}%`, 
      icon: TrendingUp, 
      description: "Student completion rate",
      color: "text-blue-600" 
    },
    { 
      title: "Published", 
      value: stats.publishedCourses, 
      icon: Clock, 
      description: "Active courses",
      color: "text-amber-600" 
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground mt-1">Here's an overview of your courses and students.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsConfig.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Zoom Integration & Live Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ZoomConnectionStatus />
        <LiveSessionsList isInstructor />
      </div>

      {/* Recent Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Enrollments</CardTitle>
          <CardDescription>Students who recently enrolled in your courses</CardDescription>
        </CardHeader>
        <CardContent>
          {recentEnrollments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No enrollments yet. Students will appear here once they enroll in your courses.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {enrollment.studentName[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{enrollment.studentName}</p>
                      <p className="text-sm text-muted-foreground">{enrollment.courseName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <Progress value={enrollment.progress} className="h-2" />
                      </div>
                      <span className="text-sm font-medium w-12">{enrollment.progress}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(enrollment.enrolledAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
