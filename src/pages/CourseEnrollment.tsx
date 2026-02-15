import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check, User, BookOpen, CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePayment } from "@/hooks/usePayment";
import { useEnrollment } from "@/hooks/useEnrollment";

interface Course {
  id: string;
  title: string;
  price: number;
  allows_part_payment: boolean;
  first_tranche_amount: number | null;
  second_tranche_amount: number | null;
  image_url: string | null;
  category: string;
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  dateOfBirth: string;
  gender: string;
  educationLevel: string;
}

interface LearningResources {
  deviceType: string;
  hasInternet: string;
  weeklyHours: string;
  weeklyHoursOther: string;
}

const getSteps = (isFree: boolean) => [
  { id: 1, label: "Personal Information", icon: User },
  { id: 2, label: "Learning Resources", icon: BookOpen },
  { id: 3, label: isFree ? "Enrollment" : "Payment", icon: isFree ? BookOpen : CreditCard },
];

const CourseEnrollment = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { initializePayment, loading: paymentLoading } = usePayment();
  const { enrollInCourse, enrolling } = useEnrollment();

  const [step, setStep] = useState(1);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    dateOfBirth: "",
    gender: "",
    educationLevel: "",
  });

  const [learningResources, setLearningResources] = useState<LearningResources>({
    deviceType: "",
    hasInternet: "",
    weeklyHours: "",
    weeklyHoursOther: "",
  });

  const [agreementCommitment, setAgreementCommitment] = useState(false);
  const [agreementRules, setAgreementRules] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast({ title: "Please log in", description: "You must be logged in to enroll.", variant: "destructive" });
        navigate("/auth");
        return;
      }
      setUser(authUser);

      // Fetch course
      if (courseId) {
        const { data: courseData } = await supabase
          .from("courses")
          .select("id, title, price, allows_part_payment, first_tranche_amount, second_tranche_amount, image_url, category")
          .eq("id", courseId)
          .eq("published", true)
          .single();

        if (!courseData) {
          toast({ title: "Course not found", variant: "destructive" });
          navigate("/programs");
          return;
        }
        setCourse(courseData);
      }

      // Pre-fill profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profile) {
        const nameParts = (profile.full_name || "").split(" ");
        setPersonalInfo({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: profile.email || authUser.email || "",
          phone: profile.phone || "",
          country: profile.country || "",
          dateOfBirth: profile.date_of_birth || "",
          gender: profile.gender || "",
          educationLevel: profile.education_level || "",
        });

        setLearningResources({
          deviceType: profile.device_type || "",
          hasInternet: profile.has_internet === true ? "yes" : profile.has_internet === false ? "no" : "",
          weeklyHours: profile.weekly_hours || "",
          weeklyHoursOther: "",
        });
      } else {
        setPersonalInfo(prev => ({ ...prev, email: authUser.email || "" }));
      }

      setLoading(false);
    };

    init();
  }, [courseId, navigate, toast]);

  const validateStep1 = () => {
    const { firstName, lastName, email, phone, country, dateOfBirth, gender, educationLevel } = personalInfo;
    if (!firstName || !lastName || !email || !phone || !country || !dateOfBirth || !gender || !educationLevel) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return false;
    }
    // Validate age: must be at least 10 years old
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) ? age - 1 : age;
      if (actualAge < 10) {
        toast({ title: "Age Restriction", description: "You must be at least 10 years old to enroll.", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const validateStep2 = () => {
    const { deviceType, hasInternet, weeklyHours } = learningResources;
    if (!deviceType || !hasInternet || !weeklyHours) {
      toast({ title: "Missing fields", description: "Please answer all questions.", variant: "destructive" });
      return false;
    }
    if (weeklyHours === "other" && !learningResources.weeklyHoursOther.trim()) {
      toast({ title: "Missing fields", description: "Please specify your weekly hours.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const saveProfileData = async () => {
    if (!user) return;
    setSaving(true);

    const fullName = `${personalInfo.firstName} ${personalInfo.lastName}`.trim();
    const hours = learningResources.weeklyHours === "other" ? learningResources.weeklyHoursOther : learningResources.weeklyHours;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        email: personalInfo.email,
        phone: personalInfo.phone,
        country: personalInfo.country,
        date_of_birth: personalInfo.dateOfBirth || null,
        gender: personalInfo.gender,
        education_level: personalInfo.educationLevel,
        device_type: learningResources.deviceType,
        has_internet: learningResources.hasInternet === "yes",
        weekly_hours: hours,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;

    if (step === 2) {
      // Save profile data before proceeding to payment
      const saved = await saveProfileData();
      if (!saved) return;
    }

    setStep(step + 1);
  };

  const handlePayNow = async (paymentType: "full" | "first") => {
    if (!agreementCommitment || !agreementRules) {
      toast({ title: "Agreement required", description: "Please agree to both statements before proceeding.", variant: "destructive" });
      return;
    }
    if (!course) return;
    await initializePayment(course.id, paymentType);
  };

  const handlePayLater = async () => {
    if (!agreementCommitment || !agreementRules) {
      toast({ title: "Agreement required", description: "Please agree to both statements before proceeding.", variant: "destructive" });
      return;
    }
    if (!course) return;

    const success = await enrollInCourse(course.id, course.title);
    if (success) {
      toast({ title: "Enrolled!", description: "You've been enrolled. Pay from your dashboard to access course content." });
      navigate("/dashboard/learning");
    }
  };

  const handleFreeEnroll = async () => {
    if (!agreementCommitment || !agreementRules) {
      toast({ title: "Agreement required", description: "Please agree to both statements before proceeding.", variant: "destructive" });
      return;
    }
    if (!course) return;

    const success = await enrollInCourse(course.id, course.title, true);
    if (success) {
      toast({ title: "Enrolled!", description: "You're now enrolled. Start learning!" });
      navigate("/dashboard/learning");
    }
  };

  const isFree = course?.price === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to={`/programs/${courseId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Link>
            </Button>
            <h1 className="font-heading text-3xl font-bold text-foreground">Enroll in Course</h1>
            <p className="text-muted-foreground mt-1">{course.title}</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-10">
            {getSteps(course.price === 0).map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              const steps = getSteps(course.price === 0);
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 transition-colors ${
                    isDone ? "bg-primary text-primary-foreground" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isActive || isDone ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 ${isDone ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8 space-y-5">
                <h2 className="font-heading text-xl font-bold">Personal Information</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" value={personalInfo.firstName} onChange={e => setPersonalInfo(p => ({ ...p, firstName: e.target.value }))} placeholder="John" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" value={personalInfo.lastName} onChange={e => setPersonalInfo(p => ({ ...p, lastName: e.target.value }))} placeholder="Doe" required />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" type="email" value={personalInfo.email} onChange={e => setPersonalInfo(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" type="tel" value={personalInfo.phone} onChange={e => setPersonalInfo(p => ({ ...p, phone: e.target.value }))} placeholder="+234 xxx xxx xxxx" required />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country of Residence *</Label>
                    <Input id="country" value={personalInfo.country} onChange={e => setPersonalInfo(p => ({ ...p, country: e.target.value }))} placeholder="Nigeria" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input id="dob" type="date" value={personalInfo.dateOfBirth} onChange={e => setPersonalInfo(p => ({ ...p, dateOfBirth: e.target.value }))} required />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <Select value={personalInfo.gender} onValueChange={v => setPersonalInfo(p => ({ ...p, gender: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Education Level *</Label>
                    <Select value={personalInfo.educationLevel} onValueChange={v => setPersonalInfo(p => ({ ...p, educationLevel: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="secondary">Secondary School</SelectItem>
                        <SelectItem value="diploma">Diploma / OND</SelectItem>
                        <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                        <SelectItem value="masters">Master's Degree</SelectItem>
                        <SelectItem value="doctorate">Doctorate / PhD</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleNext}>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Learning Resources */}
          {step === 2 && (
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8 space-y-6">
                <h2 className="font-heading text-xl font-bold">Learning Resources</h2>

                <div className="space-y-3">
                  <Label className="text-base font-medium">I have a: *</Label>
                  <RadioGroup value={learningResources.deviceType} onValueChange={v => setLearningResources(p => ({ ...p, deviceType: v }))}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="laptop" id="laptop" />
                      <Label htmlFor="laptop" className="font-normal cursor-pointer">Laptop</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="smartphone" id="smartphone" />
                      <Label htmlFor="smartphone" className="font-normal cursor-pointer">Smartphone</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="both" id="both" />
                      <Label htmlFor="both" className="font-normal cursor-pointer">Both</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Do you have internet access? *</Label>
                  <RadioGroup value={learningResources.hasInternet} onValueChange={v => setLearningResources(p => ({ ...p, hasInternet: v }))}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="yes" id="inet-yes" />
                      <Label htmlFor="inet-yes" className="font-normal cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="no" id="inet-no" />
                      <Label htmlFor="inet-no" className="font-normal cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">How many hours in a week can you dedicate for this training? *</Label>
                  <RadioGroup value={learningResources.weeklyHours} onValueChange={v => setLearningResources(p => ({ ...p, weeklyHours: v }))}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="10" id="hours-10" />
                      <Label htmlFor="hours-10" className="font-normal cursor-pointer">10 hours <Badge variant="secondary" className="ml-2 text-[10px]">Recommended</Badge></Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="5" id="hours-5" />
                      <Label htmlFor="hours-5" className="font-normal cursor-pointer">5 hours</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="other" id="hours-other" />
                      <Label htmlFor="hours-other" className="font-normal cursor-pointer">Others (specify)</Label>
                    </div>
                  </RadioGroup>
                  {learningResources.weeklyHours === "other" && (
                    <Input
                      className="max-w-xs mt-2"
                      placeholder="e.g. 15 hours"
                      value={learningResources.weeklyHoursOther}
                      onChange={e => setLearningResources(p => ({ ...p, weeklyHoursOther: e.target.value }))}
                    />
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button onClick={handleNext} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {saving ? "Saving..." : "Next"} {!saving && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <Card className="border-border/50">
              <CardContent className="p-6 md:p-8 space-y-6">
                <h2 className="font-heading text-xl font-bold">{isFree ? "Enrollment" : "Payment"}</h2>

                <div className="grid gap-4">
                  {isFree ? (
                    /* Free Course — simple enroll */
                    <div className="border border-green-500/20 rounded-xl p-5 bg-green-500/5">
                      <div className="flex items-start gap-3 mb-3">
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Free Course</Badge>
                      </div>
                      <h3 className="font-heading font-bold text-lg mb-1">This course is free!</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        No payment is required. Click below to enroll and start learning immediately.
                      </p>
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
                        onClick={handleFreeEnroll}
                        disabled={enrolling}
                      >
                        {enrolling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
                        {enrolling ? "Enrolling..." : "Enroll"}
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Pay Now */}
                      <div className="border border-primary/20 rounded-xl p-5 bg-primary/5">
                        <div className="flex items-start gap-3 mb-3">
                          <Badge className="bg-primary/10 text-primary border-primary/20">Recommended</Badge>
                        </div>
                        <h3 className="font-heading font-bold text-lg mb-1">I want to Pay Now</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Make payment immediately and get access to the entire course.
                        </p>

                        <div className="space-y-2">
                          <Button
                            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
                            onClick={() => handlePayNow("full")}
                            disabled={paymentLoading}
                          >
                            {paymentLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                            Pay Full Amount — ₦{course.price.toLocaleString()}
                          </Button>

                          {course.allows_part_payment && course.first_tranche_amount && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => handlePayNow("first")}
                              disabled={paymentLoading}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Pay First Tranche — ₦{course.first_tranche_amount.toLocaleString()}
                            </Button>
                          )}
                        </div>

                        <div className="mt-4 p-3 rounded-lg bg-background border border-border/50">
                          <p className="text-xs font-medium text-foreground mb-1">What happens after I pay:</p>
                          <p className="text-xs text-muted-foreground">
                            You will be sent your Student Login Credentials to your email. You can login into your portal and begin learning.
                          </p>
                        </div>
                      </div>

                      {/* Pay Later */}
                      <div className="border border-border/50 rounded-xl p-5">
                        <h3 className="font-heading font-bold text-lg mb-1">I will pay later</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Enroll now and pay later from your Portal. <span className="font-medium text-foreground">N/B: You will not have access to your course until you make full payment.</span>
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handlePayLater}
                          disabled={enrolling}
                        >
                          {enrolling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          {enrolling ? "Enrolling..." : "Enroll Without Payment"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Agreement */}
                <div className="space-y-3 pt-2 border-t border-border/50">
                  <p className="text-sm font-medium text-foreground">Agreement</p>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="agree-commitment"
                      checked={agreementCommitment}
                      onCheckedChange={(v) => setAgreementCommitment(v === true)}
                    />
                    <Label htmlFor="agree-commitment" className="text-sm font-normal leading-relaxed cursor-pointer">
                      I understand this training requires commitment and active participation.
                    </Label>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="agree-rules"
                      checked={agreementRules}
                      onCheckedChange={(v) => setAgreementRules(v === true)}
                    />
                    <Label htmlFor="agree-rules" className="text-sm font-normal leading-relaxed cursor-pointer">
                      I agree to follow the rules and complete assignments.
                    </Label>
                  </div>
                </div>

                <div className="flex justify-start pt-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CourseEnrollment;
