import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Clock, Users, Award, BookOpen, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  instructor: string | null;
  duration: string | null;
  students_count: number;
  level: string | null;
}

const Programs = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/10 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Award className="w-4 h-4 mr-1" />
              Certificate Programs
            </Badge>
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-foreground mb-6">
              Professional
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Certificate Programs
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Fast-track your career with industry-relevant certificates. Perfect for working professionals, 
              career switchers, and anyone looking to upskill in tech and business.
            </p>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">Loading programs...</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">No programs available</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <Card key={course.id} className="group overflow-hidden border-border/50 bg-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col">
                  <div className="aspect-video overflow-hidden relative">
                    <Badge className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm text-primary border-0 z-10">
                      {course.category}
                    </Badge>
                    <img
                      src={course.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-6 flex flex-col flex-grow">
                    <h3 className="font-heading font-bold text-xl mb-3 group-hover:text-primary transition-colors min-h-[3.5rem]">
                      {course.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 text-sm line-clamp-2">
                      {course.description}
                    </p>
                    
                    {(course.duration || course.students_count > 0) && (
                      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                        {course.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {course.duration}
                          </div>
                        )}
                        {course.students_count > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {course.students_count}+
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-5 mt-auto">
                      <span className="text-2xl font-bold text-primary">₦{course.price.toLocaleString()}</span>
                    </div>

                    <div className="flex gap-3">
                      <Button className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/20 font-semibold" asChild>
                        <Link to="/auth">Apply Now</Link>
                      </Button>
                      <Button variant="outline" className="flex-1" asChild>
                        <Link to={`/programs/${course.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-4xl font-bold text-center text-foreground mb-12">
            Why Choose Our Certificate Programs?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                Fast-Track Learning
              </h3>
              <p className="text-muted-foreground">
                Complete programs in weeks, not years. Learn practical skills quickly
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                Industry-Relevant Skills
              </h3>
              <p className="text-muted-foreground">
                Learn from practitioners with real-world experience in tech and business
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                Recognized Certificates
              </h3>
              <p className="text-muted-foreground">
                Earn certificates valued by employers and boost your career prospects
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary to-accent rounded-2xl p-12 text-center text-white shadow-2xl">
            <h2 className="font-heading text-4xl font-bold mb-4">
              Ready to Advance Your Career?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Join thousands of professionals who have upskilled, switched careers, or launched businesses with our programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth">Enroll Now</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" asChild>
                <Link to="/courses">Browse All Courses</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Programs;
