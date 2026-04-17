-- User feedback — floating widget submissions from marketing + app shell.
-- A product by Penguin Alley (penguinalley.com)

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  category TEXT NOT NULL CHECK (category IN ('bug', 'idea', 'praise', 'other')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 3 AND 2000),
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);
