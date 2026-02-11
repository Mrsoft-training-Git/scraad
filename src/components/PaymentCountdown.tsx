import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Lock } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";

interface Enrollment {
  id: string;
  course_id: string;
  payment_status: string;
  second_payment_due_date: string | null;
  access_status: string;
}

interface Course {
  id: string;
  title: string;
  allows_part_payment: boolean;
  second_tranche_amount: number | null;
}

export const PaymentCountdown = () => {
  const [partialEnrollments, setPartialEnrollments] = useState<(Enrollment & { course: Course })[]>([]);
  const { initializePayment, loading } = usePayment();

  useEffect(() => {
    fetchPartialEnrollments();
  }, []);

  const fetchPartialEnrollments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", user.id)
      .in("payment_status", ["partial", "defaulted"]);

    if (!data || data.length === 0) return;

    // Fetch course details for each enrollment
    const courseIds = data.map((e) => e.course_id);
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title, allows_part_payment, second_tranche_amount")
      .in("id", courseIds);

    if (!courses) return;

    const courseMap = new Map(courses.map((c) => [c.id, c]));
    const enriched = data
      .map((e) => ({
        ...e,
        course: courseMap.get(e.course_id)!,
      }))
      .filter((e) => e.course);

    setPartialEnrollments(enriched);
  };

  if (partialEnrollments.length === 0) return null;

  return (
    <div className="space-y-3">
      {partialEnrollments.map((enrollment) => {
        const dueDate = enrollment.second_payment_due_date
          ? new Date(enrollment.second_payment_due_date)
          : null;
        const now = new Date();
        const isOverdue = dueDate ? now > dueDate : false;
        const daysLeft = dueDate
          ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        return (
          <Card
            key={enrollment.id}
            className={`border ${
              isOverdue || enrollment.payment_status === "defaulted"
                ? "border-destructive/50 bg-destructive/5"
                : "border-warning/50 bg-warning/5"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isOverdue || enrollment.payment_status === "defaulted"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning-foreground"
                    }`}
                  >
                    {isOverdue || enrollment.payment_status === "defaulted" ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {enrollment.course.title}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        isOverdue || enrollment.payment_status === "defaulted"
                          ? "text-destructive"
                          : "text-warning-foreground"
                      }`}
                    >
                      {isOverdue || enrollment.payment_status === "defaulted"
                        ? "Payment overdue. Access revoked."
                        : `Second payment due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
                    </p>
                    {enrollment.course.second_tranche_amount && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Amount: ₦{enrollment.course.second_tranche_amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isOverdue ? "destructive" : "default"}
                  className="flex-shrink-0 text-xs"
                  onClick={() =>
                    initializePayment(enrollment.course_id, "second")
                  }
                  disabled={loading}
                >
                  Pay Now
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
