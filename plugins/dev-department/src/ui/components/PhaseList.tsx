import React from "react";
import type { Phase, PhaseStatus, FreezeState } from "../../worker/types";

const PHASE_STATUS_COLORS: Record<PhaseStatus, { bg: string; text: string }> = {
  DraftSpec:                { bg: "#f3f4f6", text: "#6b7280" },
  SpecApproved:             { bg: "#eff6ff", text: "#1d4ed8" },
  PRDAttached:              { bg: "#faf5ff", text: "#7c3aed" },
  ReadyForBuild:            { bg: "#ecfdf5", text: "#059669" },
  Accepted:                 { bg: "#dcfce7", text: "#16a34a" },
  ReworkRequired:           { bg: "#fff7ed", text: "#c2410c" },
  Closed:                   { bg: "#f3f4f6", text: "#9ca3af" },
};

const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  DraftSpec:                "Draft Spec",
  SpecApproved:             "Spec Approved",
  PRDAttached:              "PRD Attached",
  ReadyForBuild:            "Ready for Build",
  Accepted:                 "Accepted",
  ReworkRequired:           "Rework Required",
  Closed:                   "Closed",
};

const FREEZE_ICONS: Record<FreezeState, { icon: string; title: string; color: string }> = {
  Locked:                    { icon: "🔒", title: "Locked", color: "#dc2626" },
  FrozenDownstream:          { icon: "❄️", title: "Frozen Downstream", color: "#2563eb" },
  EditableDownstream:        { icon: "✏️", title: "Editable Downstream", color: "#16a34a" },
  DownstreamRevisionRequired:{ icon: "⚠️", title: "Downstream Revision Required", color: "#d97706" },
};

interface PhaseListProps {
  phases: Phase[];
  selectedPhaseId?: string | null;
  onSelect: (phase: Phase) => void;
  onAdd: () => void;
  onDelete: (phaseId: string) => void;
  onReorder: (phaseId: string, direction: "up" | "down") => void;
  /** Map of phaseId → has spec */
  hasSpec?: Record<string, boolean>;
  /** Map of phaseId → has PRD */
  hasPRD?: Record<string, boolean>;
}

export default function PhaseList({
  phases,
  selectedPhaseId,
  onSelect,
  onAdd,
  onDelete,
  onReorder,
  hasSpec = {},
  hasPRD = {},
}: PhaseListProps) {
  const sorted = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Header row */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 16px 4px",
      }}>
        <span style={{ fontWeight: 600, fontSize: "13px", color: "#374151" }}>Phases</span>
        <button
          onClick={onAdd}
          style={{
            padding: "4px 12px",
            backgroundColor: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          + Add Phase
        </button>
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: "24px 16px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
          No phases yet. Click "Add Phase" to get started.
        </div>
      ) : (
        <div style={{ padding: "4px 16px 12px" }}>
          {sorted.map((phase, index) => {
            const isSelected = phase.id === selectedPhaseId;
            const freezeInfo = FREEZE_ICONS[phase.freezeState];
            const statusColors = PHASE_STATUS_COLORS[phase.status];
            const specPresent = hasSpec[phase.id];
            const prdPresent = hasPRD[phase.id];

            return (
              <div
                key={phase.id}
                onClick={() => onSelect(phase)}
                style={{
                  padding: "10px 12px",
                  border: `1px solid ${isSelected ? "#2563eb" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  marginBottom: "6px",
                  backgroundColor: isSelected ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "#93c5fd";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                {/* Phase number */}
                <span style={{
                  minWidth: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  backgroundColor: isSelected ? "#2563eb" : "#e5e7eb",
                  color: isSelected ? "#fff" : "#374151",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {phase.phaseNumber}
                </span>

                {/* Title + badges */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: "13px", color: "#111827" }}>
                      {phase.title || "Untitled Phase"}
                    </span>
                    {/* Status badge */}
                    <span style={{
                      fontSize: "11px",
                      padding: "1px 7px",
                      borderRadius: "10px",
                      backgroundColor: statusColors.bg,
                      color: statusColors.text,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}>
                      {PHASE_STATUS_LABELS[phase.status]}
                    </span>
                    {/* Freeze indicator */}
                    <span
                      title={freezeInfo.title}
                      style={{ fontSize: "13px", cursor: "default" }}
                    >
                      {freezeInfo.icon}
                    </span>
                    {/* Spec icon */}
                    {specPresent && (
                      <span
                        title="Spec attached"
                        style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "10px", backgroundColor: "#eff6ff", color: "#1d4ed8", fontWeight: 500 }}
                      >
                        Spec
                      </span>
                    )}
                    {/* PRD icon */}
                    {prdPresent && (
                      <span
                        title="PRD attached"
                        style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "10px", backgroundColor: "#faf5ff", color: "#7c3aed", fontWeight: 500 }}
                      >
                        PRD
                      </span>
                    )}
                  </div>
                </div>

                {/* Reorder + delete controls */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    disabled={index === 0}
                    onClick={() => onReorder(phase.id, "up")}
                    title="Move up"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: index === 0 ? "default" : "pointer",
                      color: index === 0 ? "#d1d5db" : "#6b7280",
                      fontSize: "14px",
                      padding: "2px 4px",
                      lineHeight: 1,
                    }}
                  >
                    ▲
                  </button>
                  <button
                    disabled={index === sorted.length - 1}
                    onClick={() => onReorder(phase.id, "down")}
                    title="Move down"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: index === sorted.length - 1 ? "default" : "pointer",
                      color: index === sorted.length - 1 ? "#d1d5db" : "#6b7280",
                      fontSize: "14px",
                      padding: "2px 4px",
                      lineHeight: 1,
                    }}
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => onDelete(phase.id)}
                    title="Delete phase"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ef4444",
                      fontSize: "16px",
                      padding: "2px 4px",
                      lineHeight: 1,
                      marginLeft: "4px",
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
