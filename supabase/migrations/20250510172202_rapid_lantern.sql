/*
  # Create stories and designs tables

  1. New Tables
    - `stories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `target_age` (text)
      - `literary_style` (text)
      - `central_message` (text)
      - `additional_details` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `story_designs`
      - `id` (uuid, primary key)
      - `story_id` (uuid, references stories)
      - `visual_style` (text)
      - `color_palette` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `story_pages`
      - `id` (uuid, primary key)
      - `story_id` (uuid, references stories)
      - `page_number` (integer)
      - `text` (text)
      - `image_url` (text)
      - `prompt` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `story_characters`
      - `id` (uuid, primary key)
      - `story_id` (uuid, references stories)
      - `character_id` (uuid, references characters)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  target_age text NOT NULL,
  literary_style text NOT NULL,
  central_message text NOT NULL,
  additional_details text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Story designs table
CREATE TABLE IF NOT EXISTS story_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories ON DELETE CASCADE NOT NULL,
  visual_style text NOT NULL,
  color_palette text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE story_designs ENABLE ROW LEVEL SECURITY;

-- Story pages table
CREATE TABLE IF NOT EXISTS story_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories ON DELETE CASCADE NOT NULL,
  page_number integer NOT NULL,
  text text NOT NULL,
  image_url text NOT NULL,
  prompt text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE story_pages ENABLE ROW LEVEL SECURITY;

-- Story characters junction table
CREATE TABLE IF NOT EXISTS story_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories ON DELETE CASCADE NOT NULL,
  character_id uuid REFERENCES characters ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(story_id, character_id)
);

ALTER TABLE story_characters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stories
CREATE POLICY "Users can read own stories"
  ON stories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create stories"
  ON stories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories"
  ON stories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON stories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for story_designs
CREATE POLICY "Users can read own story designs"
  ON story_designs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_designs.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create story designs"
  ON story_designs
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_designs.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own story designs"
  ON story_designs
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_designs.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own story designs"
  ON story_designs
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_designs.story_id
    AND stories.user_id = auth.uid()
  ));

-- RLS Policies for story_pages
CREATE POLICY "Users can read own story pages"
  ON story_pages
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_pages.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create story pages"
  ON story_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_pages.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own story pages"
  ON story_pages
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_pages.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own story pages"
  ON story_pages
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_pages.story_id
    AND stories.user_id = auth.uid()
  ));

-- RLS Policies for story_characters
CREATE POLICY "Users can read own story characters"
  ON story_characters
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_characters.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can create story characters"
  ON story_characters
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_characters.story_id
    AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own story characters"
  ON story_characters
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_characters.story_id
    AND stories.user_id = auth.uid()
  ));

-- Update triggers for updated_at columns
CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_designs_updated_at
  BEFORE UPDATE ON story_designs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_pages_updated_at
  BEFORE UPDATE ON story_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();