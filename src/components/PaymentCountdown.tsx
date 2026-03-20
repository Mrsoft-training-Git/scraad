import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Lock } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";

interface PartialItem {
  id: string;
  item_id: string;
  item_type: "course" | "program";
  title: string;
  payment_status: string;
  second_payment_due_date: string | null;
  second_tranche_amount: number | null;
}

export const PaymentCountdown = () => {
  const [items, setItems] = useState<PartialItem[]>([]);
  const { initializePayment, loading } = usePayment();

  useEffect(() => {
    fetchPartialPayments();
  }, []);

  const fetchPartialPayments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const results: PartialItem[] = [];

    // Fetch partial course enrollments
    const { data: courseEnr } = await supabase
      .from("enrollments")
      .select("id, course_id, payment_status, second_payment_due_date")
      .eq("user_id", user.id)
      .in("payment_status", ["partial", "defaulted"]);

    if (courseEnr && courseEnr.length > 0) {
      const courseIds = courseEnr.map(e => e.course_id);
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, second_tranche_amount")
        .in("id", courseIds);
      const courseMap = new Map(courses?.map(c => [c.id, c]) || []);

      courseEnr.forEach(e => {
        const c = courseMap.get(e.course_id);
        if (c) {
          results.push({
            id: e.id,
            item_id: e.course_id,
            item_type: "course",
            title: c.title,
            payment_status: e.payment_status,
            second_payment_due_date: e.second_payment_due_date,
            second_tranche_amount: c.second_tranche_amount,
          });
        }
      });
    }

    // Fetch partial program enrollments
    const { data: progEnr } = await supabase
      .from("program_enrollments")
      .select("id, program_id, payment_status, second_payment_due_date")
      .eq("user_id", user.id)
      .in("payment_status", ["partial", "defaulted"]);

    if (progEnr && progEnr.length > 0) {
      const programIds = progEnr.map(e => e.program_id);
      const { data: programs } = await supabase
        .from("programs")
        .select("id, title, second_tranche_amount")
        .in("id", programIds);
      const progMap = new Map(programs?.map(p => [p.id, p]) || []);

      progEnr.forEach(e => {
        const p = progMap.get(e.program_id);
        if (p) {
          results.push({
            id: e.id,
            item_id: e.program_id,
            item_type: "program",
            title: p.title,
            payment_status: e.payment_status,
            second_payment_due_date: e.second_payment_due_date,
            second_tranche_amount: p.second_tranche_amount,
          });
        }
      });
    }

    setItems(results);
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const dueDate = item.second_payment_due_date ? new Date(item.second_payment_due_date) : null;
        const now = new Date();
        const isOverdue = dueDate ? now > dueDate : false;
        const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        return (
          <Card
            key={`${item.item_type}-${item.id}`}
            className={`border ${
              isOverdue || item.payment_status === "defaulted"
                ? "border-destructive/50 bg-destructive/5"
                : "border-warning/50 bg-warning/5"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isOverdue || item.payment_status === "defaulted"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning-foreground"
                    }`}
                  >
                    {isOverdue || item.payment_status === "defaulted" ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase flex-shrink-0 ${
                        item.item_type === "course" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                      }`}>
                        {item.item_type}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-0.5 ${
                        isOverdue || item.payment_status === "defaulted"
                          ? "text-destructive"
                          : "text-warning-foreground"
                      }`}
                    >
                      {isOverdue || item.payment_status === "defaulted"
                        ? "Payment overdue. Access revoked."
                        : `Second payment due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
                    </p>
                    {item.second_tranche_amount && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Amount: ₦{item.second_tranche_amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isOverdue ? "destructive" : "default"}
                  className="flex-shrink-0 text-xs"
                  onClick={() =>
                    initializePayment(item.item_id, "second", item.item_type)
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
