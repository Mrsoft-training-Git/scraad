import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, ExternalLink, Download, Search } from "lucide-react";

const References = () => {
  const [searchTerm, setSearchTerm] = useState("");
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

  const references = [
    { id: 1, title: "Introduction to Algorithms", author: "Thomas H. Cormen", type: "Book", link: "#" },
    { id: 2, title: "Clean Code", author: "Robert C. Martin", type: "Book", link: "#" },
    { id: 3, title: "JavaScript: The Good Parts", author: "Douglas Crockford", type: "Book", link: "#" },
    { id: 4, title: "Design Patterns", author: "Gang of Four", type: "Book", link: "#" },
    { id: 5, title: "MIT OpenCourseWare", author: "MIT", type: "Online Resource", link: "#" },
    { id: 6, title: "W3Schools", author: "W3Schools", type: "Online Resource", link: "#" },
  ];

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search references..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {references.map((reference) => (
              <Card key={reference.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{reference.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {reference.author} • {reference.type}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
    </DashboardLayout>
  );
};

export default References;
