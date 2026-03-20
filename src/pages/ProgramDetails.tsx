import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, Calendar, ArrowLeft, Users, CheckCircle, Laptop, Building, Globe, Share2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProgramApplicationForm } from "@/components/programs/ProgramApplicationForm";
import { format } from "date-fns";

interface Program {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  banner_image_url: string | null;
  duration: string | null;
  mode: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  max_participants: number | null;
  requirements: string[];
  learning_outcomes: string[];
  schedule: any;
  instructor_name: string | null;
  price: number;
  allows_part_payment: boolean;
  first_tranche_amount: number | null;
}

const modeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  physical: { label: "Physical", icon: <Building className="w-4 h-4" /> },
  hybrid: { label: "Hybrid", icon: <Globe className="w-4 h-4" /> },
  online: { label: "Online", icon: <Laptop className="w-4 h-4" /> },
};

const ProgramDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchProgram();
      checkAuth();
    }
  }, [id]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user && id) {
      const { data } = await supabase
        .from("program_applications")
        .select("status")
        .eq("program_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setApplicationStatus(data.status);
    }
  };

  const fetchProgram = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .eq("id", id)
      .single();
    if (!error && data) setProgram(data as Program);
    setLoading(false);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({ title: "Link copied!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setShowApplicationForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>
        <Footer />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Program Not Found</h2>
          <Button asChild><Link to="/programs"><ArrowLeft className="w-4 h-4 mr-2" />Back to Programs</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const modeInfo = modeLabels[program.mode] || modeLabels.physical;
  const schedule = Array.isArray(program.schedule) ? program.schedule : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative">
        <div className="aspect-[3/1] md:aspect-[4/1] overflow-hidden">
          <img
            src={program.banner_image_url || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80"}
            alt={program.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
          <div className="container mx-auto">
            <Button variant="ghost" className="text-white/80 hover:text-white mb-4 -ml-3" asChild>
              <Link to="/programs"><ArrowLeft className="w-4 h-4 mr-2" />All Programs</Link>
            </Button>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="bg-white/20 backdrop-blur-sm border-white/20 text-white capitalize">
                {modeInfo.icon} <span className="ml-1">{modeInfo.label}</span>
              </Badge>
              <Badge className={`capitalize ${program.status === "open" ? "bg-green-500/80 text-white border-0" : program.status === "ongoing" ? "bg-secondary/80 text-white border-0" : "bg-white/20 text-white border-white/20"}`}>
                {program.status}
              </Badge>
            </div>
            <h1 className="font-heading text-3xl md:text-5xl font-bold mb-2">{program.title}</h1>
            {program.instructor_name && <p className="text-white/80">Instructor: {program.instructor_name}</p>}
          </div>
        </div>
      </section>

      {/* Key info bar */}
      <section className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
          {program.duration && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" />{program.duration}</span>}
          {program.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" />{program.location}</span>}
          {program.start_date && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" />Starts {format(new Date(program.start_date), "MMM d, yyyy")}</span>}
          {program.max_participants && <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" />Max {program.max_participants} participants</span>}
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="about">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="requirements">Requirements</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="mt-6 space-y-8">
                  {program.description && (
                    <div>
                      <h2 className="font-heading text-2xl font-bold mb-3">About This Program</h2>
                      <p className="text-muted-foreground whitespace-pre-line">{program.description}</p>
                    </div>
                  )}
                  {program.learning_outcomes && program.learning_outcomes.length > 0 && (
                    <div>
                      <h2 className="font-heading text-2xl font-bold mb-3">Learning Outcomes</h2>
                      <div className="grid md:grid-cols-2 gap-3">
                        {program.learning_outcomes.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="schedule" className="mt-6">
                  <h2 className="font-heading text-2xl font-bold mb-4">Weekly Schedule</h2>
                  {schedule.length > 0 ? (
                    <div className="space-y-4">
                      {schedule.map((week: any, i: number) => (
                        <Card key={i} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <h3 className="font-bold mb-1">{week.title || `Week ${i + 1}`}</h3>
                            {week.description && <p className="text-muted-foreground text-sm">{week.description}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Schedule details will be shared upon admission.</p>
                  )}
                </TabsContent>

                <TabsContent value="requirements" className="mt-6">
                  <h2 className="font-heading text-2xl font-bold mb-4">Who Can Apply</h2>
                  {program.requirements && program.requirements.length > 0 ? (
                    <ul className="space-y-3">
                      {program.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-muted-foreground">{req}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No specific prerequisites. Open to all skill levels.</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div>
              <Card className="sticky top-6 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  {applicationStatus === "approved" ? (
                    <div className="text-center">
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-base px-4 py-2 mb-3">
                        ✅ Admitted
                      </Badge>
                      <p className="text-sm text-muted-foreground mb-3">You have been accepted into this program.</p>
                      <Button className="w-full" asChild>
                        <Link to={`/dashboard/programs/${program.id}`}>Go to Program Dashboard</Link>
                      </Button>
                    </div>
                  ) : applicationStatus === "pending" ? (
                    <div className="text-center">
                      <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-base px-4 py-2 mb-3">
                        ⏳ Application Pending
                      </Badge>
                      <p className="text-sm text-muted-foreground">Your application is under review. We'll notify you once a decision is made.</p>
                    </div>
                  ) : applicationStatus === "rejected" ? (
                    <div className="text-center">
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-base px-4 py-2 mb-3">
                        Application Not Accepted
                      </Badge>
                      <p className="text-sm text-muted-foreground">Unfortunately, your application was not accepted for this cohort.</p>
                    </div>
                  ) : program.status === "open" ? (
                    <>
                      <Button onClick={handleApplyClick} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg">
                        Apply for Program
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">Free to apply. Admission required.</p>
                    </>
                  ) : (
                    <Button disabled className="w-full py-6 text-lg">
                      {program.status === "ongoing" ? "Program In Progress" : "Applications Closed"}
                    </Button>
                  )}

                  <Button variant="outline" onClick={handleShare} className="w-full">
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Share Program"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form Dialog */}
      {showApplicationForm && user && (
        <ProgramApplicationForm
          programId={program.id}
          programTitle={program.title}
          userId={user.id}
          userEmail={user.email || ""}
          open={showApplicationForm}
          onOpenChange={setShowApplicationForm}
          onSuccess={() => {
            setApplicationStatus("pending");
            setShowApplicationForm(false);
          }}
        />
      )}

      <Footer />
    </div>
  );
};

export default ProgramDetails;
