-- Add loader column to stories table for storing loader messages in JSON format
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS loader jsonb;
