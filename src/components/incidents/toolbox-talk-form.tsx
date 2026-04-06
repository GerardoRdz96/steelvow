"use client";

import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { addEncryptedToolboxTalk } from "@/lib/db";

interface ToolboxTalkFormProps {
  companyId: string;
  projectId: string;
  workerId: string;
  projectName: string;
  workers: { id: string; name: string }[];
  onComplete: () => void;
  onBack: () => void;
}

const COMMON_TOPICS = [
  "Fall Protection",
  "Scaffold Safety",
  "Ladder Safety",
  "Electrical Safety",
  "Excavation & Trenching",
  "PPE Requirements",
  "Heat Illness Prevention",
  "Hazard Communication",
  "Fire Prevention",
  "Housekeeping",
];

export function ToolboxTalkForm({
  companyId,
  projectId,
  workerId,
  projectName,
  workers,
  onComplete,
  onBack,
}: ToolboxTalkFormProps) {
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"topic" | "attendees" | "sign">("topic");
  const [signingFor, setSigningFor] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const finalTopic = topic === "custom" ? customTopic.trim() : topic;
  const canProceedToAttendees = finalTopic.length > 0;
  const canProceedToSign = selectedAttendees.length > 0;

  const toggleAttendee = (workerId: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  };

  const selectAll = () => {
    setSelectedAttendees(workers.map((w) => w.id));
  };

  // Signature canvas handlers
  const startDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isDrawingRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineTo(x, y);
    ctx.stroke();
  }, []);

  const endDraw = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    if (!signingFor || !canvasRef.current) return;
    // SEC-SV-007: Validate signature canvas is not blank before saving
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hasContent = imageData.data.some((val, i) => i % 4 !== 3 && val !== 0);
      if (!hasContent) {
        setError("Please draw your signature before saving.");
        return;
      }
    }
    // BUG-SV-021: Use JPEG at 50% quality to reduce base64 bloat (~5x smaller)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
    // SEC-SV-007: Reject signatures exceeding 500KB base64 (prevents DB bloat)
    if (dataUrl.length > 500_000) {
      setError("Signature too complex. Please clear and sign again.");
      return;
    }
    setSignatures((prev) => ({ ...prev, [signingFor]: dataUrl }));
    setSigningFor(null);
    clearCanvas();
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      await addEncryptedToolboxTalk({
        offlineId: uuidv4(),
        companyId,
        projectId,
        ledBy: workerId,
        topic: finalTopic,
        durationMinutes,
        attendees: selectedAttendees,
        signatures,
        notes: notes.trim(),
        createdAt: now,
        syncedAt: null,
      });
      onComplete();
    } catch (err) {
      console.error("Failed to save toolbox talk:", err);
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [finalTopic, durationMinutes, selectedAttendees, signatures, notes, companyId, projectId, workerId, onComplete]);

  // Signing overlay
  if (signingFor) {
    const worker = workers.find((w) => w.id === signingFor);
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Signature</h2>
            <p className="text-xs text-concrete-600">{worker?.name}</p>
          </div>
          <button
            onClick={() => { setSigningFor(null); clearCanvas(); }}
            className="text-sm font-semibold text-concrete-600"
          >
            Cancel
          </button>
        </div>
        <div className="flex-1 p-4">
          <canvas
            ref={canvasRef}
            width={340}
            height={200}
            className="w-full border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          <p className="text-xs text-concrete-600 text-center mt-2">
            Sign with your finger or stylus
          </p>
        </div>
        <div className="p-4 border-t border-slate-200 flex gap-3">
          <button
            onClick={clearCanvas}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 min-h-[48px]"
          >
            Clear
          </button>
          <button
            onClick={saveSignature}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-orange-600 text-white min-h-[48px]"
          >
            Save Signature
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-slate-200 bg-white">
        <button
          onClick={step === "topic" ? onBack : () => setStep(step === "sign" ? "attendees" : "topic")}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200"
        >
          <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">Toolbox Talk</h1>
          <p className="text-xs text-concrete-600">{projectName}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="px-4 py-3 flex gap-2">
        {(["topic", "attendees", "sign"] as const).map((s, i) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${
            (step === "topic" && i === 0) || (step === "attendees" && i <= 1) || step === "sign"
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

      {/* Step 1: Topic */}
      {step === "topic" && (
        <div className="px-4 py-4 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3">Select Topic</h2>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`text-left p-3 rounded-xl border text-sm font-medium transition-colors min-h-[48px] ${
                    topic === t
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-orange-300"
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                onClick={() => setTopic("custom")}
                className={`text-left p-3 rounded-xl border text-sm font-medium transition-colors min-h-[48px] col-span-2 ${
                  topic === "custom"
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-orange-300"
                }`}
              >
                + Custom Topic
              </button>
            </div>
            {topic === "custom" && (
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Enter custom topic..."
                className="mt-3 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[48px]"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Duration (minutes)</label>
            <div className="flex gap-2">
              {[5, 10, 15, 20, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDurationMinutes(d)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors min-h-[48px] ${
                    durationMinutes === d
                      ? "bg-orange-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional talking points or notes..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              rows={3}
            />
          </div>

          <button
            onClick={() => setStep("attendees")}
            disabled={!canProceedToAttendees}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors min-h-[48px] disabled:opacity-50 disabled:bg-orange-300"
          >
            Next: Select Attendees
          </button>
        </div>
      )}

      {/* Step 2: Attendees */}
      {step === "attendees" && (
        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Select Attendees ({selectedAttendees.length})
            </h2>
            <button
              onClick={selectAll}
              className="text-xs font-semibold text-orange-600"
            >
              Select All
            </button>
          </div>

          {workers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <p className="text-sm text-concrete-600">No workers found. Add workers first.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {workers.map((w) => (
                <button
                  key={w.id}
                  onClick={() => toggleAttendee(w.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors min-h-[48px] flex items-center gap-3 ${
                    selectedAttendees.includes(w.id)
                      ? "border-orange-400 bg-orange-50"
                      : "border-slate-200 bg-white hover:border-orange-300"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                    selectedAttendees.includes(w.id)
                      ? "border-orange-600 bg-orange-600"
                      : "border-slate-300"
                  }`}>
                    {selectedAttendees.includes(w.id) && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{w.name}</span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setStep("sign")}
            disabled={!canProceedToSign}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors min-h-[48px] disabled:opacity-50 disabled:bg-orange-300"
          >
            Next: Collect Signatures
          </button>
        </div>
      )}

      {/* Step 3: Signatures */}
      {step === "sign" && (
        <div className="px-4 py-4 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Collect Signatures ({Object.keys(signatures).length}/{selectedAttendees.length})
          </h2>
          <p className="text-xs text-concrete-600">
            Tap each attendee to collect their signature. Signatures are optional but recommended.
          </p>

          <div className="space-y-2">
            {selectedAttendees.map((id) => {
              const w = workers.find((w) => w.id === id);
              const signed = !!signatures[id];
              return (
                <button
                  key={id}
                  onClick={() => setSigningFor(id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors min-h-[48px] flex items-center justify-between ${
                    signed ? "border-green-300 bg-green-50" : "border-slate-200 bg-white hover:border-orange-300"
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-900">{w?.name}</span>
                  <span className={`text-xs font-semibold ${signed ? "text-green-600" : "text-concrete-600"}`}>
                    {signed ? "Signed" : "Tap to sign"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-3 z-20">
            <button
              type="button"
              onClick={() => setStep("attendees")}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors min-h-[48px] disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 transition-colors min-h-[48px] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Complete Talk"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
