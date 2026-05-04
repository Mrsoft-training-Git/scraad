import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, BookOpen, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CourseCard } from "@/components/CourseCard";

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  intro_video_url: string | null;
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
      .select("id, title, description, price, image_url, intro_video_url, category, students_count, top_rated, instructor, level, duration")
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

      {/* Editorial Hero */}
      <section className="relative aurora-bg overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-secondary/25 blur-3xl blob-1 pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-accent/30 blur-3xl blob-2 pointer-events-none" />
        <div className="container mx-auto px-4 py-14 md:py-20 relative z-10 text-center max-w-3xl">
          <p className="text-xs uppercase tracking-[0.25em] text-secondary font-semibold mb-3">— Course Catalog</p>
          <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-primary-foreground leading-tight">
            Skills that{" "}
            <span className="font-display italic font-light text-secondary">unlock</span>{" "}
            new chapters
          </h1>
          <p className="text-primary-foreground/80 text-base md:text-lg mt-4 max-w-xl mx-auto">
            Browse expert-led courses across every discipline — at your own pace, on any device.
          </p>
        </div>
      </section>

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
              <CourseCard
                key={course.id}
                course={course}
                isEnrolled={isEnrolled(course.id)}
              />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Courses;
