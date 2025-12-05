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
import { FileText, Video, Link as LinkIcon, Upload, Trash2, Edit, Plus, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Course {
  id: string;
  title: string;
}

interface CourseContent {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  file_path: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  courses?: { title: string };
}

const CreateContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [courses, setCourses] = useState<Course[]>([]);
  const [contents, setContents] = useState<CourseContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<CourseContent | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string>("document");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    course_id: "",
    title: "",
    description: "",
    content_type: "document",
    content_url: "",
    is_published: false,
  });
  const [file, setFile] = useState<File | null>(null);
  
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
      
      if (roleData?.role === "admin") {
        fetchCourses();
        fetchContents();
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title")
      .order("title");
    
    if (!error && data) {
      setCourses(data);
    }
  };

  const fetchContents = async () => {
    const { data, error } = await supabase
      .from("course_content")
      .select("*, courses(title)")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setContents(data as CourseContent[]);
    }
  };

  const handleContentTypeSelect = (type: string) => {
    setSelectedContentType(type);
    setFormData(prev => ({ ...prev, content_type: type }));
    setDialogOpen(true);
    setEditingContent(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      course_id: "",
      title: "",
      description: "",
      content_type: selectedContentType,
      content_url: "",
      is_published: false,
    });
    setFile(null);
  };

  const handleEdit = (content: CourseContent) => {
    setEditingContent(content);
    setFormData({
      course_id: content.course_id,
      title: content.title,
      description: content.description || "",
      content_type: content.content_type,
      content_url: content.content_url || "",
      is_published: content.is_published,
    });
    setSelectedContentType(content.content_type);
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
      fetchContents();
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
      fetchContents();
    }
  };

  const handleSubmit = async () => {
    if (!formData.course_id || !formData.title) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    let filePath: string | null = null;
    let fileUrl: string | null = formData.content_url || null;
    
    // Upload file if selected
    if (file) {
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
    
    const contentData = {
      course_id: formData.course_id,
      title: formData.title,
      description: formData.description || null,
      content_type: formData.content_type,
      content_url: fileUrl,
      file_path: filePath,
      is_published: formData.is_published,
      created_by: user?.id,
    };
    
    let error;
    if (editingContent) {
      const { error: updateError } = await supabase
        .from("course_content")
        .update(contentData)
        .eq("id", editingContent.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("course_content")
        .insert(contentData);
      error = insertError;
    }
    
    setSaving(false);
    
    if (error) {
      toast({ title: "Error", description: "Failed to save content", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Content ${editingContent ? "updated" : "created"} successfully` });
      setDialogOpen(false);
      resetForm();
      fetchContents();
    }
  };

  const filteredContents = filterCourse === "all" 
    ? contents 
    : contents.filter(c => c.course_id === filterCourse);

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4" />;
      case "link": return <LinkIcon className="w-4 h-4" />;
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

  if (userRole !== "admin") {
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
          <h2 className="text-lg font-semibold mb-4">Create New Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <TableCell>{content.courses?.title || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={content.is_published ? "default" : "secondary"}>
                          {content.is_published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
          <DialogContent className="max-w-lg">
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
                  onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
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

              {selectedContentType === "link" ? (
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
                    accept={selectedContentType === "video" ? "video/*" : ".pdf,.doc,.docx,.txt,.ppt,.pptx"}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {selectedContentType === "video" && (
                    <>
                      <p className="text-xs text-muted-foreground">Or enter a video URL:</p>
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
      </div>
    </DashboardLayout>
  );
};

export default CreateContent;
