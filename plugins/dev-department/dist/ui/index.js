import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { usePluginData, usePluginAction, useHostContext, usePluginStream, } from "@paperclipai/plugin-sdk/ui";
// =============================================================================
// Theme
// =============================================================================
const C = {
    bg: "#0f172a",
    bgCard: "#1e293b",
    bgInput: "#0f172a",
    border: "#334155",
    borderFocus: "#6366f1",
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
    draft: { bg: "#374151", text: "#9ca3af" },
    planning: { bg: "#1e3a5f", text: "#60a5fa" },
    ready: { bg: "#3b0764", text: "#c084fc" },
    building: { bg: "#064e3b", text: "#34d399" },
    reviewing: { bg: "#78350f", text: "#fbbf24" },
    complete: { bg: "#14532d", text: "#4ade80" },
    failed: { bg: "#7f1d1d", text: "#f87171" },
    // job statuses
    pending: { bg: "#374151", text: "#9ca3af" },
    dispatched: { bg: "#1e3a5f", text: "#60a5fa" },
    merged: { bg: "#14532d", text: "#4ade80" },
    skipped: { bg: "#1f2937", text: "#6b7280" },
};
const PRIORITY_COLORS = {
    P0: { bg: "#7f1d1d", text: "#fca5a5" },
    P1: { bg: "#78350f", text: "#fbbf24" },
    P2: { bg: "#1e3a5f", text: "#60a5fa" },
    P3: { bg: "#374151", text: "#9ca3af" },
};
// =============================================================================
// Primitives
// =============================================================================
function Badge({ label, colors }) {
    const map = colors || STATUS_COLORS;
    const c = map[label] || { bg: "#374151", text: "#9ca3af" };
    return (_jsx("span", { style: { padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, backgroundColor: c.bg, color: c.text }, children: label }));
}
function Btn({ children, onClick, variant = "default", disabled = false, style }) {
    const styles = {
        default: { backgroundColor: "#374151", color: C.text },
        primary: { backgroundColor: C.accent, color: "#fff" },
        danger: { backgroundColor: C.dangerBg, color: "#f87171" },
        ghost: { backgroundColor: "transparent", color: C.textMuted },
    };
    return (_jsx("button", { onClick: onClick, disabled: disabled, style: {
            padding: "8px 16px", border: "none", borderRadius: "6px",
            cursor: disabled ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 500,
            opacity: disabled ? 0.5 : 1, ...styles[variant], ...style,
        }, children: children }));
}
function Input({ value, onChange, placeholder }) {
    return (_jsx("input", { type: "text", value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, style: {
            width: "100%", padding: "10px 12px", backgroundColor: C.bgInput, color: C.text,
            border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box",
        } }));
}
function TextArea({ value, onChange, placeholder, rows = 3 }) {
    return (_jsx("textarea", { value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, rows: rows, style: {
            width: "100%", padding: "10px 12px", backgroundColor: C.bgInput, color: C.text,
            border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "14px",
            boxSizing: "border-box", resize: "vertical", fontFamily: "monospace",
        } }));
}
function Select({ value, onChange, options }) {
    return (_jsx("select", { value: value, onChange: (e) => onChange(e.target.value), style: {
            width: "100%", padding: "10px 12px", backgroundColor: C.bgInput, color: C.text,
            border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box",
        }, children: options.map((o) => _jsx("option", { value: o.value, children: o.label }, o.value)) }));
}
function Card({ children, onClick, style }) {
    return (_jsx("div", { onClick: onClick, style: {
            padding: "16px", backgroundColor: C.bgCard, borderRadius: "8px",
            border: `1px solid ${C.border}`, cursor: onClick ? "pointer" : "default", ...style,
        }, children: children }));
}
function Label({ children }) {
    return _jsx("label", { style: { display: "block", color: C.textMuted, fontSize: "12px", marginBottom: "4px", fontWeight: 500 }, children: children });
}
function ErrorBanner({ message }) {
    return (_jsx(Card, { style: { marginBottom: "12px", borderColor: C.danger }, children: _jsx("span", { style: { color: "#f87171" }, children: message }) }));
}
// =============================================================================
// Create Project Form
// =============================================================================
function CreateProjectForm({ onSubmit, onCancel }) {
    const [name, setName] = useState("");
    const [prdText, setPrdText] = useState("");
    const [priority, setPriority] = useState("P2");
    const [fileName, setFileName] = useState(null);
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result;
            if (text)
                setPrdText(text);
        };
        reader.readAsText(file);
        // Auto-fill project name from filename if empty
        if (!name.trim()) {
            const baseName = file.name.replace(/\.(md|txt|markdown|rst|prd)$/i, "").replace(/[-_]/g, " ");
            setName(baseName);
        }
    };
    return (_jsxs(Card, { style: { marginBottom: "16px" }, children: [_jsx("h3", { style: { margin: "0 0 16px 0", color: C.text, fontSize: "16px" }, children: "New Project" }), _jsxs("div", { style: { display: "grid", gap: "12px" }, children: [_jsxs("div", { children: [_jsx(Label, { children: "Project Name" }), _jsx(Input, { value: name, onChange: setName, placeholder: "e.g. IAML Website Redesign" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Priority" }), _jsx(Select, { value: priority, onChange: (v) => setPriority(v), options: [
                                    { value: "P0", label: "P0 — Critical" },
                                    { value: "P1", label: "P1 — High" },
                                    { value: "P2", label: "P2 — Medium" },
                                    { value: "P3", label: "P3 — Low" },
                                ] })] }), _jsxs("div", { children: [_jsx(Label, { children: "PRD" }), _jsxs("div", { style: {
                                    display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px",
                                }, children: [_jsxs("label", { style: {
                                            padding: "8px 16px", backgroundColor: "#374151", color: C.text,
                                            borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                                            border: `1px solid ${C.border}`,
                                        }, children: ["Upload File", _jsx("input", { type: "file", accept: ".md,.txt,.markdown,.rst,.prd", onChange: handleFileUpload, style: { display: "none" } })] }), fileName && (_jsx("span", { style: { color: C.textMuted, fontSize: "13px" }, children: fileName })), _jsx("span", { style: { color: C.textDim, fontSize: "12px" }, children: "or paste below" })] }), _jsx(TextArea, { value: prdText, onChange: setPrdText, placeholder: "Paste your PRD here, or upload a file above...", rows: 12 })] }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx(Btn, { onClick: () => onSubmit({ name, prdText, priority }), variant: "primary", disabled: !name.trim(), children: "Create Project" }), _jsx(Btn, { onClick: onCancel, variant: "ghost", children: "Cancel" })] })] })] }));
}
// =============================================================================
// Project Detail View
// =============================================================================
// =============================================================================
// Editable Job Card
// =============================================================================
function EditableJobCard({ job, index, onSave }) {
    const [expanded, setExpanded] = useState(false);
    const [editingJob, setEditingJob] = useState(false);
    const [editName, setEditName] = useState(job.name);
    const [editDesc, setEditDesc] = useState(job.description);
    const [editFiles, setEditFiles] = useState(job.targetFiles.join(", "));
    const handleSaveJob = () => {
        onSave({
            name: editName,
            description: editDesc,
            targetFiles: editFiles.split(",").map((f) => f.trim()).filter(Boolean),
        });
        setEditingJob(false);
    };
    return (_jsxs(Card, { style: { padding: "12px 16px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }, onClick: () => !editingJob && setExpanded(!expanded), children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", flex: 1 }, children: [_jsxs("span", { style: { color: C.textDim, fontSize: "13px", fontWeight: 700, minWidth: "24px" }, children: ["#", index + 1] }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 600, color: C.text, fontSize: "14px" }, children: job.name }), _jsx("div", { style: { fontSize: "12px", color: C.textDim, marginTop: "2px" }, children: job.targetFiles.join(", ") || "No target files" })] })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [job.dependencies.length > 0 && (_jsxs("span", { style: { fontSize: "11px", color: C.textDim }, children: ["depends: ", job.dependencies.join(", ")] })), job.jobType && job.jobType !== "code" && (_jsx(Badge, { label: job.jobType, colors: {
                                    workflow: { bg: "#4c1d95", text: "#c4b5fd" },
                                    config: { bg: "#713f12", text: "#fde68a" },
                                    schema: { bg: "#164e63", text: "#67e8f9" },
                                } })), _jsx(Badge, { label: job.status }), _jsx("span", { style: { color: C.textDim, fontSize: "12px" }, children: expanded ? "▲" : "▼" })] })] }), expanded && !editingJob && (_jsxs("div", { style: { marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${C.border}` }, children: [_jsx("pre", { style: {
                            color: C.text, fontSize: "12px", lineHeight: "1.5",
                            whiteSpace: "pre-wrap", wordBreak: "break-word", margin: "0 0 8px 0",
                        }, children: job.description }), job.status === "pending" && (_jsx(Btn, { variant: "ghost", onClick: (e) => { e.stopPropagation(); setEditingJob(true); }, style: { fontSize: "12px", padding: "4px 10px" }, children: "Edit Job" }))] })), editingJob && (_jsxs("div", { style: { marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${C.border}`, display: "grid", gap: "8px" }, children: [_jsxs("div", { children: [_jsx(Label, { children: "Job Name" }), _jsx(Input, { value: editName, onChange: setEditName })] }), _jsxs("div", { children: [_jsx(Label, { children: "Description" }), _jsx(TextArea, { value: editDesc, onChange: setEditDesc, rows: 4 })] }), _jsxs("div", { children: [_jsx(Label, { children: "Target Files (comma-separated)" }), _jsx(Input, { value: editFiles, onChange: setEditFiles, placeholder: "src/foo.ts, src/bar.ts" })] }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx(Btn, { variant: "primary", onClick: handleSaveJob, style: { fontSize: "12px", padding: "4px 10px" }, children: "Save" }), _jsx(Btn, { variant: "ghost", onClick: () => setEditingJob(false), style: { fontSize: "12px", padding: "4px 10px" }, children: "Cancel" })] })] }))] }));
}
// =============================================================================
// Project Detail View
// =============================================================================
function ProjectDetailView({ projectId, parentProjectId, companyId, onBack }) {
    const { data, loading, error, refresh } = usePluginData("project-detail", {
        parentProjectId,
        projectId,
    });
    const updateProject = usePluginAction("update-project");
    const deleteProjectAction = usePluginAction("delete-project");
    const decomposePrdAction = usePluginAction("decompose-prd");
    const updateJobAction = usePluginAction("update-job");
    const { events: progressEvents } = usePluginStream("pipeline-progress");
    // Agent config — stored per Paperclip project
    const { data: agentConfig } = usePluginData("agent-config", {
        parentProjectId,
    });
    const saveAgentConfig = usePluginAction("save-agent-config");
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPrd, setEditPrd] = useState("");
    const [editPriority, setEditPriority] = useState("P2");
    const [actionError, setActionError] = useState(null);
    const [decomposing, setDecomposing] = useState(false);
    const [showAgentConfig, setShowAgentConfig] = useState(false);
    const [agentIdInput, setAgentIdInput] = useState("");
    if (loading)
        return _jsx("div", { style: { padding: "24px", color: C.textMuted }, children: "Loading..." });
    if (error)
        return _jsx(ErrorBanner, { message: error.message });
    if (!data)
        return _jsx(ErrorBanner, { message: "Project not found" });
    const { project, jobs, usage } = data;
    // Filter progress events for this project
    const myProgress = progressEvents.filter((e) => e.projectId === projectId);
    const startEditing = () => {
        setEditName(project.name);
        setEditPrd(project.prdText);
        setEditPriority(project.priority);
        setEditing(true);
    };
    const handleSave = async () => {
        try {
            setActionError(null);
            await updateProject({
                parentProjectId,
                projectId,
                updates: { name: editName, prdText: editPrd, priority: editPriority },
            });
            setEditing(false);
            refresh();
        }
        catch (err) {
            setActionError(err.message || "Failed to update");
        }
    };
    const handleDelete = async () => {
        if (!confirm("Delete this project and all associated data?"))
            return;
        try {
            await deleteProjectAction({ parentProjectId, projectId });
            onBack();
        }
        catch (err) {
            setActionError(err.message || "Failed to delete");
        }
    };
    const handleDecompose = async () => {
        const agentId = agentConfig?.decomposerAgentId;
        if (!agentId) {
            setShowAgentConfig(true);
            setActionError("Configure the PRD Decomposer agent ID first (from PopeBot cluster).");
            return;
        }
        try {
            setActionError(null);
            setDecomposing(true);
            await decomposePrdAction({ parentProjectId, projectId, agentId, companyId });
            refresh();
        }
        catch (err) {
            setActionError(err.message || "Decomposition failed");
        }
        finally {
            setDecomposing(false);
        }
    };
    const handleSaveAgentConfig = async () => {
        try {
            await saveAgentConfig({ parentProjectId, decomposerAgentId: agentIdInput.trim() });
            setShowAgentConfig(false);
            setActionError(null);
        }
        catch (err) {
            setActionError(err.message || "Failed to save agent config");
        }
    };
    const handleUpdateJob = async (jobId, updates) => {
        try {
            setActionError(null);
            await updateJobAction({ parentProjectId, projectId, jobId, updates });
            refresh();
        }
        catch (err) {
            setActionError(err.message || "Failed to update job");
        }
    };
    // Calculate total cost
    const totalCost = usage.reduce((sum, u) => sum + u.estimatedCostUsd, 0);
    const canDecompose = project.prdText && (project.status === "draft" || project.status === "failed");
    return (_jsxs("div", { children: [actionError && _jsx(ErrorBanner, { message: actionError }), showAgentConfig && (_jsxs(Card, { style: { marginBottom: "16px", borderColor: C.accent }, children: [_jsx("h4", { style: { margin: "0 0 8px 0", color: C.text, fontSize: "14px" }, children: "Configure Decomposer Agent" }), _jsx("p", { style: { color: C.textMuted, fontSize: "12px", margin: "0 0 8px 0" }, children: "Paste the PopeBot agent ID for the PRD Decomposer role in your cluster. Find it in PopeBot UI \u2192 Cluster \u2192 PRD Decomposer role \u2192 copy agent ID." }), _jsxs("div", { style: { display: "flex", gap: "8px", alignItems: "center" }, children: [_jsx(Input, { value: agentIdInput, onChange: setAgentIdInput, placeholder: "e.g. ab1be4d8-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }), _jsx(Btn, { variant: "primary", onClick: handleSaveAgentConfig, disabled: !agentIdInput.trim(), children: "Save" }), _jsx(Btn, { variant: "ghost", onClick: () => setShowAgentConfig(false), children: "Cancel" })] }), agentConfig?.decomposerAgentId && (_jsxs("div", { style: { marginTop: "6px", fontSize: "11px", color: C.textDim }, children: ["Current: ", agentConfig.decomposerAgentId] }))] })), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }, children: [_jsx(Btn, { onClick: onBack, variant: "ghost", children: "\u2190 Back" }), _jsx("h2", { style: { margin: 0, color: C.text, fontSize: "18px", flex: 1 }, children: project.name }), _jsx(Badge, { label: project.priority, colors: PRIORITY_COLORS }), _jsx(Badge, { label: project.status })] }), editing ? (_jsx(Card, { style: { marginBottom: "16px" }, children: _jsxs("div", { style: { display: "grid", gap: "12px" }, children: [_jsxs("div", { children: [_jsx(Label, { children: "Project Name" }), _jsx(Input, { value: editName, onChange: setEditName, placeholder: "Project name" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Priority" }), _jsx(Select, { value: editPriority, onChange: (v) => setEditPriority(v), options: [
                                        { value: "P0", label: "P0 — Critical" },
                                        { value: "P1", label: "P1 — High" },
                                        { value: "P2", label: "P2 — Medium" },
                                        { value: "P3", label: "P3 — Low" },
                                    ] })] }), _jsxs("div", { children: [_jsx(Label, { children: "PRD" }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }, children: [_jsxs("label", { style: {
                                                padding: "8px 16px", backgroundColor: "#374151", color: C.text,
                                                borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                                                border: `1px solid ${C.border}`,
                                            }, children: ["Upload File", _jsx("input", { type: "file", accept: ".md,.txt,.markdown,.rst,.prd", onChange: (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file)
                                                            return;
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => {
                                                            const text = ev.target?.result;
                                                            if (text)
                                                                setEditPrd(text);
                                                        };
                                                        reader.readAsText(file);
                                                    }, style: { display: "none" } })] }), _jsx("span", { style: { color: C.textDim, fontSize: "12px" }, children: "or edit below" })] }), _jsx(TextArea, { value: editPrd, onChange: setEditPrd, placeholder: "PRD text...", rows: 12 })] }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx(Btn, { onClick: handleSave, variant: "primary", children: "Save" }), _jsx(Btn, { onClick: () => setEditing(false), variant: "ghost", children: "Cancel" })] })] }) })) : (_jsxs("div", { style: { display: "grid", gap: "12px", marginBottom: "20px" }, children: [_jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx(Btn, { onClick: startEditing, variant: "default", children: "Edit Project" }), _jsx(Btn, { onClick: handleDelete, variant: "danger", children: "Delete" })] }), project.decompositionSummary && (_jsxs(Card, { children: [_jsx(Label, { children: "Decomposition Summary" }), _jsx("p", { style: { color: C.text, fontSize: "13px", lineHeight: "1.5", margin: 0 }, children: project.decompositionSummary })] })), project.prdText ? (_jsxs(Card, { children: [_jsx(Label, { children: "PRD" }), _jsx("pre", { style: {
                                    color: C.text, fontSize: "13px", lineHeight: "1.5",
                                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                                    maxHeight: "300px", overflow: "auto", margin: 0,
                                }, children: project.prdText })] })) : (_jsx(Card, { style: { border: "1px dashed #475569" }, children: _jsx("span", { style: { color: C.textDim }, children: "No PRD attached. Edit this project to add one." }) }))] })), (decomposing || myProgress.length > 0) && (_jsxs(Card, { style: { marginBottom: "16px", borderColor: C.accent }, children: [_jsx(Label, { children: "Progress" }), _jsxs("div", { style: { maxHeight: "150px", overflow: "auto" }, children: [myProgress.map((evt, i) => (_jsxs("div", { style: { fontSize: "12px", color: C.textMuted, padding: "2px 0", fontFamily: "monospace" }, children: [_jsx("span", { style: { color: C.textDim, marginRight: "8px" }, children: new Date(evt.timestamp).toLocaleTimeString() }), evt.message] }, i))), decomposing && myProgress.length === 0 && (_jsx("div", { style: { fontSize: "12px", color: C.accent }, children: "Starting decomposition..." }))] })] })), _jsxs("div", { style: { marginBottom: "16px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }, children: [_jsxs("h3", { style: { margin: 0, color: C.textMuted, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }, children: ["Build Jobs ", jobs.length > 0 && `(${jobs.length})`] }), _jsxs("div", { style: { display: "flex", gap: "6px", alignItems: "center" }, children: [canDecompose && (_jsx(Btn, { variant: "primary", onClick: handleDecompose, disabled: decomposing, children: decomposing ? "Analyzing..." : (jobs.length > 0 ? "Re-Analyze PRD" : "Analyze PRD") })), _jsx(Btn, { variant: "ghost", onClick: () => { setAgentIdInput(agentConfig?.decomposerAgentId || ""); setShowAgentConfig(true); }, style: { fontSize: "12px", padding: "6px 8px" }, children: "\u2699" })] })] }), jobs.length === 0 ? (_jsx(Card, { style: { border: "1px dashed #475569", textAlign: "center", padding: "24px" }, children: _jsx("span", { style: { color: C.textDim }, children: project.prdText
                                ? 'PRD attached. Click "Analyze PRD" to decompose into build jobs.'
                                : "Add a PRD first, then analyze it to generate build jobs." }) })) : (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: jobs.map((job, i) => (_jsx(EditableJobCard, { job: job, index: i, onSave: (updates) => handleUpdateJob(job.id, updates) }, job.id))) }))] }), totalCost > 0 && (_jsxs(Card, { style: { marginBottom: "16px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx(Label, { children: "LLM Cost" }), _jsxs("span", { style: { color: C.success, fontSize: "14px", fontWeight: 600 }, children: ["$", totalCost.toFixed(4)] })] }), _jsx("div", { style: { marginTop: "4px" }, children: usage.map((u, i) => (_jsxs("div", { style: { fontSize: "11px", color: C.textDim }, children: [u.model, " (", u.purpose, ") \u2014 ", u.inputTokens.toLocaleString(), " in / ", u.outputTokens.toLocaleString(), " out \u2014 $", u.estimatedCostUsd.toFixed(4)] }, i))) })] })), _jsx(Card, { style: { border: "1px dashed #475569", marginBottom: "12px" }, children: _jsx("span", { style: { color: C.textDim, fontSize: "13px" }, children: "Pipeline execution \u2014 coming in Phase 3" }) }), _jsx(Card, { style: { border: "1px dashed #475569" }, children: _jsx("span", { style: { color: C.textDim, fontSize: "13px" }, children: "Reviews and cost tracking \u2014 coming in Phase 4" }) })] }));
}
// =============================================================================
// Main Projects View
// =============================================================================
function ProjectsView() {
    const { projectId: parentProjectId, companyId } = useHostContext();
    const { data: projects, loading, error, refresh } = usePluginData("projects", {
        parentProjectId: parentProjectId || "",
    });
    const createProjectAction = usePluginAction("create-project");
    const [showCreate, setShowCreate] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [actionError, setActionError] = useState(null);
    if (!parentProjectId) {
        return (_jsx("div", { style: { padding: "24px", color: C.textMuted }, children: "Open a project to see its automation." }));
    }
    // Detail view
    if (selectedProjectId) {
        return (_jsx("div", { style: { padding: "24px", color: C.text, fontFamily: "system-ui" }, children: _jsx(ProjectDetailView, { projectId: selectedProjectId, parentProjectId: parentProjectId, companyId: companyId || "", onBack: () => { setSelectedProjectId(null); refresh(); } }) }));
    }
    // List view
    const handleCreate = async (data) => {
        try {
            setActionError(null);
            const result = await createProjectAction({
                parentProjectId,
                name: data.name,
                prdText: data.prdText,
                priority: data.priority,
            });
            setShowCreate(false);
            setSelectedProjectId(result.id);
            refresh();
        }
        catch (err) {
            setActionError(err.message || "Failed to create project");
        }
    };
    return (_jsxs("div", { style: { padding: "24px", color: C.text, fontFamily: "system-ui", minHeight: "400px" }, children: [actionError && _jsx(ErrorBanner, { message: actionError }), _jsxs("div", { style: {
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: "24px", paddingBottom: "16px", borderBottom: `1px solid ${C.border}`,
                }, children: [_jsx("h2", { style: { margin: 0, fontSize: "20px", fontWeight: 700, color: "#f1f5f9" }, children: "Projects" }), _jsx(Btn, { onClick: () => setShowCreate(true), variant: "primary", children: "+ New Project" })] }), showCreate && (_jsx(CreateProjectForm, { onSubmit: handleCreate, onCancel: () => setShowCreate(false) })), loading && _jsx("div", { style: { color: C.textMuted }, children: "Loading..." }), error && _jsx(ErrorBanner, { message: error.message }), projects && projects.length === 0 && !showCreate ? (_jsxs(Card, { style: { textAlign: "center", padding: "48px", border: "1px dashed #475569" }, children: [_jsx("div", { style: { fontSize: "36px", marginBottom: "16px" }, children: "\uD83D\uDE80" }), _jsx("div", { style: { fontWeight: 600, marginBottom: "8px", color: "#cbd5e1" }, children: "No projects yet" }), _jsx("div", { style: { color: C.textMuted }, children: "Click \"+ New Project\" to create one. Paste a PRD and let the system build it for you." })] })) : (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: (projects || []).map((p) => (_jsxs(Card, { onClick: () => setSelectedProjectId(p.id), style: {
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                    }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx("div", { style: { fontWeight: 600, fontSize: "15px", color: "#f1f5f9" }, children: p.name }), _jsx(Badge, { label: p.priority, colors: PRIORITY_COLORS })] }), _jsx("div", { style: { fontSize: "12px", color: C.textDim, marginTop: "4px" }, children: p.prdText ? `PRD: ${p.prdText.slice(0, 80)}...` : "No PRD attached" })] }), _jsx(Badge, { label: p.status })] }, p.id))) }))] }));
}
// =============================================================================
// Exported Slot Components
// =============================================================================
export function AutomationSidebar({ context }) {
    return (_jsxs("div", { style: {
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 14px", color: C.text, fontSize: "14px", fontWeight: 500,
        }, children: [_jsx("span", { style: {
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: "24px", height: "24px", borderRadius: "6px",
                    backgroundColor: C.accent, color: "#fff", fontSize: "13px", fontWeight: 700, flexShrink: 0,
                }, children: "A" }), _jsx("span", { children: "Automation" })] }));
}
export function ProjectsTab({ context }) {
    return _jsx(ProjectsView, {});
}
//# sourceMappingURL=index.js.map