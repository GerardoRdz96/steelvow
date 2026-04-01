export type PlanTier = "starter" | "pro" | "business";
export type Language = "en" | "es";
export type ProjectStatus = "active" | "completed" | "paused";
export type InspectionStatus = "draft" | "completed" | "synced";
export type IncidentType = "injury" | "near_miss" | "property_damage";
export type Severity = "minor" | "serious" | "fatal";
export type IncidentStatus = "open" | "investigating" | "closed";
export type SafetyProgramType =
  | "fall_protection"
  | "hazcom"
  | "respiratory"
  | "loto"
  | "heat";
export type ChecklistType =
  | "general"
  | "fall_protection"
  | "scaffolding"
  | "excavation"
  | "electrical"
  | "ppe";

export interface Company {
  id: string;
  name: string;
  ein: string | null;
  address: string | null;
  state: string | null;
  employee_count: number;
  plan_tier: PlanTier;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  company_id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  language_pref: Language;
  osha_10_cert_date: string | null;
  osha_30_cert_date: string | null;
  fall_protection_cert_date: string | null;
  forklift_cert_date: string | null;
  first_aid_cert_date: string | null;
  custom_certs: Record<string, string> | null;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  start_date: string | null;
  end_date: string | null;
  project_type: string | null;
  status: ProjectStatus;
  created_at: string;
}

export interface Inspection {
  id: string;
  project_id: string;
  company_id: string;
  worker_id: string;
  checklist_type: ChecklistType;
  status: InspectionStatus;
  score: number | null;
  findings: Record<string, unknown>[] | null;
  completed_at: string | null;
  synced_at: string | null;
  offline_id: string;
  created_at: string;
}

export interface Incident {
  id: string;
  project_id: string;
  company_id: string;
  reported_by: string;
  incident_type: IncidentType;
  severity: Severity;
  description: string;
  location_description: string | null;
  lat: number | null;
  lng: number | null;
  occurred_at: string;
  osha_reportable: boolean;
  root_cause: string | null;
  corrective_actions: Record<string, unknown>[] | null;
  status: IncidentStatus;
  photos: string[];
  offline_id: string;
  created_at: string;
}

export interface ToolboxTalk {
  id: string;
  project_id: string;
  company_id: string;
  led_by: string;
  topic: string;
  duration_minutes: number;
  attendees: string[];
  signatures: Record<string, string> | null;
  notes: string | null;
  offline_id: string;
  created_at: string;
}

export interface Photo {
  id: string;
  company_id: string;
  project_id: string;
  inspection_id: string | null;
  incident_id: string | null;
  storage_path: string;
  lat: number | null;
  lng: number | null;
  captured_at: string;
  captured_by: string;
  caption: string | null;
  offline_id: string;
  created_at: string;
}

export interface OSHA300Entry {
  id: string;
  company_id: string;
  incident_id: string;
  case_number: string;
  employee_name: string;
  job_title: string;
  date_of_injury: string;
  description: string;
  classification: string;
  days_away: number;
  days_restricted: number;
  death: boolean;
  year: number;
  created_at: string;
}

export interface SafetyProgram {
  id: string;
  company_id: string;
  program_type: SafetyProgramType;
  content: string;
  language: Language;
  version: number;
  generated_by: "ai" | "manual";
  last_reviewed_at: string | null;
  created_at: string;
}
