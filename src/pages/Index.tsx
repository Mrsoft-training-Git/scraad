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
  Monitor, Zap, Target, BarChart3 } from
"lucide-react";
import { Link, useNavigate } from "react-router-dom";
import heroTraining from "@/assets/hero-training.jpg";
import teamTraining from "@/assets/team-training.jpg";
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
    const { data, error } = await supabase.
    from("courses").
    select("*").
    eq("published", true).
    eq("featured", true).
    order("created_at", { ascending: false }).
    limit(8);

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
  { name: "Business", icon: Briefcase, color: "bg-primary/10 text-primary" },
  { name: "Technology", icon: Monitor, color: "bg-accent/10 text-accent" },
  { name: "Design", icon: Target, color: "bg-secondary/10 text-secondary" },
  { name: "Marketing", icon: TrendingUp, color: "bg-success/10 text-success" },
  { name: "Finance", icon: BarChart3, color: "bg-warning/10 text-warning-foreground" },
  { name: "Personal Development", icon: GraduationCap, color: "bg-primary/10 text-primary" }];


  const stats = [
  { value: "10,000+", label: "Active Learners" },
  { value: "50+", label: "Expert-led Courses" },
  { value: "95%", label: "Completion Rate" },
  { value: "24/7", label: "Learning Access" }];


  const testimonials = [
  {
    name: "Ngozi Kopara",
    role: "Instructor",
    text: "I love this programme and is very easy to Navigate, the developers are topnotch",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ngozi"
  },
  {
    name: "Godbless Onoriode",
    role: "Student",
    text: "The learning curve on this website is straightforward to navigate.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Godbless"
  },
  {
    name: "Chinedu Eze",
    role: "Student",
    text: "The certificates I earned here helped me land my dream job. Highly recommended for anyone serious about career growth.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chinedu"
  }];


  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-animated-gradient" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=')] opacity-50" />
        {/* Floating glow orbs */}
        <div className="absolute top-20 -left-20 w-72 h-72 bg-secondary/20 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }} />
        <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full animate-fade-in">
                <Zap className="w-4 h-4 text-secondary animate-pulse" />
                <span className="text-sm font-medium text-primary-foreground/90">Trusted by 10,000+ professionals</span>
              </div>
              <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-[3.25rem] text-primary-foreground leading-[1.12] tracking-tight animate-fade-in-up">
                Go from <span className="text-gradient-gold">Scratch</span> to{" "}
                <span className="text-gradient-gold">Advance</span>
              </h1>
              <p className="text-primary-foreground/75 text-base md:text-lg max-w-lg leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
                Build in-demand skills with courses, certifications, and hands-on training from industry experts. Your transformation starts here.
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="flex gap-2 max-w-lg animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="What do you want to learn?"
                    className="pl-11 h-13 text-base bg-primary-foreground border-0 text-foreground placeholder:text-muted-foreground shadow-lg focus-visible:ring-2 focus-visible:ring-secondary transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} />
                  
                </div>
                <Button type="submit" size="lg" className="h-13 px-6 font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg hover-glow transition-all">
                  Search
                </Button>
              </form>

              <div className="flex flex-wrap items-center gap-4 pt-2 animate-fade-in-up" style={{ animationDelay: '0.45s', opacity: 0 }}>
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold h-12 px-8 shadow-lg hover-glow group transition-all" asChild>
                  <Link to="/auth">Get Started Free <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></Link>
                </Button>
                <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium h-12 px-6 shadow-lg hover-scale" asChild>
                  <Link to="/courses">Explore Courses</Link>
                </Button>
              </div>
            </div>

            {/* Hero card */}
            <div className="relative animate-scale-in" style={{ animationDelay: '0.3s', opacity: 0 }}>
              <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-border/50 hover-lift group">
                <div className="overflow-hidden">
                  <img
                    src={heroTraining}
                    alt="Professionals learning on ScraAd"
                    className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Self-paced courses · Expert instructors</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="text-xs bg-primary/10 text-primary border-0 hover:bg-primary/20 transition-colors">Certificates</Badge>
                    <Badge className="text-xs bg-secondary/15 text-secondary border-0 hover:bg-secondary/25 transition-colors">Hands-on Projects</Badge>
                    <Badge className="text-xs bg-success/10 text-success border-0 hover:bg-success/20 transition-colors">Career Growth</Badge>
                  </div>
                </div>
              </div>
              {/* Floating stats card */}
              <div className="absolute -bottom-4 -left-6 bg-card rounded-xl shadow-xl border border-border/60 px-5 py-3.5 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <div className="text-lg font-heading font-bold text-foreground">95%</div>
                    <div className="text-xs text-muted-foreground">Completion rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="bg-card border-y border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) =>
            <div key={i} className="text-center group cursor-default" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="font-heading font-bold text-2xl md:text-3xl text-primary group-hover:scale-110 group-hover:text-secondary transition-all duration-300">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Top Categories ─── */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground">Top Categories</h2>
            <p className="text-muted-foreground text-sm md:text-base mt-2">Browse courses by field of study</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.name}
                  to={`/courses?category=${encodeURIComponent(cat.name)}`}
                  style={{ animationDelay: `${idx * 0.08}s`, opacity: 0 }}
                  className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-card border border-border hover:border-secondary/50 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-500 ease-out min-w-[130px] shrink-0 lg:min-w-0 animate-fade-in-up">
                  
                  <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-foreground text-center whitespace-nowrap group-hover:text-primary transition-colors">{cat.name}</span>
                </Link>);

            })}
          </div>
        </div>
      </section>

      {/* ─── Featured Courses ─── */}
      <section className="py-12 lg:py-16 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground">Featured Courses</h2>
              <p className="text-muted-foreground text-sm md:text-base mt-1">Handpicked for quality and relevance</p>
            </div>
            <Link to="/courses" className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-accent transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ?
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) =>
            <div key={i} className="h-80 bg-card animate-pulse rounded-xl border border-border" />
            )}
            </div> :
          courses.length === 0 ?
          <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No featured courses yet. Check back soon!</p>
            </div> :

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
              {courses.map((course, idx) =>
            <Card
              key={course.id}
              style={{ animationDelay: `${idx * 0.1}s`, opacity: 0 }}
              className="group overflow-hidden bg-card border border-border hover:shadow-card-hover hover:-translate-y-2 transition-all duration-500 ease-out flex flex-col min-w-[260px] shrink-0 sm:min-w-0 animate-fade-in-up">
              
                  <Link to={`/programs/${course.id}`} className="block aspect-video overflow-hidden relative">
                    <img
                  src={course.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                
                    {course.price === 0 &&
                <Badge className="absolute top-2.5 left-2.5 bg-success text-success-foreground text-xs border-0 shadow-sm">Free</Badge>
                }
                    <Badge className="absolute top-2.5 right-2.5 bg-card/90 backdrop-blur-sm text-foreground text-xs border-0">{course.category}</Badge>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </Link>

                  <CardContent className="p-4 flex flex-col flex-grow">
                    <Link to={`/programs/${course.id}`}>
                      <h3 className="font-heading font-semibold text-sm md:text-base text-foreground line-clamp-2 mb-1.5 group-hover:text-primary transition-colors leading-snug">
                        {course.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mb-2.5 truncate">
                      {course.instructor || "Expert Instructor"}
                    </p>

                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-sm font-bold text-secondary">4.5</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) =>
                    <Star key={i} className={`w-3.5 h-3.5 ${i < 4 ? "fill-secondary text-secondary" : i < 5 ? "fill-secondary/40 text-secondary/40" : "text-border"}`} />
                    )}
                      </div>
                      <span className="text-xs text-muted-foreground">({course.students_count})</span>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
                      {course.price === 0 ?
                  <span className="font-bold text-success text-sm">Free</span> :

                  <span className="font-bold text-foreground text-base">₦{course.price.toLocaleString()}</span>
                  }
                      {isEnrolled(course.id) ?
                  <Button size="sm" className="text-xs font-semibold bg-primary hover:bg-accent hover-scale" onClick={() => navigate("/dashboard/learning")}>
                          Continue
                        </Button> :

                  <Button size="sm" className="text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 hover-glow group/btn" onClick={() => handleEnroll(course)}>
                          Enroll Now
                          <ArrowRight className="ml-1 w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Button>
                  }
                    </div>
                  </CardContent>
                </Card>
            )}
            </div>
          }

          <div className="text-center mt-8 md:hidden">
            <Link to="/courses">
              <Button variant="outline" className="font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                View All Courses <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Why ScraAd ─── */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground">
              Why learners choose Scra<span className="text-secondary">AD</span>
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">Everything you need to build skills and advance your career</p>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
            {[
            { icon: Clock, title: "Self-Paced Learning", desc: "Learn on your own schedule, anywhere in the world" },
            { icon: Award, title: "Recognized Certificates", desc: "Earn credentials valued by employers" },
            { icon: TrendingUp, title: "Progress Tracking", desc: "Monitor your learning journey with detailed analytics" },
            { icon: BookOpen, title: "Hands-on Training", desc: "Real-world projects and practical Programs" }].
            map((f, i) =>
            <Card key={i} style={{ animationDelay: `${i * 0.12}s`, opacity: 0 }} className="border border-border bg-card hover:shadow-card-hover hover:-translate-y-2 hover:border-secondary/40 transition-all duration-500 ease-out min-w-[75vw] shrink-0 sm:min-w-0 group animate-fade-in-up">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/15 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <f.icon className="w-7 h-7 text-primary group-hover:text-secondary transition-colors duration-500" />
                  </div>
                  <h3 className="font-heading font-bold text-base mb-2 text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* ─── Corporate CTA ─── */}
      <section className="py-12 lg:py-16 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2 items-center">
              <div className="p-8 lg:p-12 space-y-5">
                <div className="inline-flex items-center gap-2 bg-primary-foreground/10 px-3 py-1.5 rounded-full text-xs font-medium text-primary-foreground">
                  <Users className="w-3.5 h-3.5" />
                  Scra<span className="text-secondary">AD</span> for Business
                </div>
                <h2 className="font-heading font-bold text-2xl md:text-3xl lg:text-4xl leading-tight text-primary-foreground">
                  Upskill your entire team
                </h2>
                <p className="text-primary-foreground/75 text-sm md:text-base leading-relaxed max-w-md">
                  Get unlimited access to courses, learning paths, and analytics. Help your organisation stay competitive in a changing world.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold h-12 px-6 shadow-lg">
                    Request a Demo <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium h-12 px-6 shadow-lg">
                    View Plans
                  </Button>
                </div>
              </div>
              <div className="h-48 lg:h-full">
                <img src={teamTraining} alt="Business teams training on ScraAd" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground">What our learners say</h2>
            <p className="text-muted-foreground text-sm md:text-base mt-2">Join thousands achieving their goals on Scra<span className="text-secondary">AD</span></p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible md:pb-0 max-w-5xl mx-auto px-1">
            {testimonials.map((t, i) =>
            <Card key={i} className="border border-border bg-card hover:shadow-card-hover transition-all duration-300 min-w-[72vw] max-w-[72vw] shrink-0 snap-start md:min-w-0 md:max-w-none">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) =>
                  <Star key={j} className="w-4 h-4 fill-secondary text-secondary" />
                  )}
                  </div>
                  <p className="text-foreground text-sm leading-relaxed mb-5">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full bg-muted" />
                    <div>
                      <div className="font-semibold text-sm text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="bg-primary">
        <div className="container mx-auto px-4 py-12 lg:py-16 text-center space-y-5">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-primary-foreground">
            Start learning today
          </h2>
          <p className="text-primary-foreground/75 text-sm md:text-base max-w-lg mx-auto">
            Join Scra<span className="text-secondary">AD</span> and gain the skills to advance your career, earn certificates, and learn from the best.
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold h-12 px-8 shadow-lg" asChild>
              <Link to="/auth">
                Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>);

};

export default Index;