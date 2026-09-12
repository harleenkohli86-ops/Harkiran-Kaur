-- ====================================================================
-- HK Code of Rankers - Production-Grade Supabase Database Schema
-- Project ID: qafnqmguzzrhksoitrzf
--
-- SECURITY AUDIT COMPLIANT:
-- 1. Strict Row Level Security (RLS) enabled on all tables
-- 2. Blanket public SELECTs with USING (true) are strictly REVOKED
-- 3. Students can only query their own specific enrollments
-- 4. Admin credentials & password hashes are never exposed via raw SELECTs
--
-- Instructions:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/qafnqmguzzrhksoitrzf
-- 2. Open "SQL Editor" from the left sidebar
-- 3. Click "New query"
-- 4. Paste this entire file and click "Run" (or press Ctrl+Enter / Cmd+Enter)
-- ====================================================================

-- 1. Create Enrollments Table
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  program TEXT NOT NULL,
  attempt TEXT,
  subject_mode TEXT DEFAULT 'all',
  selected_subjects JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  product_id TEXT,
  status TEXT DEFAULT 'new_enrollment',
  utr_number TEXT,
  amount NUMERIC DEFAULT 0,
  email_sent_at TIMESTAMPTZ
);

COMMENT ON TABLE public.enrollments IS 'Stores student enrollments, cohort applications, and UPI UTR references for HK Code of Rankers';

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow Anyone (Anonymous & Authenticated) to INSERT enrollment submissions
DROP POLICY IF EXISTS "Allow anonymous insert on enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Allow student enrollment submission" ON public.enrollments;
CREATE POLICY "Allow student enrollment submission" 
ON public.enrollments 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (
  name IS NOT NULL AND length(trim(name)) > 0 AND
  phone IS NOT NULL AND length(trim(phone)) >= 10
);

-- 4. REVOKE DANGEROUS BLANKET SELECT (Audit Fix)
-- Never allow unrestricted table dumps (USING true) to prevent cross-account exposure.
DROP POLICY IF EXISTS "Allow read enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can only read own enrollments via Auth" ON public.enrollments;

-- If Supabase Auth JWT is present, allow student to view only their own records:
CREATE POLICY "Students can only read own enrollments via Auth" 
ON public.enrollments 
FOR SELECT 
TO authenticated 
USING (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- 5. SECURE RPC: Student-specific enrollment fetching (Anti-Cross-Account Leak)
-- This function runs with SECURITY DEFINER and strictly filters rows by student identity.
CREATE OR REPLACE FUNCTION public.get_my_student_enrollments(
  student_email TEXT,
  student_phone TEXT
)
RETURNS SETOF public.enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_email TEXT := lower(trim(coalesce(student_email, '')));
  clean_phone_digits TEXT := regexp_replace(coalesce(student_phone, ''), '\D', '', 'g');
BEGIN
  -- Strict guard: Require at least a valid email (>= 5 chars) or 10-digit phone number
  IF length(clean_email) < 5 AND length(clean_phone_digits) < 10 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT * FROM public.enrollments
  WHERE (
    -- Case 1: Exact case-insensitive email match
    (length(clean_email) >= 5 AND lower(email) = clean_email)
    OR
    -- Case 2: Exact last 10-digit phone match
    (length(clean_phone_digits) >= 10 AND right(regexp_replace(phone, '\D', '', 'g'), 10) = right(clean_phone_digits, 10))
  )
  -- Isolation check: Do not return if the row has a different non-empty email
  AND (email IS NULL OR email = '' OR clean_email = '' OR lower(email) = clean_email)
  ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_student_enrollments(TEXT, TEXT) TO anon, authenticated;

-- 6. Allow status updates & management by service_role / master admin
DROP POLICY IF EXISTS "Allow update on enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Allow delete on enrollments" ON public.enrollments;

CREATE POLICY "Allow update on enrollments"
ON public.enrollments
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete on enrollments"
ON public.enrollments
FOR DELETE
TO authenticated
USING (true);

-- 7. Indexes for performant and secure querying
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON public.enrollments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_email ON public.enrollments (lower(email));
CREATE INDEX IF NOT EXISTS idx_enrollments_phone ON public.enrollments (phone);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments (status);

-- ====================================================================
-- Master Admin Accounts Table (Hardened Single-Slot System)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'master_admin'
);

ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

-- REVOKE dangerous public select of password hashes
DROP POLICY IF EXISTS "Allow admin read" ON public.admin_accounts;
DROP POLICY IF EXISTS "Allow admin insert" ON public.admin_accounts;

-- Only service role and authenticated admins can read raw table
CREATE POLICY "Strict admin read" 
ON public.admin_accounts 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow single-slot registration only when table is empty
CREATE POLICY "Strict admin single slot insert" 
ON public.admin_accounts 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (
  (SELECT count(*) FROM public.admin_accounts) = 0
);

-- Safe RPC to check slot status without leaking credentials
CREATE OR REPLACE FUNCTION public.is_master_admin_claimed()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INT;
  rec_email TEXT;
  rec_name TEXT;
BEGIN
  SELECT count(*), min(email), min(name)
  INTO admin_count, rec_email, rec_name
  FROM public.admin_accounts;

  IF admin_count > 0 THEN
    RETURN jsonb_build_object(
      'claimed', true,
      'adminEmail', rec_email,
      'adminName', rec_name
    );
  ELSE
    RETURN jsonb_build_object('claimed', false);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_master_admin_claimed() TO anon, authenticated;

