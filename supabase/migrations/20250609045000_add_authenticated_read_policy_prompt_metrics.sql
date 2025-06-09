-- Add policy to allow any authenticated user to read prompt_metrics
-- This is needed for the analytics dashboard to work properly

-- First, drop the existing admin-only read policy
drop policy if exists "Admins read prompt metrics" on prompt_metrics;

-- Create a new policy that allows any authenticated user to read
create policy "Authenticated users can read prompt metrics" on prompt_metrics
for select to authenticated
using (true);

-- Keep the admin-only insert policy as is
-- (Only admins should be able to insert metrics)
