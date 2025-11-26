import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Award, BookOpen, Clock, GraduationCap, TrendingUp, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import heroStudent from "@/assets/hero-student.jpg";
import businessTraining from "@/assets/business-training.jpg";

const Index = () => {
  const courses = [
    {
      title: "E-Business Model",
      price: "₦40,000",
      students: 1,
      likes: 0,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    },
    {
      title: "National Sustainable and Entrepreneurship Program (NSEP)",
      price: "₦40,000",
      students: 2,
      likes: 1,
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
    },
    {
      title: "Resource Acquisition",
      price: "₦35,000",
      students: 0,
      likes: 0,
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    },
    {
      title: "Human Resource and Management",
      price: "₦40,300",
      students: 13,
      likes: 0,
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
    },
  ];

  const features = [
    {
      icon: Clock,
      title: "Self-Paced Learning",
      description: "Learn at your own convenience with flexible access to course materials anytime, anywhere. No deadlines just your own pace!",
    },
    {
      icon: Award,
      title: "Certificate",
      description: "Receive a professionally recognized certificate upon successful course completion to validate your skills and boost your career profile.",
    },
    {
      icon: TrendingUp,
      title: "Progress Report",
      description: "Stay informed with real-time progress tracking. Monitor your performance and milestones as you move through each module",
    },
    {
      icon: BookOpen,
      title: "Hands on Training",
      description: "Apply what you learn through interactive exercises and practical projects that simulate real-world scenarios.",
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
      <section className="relative bg-hero-gradient text-white py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                Trusted by 10,000+ learners worldwide
              </div>
              
              <h1 className="font-heading font-bold text-5xl lg:text-7xl leading-tight">
                Master New Skills,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80">
                  Transform Your Career
                </span>
              </h1>
              
              <p className="text-lg lg:text-xl text-white/90 max-w-xl leading-relaxed">
                Learn at your own pace with industry-recognized courses designed by experts. Get certified and advance your career with practical, hands-on training.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold shadow-xl h-14 px-8 text-lg">
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-white/30 hover:bg-white/10 text-white font-semibold h-14 px-8 backdrop-blur-sm">
                  View Programs
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="font-heading font-bold text-3xl">50+</div>
                  <div className="text-sm text-white/80">Expert Courses</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div>
                  <div className="font-heading font-bold text-3xl">95%</div>
                  <div className="text-sm text-white/80">Success Rate</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div>
                  <div className="font-heading font-bold text-3xl">24/7</div>
                  <div className="text-sm text-white/80">Learning Access</div>
                </div>
              </div>
            </div>

            <div className="relative animate-scale-in">
              <div className="absolute -inset-4 bg-gradient-to-r from-white/20 to-white/5 rounded-3xl blur-2xl"></div>
              <img
                src={heroStudent}
                alt="Students engaging in modern online learning"
                className="relative rounded-3xl shadow-2xl ring-1 ring-white/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="font-heading font-bold text-4xl lg:text-5xl mb-6">
              Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">ODEL</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Experience a learning platform designed for your success with features that adapt to your goals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group border-border/50 bg-card-gradient hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8 text-center relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-heading font-bold text-xl mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="font-heading font-bold text-4xl lg:text-5xl mb-4">
              Featured <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Courses</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover courses from top instructors across various disciplines. Start learning today and transform your future.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {courses.map((course, index) => (
              <Card key={index} className="group overflow-hidden border-border/50 bg-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                <div className="aspect-video overflow-hidden relative">
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary z-10">
                    Popular
                  </div>
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                      Business
                    </div>
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-4 line-clamp-2 group-hover:text-primary transition-colors">{course.title}</h3>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-2xl font-bold text-primary">{course.price}</span>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {course.students}
                      </span>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg shadow-primary/20 font-semibold">
                    Enroll Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 shadow-xl font-semibold px-8">
              View All Courses <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Corporate Training CTA */}
      <section className="py-20 lg:py-32 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-accent/30 rounded-3xl blur-2xl"></div>
                <img
                  src={businessTraining}
                  alt="Professional business training for teams"
                  className="relative rounded-3xl shadow-2xl ring-1 ring-white/20"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                <Users className="w-4 h-4" />
                For Teams & Organizations
              </div>
              <h2 className="font-heading font-bold text-4xl lg:text-5xl leading-tight">
                Empower Your Workforce with World-Class Training
              </h2>
              <p className="text-lg text-background/80 leading-relaxed">
                Scale your team's skills with customized learning paths, progress tracking, and expert-led courses. Stay ahead in your industry with continuous upskilling programs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-white text-foreground hover:bg-white/90 font-semibold shadow-xl h-14 px-8">
                  Request Demo <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-white/30 hover:bg-white/10 text-white font-semibold h-14 px-8 backdrop-blur-sm">
                  View Plans
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="font-heading font-bold text-4xl lg:text-5xl mb-6">
              Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Learners Worldwide</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of students and professionals transforming their careers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border/50 bg-card-gradient hover:shadow-card-hover transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-warning" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-foreground mb-6 text-lg leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full ring-2 ring-primary/20"
                    />
                    <div>
                      <div className="font-heading font-bold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
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
