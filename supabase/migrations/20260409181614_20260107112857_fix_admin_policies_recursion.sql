DROP POLICY IF EXISTS "Admins can view all support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update any support ticket" ON support_tickets;
CREATE POLICY "Admins can view all support tickets" ON support_tickets FOR SELECT TO authenticated USING (is_admin_user(auth.uid()));
CREATE POLICY "Admins can update any support ticket" ON support_tickets FOR UPDATE TO authenticated USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Admins can reply to any ticket" ON ticket_messages;
CREATE POLICY "Admins can view all ticket messages" ON ticket_messages FOR SELECT TO authenticated USING (is_admin_user(auth.uid()));
CREATE POLICY "Admins can reply to any ticket" ON ticket_messages FOR INSERT TO authenticated WITH CHECK (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Billing admins can view all payments" ON stripe_payment_history;
DROP POLICY IF EXISTS "Billing admins can manage payments" ON stripe_payment_history;
DROP POLICY IF EXISTS "Admins can update payment records" ON stripe_payment_history;
CREATE POLICY "Admins can view all payments" ON stripe_payment_history FOR SELECT TO authenticated USING (is_admin_user(auth.uid()));
CREATE POLICY "Admins can manage payments" ON stripe_payment_history FOR ALL TO authenticated USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all subscription tiers" ON subscription_tiers;
DROP POLICY IF EXISTS "Admins can update subscription tiers" ON subscription_tiers;
CREATE POLICY "Admins can view all subscription tiers" ON subscription_tiers FOR SELECT TO authenticated USING (is_admin_user(auth.uid()));
CREATE POLICY "Admins can update subscription tiers" ON subscription_tiers FOR UPDATE TO authenticated USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all user subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can update user subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can view all user subscriptions" ON user_subscriptions FOR SELECT TO authenticated USING (is_admin_user(auth.uid()));
CREATE POLICY "Admins can manage user subscriptions" ON user_subscriptions FOR ALL TO authenticated USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all FAQ articles" ON faq_articles;
DROP POLICY IF EXISTS "Admins can create FAQ articles" ON faq_articles;
DROP POLICY IF EXISTS "Admins can update FAQ articles" ON faq_articles;
DROP POLICY IF EXISTS "Admins can delete FAQ articles" ON faq_articles;
CREATE POLICY "Admins can manage FAQ articles" ON faq_articles FOR ALL TO authenticated USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can create quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can update quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can delete quiz questions" ON quiz_questions;
CREATE POLICY "Admins can manage quiz questions" ON quiz_questions FOR ALL TO authenticated USING (is_admin_user(auth.uid())) WITH CHECK (is_admin_user(auth.uid()));
