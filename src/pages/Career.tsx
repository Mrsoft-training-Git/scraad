import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Clock, DollarSign, ArrowRight } from "lucide-react";

const Career = () => {
  const jobs = [
    {
      title: "Academic Coordinator",
      department: "Distance Learning",
      location: "Port Harcourt, Nigeria",
      type: "Full-time",
      salary: "₦200,000 - ₦350,000",
      description: "Coordinate online learning programs and support student success."
    },
    {
      title: "Instructional Designer",
      department: "E-Learning",
      location: "Remote",
      type: "Contract",
      salary: "₦150,000 - ₦250,000",
      description: "Design engaging online course materials and learning experiences."
    },
    {
      title: "Student Success Advisor",
      department: "Student Services",
      location: "Port Harcourt, Nigeria",
      type: "Full-time",
      salary: "₦180,000 - ₦280,000",
      description: "Guide students through their academic journey and provide support."
    },
    {
      title: "Technical Support Specialist",
      department: "IT Services",
      location: "Hybrid",
      type: "Full-time",
      salary: "₦150,000 - ₦220,000",
      description: "Provide technical assistance to students and staff using online platforms."
    },
    {
      title: "Content Developer",
      department: "Academic Affairs",
      location: "Remote",
      type: "Part-time",
      salary: "₦100,000 - ₦180,000",
      description: "Create and curate educational content for online courses."
    },
    {
      title: "Marketing Manager",
      department: "Marketing & Communications",
      location: "Port Harcourt, Nigeria",
      type: "Full-time",
      salary: "₦250,000 - ₦400,000",
      description: "Lead marketing strategies to promote online programs and courses."
    }
  ];

  const benefits = [
    "Competitive salary packages",
    "Professional development opportunities",
    "Flexible working arrangements",
    "Health insurance coverage",
    "Annual leave and holidays",
    "Collaborative work environment"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/10 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Briefcase className="w-4 h-4 mr-1" />
              Join Our Team
            </Badge>
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-foreground mb-6">
              Build Your Career
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                With Us
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Join the University of Port Harcourt's distance learning team and help shape 
              the future of online education in Nigeria.
            </p>
          </div>
        </div>
      </section>

      {/* Jobs Listing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-4xl font-bold text-center text-foreground mb-12">
            Current Openings
          </h2>
          <div className="max-w-5xl mx-auto space-y-6">
            {jobs.map((job, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all group">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-heading text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <Badge variant="secondary">{job.type}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">{job.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {job.department}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {job.salary}
                      </div>
                    </div>
                  </div>
                  <Button className="lg:mt-4" asChild>
                    <Link to="/auth">
                      Apply Now <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-4xl font-bold text-center text-foreground mb-12">
              Why Work With Us?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 bg-card border border-border rounded-lg p-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-foreground text-lg">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary to-accent rounded-2xl p-12 text-center text-white shadow-2xl">
            <h2 className="font-heading text-4xl font-bold mb-4">
              Don't See a Role That Fits?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Send us your resume and we'll keep you in mind for future opportunities.
            </p>
            <Button size="lg" variant="secondary">
              Submit Your Resume
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Career;
