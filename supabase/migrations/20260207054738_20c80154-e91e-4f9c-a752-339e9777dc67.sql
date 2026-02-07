-- Create announcement_reads table to track which announcements users have read
CREATE TABLE public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  announcement_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

-- Enable RLS
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Users can insert their own read records
CREATE POLICY "Users can insert their own read records"
  ON public.announcement_reads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own read records
CREATE POLICY "Users can view their own read records"
  ON public.announcement_reads
  FOR SELECT
  USING (auth.uid() = user_id);

-- Instructors can view reads for their course announcements
CREATE POLICY "Instructors can view reads for their announcements"
  ON public.announcement_reads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM course_announcements ca
      WHERE ca.id = announcement_reads.announcement_id
        AND ca.instructor_id = auth.uid()
    )
  );

-- Admins can manage all reads
CREATE POLICY "Admins can manage all reads"
  ON public.announcement_reads
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));