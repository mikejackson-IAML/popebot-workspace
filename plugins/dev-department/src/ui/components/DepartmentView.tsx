import React, { useState } from "react";
import type { DevProject, Phase, ProjectStatus, ConversationReference } from "../../worker/types";
import ProjectHeader from "./ProjectHeader";
import PhaseList from "./PhaseList";
import PhaseDetail from "./PhaseDetail";
import { ConversationRefs } from "./ConversationRefs";

// Placeholder data — replace with real plugin state API calls
const MOCK_PROJECTS: DevProject[] = [];

const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string }> = {
  Draft:    { bg: "#f3f4f6", text: "#6b7280" },
  Active:   { bg: "#dcfce7", text: "#16a34a" },
  Blocked:  { bg: "#fee2e2", text: "#dc2626" },
  Archived: { bg: "#f3f4f6", text: "#9ca3af" },
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

export default function DepartmentView() {
  const [projects, setProjects] = useState<DevProject[]>(MOCK_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<DevProject | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [conversationRefs, setConversationRefs] = useState<ConversationReference[]>([]);

  const handleSelectProject = (project: DevProject) => {
    setSelectedProject(project);
    setSelectedPhase(null);
    // phases would be loaded from store here; for now reset to local state
    setPhases([]);
  };

  const handleCreateProject = () => {
    const newProject: DevProject = {
      id: crypto.randomUUID(),
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
    handleSelectProject(newProject);
  };

  const handleSaveProject = (updates: Partial<DevProject>) => {
    if (!selectedProject) return;
    const updated = { ...selectedProject, ...updates, updatedAt: new Date().toISOString() };
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedProject(updated);
  };

  const handleAddPhase = () => {
    if (!selectedProject) return;
    const nextNumber = phases.length > 0
      ? Math.max(...phases.map((p) => p.phaseNumber)) + 1
      : 1;
    const newPhase: Phase = {
      id: crypto.randomUUID(),
      projectId: selectedProject.id,
      phaseNumber: nextNumber,
      title: `Phase ${nextNumber}`,
      objective: "",
      description: "",
      status: "DraftSpec",
      prerequisites: "",
      successCriteria: "",
      riskNotes: "",
      freezeState: "EditableDownstream",
      sortOrder: nextNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPhases((prev) => [...prev, newPhase]);
  };

  const handleDeletePhase = (phaseId: string) => {
    setPhases((prev) => prev.filter((p) => p.id !== phaseId));
    if (selectedPhase?.id === phaseId) setSelectedPhase(null);
    // Clear activePhaseId on project if it points to deleted phase
    if (selectedProject?.activePhaseId === phaseId) {
      handleSaveProject({ activePhaseId: null });
    }
  };

  const handleReorderPhase = (phaseId: string, direction: "up" | "down") => {
    const sorted = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((p) => p.id === phaseId);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const updatedA = { ...a, sortOrder: b.sortOrder };
    const updatedB = { ...b, sortOrder: a.sortOrder };
    setPhases((prev) =>
      prev.map((p) => (p.id === updatedA.id ? updatedA : p.id === updatedB.id ? updatedB : p))
    );
  };

  const handleSavePhase = (updates: Partial<Phase>) => {
    if (!selectedPhase) return;
    const updated = { ...selectedPhase, ...updates, updatedAt: new Date().toISOString() };
    setPhases((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedPhase(updated);
  };

  const handleSetActivePhase = (phaseId: string | null) => {
    handleSaveProject({ activePhaseId: phaseId });
  };

  const handleAddRef = (ref: Omit<ConversationReference, "id">) => {
    const newRef: ConversationReference = { ...ref, id: crypto.randomUUID() };
    setConversationRefs((prev) => [...prev, newRef]);
  };

  const handleUpdateRef = (id: string, updates: Partial<ConversationReference>) => {
    setConversationRefs((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const handleDeleteRef = (id: string) => {
    setConversationRefs((prev) => prev.filter((r) => r.id !== id));
  };

  // Phase detail view
  if (selectedProject && selectedPhase) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", height: "100%" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setSelectedPhase(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#2563eb",
              fontSize: "14px",
              padding: 0,
            }}
          >
            ← Back to {selectedProject.name}
          </button>
        </div>
        <PhaseDetail
          phase={selectedPhase}
          spec={null}
          prd={null}
          onSave={handleSavePhase}
          onCancel={() => setSelectedPhase(null)}
        />
      </div>
    );
  }

  // Project detail view
  if (selectedProject) {
    const projectRefs = conversationRefs.filter(
      (r) => r.scopeType === "project" && r.scopeId === selectedProject.id
    );

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

        {/* Active phase selector */}
        {phases.length > 0 && (
          <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Active Phase:</span>
            <select
              value={selectedProject.activePhaseId ?? ""}
              onChange={(e) => handleSetActivePhase(e.target.value || null)}
              style={{
                padding: "4px 8px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#111827",
                backgroundColor: "#fff",
                cursor: "pointer",
              }}
            >
              <option value="">— None —</option>
              {[...phases]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    Phase {p.phaseNumber}: {p.title}
                  </option>
                ))}
            </select>
          </div>
        )}

        <PhaseList
          phases={phases}
          selectedPhaseId={selectedPhase?.id ?? null}
          onSelect={(phase) => setSelectedPhase(phase)}
          onAdd={handleAddPhase}
          onDelete={handleDeletePhase}
          onReorder={handleReorderPhase}
        />

        <ConversationRefs
          references={projectRefs}
          scopeType="project"
          scopeId={selectedProject.id}
          onAdd={handleAddRef}
          onUpdate={handleUpdateRef}
          onDelete={handleDeleteRef}
        />
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
              onClick={() => handleSelectProject(project)}
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
