import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, TrendingUp, Users, Shield, BarChart } from "lucide-react";

const BusinessTeams = () => {
  const benefits = [
    {
      icon: Users,
      title: "Team Management",
      description: "Easily manage and track your team's learning progress"
    },
    {
      icon: TrendingUp,
      title: "Skill Development",
      description: "Upskill your workforce with industry-relevant courses"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security and data protection for your organization"
    },
    {
      icon: BarChart,
      title: "Analytics & Reporting",
      description: "Comprehensive insights into team performance and progress"
    }
  ];

  const features = [
    "Dedicated account manager",
    "Customized learning paths",
    "Bulk enrollment and licensing",
    "Priority support 24/7",
    "Custom branding options",
    "Integration with HR systems",
    "Team performance analytics",
    "Flexible payment options"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-accent/5 via-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-foreground mb-6">
              Empower Your Team with
              <span className="block bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Corporate Training
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transform your organization with scalable, high-quality training solutions 
              designed to upskill your workforce and drive business growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-accent to-primary text-white hover:opacity-90 shadow-xl shadow-accent/30">
                Request Demo <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-4xl font-bold text-center text-foreground mb-12">
            Why Choose Corporate Training?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-4xl font-bold text-center text-foreground mb-12">
              Enterprise Features
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-foreground text-lg">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-4xl font-bold text-center text-foreground mb-12">
            Flexible Plans for Every Organization
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-8">
              <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Starter</h3>
              <p className="text-muted-foreground mb-6">Perfect for small teams</p>
              <div className="text-4xl font-bold text-foreground mb-6">5-20 <span className="text-lg font-normal">users</span></div>
              <Button variant="outline" className="w-full">Get Started</Button>
            </div>
            <div className="bg-gradient-to-br from-primary to-accent text-white rounded-xl p-8 shadow-xl scale-105">
              <h3 className="font-heading text-2xl font-bold mb-2">Professional</h3>
              <p className="text-white/90 mb-6">For growing businesses</p>
              <div className="text-4xl font-bold mb-6">21-100 <span className="text-lg font-normal">users</span></div>
              <Button variant="secondary" className="w-full">Get Started</Button>
            </div>
            <div className="bg-card border border-border rounded-xl p-8">
              <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Enterprise</h3>
              <p className="text-muted-foreground mb-6">For large organizations</p>
              <div className="text-4xl font-bold text-foreground mb-6">100+ <span className="text-lg font-normal">users</span></div>
              <Button variant="outline" className="w-full">Contact Sales</Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-accent to-primary rounded-2xl p-12 text-center text-white shadow-2xl">
            <h2 className="font-heading text-4xl font-bold mb-4">
              Ready to Transform Your Team?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Let's discuss how we can help your organization achieve its training goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth">Request Demo</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BusinessTeams;
