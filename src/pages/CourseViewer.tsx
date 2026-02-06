import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { X, Video, FileText, Link as LinkIcon, CheckCircle2, ChevronDown, ChevronUp, ArrowRight, ArrowLeft, BookOpen, ExternalLink, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Download, Menu, ClipboardCheck } from "lucide-react";
import { KnowledgeCheckPlayer } from "@/components/KnowledgeCheckPlayer";
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

// YouTube Progress Tracker Component - estimates watch progress over time
const YouTubeProgressTracker = ({
  videoId,
  title,
  contentId,
  savedProgress,
  isCompleted,
  onProgressUpdate
}: {
  videoId: string;
  title: string;
  contentId: string;
  savedProgress: number;
  isCompleted: boolean;
  onProgressUpdate: (contentId: string, progress: number) => Promise<void>;
}) => {
  const [estimatedProgress, setEstimatedProgress] = useState(savedProgress);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // Assume average video is ~5 minutes (300 seconds), update every 15 seconds = ~5% progress
    if (!isCompleted && estimatedProgress < 100) {
      intervalRef.current = setInterval(() => {
        setEstimatedProgress(prev => {
          const newProgress = Math.min(prev + 5, 100);
          onProgressUpdate(contentId, newProgress);
          if (newProgress >= 100) {
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
          return newProgress;
        });
      }, 15000); // Every 15 seconds
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [contentId, isCompleted]);
  return <div className="space-y-2">
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
        <iframe src={`https://www.youtube.com/embed/${videoId}?rel=0`} title={title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
      {!isCompleted && <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Progress value={estimatedProgress} className="h-1 flex-1" />
          <span>{Math.round(estimatedProgress)}%</span>
        </div>}
    </div>;
};
const CourseViewer = () => {
  const {
    courseId
  } = useParams<{
    courseId: string;
  }>();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [isInstructorOrAdmin, setIsInstructorOrAdmin] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [contents, setContents] = useState<CourseContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<CourseContent | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [contentProgress, setContentProgress] = useState<Map<string, number>>(new Map());
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [previousAttempt, setPreviousAttempt] = useState<{
    score: number;
    total_questions: number;
  } | null>(null);
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set());
  const {
    toast
  } = useToast();
  const navigate = useNavigate();

  // Video controls state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const lastSavedProgress = useRef<number>(0);
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      const {
        data: roleData
      } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle();
      const role = roleData?.role || "student";
      setUserRole(role);
      
      if (courseId) {
        // Check if user is instructor of this course or admin
        const { data: courseData } = await supabase
          .from("courses")
          .select("instructor_id")
          .eq("id", courseId)
          .maybeSingle();
        
        const isOwnerOrAdmin = role === "admin" || (role === "instructor" && courseData?.instructor_id === session.user.id);
        setIsInstructorOrAdmin(isOwnerOrAdmin);
        
        const enrollId = await checkEnrollment(session.user.id, courseId);
        const courseContents = await fetchCourseData(courseId, isOwnerOrAdmin);
        await fetchCompletedItems(session.user.id, courseContents, enrollId);
      }
    };
    checkAuth();
  }, [navigate, courseId]);
  const checkEnrollment = async (userId: string, courseId: string): Promise<string | null> => {
    const {
      data
    } = await supabase.from("enrolled_courses").select("id, progress").eq("user_id", userId).eq("course_id", courseId).maybeSingle();
    setIsEnrolled(!!data);
    setEnrollmentId(data?.id || null);
    return data?.id || null;
  };
  const fetchCompletedItems = async (userId: string, courseContents: CourseContent[], enrollId: string | null) => {
    const {
      data
    } = await supabase.from("content_progress").select("content_id, watch_progress").eq("user_id", userId);
    if (data) {
      // Filter to only include items that still exist in current course content
      const courseContentIds = new Set(courseContents.map(c => c.id));
      const validItems = data.filter(item => courseContentIds.has(item.content_id));

      // Track completed items (100% progress)
      const completed = validItems.filter(item => (item.watch_progress || 0) >= 100);
      setCompletedItems(new Set(completed.map(item => item.content_id)));

      // Track all progress
      const progressMap = new Map<string, number>();
      validItems.forEach(item => {
        progressMap.set(item.content_id, item.watch_progress || 0);
      });
      setContentProgress(progressMap);

      // Calculate overall course progress based on sum of all partial progress
      if (enrollId && courseContents.length > 0) {
        const totalProgress = validItems.reduce((sum, item) => sum + (item.watch_progress || 0), 0);
        const overallPercent = Math.round(totalProgress / courseContents.length);
        await supabase.from("enrolled_courses").update({
          progress: Math.min(overallPercent, 100)
        }).eq("id", enrollId);
      }
    }
  };
  const fetchCourseData = async (courseId: string, canViewAllContent: boolean = false): Promise<CourseContent[]> => {
    setLoading(true);
    const {
      data: courseData
    } = await supabase.from("courses").select("id, title, description, image_url, instructor, duration").eq("id", courseId).maybeSingle();
    if (courseData) {
      setCourse(courseData);
    }
    const {
      data: modulesData
    } = await supabase.from("course_modules").select("*").eq("course_id", courseId).order("order_index", { ascending: true }).order("created_at", { ascending: true });
    if (modulesData) {
      setModules(modulesData);
      if (modulesData.length > 0) {
        setExpandedModules(new Set([modulesData[0].id]));
      }
    }
    
    // Instructors and admins can see all content (including unpublished), students only see published
    let contentQuery = supabase
      .from("course_content")
      .select("id, module_id, title, description, content_type, content_url, order_index")
      .eq("course_id", courseId)
      .order("order_index");
    
    if (!canViewAllContent) {
      contentQuery = contentQuery.eq("is_published", true);
    }
    
    const { data: contentsData } = await contentQuery;
    
    if (contentsData) {
      setContents(contentsData);
      if (contentsData.length > 0) {
        setSelectedContent(contentsData[0]);
      }
    }
    setLoading(false);
    return contentsData || [];
  };
  const markAsCompleted = async (contentId: string) => {
    if (!user || completedItems.has(contentId)) return;
    await updateContentProgress(contentId, 100);
  };
  const updateContentProgress = async (contentId: string, progress: number) => {
    if (!user) return;
    const isComplete = progress >= 100;
    const currentProgress = contentProgress.get(contentId) || 0;

    // Only update if progress increased
    if (progress <= currentProgress) return;
    const {
      error
    } = await supabase.from("content_progress").upsert({
      user_id: user.id,
      content_id: contentId,
      watch_progress: Math.min(progress, 100),
      completed_at: isComplete ? new Date().toISOString() : null
    }, {
      onConflict: 'user_id,content_id'
    });
    if (!error) {
      // Update local state
      const newProgressMap = new Map(contentProgress);
      newProgressMap.set(contentId, progress);
      setContentProgress(newProgressMap);
      if (isComplete) {
        const newCompleted = new Set([...completedItems, contentId]);
        setCompletedItems(newCompleted);
      }

      // Update overall enrollment progress
      if (enrollmentId && contents.length > 0) {
        const totalProgress = Array.from(newProgressMap.values()).reduce((sum, p) => sum + p, 0);
        const overallPercent = Math.round(totalProgress / contents.length);
        await supabase.from("enrolled_courses").update({
          progress: Math.min(overallPercent, 100)
        }).eq("id", enrollmentId);
      }
      if (isComplete) {
        toast({
          title: "Progress saved",
          description: "This item has been marked as completed."
        });
      }
    }
  };

  // Save video progress periodically (every 5% change)
  const saveVideoProgress = async (currentProgress: number) => {
    if (!selectedContent || selectedContent.content_type !== "video") return;
    const progressPercent = Math.round(currentProgress);

    // Save every 5% progress or at completion
    if (progressPercent - lastSavedProgress.current >= 5 || progressPercent >= 95) {
      lastSavedProgress.current = progressPercent;
      await updateContentProgress(selectedContent.id, progressPercent >= 95 ? 100 : progressPercent);
    }
  };
  const getContentIcon = (type: string, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    switch (type) {
      case "video":
        return <Video className="w-5 h-5 text-muted-foreground" />;
      case "link":
        return <LinkIcon className="w-5 h-5 text-muted-foreground" />;
      case "knowledge_check":
        return <ClipboardCheck className="w-5 h-5 text-muted-foreground" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
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
  const handleSelectContent = async (content: CourseContent) => {
    setSelectedContent(content);
    setIsPlaying(false);
    setVideoProgress(0);
    lastSavedProgress.current = contentProgress.get(content.id) || 0;

    // Load quiz questions if knowledge check
    if (content.content_type === "knowledge_check") {
      const {
        data: questions
      } = await supabase.from("knowledge_check_questions").select("*").eq("content_id", content.id).order("order_index");
      setQuizQuestions(questions || []);

      // Load previous attempt
      if (user) {
        const {
          data: attempt
        } = await supabase.from("knowledge_check_attempts").select("score, total_questions").eq("user_id", user.id).eq("content_id", content.id).order("created_at", {
          ascending: false
        }).limit(1).maybeSingle();
        setPreviousAttempt(attempt);
      }
    } else {
      setQuizQuestions([]);
      setPreviousAttempt(null);
    }
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
      const progress = videoRef.current.currentTime / videoRef.current.duration * 100;
      setVideoProgress(progress);
      saveVideoProgress(progress);
    }
  };
  const handleVideoSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = Number(e.target.value) / 100 * videoRef.current.duration;
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
    if (!selectedContent) {
      return <div className="flex items-center justify-center aspect-video bg-muted rounded-lg">
          <div className="text-center text-muted-foreground px-4">
            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2" />
            <p className="text-sm sm:text-base">Select a lesson to start learning</p>
          </div>
        </div>;
    }
    const isCompleted = completedItems.has(selectedContent.id);
    const savedProgress = contentProgress.get(selectedContent.id) || 0;

    // Knowledge Check / Quiz
    if (selectedContent.content_type === "knowledge_check") {
      const PASSING_SCORE = 80;
      const handleQuizComplete = async (score: number, total: number, passed: boolean) => {
        if (!user) return;

        // Save attempt
        await supabase.from("knowledge_check_attempts").insert({
          user_id: user.id,
          content_id: selectedContent.id,
          score,
          total_questions: total,
          answers: {}
        });

        // Only mark as completed if passed
        if (passed) {
          await updateContentProgress(selectedContent.id, 100);
          setPassedQuizzes(prev => new Set([...prev, selectedContent.id]));
        }
        setPreviousAttempt({
          score,
          total_questions: total
        });
      };
      const allContentsForNav = getAllContents();
      const currentIdx = allContentsForNav.findIndex(c => c.id === selectedContent.id);
      const hasNextItem = currentIdx < allContentsForNav.length - 1;
      const hasPassed = passedQuizzes.has(selectedContent.id) || completedItems.has(selectedContent.id);
      const hasPreviousItem = currentIdx > 0;
      const goToPrevious = () => {
        if (hasPreviousItem) {
          handleSelectContent(allContentsForNav[currentIdx - 1]);
        }
      };
      return <KnowledgeCheckPlayer questions={quizQuestions} contentTitle={selectedContent.title} contentId={selectedContent.id} onComplete={handleQuizComplete} onProceed={hasNextItem && hasPassed ? goToNextItem : undefined} onGoBack={hasPreviousItem ? goToPrevious : undefined} previousAttempt={previousAttempt} passingScore={PASSING_SCORE} />;
    }
    if (!selectedContent.content_url) {
      return <div className="flex items-center justify-center aspect-video bg-muted rounded-lg">
          <div className="text-center text-muted-foreground px-4">
            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2" />
            <p className="text-sm sm:text-base">No content available</p>
          </div>
        </div>;
    }
    const url = selectedContent.content_url;
    // YouTube Video - tracks progress over time
    if (selectedContent.content_type === "video" && isYouTubeUrl(url)) {
      const videoId = getYouTubeVideoId(url);
      if (videoId) {
        return <YouTubeProgressTracker videoId={videoId} title={selectedContent.title} contentId={selectedContent.id} savedProgress={savedProgress} isCompleted={isCompleted} onProgressUpdate={updateContentProgress} />;
      }
    }

    // Native Video with custom controls - auto-marks as completed when video ends
    if (selectedContent.content_type === "video") {
      return <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black group">
          <video ref={videoRef} src={url} className="w-full h-full" onTimeUpdate={handleVideoProgress} onLoadedMetadata={() => {
          if (videoRef.current) {
            setVideoDuration(videoRef.current.duration);
            // Resume from saved progress
            if (savedProgress > 0 && savedProgress < 100) {
              videoRef.current.currentTime = savedProgress / 100 * videoRef.current.duration;
            }
          }
        }} onEnded={() => {
          setIsPlaying(false);
          if (!isCompleted) {
            markAsCompleted(selectedContent.id);
          }
        }} />
          {/* Custom Video Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {/* Progress Bar */}
            <input type="range" min="0" max="100" value={videoProgress} onChange={handleVideoSeek} className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer mb-2 sm:mb-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="icon" onClick={() => skipVideo(-10)} className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10">
                  <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10">
                  {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => skipVideo(10)} className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10">
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10">
                  {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                </Button>
                <span className="text-white text-xs sm:text-sm ml-1 sm:ml-2 hidden xs:inline">
                  {videoRef.current ? formatTime(videoRef.current.currentTime) : '0:00'} / {formatTime(videoDuration)}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20 h-8 w-8 sm:h-10 sm:w-10">
                <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </div>;
    }

    // Document/PDF Viewer - Coursera Style (using Google Docs Viewer for compatibility)
    if (selectedContent.content_type === "document" || isPdfUrl(url)) {
      // Use Google Docs viewer for better browser compatibility
      const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      return <div className="space-y-3 sm:space-y-4">
          {/* Document Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 bg-muted p-2 sm:p-3 rounded-lg border">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base truncate">{selectedContent.title}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm px-2 sm:px-3">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Open</span>
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm px-2 sm:px-3">
                <a href={url} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Download</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Document Viewer using Google Docs */}
          <div className="w-full border rounded-lg overflow-hidden bg-white h-[350px] sm:h-[450px] md:h-[550px] lg:h-[650px]">
            <iframe src={googleDocsViewerUrl} title={selectedContent.title} className="w-full h-full" frameBorder="0" />
          </div>

          {/* Mark as Completed Button */}
          {!isCompleted && <Button onClick={() => markAsCompleted(selectedContent.id)} className="w-full text-sm sm:text-base">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark as Completed
            </Button>}
        </div>;
    }

    // Link type
    return <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-center h-[200px] sm:h-[250px] md:h-[300px] bg-muted rounded-lg">
          <div className="text-center px-4">
            <LinkIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-primary" />
            <h3 className="font-semibold mb-2 text-sm sm:text-base">{selectedContent.title}</h3>
            <p className="text-muted-foreground mb-4 text-xs sm:text-sm">{selectedContent.description}</p>
            <Button asChild size="sm" className="sm:text-base">
              <a href={url} target="_blank" rel="noopener noreferrer">
                Open Resource <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
        {!isCompleted && <Button onClick={() => markAsCompleted(selectedContent.id)} className="w-full text-sm sm:text-base">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark as Completed
          </Button>}
      </div>;
  };
  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  if (!course) {
    return <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-heading font-bold text-xl mb-2">Course Not Found</h3>
          <Button asChild>
            <Link to="/dashboard/learning">Back to My Learning</Link>
          </Button>
        </div>
      </div>;
  }
  if (!isEnrolled && userRole !== "admin") {
    return <div className="flex items-center justify-center h-screen bg-background">
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
      </div>;
  }
  const allContents = getAllContents();
  const completedCount = completedItems.size;
  const totalCount = allContents.length;
  const currentIndex = allContents.findIndex(c => c.id === selectedContent?.id);
  const hasNext = currentIndex < allContents.length - 1;
  const hasPrevious = currentIndex > 0;

  // Check if current content is a knowledge check that needs passing
  const isCurrentQuizBlocking = selectedContent?.content_type === "knowledge_check" && !passedQuizzes.has(selectedContent.id) && !completedItems.has(selectedContent.id);
  const canProceedToNext = hasNext && !isCurrentQuizBlocking;
  const goToPreviousItem = () => {
    if (hasPrevious) {
      handleSelectContent(allContents[currentIndex - 1]);
    }
  };

  // Sidebar content component for reuse
  const SidebarContent = ({
    onItemSelect
  }: {
    onItemSelect?: () => void;
  }) => <>
      <div className="p-3 sm:p-4 border-b">
        <Link to="/dashboard/learning" className="text-primary hover:underline font-semibold text-base sm:text-lg line-clamp-2">
          {course.title}
        </Link>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {modules.map((module, moduleIndex) => {
          const moduleContents = getModuleContents(module.id);
          const isExpanded = expandedModules.has(module.id);
          return <div key={module.id} className="mb-1">
                <button onClick={() => toggleModule(module.id)} className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-accent rounded-lg text-left">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-muted-foreground">Module {moduleIndex + 1}</span>
                    <p className="font-medium text-xs sm:text-sm truncate">{module.title}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />}
                </button>
                
                {isExpanded && <div className="ml-2 border-l-2 border-muted">
                    {moduleContents.map(content => {
                const isSelected = selectedContent?.id === content.id;
                const isCompleted = completedItems.has(content.id);
                return <button key={content.id} onClick={() => {
                  handleSelectContent(content);
                  onItemSelect?.();
                }} className={`w-full flex items-start gap-2 sm:gap-3 p-2 sm:p-3 text-left hover:bg-accent rounded-r-lg transition-colors ${isSelected ? 'bg-accent border-l-2 border-primary -ml-[2px]' : ''}`}>
                          {getContentIcon(content.content_type, isCompleted)}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs sm:text-sm ${isSelected ? 'font-semibold' : ''} line-clamp-2`}>
                              {content.title}
                            </p>
                            
                          </div>
                        </button>;
              })}
                  </div>}
              </div>;
        })}

          {/* Unassigned Content */}
          {getUnassignedContents().length > 0 && <div className="mt-2">
              {getUnassignedContents().map(content => {
            const isSelected = selectedContent?.id === content.id;
            const isCompleted = completedItems.has(content.id);
            return <button key={content.id} onClick={() => {
              handleSelectContent(content);
              onItemSelect?.();
            }} className={`w-full flex items-start gap-2 sm:gap-3 p-2 sm:p-3 text-left hover:bg-accent rounded-lg transition-colors ${isSelected ? 'bg-accent' : ''}`}>
                    {getContentIcon(content.content_type, isCompleted)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs sm:text-sm ${isSelected ? 'font-semibold' : ''} line-clamp-2`}>
                        {content.title}
                      </p>
                      <span className="text-xs text-muted-foreground capitalize">
                        {content.content_type}
                      </span>
                    </div>
                  </button>;
          })}
            </div>}

          {allContents.length === 0 && <div className="p-4 text-center text-muted-foreground text-sm">
              No content available yet.
            </div>}
        </div>
      </ScrollArea>
    </>;
  return <div className="h-screen flex flex-col bg-background">
      {/* Top Progress Bar */}
      <div className="border-b bg-card px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          {/* Mobile Menu Button */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden flex-shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 flex flex-col">
              <SidebarContent onItemSelect={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
          
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            {completedCount}/{totalCount} items
          </span>
          <Progress value={completedCount / Math.max(totalCount, 1) * 100} className="w-20 sm:w-32 md:w-48 h-2" />
        </div>
        <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
          <Link to="/dashboard/learning">
            <X className="w-5 h-5" />
          </Link>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Desktop */}
        <div className="hidden md:flex w-72 lg:w-80 border-r bg-card flex-col">
          <SidebarContent />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 overflow-auto">
            <div className="max-w-3xl mx-auto w-full">
              {/* Content Title */}
              {selectedContent && <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">{selectedContent.title}</h1>}
              
              {/* Video/Content Player - professional 16:9 aspect ratio */}
              <div className="w-full">
                {renderContentPlayer()}
              </div>
              
              {/* Content Description */}
              {selectedContent?.description && <p className="text-muted-foreground mt-3 sm:mt-4 text-sm sm:text-base">{selectedContent.description}</p>}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="border-t bg-card p-2 sm:p-4 flex justify-between">
            <Button onClick={goToPreviousItem} disabled={!hasPrevious} variant="outline" className="gap-2 text-sm sm:text-base" size="sm">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden xs:inline">Previous</span>
            </Button>
            <Button onClick={goToNextItem} disabled={!canProceedToNext} className="gap-2 text-sm sm:text-base" size="sm" title={isCurrentQuizBlocking ? "Pass the quiz to proceed (80% required)" : undefined}>
              <span className="hidden xs:inline">Next</span> <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
export default CourseViewer;