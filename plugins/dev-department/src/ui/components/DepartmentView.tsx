import React, { useState } from "react";
import type { DevProject, Phase, ProjectStatus, PhaseStatus } from "../../worker/types";
import ProjectHeader from "./ProjectHeader";

// Placeholder data — replace with real plugin state API calls
const MOCK_PROJECTS: DevProject[] = [];

const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string }> = {
  Draft:    { bg: "#f3f4f6", text: "#6b7280" },
  Active:   { bg: "#dcfce7", text: "#16a34a" },
  Blocked:  { bg: "#fee2e2", text: "#dc2626" },
  Archived: { bg: "#f3f4f6", text: "#9ca3af" },
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

function StatusBadge({ status }: { status: ProjectStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <span style={{
      padding: "2px 10px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: 600,
      backgroundColor: colors.bg,
      color: colors.text,
    }}>
      {status}
    </span>
  );
}

function PhaseList({ phases }: { phases: Phase[] }) {
  if (phases.length === 0) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
        No phases yet. Add a phase to get started.
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 16px" }}>
      {phases.map((phase) => (
        <div
          key={phase.id}
          style={{
            padding: "12px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            marginBottom: "8px",
            backgroundColor: "#fff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>
              Phase {phase.phaseNumber}: {phase.title}
            </span>
            <span style={{
              fontSize: "12px",
              padding: "2px 8px",
              borderRadius: "12px",
              backgroundColor: "#eff6ff",
              color: "#1d4ed8",
              fontWeight: 500,
            }}>
              {PHASE_STATUS_LABELS[phase.status]}
            </span>
          </div>
          {phase.objective && (
            <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#6b7280" }}>
              {phase.objective}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function DepartmentView() {
  const [projects, setProjects] = useState<DevProject[]>(MOCK_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<DevProject | null>(null);
  // In a real implementation, phases would be loaded per project
  const [phases] = useState<Phase[]>([]);

  const handleCreateProject = () => {
    const newProject: DevProject = {
      id: `proj-${Date.now()}`,
      name: "New Project",
      objective: "",
      owner: "",
      status: "Draft",
      activePhaseId: null,
      roadmapSummary: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => [...prev, newProject]);
    setSelectedProject(newProject);
  };

  const handleSaveProject = (updates: Partial<DevProject>) => {
    if (!selectedProject) return;
    const updated = { ...selectedProject, ...updates, updatedAt: new Date().toISOString() };
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedProject(updated);
  };

  // Detail view
  if (selectedProject) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", height: "100%" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #e5e7eb" }}>
          <button
            onClick={() => setSelectedProject(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#2563eb",
              fontSize: "14px",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ← Back to Projects
          </button>
        </div>

        <ProjectHeader
          project={selectedProject}
          phases={phases}
          onSave={handleSaveProject}
          onCancel={() => setSelectedProject(null)}
        />

        <div style={{ padding: "12px 16px 4px", fontWeight: 600, fontSize: "13px", color: "#374151" }}>
          Phases
        </div>
        <PhaseList phases={phases} />
      </div>
    );
  }

  // List view
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", height: "100%" }}>
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontWeight: 700, fontSize: "16px", color: "#111827" }}>
          Development Department
        </span>
        <button
          onClick={handleCreateProject}
          style={{
            padding: "6px 14px",
            backgroundColor: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          + Create Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div style={{ padding: "32px 16px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
          No projects yet. Click "Create Project" to get started.
        </div>
      ) : (
        <div style={{ padding: "8px" }}>
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              style={{
                padding: "12px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                marginBottom: "6px",
                cursor: "pointer",
                backgroundColor: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#93c5fd")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>
                  {project.name}
                </div>
                {project.objective && (
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                    {project.objective}
                  </div>
                )}
              </div>
              <StatusBadge status={project.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
