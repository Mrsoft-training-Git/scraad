ALTER TABLE public.program_applications 
ADD COLUMN guardian_name text NULL,
ADD COLUMN guardian_phone text NULL,
ADD COLUMN guardian_email text NULL,
ADD COLUMN guardian_relationship text NULL;