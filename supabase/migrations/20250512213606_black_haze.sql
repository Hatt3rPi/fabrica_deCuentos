/*
  # Add missing stories fields

  1. Changes
    - Add target_age field
    - Add literary_style field
    - Add central_message field
    - Add additional_details field

  2. Notes
    - Only adds new fields since table and policies already exist
    - All fields are nullable to allow gradual population
*/

-- Add new fields to stories table
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS target_age text,
ADD COLUMN IF NOT EXISTS literary_style text,
ADD COLUMN IF NOT EXISTS central_message text,
ADD COLUMN IF NOT EXISTS additional_details text;