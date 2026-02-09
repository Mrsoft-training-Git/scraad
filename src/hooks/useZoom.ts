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
        .select("*")
        .eq("user_id", user.id)
        .single();

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
   * Placeholder function - will be implemented when Zoom OAuth is set up
   * Opens Zoom OAuth flow to connect account
   */
  const connectZoom = async () => {
    setConnecting(true);
    try {
      // TODO: Implement Zoom OAuth flow
      // This will redirect to Zoom OAuth and handle the callback
      toast({
        title: "Zoom Integration",
        description: "Zoom OAuth integration will be configured by the backend.",
      });
      
      // Simulate connection for UI demonstration
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("zoom_connections")
        .upsert({
          user_id: user.id,
          is_connected: false, // Will be set to true after OAuth
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Connect Zoom",
        description: "Zoom OAuth will be triggered here. Backend integration pending.",
      });
    } catch (error) {
      console.error("Error connecting Zoom:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to initiate Zoom connection.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Placeholder function - creates a live session in the database
   * Zoom meeting creation will be handled by backend
   */
  const createLiveSession = async (sessionData: CreateSessionData): Promise<LiveSession | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("live_sessions")
        .insert({
          title: sessionData.title,
          course_id: sessionData.course_id,
          instructor_id: user.id,
          scheduled_at: sessionData.scheduled_at,
          duration_minutes: sessionData.duration_minutes,
          status: "scheduled",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Session Created",
        description: "Live session has been scheduled. Zoom meeting will be created when backend is connected.",
      });

      return data as LiveSession;
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
   * Placeholder function - joins a live session
   * Will use Zoom Web SDK when implemented
   */
  const joinLiveSession = async (sessionId: string): Promise<{ success: boolean; joinUrl?: string }> => {
    try {
      const { data: session, error } = await supabase
        .from("live_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error) throw error;

      if (session.status !== "live") {
        toast({
          title: "Session Not Live",
          description: "This session is not currently live.",
          variant: "destructive",
        });
        return { success: false };
      }

      // TODO: Initialize Zoom Web SDK and join meeting
      return { success: true, joinUrl: session.zoom_join_url || undefined };
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
   * Placeholder function - starts a live session (instructor only)
   * Will use Zoom Web SDK when implemented
   */
  const startLiveSession = async (sessionId: string): Promise<{ success: boolean; startUrl?: string }> => {
    try {
      const { data: session, error: fetchError } = await supabase
        .from("live_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Update session status to live
      const { error: updateError } = await supabase
        .from("live_sessions")
        .update({ status: "live", updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      if (updateError) throw updateError;

      toast({
        title: "Session Started",
        description: "Your live class has started.",
      });

      // TODO: Initialize Zoom Web SDK and start meeting
      return { success: true, startUrl: session.zoom_start_url || undefined };
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
   * Ends a live session
   */
  const endLiveSession = async (sessionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("live_sessions")
        .update({ status: "ended", updated_at: new Date().toISOString() })
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

  return {
    isConnected,
    zoomConnection,
    loading,
    connecting,
    connectZoom,
    createLiveSession,
    joinLiveSession,
    startLiveSession,
    endLiveSession,
    refreshConnection: checkZoomConnection,
  };
};
