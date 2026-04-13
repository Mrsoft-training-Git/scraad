import { useState, useEffect } from "react";
import { AboutCourseSection } from "@/components/AboutCourseSection";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users, Award, CheckCircle, BookOpen, ArrowLeft, Share2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  description: string | null;
  overview: string | null;
  price: number;
  image_url: string | null;
  category: string;
  instructor: string | null;
  duration: string | null;
  students_count: number;
  level: string | null;
  what_you_learn: string[];
  requirements: string[];
  syllabus: any;
  allows_part_payment: boolean;
  first_tranche_amount: number | null;
  second_tranche_amount: number | null;
}

const CourseDetails = () => {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expandedOverview, setExpandedOverview] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({ title: "Link copied!", description: "Course link has been copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", description: "Please try again.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (id) fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .eq("published", true)
      .single();
    if (!error && data) setCourse(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading course details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Course Not Found</h2>
          <p className="text-muted-foreground mb-8">The course you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/courses"><ArrowLeft className="w-4 h-4 mr-2" />Back to Courses</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link to="/courses"><ArrowLeft className="w-4 h-4 mr-2" />Back to Courses</Link>
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div>
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                {course.category}
              </Badge>
              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">{course.title}</h1>
              {course.overview && (
                <div className="mb-6">
                  <p className={`text-xl text-muted-foreground ${!expandedOverview ? "line-clamp-6" : ""}`}>
                    {course.overview}
                  </p>
                  {course.overview.length > 300 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedOverview(!expandedOverview)}
                      className="mt-2 p-0 h-auto text-primary hover:text-primary/80 font-medium"
                    >
                      {expandedOverview ? (
                        <>Show Less <ChevronUp className="w-4 h-4 ml-1" /></>
                      ) : (
                        <>Show More <ChevronDown className="w-4 h-4 ml-1" /></>
                      )}
                    </Button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-6 mb-6">
                {course.duration && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-5 h-5" /><span>{course.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-5 h-5" /><span>{course.students_count}+ enrolled</span>
                </div>
                {course.level && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Award className="w-5 h-5" /><span>{course.level}</span>
                  </div>
                )}
              </div>

              {course.instructor && (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">Instructor:</p>
                  <p className="font-semibold">{course.instructor}</p>
                </div>
              )}

              <div className="flex items-baseline gap-4">
                {course.price === 0 ? (
                  <Badge className="bg-success/10 text-success border-success/20 text-2xl px-4 py-2">Free</Badge>
                ) : (
                  <span className="text-4xl font-bold text-primary">₦{course.price.toLocaleString()}</span>
                )}
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={course.image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80"}
                alt={course.title}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Course Details */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                  <TabsTrigger value="requirements">Requirements</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8 mt-8">
                  {course.what_you_learn && course.what_you_learn.length > 0 && (
                    <div>
                      <h2 className="font-heading text-2xl font-bold mb-4">What You'll Learn</h2>
                      <div className="grid md:grid-cols-2 gap-4">
                        {course.what_you_learn.map((item, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                            <span className="text-muted-foreground">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <AboutCourseSection description={course.description} />
                </TabsContent>

                <TabsContent value="curriculum" className="mt-8">
                  <h2 className="font-heading text-2xl font-bold mb-6">Course Curriculum</h2>
                  {course.syllabus && Array.isArray(course.syllabus) && course.syllabus.length > 0 ? (
                    <div className="space-y-6">
                      {course.syllabus.map((module: any, index: number) => (
                        <div key={index} className="border-l-4 border-primary/30 pl-4">
                          <h3 className="font-heading font-bold text-lg mb-2">
                            Module {index + 1}: {module.title || module.name || `Module ${index + 1}`}
                          </h3>
                          {module.description && (
                            <div
                              className="text-muted-foreground text-sm mb-3 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: module.description
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                  .replace(/^- (.*)$/gm, '<li>$1</li>')
                                  .replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside">$1</ul>')
                                  .replace(/\n/g, '<br/>')
                              }}
                            />
                          )}
                          {module.topics && Array.isArray(module.topics) && module.topics.length > 0 && (
                            <div className="ml-2">
                              <p className="text-sm font-medium text-muted-foreground mb-2">Topics:</p>
                              <ol className="list-decimal list-inside space-y-1 ml-4">
                                {module.topics.map((topic: string, topicIndex: number) => (
                                  <li key={topicIndex} className="text-muted-foreground text-sm">{topic}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-border/50">
                      <CardContent className="p-8 text-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Detailed curriculum information will be available soon. Contact us for more details about the course structure.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="requirements" className="mt-8">
                  <h2 className="font-heading text-2xl font-bold mb-6">Requirements</h2>
                  {course.requirements && course.requirements.length > 0 ? (
                    <ul className="space-y-3">
                      {course.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-muted-foreground">{req}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Card className="border-border/50">
                      <CardContent className="p-8">
                        <p className="text-muted-foreground">
                          No specific prerequisites required. This course is designed to be accessible to learners at various skill levels.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Enrollment Card */}
            <div>
              <Card className="sticky top-6 border-border/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Price</p>
                      {course.price === 0 ? (
                        <Badge className="bg-success/10 text-success border-success/20 text-2xl px-4 py-2">Free</Badge>
                      ) : (
                        <p className="text-4xl font-bold text-primary">₦{course.price.toLocaleString()}</p>
                      )}
                      {course.allows_part_payment && course.first_tranche_amount && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Or pay in installments from ₦{course.first_tranche_amount.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg font-semibold py-6 text-lg"
                        asChild
                      >
                        <Link to={`/enroll/${course.id}`}>
                          {course.price === 0 ? "Enroll Free" : "Enroll Now"}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleShare}
                        className="h-auto py-6 px-4"
                        title="Share course"
                      >
                        {copied ? <Check className="w-5 h-5 text-success" /> : <Share2 className="w-5 h-5" />}
                      </Button>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="font-heading font-bold">This course includes:</h3>
                      <ul className="space-y-3">
                        {course.duration && (
                          <li className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Clock className="w-5 h-5 text-primary" />
                            <span>{course.duration} of learning</span>
                          </li>
                        )}
                        <li className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Award className="w-5 h-5 text-primary" />
                          <span>Certificate upon completion</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-muted-foreground">
                          <BookOpen className="w-5 h-5 text-primary" />
                          <span>Lifetime access to materials</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Users className="w-5 h-5 text-primary" />
                          <span>Join {course.students_count}+ learners</span>
                        </li>
                      </ul>
                    </div>
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

export default CourseDetails;
