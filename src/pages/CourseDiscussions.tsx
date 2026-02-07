import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, CheckCircle, Pin, ThumbsUp, Eye, Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Course {
  id: string;
  title: string;
  instructor_id: string | null;
}

interface Thread {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  content: string;
  is_resolved: boolean;
  is_pinned: boolean;
  views_count: number;
  created_at: string;
  course?: { title: string };
  user?: { full_name: string };
  replies_count?: number;
}

interface ThreadReply {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  is_answer: boolean;
  upvotes: number;
  created_at: string;
  user?: { full_name: string };
}

const CourseDiscussions = () => {
  const [searchParams] = useSearchParams();
  const selectedCourseId = searchParams.get("course");

  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [courses, setCourses] = useState<Course[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>(selectedCourseId || "all");
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const [replies, setReplies] = useState<Map<string, ThreadReply[]>>(new Map());
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Create thread dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCourseId, setNewCourseId] = useState("");
  const [creating, setCreating] = useState(false);

  const { toast } = useToast();
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

      const role = roleData?.role || "student";
      setUserRole(role);

      await fetchCourses(session.user.id, role);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (user && courses.length > 0) {
      fetchThreads();
    }
  }, [user, selectedCourse, courses]);

  const fetchCourses = async (userId: string, role: string) => {
    let courseIds: string[] = [];

    if (role === "admin") {
      const { data } = await supabase.from("courses").select("id, title, instructor_id");
      setCourses(data || []);
      return;
    }

    if (role === "instructor") {
      const { data } = await supabase
        .from("courses")
        .select("id, title, instructor_id")
        .eq("instructor_id", userId);
      setCourses(data || []);
      return;
    }

    // Student: get enrolled courses
    const { data: enrollments } = await supabase
      .from("enrolled_courses")
      .select("course_id")
      .eq("user_id", userId);

    courseIds = enrollments?.map(e => e.course_id).filter(Boolean) as string[] || [];
    
    if (courseIds.length === 0) {
      setCourses([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("courses")
      .select("id, title, instructor_id")
      .in("id", courseIds);
    
    setCourses(data || []);
  };

  const fetchThreads = async () => {
    setLoading(true);

    let query = supabase
      .from("discussion_threads")
      .select(`*, course:courses(title)`)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (selectedCourse !== "all") {
      query = query.eq("course_id", selectedCourse);
    } else {
      const courseIds = courses.map(c => c.id);
      if (courseIds.length > 0) {
        query = query.in("course_id", courseIds);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching threads:", error);
      setThreads([]);
    } else {
      // Fetch user names
      const userIds = [...new Set((data || []).map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      // Fetch reply counts
      const threadIds = (data || []).map(t => t.id);
      const replyCounts = new Map<string, number>();

      if (threadIds.length > 0) {
        const { data: replyData } = await supabase
          .from("discussion_replies")
          .select("thread_id")
          .in("thread_id", threadIds);

        replyData?.forEach(r => {
          replyCounts.set(r.thread_id, (replyCounts.get(r.thread_id) || 0) + 1);
        });
      }

      setThreads((data || []).map(t => ({
        ...t,
        user: { full_name: profileMap.get(t.user_id) || "User" },
        replies_count: replyCounts.get(t.id) || 0
      })));
    }

    setLoading(false);
  };

  const fetchReplies = async (threadId: string) => {
    const { data } = await supabase
      .from("discussion_replies")
      .select("*")
      .eq("thread_id", threadId)
      .order("is_answer", { ascending: false })
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: true });

    if (data) {
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      const repliesWithUsers = data.map(r => ({
        ...r,
        user: { full_name: profileMap.get(r.user_id) || "User" }
      }));

      setReplies(prev => new Map(prev).set(threadId, repliesWithUsers));
    }

    // Increment view count - use raw SQL update
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      await supabase
        .from("discussion_threads")
        .update({ views_count: (thread.views_count || 0) + 1 })
        .eq("id", threadId);
    }
  };

  const toggleExpand = async (threadId: string) => {
    if (expandedThread === threadId) {
      setExpandedThread(null);
    } else {
      setExpandedThread(threadId);
      if (!replies.has(threadId)) {
        await fetchReplies(threadId);
      }
    }
  };

  const handleCreateThread = async () => {
    if (!user || !newTitle.trim() || !newContent.trim() || !newCourseId) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setCreating(true);
    const { error } = await supabase.from("discussion_threads").insert({
      course_id: newCourseId,
      user_id: user.id,
      title: newTitle.trim(),
      content: newContent.trim()
    });

    if (error) {
      toast({ title: "Error", description: "Failed to create discussion", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Discussion created!" });
      setCreateDialogOpen(false);
      setNewTitle("");
      setNewContent("");
      setNewCourseId("");
      fetchThreads();
    }
    setCreating(false);
  };

  const handleSendReply = async (threadId: string) => {
    if (!user || !replyText.trim()) return;

    setSendingReply(true);
    const { error } = await supabase.from("discussion_replies").insert({
      thread_id: threadId,
      user_id: user.id,
      content: replyText.trim()
    });

    if (error) {
      toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
    } else {
      setReplyText("");
      await fetchReplies(threadId);
      setThreads(prev => prev.map(t =>
        t.id === threadId
          ? { ...t, replies_count: (t.replies_count || 0) + 1 }
          : t
      ));
    }
    setSendingReply(false);
  };

  const markAsAnswer = async (replyId: string, threadId: string) => {
    const { error } = await supabase
      .from("discussion_replies")
      .update({ is_answer: true })
      .eq("id", replyId);

    if (!error) {
      await supabase
        .from("discussion_threads")
        .update({ is_resolved: true })
        .eq("id", threadId);

      await fetchReplies(threadId);
      setThreads(prev => prev.map(t =>
        t.id === threadId ? { ...t, is_resolved: true } : t
      ));
      toast({ title: "Marked as answer!" });
    }
  };

  const canMarkAnswer = (thread: Thread) => {
    return userRole === "admin" || 
           userRole === "instructor" || 
           thread.user_id === user?.id;
  };

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-primary" />
              Discussions
            </h2>
            <p className="text-muted-foreground mt-1">
              Ask questions and engage with your course community
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Discussion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Start a Discussion</DialogTitle>
                  <DialogDescription>
                    Ask a question or start a conversation with your classmates
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select value={newCourseId} onValueChange={setNewCourseId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="What's your question?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Details</Label>
                    <Textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Provide more details about your question..."
                      rows={5}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateThread} disabled={creating}>
                    {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Post
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-2">Loading discussions...</p>
          </div>
        ) : threads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading font-bold text-xl mb-2">No Discussions Yet</h3>
              <p className="text-muted-foreground">Be the first to start a discussion!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <Card key={thread.id} className={thread.is_pinned ? "border-primary/50 bg-primary/5" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {thread.is_pinned && (
                          <Badge variant="secondary" className="text-xs">
                            <Pin className="w-3 h-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                        {thread.is_resolved && (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                        <Badge variant="outline">{thread.course?.title}</Badge>
                      </div>
                      <CardTitle className="text-lg">{thread.title}</CardTitle>
                      <CardDescription className="mt-1">
                        By {thread.user?.full_name} • {format(new Date(thread.created_at), "MMM d, yyyy")}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {thread.views_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {thread.replies_count || 0}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{thread.content}</p>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(thread.id)}
                    className="mt-4 text-muted-foreground"
                  >
                    {thread.replies_count || 0} Replies
                    {expandedThread === thread.id ? (
                      <ChevronUp className="w-4 h-4 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-2" />
                    )}
                  </Button>

                  {expandedThread === thread.id && (
                    <div className="mt-4 border-t pt-4 space-y-4">
                      {/* Replies */}
                      <div className="space-y-3">
                        {(replies.get(thread.id) || []).map((reply) => (
                          <div key={reply.id} className={`flex gap-3 ${reply.is_answer ? "bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800" : ""}`}>
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">
                                {reply.user?.full_name?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{reply.user?.full_name}</span>
                                {reply.is_answer && (
                                  <Badge className="bg-green-500 text-white text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Answer
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(reply.created_at), "MMM d 'at' h:mm a")}
                                </span>
                              </div>
                              <p className="text-sm">{reply.content}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <Button variant="ghost" size="sm" className="h-7 text-xs">
                                  <ThumbsUp className="w-3 h-3 mr-1" />
                                  {reply.upvotes}
                                </Button>
                                {!reply.is_answer && !thread.is_resolved && canMarkAnswer(thread) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-green-600"
                                    onClick={() => markAsAnswer(reply.id, thread.id)}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Mark as Answer
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reply input */}
                      <div className="flex gap-2">
                        <Input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendReply(thread.id);
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          onClick={() => handleSendReply(thread.id)}
                          disabled={sendingReply || !replyText.trim()}
                        >
                          {sendingReply ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CourseDiscussions;
