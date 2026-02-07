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
import { Megaphone, Send, Pin, MessageCircle, ChevronDown, ChevronUp, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Course {
  id: string;
  title: string;
  instructor_id: string | null;
}

interface Announcement {
  id: string;
  course_id: string;
  instructor_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  course?: { title: string };
  instructor?: { full_name: string };
  replies_count?: number;
}

interface Reply {
  id: string;
  announcement_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: { full_name: string };
}

const CourseAnnouncements = () => {
  const [searchParams] = useSearchParams();
  const selectedCourseId = searchParams.get("course");
  
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>(selectedCourseId || "all");
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);
  const [replies, setReplies] = useState<Map<string, Reply[]>>(new Map());
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  
  // Create announcement dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCourseId, setNewCourseId] = useState("");
  const [isPinned, setIsPinned] = useState(false);
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
      fetchAnnouncements();
    }
  }, [user, selectedCourse, courses]);

  const fetchCourses = async (userId: string, role: string) => {
    let query = supabase.from("courses").select("id, title, instructor_id");

    if (role === "instructor") {
      query = query.eq("instructor_id", userId);
    } else if (role === "student") {
      const { data: enrollments } = await supabase
        .from("enrolled_courses")
        .select("course_id")
        .eq("user_id", userId);
      
      const courseIds = enrollments?.map(e => e.course_id).filter(Boolean) || [];
      if (courseIds.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }
      query = query.in("id", courseIds);
    }

    const { data } = await query;
    setCourses(data || []);
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    
    let query = supabase
      .from("course_announcements")
      .select(`
        *,
        course:courses(title)
      `)
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
      console.error("Error fetching announcements:", error);
      setAnnouncements([]);
    } else {
      // Fetch instructor names
      const instructorIds = [...new Set((data || []).map(a => a.instructor_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", instructorIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      
      // Fetch reply counts
      const announcementIds = (data || []).map(a => a.id);
      const replyCounts = new Map<string, number>();
      
      if (announcementIds.length > 0) {
        const { data: replyData } = await supabase
          .from("announcement_replies")
          .select("announcement_id")
          .in("announcement_id", announcementIds);
        
        replyData?.forEach(r => {
          replyCounts.set(r.announcement_id, (replyCounts.get(r.announcement_id) || 0) + 1);
        });
      }

      setAnnouncements((data || []).map(a => ({
        ...a,
        instructor: { full_name: profileMap.get(a.instructor_id) || "Instructor" },
        replies_count: replyCounts.get(a.id) || 0
      })));
    }
    
    setLoading(false);
  };

  const fetchReplies = async (announcementId: string) => {
    const { data } = await supabase
      .from("announcement_replies")
      .select("*")
      .eq("announcement_id", announcementId)
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
      
      setReplies(prev => new Map(prev).set(announcementId, repliesWithUsers));
    }
  };

  const toggleExpand = async (announcementId: string) => {
    if (expandedAnnouncement === announcementId) {
      setExpandedAnnouncement(null);
    } else {
      setExpandedAnnouncement(announcementId);
      if (!replies.has(announcementId)) {
        await fetchReplies(announcementId);
      }
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!user || !newTitle.trim() || !newContent.trim() || !newCourseId) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setCreating(true);
    const { error } = await supabase.from("course_announcements").insert({
      course_id: newCourseId,
      instructor_id: user.id,
      title: newTitle.trim(),
      content: newContent.trim(),
      is_pinned: isPinned
    });

    if (error) {
      toast({ title: "Error", description: "Failed to create announcement", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Announcement created!" });
      setCreateDialogOpen(false);
      setNewTitle("");
      setNewContent("");
      setNewCourseId("");
      setIsPinned(false);
      fetchAnnouncements();
    }
    setCreating(false);
  };

  const handleSendReply = async (announcementId: string) => {
    if (!user || !replyText.trim()) return;

    setSendingReply(true);
    const { error } = await supabase.from("announcement_replies").insert({
      announcement_id: announcementId,
      user_id: user.id,
      content: replyText.trim()
    });

    if (error) {
      toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
    } else {
      setReplyText("");
      await fetchReplies(announcementId);
      // Update reply count
      setAnnouncements(prev => prev.map(a => 
        a.id === announcementId 
          ? { ...a, replies_count: (a.replies_count || 0) + 1 }
          : a
      ));
    }
    setSendingReply(false);
  };

  const canCreateAnnouncement = userRole === "admin" || userRole === "instructor";

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-bold flex items-center gap-2">
              <Megaphone className="w-8 h-8 text-primary" />
              Announcements
            </h2>
            <p className="text-muted-foreground mt-1">
              {canCreateAnnouncement 
                ? "Broadcast important updates to your students"
                : "Stay updated with course announcements"}
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

            {canCreateAnnouncement && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Announcement</DialogTitle>
                    <DialogDescription>
                      Send an announcement to all students in a course
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
                        placeholder="Announcement title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Write your announcement..."
                        rows={5}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="pinned"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="pinned" className="cursor-pointer">Pin this announcement</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAnnouncement} disabled={creating}>
                      {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Publish
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-2">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading font-bold text-xl mb-2">No Announcements</h3>
              <p className="text-muted-foreground">
                {canCreateAnnouncement 
                  ? "Create your first announcement to notify students."
                  : "No announcements have been posted yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className={announcement.is_pinned ? "border-primary/50 bg-primary/5" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {announcement.is_pinned && (
                          <Badge variant="secondary" className="text-xs">
                            <Pin className="w-3 h-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                        <Badge variant="outline">{announcement.course?.title}</Badge>
                      </div>
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <CardDescription className="mt-1">
                        By {announcement.instructor?.full_name} • {format(new Date(announcement.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{announcement.content}</p>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(announcement.id)}
                    className="mt-4 text-muted-foreground"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {announcement.replies_count || 0} Replies
                    {expandedAnnouncement === announcement.id ? (
                      <ChevronUp className="w-4 h-4 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-2" />
                    )}
                  </Button>

                  {expandedAnnouncement === announcement.id && (
                    <div className="mt-4 border-t pt-4 space-y-4">
                      {/* Replies */}
                      <div className="space-y-3">
                        {(replies.get(announcement.id) || []).map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">
                                {reply.user?.full_name?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{reply.user?.full_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(reply.created_at), "MMM d 'at' h:mm a")}
                                </span>
                              </div>
                              <p className="text-sm">{reply.content}</p>
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
                              handleSendReply(announcement.id);
                            }
                          }}
                        />
                        <Button 
                          size="icon" 
                          onClick={() => handleSendReply(announcement.id)}
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

export default CourseAnnouncements;
