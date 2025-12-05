import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ContentPreview } from "@/components/ContentPreview";
import { 
  ArrowLeft, 
  BookOpen, 
  Video, 
  FileText, 
  Link as LinkIcon, 
  Play, 
  CheckCircle2,
  Clock,
  User as UserIcon
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  instructor: string | null;
  duration: string | null;
}

interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
}

interface CourseContent {
  id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  order_index: number;
}

const CourseViewer = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [contents, setContents] = useState<CourseContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [previewContent, setPreviewContent] = useState<CourseContent | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [progress, setProgress] = useState(0);
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
      
      if (courseId) {
        await checkEnrollment(session.user.id, courseId);
        await fetchCourseData(courseId);
      }
    };
    checkAuth();
  }, [navigate, courseId]);

  const checkEnrollment = async (userId: string, courseId: string) => {
    const { data } = await supabase
      .from("enrolled_courses")
      .select("id, progress")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();
    
    setIsEnrolled(!!data);
    setProgress(data?.progress || 0);
  };

  const fetchCourseData = async (courseId: string) => {
    setLoading(true);
    
    // Fetch course details
    const { data: courseData } = await supabase
      .from("courses")
      .select("id, title, description, image_url, instructor, duration")
      .eq("id", courseId)
      .maybeSingle();
    
    if (courseData) {
      setCourse(courseData);
    }

    // Fetch modules
    const { data: modulesData } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index");
    
    if (modulesData) {
      setModules(modulesData);
    }

    // Fetch content
    const { data: contentsData } = await supabase
      .from("course_content")
      .select("id, module_id, title, description, content_type, content_url, order_index")
      .eq("course_id", courseId)
      .eq("is_published", true)
      .order("order_index");
    
    if (contentsData) {
      setContents(contentsData);
    }

    setLoading(false);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4" />;
      case "link": return <LinkIcon className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getModuleContents = (moduleId: string) => {
    return contents.filter(c => c.module_id === moduleId);
  };

  const getUnassignedContents = () => {
    return contents.filter(c => !c.module_id);
  };

  const handlePlayContent = (content: CourseContent) => {
    setPreviewContent(content);
    setPreviewOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout user={user} userRole={userRole}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout user={user} userRole={userRole}>
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading font-bold text-xl mb-2">Course Not Found</h3>
            <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to="/dashboard/learning">Back to My Learning</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!isEnrolled && userRole !== "admin") {
    return (
      <DashboardLayout user={user} userRole={userRole}>
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading font-bold text-xl mb-2">Not Enrolled</h3>
            <p className="text-muted-foreground mb-4">You need to enroll in this course to access the content.</p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="outline">
                <Link to="/dashboard/learning">Back to My Learning</Link>
              </Button>
              <Button asChild>
                <Link to={`/programs/${courseId}`}>View Course Details</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const unassignedContents = getUnassignedContents();

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/learning">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-bold">{course.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              {course.instructor && (
                <span className="flex items-center gap-1">
                  <UserIcon className="w-4 h-4" />
                  {course.instructor}
                </span>
              )}
              {course.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {course.duration}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Course Progress</span>
              <span className="text-sm font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Course Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Course Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            {modules.length === 0 && contents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No content available for this course yet.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Modules with Accordion */}
                {modules.length > 0 && (
                  <Accordion type="multiple" className="w-full" defaultValue={modules.map(m => m.id)}>
                    {modules.map((module) => {
                      const moduleContents = getModuleContents(module.id);
                      return (
                        <AccordionItem key={module.id} value={module.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 text-left">
                              <Badge variant="secondary">{moduleContents.length} items</Badge>
                              <span className="font-semibold">{module.title}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {module.description && (
                              <p className="text-sm text-muted-foreground mb-4 pl-4">{module.description}</p>
                            )}
                            {moduleContents.length === 0 ? (
                              <p className="text-sm text-muted-foreground pl-4">No content in this module yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {moduleContents.map((content) => (
                                  <div 
                                    key={content.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                                    onClick={() => handlePlayContent(content)}
                                  >
                                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                                      {getContentIcon(content.content_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{content.title}</p>
                                      {content.description && (
                                        <p className="text-sm text-muted-foreground truncate">{content.description}</p>
                                      )}
                                    </div>
                                    <Button size="sm" variant="ghost">
                                      <Play className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}

                {/* Unassigned Content */}
                {unassignedContents.length > 0 && (
                  <div className="space-y-2">
                    {modules.length > 0 && (
                      <h4 className="font-semibold text-sm text-muted-foreground mt-4 mb-2">Other Content</h4>
                    )}
                    {unassignedContents.map((content) => (
                      <div 
                        key={content.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => handlePlayContent(content)}
                      >
                        <div className="p-2 rounded-md bg-primary/10 text-primary">
                          {getContentIcon(content.content_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{content.title}</p>
                          {content.description && (
                            <p className="text-sm text-muted-foreground truncate">{content.description}</p>
                          )}
                        </div>
                        <Button size="sm" variant="ghost">
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Preview */}
      <ContentPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        content={previewContent}
      />
    </DashboardLayout>
  );
};

export default CourseViewer;
