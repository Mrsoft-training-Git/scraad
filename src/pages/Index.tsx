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
      <section className="relative bg-gradient-to-br from-primary to-primary/90 text-primary-foreground py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="font-heading font-bold text-4xl lg:text-6xl leading-tight mb-6">
                Take a Professional Course and be{" "}
                <span className="text-accent">Exceptional</span>
              </h1>
              <p className="text-lg lg:text-xl mb-8 opacity-90 max-w-xl">
                An e-learning platform focussed on delivering balanced and quality education at your own pace and convenience.
              </p>
              
              <div className="bg-sidebar-accent/20 backdrop-blur-sm border border-primary-foreground/20 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                  <p className="text-sm">
                    This is to inform all prospective students that this application is fully available to carter for your personalized and self-paced learning needs.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                  Explore Courses <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground/30 hover:bg-primary-foreground/10 font-semibold">
                  Learn More
                </Button>
              </div>
            </div>

            <div className="relative animate-scale-in">
              <img
                src={heroStudent}
                alt="Diverse students learning together"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl lg:text-5xl mb-4">
              Our strategy to help you make the most of your{" "}
              <span className="text-accent">learning experience</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-heading font-bold text-xl mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="font-heading font-bold text-3xl lg:text-4xl mb-3">Pick your interest</h2>
            <p className="text-muted-foreground text-lg">
              List of courses from different disciplines and choose your course that meet your educational needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {courses.map((course, index) => (
              <Card key={index} className="overflow-hidden border-none shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group">
                <div className="aspect-video overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold text-lg mb-3 line-clamp-2">{course.title}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-accent">{course.price}</span>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {course.students}
                      </span>
                      <span className="flex items-center gap-1">
                        👍 {course.likes}
                      </span>
                    </div>
                  </div>
                  <Button className="w-full bg-accent hover:bg-accent/90" size="sm">
                    Create account
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button variant="default" size="lg" className="bg-primary hover:bg-primary/90">
              Explore more courses <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Corporate Training CTA */}
      <section className="py-16 lg:py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img
                src={businessTraining}
                alt="Professional business training"
                className="rounded-2xl shadow-2xl"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="font-heading font-bold text-3xl lg:text-5xl mb-6">
                Take your business to the next level by empowering your workforce with the latest tresnds on their fields
              </h2>
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                Subscribe to our business package <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-heading font-bold text-3xl lg:text-4xl mb-12 text-center">
            What learners are saying about our platform
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-none shadow-card">
                <CardContent className="p-8">
                  <p className="text-muted-foreground mb-6 text-lg leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full bg-muted"
                    />
                    <div>
                      <div className="font-heading font-bold">{testimonial.name}</div>
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
