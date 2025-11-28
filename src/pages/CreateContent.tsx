import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Video, Link as LinkIcon } from "lucide-react";

const CreateContent = () => {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border px-8 py-6">
          <div className="inline-block px-4 py-1 bg-primary text-primary-foreground rounded-lg text-sm font-semibold mb-2">
            Create Content
          </div>
          <p className="text-muted-foreground">Create new learning materials</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <FileText className="w-12 h-12 text-primary mb-2" />
                <CardTitle>Document</CardTitle>
                <CardDescription>Create text-based content</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <Video className="w-12 h-12 text-primary mb-2" />
                <CardTitle>Video</CardTitle>
                <CardDescription>Upload or link videos</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <LinkIcon className="w-12 h-12 text-primary mb-2" />
                <CardTitle>Resource Link</CardTitle>
                <CardDescription>Add external resources</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>New Content</CardTitle>
              <CardDescription>Fill in the details below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="link">Resource Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Course</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Introduction to Programming</SelectItem>
                    <SelectItem value="2">Data Structures</SelectItem>
                    <SelectItem value="3">Web Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Enter content title" />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Enter description" rows={4} />
              </div>

              <div className="space-y-2">
                <Label>Content URL or File</Label>
                <Input type="file" />
              </div>

              <div className="flex gap-3">
                <Button>Create Content</Button>
                <Button variant="outline">Save as Draft</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreateContent;
