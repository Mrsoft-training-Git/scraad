import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UsePaymentOptions {
  onSuccess?: () => void;
}

export const usePayment = (options?: UsePaymentOptions) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const initializePayment = async (
    courseId: string,
    paymentType: "full" | "first" | "second"
  ) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast({
          title: "Authentication Required",
          description: "Please log in to make a payment",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("initialize-payment", {
        body: {
          email: user.email,
          courseId,
          paymentType,
        },
      });

      if (error) throw error;

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { initializePayment, loading };
};
