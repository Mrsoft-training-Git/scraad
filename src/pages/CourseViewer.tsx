import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X,
  Video, 
  FileText, 
  Link as LinkIcon, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BookOpen,
  ExternalLink
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

// Helper functions for YouTube
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

const isPdfUrl = (url: string): boolean => {
  return url.toLowerCase().endsWith('.pdf');
};

const CourseViewer = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [contents, setContents] = useState<CourseContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedContent, setSelectedContent] = useState<CourseContent | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
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
    
    const { data: courseData } = await supabase
      .from("courses")
      .select("id, title, description, image_url, instructor, duration")
      .eq("id", courseId)
      .maybeSingle();
    
    if (courseData) {
      setCourse(courseData);
    }

    const { data: modulesData } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index");
    
    if (modulesData) {
      setModules(modulesData);
      // Expand first module by default
      if (modulesData.length > 0) {
        setExpandedModules(new Set([modulesData[0].id]));
      }
    }

    const { data: contentsData } = await supabase
      .from("course_content")
      .select("id, module_id, title, description, content_type, content_url, order_index")
      .eq("course_id", courseId)
      .eq("is_published", true)
      .order("order_index");
    
    if (contentsData) {
      setContents(contentsData);
      // Select first content by default
      if (contentsData.length > 0) {
        setSelectedContent(contentsData[0]);
      }
    }

    setLoading(false);
  };

  const getContentIcon = (type: string, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    switch (type) {
      case "video": return <Video className="w-5 h-5 text-muted-foreground" />;
      case "link": return <LinkIcon className="w-5 h-5 text-muted-foreground" />;
      default: return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getModuleContents = (moduleId: string) => {
    return contents.filter(c => c.module_id === moduleId);
  };

  const getUnassignedContents = () => {
    return contents.filter(c => !c.module_id);
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleSelectContent = (content: CourseContent) => {
    setSelectedContent(content);
    // Mark as completed when viewed
    setCompletedItems(prev => new Set([...prev, content.id]));
  };

  const getAllContents = () => {
    const allContents: CourseContent[] = [];
    modules.forEach(module => {
      allContents.push(...getModuleContents(module.id));
    });
    allContents.push(...getUnassignedContents());
    return allContents;
  };

  const goToNextItem = () => {
    const allContents = getAllContents();
    const currentIndex = allContents.findIndex(c => c.id === selectedContent?.id);
    if (currentIndex < allContents.length - 1) {
      handleSelectContent(allContents[currentIndex + 1]);
    }
  };

  const renderContentPlayer = () => {
    if (!selectedContent || !selectedContent.content_url) {
      return (
        <div className="flex items-center justify-center h-[400px] bg-muted rounded-lg">
          <div className="text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-2" />
            <p>Select a lesson to start learning</p>
          </div>
        </div>
      );
    }

    const url = selectedContent.content_url;

    if (selectedContent.content_type === "video" || isYouTubeUrl(url)) {
      if (isYouTubeUrl(url)) {
        const videoId = getYouTubeVideoId(url);
        if (videoId) {
          return (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                title={selectedContent.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
      }
      return (
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
          <video
            src={url}
            controls
            className="w-full h-full"
            title={selectedContent.title}
          />
        </div>
      );
    }

    if (selectedContent.content_type === "document" || isPdfUrl(url)) {
      return (
        <div className="w-full h-[500px] rounded-lg overflow-hidden border">
          <iframe
            src={url}
            title={selectedContent.title}
            className="w-full h-full"
          />
        </div>
      );
    }

    // Link type
    return (
      <div className="flex items-center justify-center h-[300px] bg-muted rounded-lg">
        <div className="text-center">
          <LinkIcon className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="font-semibold mb-2">{selectedContent.title}</h3>
          <p className="text-muted-foreground mb-4">{selectedContent.description}</p>
          <Button asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              Open Resource <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-heading font-bold text-xl mb-2">Course Not Found</h3>
          <Button asChild>
            <Link to="/dashboard/learning">Back to My Learning</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!isEnrolled && userRole !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-heading font-bold text-xl mb-2">Not Enrolled</h3>
          <p className="text-muted-foreground mb-4">You need to enroll to access this course.</p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline">
              <Link to="/dashboard/learning">Back to Learning</Link>
            </Button>
            <Button asChild>
              <Link to={`/programs/${courseId}`}>Enroll Now</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const allContents = getAllContents();
  const completedCount = completedItems.size;
  const totalCount = allContents.length;
  const currentIndex = allContents.findIndex(c => c.id === selectedContent?.id);
  const hasNext = currentIndex < allContents.length - 1;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Progress Bar */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalCount} learning items
          </span>
          <Progress value={(completedCount / Math.max(totalCount, 1)) * 100} className="w-48 h-2" />
        </div>
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/learning">
            <X className="w-5 h-5" />
          </Link>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <Link to="/dashboard/learning" className="text-primary hover:underline font-semibold text-lg">
              {course.title}
            </Link>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              {modules.map((module, moduleIndex) => {
                const moduleContents = getModuleContents(module.id);
                const isExpanded = expandedModules.has(module.id);
                
                return (
                  <div key={module.id} className="mb-1">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-lg text-left"
                    >
                      <div>
                        <span className="text-xs text-muted-foreground">Module {moduleIndex + 1}</span>
                        <p className="font-medium text-sm">{module.title}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-2 border-l-2 border-muted">
                        {moduleContents.map((content) => {
                          const isSelected = selectedContent?.id === content.id;
                          const isCompleted = completedItems.has(content.id);
                          
                          return (
                            <button
                              key={content.id}
                              onClick={() => handleSelectContent(content)}
                              className={`w-full flex items-start gap-3 p-3 text-left hover:bg-accent rounded-r-lg transition-colors ${
                                isSelected ? 'bg-accent border-l-2 border-primary -ml-[2px]' : ''
                              }`}
                            >
                              {getContentIcon(content.content_type, isCompleted)}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${isSelected ? 'font-semibold' : ''}`}>
                                  {content.title}
                                </p>
                                <span className="text-xs text-muted-foreground capitalize">
                                  {content.content_type}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Unassigned Content */}
              {getUnassignedContents().length > 0 && (
                <div className="mt-2">
                  {getUnassignedContents().map((content) => {
                    const isSelected = selectedContent?.id === content.id;
                    const isCompleted = completedItems.has(content.id);
                    
                    return (
                      <button
                        key={content.id}
                        onClick={() => handleSelectContent(content)}
                        className={`w-full flex items-start gap-3 p-3 text-left hover:bg-accent rounded-lg transition-colors ${
                          isSelected ? 'bg-accent' : ''
                        }`}
                      >
                        {getContentIcon(content.content_type, isCompleted)}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${isSelected ? 'font-semibold' : ''}`}>
                            {content.title}
                          </p>
                          <span className="text-xs text-muted-foreground capitalize">
                            {content.content_type}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {allContents.length === 0 && (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No content available yet.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="max-w-4xl mx-auto p-6">
              {renderContentPlayer()}
              
              {/* Content Title & Description */}
              {selectedContent && (
                <div className="mt-6">
                  <h1 className="text-2xl font-bold">{selectedContent.title}</h1>
                  {selectedContent.description && (
                    <p className="text-muted-foreground mt-2">{selectedContent.description}</p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Bottom Navigation */}
          <div className="border-t bg-card p-4 flex justify-end">
            <Button 
              onClick={goToNextItem} 
              disabled={!hasNext}
              className="gap-2"
            >
              Go to next item <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseViewer;
