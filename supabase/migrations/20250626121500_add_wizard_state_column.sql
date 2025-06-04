-- Store detailed wizard flow per story
ALTER TABLE stories ADD COLUMN IF NOT EXISTS wizard_state jsonb;
