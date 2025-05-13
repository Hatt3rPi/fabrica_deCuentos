/*
  # Add Story Fields

  1. Changes
    - Add fields to stories table:
      - target_age (text)
      - literary_style (text)
      - central_message (text)
      - additional_details (text)
*/

-- Add new fields to stories table
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS target_age text,
ADD COLUMN IF NOT EXISTS literary_style text,
ADD COLUMN IF NOT EXISTS central_message text,
ADD COLUMN IF NOT EXISTS additional_details text;