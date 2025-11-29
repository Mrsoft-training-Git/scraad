import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, Video, FileText, CheckCircle2 } from "lucide-react";

const Learning = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
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
        .single();
      
      setUserRole(roleData?.role || "student");
    };
    checkAuth();
  }, [navigate]);
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
    <DashboardLayout user={user} userRole={userRole}>
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
    </DashboardLayout>
  );
};

export default Learning;
