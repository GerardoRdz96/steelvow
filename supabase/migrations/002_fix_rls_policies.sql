-- Fix BUG-SV-002: Split "for all" RLS policies into granular policies
-- OSHA 300 entries and workers: DELETE must be admin-only (regulatory requirement)

-- ============================================================
-- WORKERS: Replace broad "for all" with granular policies
-- ============================================================
drop policy if exists "Admins can manage workers" on workers;

create policy "Company members can insert workers"
  on workers for insert
  with check (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

create policy "Company members can update workers"
  on workers for update
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid)
  with check (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

create policy "Admins can delete workers"
  on workers for delete
  using (
    company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid
    and (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );

-- ============================================================
-- OSHA 300 ENTRIES: Replace broad "for all" with granular policies
-- DELETE is admin-only (regulatory: OSHA records must be preserved)
-- ============================================================
drop policy if exists "Company members can manage osha 300" on osha_300_entries;

create policy "Company members can insert osha 300"
  on osha_300_entries for insert
  with check (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

create policy "Company members can update osha 300"
  on osha_300_entries for update
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid)
  with check (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

create policy "Admins can delete osha 300"
  on osha_300_entries for delete
  using (
    company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid
    and (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );
