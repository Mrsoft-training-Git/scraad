import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowRight, Award, BookOpen, Clock, GraduationCap, TrendingUp,
  Users, CheckCircle, Search, Star, Play, Briefcase, Globe, ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import businessTraining from "@/assets/business-training.jpg";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  students_count: number;
  featured: boolean;
  instructor: string | null;
}

const Index = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedCourses();
    checkEnrollmentStatus();
  }, []);

  const checkEnrollmentStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("enrolled_courses").select("course_id").eq("user_id", user.id);
      if (data) {
        setEnrolledCourseIds(data.map((e) => e.course_id).filter(Boolean) as string[]);
      }
    }
  };

  const handleEnroll = (course: Course) => {
    navigate(`/enroll/${course.id}`);
  };

  const isEnrolled = (courseId: string) => enrolledCourseIds.includes(courseId);

  const fetchFeaturedCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("published", true)
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(8);

    if (!error && data) {
      setCourses(data);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const categories = [
    { name: "Business", icon: Briefcase },
    { name: "Technology", icon: Globe },
    { name: "Design", icon: Star },
    { name: "Marketing", icon: TrendingUp },
    { name: "Finance", icon: Award },
    { name: "Personal Development", icon: GraduationCap },
  ];

  const stats = [
    { value: "10,000+", label: "Active Learners" },
    { value: "50+", label: "Expert-led Courses" },
    { value: "95%", label: "Completion Rate" },
    { value: "24/7", label: "Learning Access" },
  ];

  const testimonials = [
    {
      name: "Ngozi Kopara",
      role: "Instructor",
      text: "I love this programme and is very easy to Navigate, the developers are topnotch",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ngozi",
    },
    {
      name: "Godbless Onoriode",
      role: "Student",
      text: "The learning curve on this website is straightforward to navigate.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Godbless",
    },
    {
      name: "Chinedu Eze",
      role: "Student",
      text: "The certificates I earned here helped me land my dream job. Highly recommended for anyone serious about career growth.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chinedu",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ─── Hero: Udemy-style search-centric ─── */}
      <section className="relative bg-muted/40 border-b border-border">
        <div className="container mx-auto px-4 py-10 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <h1 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.15]">
                Learn without limits,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  grow without boundaries
                </span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-lg leading-relaxed">
                Build skills with courses, certificates, and professional training from world-class instructors on Cradua.
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="What do you want to learn?"
                    className="pl-10 h-12 text-base border-2 border-border focus-visible:border-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 px-6 font-semibold">
                  Search
                </Button>
              </form>

              {/* Trust line */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground pt-1">
                <ShieldCheck className="w-4 h-4 text-secondary" />
                <span>Trusted by <strong className="text-foreground">10,000+</strong> learners across Nigeria</span>
              </div>
            </div>

            {/* Hero image / illustration card */}
            <div className="hidden lg:block relative">
              <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
                <img
                  src={businessTraining}
                  alt="Students learning on Cradua"
                  className="w-full h-72 object-cover"
                />
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Start learning today — self-paced courses</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">Certificates</Badge>
                    <Badge variant="secondary" className="text-xs">Expert Instructors</Badge>
                    <Badge variant="secondary" className="text-xs">Hands-on Projects</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Category Chips (Coursera-style) ─── */}
      <section className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Browse:</span>
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.name}
                  to={`/courses?category=${encodeURIComponent(cat.name)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:border-primary hover:text-primary transition-colors text-sm font-medium whitespace-nowrap"
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Stats Bar (Coursera-inspired) ─── */}
      <section className="bg-foreground text-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="font-heading font-bold text-2xl md:text-3xl">{stat.value}</div>
                <div className="text-sm text-background/70 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Courses (Udemy grid) ─── */}
      <section className="py-10 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-6 md:mb-8">
            <div>
              <h2 className="font-heading font-bold text-xl md:text-3xl text-foreground">
                Featured Courses
              </h2>
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                Handpicked by our team for quality and relevance
              </p>
            </div>
            <Link to="/courses" className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-72 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No featured courses yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {courses.map((course) => (
                <Card
                  key={course.id}
                  className="group overflow-hidden border border-border bg-card hover:shadow-card-hover transition-all duration-200 flex flex-col"
                >
                  {/* Image */}
                  <Link to={`/programs/${course.id}`} className="block aspect-video overflow-hidden relative">
                    <img
                      src={course.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {course.price === 0 && (
                      <Badge className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-xs">
                        Free
                      </Badge>
                    )}
                  </Link>

                  {/* Content */}
                  <CardContent className="p-4 flex flex-col flex-grow">
                    <Link to={`/programs/${course.id}`}>
                      <h3 className="font-semibold text-sm md:text-base text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-snug">
                        {course.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mb-2 truncate">
                      {course.instructor || "Expert Instructor"}
                    </p>

                    {/* Rating placeholder */}
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-sm font-bold text-warning">4.5</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < 4 ? "fill-warning text-warning" : i < 5 ? "fill-warning/50 text-warning/50" : "text-border"}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">({course.students_count})</span>
                    </div>

                    {/* Price & CTA */}
                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-border">
                      {course.price === 0 ? (
                        <span className="font-bold text-secondary text-sm">Free</span>
                      ) : (
                        <span className="font-bold text-foreground text-base">₦{course.price.toLocaleString()}</span>
                      )}

                      {isEnrolled(course.id) ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs font-semibold"
                          onClick={() => navigate("/dashboard/learning")}
                        >
                          Continue
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="text-xs font-semibold"
                          onClick={() => handleEnroll(course)}
                        >
                          Enroll
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Mobile view all */}
          <div className="text-center mt-6 md:hidden">
            <Link to="/courses">
              <Button variant="outline" className="font-semibold">
                View All Courses <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Why Cradua (feature strip) ─── */}
      <section className="py-10 lg:py-16 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-bold text-xl md:text-3xl text-center mb-8">
            Why learners choose <span className="text-primary">Cradua</span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Clock, title: "Self-Paced", desc: "Learn on your schedule, anywhere" },
              { icon: Award, title: "Certificates", desc: "Earn recognized credentials" },
              { icon: TrendingUp, title: "Progress Tracking", desc: "Monitor your learning journey" },
              { icon: BookOpen, title: "Hands-on Training", desc: "Real-world projects & exercises" },
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center p-4 md:p-6 bg-card border border-border rounded-xl">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-sm md:text-base mb-1">{f.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Corporate / Teams CTA ─── */}
      <section className="py-10 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="bg-foreground text-background rounded-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2 items-center">
              <div className="p-8 lg:p-12 space-y-5">
                <div className="inline-flex items-center gap-2 bg-background/10 px-3 py-1.5 rounded-full text-xs font-medium">
                  <Users className="w-3.5 h-3.5" />
                  Cradua for Business
                </div>
                <h2 className="font-heading font-bold text-2xl md:text-3xl lg:text-4xl leading-tight">
                  Upskill your entire team
                </h2>
                <p className="text-background/75 text-sm md:text-base leading-relaxed max-w-md">
                  Get unlimited access to courses, learning paths, and analytics. Help your organisation stay competitive.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 px-6">
                    Request a Demo <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10 font-semibold h-12 px-6">
                    View Plans
                  </Button>
                </div>
              </div>
              <div className="hidden lg:block">
                <img
                  src={businessTraining}
                  alt="Business teams training on Cradua"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials (Coursera cards) ─── */}
      <section className="py-10 lg:py-16 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-bold text-xl md:text-3xl text-center mb-2">
            What our learners say
          </h2>
          <p className="text-center text-muted-foreground text-sm md:text-base mb-8">
            Join thousands achieving their goals on Cradua
          </p>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <Card key={i} className="border border-border bg-card">
                <CardContent className="p-5 md:p-6">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-foreground text-sm leading-relaxed mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full bg-muted" />
                    <div>
                      <div className="font-semibold text-sm text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA Banner ─── */}
      <section className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-4 py-10 lg:py-14 text-center space-y-4">
          <h2 className="font-heading font-bold text-2xl md:text-3xl">
            Start learning today
          </h2>
          <p className="text-primary-foreground/80 text-sm md:text-base max-w-lg mx-auto">
            Join Cradua and gain the skills to advance your career, earn certificates, and learn from the best.
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold h-12 px-8" asChild>
              <Link to="/auth">
                Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
