-- Create table for live sessions (Zoom classes)
CREATE TABLE public.live_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  zoom_meeting_id TEXT,
  zoom_join_url TEXT,
  zoom_start_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for instructor Zoom connection status
CREATE TABLE public.zoom_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  zoom_user_id TEXT,
  zoom_email TEXT,
  connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoom_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for live_sessions
-- Instructors can manage their own sessions
CREATE POLICY "Instructors can view their own sessions"
ON public.live_sessions
FOR SELECT
USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can create sessions"
ON public.live_sessions
FOR INSERT
WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Instructors can update their own sessions"
ON public.live_sessions
FOR UPDATE
USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can delete their own sessions"
ON public.live_sessions
FOR DELETE
USING (auth.uid() = instructor_id);

-- Students can view live sessions for courses they're enrolled in
CREATE POLICY "Students can view sessions for enrolled courses"
ON public.live_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrolled_courses ec
    WHERE ec.course_id = live_sessions.course_id
    AND ec.user_id = auth.uid()
  )
);

-- RLS policies for zoom_connections
CREATE POLICY "Users can view their own zoom connection"
ON public.zoom_connections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own zoom connection"
ON public.zoom_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own zoom connection"
ON public.zoom_connections
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_live_sessions_updated_at
BEFORE UPDATE ON public.live_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_zoom_connections_updated_at
BEFORE UPDATE ON public.zoom_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();