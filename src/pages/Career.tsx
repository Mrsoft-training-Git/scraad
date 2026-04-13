import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Briefcase, MapPin, DollarSign, ArrowRight, Upload, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary_range: string | null;
  description: string | null;
  requirements: string[] | null;
  responsibilities: string[] | null;
}

const Career = () => {
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [applicationData, setApplicationData] = useState({
    name: "",
    email: "",
    phone: "",
    coverLetter: "",
    cvFile: null as File | null,
  });

  // Fetch active job openings
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["job-openings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_openings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as JobOpening[];
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedJob || !applicationData.cvFile) {
        throw new Error("Please fill all required fields");
      }

      setIsUploading(true);

      // Upload CV
      const fileExt = applicationData.cvFile.name.split(".").pop();
      const fileName = `${Date.now()}-${applicationData.name.replace(/\s+/g, "-")}.${fileExt}`;
      const filePath = `cvs/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("cv-uploads").upload(filePath, applicationData.cvFile);

      if (uploadError) throw uploadError;

      // Store file path (bucket is private, admins use signed URLs to access)
      const { error: insertError } = await supabase.from("job_applications").insert({
        job_id: selectedJob.id,
        applicant_name: applicationData.name,
        applicant_email: applicationData.email,
        applicant_phone: applicationData.phone || null,
        cv_url: filePath,
        cover_letter: applicationData.coverLetter || null,
      });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Application submitted successfully! We'll be in touch soon.");
      setIsApplyDialogOpen(false);
      setSelectedJob(null);
      setApplicationData({
        name: "",
        email: "",
        phone: "",
        coverLetter: "",
        cvFile: null,
      });
    },
    onError: (error) => {
      toast.error("Failed to submit application: " + error.message);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleApply = (job: JobOpening) => {
    setSelectedJob(job);
    setIsApplyDialogOpen(true);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationData.name || !applicationData.email || !applicationData.cvFile) {
      toast.error("Please fill in all required fields and upload your CV");
      return;
    }
    applyMutation.mutate();
  };

  const benefits = [
    "Competitive salary packages",
    "Professional development opportunities",
    "Flexible working arrangements",
    "Health insurance coverage",
    "Annual leave and holidays",
    "Collaborative work environment",
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
              Join the Scra<span className="text-secondary">AD</span> team at M-R International and help shape the future of online education.
            </p>
          </div>
        </div>
      </section>

      {/* Jobs Listing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-4xl font-bold text-center text-foreground mb-12">Current Openings</h2>
          <div className="max-w-5xl mx-auto space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground mt-2">Loading openings...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Openings Available</h3>
                <p className="text-muted-foreground">
                  Check back later for new opportunities or submit your resume below.
                </p>
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all group"
                >
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
                        {job.salary_range && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {job.salary_range}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button className="lg:mt-4" onClick={() => handleApply(job)}>
                      Apply Now <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-4xl font-bold text-center text-foreground mb-12">Why Work With Us?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 bg-card border border-border rounded-lg p-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-primary-foreground" />
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
            <h2 className="font-heading text-4xl font-bold mb-4">Don't See a Role That Fits?</h2>
            <p className="text-xl mb-8 text-white/90">
              Send us your resume and we'll keep you in mind for future opportunities.
            </p>
            <Button size="lg" variant="secondary">
              Submit Your Resume
            </Button>
          </div>
        </div>
      </section>

      {/* Application Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitApplication} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={applicationData.name}
                onChange={(e) => setApplicationData({ ...applicationData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={applicationData.email}
                onChange={(e) => setApplicationData({ ...applicationData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={applicationData.phone}
                onChange={(e) => setApplicationData({ ...applicationData, phone: e.target.value })}
                placeholder="+234 800 000 0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cv">Upload CV/Resume *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <input
                  id="cv"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setApplicationData({ ...applicationData, cvFile: file });
                    }
                  }}
                />
                <label htmlFor="cv" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  {applicationData.cvFile ? (
                    <span className="text-sm text-primary font-medium">{applicationData.cvFile.name}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Click to upload PDF, DOC, or DOCX (max 10MB)</span>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
              <Textarea
                id="coverLetter"
                value={applicationData.coverLetter}
                onChange={(e) => setApplicationData({ ...applicationData, coverLetter: e.target.value })}
                placeholder="Tell us why you're interested in this position..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={applyMutation.isPending || isUploading}>
                {applyMutation.isPending || isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Career;
