-- Add multi-modal input support columns to jobs table
ALTER TABLE jobs ADD COLUMN input_type TEXT NOT NULL DEFAULT 'video'
  CHECK (input_type IN ('video', 'image', 'text_spoken', 'text_visual'));

ALTER TABLE jobs ADD COLUMN text_content TEXT;

ALTER TABLE jobs ADD COLUMN text_style TEXT;
