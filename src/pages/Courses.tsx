import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, Star, SlidersHorizontal, BookOpen, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  students_count: number;
  top_rated: boolean;
  instructor: string | null;
  level: string | null;
  duration: string | null;
}

const Courses = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
    checkEnrollmentStatus();
  }, []);

  const checkEnrollmentStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("enrolled_courses").select("course_id").eq("user_id", user.id);
      if (data) setEnrolledCourseIds(data.map((e) => e.course_id).filter(Boolean) as string[]);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, description, price, image_url, category, students_count, top_rated, instructor, level, duration")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (!error && data) setCourses(data);
    setLoading(false);
  };

  const categories = ["All", ...new Set(courses.map((c) => c.category))];
  const levels = ["All", "Beginner", "Intermediate", "Advanced"];

  const filteredCourses = courses
    .filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.instructor || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
      const matchesLevel = selectedLevel === "All" || course.level === selectedLevel;
      return matchesSearch && matchesCategory && matchesLevel;
    })
    .sort((a, b) => {
      if (sortBy === "popular") return (b.students_count || 0) - (a.students_count || 0);
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return 0; // newest is default order
    });

  const isEnrolled = (courseId: string) => enrolledCourseIds.includes(courseId);
  const activeFiltersCount = [selectedCategory !== "All", selectedLevel !== "All"].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Sticky Search Header */}
      <section className="sticky top-0 z-20 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search courses, instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-muted/50 border-border focus:bg-card"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5 relative"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border animate-in slide-in-from-top-2 duration-200">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px] h-9 text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low → High</SelectItem>
                  <SelectItem value="price-high">Price: High → Low</SelectItem>
                </SelectContent>
              </Select>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setSelectedCategory("All"); setSelectedLevel("All"); }}>
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Results Count */}
      <section className="container mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredCourses.length}</span> courses found
          </p>
          {/* Category pills on desktop */}
          <div className="hidden md:flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.slice(0, 6).map(cat => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer px-3 py-1 text-xs hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Course Grid - Udemy style */}
      <section className="container mx-auto px-4 py-4 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-xl mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-14 h-14 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-heading font-semibold text-lg text-foreground mb-1">No courses found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="group overflow-hidden border border-border bg-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
                onClick={() => navigate(`/programs/${course.id}`)}
              >
                <div className="aspect-video overflow-hidden relative">
                  {course.top_rated && (
                    <Badge className="absolute top-2.5 left-2.5 bg-secondary text-secondary-foreground border-0 z-10 text-[10px] font-bold">
                      <Star className="w-3 h-3 mr-0.5 fill-current" /> Top Rated
                    </Badge>
                  )}
                  <img
                    src={course.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80"}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-4 flex flex-col flex-grow">
                  <h3 className="font-heading font-bold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem] text-foreground">
                    {course.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">{course.instructor || "ScraAD Instructor"}</p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    {course.level && (
                      <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5">{course.level}</Badge>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" /> {course.students_count || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                    {course.price === 0 ? (
                      <Badge className="bg-success/10 text-success border-0 text-xs">Free</Badge>
                    ) : (
                      <span className="text-base font-bold text-foreground">₦{course.price.toLocaleString()}</span>
                    )}
                    {isEnrolled(course.id) ? (
                      <Button
                        size="sm"
                        className="bg-success hover:bg-success/90 text-success-foreground text-xs h-8"
                        onClick={(e) => { e.stopPropagation(); navigate("/dashboard/learning"); }}
                      >
                        Go to Course
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-accent text-primary-foreground text-xs h-8"
                        onClick={(e) => { e.stopPropagation(); navigate(`/enroll/${course.id}`); }}
                      >
                        Enroll Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Courses;
