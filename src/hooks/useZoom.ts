import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LiveSession {
  id: string;
  title: string;
  course_id: string | null;
  instructor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: "scheduled" | "live" | "ended" | "cancelled";
  zoom_meeting_id: string | null;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  created_at: string;
  updated_at: string;
  course?: {
    title: string;
  };
  instructor?: {
    full_name: string;
  };
}

export interface ZoomConnection {
  id: string;
  user_id: string;
  is_connected: boolean;
  zoom_user_id: string | null;
  zoom_email: string | null;
  connected_at: string | null;
}

export interface CreateSessionData {
  title: string;
  course_id: string;
  scheduled_at: string;
  duration_minutes: number;
}

export interface ZoomSignatureData {
  signature: string;
  sdkKey: string;
  meetingNumber: string;
  password: string;
}

export const useZoom = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [zoomConnection, setZoomConnection] = useState<ZoomConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkZoomConnection();
  }, []);

  const checkZoomConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("zoom_connections")
        .select("id, user_id, is_connected, zoom_user_id, zoom_email, connected_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setZoomConnection(data);
        setIsConnected(data.is_connected);
      }
    } catch (error) {
      console.error("Error checking Zoom connection:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calls zoom-connect-start edge function and redirects to Zoom OAuth
   */
  const connectZoom = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("zoom-connect-start", {
        method: "POST",
      });

      if (error) throw error;
      if (!data?.authorization_url) throw new Error("No authorization URL returned");

      // Redirect to Zoom OAuth
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error("Error connecting Zoom:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to initiate Zoom connection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Handles Zoom OAuth callback code exchange via edge function
   */
  const handleOAuthCallback = async (code: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("zoom-oauth-callback", {
        method: "POST",
        body: { code },
      });

      if (error) throw error;

      toast({
        title: "Zoom Connected",
        description: "Your Zoom account has been connected successfully.",
      });

      await checkZoomConnection();
      return true;
    } catch (error) {
      console.error("Error in OAuth callback:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to complete Zoom connection.",
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Creates a live session via the zoom-create-session edge function
   */
  const createLiveSession = async (sessionData: CreateSessionData): Promise<LiveSession | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("zoom-create-session", {
        method: "POST",
        body: {
          courseId: sessionData.course_id,
          title: sessionData.title,
          startTime: sessionData.scheduled_at,
          duration: sessionData.duration_minutes,
        },
      });

      if (error) throw error;

      toast({
        title: "Session Created",
        description: "Live session has been scheduled with Zoom.",
      });

      return data?.session as LiveSession;
    } catch (error) {
      console.error("Error creating live session:", error);
      toast({
        title: "Error",
        description: "Failed to create live session.",
        variant: "destructive",
      });
      return null;
    }
  };

  /**
   * Gets a Zoom Meeting SDK signature for joining/hosting a session
   */
  const getZoomSignature = async (sessionId: string, role: 0 | 1): Promise<ZoomSignatureData | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("zoom-generate-signature", {
        method: "POST",
        body: { sessionId, role },
      });

      if (error) throw error;
      return data as ZoomSignatureData;
    } catch (error) {
      console.error("Error getting Zoom signature:", error);
      toast({
        title: "Error",
        description: "Failed to get meeting credentials.",
        variant: "destructive",
      });
      return null;
    }
  };

  /**
   * Joins a live session as a student (role=0) — fetches SDK signature
   */
  const joinLiveSession = async (sessionId: string): Promise<{ success: boolean; signatureData?: ZoomSignatureData }> => {
    try {
      const signatureData = await getZoomSignature(sessionId, 0);
      if (!signatureData) return { success: false };
      return { success: true, signatureData };
    } catch (error) {
      console.error("Error joining session:", error);
      toast({
        title: "Error",
        description: "Failed to join live session.",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  /**
   * Starts a live session as an instructor (role=1) — fetches SDK signature
   */
  const startLiveSession = async (sessionId: string): Promise<{ success: boolean; signatureData?: ZoomSignatureData }> => {
    try {
      const signatureData = await getZoomSignature(sessionId, 1);
      if (!signatureData) return { success: false };

      // Update session status to "live" in the database
      const { error: updateError } = await supabase
        .from("live_sessions")
        .update({ status: "live" })
        .eq("id", sessionId);

      if (updateError) {
        console.error("Error updating session status:", updateError);
      }

      toast({
        title: "Session Started",
        description: "Your live class has started.",
      });

      return { success: true, signatureData };
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: "Failed to start live session.",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  /**
   * Ends a live session via the zoom-end-session edge function
   */
  const endLiveSession = async (sessionId: string): Promise<boolean> => {
    try {
      // Update session status to "ended" in the database
      const { error } = await supabase
        .from("live_sessions")
        .update({ status: "ended" })
        .eq("id", sessionId);

      if (error) throw error;

      toast({
        title: "Session Ended",
        description: "Your live class has ended.",
      });

      return true;
    } catch (error) {
      console.error("Error ending session:", error);
      toast({
        title: "Error",
        description: "Failed to end live session.",
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Fetches recording for a completed session
   */
  const fetchRecording = async (sessionId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("zoom-fetch-recording", {
        method: "POST",
        body: { sessionId },
      });

      if (error) throw error;
      return data?.recording_url || null;
    } catch (error) {
      console.error("Error fetching recording:", error);
      return null;
    }
  };

  return {
    isConnected,
    zoomConnection,
    loading,
    connecting,
    connectZoom,
    handleOAuthCallback,
    createLiveSession,
    joinLiveSession,
    startLiveSession,
    endLiveSession,
    fetchRecording,
    getZoomSignature,
    refreshConnection: checkZoomConnection,
  };
};
