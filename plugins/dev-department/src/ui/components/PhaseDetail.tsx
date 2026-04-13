import React, { useState, useEffect } from "react";
import type { Phase, Spec, PRD, PhaseStatus, FreezeState } from "../../worker/types";

const PHASE_STATUS_OPTIONS: { value: PhaseStatus; label: string }[] = [
  { value: "DraftSpec",                label: "Draft Spec" },
  { value: "SpecApproved",             label: "Spec Approved" },
  { value: "PRDAttached",              label: "PRD Attached" },
  { value: "ReadyForBuild",            label: "Ready for Build" },
  { value: "Accepted",                 label: "Accepted" },
  { value: "ReworkRequired",           label: "Rework Required" },
  { value: "Closed",                   label: "Closed" },
];

const FREEZE_STATE_OPTIONS: { value: FreezeState; label: string }[] = [
  { value: "Locked",                    label: "Locked" },
  { value: "FrozenDownstream",          label: "Frozen Downstream" },
  { value: "EditableDownstream",        label: "Editable Downstream" },
  { value: "DownstreamRevisionRequired", label: "Downstream Revision Required" },
];

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "4px",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "13px",
  color: "#111827",
  backgroundColor: "#fff",
  boxSizing: "border-box",
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  resize: "vertical",
  minHeight: "80px",
  lineHeight: "1.5",
};

const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  cursor: "pointer",
};

const FIELD_STYLE: React.CSSProperties = {
  marginBottom: "14px",
};

const SECTION_HEADING: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#374151",
  margin: "20px 0 10px",
  paddingBottom: "4px",
  borderBottom: "1px solid #e5e7eb",
};

const READONLY_BLOCK: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  backgroundColor: "#f9fafb",
  fontSize: "13px",
  color: "#6b7280",
};

const GRAYED_BLOCK: React.CSSProperties = {
  padding: "12px",
  border: "1px dashed #d1d5db",
  borderRadius: "6px",
  backgroundColor: "#f9fafb",
  fontSize: "13px",
  color: "#9ca3af",
  fontStyle: "italic",
};

interface PhaseDetailProps {
  phase: Phase;
  spec: Spec | null;
  prd: PRD | null;
  onSave: (updates: Partial<Phase>) => void;
  onCancel: () => void;
}

export default function PhaseDetail({ phase, spec, prd, onSave, onCancel }: PhaseDetailProps) {
  const [draft, setDraft] = useState<Phase>({ ...phase });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft({ ...phase });
    setDirty(false);
  }, [phase.id]);

  function update<K extends keyof Phase>(key: K, value: Phase[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function handleSave() {
    onSave({ ...draft, updatedAt: new Date().toISOString() });
    setDirty(false);
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "16px" }}>
      {/* Editable fields */}
      <div style={FIELD_STYLE}>
        <label style={LABEL_STYLE}>Phase Number</label>
        <input
          type="number"
          min={1}
          value={draft.phaseNumber}
          onChange={(e) => update("phaseNumber", Number(e.target.value))}
          style={{ ...INPUT_STYLE, width: "80px" }}
        />
      </div>

      <div style={FIELD_STYLE}>
        <label style={LABEL_STYLE}>Title</label>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Phase title"
          style={INPUT_STYLE}
        />
      </div>

      <div style={FIELD_STYLE}>
        <label style={LABEL_STYLE}>Objective</label>
        <input
          type="text"
          value={draft.objective}
          onChange={(e) => update("objective", e.target.value)}
          placeholder="What this phase achieves"
          style={INPUT_STYLE}
        />
      </div>

      <div style={FIELD_STYLE}>
        <label style={LABEL_STYLE}>Description</label>
        <textarea
          value={draft.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Detailed description of the phase scope and approach"
          style={TEXTAREA_STYLE}
        />
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
        <div style={{ flex: 1 }}>
          <label style={LABEL_STYLE}>Status</label>
          <select
            value={draft.status}
            onChange={(e) => update("status", e.target.value as PhaseStatus)}
            style={SELECT_STYLE}
          >
            {PHASE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={LABEL_STYLE}>Freeze State</label>
          <select
            value={draft.freezeState}
            onChange={(e) => update("freezeState", e.target.value as FreezeState)}
            style={SELECT_STYLE}
          >
            {FREEZE_STATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={FIELD_STYLE}>
        <label style={LABEL_STYLE}>Prerequisites</label>
        <textarea
          value={draft.prerequisites}
          onChange={(e) => update("prerequisites", e.target.value)}
          placeholder="What must be true or complete before this phase starts"
          style={TEXTAREA_STYLE}
        />
      </div>

      <div style={FIELD_STYLE}>
        <label style={LABEL_STYLE}>Success Criteria</label>
        <textarea
          value={draft.successCriteria}
          onChange={(e) => update("successCriteria", e.target.value)}
          placeholder="How we know this phase is done"
          style={TEXTAREA_STYLE}
        />
      </div>

      <div style={FIELD_STYLE}>
        <label style={LABEL_STYLE}>Risk Notes</label>
        <textarea
          value={draft.riskNotes}
          onChange={(e) => update("riskNotes", e.target.value)}
          placeholder="Known risks, mitigations, or open questions"
          style={TEXTAREA_STYLE}
        />
      </div>

      {/* Save / Cancel */}
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button
          onClick={handleSave}
          disabled={!dirty}
          style={{
            padding: "7px 18px",
            backgroundColor: dirty ? "#2563eb" : "#93c5fd",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: dirty ? "pointer" : "default",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "7px 18px",
            backgroundColor: "#f3f4f6",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          Cancel
        </button>
      </div>

      {/* Linked Spec (read-only) */}
      <div style={SECTION_HEADING}>Spec</div>
      {spec ? (
        <div style={READONLY_BLOCK}>
          <div style={{ fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
            {spec.title || "Untitled Spec"}
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px" }}>
            <span><strong>Version:</strong> {spec.version || "—"}</span>
            <span><strong>Author:</strong> {spec.author || "—"}</span>
            <span><strong>Approval:</strong> {spec.approvalState || "—"}</span>
          </div>
          {spec.sourceRef && (
            <div style={{ marginTop: "6px", fontSize: "12px" }}>
              <strong>Source:</strong>{" "}
              <span style={{ color: "#6b7280", wordBreak: "break-all" }}>{spec.sourceRef}</span>
            </div>
          )}
          {spec.notes && (
            <div style={{ marginTop: "6px", fontSize: "12px", color: "#6b7280" }}>{spec.notes}</div>
          )}
        </div>
      ) : (
        <div style={READONLY_BLOCK}>No spec attached to this phase.</div>
      )}

      {/* Linked PRD (read-only) */}
      <div style={SECTION_HEADING}>PRD</div>
      {prd ? (
        <div style={READONLY_BLOCK}>
          <div style={{ fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
            {prd.title || "Untitled PRD"}
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px" }}>
            <span><strong>Version:</strong> {prd.version || "—"}</span>
            <span><strong>Approval:</strong> {prd.approvalState || "—"}</span>
          </div>
          {prd.sourceRef && (
            <div style={{ marginTop: "6px", fontSize: "12px" }}>
              <strong>Source:</strong>{" "}
              <span style={{ color: "#6b7280", wordBreak: "break-all" }}>{prd.sourceRef}</span>
            </div>
          )}
          {prd.deviationNotes && (
            <div style={{ marginTop: "6px", fontSize: "12px" }}>
              <strong>Deviation Notes:</strong>{" "}
              <span style={{ color: "#6b7280" }}>{prd.deviationNotes}</span>
            </div>
          )}
          {prd.notes && (
            <div style={{ marginTop: "6px", fontSize: "12px", color: "#6b7280" }}>{prd.notes}</div>
          )}
        </div>
      ) : (
        <div style={READONLY_BLOCK}>No PRD attached to this phase.</div>
      )}

      {/* Grayed-out placeholders */}
      <div style={SECTION_HEADING}>Build Output</div>
      <div style={GRAYED_BLOCK}>Build output will appear here once a build has been dispatched.</div>

      <div style={SECTION_HEADING}>Review</div>
      <div style={GRAYED_BLOCK}>Review decision will appear here after a review is completed.</div>

      <div style={SECTION_HEADING}>Revision Events</div>
      <div style={{ ...GRAYED_BLOCK, marginBottom: "8px" }}>
        Revision events affecting this phase will appear here.
      </div>
    </div>
  );
}
