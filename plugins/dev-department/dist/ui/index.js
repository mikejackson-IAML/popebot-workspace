import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { store } from "../worker/state.js";
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
const STATUS_COLORS = {
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
function Badge({ label }) {
    const c = STATUS_COLORS[label] || { bg: "#374151", text: "#9ca3af" };
    return _jsx("span", { style: { padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, backgroundColor: c.bg, color: c.text }, children: label });
}
function Btn({ children, onClick, variant = "default", disabled = false }) {
    const styles = {
        default: { backgroundColor: "#374151", color: COLORS.text },
        primary: { backgroundColor: COLORS.accent, color: "#fff" },
        danger: { backgroundColor: COLORS.dangerBg, color: "#f87171" },
        ghost: { backgroundColor: "transparent", color: COLORS.textMuted },
    };
    return _jsx("button", { onClick: onClick, disabled: disabled, style: { padding: "6px 14px", border: "none", borderRadius: "6px", cursor: disabled ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 500, opacity: disabled ? 0.5 : 1, ...styles[variant] }, children: children });
}
function Input({ value, onChange, placeholder, type = "text" }) {
    return _jsx("input", { type: type, value: value, onChange: e => onChange(e.target.value), placeholder: placeholder, style: { width: "100%", padding: "8px 12px", backgroundColor: COLORS.bgInput, color: COLORS.text, border: `1px solid ${COLORS.borderLight}`, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" } });
}
function TextArea({ value, onChange, placeholder, rows = 3 }) {
    return _jsx("textarea", { value: value, onChange: e => onChange(e.target.value), placeholder: placeholder, rows: rows, style: { width: "100%", padding: "8px 12px", backgroundColor: COLORS.bgInput, color: COLORS.text, border: `1px solid ${COLORS.borderLight}`, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", resize: "vertical" } });
}
function Select({ value, onChange, options }) {
    return _jsx("select", { value: value, onChange: e => onChange(e.target.value), style: { padding: "8px 12px", backgroundColor: COLORS.bgInput, color: COLORS.text, border: `1px solid ${COLORS.borderLight}`, borderRadius: "6px", fontSize: "14px" }, children: options.map(o => _jsx("option", { value: o.value, children: o.label }, o.value)) });
}
function Card({ children, onClick, style }) {
    return _jsx("div", { onClick: onClick, style: { padding: "16px", backgroundColor: COLORS.bgCard, borderRadius: "8px", border: `1px solid ${COLORS.border}`, cursor: onClick ? "pointer" : "default", ...style }, children: children });
}
// ============================================================
// PHASE DETAIL
// ============================================================
function PhaseDetailPanel({ phase, onSave, onBack }) {
    const [title, setTitle] = useState(phase.title);
    const [objective, setObjective] = useState(phase.objective);
    const [description, setDescription] = useState(phase.description);
    const [status, setStatus] = useState(phase.status);
    const [freezeState, setFreezeState] = useState(phase.freezeState);
    const [prerequisites, setPrerequisites] = useState(phase.prerequisites);
    const [successCriteria, setSuccessCriteria] = useState(phase.successCriteria);
    const [riskNotes, setRiskNotes] = useState(phase.riskNotes);
    useEffect(() => {
        setTitle(phase.title);
        setObjective(phase.objective);
        setDescription(phase.description);
        setStatus(phase.status);
        setFreezeState(phase.freezeState);
        setPrerequisites(phase.prerequisites);
        setSuccessCriteria(phase.successCriteria);
        setRiskNotes(phase.riskNotes);
    }, [phase.id, phase.updatedAt]);
    const allowed = [phase.status, ...(VALID_TRANSITIONS[phase.status] || [])];
    const isLocked = phase.freezeState === "Locked";
    const handleSave = () => {
        onSave({ title, objective, description, status: status, freezeState: freezeState, prerequisites, successCriteria, riskNotes });
    };
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }, children: [_jsx(Btn, { onClick: onBack, variant: "ghost", children: "\u2190 Back" }), _jsxs("h3", { style: { margin: 0, color: COLORS.text }, children: ["Phase ", phase.sortOrder + 1, ": ", phase.title] }), _jsx(Badge, { label: phase.status }), isLocked && _jsx("span", { style: { color: COLORS.warning, fontSize: "12px" }, children: "\uD83D\uDD12 Locked" })] }), isLocked && _jsx(Card, { style: { marginBottom: "16px", borderColor: COLORS.warning }, children: _jsx("span", { style: { color: COLORS.warning }, children: "\u26A0\uFE0F This phase is locked. Change freeze state to edit." }) }), _jsxs("div", { style: { display: "grid", gap: "12px" }, children: [_jsxs("div", { children: [_jsx("label", { style: { color: COLORS.textMuted, fontSize: "12px" }, children: "Title" }), _jsx(Input, { value: title, onChange: setTitle, placeholder: "Phase title" })] }), _jsxs("div", { children: [_jsx("label", { style: { color: COLORS.textMuted, fontSize: "12px" }, children: "Objective" }), _jsx(TextArea, { value: objective, onChange: setObjective, placeholder: "What this phase achieves" })] }), _jsxs("div", { children: [_jsx("label", { style: { color: COLORS.textMuted, fontSize: "12px" }, children: "Description" }), _jsx(TextArea, { value: description, onChange: setDescription, placeholder: "Detailed description", rows: 4 })] }), _jsxs("div", { style: { display: "flex", gap: "16px" }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: { color: COLORS.textMuted, fontSize: "12px" }, children: "Status" }), _jsx(Select, { value: status, onChange: v => setStatus(v), options: allowed.map(s => ({ value: s, label: s })) })] }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: { color: COLORS.textMuted, fontSize: "12px" }, children: "Freeze State" }), _jsx(Select, { value: freezeState, onChange: v => setFreezeState(v), options: [
                                            { value: "EditableDownstream", label: "Editable" },
                                            { value: "Locked", label: "Locked" },
                                            { value: "FrozenDownstream", label: "Frozen Downstream" },
                                            { value: "DownstreamRevisionRequired", label: "Revision Required" },
                                        ] })] })] }), _jsxs("div", { children: [_jsx("label", { style: { color: COLORS.textMuted, fontSize: "12px" }, children: "Prerequisites" }), _jsx(TextArea, { value: prerequisites, onChange: setPrerequisites, placeholder: "What must be done first" })] }), _jsxs("div", { children: [_jsx("label", { style: { color: COLORS.textMuted, fontSize: "12px" }, children: "Success Criteria" }), _jsx(TextArea, { value: successCriteria, onChange: setSuccessCriteria, placeholder: "How we know this phase is done" })] }), _jsxs("div", { children: [_jsx("label", { style: { color: COLORS.textMuted, fontSize: "12px" }, children: "Risk Notes" }), _jsx(TextArea, { value: riskNotes, onChange: setRiskNotes, placeholder: "Known risks" })] })] }), _jsxs("div", { style: { marginTop: "16px", display: "flex", gap: "8px" }, children: [_jsx(Btn, { onClick: handleSave, variant: "primary", children: "Save Phase" }), _jsx(Btn, { onClick: onBack, variant: "ghost", children: "Cancel" })] }), _jsx("div", { style: { marginTop: "24px", display: "grid", gap: "8px" }, children: ["Build Output", "Review", "Revision Events"].map(label => (_jsx(Card, { style: { border: "1px dashed #475569" }, children: _jsxs("span", { style: { color: COLORS.textDim, fontSize: "13px" }, children: [label, " \u2014 coming in future phase"] }) }, label))) })] }));
}
// ============================================================
// MAIN DEPARTMENT VIEW
// ============================================================
function DepartmentView() {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [phases, setPhases] = useState([]);
    const [selectedPhase, setSelectedPhase] = useState(null);
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [editingProject, setEditingProject] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [projectObjective, setProjectObjective] = useState("");
    const [projectStatus, setProjectStatus] = useState("Draft");
    const [error, setError] = useState(null);
    useEffect(() => { setProjects(store.listProjects()); }, []);
    const refreshPhases = (projectId) => setPhases(store.getPhasesByProject(projectId));
    const handleCreateProject = () => {
        const p = store.createProject({ name: newProjectName || "New Project", objective: "", owner: "Mike", status: "Draft", activePhaseId: null, roadmapSummary: "" });
        setProjects(store.listProjects());
        setSelectedProject(p);
        setPhases([]);
        setNewProjectName("");
        setShowCreateProject(false);
    };
    const handleSelectProject = (p) => {
        setSelectedProject(p);
        setPhases(store.getPhasesByProject(p.id));
        setSelectedPhase(null);
        setProjectName(p.name);
        setProjectObjective(p.objective);
        setProjectStatus(p.status);
        setEditingProject(false);
    };
    const handleSaveProject = () => {
        if (!selectedProject)
            return;
        const updated = store.updateProject(selectedProject.id, { name: projectName, objective: projectObjective, status: projectStatus });
        setSelectedProject(updated);
        setProjects(store.listProjects());
        setEditingProject(false);
    };
    const handleAddPhase = () => {
        if (!selectedProject)
            return;
        store.createPhase({ projectId: selectedProject.id, phaseNumber: phases.length + 1, title: "New Phase", objective: "", description: "", status: "DraftSpec", prerequisites: "", successCriteria: "", riskNotes: "", freezeState: "EditableDownstream", sortOrder: phases.length });
        refreshPhases(selectedProject.id);
    };
    const handleDeletePhase = (id) => {
        if (!confirm("Delete this phase and all associated data?"))
            return;
        store.deletePhase(id);
        if (selectedProject)
            refreshPhases(selectedProject.id);
        if (selectedPhase?.id === id)
            setSelectedPhase(null);
    };
    const handleSavePhase = (updates) => {
        if (!selectedPhase || !selectedProject)
            return;
        try {
            setError(null);
            const updated = store.updatePhase(selectedPhase.id, updates);
            setSelectedPhase(updated);
            refreshPhases(selectedProject.id);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };
    const handleReorder = (phaseId, direction) => {
        if (!selectedProject)
            return;
        const sorted = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);
        const idx = sorted.findIndex(p => p.id === phaseId);
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length)
            return;
        const reordered = [...sorted];
        [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
        store.reorderPhases(selectedProject.id, reordered.map(p => p.id));
        refreshPhases(selectedProject.id);
    };
    // ── Phase detail view ──
    if (selectedPhase) {
        return (_jsxs("div", { style: { padding: "24px", color: COLORS.text, fontFamily: "system-ui" }, children: [error && _jsx(Card, { style: { marginBottom: "12px", borderColor: COLORS.danger }, children: _jsxs("span", { style: { color: "#f87171" }, children: ["\u26A0\uFE0F ", error] }) }), _jsx(PhaseDetailPanel, { phase: selectedPhase, onSave: handleSavePhase, onBack: () => setSelectedPhase(null) })] }));
    }
    // ── Project detail view ──
    if (selectedProject) {
        return (_jsxs("div", { style: { padding: "24px", color: COLORS.text, fontFamily: "system-ui" }, children: [error && _jsx(Card, { style: { marginBottom: "12px", borderColor: COLORS.danger }, children: _jsxs("span", { style: { color: "#f87171" }, children: ["\u26A0\uFE0F ", error] }) }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }, children: [_jsx(Btn, { onClick: () => { setSelectedProject(null); setError(null); }, variant: "ghost", children: "\u2190 Projects" }), editingProject ? (_jsx(Input, { value: projectName, onChange: setProjectName, placeholder: "Project name" })) : (_jsx("h2", { style: { margin: 0, color: COLORS.text, cursor: "pointer" }, onClick: () => setEditingProject(true), children: selectedProject.name })), _jsx(Badge, { label: selectedProject.status })] }), editingProject && (_jsx(Card, { style: { marginBottom: "16px" }, children: _jsxs("div", { style: { display: "grid", gap: "12px" }, children: [_jsxs("div", { children: [_jsx("label", { style: { color: COLORS.textMuted, fontSize: "12px" }, children: "Objective" }), _jsx(TextArea, { value: projectObjective, onChange: setProjectObjective, placeholder: "Project objective" })] }), _jsxs("div", { children: [_jsx("label", { style: { color: COLORS.textMuted, fontSize: "12px" }, children: "Status" }), _jsx(Select, { value: projectStatus, onChange: setProjectStatus, options: ["Draft", "Active", "Blocked", "Archived"].map(s => ({ value: s, label: s })) })] }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx(Btn, { onClick: handleSaveProject, variant: "primary", children: "Save" }), _jsx(Btn, { onClick: () => setEditingProject(false), variant: "ghost", children: "Cancel" })] })] }) })), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }, children: [_jsx("h3", { style: { margin: 0, color: COLORS.textMuted, fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }, children: "Phases" }), _jsx(Btn, { onClick: handleAddPhase, variant: "primary", children: "+ Add Phase" })] }), phases.length === 0 ? (_jsx(Card, { style: { textAlign: "center", padding: "32px", border: "1px dashed #475569" }, children: _jsx("div", { style: { color: COLORS.textMuted }, children: "No phases yet. Click \"+ Add Phase\" to start." }) })) : (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: phases.map((p, i) => (_jsxs(Card, { onClick: () => setSelectedPhase(p), style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [_jsxs("span", { style: { color: COLORS.textDim, fontSize: "14px", fontWeight: 700, minWidth: "28px" }, children: ["#", i + 1] }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600, color: COLORS.text }, children: p.title }), p.objective && _jsx("div", { style: { fontSize: "12px", color: COLORS.textDim, marginTop: "2px" }, children: p.objective.slice(0, 80) })] })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx(Badge, { label: p.status }), p.freezeState === "Locked" && _jsx("span", { title: "Locked", children: "\uD83D\uDD12" }), _jsx(Btn, { onClick: (e) => { e.stopPropagation(); handleReorder(p.id, "up"); }, variant: "ghost", disabled: i === 0, children: "\u2191" }), _jsx(Btn, { onClick: (e) => { e.stopPropagation(); handleReorder(p.id, "down"); }, variant: "ghost", disabled: i === phases.length - 1, children: "\u2193" }), _jsx(Btn, { onClick: (e) => { e.stopPropagation(); handleDeletePhase(p.id); }, variant: "danger", children: "\u00D7" })] })] }, p.id))) }))] }));
    }
    // ── Project list view ──
    return (_jsxs("div", { style: { padding: "24px", color: COLORS.text, fontFamily: "system-ui", minHeight: "400px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: `1px solid ${COLORS.border}` }, children: [_jsx("h2", { style: { margin: 0, fontSize: "20px", fontWeight: 700, color: "#f1f5f9" }, children: "Development Department" }), _jsx(Btn, { onClick: () => setShowCreateProject(true), variant: "primary", children: "+ Create Project" })] }), showCreateProject && (_jsxs(Card, { style: { marginBottom: "16px" }, children: [_jsx(Input, { value: newProjectName, onChange: setNewProjectName, placeholder: "Project name..." }), _jsxs("div", { style: { display: "flex", gap: "8px", marginTop: "12px" }, children: [_jsx(Btn, { onClick: handleCreateProject, variant: "primary", children: "Create" }), _jsx(Btn, { onClick: () => setShowCreateProject(false), variant: "ghost", children: "Cancel" })] })] })), projects.length === 0 && !showCreateProject ? (_jsxs(Card, { style: { textAlign: "center", padding: "48px", border: "1px dashed #475569" }, children: [_jsx("div", { style: { fontSize: "48px", marginBottom: "16px" }, children: "\uD83D\uDCCB" }), _jsx("div", { style: { fontWeight: 600, marginBottom: "8px", color: "#cbd5e1" }, children: "No projects yet" }), _jsx("div", { style: { color: COLORS.textMuted }, children: "Click \"Create Project\" to start your first phased development initiative." })] })) : (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: projects.map(p => (_jsxs(Card, { onClick: () => handleSelectProject(p), style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600, fontSize: "15px", color: "#f1f5f9" }, children: p.name }), p.objective && _jsx("div", { style: { fontSize: "12px", color: COLORS.textDim, marginTop: "4px" }, children: p.objective.slice(0, 100) })] }), _jsx(Badge, { label: p.status })] }, p.id))) }))] }));
}
export function DepartmentSidebar({ context }) {
    return (_jsx("div", { style: { padding: "12px", color: "#22d3ee" }, children: _jsx("strong", { children: "Dev Department" }) }));
}
export function PhasesTab({ context }) {
    return _jsx(DepartmentView, {});
}
//# sourceMappingURL=index.js.map