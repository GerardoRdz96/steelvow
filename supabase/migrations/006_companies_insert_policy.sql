-- Migration 006: BUG-SV-064 — Add INSERT policy for companies table
-- During onboarding, authenticated users need to create their company.
-- At that point they don't have a company_id in metadata yet,
-- so the policy allows any authenticated user to insert.
-- The setupCompany action immediately sets company_id in metadata,
-- preventing duplicate inserts (guard in actions.ts).

CREATE POLICY "Authenticated users can create a company"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);
