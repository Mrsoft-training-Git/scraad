import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Clock, Users, Award, BookOpen, CheckCircle } from "lucide-react";

const Programs = () => {
  const programs = [
    {
      title: "Bachelor of Science in Computer Science",
      duration: "4 Years",
      students: "500+",
      level: "Undergraduate",
      description: "Master the fundamentals of computing, programming, and software development.",
      highlights: ["Data Structures", "AI & Machine Learning", "Web Development", "Database Systems"]
    },
    {
      title: "Master of Business Administration (MBA)",
      duration: "2 Years",
      students: "300+",
      level: "Postgraduate",
      description: "Develop leadership skills and business acumen for executive roles.",
      highlights: ["Strategic Management", "Financial Analysis", "Marketing", "Entrepreneurship"]
    },
    {
      title: "Bachelor of Arts in Mass Communication",
      duration: "4 Years",
      students: "450+",
      level: "Undergraduate",
      description: "Learn journalism, broadcasting, and digital media production.",
      highlights: ["Journalism", "Broadcasting", "Digital Media", "Public Relations"]
    },
    {
      title: "Master of Science in Environmental Science",
      duration: "2 Years",
      students: "200+",
      level: "Postgraduate",
      description: "Study environmental conservation, sustainability, and climate science.",
      highlights: ["Climate Change", "Conservation", "Sustainability", "Policy Analysis"]
    },
    {
      title: "Bachelor of Engineering in Petroleum Engineering",
      duration: "5 Years",
      students: "350+",
      level: "Undergraduate",
      description: "Gain expertise in oil and gas exploration, production, and management.",
      highlights: ["Drilling", "Production", "Reservoir Engineering", "Safety Management"]
    },
    {
      title: "Doctor of Philosophy (Ph.D.) Programs",
      duration: "3-5 Years",
      students: "150+",
      level: "Doctoral",
      description: "Conduct advanced research across various disciplines.",
      highlights: ["Research Methods", "Publication", "Teaching", "Innovation"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/10 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <GraduationCap className="w-4 h-4 mr-1" />
              Academic Programs
            </Badge>
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-foreground mb-6">
              Explore Our
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Degree Programs
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Choose from our wide range of undergraduate, postgraduate, and doctoral programs 
              designed to prepare you for success in your chosen field.
            </p>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6 hover:shadow-xl transition-all group">
                <Badge variant="secondary" className="mb-4">
                  {program.level}
                </Badge>
                <h3 className="font-heading text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {program.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {program.description}
                </p>
                
                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {program.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {program.students} students
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {program.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>

                <Button className="w-full" variant="outline" asChild>
                  <Link to="/auth">Apply Now</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-4xl font-bold text-center text-foreground mb-12">
            Why Choose Our Programs?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                Accredited Programs
              </h3>
              <p className="text-muted-foreground">
                All programs are nationally accredited and recognized globally
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                Expert Faculty
              </h3>
              <p className="text-muted-foreground">
                Learn from experienced professors and industry professionals
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                Career Support
              </h3>
              <p className="text-muted-foreground">
                Access job placement assistance and career counseling services
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
              Ready to Start Your Academic Journey?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Apply now and join thousands of successful graduates from the University of Port Harcourt.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth">Apply Now</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Download Brochure
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
