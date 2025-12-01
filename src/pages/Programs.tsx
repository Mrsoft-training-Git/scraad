import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Clock, Users, Award, BookOpen, CheckCircle } from "lucide-react";

const Programs = () => {
  const programs = [
    {
      title: "Full Stack Web Development",
      duration: "12 Weeks",
      students: "2,500+",
      level: "Tech Skills",
      description: "Build modern web applications with React, Node.js, and databases. Perfect for career switchers.",
      highlights: ["React & TypeScript", "Backend APIs", "Database Design", "Deployment & DevOps"]
    },
    {
      title: "Data Science & Analytics",
      duration: "16 Weeks",
      students: "1,800+",
      level: "Tech Skills",
      description: "Master data analysis, visualization, and machine learning for business insights.",
      highlights: ["Python & SQL", "Data Visualization", "Machine Learning", "Business Intelligence"]
    },
    {
      title: "Digital Marketing Mastery",
      duration: "8 Weeks",
      students: "3,200+",
      level: "Business",
      description: "Learn SEO, social media marketing, and paid advertising to grow businesses online.",
      highlights: ["SEO & Content Marketing", "Social Media Strategy", "Google Ads", "Analytics & ROI"]
    },
    {
      title: "Cybersecurity Fundamentals",
      duration: "10 Weeks",
      students: "1,400+",
      level: "Tech Skills",
      description: "Protect systems and networks from cyber threats. High-demand career path.",
      highlights: ["Network Security", "Ethical Hacking", "Risk Management", "Security Tools"]
    },
    {
      title: "Project Management Professional",
      duration: "8 Weeks",
      students: "2,100+",
      level: "Business",
      description: "Master agile and traditional project management methodologies for any industry.",
      highlights: ["Agile & Scrum", "Risk Management", "Stakeholder Management", "PMP Prep"]
    },
    {
      title: "Business Analytics & Strategy",
      duration: "12 Weeks",
      students: "1,900+",
      level: "Business",
      description: "Use data to drive strategic business decisions and competitive advantage.",
      highlights: ["Business Intelligence", "Strategic Planning", "Financial Analysis", "Market Research"]
    },
    {
      title: "Cloud Computing (AWS/Azure)",
      duration: "10 Weeks",
      students: "1,600+",
      level: "Tech Skills",
      description: "Deploy and manage scalable cloud infrastructure. Essential for modern tech careers.",
      highlights: ["Cloud Architecture", "AWS/Azure Services", "DevOps Practices", "Cost Optimization"]
    },
    {
      title: "Entrepreneurship & Startup Essentials",
      duration: "6 Weeks",
      students: "2,800+",
      level: "Business",
      description: "Learn to validate ideas, build MVPs, and launch successful businesses.",
      highlights: ["Business Planning", "MVP Development", "Fundraising", "Growth Strategies"]
    },
    {
      title: "UX/UI Design Professional",
      duration: "10 Weeks",
      students: "2,200+",
      level: "Tech Skills",
      description: "Design beautiful, user-centered digital experiences that convert.",
      highlights: ["User Research", "Wireframing & Prototyping", "Visual Design", "Usability Testing"]
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
