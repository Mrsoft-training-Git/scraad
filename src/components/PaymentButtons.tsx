import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Wallet } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";

interface PaymentButtonsProps {
  courseId: string;
  price: number;
  allowsPartPayment: boolean;
  firstTrancheAmount?: number | null;
  secondTrancheAmount?: number | null;
  enrollmentStatus?: string | null; // null = no enrollment, "partial", "paid", etc.
}

export const PaymentButtons = ({
  courseId,
  price,
  allowsPartPayment,
  firstTrancheAmount,
  secondTrancheAmount,
  enrollmentStatus,
}: PaymentButtonsProps) => {
  const { initializePayment, loading } = usePayment();

  // Already fully paid
  if (enrollmentStatus === "paid") {
    return null;
  }

  // Partial — show second tranche button
  if (enrollmentStatus === "partial" || enrollmentStatus === "defaulted") {
    return (
      <Button
        className="w-full"
        onClick={() => initializePayment(courseId, "second")}
        disabled={loading}
      >
        <CreditCard className="w-4 h-4 mr-2" />
        {loading ? "Processing..." : `Pay Second Tranche — ₦${(secondTrancheAmount || 0).toLocaleString()}`}
      </Button>
    );
  }

  // No enrollment yet — show purchase options
  return (
    <div className="space-y-2">
      <Button
        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
        onClick={() => initializePayment(courseId, "full")}
        disabled={loading}
      >
        <Wallet className="w-4 h-4 mr-2" />
        {loading ? "Processing..." : `Pay Full Amount — ₦${price.toLocaleString()}`}
      </Button>

      {allowsPartPayment && firstTrancheAmount && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => initializePayment(courseId, "first")}
          disabled={loading}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          {loading ? "Processing..." : `Pay First Tranche — ₦${firstTrancheAmount.toLocaleString()}`}
        </Button>
      )}
    </div>
  );
};
