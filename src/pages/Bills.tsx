import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface EnrollmentRecord {
  id: string;
  course_id: string;
  payment_status: string;
  access_status: string;
  created_at: string;
  first_payment_date: string | null;
  second_payment_date: string | null;
  course_title: string;
  course_price: number;
  first_tranche: number | null;
  second_tranche: number | null;
  allows_part_payment: boolean;
}

const Bills = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [records, setRecords] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);

      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
      setUserRole(roleData?.role || "student");

      const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", session.user.id).single();
      setProfileName(profile?.full_name || "");
      setProfileEmail(profile?.email || session.user.email || "");

      // Fetch enrollments with course info
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("id, course_id, payment_status, access_status, created_at, first_payment_date, second_payment_date")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (enrollments && enrollments.length > 0) {
        const courseIds = enrollments.map(e => e.course_id);
        const { data: courses } = await supabase
          .from("courses")
          .select("id, title, price, first_tranche_amount, second_tranche_amount, allows_part_payment")
          .in("id", courseIds);

        const courseMap = new Map(courses?.map(c => [c.id, c]) || []);

        const mapped: EnrollmentRecord[] = enrollments.map(e => {
          const c = courseMap.get(e.course_id);
          return {
            ...e,
            course_title: c?.title || "Unknown Course",
            course_price: c?.price || 0,
            first_tranche: c?.first_tranche_amount || null,
            second_tranche: c?.second_tranche_amount || null,
            allows_part_payment: c?.allows_part_payment || false,
          };
        });
        setRecords(mapped);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const getAmountPaid = (r: EnrollmentRecord) => {
    if (r.payment_status === "paid") return r.course_price;
    if (r.payment_status === "partial") return r.first_tranche || 0;
    return 0;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      paid: { label: "Paid", className: "bg-secondary/10 text-secondary" },
      partial: { label: "Partial", className: "bg-warning/10 text-warning-foreground" },
      pending: { label: "Unpaid", className: "bg-destructive/10 text-destructive" },
      defaulted: { label: "Defaulted", className: "bg-destructive/10 text-destructive" },
    };
    const s = map[status] || { label: status, className: "bg-muted text-muted-foreground" };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${s.className}`}>{s.label}</span>;
  };

  const downloadPdf = () => {
    // Generate a printable HTML receipt and trigger print/save as PDF
    const rows = records.map(r => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${r.course_title}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">₦${r.course_price.toLocaleString()}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">₦${getAmountPaid(r).toLocaleString()}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${r.payment_status.toUpperCase()}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${r.first_payment_date ? format(new Date(r.first_payment_date), "MMM d, yyyy") : "—"}</td>
      </tr>
    `).join("");

    const totalPaid = records.reduce((sum, r) => sum + getAmountPaid(r), 0);
    const totalOwed = records.reduce((sum, r) => sum + r.course_price, 0);

    const html = `
      <html><head><title>Payment Statement</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}
      h1{font-size:22px}h2{font-size:16px;color:#666}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      th{text-align:left;padding:8px;border-bottom:2px solid #333;font-size:13px}
      td{font-size:13px}
      .summary{margin-top:24px;font-size:14px}
      </style></head><body>
      <h1>Payment Statement</h1>
      <h2>${profileName} — ${profileEmail}</h2>
      <p style="color:#888;font-size:12px">Generated: ${format(new Date(), "MMMM d, yyyy")}</p>
      <table>
        <thead><tr><th>Course</th><th>Total</th><th>Paid</th><th>Status</th><th>Payment Date</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="summary">
        <p><strong>Total Course Fees:</strong> ₦${totalOwed.toLocaleString()}</p>
        <p><strong>Total Paid:</strong> ₦${totalPaid.toLocaleString()}</p>
        <p><strong>Outstanding:</strong> ₦${(totalOwed - totalPaid).toLocaleString()}</p>
      </div>
      </body></html>
    `;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Bills & Payment History</h2>
            <p className="text-sm text-muted-foreground mt-0.5">View all your course payment transactions</p>
          </div>
          {records.length > 0 && (
            <Button variant="outline" size="sm" onClick={downloadPdf}>
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
          )}
        </div>

        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-3 px-5 pt-5">
            <CardTitle className="text-sm font-semibold text-foreground">Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : records.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                No payment records found
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">Course</TableHead>
                      <TableHead>Total Fee</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead className="pr-5">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/30">
                        <TableCell className="pl-5 font-medium text-sm">{r.course_title}</TableCell>
                        <TableCell className="text-sm">₦{r.course_price.toLocaleString()}</TableCell>
                        <TableCell className="text-sm font-medium">₦{getAmountPaid(r).toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                          {r.first_payment_date ? format(new Date(r.first_payment_date), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="pr-5">{getStatusBadge(r.payment_status)}</TableCell>
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

export default Bills;
