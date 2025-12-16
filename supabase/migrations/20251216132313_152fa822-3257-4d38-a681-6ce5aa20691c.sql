-- Add overview column to courses table for short course summaries
ALTER TABLE public.courses ADD COLUMN overview text;