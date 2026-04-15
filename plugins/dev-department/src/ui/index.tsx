import { useState, useEffect } from "react";
import type { PluginProjectSidebarItemProps, PluginDetailTabProps } from "@paperclipai/plugin-sdk/ui";
import { store } from "../worker/state.js";
import type { DevProject, Phase, PhaseStatus, FreezeState, Spec, PRD, ConversationReference } from "../worker/types.js";
import { VALID_TRANSITIONS } from "../worker/messages.js";

// Dark theme colors
const COLORS = {
  bg: "#0f172a",
  bgCard: "#1e293b",
  bgInput: "#0f172a",
  border: "#334155",
  borderLight: "#475569",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  accent: "#6366f1",
  accentHover: "#818cf8",
  success: "#22c55e",
  danger: "#ef4444",
  dangerBg: "#7f1d1d",
  warning: "#f59e0b",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Draft: { bg: "#374151", text: "#9ca3af" },
  Active: { bg: "#064e3b", text: "#34d399" },
  Blocked: { bg: "#7f1d1d", text: "#f87171" },
  Archived: { bg: "#1f2937", text: "#6b7280" },
  DraftSpec: { bg: "#374151", text: "#9ca3af" },
  SpecApproved: { bg: "#1e3a5f", text: "#60a5fa" },
  PRDAttached: { bg: "#3b0764", text: "#c084fc" },
  ReadyForBuild: { bg: "#064e3b", text: "#34d399" },
  Accepted: { bg: "#14532d", text: "#4ade80" },
  ReworkRequired: { bg: "#7f1d1d", text: "#f87171" },
  Closed: { bg: "#1f2937", text: "#6b7280" },
};

function Badge({ label }: { label: string }) {
  const c = STATUS_COLORS[label] || { bg: "#374151", text: "#9ca3af" };
  return <span style={{ padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, backgroundColor: c.bg, color: c.text }}>{label}</span>;
}

function Btn({ children, onClick, variant = "default", disabled = false }: { children: React.ReactNode; onClick: () => void; variant?: "default" | "primary" | "danger" | "ghost"; disabled?: boolean }) {
  const styles: Record<string, any> = {
    default: { backgroundColor: "#374151", color: COLORS.text },
    primary: { backgroundColor: COLORS.accent, color: "#fff" },
    danger: { backgroundColor: COLORS.dangerBg, color: "#f87171" },
    ghost: { backgroundColor: "transparent", color: COLORS.textMuted },
  };
  return <button onClick={onClick} disabled={disabled} style={{ padding: "6px 14px", border: "none", borderRadius: "6px", cursor: disabled ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 500, opacity: disabled ? 0.5 : 1, ...styles[variant] }}>{children}</button>;
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "8px 12px", backgroundColor: COLORS.bgInput, color: COLORS.text, border: `1px solid ${COLORS.borderLight}`, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }} />;
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ width: "100%", padding: "8px 12px", backgroundColor: COLORS.bgInput, color: COLORS.text, border: `1px solid ${COLORS.borderLight}`, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", resize: "vertical" }} />;
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: "8px 12px", backgroundColor: COLORS.bgInput, color: COLORS.text, border: `1px solid ${COLORS.borderLight}`, borderRadius: "6px", fontSize: "14px" }}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}

function Card({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: any }) {
  return <div onClick={onClick} style={{ padding: "16px", backgroundColor: COLORS.bgCard, borderRadius: "8px", border: `1px solid ${COLORS.border}`, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>;
}

// ============================================================
// PHASE DETAIL
// ============================================================
function PhaseDetailPanel({ phase, onSave, onBack }: { phase: Phase; onSave: (updates: Partial<Phase>) => void; onBack: () => void }) {
  const [title, setTitle] = useState(phase.title);
  const [objective, setObjective] = useState(phase.objective);
  const [description, setDescription] = useState(phase.description);
  const [status, setStatus] = useState(phase.status);
  const [freezeState, setFreezeState] = useState(phase.freezeState);
  const [prerequisites, setPrerequisites] = useState(phase.prerequisites);
  const [successCriteria, setSuccessCriteria] = useState(phase.successCriteria);
  const [riskNotes, setRiskNotes] = useState(phase.riskNotes);

  useEffect(() => {
    setTitle(phase.title); setObjective(phase.objective); setDescription(phase.description);
    setStatus(phase.status); setFreezeState(phase.freezeState);
    setPrerequisites(phase.prerequisites); setSuccessCriteria(phase.successCriteria); setRiskNotes(phase.riskNotes);
  }, [phase.id, phase.updatedAt]);

  const allowed = [phase.status, ...(VALID_TRANSITIONS[phase.status] || [])];
  const isLocked = phase.freezeState === "Locked";

  const handleSave = () => {
    onSave({ title, objective, description, status: status as PhaseStatus, freezeState: freezeState as FreezeState, prerequisites, successCriteria, riskNotes });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <Btn onClick={onBack} variant="ghost">← Back</Btn>
        <h3 style={{ margin: 0, color: COLORS.text }}>Phase {phase.sortOrder + 1}: {phase.title}</h3>
        <Badge label={phase.status} />
        {isLocked && <span style={{ color: COLORS.warning, fontSize: "12px" }}>🔒 Locked</span>}
      </div>

      {isLocked && <Card style={{ marginBottom: "16px", borderColor: COLORS.warning }}><span style={{ color: COLORS.warning }}>⚠️ This phase is locked. Change freeze state to edit.</span></Card>}

      <div style={{ display: "grid", gap: "12px" }}>
        <div><label style={{ color: COLORS.textMuted, fontSize: "12px" }}>Title</label><Input value={title} onChange={setTitle} placeholder="Phase title" /></div>
        <div><label style={{ color: COLORS.textMuted, fontSize: "12px" }}>Objective</label><TextArea value={objective} onChange={setObjective} placeholder="What this phase achieves" /></div>
        <div><label style={{ color: COLORS.textMuted, fontSize: "12px" }}>Description</label><TextArea value={description} onChange={setDescription} placeholder="Detailed description" rows={4} /></div>
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: COLORS.textMuted, fontSize: "12px" }}>Status</label>
            <Select value={status} onChange={v => setStatus(v as PhaseStatus)} options={allowed.map(s => ({ value: s, label: s }))} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: COLORS.textMuted, fontSize: "12px" }}>Freeze State</label>
            <Select value={freezeState} onChange={v => setFreezeState(v as FreezeState)} options={[
              { value: "EditableDownstream", label: "Editable" },
              { value: "Locked", label: "Locked" },
              { value: "FrozenDownstream", label: "Frozen Downstream" },
              { value: "DownstreamRevisionRequired", label: "Revision Required" },
            ]} />
          </div>
        </div>
        <div><label style={{ color: COLORS.textMuted, fontSize: "12px" }}>Prerequisites</label><TextArea value={prerequisites} onChange={setPrerequisites} placeholder="What must be done first" /></div>
        <div><label style={{ color: COLORS.textMuted, fontSize: "12px" }}>Success Criteria</label><TextArea value={successCriteria} onChange={setSuccessCriteria} placeholder="How we know this phase is done" /></div>
        <div><label style={{ color: COLORS.textMuted, fontSize: "12px" }}>Risk Notes</label><TextArea value={riskNotes} onChange={setRiskNotes} placeholder="Known risks" /></div>
      </div>

      <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
        <Btn onClick={handleSave} variant="primary">Save Phase</Btn>
        <Btn onClick={onBack} variant="ghost">Cancel</Btn>
      </div>

      {/* Placeholder sections */}
      <div style={{ marginTop: "24px", display: "grid", gap: "8px" }}>
        {["Build Output", "Review", "Revision Events"].map(label => (
          <Card key={label} style={{ border: "1px dashed #475569" }}>
            <span style={{ color: COLORS.textDim, fontSize: "13px" }}>{label} — coming in future phase</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN DEPARTMENT VIEW
// ============================================================
function DepartmentView() {
  const [projects, setProjects] = useState<DevProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<DevProject | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingProject, setEditingProject] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectObjective, setProjectObjective] = useState("");
  const [projectStatus, setProjectStatus] = useState("Draft");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setProjects(store.listProjects()); }, []);

  const refreshPhases = (projectId: string) => setPhases(store.getPhasesByProject(projectId));

  const handleCreateProject = () => {
    const p = store.createProject({ name: newProjectName || "New Project", objective: "", owner: "Mike", status: "Draft", activePhaseId: null, roadmapSummary: "" });
    setProjects(store.listProjects());
    setSelectedProject(p);
    setPhases([]);
    setNewProjectName("");
    setShowCreateProject(false);
  };

  const handleSelectProject = (p: DevProject) => {
    setSelectedProject(p);
    setPhases(store.getPhasesByProject(p.id));
    setSelectedPhase(null);
    setProjectName(p.name);
    setProjectObjective(p.objective);
    setProjectStatus(p.status);
    setEditingProject(false);
  };

  const handleSaveProject = () => {
    if (!selectedProject) return;
    const updated = store.updateProject(selectedProject.id, { name: projectName, objective: projectObjective, status: projectStatus as any });
    setSelectedProject(updated);
    setProjects(store.listProjects());
    setEditingProject(false);
  };

  const handleAddPhase = () => {
    if (!selectedProject) return;
    store.createPhase({ projectId: selectedProject.id, phaseNumber: phases.length + 1, title: "New Phase", objective: "", description: "", status: "DraftSpec", prerequisites: "", successCriteria: "", riskNotes: "", freezeState: "EditableDownstream", sortOrder: phases.length });
    refreshPhases(selectedProject.id);
  };

  const handleDeletePhase = (id: string) => {
    if (!confirm("Delete this phase and all associated data?")) return;
    store.deletePhase(id);
    if (selectedProject) refreshPhases(selectedProject.id);
    if (selectedPhase?.id === id) setSelectedPhase(null);
  };

  const handleSavePhase = (updates: Partial<Phase>) => {
    if (!selectedPhase || !selectedProject) return;
    try {
      setError(null);
      const updated = store.updatePhase(selectedPhase.id, updates);
      setSelectedPhase(updated);
      refreshPhases(selectedProject.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleReorder = (phaseId: string, direction: "up" | "down") => {
    if (!selectedProject) return;
    const sorted = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex(p => p.id === phaseId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    store.reorderPhases(selectedProject.id, reordered.map(p => p.id));
    refreshPhases(selectedProject.id);
  };

  // ── Phase detail view ──
  if (selectedPhase) {
    return (
      <div style={{ padding: "24px", color: COLORS.text, fontFamily: "system-ui" }}>
        {error && <Card style={{ marginBottom: "12px", borderColor: COLORS.danger }}><span style={{ color: "#f87171" }}>⚠️ {error}</span></Card>}
        <PhaseDetailPanel phase={selectedPhase} onSave={handleSavePhase} onBack={() => setSelectedPhase(null)} />
      </div>
    );
  }

  // ── Project detail view ──
  if (selectedProject) {
    return (
      <div style={{ padding: "24px", color: COLORS.text, fontFamily: "system-ui" }}>
        {error && <Card style={{ marginBottom: "12px", borderColor: COLORS.danger }}><span style={{ color: "#f87171" }}>⚠️ {error}</span></Card>}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <Btn onClick={() => { setSelectedProject(null); setError(null); }} variant="ghost">← Projects</Btn>
          {editingProject ? (
            <Input value={projectName} onChange={setProjectName} placeholder="Project name" />
          ) : (
            <h2 style={{ margin: 0, color: COLORS.text, cursor: "pointer" }} onClick={() => setEditingProject(true)}>{selectedProject.name}</h2>
          )}
          <Badge label={selectedProject.status} />
        </div>

        {editingProject && (
          <Card style={{ marginBottom: "16px" }}>
            <div style={{ display: "grid", gap: "12px" }}>
              <div><label style={{ color: COLORS.textMuted, fontSize: "12px" }}>Objective</label><TextArea value={projectObjective} onChange={setProjectObjective} placeholder="Project objective" /></div>
              <div><label style={{ color: COLORS.textMuted, fontSize: "12px" }}>Status</label>
                <Select value={projectStatus} onChange={setProjectStatus} options={["Draft","Active","Blocked","Archived"].map(s => ({ value: s, label: s }))} />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Btn onClick={handleSaveProject} variant="primary">Save</Btn>
                <Btn onClick={() => setEditingProject(false)} variant="ghost">Cancel</Btn>
              </div>
            </div>
          </Card>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ margin: 0, color: COLORS.textMuted, fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Phases</h3>
          <Btn onClick={handleAddPhase} variant="primary">+ Add Phase</Btn>
        </div>

        {phases.length === 0 ? (
          <Card style={{ textAlign: "center", padding: "32px", border: "1px dashed #475569" }}>
            <div style={{ color: COLORS.textMuted }}>No phases yet. Click "+ Add Phase" to start.</div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {phases.map((p, i) => (
              <Card key={p.id} onClick={() => setSelectedPhase(p)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: COLORS.textDim, fontSize: "14px", fontWeight: 700, minWidth: "28px" }}>#{i + 1}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: COLORS.text }}>{p.title}</div>
                    {p.objective && <div style={{ fontSize: "12px", color: COLORS.textDim, marginTop: "2px" }}>{p.objective.slice(0, 80)}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Badge label={p.status} />
                  {p.freezeState === "Locked" && <span title="Locked">🔒</span>}
                  <Btn onClick={(e: any) => { e.stopPropagation(); handleReorder(p.id, "up"); }} variant="ghost" disabled={i === 0}>↑</Btn>
                  <Btn onClick={(e: any) => { e.stopPropagation(); handleReorder(p.id, "down"); }} variant="ghost" disabled={i === phases.length - 1}>↓</Btn>
                  <Btn onClick={(e: any) => { e.stopPropagation(); handleDeletePhase(p.id); }} variant="danger">×</Btn>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Project list view ──
  return (
    <div style={{ padding: "24px", color: COLORS.text, fontFamily: "system-ui", minHeight: "400px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: `1px solid ${COLORS.border}` }}>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#f1f5f9" }}>Development Department</h2>
        <Btn onClick={() => setShowCreateProject(true)} variant="primary">+ Create Project</Btn>
      </div>

      {showCreateProject && (
        <Card style={{ marginBottom: "16px" }}>
          <Input value={newProjectName} onChange={setNewProjectName} placeholder="Project name..." />
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <Btn onClick={handleCreateProject} variant="primary">Create</Btn>
            <Btn onClick={() => setShowCreateProject(false)} variant="ghost">Cancel</Btn>
          </div>
        </Card>
      )}

      {projects.length === 0 && !showCreateProject ? (
        <Card style={{ textAlign: "center", padding: "48px", border: "1px dashed #475569" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
          <div style={{ fontWeight: 600, marginBottom: "8px", color: "#cbd5e1" }}>No projects yet</div>
          <div style={{ color: COLORS.textMuted }}>Click "Create Project" to start your first phased development initiative.</div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {projects.map(p => (
            <Card key={p.id} onClick={() => handleSelectProject(p)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "15px", color: "#f1f5f9" }}>{p.name}</div>
                {p.objective && <div style={{ fontSize: "12px", color: COLORS.textDim, marginTop: "4px" }}>{p.objective.slice(0, 100)}</div>}
              </div>
              <Badge label={p.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function DepartmentSidebar({ context }: PluginProjectSidebarItemProps) {
  return (
    <div style={{ padding: "12px", color: "#22d3ee" }}>
      <strong>Dev Department</strong>
    </div>
  );
}

export function PhasesTab({ context }: PluginDetailTabProps) {
  return <DepartmentView />;
}
