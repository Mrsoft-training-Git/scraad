import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Plus, BookOpen, CheckCircle, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { IntroVideoUploader } from "@/components/IntroVideoUploader";

const COURSE_CATEGORIES = [
  "Technology",
  "Business",
  "Data Science",
  "Digital Marketing",
  "Project Management",
  "Finance & Accounting",
  "Design",
  "Leadership",
  "Communication",
  "Entrepreneurship",
  "Human Resources",
  "Healthcare",
  "Other"
];

interface CourseFormData {
  title: string;
  description: string;
  overview: string;
  price: string;
  is_free: boolean;
  image_url: string;
  intro_video_url: string;
  category: string;
  instructor: string;
  duration: string;
  level: string;
  what_you_learn: string[];
  requirements: string[];
  syllabus: { title: string; description: string; topics: string[] }[];
  allows_part_payment: boolean;
  first_tranche_amount: string;
  second_tranche_amount: string;
  second_payment_due_days: string;
}

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCourse: any | null;
  onSave: () => void;
  userRole?: string;
}

export const CourseFormDialog = ({ open, onOpenChange, editingCourse, onSave, userRole }: CourseFormDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    description: "",
    overview: "",
    price: "",
    is_free: false,
    image_url: "",
    intro_video_url: "",
    category: "",
    instructor: "",
    duration: "",
    level: "Beginner",
    what_you_learn: [""],
    requirements: [""],
    syllabus: [{ title: "", description: "", topics: [] }],
    allows_part_payment: false,
    first_tranche_amount: "",
    second_tranche_amount: "",
    second_payment_due_days: "",
  });

  const [newSkill, setNewSkill] = useState("");
  const [newRequirement, setNewRequirement] = useState("");

  // Populate form when editingCourse changes
  useEffect(() => {
    if (open && editingCourse) {
      setFormData({
        title: editingCourse.title || "",
        description: editingCourse.description || "",
        overview: editingCourse.overview || "",
        price: editingCourse.price?.toString() || "",
        is_free: editingCourse.price === 0,
        image_url: editingCourse.image_url || "",
        intro_video_url: editingCourse.intro_video_url || "",
        category: editingCourse.category || "",
        instructor: editingCourse.instructor || "",
        duration: editingCourse.duration || "",
        level: editingCourse.level || "Beginner",
        what_you_learn: editingCourse.what_you_learn?.length ? editingCourse.what_you_learn : [""],
        requirements: editingCourse.requirements?.length ? editingCourse.requirements : [""],
        syllabus: editingCourse.syllabus?.length 
          ? editingCourse.syllabus.map((m: any) => ({ title: m.title || "", description: m.description || "", topics: m.topics || [] }))
          : [{ title: "", description: "", topics: [] }],
        allows_part_payment: editingCourse.allows_part_payment || false,
        first_tranche_amount: editingCourse.first_tranche_amount?.toString() || "",
        second_tranche_amount: editingCourse.second_tranche_amount?.toString() || "",
        second_payment_due_days: editingCourse.second_payment_due_days?.toString() || "",
      });
      setImagePreview(editingCourse.image_url || "");
    } else if (open && !editingCourse) {
      setFormData({
        title: "",
        description: "",
        overview: "",
        price: "",
        is_free: false,
        image_url: "",
        intro_video_url: "",
        category: "",
        instructor: "",
        duration: "",
        level: "Beginner",
        what_you_learn: [""],
        requirements: [""],
        syllabus: [{ title: "", description: "", topics: [] }],
        allows_part_payment: false,
        first_tranche_amount: "",
        second_tranche_amount: "",
        second_payment_due_days: "",
      });
      setImagePreview("");
    }
  }, [open, editingCourse]);

  // Reset form when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `courses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      setImagePreview(publicUrl);
      toast({ title: "Image uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setFormData({ ...formData, what_you_learn: [...formData.what_you_learn.filter(s => s), newSkill.trim()] });
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    setFormData({ ...formData, what_you_learn: formData.what_you_learn.filter((_, i) => i !== index) });
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({ ...formData, requirements: [...formData.requirements.filter(r => r), newRequirement.trim()] });
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({ ...formData, requirements: formData.requirements.filter((_, i) => i !== index) });
  };

  const addModule = () => {
    setFormData({
      ...formData,
      syllabus: [...formData.syllabus, { title: "", description: "", topics: [] }]
    });
  };

  const updateModule = (index: number, field: string, value: string) => {
    const updated = [...formData.syllabus];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, syllabus: updated });
  };

  const addTopic = (moduleIndex: number, topic: string) => {
    if (!topic.trim()) return;
    const updated = [...formData.syllabus];
    updated[moduleIndex] = { ...updated[moduleIndex], topics: [...updated[moduleIndex].topics, topic.trim()] };
    setFormData({ ...formData, syllabus: updated });
  };

  const removeTopic = (moduleIndex: number, topicIndex: number) => {
    const updated = [...formData.syllabus];
    updated[moduleIndex] = { ...updated[moduleIndex], topics: updated[moduleIndex].topics.filter((_, i) => i !== topicIndex) };
    setFormData({ ...formData, syllabus: updated });
  };

  const removeModule = (index: number) => {
    setFormData({ ...formData, syllabus: formData.syllabus.filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.category || (!formData.is_free && !formData.price)) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }

    // Validate part payment
    if (!formData.is_free && formData.allows_part_payment) {
      const first = parseFloat(formData.first_tranche_amount);
      const second = parseFloat(formData.second_tranche_amount);
      const total = parseFloat(formData.price);
      const days = parseInt(formData.second_payment_due_days);

      if (!first || !second || !days) {
        toast({ title: "Error", description: "All part payment fields are required when part payment is enabled", variant: "destructive" });
        return;
      }
      if (Math.abs(first + second - total) > 0.01) {
        toast({ title: "Error", description: `First (₦${first}) + Second (₦${second}) tranche must equal the full price (₦${total})`, variant: "destructive" });
        return;
      }
    }

    // Get current user for instructor_id
    const { data: { user } } = await supabase.auth.getUser();

    const courseData: any = {
      title: formData.title,
      description: formData.description,
      overview: formData.overview,
      price: formData.is_free ? 0 : parseFloat(formData.price),
      image_url: formData.image_url,
      intro_video_url: formData.intro_video_url || null,
      category: formData.category,
      instructor: formData.instructor,
      duration: formData.duration,
      level: formData.level,
      what_you_learn: formData.what_you_learn.filter(s => s.trim()),
      requirements: formData.requirements.filter(r => r.trim()),
      syllabus: formData.syllabus.filter(m => m.title.trim()),
      allows_part_payment: !formData.is_free && formData.allows_part_payment,
      first_tranche_amount: formData.allows_part_payment ? parseInt(formData.first_tranche_amount) || null : null,
      second_tranche_amount: formData.allows_part_payment ? parseInt(formData.second_tranche_amount) || null : null,
      second_payment_due_days: formData.allows_part_payment ? parseInt(formData.second_payment_due_days) || null : null,
    };

    // If instructor is creating a course, auto-assign themselves
    if (userRole === 'instructor' && !editingCourse && user) {
      courseData.instructor_id = user.id;
      courseData.published = false; // Instructors can't publish, only admins can
    }

    if (editingCourse) {
      // Instructors can't change publish status
      if (userRole === 'instructor') {
        delete courseData.published;
        delete courseData.featured;
        delete courseData.top_rated;
      }
      
      const { error } = await supabase
        .from("courses")
        .update(courseData)
        .eq("id", editingCourse.id);
      
      if (error) {
        toast({ title: "Error", description: "Failed to update course", variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Course updated successfully" });
    } else {
      const { error } = await supabase
        .from("courses")
        .insert([courseData]);
      
      if (error) {
        toast({ title: "Error", description: "Failed to create course", variant: "destructive" });
        return;
      }
      toast({ 
        title: "Success", 
        description: userRole === 'instructor' 
          ? "Course created successfully. An admin will review and publish it." 
          : "Course created successfully" 
      });
    }
    
    onSave();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">
            {editingCourse ? "Edit Course" : "Create New Course"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            {/* Image Upload */}
            <div>
              <Label>Course Image *</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => { setImagePreview(""); setFormData({ ...formData, image_url: "" }); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Click to upload course image</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </div>
            </div>

            {/* Intro Video — shown on cards (hover preview) and details hero */}
            <IntroVideoUploader
              value={formData.intro_video_url}
              onChange={(url) => setFormData({ ...formData, intro_video_url: url })}
              pathPrefix={`courses/${editingCourse?.id || `new-${Date.now()}`}/intro`}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter course title"
                  className="mt-1"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed course description (shown in hero section)..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="overview">Overview (About This Course)</Label>
                <Textarea
                  id="overview"
                  value={formData.overview}
                  onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                  placeholder="Short overview displayed in the About section..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="mb-2 block">Pricing *</Label>
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant={formData.is_free ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, is_free: true, price: "" })}
                    className={formData.is_free ? "bg-primary text-primary-foreground" : ""}
                  >
                    Free
                  </Button>
                  <Button
                    type="button"
                    variant={!formData.is_free ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, is_free: false })}
                    className={!formData.is_free ? "bg-primary text-primary-foreground" : ""}
                  >
                    Paid
                  </Button>
                </div>
                {!formData.is_free && (
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Enter price in ₦"
                  />
                )}
              </div>

              {/* Part Payment Section */}
              {!formData.is_free && formData.price && (
                <div className="col-span-2 border border-border/60 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allows_part_payment}
                        onChange={(e) => setFormData({ ...formData, allows_part_payment: e.target.checked })}
                        className="rounded border-input"
                      />
                      <span className="text-sm font-medium">Allow Part Payment (Installments)</span>
                    </label>
                  </div>
                  
                  {formData.allows_part_payment && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="first_tranche">First Tranche (₦)</Label>
                        <Input
                          id="first_tranche"
                          type="number"
                          value={formData.first_tranche_amount}
                          onChange={(e) => setFormData({ ...formData, first_tranche_amount: e.target.value })}
                          placeholder="e.g., 25000"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="second_tranche">Second Tranche (₦)</Label>
                        <Input
                          id="second_tranche"
                          type="number"
                          value={formData.second_tranche_amount}
                          onChange={(e) => setFormData({ ...formData, second_tranche_amount: e.target.value })}
                          placeholder="e.g., 25000"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="due_days">Due In (Days)</Label>
                        <Input
                          id="due_days"
                          type="number"
                          value={formData.second_payment_due_days}
                          onChange={(e) => setFormData({ ...formData, second_payment_due_days: e.target.value })}
                          placeholder="e.g., 30"
                          className="mt-1"
                        />
                      </div>
                      {formData.first_tranche_amount && formData.second_tranche_amount && (
                        <div className="col-span-3">
                          <p className={`text-xs ${
                            Math.abs(parseFloat(formData.first_tranche_amount || "0") + parseFloat(formData.second_tranche_amount || "0") - parseFloat(formData.price || "0")) < 0.01
                              ? "text-green-600"
                              : "text-destructive"
                          }`}>
                            First (₦{parseFloat(formData.first_tranche_amount || "0").toLocaleString()}) + Second (₦{parseFloat(formData.second_tranche_amount || "0").toLocaleString()}) = ₦{(parseFloat(formData.first_tranche_amount || "0") + parseFloat(formData.second_tranche_amount || "0")).toLocaleString()}
                            {Math.abs(parseFloat(formData.first_tranche_amount || "0") + parseFloat(formData.second_tranche_amount || "0") - parseFloat(formData.price || "0")) < 0.01
                              ? " ✓ Matches full price"
                              : ` ✗ Must equal full price (₦${parseFloat(formData.price || "0").toLocaleString()})`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="instructor">Instructor</Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 8 weeks"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="level">Level</Label>
                <Input
                  id="level"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-lg">What You'll Learn</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">Add skills students will gain from this course</p>
              
              <div className="flex gap-2 mb-4">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="e.g., Build responsive websites"
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button onClick={addSkill} type="button">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>

              <div className="space-y-2">
                {formData.what_you_learn.filter(s => s).map((skill, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="flex-1">{skill}</span>
                    <Button size="icon" variant="ghost" onClick={() => removeSkill(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="curriculum" className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-lg">Course Curriculum</h3>
              </div>

              <div className="space-y-4">
                {formData.syllabus.map((module, index) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-semibold text-muted-foreground">Module {index + 1}</span>
                        {formData.syllabus.length > 1 && (
                          <Button size="icon" variant="ghost" onClick={() => removeModule(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <Input
                          value={module.title}
                          onChange={(e) => updateModule(index, 'title', e.target.value)}
                          placeholder="Module title"
                        />
                        
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Description <span className="text-muted-foreground/60">(supports **bold**, *italic*, - lists)</span>
                          </Label>
                          <Textarea
                            value={module.description}
                            onChange={(e) => updateModule(index, 'description', e.target.value)}
                            placeholder="Module description with rich formatting..."
                            rows={2}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Topics</Label>
                          <div className="flex gap-2 mb-2">
                            <Input
                              placeholder="Add a topic"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addTopic(index, (e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={(e) => {
                                const input = (e.target as HTMLElement).parentElement?.querySelector('input');
                                if (input) {
                                  addTopic(index, input.value);
                                  input.value = '';
                                }
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          {module.topics.length > 0 && (
                            <ol className="list-decimal list-inside space-y-1 bg-muted/30 rounded p-2">
                              {module.topics.map((topic, topicIndex) => (
                                <li key={topicIndex} className="flex items-center justify-between text-sm">
                                  <span>{topic}</span>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeTopic(index, topicIndex)}>
                                    <X className="w-3 h-3" />
                                  </Button>
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button onClick={addModule} variant="outline" className="w-full mt-4">
                <Plus className="w-4 h-4 mr-1" /> Add Module
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <List className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-lg">Course Requirements</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">List prerequisites or requirements for this course</p>
              
              <div className="flex gap-2 mb-4">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="e.g., Basic computer knowledge"
                  onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                />
                <Button onClick={addRequirement} type="button">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>

              <div className="space-y-2">
                {formData.requirements.filter(r => r).map((req, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    <span className="flex-1">{req}</span>
                    <Button size="icon" variant="ghost" onClick={() => removeRequirement(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-accent">
            {editingCourse ? "Update Course" : "Create Course"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
