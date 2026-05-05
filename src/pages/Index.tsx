import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowRight, Award, BookOpen, Clock, GraduationCap, TrendingUp,
  Users, Star, Briefcase, Monitor, Target, BarChart3,
  Palette, Code2, Megaphone, Heart, Quote
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import heroTraining from "@/assets/hero-training.jpg";
import teamTraining from "@/assets/team-training.jpg";
import { supabase } from "@/integrations/supabase/client";
import { PromoBar } from "@/components/PromoBar";
import { LogoMarquee } from "@/components/LogoMarquee";
import { MRsoftAttribution } from "@/components/MRsoftAttribution";
import { TiltCard } from "@/components/TiltCard";
import { CourseCard } from "@/components/CourseCard";
import { useReveal } from "@/hooks/useReveal";
import { useCursorGlow } from "@/hooks/useCursorGlow";
import { Squiggle, StarBurst, Sparkle, ArrowDoodle, Lightning, Underline } from "@/components/Doodles";

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
  const [statsData, setStatsData] = useState<{
    instructors: number | null;
    catalog: number | null;
    learners: number | null;
  }>({ instructors: null, catalog: null, learners: null });
  const navigate = useNavigate();

  const heroRef = useCursorGlow<HTMLDivElement>();
  const whyRef = useReveal<HTMLDivElement>();
  const ctaRef = useReveal<HTMLDivElement>();
  const testimonialsRef = useReveal<HTMLDivElement>();

  useEffect(() => {
    fetchFeaturedCourses();
    checkEnrollmentStatus();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [coursesRes, programsRes, learnersRes, instructorsRes] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }).eq("published", true),
        supabase.from("programs").select("id", { count: "exact", head: true }),
        supabase.from("enrolled_courses").select("user_id", { count: "exact", head: true }),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "instructor"),
      ]);
      setStatsData({
        instructors: instructorsRes.count ?? 0,
        catalog: (coursesRes.count ?? 0) + (programsRes.count ?? 0),
        learners: learnersRes.count ?? 0,
      });
    } catch {
      setStatsData({ instructors: 0, catalog: 0, learners: 0 });
    }
  };

  const checkEnrollmentStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("enrolled_courses").select("course_id").eq("user_id", user.id);
      if (data) setEnrolledCourseIds(data.map((e) => e.course_id).filter(Boolean) as string[]);
    }
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
    if (!error && data) setCourses(data);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/courses?q=${encodeURIComponent(searchQuery)}`);
  };

  const suggestions = ["UI/UX Design", "Data Analysis", "Public Speaking", "Python", "Marketing"];

  const categories = [
    { name: "Business", icon: Briefcase, bg: "bg-pastel-cream", iconColor: "text-warning-foreground" },
    { name: "Technology", icon: Code2, bg: "bg-pastel-sky", iconColor: "text-primary" },
    { name: "Design", icon: Palette, bg: "bg-pastel-lilac", iconColor: "text-accent" },
    { name: "Marketing", icon: Megaphone, bg: "bg-pastel-peach", iconColor: "text-secondary-foreground" },
    { name: "Finance", icon: BarChart3, bg: "bg-pastel-mint", iconColor: "text-success" },
    { name: "Personal Dev", icon: Heart, bg: "bg-pastel-rose", iconColor: "text-destructive" },
  ];

  const fmt = (n: number | null) => (n === null ? null : n.toLocaleString());
  const stats = [
    { value: fmt(statsData.instructors), label: "Expert Instructors" },
    { value: fmt(statsData.catalog), label: "Courses & Programs" },
    { value: fmt(statsData.learners), label: "Active Learners" },
    { value: "New", label: "Platform — Growing Daily" },
  ];

  const testimonials = [
    {
      name: "Ngozi Kopara",
      role: "Instructor",
      text: "I love this programme and is very easy to navigate, the developers are top-notch.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ngozi",
    },
    {
      name: "Godbless Onoriode",
      role: "Student",
      text: "The learning curve on this website is straightforward to navigate. I built real projects in weeks.",
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
      <PromoBar />
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden aurora-bg cursor-glow" ref={heroRef}>
        {/* Doodle accents (decorative) */}
        <Sparkle className="hidden md:block absolute top-16 left-[8%] w-6 h-6 text-secondary/70 animate-bounce-soft" aria-hidden />
        <StarBurst className="hidden md:block absolute top-24 right-[12%] w-8 h-8 text-warning/60 animate-spin" style={{ animationDuration: "12s" }} aria-hidden />
        <Lightning className="hidden lg:block absolute bottom-32 left-[6%] w-7 h-7 text-secondary/80 animate-bounce-soft" style={{ animationDelay: "0.6s" }} aria-hidden />
        <Squiggle className="hidden lg:block absolute bottom-20 right-[18%] w-20 h-5 text-secondary/70" aria-hidden />

        {/* Floating blobs */}
        <div className="absolute -top-32 -left-20 w-96 h-96 bg-secondary/25 blur-3xl blob-1 pointer-events-none" />
        <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] bg-accent/40 blur-3xl blob-2 pointer-events-none" />

        <div className="container mx-auto px-4 pt-12 pb-20 lg:pt-20 lg:pb-28 relative z-10">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
            {/* LEFT — editorial copy */}
            <div className="space-y-6 lg:space-y-8">
              <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full animate-fade-in">
                <Sparkle className="w-3.5 h-3.5 text-secondary animate-pulse" />
                <span className="text-xs sm:text-sm font-medium text-primary-foreground/90">
                  A new home for ambitious African learners
                </span>
              </div>

              <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-[4.25rem] xl:text-[5rem] text-primary-foreground leading-[1.02] tracking-tight">
                <span className="block animate-fade-in-up">Where ambition</span>
                <span className="block animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
                  meets{" "}
                  <span className="font-display italic font-light text-secondary relative inline-block">
                    opportunity
                    <Underline className="absolute -bottom-2 left-0 w-full h-3 text-secondary/80" aria-hidden />
                  </span>
                </span>
              </h1>

              <p
                className="text-primary-foreground/80 text-base md:text-lg max-w-xl leading-relaxed animate-fade-in-up"
                style={{ animationDelay: "0.25s", opacity: 0 }}
              >
                Build in-demand skills with expert-led courses, hands-on programs, and certifications that move careers forward — at your own pace, from anywhere.
              </p>

              {/* CTAs */}
              <div
                className="flex flex-wrap gap-3 animate-fade-in-up"
                style={{ animationDelay: "0.4s", opacity: 0 }}
              >
                <Button
                  size="lg"
                  asChild
                  className="h-14 px-7 font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-2xl rounded-2xl magnetic-btn"
                >
                  <Link to="/courses">
                    Explore Courses
                    <ArrowRight className="ml-1.5 w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  asChild
                  variant="outline"
                  className="h-14 px-7 font-semibold rounded-2xl bg-card/10 backdrop-blur border-primary-foreground/30 text-primary-foreground hover:bg-card/20 hover:text-primary-foreground"
                >
                  <Link to="/programs">View Programs</Link>
                </Button>
              </div>

              {/* Suggested chips */}
              <div
                className="flex flex-wrap gap-2 animate-fade-in-up"
                style={{ animationDelay: "0.55s", opacity: 0 }}
              >
                <span className="text-xs text-primary-foreground/60 self-center mr-1">Popular:</span>
                {suggestions.map((s) => (
                  <Link
                    key={s}
                    to={`/courses?q=${encodeURIComponent(s)}`}
                    className="text-xs px-3 py-1.5 rounded-full glass text-primary-foreground/90 hover:text-secondary hover:bg-white/15 transition-all"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>

            {/* RIGHT — photo collage with floating stat pills */}
            <div className="relative h-[420px] sm:h-[480px] lg:h-[520px] animate-fade-in" style={{ animationDelay: "0.3s" }}>
              {/* Main image — blob clip */}
              <div className="absolute top-0 right-0 w-[78%] h-[72%] overflow-hidden blob-1 shadow-2xl">
                <img
                  src={heroTraining}
                  alt="Learners on ScraAd"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent" />
              </div>

              {/* Secondary image */}
              <div className="absolute bottom-0 left-0 w-[58%] h-[48%] overflow-hidden blob-2 shadow-2xl ring-4 ring-card/40">
                <img
                  src={teamTraining}
                  alt="Team training"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating stat pills */}
              <div className="absolute top-6 -left-2 lg:-left-6 glass-card rounded-2xl px-4 py-3 animate-bounce-soft" style={{ animationDelay: "0.4s" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center">
                    <Users className="w-4.5 h-4.5 text-secondary" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-sm text-foreground">
                      {statsData.learners === null ? "—" : statsData.learners.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Learners</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-2 right-6 glass-card rounded-2xl px-4 py-3 animate-bounce-soft" style={{ animationDelay: "1.2s" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-success/15 flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-success" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-sm text-foreground">Live</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Cohorts</div>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 -right-2 lg:-right-4 glass-card rounded-2xl px-4 py-3 animate-bounce-soft" style={{ animationDelay: "0.8s" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-warning/20 flex items-center justify-center">
                    <Star className="w-4.5 h-4.5 fill-warning text-warning" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-sm text-foreground">New</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Platform</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST MARQUEE ─── */}
      <LogoMarquee />

      {/* ─── STATS ─── */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div
                key={i}
                className="text-center group animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
              >
                <div className="font-display italic font-light text-5xl md:text-6xl text-primary group-hover:text-secondary transition-colors duration-500 min-h-[60px] flex items-center justify-center">
                  {s.value === null ? (
                    <span className="inline-block w-16 h-10 rounded-md bg-muted animate-pulse" />
                  ) : (
                    s.value
                  )}
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mt-2 font-medium">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-sm uppercase tracking-[0.2em] text-secondary font-semibold mb-3">— Explore</p>
            <h2 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight">
              Find your{" "}
              <span className="font-display italic font-light text-primary">passion</span>
            </h2>
            <p className="text-muted-foreground text-base mt-4">
              Browse our most-loved categories and start exploring today
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.name}
                  to={`/courses?category=${encodeURIComponent(cat.name)}`}
                  style={{ animationDelay: `${idx * 0.08}s`, opacity: 0 }}
                  className="group animate-fade-in-up"
                >
                  <TiltCard className={`${cat.bg} rounded-3xl p-6 h-40 flex flex-col items-center justify-center text-center gap-3 hover:shadow-2xl transition-shadow`}>
                    <div className="w-14 h-14 rounded-2xl bg-card/70 backdrop-blur flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                      <Icon className={`w-7 h-7 ${cat.iconColor}`} />
                    </div>
                    <span className="text-sm font-semibold text-foreground doodle-underline">
                      {cat.name}
                    </span>
                  </TiltCard>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FEATURED COURSES ─── */}
      <section className="py-16 lg:py-24 bg-muted/40 relative overflow-hidden">
        <Squiggle className="hidden md:block absolute top-12 right-[8%] w-24 h-6 text-secondary/40" aria-hidden />
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div className="max-w-xl">
              <p className="text-sm uppercase tracking-[0.2em] text-secondary font-semibold mb-3">— Featured</p>
              <h2 className="font-heading font-bold text-4xl md:text-5xl text-foreground leading-tight">
                Hand-picked{" "}
                <span className="font-display italic font-light text-primary">courses</span>
              </h2>
              <p className="text-muted-foreground text-base mt-3">
                Curated for quality, taught by industry experts
              </p>
            </div>
            <Link
              to="/courses"
              className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-secondary transition-colors group"
            >
              View all courses
              <ArrowDoodle className="w-10 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-card animate-pulse rounded-2xl border border-border" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No featured courses yet. Check back soon!</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0 sm:snap-none">
              {courses.map((course, idx) => (
                <div
                  key={course.id}
                  style={{ animationDelay: `${idx * 0.1}s`, opacity: 0 }}
                  className="animate-fade-in-up w-[78vw] max-w-[300px] shrink-0 snap-start sm:w-auto sm:max-w-none"
                >
                  <CourseCard
                    course={course}
                    isEnrolled={isEnrolled(course.id)}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link to="/courses">
              <Button variant="outline" className="font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                View All Courses <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── WHY SCRAAD ─── */}
      <section className="py-16 lg:py-24 bg-background">
        <div ref={whyRef} className="container mx-auto px-4 reveal-on-scroll">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-sm uppercase tracking-[0.2em] text-secondary font-semibold mb-3">— Why us</p>
            <h2 className="font-heading font-bold text-4xl md:text-5xl text-foreground leading-tight">
              Built for{" "}
              <span className="font-display italic font-light text-primary">real growth</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Clock, title: "Self-Paced", desc: "Learn on your own schedule, anywhere", bg: "bg-pastel-sky" },
              { icon: Award, title: "Recognized Certificates", desc: "Earn credentials valued by employers", bg: "bg-pastel-cream" },
              { icon: TrendingUp, title: "Progress Tracking", desc: "Detailed analytics on your journey", bg: "bg-pastel-mint" },
              { icon: BookOpen, title: "Hands-on Projects", desc: "Real-world projects, real-world skills", bg: "bg-pastel-peach" },
            ].map((f, i) => (
              <TiltCard key={i} intensity={5}>
                <Card className={`${f.bg} border-0 hover:shadow-2xl transition-all duration-500 group rounded-3xl h-full`}>
                  <CardContent className="p-7">
                    <div className="w-14 h-14 rounded-2xl bg-card/70 backdrop-blur flex items-center justify-center mb-5 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                      <f.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-lg mb-2 text-foreground">{f.title}</h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CORPORATE CTA ─── */}
      <section className="py-16 lg:py-24 bg-muted/40">
        <div ref={ctaRef} className="container mx-auto px-4 reveal-on-scroll">
          <div className="bg-primary rounded-[2rem] overflow-hidden relative group shadow-2xl">
            <div className="absolute -top-32 -right-20 w-96 h-96 bg-secondary/30 blur-3xl blob-1 pointer-events-none" />
            <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-accent/40 blur-3xl blob-2 pointer-events-none" />
            <div className="grid lg:grid-cols-2 items-center relative">
              <div className="p-8 lg:p-14 space-y-6">
                <div className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs font-medium text-primary-foreground">
                  <Users className="w-3.5 h-3.5" />
                  ScraAD for Business
                </div>
                <h2 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl leading-tight text-primary-foreground">
                  Upskill your{" "}
                  <span className="font-display italic font-light text-secondary">entire team</span>
                </h2>
                <p className="text-primary-foreground/80 text-base leading-relaxed max-w-md">
                  Unlimited access to courses, learning paths, and analytics. Help your organisation stay competitive in a changing world.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold h-12 px-7 shadow-2xl magnetic-btn group/btn rounded-xl"
                  >
                    Request a Demo
                    <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium h-12 px-7 shadow-2xl magnetic-btn rounded-xl"
                  >
                    View Plans
                  </Button>
                </div>
              </div>
              <div className="h-56 lg:h-full overflow-hidden lg:rounded-l-[3rem]">
                <img
                  src={teamTraining}
                  alt="Business teams training"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-16 lg:py-24 bg-background relative overflow-hidden">
        <Quote className="absolute top-12 left-1/2 -translate-x-1/2 w-32 h-32 text-secondary/10 -scale-x-100" aria-hidden />
        <div ref={testimonialsRef} className="container mx-auto px-4 relative reveal-on-scroll">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-sm uppercase tracking-[0.2em] text-secondary font-semibold mb-3">— Testimonials</p>
            <h2 className="font-heading font-bold text-4xl md:text-5xl text-foreground leading-tight">
              Loved by{" "}
              <span className="font-display italic font-light text-primary">learners</span>
            </h2>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible md:pb-0 max-w-6xl mx-auto px-1">
            {testimonials.map((t, i) => (
              <Card
                key={i}
                style={{ animationDelay: `${i * 0.15}s`, opacity: 0 }}
                className="border border-border bg-card hover:shadow-2xl hover:-translate-y-2 hover:border-secondary/40 transition-all duration-500 ease-out min-w-[80vw] max-w-[80vw] shrink-0 snap-start md:min-w-0 md:max-w-none animate-fade-in-up group rounded-2xl"
              >
                <CardContent className="p-7">
                  <Quote className="w-9 h-9 text-secondary/50 mb-4 -scale-x-100" />
                  <p className="font-display italic text-lg text-foreground leading-relaxed mb-6">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3 pt-5 border-t border-border">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-11 h-11 rounded-full bg-muted ring-2 ring-transparent group-hover:ring-secondary/50 transition-all"
                    />
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

      {/* ─── FINAL CTA ─── */}
      <section className="aurora-bg relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary/20 blur-3xl blob-1 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/30 blur-3xl blob-2 pointer-events-none" />
        <Sparkle className="hidden md:block absolute top-12 left-[15%] w-6 h-6 text-secondary animate-bounce-soft" aria-hidden />
        <StarBurst className="hidden md:block absolute bottom-12 right-[15%] w-7 h-7 text-warning/60 animate-spin" style={{ animationDuration: "10s" }} aria-hidden />

        <div className="container mx-auto px-4 py-20 lg:py-28 text-center space-y-6 relative z-10 max-w-3xl">
          <h2 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-primary-foreground leading-tight">
            Start learning{" "}
            <span className="font-display italic font-light text-secondary">today</span>
          </h2>
          <p className="text-primary-foreground/80 text-base md:text-lg max-w-xl mx-auto">
            Join ScraAD and gain the skills to advance your career, earn certificates, and learn from the best.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              size="lg"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold h-14 px-9 shadow-2xl magnetic-btn group rounded-2xl text-base"
              asChild
            >
              <Link to="/auth">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
