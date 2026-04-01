"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { addEncryptedIncident } from "@/lib/db";
import type { OfflineIncident } from "@/lib/db";

interface IncidentFormProps {
  companyId: string;
  projectId: string;
  workerId: string;
  projectName: string;
  onComplete: () => void;
  onBack: () => void;
}

const INCIDENT_TYPES = [
  { value: "injury" as const, label: "Injury", icon: "!", color: "red" },
  { value: "near_miss" as const, label: "Near Miss", icon: "~", color: "yellow" },
  { value: "property_damage" as const, label: "Property Damage", icon: "#", color: "blue" },
];

const SEVERITIES = [
  { value: "minor" as const, label: "Minor", description: "First aid only, no lost time" },
  { value: "serious" as const, label: "Serious", description: "Medical treatment, lost days" },
  { value: "fatal" as const, label: "Fatal", description: "Fatality or imminent danger" },
];

type Step = "type" | "details" | "review";

export function IncidentForm({
  companyId,
  projectId,
  workerId,
  projectName,
  onComplete,
  onBack,
}: IncidentFormProps) {
  const [step, setStep] = useState<Step>("type");
  const [incidentType, setIncidentType] = useState<OfflineIncident["incidentType"] | null>(null);
  const [severity, setSeverity] = useState<OfflineIncident["severity"] | null>(null);
  const [description, setDescription] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [oshaReportable, setOshaReportable] = useState(false);
  const [privacyConcern, setPrivacyConcern] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canProceedToDetails = incidentType !== null && severity !== null;
  const canProceedToReview = description.trim().length >= 10;

  const handleSave = useCallback(async () => {
    if (!incidentType || !severity) return;
    setSaving(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      await addEncryptedIncident({
        offlineId: uuidv4(),
        companyId,
        projectId,
        reportedBy: workerId,
        incidentType,
        severity,
        description: description.trim(),
        locationDescription: locationDescription.trim(),
        occurredAt: new Date(occurredAt).toISOString(),
        oshaReportable,
        privacyConcern,
        photos: [],
        createdAt: now,
        syncedAt: null,
      });
      onComplete();
    } catch (err) {
      console.error("Failed to save incident:", err);
      setError("Failed to save incident. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [incidentType, severity, description, locationDescription, occurredAt, oshaReportable, privacyConcern, companyId, projectId, workerId, onComplete]);

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-slate-200 bg-white">
        <button
          onClick={step === "type" ? onBack : () => setStep(step === "review" ? "details" : "type")}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200"
        >
          <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">Report Incident</h1>
          <p className="text-xs text-concrete-600">{projectName}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="px-4 py-3 flex gap-2">
        {(["type", "details", "review"] as Step[]).map((s, i) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${
            (step === "type" && i === 0) || (step === "details" && i <= 1) || step === "review"
              ? "bg-orange-600"
              : "bg-slate-200"
          }`} />
        ))}
      </div>

      {error && (
        <div className="mx-4 mt-2 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-red-800">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 text-sm font-bold ml-3">X</button>
        </div>
      )}

      {/* Step 1: Type & Severity */}
      {step === "type" && (
        <div className="px-4 py-4 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3">What happened?</h2>
            <div className="space-y-2">
              {INCIDENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setIncidentType(t.value)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors min-h-[56px] flex items-center gap-4 ${
                    incidentType === t.value
                      ? "border-orange-400 bg-orange-50"
                      : "border-slate-200 bg-white hover:border-orange-300"
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg ${
                    t.color === "red" ? "bg-red-50 text-red-600" :
                    t.color === "yellow" ? "bg-yellow-50 text-yellow-600" :
                    "bg-blue-50 text-blue-600"
                  }`}>
                    {t.icon}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3">Severity</h2>
            <div className="space-y-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSeverity(s.value)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors min-h-[48px] ${
                    severity === s.value
                      ? "border-orange-400 bg-orange-50"
                      : "border-slate-200 bg-white hover:border-orange-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{s.label}</p>
                  <p className="text-xs text-concrete-600">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep("details")}
            disabled={!canProceedToDetails}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors min-h-[48px] disabled:opacity-50 disabled:bg-orange-300"
          >
            Next: Details
          </button>
        </div>
      )}

      {/* Step 2: Details */}
      {step === "details" && (
        <div className="px-4 py-4 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened in detail (minimum 10 characters)..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none min-h-[120px]"
              rows={5}
            />
            <p className="text-xs text-concrete-600 mt-1">{description.length} characters</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Location</label>
            <input
              type="text"
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
              placeholder="e.g., Floor 3, near elevator shaft"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">When did it occur?</label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[48px]"
            />
          </div>

          <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4">
            <input
              type="checkbox"
              id="osha-reportable"
              checked={oshaReportable}
              onChange={(e) => setOshaReportable(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-400"
            />
            <label htmlFor="osha-reportable" className="text-sm">
              <span className="font-semibold text-slate-900">OSHA Reportable</span>
              <br />
              <span className="text-xs text-concrete-600">
                Hospitalization, amputation, loss of eye, or fatality
              </span>
            </label>
          </div>

          {incidentType === "injury" && (
            <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                id="privacy-concern"
                checked={privacyConcern}
                onChange={(e) => setPrivacyConcern(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-400"
              />
              <label htmlFor="privacy-concern" className="text-sm">
                <span className="font-semibold text-slate-900">Privacy Concern Case</span>
                <br />
                <span className="text-xs text-concrete-600">
                  Injury to intimate body parts, reproductive system, or sexual assault (name hidden on OSHA 300)
                </span>
              </label>
            </div>
          )}

          <button
            onClick={() => setStep("review")}
            disabled={!canProceedToReview}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors min-h-[48px] disabled:opacity-50 disabled:bg-orange-300"
          >
            Next: Review
          </button>
        </div>
      )}

      {/* Step 3: Review */}
      {step === "review" && (
        <div className="px-4 py-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-xs font-semibold text-concrete-600">Type</span>
              <span className="text-sm font-bold text-slate-900 capitalize">
                {incidentType?.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-semibold text-concrete-600">Severity</span>
              <span className={`text-sm font-bold capitalize ${
                severity === "fatal" ? "text-red-600" :
                severity === "serious" ? "text-orange-600" :
                "text-yellow-600"
              }`}>
                {severity}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-semibold text-concrete-600">OSHA Reportable</span>
              <span className="text-sm font-bold text-slate-900">{oshaReportable ? "Yes" : "No"}</span>
            </div>
            {privacyConcern && (
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-concrete-600">Privacy Concern</span>
                <span className="text-sm font-bold text-orange-600">Yes — name hidden on OSHA 300</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-xs font-semibold text-concrete-600">When</span>
              <span className="text-sm font-bold text-slate-900">
                {new Date(occurredAt).toLocaleString()}
              </span>
            </div>
            {locationDescription && (
              <div className="flex justify-between">
                <span className="text-xs font-semibold text-concrete-600">Location</span>
                <span className="text-sm font-bold text-slate-900">{locationDescription}</span>
              </div>
            )}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-semibold text-concrete-600">Description</span>
              <p className="text-sm text-slate-700 mt-1">{description}</p>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-3 z-20">
            <button
              type="button"
              onClick={() => setStep("details")}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors min-h-[48px] disabled:opacity-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors min-h-[48px] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Submit Report"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
