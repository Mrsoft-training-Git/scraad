import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
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
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight
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
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<CourseContent | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  // Video controls state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Document viewer state
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfZoom, setPdfZoom] = useState(100);

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
        await fetchCompletedItems(session.user.id);
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
    setEnrollmentId(data?.id || null);
  };

  const fetchCompletedItems = async (userId: string) => {
    const { data } = await supabase
      .from("content_progress")
      .select("content_id")
      .eq("user_id", userId);
    
    if (data) {
      setCompletedItems(new Set(data.map(item => item.content_id)));
    }
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
      if (contentsData.length > 0) {
        setSelectedContent(contentsData[0]);
      }
    }

    setLoading(false);
  };

  const markAsCompleted = async (contentId: string) => {
    if (!user || completedItems.has(contentId)) return;

    const { error } = await supabase
      .from("content_progress")
      .insert({
        user_id: user.id,
        content_id: contentId
      });

    if (!error) {
      const newCompleted = new Set([...completedItems, contentId]);
      setCompletedItems(newCompleted);
      
      // Update enrollment progress
      if (enrollmentId && contents.length > 0) {
        const progressPercent = Math.round((newCompleted.size / contents.length) * 100);
        await supabase
          .from("enrolled_courses")
          .update({ progress: progressPercent })
          .eq("id", enrollmentId);
      }

      toast({
        title: "Progress saved",
        description: "This item has been marked as completed.",
      });
    }
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
    setPdfPage(1);
    setPdfZoom(100);
    setIsPlaying(false);
    setVideoProgress(0);
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

  // Video control handlers
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoProgress = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
    }
  };

  const handleVideoSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = (Number(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setVideoProgress(Number(e.target.value));
    }
  };

  const skipVideo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    const isCompleted = completedItems.has(selectedContent.id);

    // YouTube Video
    if (selectedContent.content_type === "video" && isYouTubeUrl(url)) {
      const videoId = getYouTubeVideoId(url);
      if (videoId) {
        return (
          <div className="space-y-4">
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                title={selectedContent.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {!isCompleted && (
              <Button onClick={() => markAsCompleted(selectedContent.id)} className="w-full">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark as Completed
              </Button>
            )}
          </div>
        );
      }
    }

    // Native Video with custom controls
    if (selectedContent.content_type === "video") {
      return (
        <div className="space-y-4">
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black group">
            <video
              ref={videoRef}
              src={url}
              className="w-full h-full"
              onTimeUpdate={handleVideoProgress}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setVideoDuration(videoRef.current.duration);
                }
              }}
              onEnded={() => setIsPlaying(false)}
            />
            {/* Custom Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Progress Bar */}
              <input
                type="range"
                min="0"
                max="100"
                value={videoProgress}
                onChange={handleVideoSeek}
                className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer mb-3"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => skipVideo(-10)} className="text-white hover:bg-white/20">
                    <SkipBack className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20">
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => skipVideo(10)} className="text-white hover:bg-white/20">
                    <SkipForward className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <span className="text-white text-sm ml-2">
                    {videoRef.current ? formatTime(videoRef.current.currentTime) : '0:00'} / {formatTime(videoDuration)}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
          {!isCompleted && (
            <Button onClick={() => markAsCompleted(selectedContent.id)} className="w-full">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark as Completed
            </Button>
          )}
        </div>
      );
    }

    // Document/PDF Viewer - Coursera Style
    if (selectedContent.content_type === "document" || isPdfUrl(url)) {
      return (
        <div className="space-y-4">
          {/* Document Controls Bar */}
          <div className="flex items-center justify-between bg-muted p-3 rounded-t-lg border border-b-0">
            {/* Pagination */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setPdfPage(Math.max(1, pdfPage - 1))}
                disabled={pdfPage <= 1}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={pdfPage}
                  onChange={(e) => setPdfPage(Math.max(1, Number(e.target.value)))}
                  className="w-12 h-8 text-center border rounded bg-background"
                  min="1"
                />
                <span className="text-muted-foreground">/ 2</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setPdfPage(pdfPage + 1)}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setPdfZoom(Math.max(50, pdfZoom - 25))}
              >
                <ZoomOut className="w-5 h-5" />
              </Button>
              <span className="text-sm w-14 text-center">{pdfZoom}%</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setPdfZoom(Math.min(200, pdfZoom + 25))}
              >
                <ZoomIn className="w-5 h-5" />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <a href={url} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-5 h-5" />
                </a>
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  const iframe = document.querySelector('.pdf-iframe') as HTMLIFrameElement;
                  if (iframe) {
                    iframe.requestFullscreen();
                  }
                }}
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div 
            className="w-full border rounded-b-lg overflow-auto bg-muted/50"
            style={{ height: '600px' }}
          >
            <div style={{ transform: `scale(${pdfZoom / 100})`, transformOrigin: 'top center' }}>
              <iframe
                src={`${url}#page=${pdfPage}`}
                title={selectedContent.title}
                className="pdf-iframe w-full"
                style={{ height: `${600 * (100 / pdfZoom)}px`, minWidth: '100%' }}
              />
            </div>
          </div>

          {/* Mark as Completed Button */}
          {!isCompleted && (
            <Button onClick={() => markAsCompleted(selectedContent.id)} className="w-full">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark as Completed
            </Button>
          )}
        </div>
      );
    }

    // Link type
    return (
      <div className="space-y-4">
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
        {!isCompleted && (
          <Button onClick={() => markAsCompleted(selectedContent.id)} className="w-full">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark as Completed
          </Button>
        )}
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
              {/* Content Title */}
              {selectedContent && (
                <h1 className="text-2xl font-bold mb-6">{selectedContent.title}</h1>
              )}
              
              {renderContentPlayer()}
              
              {/* Content Description */}
              {selectedContent?.description && (
                <p className="text-muted-foreground mt-4">{selectedContent.description}</p>
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