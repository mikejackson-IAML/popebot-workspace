import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { usePluginData, usePluginAction, useHostContext, usePluginToast, } from "@paperclipai/plugin-sdk/ui";
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
    "needs-review": { bg: "#78350f", text: "#fbbf24" },
    complete: { bg: "#14532d", text: "#4ade80" },
    advancing: { bg: "#4c1d95", text: "#c4b5fd" },
    failed: { bg: "#7f1d1d", text: "#f87171" },
    // job statuses
    pending: { bg: "#374151", text: "#9ca3af" },
    dispatched: { bg: "#1e3a5f", text: "#60a5fa" },
    merged: { bg: "#14532d", text: "#4ade80" },
    skipped: { bg: "#1f2937", text: "#6b7280" },
    // pipeline statuses
    queued: { bg: "#374151", text: "#9ca3af" },
    cancelled: { bg: "#78350f", text: "#fbbf24" },
};
const TIER_COLORS = {
    haiku: { bg: "#1e3a5f", text: "#60a5fa", label: "Tier 1: Haiku" },
    deepseek: { bg: "#4c1d95", text: "#c4b5fd", label: "Tier 2: DeepSeek" },
    codex: { bg: "#064e3b", text: "#34d399", label: "Tier 3: Codex" },
};
const VERDICT_COLORS = {
    approve: { bg: "#14532d", text: "#4ade80" },
    pass: { bg: "#14532d", text: "#4ade80" },
    concerns: { bg: "#78350f", text: "#fbbf24" },
    "request-changes": { bg: "#7f1d1d", text: "#f87171" },
    block: { bg: "#7f1d1d", text: "#f87171" },
    reject: { bg: "#7f1d1d", text: "#f87171" },
    unknown: { bg: "#374151", text: "#9ca3af" },
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
function ProjectDetailView({ projectId, parentProjectId, onBack }) {
    const [pollTick, setPollTick] = useState(0);
    const [pendingPoll, setPendingPoll] = useState(false);
    // Schedule next poll tick. Uses pendingPoll flag to prevent stacking multiple
    // timeouts. The chain: Start Build → setPendingPoll(true) → render detects
    // pendingPoll+active → fires one setTimeout → tick increments → params change →
    // usePluginData re-fetches → render again → repeat while active.
    const scheduleNextTick = () => {
        if (pendingPoll)
            return;
        setPendingPoll(true);
        setTimeout(() => {
            setPollTick((t) => t + 1);
            setPendingPoll(false);
        }, 8_000);
    };
    const { data, loading, error, refresh } = usePluginData("project-detail", {
        parentProjectId,
        projectId,
    });
    const updateProject = usePluginAction("update-project");
    const deleteProjectAction = usePluginAction("delete-project");
    const decomposePrdAction = usePluginAction("decompose-prd");
    const updateJobAction = usePluginAction("update-job");
    const saveApiKeyAction = usePluginAction("save-api-key");
    const saveRtxKeyAction = usePluginAction("save-rtx-key");
    const startPipelineAction = usePluginAction("start-pipeline");
    const cancelPipelineAction = usePluginAction("cancel-pipeline");
    const toggleAutoAdvanceAction = usePluginAction("toggle-auto-advance");
    const advanceProjectAction = usePluginAction("advance-project");
    const approvePhaseAction = usePluginAction("approve-phase");
    const rejectPhaseAction = usePluginAction("reject-phase");
    const toast = usePluginToast();
    const { data: apiKeyStatus, refresh: refreshApiKey } = usePluginData("api-key-status", {});
    const { data: rtxKeyStatus, refresh: refreshRtxKey } = usePluginData("rtx-key-status", {});
    const { data: progressData } = usePluginData("progress-log", {
        parentProjectId, projectId,
    });
    const { data: phaseReport } = usePluginData("phase-report", {
        parentProjectId, projectId,
    });
    const { data: pipelineEvents, refresh: refreshPipelineEvents } = usePluginData("pipeline-events", {
        parentProjectId, projectId,
        _tick: pollTick,
    });
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPrd, setEditPrd] = useState("");
    const [editPriority, setEditPriority] = useState("P2");
    const [actionError, setActionError] = useState(null);
    const [decomposing, setDecomposing] = useState(false);
    const [showApiKeyConfig, setShowApiKeyConfig] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState("");
    const [rtxKeyInput, setRtxKeyInput] = useState("");
    const [pipelineStarting, setPipelineStarting] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [advancing, setAdvancing] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    if (loading)
        return _jsx("div", { style: { padding: "24px", color: C.textMuted }, children: "Loading..." });
    if (error)
        return _jsx(ErrorBanner, { message: error.message });
    if (!data)
        return _jsx(ErrorBanner, { message: "Project not found" });
    const { project, jobs, usage, reviews } = data;
    // Auto-poll: if pipeline is active, schedule next tick to re-fetch data.
    // Starts from Start Build click OR when navigating into an already-building project.
    const isActive = project.status === "building" || project.status === "reviewing" || project.status === "advancing";
    if (isActive && !pendingPoll) {
        scheduleNextTick();
    }
    // Filter progress events for this project
    const myProgress = progressData || [];
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
        if (!apiKeyStatus?.configured) {
            setShowApiKeyConfig(true);
            setActionError("Configure your Anthropic API key first.");
            return;
        }
        try {
            setActionError(null);
            setDecomposing(true);
            await decomposePrdAction({ parentProjectId, projectId });
            // Action returns immediately — decomposition runs in background.
            // Polling is handled by useEffect below.
        }
        catch (err) {
            setActionError(err.message || "Decomposition failed");
            setDecomposing(false);
        }
    };
    const handleSaveApiKey = async () => {
        try {
            await saveApiKeyAction({ apiKey: apiKeyInput });
            setApiKeyInput("");
            setActionError(null);
            refreshApiKey();
        }
        catch (err) {
            setActionError(err.message || "Failed to save API key");
        }
    };
    const handleSaveRtxKey = async () => {
        try {
            await saveRtxKeyAction({ apiKey: rtxKeyInput });
            setRtxKeyInput("");
            setActionError(null);
            refreshRtxKey();
        }
        catch (err) {
            setActionError(err.message || "Failed to save RTX key");
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
    const handleStartPipeline = async () => {
        if (!rtxKeyStatus?.configured) {
            setShowApiKeyConfig(true);
            setActionError("Configure your RTX Pipeline Key first (gear icon).");
            return;
        }
        try {
            setActionError(null);
            setPipelineStarting(true);
            await startPipelineAction({
                parentProjectId,
                projectId,
                reviewDir: "plugins/dev-department",
                phaseScope: "",
            });
            refresh();
        }
        catch (err) {
            setActionError(err.message || "Failed to start pipeline");
        }
        finally {
            setPipelineStarting(false);
        }
    };
    const handleCancelPipeline = async () => {
        try {
            setActionError(null);
            setCancelling(true);
            await cancelPipelineAction({ parentProjectId, projectId });
            refresh();
        }
        catch (err) {
            setActionError(err.message || "Failed to cancel pipeline");
        }
        finally {
            setCancelling(false);
        }
    };
    const handleToggleAutoAdvance = async () => {
        try {
            setActionError(null);
            await toggleAutoAdvanceAction({ parentProjectId, projectId });
            refresh();
        }
        catch (err) {
            setActionError(err.message || "Failed to toggle auto-advance");
        }
    };
    const handleAdvanceProject = async () => {
        try {
            setActionError(null);
            setAdvancing(true);
            await advanceProjectAction({ parentProjectId, projectId, phaseScope: `Phase ${project.phaseNumber || 1}` });
            refresh();
        }
        catch (err) {
            setActionError(err.message || "Failed to start phase advancement");
        }
        finally {
            setAdvancing(false);
        }
    };
    const handleApprovePhase = async () => {
        try {
            setActionError(null);
            await approvePhaseAction({ parentProjectId, projectId });
            toast({
                title: "Phase approved",
                body: project.autoAdvance ? "Auto-advancing to next phase..." : "Phase marked as complete.",
                tone: "success",
                ttlMs: 5000,
            });
            refresh();
        }
        catch (err) {
            setActionError(err.message || "Failed to approve");
        }
    };
    const handleRejectPhase = async () => {
        try {
            setActionError(null);
            await rejectPhaseAction({ parentProjectId, projectId, reason: rejectReason || "Rejected by reviewer" });
            setShowRejectForm(false);
            setRejectReason("");
            toast({
                title: "Phase rejected",
                body: rejectReason || "Rejected by reviewer",
                tone: "error",
                ttlMs: 5000,
            });
            refresh();
        }
        catch (err) {
            setActionError(err.message || "Failed to reject");
        }
    };
    // Calculate total cost
    const totalCost = usage.reduce((sum, u) => sum + u.estimatedCostUsd, 0);
    const canDecompose = project.prdText && (project.status === "draft" || project.status === "failed");
    const isPlanning = project.status === "planning";
    const canStartPipeline = project.status === "ready" && jobs.length > 0;
    const isPipelineRunning = project.status === "building" || project.status === "reviewing";
    const isAdvancing = project.status === "advancing";
    const needsReview = project.status === "needs-review";
    const canAdvance = project.status === "complete" && !phaseReport;
    // Toast when project needs review
    if (needsReview) {
        toast({
            dedupeKey: `review-${projectId}`,
            title: "Review needed",
            body: `"${project.name}" pipeline complete — approve or reject.`,
            tone: "warn",
            ttlMs: 10000,
        });
    }
    const { pipeline } = data;
    const myPipelineEvents = pipelineEvents || [];
    return (_jsxs("div", { children: [actionError && _jsx(ErrorBanner, { message: actionError }), needsReview && (_jsxs(Card, { style: {
                    marginBottom: "16px",
                    borderColor: C.warning,
                    border: `2px solid ${C.warning}`,
                    background: "linear-gradient(135deg, #1e293b 0%, #1a1a2e 100%)",
                }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }, children: [_jsx("span", { style: { fontSize: "20px" }, children: "\u26A0" }), _jsx("h3", { style: { margin: 0, color: C.warning, fontSize: "16px" }, children: "Review Required" }), _jsx(Badge, { label: `Phase ${project.phaseNumber || 1}`, colors: {
                                    [`Phase ${project.phaseNumber || 1}`]: { bg: "#4c1d95", text: "#c4b5fd" },
                                } })] }), _jsx("p", { style: { color: C.text, fontSize: "13px", margin: "0 0 12px 0" }, children: "Pipeline complete. Review the results below before approving or rejecting." }), _jsxs("div", { style: {
                            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px",
                        }, children: [_jsxs("div", { style: {
                                    padding: "10px", backgroundColor: "#0f172a", borderRadius: "6px", textAlign: "center",
                                }, children: [_jsx("div", { style: { fontSize: "18px", fontWeight: 700, color: C.text }, children: jobs.length }), _jsx("div", { style: { fontSize: "11px", color: C.textDim }, children: "Build Jobs" })] }), _jsxs("div", { style: {
                                    padding: "10px", backgroundColor: "#0f172a", borderRadius: "6px", textAlign: "center",
                                }, children: [_jsx("div", { style: { fontSize: "18px", fontWeight: 700, color: C.text }, children: reviews.length }), _jsx("div", { style: { fontSize: "11px", color: C.textDim }, children: "Review Results" })] }), _jsxs("div", { style: {
                                    padding: "10px", backgroundColor: "#0f172a", borderRadius: "6px", textAlign: "center",
                                }, children: [_jsxs("div", { style: { fontSize: "18px", fontWeight: 700, color: C.success }, children: ["$", totalCost.toFixed(4)] }), _jsx("div", { style: { fontSize: "11px", color: C.textDim }, children: "Total Cost" })] })] }), reviews.length > 0 && (_jsx("div", { style: { display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }, children: ["haiku", "deepseek", "codex"].map(tier => {
                            const tierReviews = reviews.filter(r => r.tier === tier);
                            const latest = tierReviews[tierReviews.length - 1];
                            if (!latest)
                                return null;
                            const tc = TIER_COLORS[tier] || TIER_COLORS.haiku;
                            const vc = VERDICT_COLORS[latest.verdict] || VERDICT_COLORS.unknown;
                            return (_jsxs("div", { style: {
                                    display: "flex", alignItems: "center", gap: "6px",
                                    padding: "6px 10px", backgroundColor: "#0f172a",
                                    borderRadius: "6px", border: `1px solid ${C.border}`,
                                }, children: [_jsx("span", { style: {
                                            padding: "2px 8px", borderRadius: "10px", fontSize: "10px",
                                            fontWeight: 600, backgroundColor: tc.bg, color: tc.text,
                                        }, children: tc.label }), _jsx("span", { style: {
                                            padding: "2px 8px", borderRadius: "10px", fontSize: "10px",
                                            fontWeight: 600, backgroundColor: vc.bg, color: vc.text,
                                            textTransform: "uppercase",
                                        }, children: latest.verdict })] }, tier));
                        }) })), pipeline?.completedAt && pipeline?.startedAt && (_jsxs("div", { style: { fontSize: "12px", color: C.textDim, marginBottom: "12px" }, children: ["Pipeline duration: ", (() => {
                                const ms = new Date(pipeline.completedAt).getTime() - new Date(pipeline.startedAt).getTime();
                                const mins = Math.floor(ms / 60000);
                                const secs = Math.floor((ms % 60000) / 1000);
                                return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                            })()] })), project.autoAdvance && (_jsxs("div", { style: {
                            fontSize: "12px", color: "#c4b5fd", marginBottom: "12px",
                            padding: "6px 10px", backgroundColor: "#4c1d95", borderRadius: "6px",
                        }, children: ["Auto-advance is ON \u2014 approving will generate Phase ", (project.phaseNumber || 1) + 1, " report and PRD."] })), !showRejectForm ? (_jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsxs(Btn, { variant: "primary", onClick: handleApprovePhase, style: { backgroundColor: "#059669", flex: 1, padding: "12px", fontSize: "14px", fontWeight: 600 }, children: ["Approve Phase ", project.phaseNumber || 1] }), _jsx(Btn, { variant: "danger", onClick: () => setShowRejectForm(true), style: { flex: 1, padding: "12px", fontSize: "14px", fontWeight: 600 }, children: "Reject" })] })) : (_jsxs("div", { style: { display: "grid", gap: "8px" }, children: [_jsx(Label, { children: "Rejection reason" }), _jsx(TextArea, { value: rejectReason, onChange: setRejectReason, placeholder: "What needs to change before this phase can be approved?", rows: 3 }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx(Btn, { variant: "danger", onClick: handleRejectPhase, style: { flex: 1 }, children: "Confirm Reject" }), _jsx(Btn, { variant: "ghost", onClick: () => { setShowRejectForm(false); setRejectReason(""); }, children: "Cancel" })] })] }))] })), showApiKeyConfig && (_jsxs(Card, { style: { marginBottom: "16px", borderColor: C.accent }, children: [_jsx("h4", { style: { margin: "0 0 12px 0", color: C.text, fontSize: "14px" }, children: "Settings" }), _jsxs("div", { style: { marginBottom: "16px" }, children: [_jsxs(Label, { children: ["Anthropic API Key ", apiKeyStatus?.configured && _jsx("span", { style: { color: C.success, marginLeft: "6px" }, children: "configured" })] }), _jsx("p", { style: { color: C.textMuted, fontSize: "12px", margin: "0 0 6px 0" }, children: "Used for PRD decomposition (Sonnet)." }), _jsxs("div", { style: { display: "flex", gap: "8px", alignItems: "center" }, children: [_jsx("input", { type: "password", value: apiKeyInput, onChange: (e) => setApiKeyInput(e.target.value), placeholder: "sk-ant-...", style: {
                                            flex: 1, padding: "10px 12px", backgroundColor: C.bgInput, color: C.text,
                                            border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box",
                                        } }), _jsx(Btn, { variant: "primary", onClick: handleSaveApiKey, disabled: !apiKeyInput.trim(), children: "Save" })] })] }), _jsxs("div", { style: { marginBottom: "12px" }, children: [_jsxs(Label, { children: ["RTX Pipeline Key ", rtxKeyStatus?.configured && _jsx("span", { style: { color: C.success, marginLeft: "6px" }, children: "configured" })] }), _jsx("p", { style: { color: C.textMuted, fontSize: "12px", margin: "0 0 6px 0" }, children: "Authenticates with RTX orchestrator. Same value as ~/.popebot-api-key on RTX." }), _jsxs("div", { style: { display: "flex", gap: "8px", alignItems: "center" }, children: [_jsx("input", { type: "password", value: rtxKeyInput, onChange: (e) => setRtxKeyInput(e.target.value), placeholder: "API key from RTX", style: {
                                            flex: 1, padding: "10px 12px", backgroundColor: C.bgInput, color: C.text,
                                            border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box",
                                        } }), _jsx(Btn, { variant: "primary", onClick: handleSaveRtxKey, disabled: !rtxKeyInput.trim(), children: "Save" })] })] }), _jsx("div", { style: { display: "flex", justifyContent: "flex-end" }, children: _jsx(Btn, { variant: "ghost", onClick: () => setShowApiKeyConfig(false), children: "Close" }) })] })), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }, children: [_jsx(Btn, { onClick: onBack, variant: "ghost", children: "\u2190 Back" }), _jsx("h2", { style: { margin: 0, color: C.text, fontSize: "18px", flex: 1 }, children: project.name }), _jsx(Badge, { label: project.priority, colors: PRIORITY_COLORS }), _jsx(Badge, { label: project.status })] }), editing ? (_jsx(Card, { style: { marginBottom: "16px" }, children: _jsxs("div", { style: { display: "grid", gap: "12px" }, children: [_jsxs("div", { children: [_jsx(Label, { children: "Project Name" }), _jsx(Input, { value: editName, onChange: setEditName, placeholder: "Project name" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Priority" }), _jsx(Select, { value: editPriority, onChange: (v) => setEditPriority(v), options: [
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
                                                    }, style: { display: "none" } })] }), _jsx("span", { style: { color: C.textDim, fontSize: "12px" }, children: "or edit below" })] }), _jsx(TextArea, { value: editPrd, onChange: setEditPrd, placeholder: "PRD text...", rows: 12 })] }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx(Btn, { onClick: handleSave, variant: "primary", children: "Save" }), _jsx(Btn, { onClick: () => setEditing(false), variant: "ghost", children: "Cancel" })] })] }) })) : (_jsxs("div", { style: { display: "grid", gap: "12px", marginBottom: "20px" }, children: [_jsxs("div", { style: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }, children: [_jsx(Btn, { onClick: startEditing, variant: "default", children: "Edit Project" }), _jsx(Btn, { onClick: handleDelete, variant: "danger", children: "Delete" }), canAdvance && (_jsx(Btn, { variant: "primary", onClick: handleAdvanceProject, disabled: advancing, style: { backgroundColor: "#7c3aed" }, children: advancing ? "Advancing..." : `Advance to Phase ${(project.phaseNumber || 1) + 1}` })), _jsxs("div", { onClick: handleToggleAutoAdvance, style: {
                                    display: "flex", alignItems: "center", gap: "6px", cursor: "pointer",
                                    padding: "6px 12px", borderRadius: "6px",
                                    backgroundColor: project.autoAdvance ? "#4c1d95" : "#374151",
                                    border: `1px solid ${project.autoAdvance ? "#7c3aed" : C.border}`,
                                }, children: [_jsx("div", { style: {
                                            width: "32px", height: "16px", borderRadius: "8px",
                                            backgroundColor: project.autoAdvance ? "#7c3aed" : "#4b5563",
                                            position: "relative", transition: "background-color 0.2s",
                                        }, children: _jsx("div", { style: {
                                                width: "12px", height: "12px", borderRadius: "50%",
                                                backgroundColor: "#fff", position: "absolute", top: "2px",
                                                left: project.autoAdvance ? "18px" : "2px",
                                                transition: "left 0.2s",
                                            } }) }), _jsx("span", { style: { fontSize: "12px", color: project.autoAdvance ? "#c4b5fd" : C.textMuted }, children: "Auto-advance" })] }), _jsxs("span", { style: {
                                    fontSize: "12px", color: "#c4b5fd", fontWeight: 600,
                                    padding: "4px 10px", borderRadius: "12px",
                                    backgroundColor: "#4c1d95",
                                }, children: ["Phase ", project.phaseNumber || 1] }), project.sourceProjectId && (_jsxs("span", { style: { fontSize: "11px", color: C.textDim }, children: ["(from ", project.sourceProjectId.slice(0, 8), ")"] }))] }), project.decompositionSummary && (_jsxs(Card, { children: [_jsx(Label, { children: "Decomposition Summary" }), _jsx("p", { style: { color: C.text, fontSize: "13px", lineHeight: "1.5", margin: 0 }, children: project.decompositionSummary })] })), project.prdText ? (_jsxs(Card, { children: [_jsx(Label, { children: "PRD" }), _jsx("pre", { style: {
                                    color: C.text, fontSize: "13px", lineHeight: "1.5",
                                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                                    maxHeight: "300px", overflow: "auto", margin: 0,
                                }, children: project.prdText })] })) : (_jsx(Card, { style: { border: "1px dashed #475569" }, children: _jsx("span", { style: { color: C.textDim }, children: "No PRD attached. Edit this project to add one." }) }))] })), (isPlanning || myProgress.length > 0) && (_jsxs(Card, { style: { marginBottom: "16px", borderColor: C.accent }, children: [_jsx(Label, { children: "Progress" }), _jsxs("div", { style: { maxHeight: "150px", overflow: "auto" }, children: [myProgress.map((evt, i) => (_jsxs("div", { style: { fontSize: "12px", color: C.textMuted, padding: "2px 0", fontFamily: "monospace" }, children: [_jsx("span", { style: { color: C.textDim, marginRight: "8px" }, children: new Date(evt.timestamp).toLocaleTimeString() }), evt.message] }, i))), decomposing && myProgress.length === 0 && (_jsx("div", { style: { fontSize: "12px", color: C.accent }, children: "Starting decomposition..." }))] })] })), _jsxs("div", { style: { marginBottom: "16px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }, children: [_jsxs("h3", { style: { margin: 0, color: C.textMuted, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }, children: ["Build Jobs ", jobs.length > 0 && `(${jobs.length})`] }), _jsxs("div", { style: { display: "flex", gap: "6px", alignItems: "center" }, children: [canDecompose && (_jsx(Btn, { variant: "primary", onClick: handleDecompose, disabled: decomposing, children: decomposing ? "Analyzing..." : (jobs.length > 0 ? "Re-Analyze PRD" : "Analyze PRD") })), canStartPipeline && !isPipelineRunning && (_jsx(Btn, { variant: "primary", onClick: handleStartPipeline, disabled: pipelineStarting, style: { backgroundColor: "#059669" }, children: pipelineStarting ? "Starting..." : "Start Build" })), _jsx(Btn, { variant: "ghost", onClick: () => setShowApiKeyConfig(true), style: { fontSize: "12px", padding: "6px 8px" }, children: "\u2699" })] })] }), jobs.length === 0 ? (_jsx(Card, { style: { border: "1px dashed #475569", textAlign: "center", padding: "24px" }, children: _jsx("span", { style: { color: C.textDim }, children: project.prdText
                                ? 'PRD attached. Click "Analyze PRD" to decompose into build jobs.'
                                : "Add a PRD first, then analyze it to generate build jobs." }) })) : (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: jobs.map((job, i) => (_jsx(EditableJobCard, { job: job, index: i, onSave: (updates) => handleUpdateJob(job.id, updates) }, job.id))) }))] }), totalCost > 0 && (_jsxs(Card, { style: { marginBottom: "16px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx(Label, { children: "LLM Cost" }), _jsxs("span", { style: { color: C.success, fontSize: "14px", fontWeight: 600 }, children: ["$", totalCost.toFixed(4)] })] }), _jsx("div", { style: { marginTop: "4px" }, children: usage.map((u, i) => (_jsxs("div", { style: { fontSize: "11px", color: C.textDim }, children: [u.model, " (", u.purpose, ") \u2014 ", u.inputTokens.toLocaleString(), " in / ", u.outputTokens.toLocaleString(), " out \u2014 $", u.estimatedCostUsd.toFixed(4)] }, i))) })] })), _jsxs("div", { style: { marginBottom: "16px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }, children: [_jsx("h3", { style: { margin: 0, color: C.textMuted, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }, children: "Pipeline" }), _jsx("div", { style: { display: "flex", gap: "6px", alignItems: "center" }, children: isPipelineRunning && (_jsx(Btn, { variant: "danger", onClick: handleCancelPipeline, disabled: cancelling, children: cancelling ? "Cancelling..." : "Cancel" })) })] }), pipeline && (_jsxs(Card, { style: { marginBottom: "8px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }, children: [_jsxs("div", { style: { display: "flex", gap: "8px", alignItems: "center" }, children: [_jsx(Badge, { label: pipeline.status }), _jsx("span", { style: { fontSize: "12px", color: C.textMuted }, children: (() => {
                                                    const steps = ["build", "review", "fix", "done"];
                                                    const labels = {
                                                        build: "Building code",
                                                        review: "Running reviews (haiku → deepseek → codex)",
                                                        fix: "Applying fixes",
                                                        advance: "Advancing phase",
                                                        done: "Complete",
                                                    };
                                                    const current = pipeline.currentStep || "build";
                                                    const stepNum = steps.indexOf(current) + 1 || 1;
                                                    const total = steps.length;
                                                    return `Step ${stepNum}/${total}: ${labels[current] || current}`;
                                                })() })] }), _jsx("span", { style: { fontSize: "11px", color: C.textDim }, children: pipeline.rtxPipelineId ? `RTX: ${pipeline.rtxPipelineId.slice(0, 8)}...` : "" })] }), _jsxs("div", { style: { fontSize: "12px", color: C.textDim }, children: ["Started: ", new Date(pipeline.startedAt).toLocaleString(), pipeline.completedAt && (_jsxs("span", { children: [" | Completed: ", new Date(pipeline.completedAt).toLocaleString()] }))] })] })), myPipelineEvents.length > 0 && (_jsxs(Card, { style: { borderColor: isPipelineRunning ? C.accent : C.border }, children: [_jsx(Label, { children: "Pipeline Events" }), _jsxs("div", { style: { maxHeight: "250px", overflow: "auto" }, children: [myPipelineEvents.map((evt, i) => (_jsxs("div", { style: { fontSize: "12px", color: C.textMuted, padding: "2px 0", fontFamily: "monospace" }, children: [_jsx("span", { style: { color: C.textDim, marginRight: "8px" }, children: new Date(evt.timestamp).toLocaleTimeString() }), _jsx("span", { style: {
                                                    color: evt.type === "pipeline_complete" ? C.success
                                                        : evt.type === "pipeline_failed" ? "#f87171"
                                                            : C.text,
                                                }, children: evt.message })] }, i))), isPipelineRunning && (_jsx("div", { style: { fontSize: "12px", color: C.accent, padding: "4px 0" }, children: "Pipeline running... (updates every 10s)" }))] })] })), !pipeline && !canStartPipeline && jobs.length === 0 && (_jsx(Card, { style: { border: "1px dashed #475569", textAlign: "center", padding: "24px" }, children: _jsx("span", { style: { color: C.textDim }, children: "Decompose a PRD into build jobs first, then start the pipeline." }) })), !pipeline && canStartPipeline && (_jsx(Card, { style: { border: "1px dashed #475569", textAlign: "center", padding: "24px" }, children: _jsxs("span", { style: { color: C.textDim }, children: [jobs.length, " jobs ready. Click \"Start Build\" to launch the pipeline on RTX."] }) }))] }), isAdvancing && (_jsx(Card, { style: { marginBottom: "16px", borderColor: "#7c3aed" }, children: _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [_jsxs("span", { style: { color: "#c4b5fd", fontSize: "14px", fontWeight: 600 }, children: ["Advancing to Phase ", (project.phaseNumber || 1) + 1, "..."] }), _jsx("span", { style: { color: C.textDim, fontSize: "12px" }, children: "Generating report and next-phase PRD on RTX" })] }) })), phaseReport && (_jsxs("div", { style: { marginBottom: "16px" }, children: [_jsxs("h3", { style: { margin: "0 0 12px 0", color: C.textMuted, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }, children: ["Phase ", phaseReport.phaseNumber, " Report"] }), _jsxs(Card, { children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }, children: [_jsxs("span", { style: { color: "#c4b5fd", fontSize: "13px", fontWeight: 600 }, children: ["Phase ", phaseReport.phaseNumber, " \u2192 ", phaseReport.nextPhase] }), _jsx("span", { style: { fontSize: "11px", color: C.textDim }, children: new Date(phaseReport.createdAt).toLocaleString() })] }), phaseReport.report && (_jsxs("details", { style: { marginBottom: "8px" }, children: [_jsxs("summary", { style: { cursor: "pointer", color: C.textMuted, fontSize: "12px", marginBottom: "4px" }, children: ["Completion Report (", phaseReport.report.length, " chars)"] }), _jsx("pre", { style: {
                                            color: C.text, fontSize: "11px", lineHeight: "1.4",
                                            whiteSpace: "pre-wrap", wordBreak: "break-word",
                                            maxHeight: "300px", overflow: "auto", margin: "4px 0",
                                            padding: "8px", backgroundColor: "#0f172a", borderRadius: "4px",
                                        }, children: phaseReport.report })] })), phaseReport.nextPrd && (_jsxs("details", { children: [_jsxs("summary", { style: { cursor: "pointer", color: C.textMuted, fontSize: "12px", marginBottom: "4px" }, children: ["Next Phase PRD (", phaseReport.nextPrd.length, " chars)"] }), _jsx("pre", { style: {
                                            color: C.text, fontSize: "11px", lineHeight: "1.4",
                                            whiteSpace: "pre-wrap", wordBreak: "break-word",
                                            maxHeight: "300px", overflow: "auto", margin: "4px 0",
                                            padding: "8px", backgroundColor: "#0f172a", borderRadius: "4px",
                                        }, children: phaseReport.nextPrd })] })), phaseReport.nextProjectId && (_jsxs("div", { style: { marginTop: "8px", fontSize: "12px", color: "#c4b5fd" }, children: ["Next project: ", phaseReport.nextProjectId.slice(0, 8), "... (go back to project list to open it)"] }))] })] })), _jsxs("div", { style: { marginBottom: "16px" }, children: [_jsxs("h3", { style: { margin: "0 0 12px 0", color: C.textMuted, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }, children: ["Review Tiers ", reviews.length > 0 && `(${reviews.length} results)`] }), reviews.length === 0 ? (_jsx(Card, { style: { border: "1px dashed #475569", textAlign: "center", padding: "24px" }, children: _jsxs("span", { style: { color: C.textDim }, children: ["Review results will appear here during pipeline execution.", isPipelineRunning && " Pipeline is running..."] }) })) : (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: Array.from(new Set(reviews.map(r => r.round))).sort().map(round => {
                            const roundReviews = reviews.filter(r => r.round === round);
                            // Order: haiku, deepseek, codex
                            const tierOrder = ["haiku", "deepseek", "codex"];
                            const sorted = tierOrder
                                .map(t => roundReviews.find(r => r.tier === t))
                                .filter((r) => !!r);
                            return (_jsxs(Card, { style: { padding: "12px 16px" }, children: [_jsxs("div", { style: { fontSize: "12px", color: C.textMuted, marginBottom: "8px", fontWeight: 600 }, children: ["Round ", round] }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: sorted.map(review => {
                                            const tc = TIER_COLORS[review.tier] || TIER_COLORS.haiku;
                                            const vc = VERDICT_COLORS[review.verdict] || VERDICT_COLORS.unknown;
                                            return (_jsxs("div", { style: {
                                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                                    padding: "8px 12px", backgroundColor: "#0f172a", borderRadius: "6px",
                                                    border: `1px solid ${C.border}`,
                                                }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [_jsx("span", { style: {
                                                                    padding: "2px 10px", borderRadius: "12px", fontSize: "11px",
                                                                    fontWeight: 600, backgroundColor: tc.bg, color: tc.text,
                                                                }, children: tc.label }), _jsx("span", { style: { fontSize: "12px", color: C.textDim }, children: new Date(review.createdAt).toLocaleTimeString() })] }), _jsx("span", { style: {
                                                            padding: "2px 10px", borderRadius: "12px", fontSize: "11px",
                                                            fontWeight: 600, backgroundColor: vc.bg, color: vc.text,
                                                            textTransform: "uppercase",
                                                        }, children: review.verdict })] }, review.id));
                                        }) })] }, round));
                        }) }))] })] }));
}
// =============================================================================
// Main Projects View
// =============================================================================
function ProjectsView() {
    const { projectId: parentProjectId } = useHostContext();
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
        return (_jsx("div", { style: { padding: "24px", color: C.text, fontFamily: "system-ui" }, children: _jsx(ProjectDetailView, { projectId: selectedProjectId, parentProjectId: parentProjectId, onBack: () => { setSelectedProjectId(null); refresh(); } }) }));
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
    const { projectId: parentProjectId } = useHostContext();
    const { data: reviewData } = usePluginData("review-count", {
        parentProjectId: parentProjectId || "",
    });
    const reviewCount = reviewData?.count || 0;
    return (_jsxs("div", { style: {
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 14px", color: C.text, fontSize: "14px", fontWeight: 500,
        }, children: [_jsx("span", { style: {
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: "24px", height: "24px", borderRadius: "6px",
                    backgroundColor: C.accent, color: "#fff", fontSize: "13px", fontWeight: 700, flexShrink: 0,
                }, children: "A" }), _jsx("span", { children: "Automation" }), reviewCount > 0 && (_jsx("span", { style: {
                    marginLeft: "auto",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: "20px", height: "20px", borderRadius: "10px",
                    backgroundColor: C.warning, color: "#000",
                    fontSize: "11px", fontWeight: 700, padding: "0 6px",
                }, children: reviewCount }))] }));
}
export function ProjectsTab({ context }) {
    return _jsx(ProjectsView, {});
}
//# sourceMappingURL=index.js.map