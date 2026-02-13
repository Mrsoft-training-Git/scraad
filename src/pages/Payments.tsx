import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, CreditCard, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface PaymentRow {
  id: string;
  student_name: string;
  course_title: string;
  amount: number;
  paid: number;
  status: string;
  date: string | null;
}

const Payments = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
      setUserRole(roleData?.role || "student");

      // Fetch all enrollments
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("id, user_id, course_id, payment_status, first_payment_date, second_payment_date, created_at")
        .order("created_at", { ascending: false });

      if (!enrollments || enrollments.length === 0) { setLoading(false); return; }

      const userIds = [...new Set(enrollments.map(e => e.user_id))];
      const courseIds = [...new Set(enrollments.map(e => e.course_id))];

      const [{ data: profiles }, { data: courses }] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", userIds),
        supabase.from("courses").select("id, title, price, first_tranche_amount, second_tranche_amount, allows_part_payment").in("id", courseIds),
      ]);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name || "Unknown"]) || []);
      const courseMap = new Map(courses?.map(c => [c.id, c]) || []);

      const rows: PaymentRow[] = enrollments.map(e => {
        const c = courseMap.get(e.course_id);
        let paid = 0;
        if (e.payment_status === "paid") paid = c?.price || 0;
        else if (e.payment_status === "partial") paid = c?.first_tranche_amount || 0;

        return {
          id: e.id,
          student_name: profileMap.get(e.user_id) || "Unknown",
          course_title: c?.title || "Unknown",
          amount: c?.price || 0,
          paid,
          status: e.payment_status,
          date: e.first_payment_date || e.created_at,
        };
      });

      setPayments(rows);
      setLoading(false);
    };
    init();

    // Realtime subscription for new enrollments
    const channel = supabase
      .channel("enrollments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "enrollments" }, () => {
        init(); // Re-fetch on any change
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  const totalRevenue = payments.reduce((s, p) => s + p.paid, 0);
  const pendingAmount = payments.filter(p => p.status === "pending" || p.status === "partial").reduce((s, p) => s + (p.amount - p.paid), 0);
  const successfulCount = payments.filter(p => p.status === "paid").length;
  const pendingCount = payments.filter(p => p.status === "pending" || p.status === "partial").length;

  const statsConfig = [
    { title: "Total Revenue", value: `₦${totalRevenue.toLocaleString()}`, subtitle: `${payments.length} transactions`, icon: DollarSign, accent: "bg-primary/10 text-primary" },
    { title: "Pending", value: `₦${pendingAmount.toLocaleString()}`, subtitle: `${pendingCount} students`, icon: AlertCircle, accent: "bg-warning/10 text-warning-foreground" },
    { title: "Successful", value: `${successfulCount}`, subtitle: "Fully paid", icon: CreditCard, accent: "bg-secondary/10 text-secondary" },
    { title: "Enrollments", value: `${payments.length}`, subtitle: "Total", icon: TrendingUp, accent: "bg-primary/10 text-primary" },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      paid: { label: "Paid", cls: "bg-secondary/10 text-secondary" },
      partial: { label: "Partial", cls: "bg-warning/10 text-warning-foreground" },
      pending: { label: "Unpaid", cls: "bg-destructive/10 text-destructive" },
      defaulted: { label: "Defaulted", cls: "bg-destructive/10 text-destructive" },
    };
    const s = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}>{s.label}</span>;
  };

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Payments</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time payment transactions overview</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {statsConfig.map((stat) => (
            <Card key={stat.title} className="border border-border/60 shadow-none hover:border-primary/20 hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                    <p className="text-2xl md:text-3xl font-heading font-bold mt-1 text-foreground">
                      {loading ? <span className="inline-block w-16 h-7 bg-muted animate-pulse rounded" /> : stat.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{stat.subtitle}</p>
                  </div>
                  <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg ${stat.accent} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-3 px-5 pt-5">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">All Enrollment Payments</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Live data from course enrollments</p>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : payments.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No enrollment payments yet</div>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead className="pr-5">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/30">
                        <TableCell className="pl-5 font-medium text-sm">{p.student_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.course_title}</TableCell>
                        <TableCell className="text-sm">₦{p.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-sm font-medium">₦{p.paid.toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                          {p.date ? format(new Date(p.date), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="pr-5">{getStatusBadge(p.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
