import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CreditCard } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";

interface LockedCourseScreenProps {
  courseTitle: string;
  courseId: string;
  paymentStatus: string;
  secondTranche?: number | null;
}

export const LockedCourseScreen = ({
  courseTitle,
  courseId,
  paymentStatus,
  secondTranche,
}: LockedCourseScreenProps) => {
  const { initializePayment, loading } = usePayment();

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full border-destructive/30 shadow-lg">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground">
            Access Locked
          </h2>
          <p className="text-sm text-muted-foreground">
            Your installment payment for <strong>{courseTitle}</strong> is
            overdue. Please complete payment to regain access.
          </p>
          {secondTranche && (
            <p className="text-lg font-bold text-primary">
              ₦{secondTranche.toLocaleString()} remaining
            </p>
          )}
          {paymentStatus === "partial" || paymentStatus === "defaulted" ? (
            <Button
              className="w-full"
              onClick={() => initializePayment(courseId, "second")}
              disabled={loading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? "Processing..." : "Pay Second Tranche"}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};
