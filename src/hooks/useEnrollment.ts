import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useEnrollment = () => {
  const [enrolling, setEnrolling] = useState(false);
  const { toast } = useToast();

  const enrollInCourse = async (courseId: string, courseName: string) => {
    setEnrolling(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to enroll in courses",
          variant: "destructive"
        });
        return false;
      }

      // Check if already enrolled
      const { data: existing } = await supabase
        .from("enrolled_courses")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Already Enrolled",
          description: "You are already enrolled in this course",
        });
        return false;
      }

      // Enroll in course
      const { error } = await supabase
        .from("enrolled_courses")
        .insert({
          user_id: user.id,
          course_id: courseId,
          course_name: courseName,
          progress: 0
        });

      if (error) throw error;

      // Also create an enrollment record with locked access (pay later)
      const { error: enrollError } = await supabase
        .from("enrollments")
        .insert({
          user_id: user.id,
          course_id: courseId,
          payment_status: "pending",
          access_status: "locked",
        });

      // Ignore unique constraint violations (already has enrollment)
      if (enrollError && !enrollError.message.includes("duplicate")) {
        console.error("Enrollment record error:", enrollError);
      }

      // Atomically increment students count using database function
      await supabase.rpc('increment_students_count', { course_id_input: courseId });

      toast({
        title: "Enrolled Successfully",
        description: `You have been enrolled in ${courseName}`,
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Enrollment Failed",
        description: error.message || "Failed to enroll in course",
        variant: "destructive"
      });
      return false;
    } finally {
      setEnrolling(false);
    }
  };

  return { enrollInCourse, enrolling };
};
