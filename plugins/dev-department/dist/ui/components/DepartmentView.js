import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { store } from "../../worker/state.js";
import ProjectHeader from "./ProjectHeader.js";
import PhaseList from "./PhaseList.js";
import PhaseDetail from "./PhaseDetail.js";
import { ConversationRefs } from "./ConversationRefs.js";
const STATUS_COLORS = {
    Draft: { bg: "#374151", text: "#9ca3af" },
    Active: { bg: "#064e3b", text: "#34d399" },
    Blocked: { bg: "#7f1d1d", text: "#f87171" },
    Archived: { bg: "#1f2937", text: "#6b7280" },
};
function StatusBadge({ status }) {
    const colors = STATUS_COLORS[status];
    return (_jsx("span", { style: {
            padding: "2px 10px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: 600,
            backgroundColor: colors.bg,
            color: colors.text,
        }, children: status }));
}
export default function DepartmentView() {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [phases, setPhases] = useState([]);
    const [selectedPhase, setSelectedPhase] = useState(null);
    const [currentSpec, setCurrentSpec] = useState(null);
    const [currentPRD, setCurrentPRD] = useState(null);
    // Load from store on mount
    useEffect(() => { setProjects(store.listProjects()); }, []);
    const [conversationRefs, setConversationRefs] = useState([]);
    const handleSelectProject = (project) => {
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
    const handleSaveProject = (updates) => {
        if (!selectedProject)
            return;
        const updated = store.updateProject(selectedProject.id, updates);
        setSelectedProject(updated);
        setProjects(store.listProjects());
    };
    const handleAddPhase = () => {
        if (!selectedProject)
            return;
        const existingPhases = store.getPhasesByProject(selectedProject.id);
        store.createPhase({ projectId: selectedProject.id, phaseNumber: existingPhases.length + 1, title: "New Phase", objective: "", description: "", status: "DraftSpec", prerequisites: "", successCriteria: "", riskNotes: "", freezeState: "EditableDownstream", sortOrder: existingPhases.length });
        setPhases(store.getPhasesByProject(selectedProject.id));
    };
    const handleDeletePhase = (phaseId) => {
        store.deletePhase(phaseId);
        if (selectedProject)
            setPhases(store.getPhasesByProject(selectedProject.id));
        if (selectedPhase?.id === phaseId)
            setSelectedPhase(null);
    };
    const handleReorderPhase = (phaseId, direction) => {
        if (!selectedProject)
            return;
        const sorted = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);
        const idx = sorted.findIndex((p) => p.id === phaseId);
        if (idx === -1)
            return;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length)
            return;
        const reordered = [...sorted];
        [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
        store.reorderPhases(selectedProject.id, reordered.map(p => p.id));
        setPhases(store.getPhasesByProject(selectedProject.id));
    };
    const handleSavePhase = (updates) => {
        if (!selectedPhase || !selectedProject)
            return;
        try {
            const updated = store.updatePhase(selectedPhase.id, updates);
            setSelectedPhase(updated);
            setPhases(store.getPhasesByProject(selectedProject.id));
        }
        catch (err) {
            alert(err instanceof Error ? err.message : String(err));
        }
    };
    const handleSetActivePhase = (phaseId) => {
        handleSaveProject({ activePhaseId: phaseId });
    };
    const handleAddRef = (ref) => {
        const newRef = { ...ref, id: crypto.randomUUID() };
        setConversationRefs((prev) => [...prev, newRef]);
    };
    const handleUpdateRef = (id, updates) => {
        setConversationRefs((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    };
    const handleDeleteRef = (id) => {
        setConversationRefs((prev) => prev.filter((r) => r.id !== id));
    };
    const handleAttachSpec = (data) => {
        if (!selectedPhase)
            return;
        const spec = store.createSpec({ phaseId: selectedPhase.id, title: data.title, sourceRef: data.sourceRef, version: "1.0", author: "Mike", approvalState: "Pending", notes: "" });
        setCurrentSpec(spec);
    };
    const handleAttachPRD = (data) => {
        if (!selectedPhase)
            return;
        const prd = store.createPRD({ phaseId: selectedPhase.id, title: data.title, sourceRef: data.sourceRef, version: "1.0", approvalState: "Pending", deviationNotes: "", notes: "" });
        setCurrentPRD(prd);
    };
    // Phase detail view
    if (selectedProject && selectedPhase) {
        const phaseRefs = conversationRefs.filter((r) => r.scopeType === "phase" && r.scopeId === selectedPhase.id);
        return (_jsxs("div", { style: { fontFamily: "system-ui, sans-serif", height: "100%" }, children: [_jsx("div", { style: { padding: "10px 16px", borderBottom: "1px solid #374151", display: "flex", gap: "8px", alignItems: "center" }, children: _jsxs("button", { onClick: () => setSelectedPhase(null), style: {
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#2563eb",
                            fontSize: "14px",
                            padding: 0,
                        }, children: ["\u2190 Back to ", selectedProject.name] }) }), _jsx(PhaseDetail, { phase: selectedPhase, spec: null, prd: null, conversationRefs: phaseRefs, onSave: handleSavePhase, onCancel: () => setSelectedPhase(null), onAttachSpec: handleAttachSpec, onAttachPRD: handleAttachPRD, onAddConversationRef: handleAddRef, onUpdateConversationRef: handleUpdateRef, onDeleteConversationRef: handleDeleteRef })] }));
    }
    // Project detail view
    if (selectedProject) {
        const projectRefs = conversationRefs.filter((r) => r.scopeType === "project" && r.scopeId === selectedProject.id);
        return (_jsxs("div", { style: { fontFamily: "system-ui, sans-serif", height: "100%" }, children: [_jsx("div", { style: { padding: "10px 16px", borderBottom: "1px solid #374151" }, children: _jsx("button", { onClick: () => setSelectedProject(null), style: {
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#2563eb",
                            fontSize: "14px",
                            padding: 0,
                        }, children: "\u2190 Back to Projects" }) }), _jsx(ProjectHeader, { project: selectedProject, phases: phases, onSave: handleSaveProject, onCancel: () => setSelectedProject(null) }), phases.length > 0 && (_jsxs("div", { style: { padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx("span", { style: { fontSize: "12px", fontWeight: 600, color: "#cbd5e1" }, children: "Active Phase:" }), _jsxs("select", { value: selectedProject.activePhaseId ?? "", onChange: (e) => handleSetActivePhase(e.target.value || null), style: {
                                padding: "4px 8px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                fontSize: "12px",
                                color: "#e2e8f0",
                                backgroundColor: "#0f172a",
                                cursor: "pointer",
                            }, children: [_jsx("option", { value: "", children: "\u2014 None \u2014" }), [...phases]
                                    .sort((a, b) => a.sortOrder - b.sortOrder)
                                    .map((p) => (_jsxs("option", { value: p.id, children: ["Phase ", p.phaseNumber, ": ", p.title] }, p.id)))] })] })), _jsx(PhaseList, { phases: phases, selectedPhaseId: selectedPhase?.id ?? null, onSelect: (phase) => setSelectedPhase(phase), onAdd: handleAddPhase, onDelete: handleDeletePhase, onReorder: handleReorderPhase }), _jsx(ConversationRefs, { references: projectRefs, scopeType: "project", scopeId: selectedProject.id, onAdd: handleAddRef, onUpdate: handleUpdateRef, onDelete: handleDeleteRef })] }));
    }
    // List view
    return (_jsxs("div", { style: { fontFamily: "system-ui, sans-serif", height: "100%" }, children: [_jsxs("div", { style: {
                    padding: "12px 16px",
                    borderBottom: "1px solid #374151",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }, children: [_jsx("span", { style: { fontWeight: 700, fontSize: "16px", color: "#e2e8f0" }, children: "Development Department" }), _jsx("button", { onClick: handleCreateProject, style: {
                            padding: "6px 14px",
                            backgroundColor: "#2563eb",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 500,
                        }, children: "+ Create Project" })] }), projects.length === 0 ? (_jsx("div", { style: { padding: "32px 16px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }, children: "No projects yet. Click \"Create Project\" to get started." })) : (_jsx("div", { style: { padding: "8px" }, children: projects.map((project) => (_jsxs("div", { onClick: () => handleSelectProject(project), style: {
                        padding: "12px",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        marginBottom: "6px",
                        cursor: "pointer",
                        backgroundColor: "#0f172a",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "border-color 0.15s",
                    }, onMouseEnter: (e) => (e.currentTarget.style.borderColor = "#93c5fd"), onMouseLeave: (e) => (e.currentTarget.style.borderColor = "#e5e7eb"), children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600, fontSize: "14px", color: "#e2e8f0" }, children: project.name }), project.objective && (_jsx("div", { style: { fontSize: "12px", color: "#94a3b8", marginTop: "2px" }, children: project.objective }))] }), _jsx(StatusBadge, { status: project.status })] }, project.id))) }))] }));
}
//# sourceMappingURL=DepartmentView.js.map