-- Allow admins to delete support tickets (no delete policy existed)
CREATE POLICY "Admins can delete support tickets"
  ON support_tickets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_admin = true
    )
  );
