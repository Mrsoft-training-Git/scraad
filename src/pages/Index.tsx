import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Award, BookOpen, Clock, GraduationCap, TrendingUp, Users, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import heroStudent from "@/assets/hero-student.jpg";
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
}

const Index = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedCourses();
    checkEnrollmentStatus();
  }, []);

  const checkEnrollmentStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      .limit(4);

    if (!error && data) {
      setCourses(data);
    }
    setLoading(false);
  };

  const features = [
    {
      icon: Clock,
      title: "Self-Paced Learning",
      description:
        "Learn at your own convenience with flexible access to course materials anytime, anywhere. No deadlines just your own pace!",
    },
    {
      icon: Award,
      title: "Certificate",
      description:
        "Receive a professionally recognized certificate upon successful course completion to validate your skills and boost your career profile.",
    },
    {
      icon: TrendingUp,
      title: "Progress Report",
      description:
        "Stay informed with real-time progress tracking. Monitor your performance and milestones as you move through each module",
    },
    {
      icon: BookOpen,
      title: "Hands on Training",
      description:
        "Apply what you learn through interactive exercises and practical projects that simulate real-world scenarios.",
    },
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
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-hero-gradient text-white py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            {/* Left Hero */}
            <div className="animate-fade-in space-y-4 flex flex-col justify-center bg-white/5 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium w-fit">
                <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                Trusted by 10,000+ learners
              </div>

              <h2 className="font-heading font-bold text-2xl lg:text-3xl leading-tight">Master New Skills</h2>

              <p className="text-sm lg:text-base text-white/90 leading-relaxed">
                Learn at your own pace with industry-recognized courses designed by experts.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold shadow-xl" asChild>
                  <Link to="/auth">
                    Get Started Free <ArrowRight className="ml-2 w-3 h-3" />
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div>
                  <div className="font-heading font-bold text-xl">50+</div>
                  <div className="text-xs text-white/80">Courses</div>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div>
                  <div className="font-heading font-bold text-xl">95%</div>
                  <div className="text-xs text-white/80">Success</div>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div>
                  <div className="font-heading font-bold text-xl">24/7</div>
                  <div className="text-xs text-white/80">Access</div>
                </div>
              </div>
            </div>

            {/* Right Hero */}
            <div className="animate-fade-in space-y-4 flex flex-col justify-center bg-white/5 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium w-fit">
                <GraduationCap className="w-3 h-3" />
                Career Advancement
              </div>

              <h2 className="font-heading font-bold text-2xl lg:text-3xl leading-tight">Transform Your Career</h2>

              <p className="text-sm lg:text-base text-white/90 leading-relaxed">
                Get certified and advance your career with practical, hands-on training.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-2 border-white/30 bg-transparent hover:bg-white/10 text-white font-semibold backdrop-blur-sm"
                  asChild
                >
                  <Link to="/courses">View Programs</Link>
                </Button>
              </div>

              <div className="relative animate-scale-in mt-4">
                <div className="absolute -inset-2 bg-gradient-to-r from-white/20 to-white/5 rounded-xl blur-lg"></div>
                <img
                  src={heroStudent}
                  alt="Students engaging in modern online learning"
                  className="relative rounded-xl shadow-lg ring-1 ring-white/20 w-full h-48 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12 max-w-2xl mx-auto">
            <h2 className="font-heading font-bold text-2xl md:text-3xl lg:text-4xl mb-3">
              Why Choose{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Cradua</span>
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Experience a learning platform designed for your success with features that adapt to your goals
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group border-border/50 bg-card-gradient hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-4 md:p-6 text-center relative">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-bold text-sm md:text-lg mb-1 md:mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-xs md:text-sm hidden sm:block">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-12 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-8 md:mb-16 text-center">
            <h2 className="font-heading font-bold text-2xl md:text-4xl lg:text-5xl mb-3 md:mb-4">
              Featured{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Courses</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
              Discover courses from top instructors across various disciplines. Start learning today and transform your
              future.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">No featured courses yet</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-8 md:mb-12">
              {courses.map((course) => (
                <Card
                  key={course.id}
                  className="group overflow-hidden border-border/50 bg-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col"
                >
                  <div className="aspect-video overflow-hidden relative">
                    <div className="absolute top-3 md:top-4 right-3 md:right-4 bg-background/90 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full text-xs font-bold text-primary z-10">
                      Featured
                    </div>
                    <img
                      src={
                        course.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
                      }
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-4 md:p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-2 md:mb-3">
                      <div className="px-2 md:px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                        {course.category}
                      </div>
                    </div>
                    <h3 className="font-heading font-bold text-base md:text-lg mb-3 md:mb-4 line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem] md:min-h-[3.5rem]">
                      {course.title}
                    </h3>
                    <div className="flex items-center justify-between mb-4 md:mb-5 mt-auto">
                      {course.price === 0 ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-sm md:text-lg px-2 md:px-3 py-1">
                          Free
                        </Badge>
                      ) : (
                        <span className="text-lg md:text-2xl font-bold text-primary">
                          ₦{course.price.toLocaleString()}
                        </span>
                      )}
                      <div className="flex items-center gap-3 text-xs md:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 md:w-4 md:h-4" /> {course.students_count}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {isEnrolled(course.id) ? (
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs md:text-sm"
                          onClick={() => navigate("/dashboard/learning")}
                        >
                          Go to Course
                        </Button>
                      ) : (
                        <Button
                          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/20 font-semibold text-xs md:text-sm"
                          onClick={() => handleEnroll(course)}
                        >
                          Enroll Now
                        </Button>
                      )}
                      <Button variant="outline" className="border-2 hover:bg-accent/10 text-xs md:text-sm" asChild>
                        <Link to={`/programs/${course.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center">
            <Link to="/courses">
              <Button
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 shadow-xl font-semibold px-6 md:px-8 text-sm md:text-base"
              >
                View All Courses <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Corporate Training CTA */}
      <section className="py-12 lg:py-32 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-accent/30 rounded-3xl blur-2xl"></div>
                <img
                  src={businessTraining}
                  alt="Professional business training for teams"
                  className="relative rounded-2xl lg:rounded-3xl shadow-2xl ring-1 ring-white/20"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-4 md:space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium">
                <Users className="w-3 h-3 md:w-4 md:h-4" />
                For Teams & Organizations
              </div>
              <h2 className="font-heading font-bold text-2xl md:text-4xl lg:text-5xl leading-tight">
                Empower Your Workforce with World-Class Training
              </h2>
              <p className="text-sm md:text-lg text-background/80 leading-relaxed">
                Scale your team's skills with customized learning paths, progress tracking, and expert-led courses. Stay
                ahead in your industry with continuous upskilling programs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Button
                  size="lg"
                  className="bg-white text-foreground hover:bg-white/90 font-semibold shadow-xl h-12 md:h-14 px-6 md:px-8 text-sm md:text-base"
                >
                  Request Demo <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 hover:bg-white/10 text-white font-semibold h-12 md:h-14 px-6 md:px-8 backdrop-blur-sm text-sm md:text-base"
                >
                  View Plans
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-16 max-w-3xl mx-auto">
            <h2 className="font-heading font-bold text-2xl md:text-4xl lg:text-5xl mb-4 md:mb-6">
              Loved by{" "}
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Learners Worldwide
               </span>
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground">
              Join thousands of students and professionals transforming their careers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="border-border/50 bg-card-gradient hover:shadow-card-hover transition-all duration-300"
              >
                <CardContent className="p-4 md:p-8">
                  <div className="flex gap-1 mb-4 md:mb-6">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 md:w-5 md:h-5 fill-warning" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-foreground mb-4 md:mb-6 text-sm md:text-lg leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3 md:gap-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full ring-2 ring-primary/20"
                    />
                    <div>
                      <div className="font-heading font-bold text-foreground text-sm md:text-base">
                        {testimonial.name}
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
