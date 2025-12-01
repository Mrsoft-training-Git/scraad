import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users, Award, CheckCircle, Star, BookOpen, Video, FileText, Globe, Calendar } from "lucide-react";

const ProgramDetails = () => {
  const { id } = useParams();

  // Program data
  const programData: Record<string, any> = {
    "full-stack-web-dev": {
      title: "Full Stack Web Development",
      duration: "12 Weeks",
      students: "2,500+",
      level: "Tech Skills",
      price: "₦150,000",
      rating: 4.8,
      reviews: 342,
      description: "Build modern web applications with React, Node.js, and databases. Perfect for career switchers looking to enter the tech industry with in-demand skills.",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80",
      instructor: "Dr. Sarah Johnson",
      instructorImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      instructorBio: "Senior Full Stack Developer with 10+ years of experience at leading tech companies.",
      highlights: ["React & TypeScript", "Backend APIs", "Database Design", "Deployment & DevOps"],
      skills: ["JavaScript/TypeScript", "React.js", "Node.js", "Express", "PostgreSQL", "MongoDB", "Git & GitHub", "AWS Deployment"],
      modules: [
        { title: "Introduction to Web Development", lessons: 8, duration: "4 hours" },
        { title: "Frontend with React & TypeScript", lessons: 12, duration: "8 hours" },
        { title: "Backend Development with Node.js", lessons: 10, duration: "7 hours" },
        { title: "Database Design & Management", lessons: 9, duration: "6 hours" },
        { title: "API Development & Integration", lessons: 11, duration: "7 hours" },
        { title: "Deployment & DevOps", lessons: 7, duration: "5 hours" },
        { title: "Capstone Project", lessons: 5, duration: "10 hours" }
      ],
      requirements: [
        "Basic understanding of HTML and CSS",
        "Computer with internet connection",
        "Willingness to learn and practice coding",
        "No prior programming experience required"
      ],
      learningOutcomes: [
        "Build full-stack web applications from scratch",
        "Master modern JavaScript frameworks like React",
        "Design and implement RESTful APIs",
        "Work with both SQL and NoSQL databases",
        "Deploy applications to cloud platforms",
        "Follow industry best practices and coding standards"
      ]
    },
    "data-science-analytics": {
      title: "Data Science & Analytics",
      duration: "16 Weeks",
      students: "1,800+",
      level: "Tech Skills",
      price: "₦180,000",
      rating: 4.9,
      reviews: 287,
      description: "Master data analysis, visualization, and machine learning to extract insights from complex datasets and drive business decisions.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
      instructor: "Prof. Michael Chen",
      instructorImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      instructorBio: "Data Scientist and AI researcher with expertise in machine learning and statistical modeling.",
      highlights: ["Python & SQL", "Data Visualization", "Machine Learning", "Business Intelligence"],
      skills: ["Python Programming", "Pandas & NumPy", "Data Visualization", "SQL", "Machine Learning", "Statistics", "Tableau/Power BI", "A/B Testing"],
      modules: [
        { title: "Python for Data Science", lessons: 10, duration: "6 hours" },
        { title: "Data Analysis with Pandas", lessons: 12, duration: "8 hours" },
        { title: "SQL & Database Querying", lessons: 9, duration: "6 hours" },
        { title: "Data Visualization", lessons: 11, duration: "7 hours" },
        { title: "Statistics & Probability", lessons: 13, duration: "9 hours" },
        { title: "Machine Learning Fundamentals", lessons: 15, duration: "12 hours" },
        { title: "Business Intelligence Tools", lessons: 8, duration: "5 hours" },
        { title: "Capstone Analytics Project", lessons: 6, duration: "12 hours" }
      ],
      requirements: [
        "Basic mathematics knowledge",
        "Computer with at least 8GB RAM",
        "Interest in data and problem-solving",
        "No prior coding experience required"
      ],
      learningOutcomes: [
        "Analyze and interpret complex datasets",
        "Create compelling data visualizations",
        "Build predictive machine learning models",
        "Extract actionable business insights",
        "Master SQL for data querying",
        "Present findings to stakeholders effectively"
      ]
    },
    "digital-marketing": {
      title: "Digital Marketing Mastery",
      duration: "8 Weeks",
      students: "3,200+",
      level: "Business",
      price: "₦120,000",
      rating: 4.7,
      reviews: 451,
      description: "Learn SEO, social media marketing, and paid advertising strategies to grow businesses online and drive measurable results.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
      instructor: "Emma Rodriguez",
      instructorImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      instructorBio: "Digital Marketing Strategist who has helped 100+ businesses scale their online presence.",
      highlights: ["SEO & Content Marketing", "Social Media Strategy", "Google Ads", "Analytics & ROI"],
      skills: ["SEO Optimization", "Content Marketing", "Social Media Management", "Google Ads", "Facebook Ads", "Email Marketing", "Google Analytics", "Conversion Optimization"],
      modules: [
        { title: "Digital Marketing Foundations", lessons: 7, duration: "4 hours" },
        { title: "SEO & Content Strategy", lessons: 10, duration: "6 hours" },
        { title: "Social Media Marketing", lessons: 12, duration: "8 hours" },
        { title: "Paid Advertising (Google & Facebook)", lessons: 11, duration: "7 hours" },
        { title: "Email Marketing & Automation", lessons: 8, duration: "5 hours" },
        { title: "Analytics & Performance Tracking", lessons: 9, duration: "6 hours" },
        { title: "Marketing Campaign Project", lessons: 5, duration: "8 hours" }
      ],
      requirements: [
        "Basic internet and computer skills",
        "Interest in marketing and business growth",
        "No prior marketing experience required",
        "Access to social media platforms"
      ],
      learningOutcomes: [
        "Develop comprehensive digital marketing strategies",
        "Optimize websites for search engines",
        "Create and manage effective social media campaigns",
        "Run profitable paid advertising campaigns",
        "Track and analyze marketing performance",
        "Build and nurture email marketing lists"
      ]
    }
  };

  const program = programData[id || ""] || programData["full-stack-web-dev"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-16 bg-foreground text-background overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-accent text-white border-0">
                {program.level}
              </Badge>
              <h1 className="font-heading text-4xl md:text-5xl font-bold">
                {program.title}
              </h1>
              <p className="text-lg text-background/80">
                {program.description}
              </p>
              
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-warning text-warning" />
                  <span className="font-bold">{program.rating}</span>
                  <span className="text-background/60">({program.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{program.students} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{program.duration}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <span className="text-4xl font-bold">{program.price}</span>
              </div>

              <div className="flex gap-4 pt-4">
                <Button size="lg" className="bg-white text-foreground hover:bg-white/90 font-semibold" asChild>
                  <Link to="/auth">Enroll Now</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-white/30 hover:bg-white/10 text-white" asChild>
                  <Link to="/programs">Back to Programs</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-accent/30 rounded-3xl blur-2xl"></div>
              <img
                src={program.image}
                alt={program.title}
                className="relative rounded-2xl shadow-2xl ring-1 ring-white/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                  <TabsTrigger value="instructor">Instructor</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 mt-8">
                  <div>
                    <h2 className="font-heading text-2xl font-bold mb-4">What You'll Learn</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {program.learningOutcomes.map((outcome: string, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                          <span className="text-muted-foreground">{outcome}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="font-heading text-2xl font-bold mb-4">Skills You'll Gain</h2>
                    <div className="flex flex-wrap gap-2">
                      {program.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-sm py-2 px-4">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="font-heading text-2xl font-bold mb-4">Requirements</h2>
                    <ul className="space-y-3">
                      {program.requirements.map((req: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                          <span className="text-muted-foreground">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="curriculum" className="mt-8">
                  <h2 className="font-heading text-2xl font-bold mb-6">Course Curriculum</h2>
                  <div className="space-y-4">
                    {program.modules.map((module: any, index: number) => (
                      <Card key={index} className="border-border/50">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-heading font-bold text-lg mb-2">
                                Module {index + 1}: {module.title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Video className="w-4 h-4" />
                                  {module.lessons} lessons
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {module.duration}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="instructor" className="mt-8">
                  <Card className="border-border/50">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-6">
                        <img
                          src={program.instructorImage}
                          alt={program.instructor}
                          className="w-24 h-24 rounded-full ring-2 ring-primary/20"
                        />
                        <div className="flex-1">
                          <h2 className="font-heading text-2xl font-bold mb-2">{program.instructor}</h2>
                          <p className="text-muted-foreground mb-4">{program.instructorBio}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-warning text-warning" />
                              <span className="font-semibold">{program.rating} instructor rating</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{program.students} students</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="mt-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-5xl font-bold mb-2">{program.rating}</div>
                        <div className="flex gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">{program.reviews} reviews</div>
                      </div>
                    </div>

                    <div className="space-y-6 mt-8">
                      {[
                        { name: "John Doe", rating: 5, date: "2 weeks ago", text: "Excellent course! The instructor explains everything clearly and the projects are very practical." },
                        { name: "Jane Smith", rating: 5, date: "1 month ago", text: "Best investment I've made in my career. Landed a job within 3 months of completing this program!" },
                        { name: "Mike Johnson", rating: 4, date: "1 month ago", text: "Great content and well-structured. Would have loved more advanced topics but overall very satisfied." }
                      ].map((review, index) => (
                        <Card key={index} className="border-border/50">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.name}`}
                                alt={review.name}
                                className="w-12 h-12 rounded-full"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold">{review.name}</h4>
                                  <span className="text-sm text-muted-foreground">{review.date}</span>
                                </div>
                                <div className="flex gap-1 mb-2">
                                  {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                                  ))}
                                </div>
                                <p className="text-muted-foreground">{review.text}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-border/50 sticky top-4">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="font-heading font-bold text-xl mb-4">This program includes:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <Video className="w-5 h-5 text-primary" />
                        <span className="text-sm">47 hours video content</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="text-sm">Downloadable resources</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-primary" />
                        <span className="text-sm">Lifetime access</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-primary" />
                        <span className="text-sm">Certificate of completion</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span className="text-sm">Flexible schedule</span>
                      </li>
                    </ul>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg font-semibold" size="lg" asChild>
                    <Link to="/auth">Enroll Now</Link>
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    30-Day Money-Back Guarantee
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProgramDetails;
