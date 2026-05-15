-- Run manually in Supabase SQL editor if columns are missing.
-- play_type may already exist; formation and play_category are additive.

ALTER TABLE plays
  ADD COLUMN IF NOT EXISTS formation text;

ALTER TABLE plays
  ADD COLUMN IF NOT EXISTS play_category text;

COMMENT ON COLUMN plays.formation IS 'Formation preset: scrum, lineout, both, kickoff, free-play';
COMMENT ON COLUMN plays.play_category IS 'UI category: attack, defence, set-piece';
