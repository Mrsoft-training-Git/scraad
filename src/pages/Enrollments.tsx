import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, BookOpen, TrendingUp, UserCheck, Search, GraduationCap, Eye, Download } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";

interface EnrollmentRecord {
  id: string;
  user_id: string;
  item_id: string;
  item_type: "course" | "program";
  payment_status: string;
  access_status: string;
  created_at: string;
  student_name: string;
  student_email: string;
  student_gender: string | null;
  item_name: string;
  progress: number;
}

const Enrollments = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState("student");
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const navigate = useNavigate();

  const openDetail = async (rec: EnrollmentRecord) => {
    setDetail({ record: rec });
    setDetailLoading(true);
    const profileRes = await supabase.from("profiles").select("*").eq("id", rec.user_id).maybeSingle();
    let application: any = null;
    if (rec.item_type === "program") {
      const appRes = await supabase
        .from("program_applications")
        .select("*")
        .eq("user_id", rec.user_id)
        .eq("program_id", rec.item_id)
        .order("created_at", { ascending: false })
        .maybeSingle();
      application = appRes.data;
    }
    setDetail({ record: rec, profile: profileRes.data, application });
    setDetailLoading(false);
  };

  const handleExport = async () => {
    const rows = filtered;
    // Fetch profiles for all users
    const userIds = [...new Set(rows.map(r => r.user_id))];
    const programRows = rows.filter(r => r.item_type === "program");

    const [profilesRes, appsRes] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("*").in("id", userIds)
        : Promise.resolve({ data: [] as any[] }),
      programRows.length
        ? supabase
            .from("program_applications")
            .select("*")
            .in("user_id", programRows.map(r => r.user_id))
            .in("program_id", programRows.map(r => r.item_id))
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
    const appMap = new Map(
      (appsRes.data || []).map((a: any) => [`${a.user_id}-${a.program_id}`, a])
    );

    const data = rows.map((r) => {
      const p: any = profileMap.get(r.user_id) || {};
      const a: any = r.item_type === "program" ? appMap.get(`${r.user_id}-${r.item_id}`) || {} : {};
      return {
        "Student Name": r.student_name,
        "Email": r.student_email,
        "Phone": p.phone || a.phone || "",
        "Gender": r.student_gender || "",
        "Date of Birth": p.date_of_birth || "",
        "Age": a.age || "",
        "Country": p.country || "",
        "Address": a.address || "",
        "Education Level": p.education_level || "",
        "Department": p.department || "",
        "Item": r.item_name,
        "Type": r.item_type,
        "Progress %": r.progress,
        "Payment Status": r.payment_status,
        "Access Status": r.access_status,
        "Enrolled Date": format(new Date(r.created_at), "yyyy-MM-dd"),
        "Experience Level": a.experience_level || "",
        "Motivation": a.motivation || "",
        "Application Status": a.status || "",
        "Guardian Name": a.guardian_name || "",
        "Guardian Relationship": a.guardian_relationship || "",
        "Guardian Phone": a.guardian_phone || "",
        "Guardian Email": a.guardian_email || "",
        "CV URL": a.cv_url || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0] || { x: "" }).map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    const sheetName = activeTab === "all" ? "Enrollments" : activeTab === "courses" ? "Courses" : "Programs";
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `enrollments-${sheetName.toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate("/auth");
      setUser(session.user);

      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
      const role = roleData?.role || "student";
      setUserRole(role);
      if (role !== "admin") return navigate("/dashboard");

      await fetchEnrollments();
    };
    init();
  }, [navigate]);

  const fetchEnrollments = async () => {
    try {
      // Fetch both course and program enrollments in parallel
      const [{ data: courseEnrData }, { data: progEnrData }] = await Promise.all([
        supabase.from("enrollments").select("id, user_id, course_id, payment_status, access_status, created_at").order("created_at", { ascending: false }),
        supabase.from("program_enrollments").select("id, user_id, program_id, payment_status, access_status, enrolled_at, progress").order("enrolled_at", { ascending: false }),
      ]);

      const records: EnrollmentRecord[] = [];

      // Process course enrollments
      if (courseEnrData && courseEnrData.length > 0) {
        const userIds = [...new Set(courseEnrData.map(e => e.user_id))];
        const courseIds = [...new Set(courseEnrData.map(e => e.course_id))];

        const [profilesRes, coursesRes, enrolledCoursesRes] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email, gender").in("id", userIds),
          supabase.from("courses").select("id, title").in("id", courseIds),
          supabase.from("enrolled_courses").select("user_id, course_id, progress"),
        ]);

        const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
        const courseMap = new Map((coursesRes.data || []).map(c => [c.id, c]));
        const progressMap = new Map((enrolledCoursesRes.data || []).map(ec => [`${ec.user_id}-${ec.course_id}`, ec.progress || 0]));

        courseEnrData.forEach(e => {
          const profile = profileMap.get(e.user_id);
          const course = courseMap.get(e.course_id);
          records.push({
            id: e.id,
            user_id: e.user_id,
            item_id: e.course_id,
            item_type: "course",
            payment_status: e.payment_status,
            access_status: e.access_status,
            created_at: e.created_at,
            student_name: profile?.full_name || "Unknown",
            student_email: profile?.email || "N/A",
            student_gender: profile?.gender || null,
            item_name: course?.title || "Unknown Course",
            progress: progressMap.get(`${e.user_id}-${e.course_id}`) || 0,
          });
        });
      }

      // Process program enrollments
      if (progEnrData && progEnrData.length > 0) {
        const userIds = [...new Set(progEnrData.map(e => e.user_id))];
        const programIds = [...new Set(progEnrData.map(e => e.program_id))];

        const [profilesRes, programsRes] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email, gender").in("id", userIds),
          supabase.from("programs").select("id, title").in("id", programIds),
        ]);

        const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
        const programMap = new Map((programsRes.data || []).map(p => [p.id, p]));

        progEnrData.forEach(e => {
          const profile = profileMap.get(e.user_id);
          const program = programMap.get(e.program_id);
          records.push({
            id: e.id,
            user_id: e.user_id,
            item_id: e.program_id,
            item_type: "program",
            payment_status: e.payment_status,
            access_status: e.access_status,
            created_at: e.enrolled_at,
            student_name: profile?.full_name || "Unknown",
            student_email: profile?.email || "N/A",
            student_gender: profile?.gender || null,
            item_name: program?.title || "Unknown Program",
            progress: e.progress || 0,
          });
        });
      }

      // Sort by date desc
      records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setEnrollments(records);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = enrollments
    .filter(e => activeTab === "all" || e.item_type === (activeTab === "courses" ? "course" : "program"))
    .filter(e =>
      e.student_name.toLowerCase().includes(search.toLowerCase()) ||
      e.student_email.toLowerCase().includes(search.toLowerCase()) ||
      e.item_name.toLowerCase().includes(search.toLowerCase())
    );

  const totalEnrollments = enrollments.length;
  const courseCount = enrollments.filter(e => e.item_type === "course").length;
  const programCount = enrollments.filter(e => e.item_type === "program").length;
  const avgCompletion = totalEnrollments > 0
    ? Math.round(enrollments.reduce((sum, r) => sum + r.progress, 0) / totalEnrollments) : 0;
  const activeCount = enrollments.filter(r => r.access_status === "active").length;
  const paidCount = enrollments.filter(r => r.payment_status === "paid").length;
  const maleCount = enrollments.filter(r => r.student_gender?.toLowerCase() === "male").length;
  const femaleCount = enrollments.filter(r => r.student_gender?.toLowerCase() === "female").length;

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      paid: "bg-secondary/10 text-secondary",
      partial: "bg-warning/10 text-warning-foreground",
      pending: "bg-destructive/10 text-destructive",
      active: "bg-secondary/10 text-secondary",
      locked: "bg-destructive/10 text-destructive",
    };
    return <Badge className={variants[status] || "bg-muted text-muted-foreground"}>{status}</Badge>;
  };

  const statsConfig = [
    { title: "Total Enrollments", value: totalEnrollments, icon: Users, accent: "bg-primary/10 text-primary" },
    { title: "Course Enrollments", value: courseCount, icon: BookOpen, accent: "bg-primary/10 text-primary" },
    { title: "Program Enrollments", value: programCount, icon: GraduationCap, accent: "bg-accent/10 text-accent" },
    { title: "Avg Completion", value: `${avgCompletion}%`, icon: TrendingUp, accent: "bg-secondary/10 text-secondary" },
    { title: "Active / Paid", value: `${activeCount} / ${paidCount}`, icon: UserCheck, accent: "bg-secondary/10 text-secondary" },
    { title: "Male / Female", value: `${maleCount} / ${femaleCount}`, icon: Users, accent: "bg-accent/10 text-accent" },
  ];

  if (loading) {
    return (
      <DashboardLayout user={user} userRole={userRole}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Enrollments</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statsConfig.map((stat, i) => (
            <Card key={i} className="border border-border/60 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                    <p className="text-2xl font-heading font-bold mt-1 text-foreground">{stat.value}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-lg ${stat.accent} flex items-center justify-center`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-3 px-5 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-sm font-semibold">All Enrollments</CardTitle>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="h-8">
                    <TabsTrigger value="all" className="text-xs h-7 px-3">All</TabsTrigger>
                    <TabsTrigger value="courses" className="text-xs h-7 px-3">Courses</TabsTrigger>
                    <TabsTrigger value="programs" className="text-xs h-7 px-3">Programs</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search student or item..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Student</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Gender</TableHead>
                    <TableHead className="text-xs">Item</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Progress</TableHead>
                    <TableHead className="text-xs">Payment</TableHead>
                    <TableHead className="text-xs">Access</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-8">
                        No enrollments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((e) => (
                      <TableRow key={`${e.item_type}-${e.id}`}>
                        <TableCell className="text-sm font-medium">{e.student_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.student_email}</TableCell>
                        <TableCell className="text-sm capitalize">{e.student_gender || "—"}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{e.item_name}</TableCell>
                        <TableCell>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                            e.item_type === "course" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                          }`}>
                            {e.item_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{e.progress}%</TableCell>
                        <TableCell>{statusBadge(e.payment_status)}</TableCell>
                        <TableCell>{statusBadge(e.access_status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(e.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => openDetail(e)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enrollment Details</DialogTitle>
            </DialogHeader>
            {detailLoading || !detail ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : (
              <div className="space-y-6 text-sm">
                <section>
                  <h3 className="font-semibold mb-2 text-foreground">Enrollment</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Item" value={detail.record.item_name} />
                    <Field label="Type" value={detail.record.item_type} />
                    <Field label="Payment" value={detail.record.payment_status} />
                    <Field label="Access" value={detail.record.access_status} />
                    <Field label="Progress" value={`${detail.record.progress}%`} />
                    <Field label="Date" value={format(new Date(detail.record.created_at), "PPP")} />
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold mb-2 text-foreground">Student Profile</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Full Name" value={detail.profile?.full_name} />
                    <Field label="Email" value={detail.profile?.email} />
                    <Field label="Phone" value={detail.profile?.phone} />
                    <Field label="Gender" value={detail.profile?.gender} />
                    <Field label="Date of Birth" value={detail.profile?.date_of_birth} />
                    <Field label="Country" value={detail.profile?.country} />
                    <Field label="Education Level" value={detail.profile?.education_level} />
                    <Field label="Department" value={detail.profile?.department} />
                    <Field label="Device" value={detail.profile?.device_type} />
                    <Field label="Has Internet" value={detail.profile?.has_internet === null || detail.profile?.has_internet === undefined ? null : detail.profile?.has_internet ? "Yes" : "No"} />
                    <Field label="Weekly Hours" value={detail.profile?.weekly_hours} />
                    <Field label="Bio" value={detail.profile?.bio} full />
                  </div>
                </section>

                {detail.record.item_type === "program" && (
                  <section>
                    <h3 className="font-semibold mb-2 text-foreground">Program Application</h3>
                    {detail.application ? (
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Applicant Name" value={detail.application.full_name} />
                        <Field label="Email" value={detail.application.email} />
                        <Field label="Phone" value={detail.application.phone} />
                        <Field label="Age" value={detail.application.age} />
                        <Field label="Address" value={detail.application.address} full />
                        <Field label="Experience" value={detail.application.experience_level} />
                        <Field label="Status" value={detail.application.status} />
                        <Field label="Motivation" value={detail.application.motivation} full />
                        {detail.application.cv_url && (
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">CV</p>
                            <a href={detail.application.cv_url} target="_blank" rel="noreferrer" className="text-primary underline text-sm">View CV</a>
                          </div>
                        )}
                        <div className="col-span-2 mt-2 pt-3 border-t">
                          <h4 className="font-semibold mb-2 text-foreground">Parent / Guardian</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Name" value={detail.application.guardian_name} />
                            <Field label="Relationship" value={detail.application.guardian_relationship} />
                            <Field label="Phone" value={detail.application.guardian_phone} />
                            <Field label="Email" value={detail.application.guardian_email} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No application record found.</p>
                    )}
                  </section>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

const Field = ({ label, value, full }: { label: string; value: any; full?: boolean }) => (
  <div className={full ? "col-span-2" : ""}>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm text-foreground break-words">{value ?? "—"}</p>
  </div>
);

export default Enrollments;
