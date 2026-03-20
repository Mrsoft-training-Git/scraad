import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen, GraduationCap } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";
import { LearningCourseList } from "@/components/learning/LearningCourseList";
import { LearningProgramList } from "@/components/learning/LearningProgramList";
import { useToast } from "@/hooks/use-toast";

interface EnrolledCourse {
  id: string;
  course_id: string | null;
  course_name: string;
  progress: number;
  enrolled_at: string;
  course?: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    category: string;
    instructor: string | null;
    duration: string | null;
    students_count: number | null;
    price: number;
  };
  enrollment?: {
    payment_status: string;
    access_status: string;
  } | null;
}

const Learning = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [profile, setProfile] = useState<any>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [defaultTab, setDefaultTab] = useState("courses");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading: paymentLoading } = usePayment();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);

      const [roleData, profileData] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("profiles").select("full_name, avatar_url").eq("id", session.user.id).maybeSingle(),
      ]);

      setUserRole(roleData.data?.role || "student");
      if (profileData.data) setProfile(profileData.data);

      // Verify payment if returning from Paystack
      const params = new URLSearchParams(window.location.search);
      const reference = params.get("trxref") || params.get("reference");
      if (reference) {
        setVerifying(true);
        try {
          const { data, error } = await supabase.functions.invoke("verify-payment", {
            body: { reference },
          });
          if (data?.verified) {
            toast({ title: "Payment Confirmed", description: "Your payment has been verified successfully." });
            if (data.entityType === "program") {
              setDefaultTab("programs");
            }
          }
        } catch (err) {
          console.error("Payment verification error:", err);
        } finally {
          setVerifying(false);
          // Clean URL
          window.history.replaceState({}, "", window.location.pathname);
        }
      }

      fetchEnrolledCourses(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchEnrolledCourses = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("enrolled_courses")
      .select(`id, course_id, course_name, progress, enrolled_at, course:courses(id, title, description, image_url, category, instructor, duration, students_count, price)`)
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false });

    if (!error && data) {
      const courseIds = data.map(d => d.course_id).filter(Boolean) as string[];
      let enrollmentMap = new Map<string, { payment_status: string; access_status: string }>();
      if (courseIds.length > 0) {
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("course_id, payment_status, access_status")
          .eq("user_id", userId)
          .in("course_id", courseIds);
        enrollments?.forEach(e => enrollmentMap.set(e.course_id, { payment_status: e.payment_status, access_status: e.access_status }));
      }
      setEnrolledCourses((data as EnrolledCourse[]).map(d => ({
        ...d,
        enrollment: d.course_id ? enrollmentMap.get(d.course_id) || null : null,
      })));
    }
    setLoading(false);
  };

  return (
    <DashboardLayout user={user} userRole={userRole} profile={profile}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-heading font-semibold text-foreground">My Learning</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your enrolled courses and programs</p>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="programs" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Programs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <LearningCourseList
              courses={enrolledCourses}
              loading={loading}
              paymentLoading={paymentLoading}
            />
          </TabsContent>

          <TabsContent value="programs">
            <LearningProgramList userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Learning;
