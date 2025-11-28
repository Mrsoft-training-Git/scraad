import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, ExternalLink, Download, Search } from "lucide-react";
import { useState } from "react";

const References = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const references = [
    { id: 1, title: "Introduction to Algorithms", author: "Thomas H. Cormen", type: "Book", link: "#" },
    { id: 2, title: "Clean Code", author: "Robert C. Martin", type: "Book", link: "#" },
    { id: 3, title: "JavaScript: The Good Parts", author: "Douglas Crockford", type: "Book", link: "#" },
    { id: 4, title: "Design Patterns", author: "Gang of Four", type: "Book", link: "#" },
    { id: 5, title: "MIT OpenCourseWare", author: "MIT", type: "Online Resource", link: "#" },
    { id: 6, title: "W3Schools", author: "W3Schools", type: "Online Resource", link: "#" },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border px-8 py-6">
          <div className="inline-block px-4 py-1 bg-primary text-primary-foreground rounded-lg text-sm font-semibold mb-2">
            References
          </div>
          <p className="text-muted-foreground">Access learning resources and materials</p>
        </div>

        <div className="p-8 space-y-6">
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
      </main>
    </div>
  );
};

export default References;
