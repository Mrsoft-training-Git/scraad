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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Plus, Calendar, Clock, FileUp, Link as LinkIcon, Code, FileText, Loader2, Eye, Edit, CheckCircle, X, Upload } from "lucide-react";
import { format, isPast, formatDistanceToNow } from "date-fns";

interface Course {
  id: string;
  title: string;
  instructor_id: string | null;
}

interface Assignment {
  id: string;
  course_id: string;
  instructor_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  due_date: string;
  max_score: number;
  rubric: RubricItem[];
  allowed_types: string[];
  is_published: boolean;
  created_at: string;
  course?: { title: string };
  submission?: Submission;
}

interface RubricItem {
  criterion: string;
  max_points: number;
  description: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  text_content: string | null;
  file_urls: string[] | null;
  link_urls: string[] | null;
  code_content: string | null;
  code_language: string | null;
  score: number | null;
  rubric_scores: RubricScore[];
  feedback: string | null;
  status: string;
  submitted_at: string | null;
  graded_at: string | null;
}

interface RubricScore {
  criterion: string;
  points: number;
  feedback: string;
}

const CourseAssignments = () => {
  const [searchParams] = useSearchParams();
  const selectedCourseId = searchParams.get("course");

  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>(selectedCourseId || "all");
  const [activeTab, setActiveTab] = useState<string>("pending");

  // Create assignment dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    course_id: "",
    title: "",
    description: "",
    instructions: "",
    due_date: "",
    max_score: 100,
    allowed_types: ["text", "file"] as string[],
    rubric: [] as RubricItem[],
    is_published: false
  });

  // Submission dialog
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState({
    text_content: "",
    link_urls: [] as string[],
    code_content: "",
    code_language: "javascript",
    newLink: ""
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Grading dialog
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradeData, setGradeData] = useState({
    score: 0,
    feedback: "",
    rubric_scores: [] as RubricScore[]
  });

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
      fetchAssignments();
    }
  }, [user, selectedCourse, courses, activeTab]);

  const fetchCourses = async (userId: string, role: string) => {
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

    // Student
    const { data: enrollments } = await supabase
      .from("enrolled_courses")
      .select("course_id")
      .eq("user_id", userId);

    const courseIds = enrollments?.map(e => e.course_id).filter(Boolean) as string[] || [];

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

  const fetchAssignments = async () => {
    setLoading(true);

    let query = supabase
      .from("course_assignments")
      .select(`*, course:courses(title)`)
      .order("due_date", { ascending: true });

    if (selectedCourse !== "all") {
      query = query.eq("course_id", selectedCourse);
    } else {
      const courseIds = courses.map(c => c.id);
      if (courseIds.length > 0) {
        query = query.in("course_id", courseIds);
      }
    }

    // For students, only show published assignments
    if (userRole === "student") {
      query = query.eq("is_published", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching assignments:", error);
      setAssignments([]);
    } else {
      // Fetch student's submissions if student
      if (userRole === "student" && user) {
        const assignmentIds = (data || []).map(a => a.id);
        const { data: submissions } = await supabase
          .from("assignment_submissions")
          .select("*")
          .eq("student_id", user.id)
          .in("assignment_id", assignmentIds);

        const submissionMap = new Map(submissions?.map(s => [s.assignment_id, s]) || []);

        setAssignments((data || []).map(a => ({
          ...a,
          rubric: (a.rubric as unknown as RubricItem[]) || [],
          allowed_types: a.allowed_types || ["text", "file"],
          submission: submissionMap.get(a.id) ? {
            ...submissionMap.get(a.id)!,
            rubric_scores: (submissionMap.get(a.id)!.rubric_scores as unknown as RubricScore[]) || []
          } : undefined
        })));
      } else {
        setAssignments((data || []).map(a => ({
          ...a,
          rubric: (a.rubric as unknown as RubricItem[]) || [],
          allowed_types: a.allowed_types || ["text", "file"]
        })));
      }
    }

    setLoading(false);
  };

  const handleCreateAssignment = async () => {
    if (!user || !newAssignment.title.trim() || !newAssignment.course_id || !newAssignment.due_date) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setCreating(true);
    const insertData = {
      course_id: newAssignment.course_id,
      instructor_id: user.id,
      title: newAssignment.title.trim(),
      description: newAssignment.description.trim() || null,
      instructions: newAssignment.instructions.trim() || null,
      due_date: new Date(newAssignment.due_date).toISOString(),
      max_score: newAssignment.max_score,
      allowed_types: newAssignment.allowed_types,
      rubric: JSON.parse(JSON.stringify(newAssignment.rubric)),
      is_published: newAssignment.is_published
    };
    const { error } = await supabase.from("course_assignments").insert(insertData);

    if (error) {
      toast({ title: "Error", description: "Failed to create assignment", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Assignment created!" });
      setCreateDialogOpen(false);
      setNewAssignment({
        course_id: "",
        title: "",
        description: "",
        instructions: "",
        due_date: "",
        max_score: 100,
        allowed_types: ["text", "file"],
        rubric: [],
        is_published: false
      });
      fetchAssignments();
    }
    setCreating(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    
    setUploadingFile(true);
    const files = Array.from(e.target.files);
    const newUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("assignment-submissions")
        .upload(fileName, file);

      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage
          .from("assignment-submissions")
          .getPublicUrl(data.path);
        newUrls.push(publicUrl);
      }
    }

    setUploadedFiles(prev => [...prev, ...newUrls]);
    setUploadingFile(false);
  };

  const handleSubmitAssignment = async () => {
    if (!user || !selectedAssignment) return;

    setSubmitting(true);
    
    const { error } = await supabase.from("assignment_submissions").upsert({
      assignment_id: selectedAssignment.id,
      student_id: user.id,
      text_content: submission.text_content || null,
      file_urls: uploadedFiles.length > 0 ? uploadedFiles : null,
      link_urls: submission.link_urls.length > 0 ? submission.link_urls : null,
      code_content: submission.code_content || null,
      code_language: submission.code_content ? submission.code_language : null,
      status: "submitted",
      submitted_at: new Date().toISOString()
    }, {
      onConflict: "assignment_id,student_id"
    });

    if (error) {
      toast({ title: "Error", description: "Failed to submit assignment", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Assignment submitted!" });
      setSubmitDialogOpen(false);
      setSubmission({ text_content: "", link_urls: [], code_content: "", code_language: "javascript", newLink: "" });
      setUploadedFiles([]);
      fetchAssignments();
    }
    setSubmitting(false);
  };

  const openGradeDialog = async (assignment: Assignment) => {
    // Fetch all submissions for this assignment
    const { data: submissions } = await supabase
      .from("assignment_submissions")
      .select("*")
      .eq("assignment_id", assignment.id)
      .eq("status", "submitted");

    if (submissions && submissions.length > 0) {
      const sub = submissions[0];
      setSelectedAssignment(assignment);
      setGradingSubmission({
        ...sub,
        rubric_scores: (sub.rubric_scores as unknown as RubricScore[]) || []
      });
      setGradeData({
        score: sub.score || 0,
        feedback: sub.feedback || "",
        rubric_scores: (sub.rubric_scores as unknown as RubricScore[]) || []
      });
      setGradeDialogOpen(true);
    } else {
      toast({ title: "No submissions", description: "No submissions to grade yet" });
    }
  };

  const handleGradeSubmission = async () => {
    if (!gradingSubmission || !user) return;

    setGrading(true);
    const updateData = {
      score: gradeData.score,
      feedback: gradeData.feedback,
      rubric_scores: JSON.parse(JSON.stringify(gradeData.rubric_scores)),
      status: "graded",
      graded_at: new Date().toISOString(),
      graded_by: user.id
    };
    const { error } = await supabase
      .from("assignment_submissions")
      .update(updateData)
      .eq("id", gradingSubmission.id);

    if (error) {
      toast({ title: "Error", description: "Failed to grade submission", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Submission graded!" });
      setGradeDialogOpen(false);
      fetchAssignments();
    }
    setGrading(false);
  };

  const addRubricItem = () => {
    setNewAssignment(prev => ({
      ...prev,
      rubric: [...prev.rubric, { criterion: "", max_points: 10, description: "" }]
    }));
  };

  const updateRubricItem = (index: number, field: keyof RubricItem, value: string | number) => {
    setNewAssignment(prev => ({
      ...prev,
      rubric: prev.rubric.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeRubricItem = (index: number) => {
    setNewAssignment(prev => ({
      ...prev,
      rubric: prev.rubric.filter((_, i) => i !== index)
    }));
  };

  const getStatusBadge = (assignment: Assignment) => {
    if (userRole === "student") {
      if (assignment.submission?.status === "graded") {
        return <Badge className="bg-green-500">Graded: {assignment.submission.score}/{assignment.max_score}</Badge>;
      }
      if (assignment.submission?.status === "submitted") {
        return <Badge className="bg-blue-500">Submitted</Badge>;
      }
      if (isPast(new Date(assignment.due_date))) {
        return <Badge variant="destructive">Past Due</Badge>;
      }
      return <Badge variant="outline">Pending</Badge>;
    }
    return assignment.is_published 
      ? <Badge className="bg-green-500">Published</Badge>
      : <Badge variant="secondary">Draft</Badge>;
  };

  const canCreateAssignment = userRole === "admin" || userRole === "instructor";

  const filteredAssignments = assignments.filter(a => {
    if (userRole === "student") {
      if (activeTab === "pending") return !a.submission || a.submission.status === "draft";
      if (activeTab === "submitted") return a.submission?.status === "submitted";
      if (activeTab === "graded") return a.submission?.status === "graded";
    }
    return true;
  });

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-bold flex items-center gap-2">
              <ClipboardList className="w-8 h-8 text-primary" />
              Assignments
            </h2>
            <p className="text-muted-foreground mt-1">
              {canCreateAssignment
                ? "Create and grade student assignments"
                : "Submit your assignments and track grades"}
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

            {canCreateAssignment && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Assignment</DialogTitle>
                    <DialogDescription>
                      Create a new assignment for students to complete
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Course *</Label>
                        <Select 
                          value={newAssignment.course_id} 
                          onValueChange={(v) => setNewAssignment(prev => ({ ...prev, course_id: v }))}
                        >
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
                        <Label>Due Date *</Label>
                        <Input
                          type="datetime-local"
                          value={newAssignment.due_date}
                          onChange={(e) => setNewAssignment(prev => ({ ...prev, due_date: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        value={newAssignment.title}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Assignment title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={newAssignment.description}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of the assignment"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Instructions</Label>
                      <Textarea
                        value={newAssignment.instructions}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                        placeholder="Detailed instructions for students"
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Score</Label>
                        <Input
                          type="number"
                          value={newAssignment.max_score}
                          onChange={(e) => setNewAssignment(prev => ({ ...prev, max_score: parseInt(e.target.value) || 100 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Allowed Submission Types</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {["text", "file", "link", "code"].map(type => (
                            <label key={type} className="flex items-center gap-1 text-sm">
                              <input
                                type="checkbox"
                                checked={newAssignment.allowed_types.includes(type)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewAssignment(prev => ({ ...prev, allowed_types: [...prev.allowed_types, type] }));
                                  } else {
                                    setNewAssignment(prev => ({ ...prev, allowed_types: prev.allowed_types.filter(t => t !== type) }));
                                  }
                                }}
                                className="rounded"
                              />
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Rubric */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Grading Rubric</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addRubricItem}>
                          <Plus className="w-3 h-3 mr-1" />
                          Add Criterion
                        </Button>
                      </div>
                      {newAssignment.rubric.map((item, index) => (
                        <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="Criterion name"
                              value={item.criterion}
                              onChange={(e) => updateRubricItem(index, "criterion", e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Max points"
                                value={item.max_points}
                                onChange={(e) => updateRubricItem(index, "max_points", parseInt(e.target.value) || 0)}
                                className="w-24"
                              />
                              <Input
                                placeholder="Description (optional)"
                                value={item.description}
                                onChange={(e) => updateRubricItem(index, "description", e.target.value)}
                              />
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeRubricItem(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="published"
                        checked={newAssignment.is_published}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, is_published: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="published" className="cursor-pointer">Publish immediately</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAssignment} disabled={creating}>
                      {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Create Assignment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {userRole === "student" && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="submitted">Submitted</TabsTrigger>
              <TabsTrigger value="graded">Graded</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-2">Loading assignments...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-heading font-bold text-xl mb-2">No Assignments</h3>
              <p className="text-muted-foreground">
                {canCreateAssignment
                  ? "Create your first assignment for students."
                  : "No assignments available yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{assignment.course?.title}</Badge>
                        {getStatusBadge(assignment)}
                      </div>
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      {assignment.description && (
                        <CardDescription className="mt-1">{assignment.description}</CardDescription>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Due: {format(new Date(assignment.due_date), "MMM d, yyyy h:mm a")}
                      </div>
                      {!isPast(new Date(assignment.due_date)) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(assignment.due_date), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Max Score: {assignment.max_score}</span>
                      <span className="flex items-center gap-1">
                        Accepts: 
                        {assignment.allowed_types.includes("text") && <FileText className="w-4 h-4" />}
                        {assignment.allowed_types.includes("file") && <FileUp className="w-4 h-4" />}
                        {assignment.allowed_types.includes("link") && <LinkIcon className="w-4 h-4" />}
                        {assignment.allowed_types.includes("code") && <Code className="w-4 h-4" />}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {userRole === "student" && !assignment.submission?.status?.includes("graded") && !isPast(new Date(assignment.due_date)) && (
                        <Button 
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setSubmitDialogOpen(true);
                          }}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {assignment.submission ? "Edit Submission" : "Submit"}
                        </Button>
                      )}
                      {canCreateAssignment && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => openGradeDialog(assignment)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Grade
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Show graded feedback to students */}
                  {userRole === "student" && assignment.submission?.status === "graded" && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Your Grade</span>
                        <Badge className="bg-green-500 text-lg px-3">
                          {assignment.submission.score}/{assignment.max_score}
                        </Badge>
                      </div>
                      {assignment.submission.feedback && (
                        <div className="text-sm">
                          <span className="font-medium">Feedback:</span>
                          <p className="mt-1 text-muted-foreground">{assignment.submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Submit Assignment Dialog */}
        <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Assignment</DialogTitle>
              <DialogDescription>
                {selectedAssignment?.title}
              </DialogDescription>
            </DialogHeader>
            {selectedAssignment?.instructions && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <span className="font-medium">Instructions:</span>
                <p className="mt-1 whitespace-pre-wrap">{selectedAssignment.instructions}</p>
              </div>
            )}
            <div className="space-y-4 py-4">
              {selectedAssignment?.allowed_types.includes("text") && (
                <div className="space-y-2">
                  <Label>Text Response</Label>
                  <Textarea
                    value={submission.text_content}
                    onChange={(e) => setSubmission(prev => ({ ...prev, text_content: e.target.value }))}
                    placeholder="Write your response..."
                    rows={5}
                  />
                </div>
              )}

              {selectedAssignment?.allowed_types.includes("file") && (
                <div className="space-y-2">
                  <Label>File Upload</Label>
                  <div className="border-2 border-dashed rounded-lg p-4">
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="cursor-pointer"
                    />
                    {uploadingFile && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </div>
                    )}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {uploadedFiles.map((url, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="truncate">{url.split('/').pop()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedAssignment?.allowed_types.includes("link") && (
                <div className="space-y-2">
                  <Label>Links</Label>
                  <div className="flex gap-2">
                    <Input
                      value={submission.newLink}
                      onChange={(e) => setSubmission(prev => ({ ...prev, newLink: e.target.value }))}
                      placeholder="https://..."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (submission.newLink) {
                          setSubmission(prev => ({
                            ...prev,
                            link_urls: [...prev.link_urls, prev.newLink],
                            newLink: ""
                          }));
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {submission.link_urls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <LinkIcon className="w-4 h-4" />
                      <span className="truncate flex-1">{url}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setSubmission(prev => ({
                          ...prev,
                          link_urls: prev.link_urls.filter((_, idx) => idx !== i)
                        }))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {selectedAssignment?.allowed_types.includes("code") && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Code</Label>
                    <Select 
                      value={submission.code_language} 
                      onValueChange={(v) => setSubmission(prev => ({ ...prev, code_language: v }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                        <SelectItem value="html">HTML/CSS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={submission.code_content}
                    onChange={(e) => setSubmission(prev => ({ ...prev, code_content: e.target.value }))}
                    placeholder="Paste your code here..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitAssignment} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Grade Submission Dialog */}
        <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Grade Submission</DialogTitle>
              <DialogDescription>
                {selectedAssignment?.title}
              </DialogDescription>
            </DialogHeader>
            {gradingSubmission && (
              <div className="space-y-4 py-4">
                {/* Show submission content */}
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <h4 className="font-semibold">Student Submission</h4>
                  {gradingSubmission.text_content && (
                    <div>
                      <span className="text-sm font-medium">Text Response:</span>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{gradingSubmission.text_content}</p>
                    </div>
                  )}
                  {gradingSubmission.file_urls && gradingSubmission.file_urls.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Files:</span>
                      <div className="space-y-1 mt-1">
                        {gradingSubmission.file_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                            <FileUp className="w-4 h-4" />
                            {url.split('/').pop()}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {gradingSubmission.link_urls && gradingSubmission.link_urls.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Links:</span>
                      <div className="space-y-1 mt-1">
                        {gradingSubmission.link_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                            <LinkIcon className="w-4 h-4" />
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {gradingSubmission.code_content && (
                    <div>
                      <span className="text-sm font-medium">Code ({gradingSubmission.code_language}):</span>
                      <pre className="text-sm mt-1 p-2 bg-background rounded overflow-x-auto">
                        <code>{gradingSubmission.code_content}</code>
                      </pre>
                    </div>
                  )}
                </div>

                {/* Rubric grading */}
                {selectedAssignment?.rubric && selectedAssignment.rubric.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Rubric Scoring</h4>
                    {selectedAssignment.rubric.map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{item.criterion}</span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={item.max_points}
                              value={gradeData.rubric_scores[index]?.points || 0}
                              onChange={(e) => {
                                const newScores = [...gradeData.rubric_scores];
                                newScores[index] = {
                                  criterion: item.criterion,
                                  points: parseInt(e.target.value) || 0,
                                  feedback: newScores[index]?.feedback || ""
                                };
                                setGradeData(prev => ({ ...prev, rubric_scores: newScores }));
                              }}
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">/ {item.max_points}</span>
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        )}
                        <Input
                          placeholder="Feedback for this criterion..."
                          value={gradeData.rubric_scores[index]?.feedback || ""}
                          onChange={(e) => {
                            const newScores = [...gradeData.rubric_scores];
                            newScores[index] = {
                              criterion: item.criterion,
                              points: newScores[index]?.points || 0,
                              feedback: e.target.value
                            };
                            setGradeData(prev => ({ ...prev, rubric_scores: newScores }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Total Score</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={selectedAssignment?.max_score || 100}
                      value={gradeData.score}
                      onChange={(e) => setGradeData(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">/ {selectedAssignment?.max_score || 100}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Overall Feedback</Label>
                  <Textarea
                    value={gradeData.feedback}
                    onChange={(e) => setGradeData(prev => ({ ...prev, feedback: e.target.value }))}
                    placeholder="Provide feedback for the student..."
                    rows={4}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setGradeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGradeSubmission} disabled={grading}>
                {grading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Submit Grade
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CourseAssignments;
