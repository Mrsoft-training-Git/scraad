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
    entityId: string,
    paymentType: "full" | "first" | "second",
    entityType: "course" | "program" = "course"
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const body: any = {
        email: user.email,
        paymentType,
        fullName: profile?.full_name || user.email,
      };

      if (entityType === "course") {
        body.courseId = entityId;
      } else {
        body.programId = entityId;
      }

      const { data, error } = await supabase.functions.invoke("initialize-payment", {
        body,
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
