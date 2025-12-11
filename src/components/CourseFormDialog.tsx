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
  price: string;
  is_free: boolean;
  image_url: string;
  category: string;
  instructor: string;
  duration: string;
  level: string;
  what_you_learn: string[];
  requirements: string[];
  syllabus: { title: string; description: string; lessons: string; duration: string }[];
}

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCourse: any | null;
  onSave: () => void;
}

export const CourseFormDialog = ({ open, onOpenChange, editingCourse, onSave }: CourseFormDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    description: "",
    price: "",
    is_free: false,
    image_url: "",
    category: "",
    instructor: "",
    duration: "",
    level: "Beginner",
    what_you_learn: [""],
    requirements: [""],
    syllabus: [{ title: "", description: "", lessons: "", duration: "" }]
  });

  const [newSkill, setNewSkill] = useState("");
  const [newRequirement, setNewRequirement] = useState("");

  // Populate form when editingCourse changes
  useEffect(() => {
    if (open && editingCourse) {
      setFormData({
        title: editingCourse.title || "",
        description: editingCourse.description || "",
        price: editingCourse.price?.toString() || "",
        is_free: editingCourse.price === 0,
        image_url: editingCourse.image_url || "",
        category: editingCourse.category || "",
        instructor: editingCourse.instructor || "",
        duration: editingCourse.duration || "",
        level: editingCourse.level || "Beginner",
        what_you_learn: editingCourse.what_you_learn?.length ? editingCourse.what_you_learn : [""],
        requirements: editingCourse.requirements?.length ? editingCourse.requirements : [""],
        syllabus: editingCourse.syllabus?.length ? editingCourse.syllabus : [{ title: "", description: "", lessons: "", duration: "" }]
      });
      setImagePreview(editingCourse.image_url || "");
    } else if (open && !editingCourse) {
      setFormData({
        title: "",
        description: "",
        price: "",
        is_free: false,
        image_url: "",
        category: "",
        instructor: "",
        duration: "",
        level: "Beginner",
        what_you_learn: [""],
        requirements: [""],
        syllabus: [{ title: "", description: "", lessons: "", duration: "" }]
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
      syllabus: [...formData.syllabus, { title: "", description: "", lessons: "", duration: "" }]
    });
  };

  const updateModule = (index: number, field: string, value: string) => {
    const updated = [...formData.syllabus];
    updated[index] = { ...updated[index], [field]: value };
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

    const courseData = {
      title: formData.title,
      description: formData.description,
      price: formData.is_free ? 0 : parseFloat(formData.price),
      image_url: formData.image_url,
      category: formData.category,
      instructor: formData.instructor,
      duration: formData.duration,
      level: formData.level,
      what_you_learn: formData.what_you_learn.filter(s => s.trim()),
      requirements: formData.requirements.filter(r => r.trim()),
      syllabus: formData.syllabus.filter(m => m.title.trim())
    };

    if (editingCourse) {
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
      toast({ title: "Success", description: "Course created successfully" });
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what students will learn..."
                  rows={4}
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h3 className="font-heading font-bold text-lg">Course Curriculum</h3>
                </div>
                <Button onClick={addModule} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Module
                </Button>
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
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Input
                            value={module.title}
                            onChange={(e) => updateModule(index, 'title', e.target.value)}
                            placeholder="Module title"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={module.description}
                            onChange={(e) => updateModule(index, 'description', e.target.value)}
                            placeholder="Module description"
                          />
                        </div>
                        <Input
                          value={module.lessons}
                          onChange={(e) => updateModule(index, 'lessons', e.target.value)}
                          placeholder="Number of lessons"
                        />
                        <Input
                          value={module.duration}
                          onChange={(e) => updateModule(index, 'duration', e.target.value)}
                          placeholder="Duration (e.g., 2 hours)"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
