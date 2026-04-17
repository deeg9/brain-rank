-- Allow users to insert their own credit_usage rows.
-- Without this, RLS silently blocked recordCreditUsage() so free-tier
-- credits never decremented after job creation.
CREATE POLICY "Users can insert own credit usage"
  ON credit_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);
