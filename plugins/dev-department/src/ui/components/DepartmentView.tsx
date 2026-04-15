import React, { useState, useEffect } from "react";
import type { DevProject, Phase, Spec, PRD, ProjectStatus, ConversationReference } from "../../worker/types.js";
import { store } from "../../worker/state.js";
import ProjectHeader from "./ProjectHeader.js";
import PhaseList from "./PhaseList.js";
import PhaseDetail from "./PhaseDetail.js";
import { ConversationRefs } from "./ConversationRefs.js";


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
  const [projects, setProjects] = useState<DevProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<DevProject | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [currentSpec, setCurrentSpec] = useState<Spec | null>(null);
  const [currentPRD, setCurrentPRD] = useState<PRD | null>(null);

  // Load from store on mount
  useEffect(() => { setProjects(store.listProjects()); }, []);
  const [conversationRefs, setConversationRefs] = useState<ConversationReference[]>([]);

  const handleSelectProject = (project: DevProject) => {
    setSelectedProject(project);
    setPhases(store.getPhasesByProject(project.id));
    setSelectedPhase(null);
    setCurrentSpec(null);
    setCurrentPRD(null);
  };

  const handleCreateProject = () => {
    const project = store.createProject({ name: "New Project", objective: "", owner: "Mike", status: "Draft", activePhaseId: null, roadmapSummary: "" });
    setProjects(store.listProjects());
    setSelectedProject(project);
    setPhases([]);
  };

  const handleSaveProject = (updates: Partial<DevProject>) => {
    if (!selectedProject) return;
    const updated = store.updateProject(selectedProject.id, updates);
    setSelectedProject(updated);
    setProjects(store.listProjects());
  };

  const handleAddPhase = () => {
    if (!selectedProject) return;
    const existingPhases = store.getPhasesByProject(selectedProject.id);
    store.createPhase({ projectId: selectedProject.id, phaseNumber: existingPhases.length + 1, title: "New Phase", objective: "", description: "", status: "DraftSpec", prerequisites: "", successCriteria: "", riskNotes: "", freezeState: "EditableDownstream", sortOrder: existingPhases.length });
    setPhases(store.getPhasesByProject(selectedProject.id));
  };

  const handleDeletePhase = (phaseId: string) => {
    store.deletePhase(phaseId);
    if (selectedProject) setPhases(store.getPhasesByProject(selectedProject.id));
    if (selectedPhase?.id === phaseId) setSelectedPhase(null);
  };

  const handleReorderPhase = (phaseId: string, direction: "up" | "down") => {
    if (!selectedProject) return;
    const sorted = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((p) => p.id === phaseId);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    store.reorderPhases(selectedProject.id, reordered.map(p => p.id));
    setPhases(store.getPhasesByProject(selectedProject.id));
  };















  const handleSavePhase = (updates: Partial<Phase>) => {
    if (!selectedPhase || !selectedProject) return;
    try {
      const updated = store.updatePhase(selectedPhase.id, updates);
      setSelectedPhase(updated);
      setPhases(store.getPhasesByProject(selectedProject.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
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

  const handleAttachSpec = (data: { title: string; sourceRef: string }) => {
    if (!selectedPhase) return;
    const spec = store.createSpec({ phaseId: selectedPhase.id, title: data.title, sourceRef: data.sourceRef, version: "1.0", author: "Mike", approvalState: "Pending", notes: "" });
    setCurrentSpec(spec);
  };

  const handleAttachPRD = (data: { title: string; sourceRef: string }) => {
    if (!selectedPhase) return;
    const prd = store.createPRD({ phaseId: selectedPhase.id, title: data.title, sourceRef: data.sourceRef, version: "1.0", approvalState: "Pending", deviationNotes: "", notes: "" });
    setCurrentPRD(prd);
  };

  // Phase detail view
  if (selectedProject && selectedPhase) {
    const phaseRefs = conversationRefs.filter(
      (r) => r.scopeType === "phase" && r.scopeId === selectedPhase.id
    );

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
          conversationRefs={phaseRefs}
          onSave={handleSavePhase}
          onCancel={() => setSelectedPhase(null)}
          onAttachSpec={handleAttachSpec}
          onAttachPRD={handleAttachPRD}
          onAddConversationRef={handleAddRef}
          onUpdateConversationRef={handleUpdateRef}
          onDeleteConversationRef={handleDeleteRef}
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
