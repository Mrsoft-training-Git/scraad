import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Filter, Star, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollment } from "@/hooks/useEnrollment";

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  students_count: number;
  top_rated: boolean;
}

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { enrollInCourse, enrolling } = useEnrollment();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    // Courses page shows all published courses
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setCourses(data);
    }
    setLoading(false);
  };

  // Get unique categories from courses
  const categories = ["All", ...new Set(courses.map(c => c.category))];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEnroll = async (course: Course) => {
    await enrollInCourse(course.id, course.title);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header Section */}
      <section className="relative bg-hero-gradient text-white py-16 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="font-heading font-bold text-4xl lg:text-5xl">
              Explore Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80">Courses</span>
            </h1>
            <p className="text-lg text-white/90">
              Discover a wide range of professional courses designed to advance your career
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-base bg-white/95 backdrop-blur-sm border-white/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          {/* Categories Filter */}
          <div className="mb-8 flex flex-wrap gap-3 items-center justify-center">
            <Filter className="w-5 h-5 text-muted-foreground" />
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Course Count */}
          <div className="mb-6 text-center">
            <p className="text-muted-foreground">
              Showing <span className="font-bold text-foreground">{filteredCourses.length}</span> courses
            </p>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="text-center py-12">Loading courses...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="group overflow-hidden border-border/50 bg-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col">
                  <div className="aspect-video overflow-hidden relative">
                    <Badge className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm text-primary border-0 z-10">
                      {course.category}
                    </Badge>
                    {course.top_rated && (
                      <Badge className="absolute top-4 left-4 bg-yellow-500 text-white border-0 z-10">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Top Rated
                      </Badge>
                    )}
                    <img
                      src={course.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {course.category}
                      </Badge>
                    </div>
                    <h3 className="font-heading font-bold text-lg mb-4 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
                      {course.title}
                    </h3>
                    <div className="flex items-center justify-between mb-5 mt-auto">
                      <span className="text-2xl font-bold text-primary">₦{course.price.toLocaleString()}</span>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" /> {course.students_count || 0}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/20 font-semibold"
                        onClick={() => handleEnroll(course)}
                        disabled={enrolling}
                      >
                        Apply Now
                      </Button>
                      <Button variant="outline" className="border-2 hover:bg-accent/10" asChild>
                        <Link to={`/programs/${course.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && filteredCourses.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No courses found. Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Courses;
