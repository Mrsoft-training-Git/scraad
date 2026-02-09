import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, CreditCard, TrendingUp, AlertCircle } from "lucide-react";

const Payments = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
      setUserRole(roleData?.role || "student");
    };
    checkAuth();
  }, [navigate]);

  const statsConfig = [
    { title: "Total Revenue", value: "₦2,450,000", subtitle: "+12.5%", icon: DollarSign, accent: "bg-primary/10 text-primary" },
    { title: "Pending", value: "₦340,000", subtitle: "23 students", icon: AlertCircle, accent: "bg-warning/10 text-warning-foreground" },
    { title: "Successful", value: "145", subtitle: "This month", icon: CreditCard, accent: "bg-secondary/10 text-secondary" },
    { title: "Growth", value: "+18%", subtitle: "vs last month", icon: TrendingUp, accent: "bg-primary/10 text-primary" },
  ];

  const payments = [
    { id: 1, student: "John Doe", course: "Web Development", amount: "₦50,000", date: "2024-01-15", status: "Completed" },
    { id: 2, student: "Jane Smith", course: "Data Science", amount: "₦65,000", date: "2024-01-14", status: "Completed" },
    { id: 3, student: "Mike Brown", course: "Mobile App Dev", amount: "₦55,000", date: "2024-01-13", status: "Pending" },
    { id: 4, student: "Sarah Wilson", course: "UI/UX Design", amount: "₦45,000", date: "2024-01-12", status: "Completed" },
  ];

  return (
    <DashboardLayout user={user} userRole={userRole}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Payments</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Payment transactions overview</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {statsConfig.map((stat) => (
            <Card key={stat.title} className="border border-border/60 shadow-none hover:border-primary/20 hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                    <p className="text-2xl md:text-3xl font-heading font-bold mt-1 text-foreground">{stat.value}</p>
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
              <CardTitle className="text-sm font-semibold text-foreground">Recent Payments</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">All payment transactions</p>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <div className="overflow-x-auto -mx-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="pr-5">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/30">
                      <TableCell className="pl-5 font-medium text-sm">{payment.student}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{payment.course}</TableCell>
                      <TableCell className="text-sm font-medium">{payment.amount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{payment.date}</TableCell>
                      <TableCell className="pr-5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                          payment.status === "Completed"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-warning/10 text-warning-foreground"
                        }`}>
                          {payment.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
