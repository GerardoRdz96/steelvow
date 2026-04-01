-- Migration 003: QA Session 2 Bug Fixes
-- BUG-SV-006: incidents UPDATE policy missing WITH CHECK clause
-- BUG-SV-008: toolbox_talks missing explicit DELETE policy (admin-only)

-- ============================================================
-- BUG-SV-006: Add WITH CHECK to incidents UPDATE policy
-- Prevents company_id transfer attack
-- ============================================================
drop policy if exists "Company members can update incidents" on incidents;

create policy "Company members can update incidents"
  on incidents for update
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid)
  with check (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

-- ============================================================
-- BUG-SV-008: Add explicit admin-only DELETE policy for toolbox_talks
-- OSHA requires talk records to be preserved; only admins can delete
-- ============================================================
create policy "Only admins can delete toolbox talks"
  on toolbox_talks for delete
  using (
    company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid
    and (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );
