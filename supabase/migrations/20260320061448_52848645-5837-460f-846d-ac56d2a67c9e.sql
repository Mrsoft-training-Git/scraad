
-- Add price and payment fields to programs table (matching courses pattern)
ALTER TABLE public.programs
ADD COLUMN price numeric NOT NULL DEFAULT 0,
ADD COLUMN allows_part_payment boolean NOT NULL DEFAULT false,
ADD COLUMN first_tranche_amount integer NULL,
ADD COLUMN second_tranche_amount integer NULL,
ADD COLUMN second_payment_due_days integer NULL;

-- Add payment_status to program_enrollments to track payment
ALTER TABLE public.program_enrollments
ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid',
ADD COLUMN access_status text NOT NULL DEFAULT 'pending_payment',
ADD COLUMN first_payment_date timestamptz NULL,
ADD COLUMN second_payment_date timestamptz NULL,
ADD COLUMN second_payment_due_date timestamptz NULL;
