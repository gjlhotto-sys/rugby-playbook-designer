-- Saved formation templates (player layouts per user)
CREATE TABLE IF NOT EXISTS formations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  base_formation text NOT NULL,
  players jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS formations_user_id_idx ON formations(user_id);

ALTER TABLE formations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own formations" ON formations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
