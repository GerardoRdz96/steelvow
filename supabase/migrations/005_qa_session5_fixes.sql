-- Migration 005: QA Session 5 bug fixes
-- BUG-SV-023 (P0): Add privacy_concern to incidents for OSHA 300 compliance
-- BUG-SV-030 (P2): Add where_event_occurred to osha_300_entries

-- BUG-SV-023: Privacy concern flag for OSHA 300 Form
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS privacy_concern boolean DEFAULT false;

-- BUG-SV-030: Store location in OSHA 300 entries
ALTER TABLE osha_300_entries ADD COLUMN IF NOT EXISTS where_event_occurred text DEFAULT '';
