-- ============================================
-- ADD DELETE POLICY FOR NOTIFICATIONS
-- Allow users to delete their own notifications
-- ============================================

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());
