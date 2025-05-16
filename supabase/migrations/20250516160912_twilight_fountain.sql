/*
  # Add character view URL fields
  
  1. Changes
    - Add frontal_view_url column
    - Add side_view_url column
    - Add back_view_url column
    
  2. Notes
    - All fields are nullable TEXT columns
    - No default values set
*/

ALTER TABLE characters
ADD COLUMN frontal_view_url TEXT,
ADD COLUMN side_view_url TEXT,
ADD COLUMN back_view_url TEXT;