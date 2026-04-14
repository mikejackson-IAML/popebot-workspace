import React, { useState, useEffect } from "react";
import type { DevProject, ProjectStatus, Phase } from "../../worker/types";

interface ProjectHeaderProps {
  project: DevProject;
  phases: Phase[];
  onSave: (updates: Partial<DevProject>) => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: ProjectStatus[] = ["Draft", "Active", "Blocked", "Archived"];

const statusColors: Record<ProjectStatus, string> = {
  Draft: "#6b7280",
  Active: "#16a34a",
  Blocked: "#dc2626",
  Archived: "#9ca3af",
};

export default function ProjectHeader({ project, phases, onSave, onCancel }: ProjectHeaderProps) {
  const [name, setName] = useState(project.name);
  const [objective, setObjective] = useState(project.objective);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  useEffect(() => { setName(project.name); setObjective(project.objective); setStatus(project.status); }, [project.id, project.updatedAt]);

  const activePhase = phases.find((p) => p.id === project.activePhaseId);

  const handleSave = () => {
    onSave({ name, objective, status });
  };

  const isDirty =
    name !== project.name || objective !== project.objective || status !== project.status;

  return (
    <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            flex: 1,
            fontSize: "20px",
            fontWeight: 600,
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            padding: "6px 10px",
            outline: "none",
          }}
          placeholder="Project name"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "14px",
            color: statusColors[status],
            fontWeight: 600,
            outline: "none",
            cursor: "pointer",
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} style={{ color: statusColors[s] }}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        rows={3}
        style={{
          width: "100%",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          padding: "8px 10px",
          fontSize: "14px",
          resize: "vertical",
          outline: "none",
          boxSizing: "border-box",
        }}
        placeholder="Project objective"
      />

      {activePhase && (
        <div
          style={{
            marginTop: "10px",
            fontSize: "13px",
            color: "#6b7280",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span style={{ fontWeight: 600, color: "#374151" }}>Active phase:</span>
          <span style={{
            backgroundColor: "#eff6ff",
            color: "#1d4ed8",
            padding: "2px 8px",
            borderRadius: "12px",
            fontWeight: 500,
          }}>
            Phase {activePhase.phaseNumber}: {activePhase.title}
          </span>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          style={{
            padding: "6px 16px",
            backgroundColor: isDirty ? "#2563eb" : "#93c5fd",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: isDirty ? "pointer" : "not-allowed",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "6px 16px",
            backgroundColor: "#f3f4f6",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
