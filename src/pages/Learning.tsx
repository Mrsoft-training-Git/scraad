import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Video, FileText, CheckCircle2 } from "lucide-react";

const Learning = () => {
  const materials = [
    { id: 1, type: "video", title: "Introduction to Variables", course: "Programming 101", progress: 100, completed: true },
    { id: 2, type: "document", title: "Data Types Guide", course: "Programming 101", progress: 75, completed: false },
    { id: 3, type: "video", title: "Functions and Methods", course: "Programming 101", progress: 50, completed: false },
    { id: 4, type: "document", title: "Best Practices", course: "Programming 101", progress: 0, completed: false },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-5 h-5" />;
      case "document":
        return <FileText className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border px-8 py-6">
          <div className="inline-block px-4 py-1 bg-primary text-primary-foreground rounded-lg text-sm font-semibold mb-2">
            Learning
          </div>
          <p className="text-muted-foreground">Continue your learning journey</p>
        </div>

        <div className="p-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Learning Materials</CardTitle>
              <CardDescription>Access your course content and track progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {materials.map((material) => (
                <div key={material.id} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:border-primary transition-colors">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    {getIcon(material.type)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{material.title}</h4>
                        <p className="text-sm text-muted-foreground">{material.course}</p>
                      </div>
                      {material.completed && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{material.progress}%</span>
                      </div>
                      <Progress value={material.progress} />
                    </div>
                  </div>
                  <Button variant={material.completed ? "outline" : "default"}>
                    {material.completed ? "Review" : material.progress > 0 ? "Continue" : "Start"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Learning;
