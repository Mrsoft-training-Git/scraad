import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users } from "lucide-react";
import { Link } from "react-router-dom";

const DashboardCourses = () => {
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

  const courses = [
    {
      id: 1,
      title: "E-Business Model",
      price: "₦40,000",
      students: 45,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      category: "Business",
    },
    {
      id: 2,
      title: "National Sustainable and Entrepreneurship Program (NSEP)",
      price: "₦40,000",
      students: 38,
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
      category: "Business",
    },
    {
      id: 3,
      title: "Resource Acquisition",
      price: "₦35,000",
      students: 52,
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
      category: "Business",
    },
    {
      id: 4,
      title: "Human Resource and Management",
      price: "₦40,300",
      students: 30,
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
      category: "Business",
    },
    {
      id: 5,
      title: "Digital Marketing Fundamentals",
      price: "₦38,000",
      students: 25,
      image: "https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=800&q=80",
      category: "Marketing",
    },
    {
      id: 6,
      title: "Data Analytics and Visualization",
      price: "₦50,000",
      students: 22,
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
      category: "Technology",
    },
  ];

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="font-heading text-3xl font-bold">Course Catalog</h2>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses
            .filter((course) =>
              course.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((course) => (
              <Card
                key={course.id}
                className="group overflow-hidden border-border/50 bg-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col"
              >
                <div className="aspect-video overflow-hidden relative">
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary z-10">
                    {course.category}
                  </div>
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                      {course.category}
                    </div>
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-4 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
                    {course.title}
                  </h3>
                  <div className="flex items-center justify-between mb-5 mt-auto">
                    <span className="text-2xl font-bold text-primary">{course.price}</span>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {course.students}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg shadow-primary/20 font-semibold">
                      Apply Now
                    </Button>
                    <Button
                      variant="outline"
                      className="border-2 hover:bg-accent/10"
                      asChild
                    >
                      <Link to={`/programs/${course.id}`}>View Details</Link>
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

export default DashboardCourses;
