-- Let an authenticated user read their OWN org memberships before any org
-- context is established. resolveRequestContext sets only app.current_user_id
-- first (it doesn't know the org yet) and needs to discover the user's orgs.
-- RLS combines permissive policies with OR, so the existing tenant_isolation
-- policy still governs all org-scoped access.
CREATE POLICY self_read ON memberships FOR SELECT
  USING (user_id = current_user_id());
