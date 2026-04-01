-- BUG-SV-014: Add admin-only DELETE policy for incidents
-- OSHA requires incident records preserved for 5 years.
-- Same pattern as toolbox_talks DELETE policy from migration 003.
create policy "Admins can delete incidents"
  on incidents for delete
  using (
    company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid
    and (select raw_app_meta_data->>'role' from auth.users where id = auth.uid()) = 'admin'
  );
