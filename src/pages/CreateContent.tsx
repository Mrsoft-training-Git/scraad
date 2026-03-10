import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Video, Link as LinkIcon, Trash2, Edit, Eye, EyeOff, Play, FolderPlus, ClipboardCheck, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContentPreview } from "@/components/ContentPreview";
import { KnowledgeCheckBuilder, QuizQuestion } from "@/components/KnowledgeCheckBuilder";

interface Course {
  id: string;
  title: string;
  syllabus: any;
}

interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
}

interface CourseContent {
  id: string;
  course_id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  file_path: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  courses?: { title: string };
  course_modules?: { title: string } | null;
}

const CreateContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [contents, setContents] = useState<CourseContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<CourseContent | null>(null);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string>("document");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [previewContent, setPreviewContent] = useState<CourseContent | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    course_id: "",
    module_id: "",
    title: "",
    description: "",
    content_type: "document",
    content_url: "",
    is_published: false,
    place_after_content_id: "", // For positioning knowledge checks
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  
  const [newModule, setNewModule] = useState({
    course_id: "",
    title: "",
    description: "",
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
      
      const role = roleData?.role || "student";
      setUserRole(role);
      
      if (role === "admin" || role === "instructor") {
        fetchCourses(session.user.id, role);
        fetchModulesData(session.user.id, role);
        fetchContentsData(session.user.id, role);
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const fetchCourses = async (userId: string, role: string) => {
    let query = supabase.from("courses").select("id, title, syllabus").order("title");
    
    // Instructors only see their assigned courses
    if (role === "instructor") {
      query = query.eq("instructor_id", userId);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      setCourses(data);
    }
  };

  const fetchModulesData = async (userId: string, role: string) => {
    if (role === "instructor") {
      // For instructors, only fetch modules for their courses
      const { data: instructorCourses } = await supabase
        .from("courses")
        .select("id")
        .eq("instructor_id", userId);
      
      const courseIds = instructorCourses?.map(c => c.id) || [];
      
      if (courseIds.length > 0) {
        const { data, error } = await supabase
          .from("course_modules")
          .select("*")
          .in("course_id", courseIds)
          .order("order_index", { ascending: true })
          .order("created_at", { ascending: true });
        
        if (!error && data) {
          setModules(data);
        }
      }
    } else {
      const { data, error } = await supabase
        .from("course_modules")
        .select("*")
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: true });
      
      if (!error && data) {
        setModules(data);
      }
    }
  };

  const fetchContentsData = async (userId: string, role: string) => {
    if (role === "instructor") {
      // For instructors, only fetch content for their courses
      const { data: instructorCourses } = await supabase
        .from("courses")
        .select("id")
        .eq("instructor_id", userId);
      
      const courseIds = instructorCourses?.map(c => c.id) || [];
      
      if (courseIds.length > 0) {
        const { data, error } = await supabase
          .from("course_content")
          .select("*, courses(title), course_modules(title)")
          .in("course_id", courseIds)
          .order("created_at", { ascending: false });
        
        if (!error && data) {
          setContents(data as CourseContent[]);
        }
      }
    } else {
      const { data, error } = await supabase
        .from("course_content")
        .select("*, courses(title), course_modules(title)")
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setContents(data as CourseContent[]);
      }
    }
  };

  // Wrapper functions that use current state
  const refreshModules = () => {
    if (user?.id) fetchModulesData(user.id, userRole);
  };

  const refreshContents = () => {
    if (user?.id) fetchContentsData(user.id, userRole);
  };

  const handleContentTypeSelect = (type: string) => {
    setSelectedContentType(type);
    setEditingContent(null);
    setFormData({
      course_id: "",
      module_id: "",
      title: "",
      description: "",
      content_type: type,
      content_url: "",
      is_published: false,
      place_after_content_id: "",
    });
    setFile(null);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      course_id: "",
      module_id: "",
      title: "",
      description: "",
      content_type: "document",
      content_url: "",
      is_published: false,
      place_after_content_id: "",
    });
    setFile(null);
    setQuizQuestions([]);
  };

  const handleEdit = async (content: CourseContent) => {
    setEditingContent(content);
    setFormData({
      course_id: content.course_id,
      module_id: content.module_id || "",
      title: content.title,
      description: content.description || "",
      content_type: content.content_type,
      content_url: content.content_url || "",
      is_published: content.is_published,
      place_after_content_id: "",
    });
    setSelectedContentType(content.content_type);
    
    // Load quiz questions if editing a knowledge check
    if (content.content_type === "knowledge_check") {
      const { data: questions } = await supabase
        .from("knowledge_check_questions")
        .select("*")
        .eq("content_id", content.id)
        .order("order_index");
      
      if (questions) {
        setQuizQuestions(questions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options as string[],
          correct_answer: q.correct_answer,
          explanation: q.explanation || "",
          order_index: q.order_index,
        })));
      }
    } else {
      setQuizQuestions([]);
    }
    
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, filePath: string | null) => {
    if (!confirm("Are you sure you want to delete this content?")) return;
    
    if (filePath) {
      await supabase.storage.from("course-content").remove([filePath]);
    }
    
    const { error } = await supabase.from("course_content").delete().eq("id", id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to delete content", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Content deleted successfully" });
      refreshContents();
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("course_content")
      .update({ is_published: !currentStatus })
      .eq("id", id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } else {
      refreshContents();
    }
  };


  const handleSubmit = async () => {
    if (!formData.course_id || !formData.title) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }
    
    // Validate knowledge check has questions
    if (formData.content_type === "knowledge_check" && quizQuestions.length === 0) {
      toast({ title: "Error", description: "Please add at least one question", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    let filePath: string | null = null;
    let fileUrl: string | null = formData.content_url || null;
    
    if (file) {
      // Video files → upload to AWS S3 via pre-signed URL
      if (formData.content_type === "video") {
        const allowedTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/mpeg"];
        if (!allowedTypes.includes(file.type)) {
          toast({ title: "Invalid file", description: "Only mp4, mov, webm, avi, mpeg videos are allowed", variant: "destructive" });
          setSaving(false);
          return;
        }
        if (file.size > 2 * 1024 * 1024 * 1024) {
          toast({ title: "File too large", description: "Video must be under 2 GB", variant: "destructive" });
          setSaving(false);
          return;
        }

        try {
          setIsUploading(true);
          setUploadProgress(0);

          const { data: session } = await supabase.auth.getSession();
          const { data: uploadData, error: fnError } = await supabase.functions.invoke("s3-get-upload-url", {
            body: {
              courseId: formData.course_id,
              fileName: file.name,
              contentType: file.type,
              fileSize: file.size,
            },
          });

          if (fnError || !uploadData?.uploadUrl) {
            throw new Error(fnError?.message || "Failed to get upload URL");
          }

          // Upload directly to S3 with progress tracking using XMLHttpRequest
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.upload.addEventListener("progress", (e) => {
              if (e.lengthComputable) {
                setUploadProgress(Math.round((e.loaded / e.total) * 100));
              }
            });
            xhr.addEventListener("load", () => {
              if (xhr.status >= 200 && xhr.status < 300) resolve();
              else reject(new Error(`S3 upload failed: ${xhr.status} ${xhr.statusText}`));
            });
            xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
            xhr.open("PUT", uploadData.uploadUrl);
            xhr.setRequestHeader("Content-Type", file.type);
            xhr.send(file);
          });

          filePath = uploadData.s3Key;   // store S3 key in file_path
          fileUrl = uploadData.s3Url;    // store s3://bucket/key in content_url
          setIsUploading(false);
        } catch (err: any) {
          toast({ title: "Upload failed", description: err.message, variant: "destructive" });
          setSaving(false);
          setIsUploading(false);
          return;
        }
      } else {
        // Non-video files → continue using Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        filePath = `${formData.course_id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from("course-content")
          .upload(filePath, file);
        
        if (uploadError) {
          toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
          setSaving(false);
          return;
        }
        
        const { data: urlData } = supabase.storage.from("course-content").getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
      }
    }
    
    // Calculate order_index for knowledge checks based on placement
    let orderIndex = 0;
    if (formData.content_type === "knowledge_check" && formData.place_after_content_id) {
      const selectedContent = contents.find(c => c.id === formData.place_after_content_id);
      if (selectedContent) {
        orderIndex = (selectedContent.order_index || 0) + 1;
        // Shift all content after this position
        const contentsToShift = contents.filter(
          c => c.module_id === formData.module_id && 
               (c.order_index || 0) >= orderIndex && 
               c.id !== editingContent?.id
        );
        for (const content of contentsToShift) {
          await supabase
            .from("course_content")
            .update({ order_index: (content.order_index || 0) + 1 })
            .eq("id", content.id);
        }
      }
    }
    
    const contentData = {
      course_id: formData.course_id,
      module_id: formData.module_id || null,
      title: formData.title,
      description: formData.description || null,
      content_type: formData.content_type,
      content_url: fileUrl,
      file_path: filePath,
      is_published: formData.is_published,
      created_by: user?.id,
      order_index: orderIndex,
    };
    
    let error;
    let contentId: string | null = null;
    
    if (editingContent) {
      const { error: updateError } = await supabase
        .from("course_content")
        .update(contentData)
        .eq("id", editingContent.id);
      error = updateError;
      contentId = editingContent.id;
    } else {
      const { data: insertData, error: insertError } = await supabase
        .from("course_content")
        .insert(contentData)
        .select("id")
        .single();
      error = insertError;
      contentId = insertData?.id || null;
    }
    
    // Save quiz questions for knowledge check content
    if (!error && contentId && formData.content_type === "knowledge_check") {
      // Delete existing questions if editing
      if (editingContent) {
        await supabase.from("knowledge_check_questions").delete().eq("content_id", contentId);
      }
      
      // Insert new questions
      const questionsToInsert = quizQuestions.map((q, index) => ({
        content_id: contentId,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
        order_index: index,
      }));
      
      if (questionsToInsert.length > 0) {
        const { error: questionsError } = await supabase
          .from("knowledge_check_questions")
          .insert(questionsToInsert);
        
        if (questionsError) {
          toast({ title: "Warning", description: "Content saved but failed to save some questions", variant: "destructive" });
        }
      }
    }
    
    setSaving(false);
    
    if (error) {
      toast({ title: "Error", description: "Failed to save content", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Content ${editingContent ? "updated" : "created"} successfully` });
      setDialogOpen(false);
      resetForm();
      refreshContents();
    }
  };

  const handleCreateModule = async () => {
    if (!newModule.course_id || !newModule.title) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }

    let error;
    if (editingModule) {
      const { error: updateError } = await supabase
        .from("course_modules")
        .update({
          title: newModule.title,
          description: newModule.description || null,
        })
        .eq("id", editingModule.id);
      error = updateError;
    } else {
      // Calculate the next order_index for the new module
      const existingModules = modules.filter(m => m.course_id === newModule.course_id);
      const maxOrderIndex = existingModules.length > 0 
        ? Math.max(...existingModules.map(m => m.order_index || 0)) 
        : -1;
      const nextOrderIndex = maxOrderIndex + 1;

      const { error: insertError } = await supabase
        .from("course_modules")
        .insert({
          course_id: newModule.course_id,
          title: newModule.title,
          description: newModule.description || null,
          order_index: nextOrderIndex,
        });
      error = insertError;
    }

    if (error) {
      toast({ title: "Error", description: `Failed to ${editingModule ? "update" : "create"} module`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Module ${editingModule ? "updated" : "created"} successfully` });
      setModuleDialogOpen(false);
      setEditingModule(null);
      setNewModule({ course_id: "", title: "", description: "" });
      refreshModules();
    }
  };

  const handleEditModule = (module: CourseModule) => {
    setEditingModule(module);
    setNewModule({
      course_id: module.course_id,
      title: module.title,
      description: module.description || "",
    });
    setModuleDialogOpen(true);
  };

  const openCreateModuleDialog = () => {
    setEditingModule(null);
    setNewModule({ course_id: "", title: "", description: "" });
    setModuleDialogOpen(true);
  };

  const handleImportSyllabusModules = async (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course?.syllabus || !Array.isArray(course.syllabus) || course.syllabus.length === 0) return;

    setSaving(true);
    const existingModules = modules.filter(m => m.course_id === courseId);
    const startIndex = existingModules.length > 0 
      ? Math.max(...existingModules.map(m => m.order_index || 0)) + 1 
      : 0;

    const modulesToInsert = course.syllabus.map((mod: any, index: number) => ({
      course_id: courseId,
      title: mod.title || mod.name || `Module ${startIndex + index + 1}`,
      description: mod.description || null,
      order_index: startIndex + index,
    }));

    const { error } = await supabase.from("course_modules").insert(modulesToInsert);
    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to import modules from syllabus", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `${modulesToInsert.length} modules imported from course syllabus` });
      setModuleDialogOpen(false);
      refreshModules();
    }
  };

  const getCourseSyllabusModuleCount = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course?.syllabus || !Array.isArray(course.syllabus)) return 0;
    return course.syllabus.length;
  };

  const courseHasNoModulesYet = (courseId: string) => {
    return modules.filter(m => m.course_id === courseId).length === 0;
  };

  const handlePreview = (content: CourseContent) => {
    setPreviewContent(content);
    setPreviewOpen(true);
  };

  const filteredContents = filterCourse === "all" 
    ? contents 
    : contents.filter(c => c.course_id === filterCourse);

  const filteredModules = formData.course_id 
    ? modules.filter(m => m.course_id === formData.course_id)
    : [];

  // Get contents in the selected module for positioning knowledge checks
  const moduleContents = formData.module_id 
    ? contents
        .filter(c => c.module_id === formData.module_id && c.id !== editingContent?.id)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    : [];

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4" />;
      case "link": return <LinkIcon className="w-4 h-4" />;
      case "knowledge_check": return <ClipboardCheck className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
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

  if (userRole !== "admin" && userRole !== "instructor") {
    return (
      <DashboardLayout user={user} userRole={userRole}>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        {/* Content Type Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Create New Content</h2>
            <Button variant="outline" onClick={openCreateModuleDialog}>
              <FolderPlus className="w-4 h-4 mr-2" />
              Create Module
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleContentTypeSelect("document")}
            >
              <CardHeader className="text-center">
                <FileText className="w-10 h-10 text-primary mx-auto mb-2" />
                <CardTitle className="text-base">Document</CardTitle>
                <CardDescription className="text-sm">Upload PDFs, docs, or text content</CardDescription>
              </CardHeader>
            </Card>
            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleContentTypeSelect("video")}
            >
              <CardHeader className="text-center">
                <Video className="w-10 h-10 text-primary mx-auto mb-2" />
                <CardTitle className="text-base">Video</CardTitle>
                <CardDescription className="text-sm">Upload videos or add YouTube links</CardDescription>
              </CardHeader>
            </Card>
            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleContentTypeSelect("link")}
            >
              <CardHeader className="text-center">
                <LinkIcon className="w-10 h-10 text-primary mx-auto mb-2" />
                <CardTitle className="text-base">Resource Link</CardTitle>
                <CardDescription className="text-sm">Add external resources and links</CardDescription>
              </CardHeader>
            </Card>
            <Card 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleContentTypeSelect("knowledge_check")}
            >
              <CardHeader className="text-center">
                <ClipboardCheck className="w-10 h-10 text-primary mx-auto mb-2" />
                <CardTitle className="text-base">Knowledge Check</CardTitle>
                <CardDescription className="text-sm">Create quizzes to test understanding</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Content List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Course Content</CardTitle>
              <CardDescription>Manage all course materials</CardDescription>
            </div>
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {filteredContents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No content created yet. Click on a content type above to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContents.map(content => (
                    <TableRow key={content.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getContentTypeIcon(content.content_type)}
                          <span className="capitalize">{content.content_type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{content.title}</TableCell>
                      <TableCell>
                        {content.course_modules?.title ? (
                          <button 
                            className="text-left hover:text-primary hover:underline cursor-pointer"
                            onClick={() => {
                              const module = modules.find(m => m.id === content.module_id);
                              if (module) handleEditModule(module);
                            }}
                            title="Click to edit module"
                          >
                            {content.course_modules.title}
                          </button>
                        ) : (
                          <span className="text-muted-foreground">No module</span>
                        )}
                      </TableCell>
                      <TableCell>{content.courses?.title || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={content.is_published ? "default" : "secondary"}>
                          {content.is_published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(content)}
                            title="Preview"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePublish(content.id, content.is_published)}
                            title={content.is_published ? "Unpublish" : "Publish"}
                          >
                            {content.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(content)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => handleDelete(content.id, content.file_path)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Content Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContent ? "Edit" : "Create"} {selectedContentType.charAt(0).toUpperCase() + selectedContentType.slice(1)} Content
              </DialogTitle>
              <DialogDescription>
                Fill in the details below to {editingContent ? "update" : "add"} content to your course.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Course *</Label>
                <Select 
                  value={formData.course_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value, module_id: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Module</Label>
              <Select 
                  value={formData.module_id || "none"} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, module_id: value === "none" ? "" : value }))}
                  disabled={!formData.course_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.course_id ? "Select module (optional)" : "Select a course first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No module</SelectItem>
                    {filteredModules.map(module => (
                      <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              {formData.course_id && filteredModules.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No modules for this course.{" "}
                    <button 
                      className="text-primary hover:underline"
                      onClick={() => {
                        setNewModule(prev => ({ ...prev, course_id: formData.course_id }));
                        setModuleDialogOpen(true);
                      }}
                    >
                      Create one
                    </button>
                  </p>
                )}
              </div>

              {/* Place After dropdown - only for knowledge checks with a module selected */}
              {selectedContentType === "knowledge_check" && formData.module_id && moduleContents.length > 0 && (
                <div className="space-y-2">
                  <Label>Place After</Label>
                  <Select 
                    value={formData.place_after_content_id || "first"} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, place_after_content_id: value === "first" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select content position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first">At the beginning of module</SelectItem>
                      {moduleContents.map(content => (
                        <SelectItem key={content.id} value={content.id}>
                          After: {content.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose where this knowledge check should appear in the module
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Title *</Label>
                <Input 
                  placeholder="Enter content title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Enter description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {selectedContentType === "knowledge_check" ? (
                <div className="space-y-2">
                  <Label>Questions *</Label>
                  <KnowledgeCheckBuilder 
                    questions={quizQuestions} 
                    onChange={setQuizQuestions} 
                  />
                </div>
              ) : selectedContentType === "link" ? (
                <div className="space-y-2">
                  <Label>URL *</Label>
                  <Input 
                    placeholder="https://example.com/resource"
                    value={formData.content_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, content_url: e.target.value }))}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{selectedContentType === "video" ? "Video File or URL" : "Document File"}</Label>
                  <Input 
                    type="file"
                    accept={selectedContentType === "video" ? "video/mp4,video/quicktime,video/webm,video/x-msvideo,video/mpeg" : ".pdf,.doc,.docx,.txt,.ppt,.pptx"}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={isUploading}
                  />
                  {selectedContentType === "video" && file && (
                    <p className="text-xs text-muted-foreground">
                      {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB) — will upload to AWS S3
                    </p>
                  )}
                  {isUploading && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Uploading to S3…</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {selectedContentType === "video" && !file && (
                    <>
                      <p className="text-xs text-muted-foreground">Or enter a YouTube URL instead:</p>
                      <Input 
                        placeholder="https://youtube.com/watch?v=..."
                        value={formData.content_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, content_url: e.target.value }))}
                      />
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Publish immediately</Label>
                <Switch 
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmit} disabled={saving} className="flex-1">
                  {saving ? "Saving..." : editingContent ? "Update Content" : "Create Content"}
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Module Dialog */}
        <Dialog open={moduleDialogOpen} onOpenChange={(open) => {
          setModuleDialogOpen(open);
          if (!open) {
            setEditingModule(null);
            setNewModule({ course_id: "", title: "", description: "" });
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingModule ? "Edit Module" : "Create New Module"}</DialogTitle>
              <DialogDescription>
                {editingModule 
                  ? "Update the module title or description." 
                  : "Modules help organize course content into logical sections."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Course *</Label>
                <Select 
                  value={newModule.course_id} 
                  onValueChange={(value) => setNewModule(prev => ({ ...prev, course_id: value }))}
                  disabled={!!editingModule}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                    ))}
                  </SelectContent>
               </Select>

               {/* Import from Syllabus button */}
               {!editingModule && newModule.course_id && getCourseSyllabusModuleCount(newModule.course_id) > 0 && courseHasNoModulesYet(newModule.course_id) && (
                 <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                   <p className="text-sm text-muted-foreground">
                     This course has <strong>{getCourseSyllabusModuleCount(newModule.course_id)} modules</strong> defined in its syllabus. Import them automatically?
                   </p>
                   <Button 
                     variant="outline" 
                     size="sm"
                     onClick={() => handleImportSyllabusModules(newModule.course_id)}
                     disabled={saving}
                     className="w-full"
                   >
                     <Download className="w-4 h-4 mr-2" />
                     {saving ? "Importing..." : "Import Modules from Syllabus"}
                   </Button>
                 </div>
               )}
              </div>

              <div className="space-y-2">
                <Label>Module Title *</Label>
                <Input 
                  placeholder="e.g., Introduction to Python"
                  value={newModule.title}
                  onChange={(e) => setNewModule(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Brief description of this module"
                  rows={3}
                  value={newModule.description}
                  onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleCreateModule} className="flex-1">
                  {editingModule ? "Update Module" : "Create Module"}
                </Button>
                <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Content Preview */}
        <ContentPreview 
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          content={previewContent}
        />
      </div>
    </DashboardLayout>
  );
};

export default CreateContent;
