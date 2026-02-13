import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CreditCard } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";

interface LockedCourseScreenProps {
  courseTitle: string;
  courseId: string;
  paymentStatus: string;
  secondTranche?: number | null;
  coursePrice?: number | null;
  firstTranche?: number | null;
  allowsPartPayment?: boolean;
}

export const LockedCourseScreen = ({
  courseTitle,
  courseId,
  paymentStatus,
  secondTranche,
  coursePrice,
  firstTranche,
  allowsPartPayment,
}: LockedCourseScreenProps) => {
  const { initializePayment, loading } = usePayment();

  const isPending = paymentStatus === "pending";
  const isPartialOrDefaulted = paymentStatus === "partial" || paymentStatus === "defaulted";

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full border-destructive/30 shadow-lg">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground">
            {isPending ? "Payment Required" : "Access Locked"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isPending
              ? <>You enrolled in <strong>{courseTitle}</strong> without payment. Please complete payment to access the full course content.</>
              : <>Your installment payment for <strong>{courseTitle}</strong> is overdue. Please complete payment to regain access.</>
            }
          </p>

          {isPending && coursePrice && (
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => initializePayment(courseId, "full")}
                disabled={loading}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {loading ? "Processing..." : `Pay Full Amount — ₦${coursePrice.toLocaleString()}`}
              </Button>
              {allowsPartPayment && firstTranche && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => initializePayment(courseId, "first")}
                  disabled={loading}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {loading ? "Processing..." : `Pay First Tranche — ₦${firstTranche.toLocaleString()}`}
                </Button>
              )}
            </div>
          )}

          {isPartialOrDefaulted && secondTranche && (
            <>
              <p className="text-lg font-bold text-primary">
                ₦{secondTranche.toLocaleString()} remaining
              </p>
              <Button
                className="w-full"
                onClick={() => initializePayment(courseId, "second")}
                disabled={loading}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {loading ? "Processing..." : "Pay Second Tranche"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
