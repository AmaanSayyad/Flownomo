-- Table for access codes
CREATE TABLE IF NOT EXISTS public.access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    wallet_address TEXT UNIQUE, -- One wallet per code
    is_used BOOLEAN DEFAULT FALSE,
    created_by TEXT -- Can be an admin identifier
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON public.access_codes(code);

-- Update user_profiles table to include access_code
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS access_code TEXT REFERENCES public.access_codes(code);

-- Enable RLS for access_codes
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Policies for access_codes
-- Admin should be able to do everything (for now, using a simple policy)
CREATE POLICY "Admins can manage access codes" ON public.access_codes
    FOR ALL USING (true); -- In production, restrict to admin roles

-- Users can only see their own access code matching their wallet
CREATE POLICY "Users can view their own matched code" ON public.access_codes
    FOR SELECT USING (wallet_address = (SELECT user_address FROM public.user_profiles WHERE user_address = wallet_address));
