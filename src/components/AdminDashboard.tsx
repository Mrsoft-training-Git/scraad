import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, Building2, GraduationCap, UserCog, BookOpen, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AdminDashboard = () => {
  const stats = [
    { title: "TOTAL USERS", value: "261", icon: Users, color: "bg-blue-100 text-blue-600" },
    { title: "ADMINS", value: "4", icon: ShieldCheck, color: "bg-blue-100 text-blue-600" },
    { title: "ORGANIZATIONS", value: "2", icon: Building2, color: "bg-blue-100 text-blue-600" },
    { title: "STUDENTS", value: "249", icon: GraduationCap, color: "bg-blue-100 text-blue-600" },
    { title: "STAFFS", value: "6", icon: UserCog, color: "bg-blue-100 text-blue-600" },
    { title: "PAYMENTS", value: "27", icon: CreditCard, color: "bg-blue-100 text-blue-600" },
    { title: "COURSES", value: "18", icon: BookOpen, color: "bg-blue-100 text-blue-600" },
  ];

  const recentStudents = [
    { name: "Godbless O", date: "Nov 7, 2023" },
    { name: "mark w", date: "Jun 3, 2024" },
    { name: "Emmanuella O", date: "Aug 6, 2024" },
    { name: "Joel E", date: "Aug 7, 2024" },
  ];

  const recentPayments = [
    { user: "Ngozi K", date: "Jun 21, 2024", amount: "₦ 10", course: "E-Business Model", regDate: "May 7, 2024" },
    { user: "Ngozi K", date: "Jun 21, 2024", amount: "₦ 10", course: "National Sustainable and Entrepreneurship Program (NSEP)", regDate: "May 7, 2024" },
    { user: "Ngozi K", date: "Jun 26, 2024", amount: "₦ 10", course: "Team Building", regDate: "May 7, 2024" },
    { user: "Ngozi K", date: "Jun 26, 2024", amount: "₦ 10", course: "Poultry Production", regDate: "May 7, 2024" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-none shadow-card hover:shadow-card-hover transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">{stat.title}</p>
                  <p className="text-4xl font-bold text-primary">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tables Section */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Students */}
        <Card className="border-none shadow-card">
          <CardHeader className="bg-foreground text-background">
            <CardTitle className="text-lg font-heading">Recent Students</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Student</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentStudents.map((student, index) => (
                    <tr key={index} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-accent rounded-full"></div>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{student.date}</td>
                      <td className="px-6 py-4">
                        <Button variant="link" size="sm" className="text-accent">
                          View Info
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border">
              <Button variant="link" className="text-accent">
                See All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-none shadow-card">
          <CardHeader className="bg-foreground text-background">
            <CardTitle className="text-lg font-heading">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Payment</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Course</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Reg. Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentPayments.map((payment, index) => (
                    <tr key={index} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-accent rounded-full"></div>
                          <span className="font-medium">{payment.user}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{payment.date}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{payment.amount}</td>
                      <td className="px-6 py-4 text-sm max-w-xs truncate">{payment.course}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{payment.regDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border">
              <Button variant="link" className="text-accent">
                See All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};