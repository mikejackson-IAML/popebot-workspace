import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { usePluginData, usePluginAction, useHostContext, usePluginToast, } from "@paperclipai/plugin-sdk/ui";
// SDK shared components (StatusBadge, DataTable, etc.) are declared in the SDK
// but not wired into package exports. We access them via the internal runtime
// module. If they fail to load, we fall back to simple HTML equivalents.
let _getSdkUi = null;
try {
    // Dynamic import of the runtime accessor — works in Paperclip's module host
    const runtime = require("@paperclipai/plugin-sdk/dist/ui/runtime");
    _getSdkUi = runtime.getSdkUiRuntimeValue;
}
catch { /* not available — fallbacks will be used */ }
function sdkComponent(name, fallback) {
    if (_getSdkUi) {
        try {
            const c = _getSdkUi(name);
            if (c)
                return c;
        }
        catch { }
    }
    return fallback;
}
// Fallback implementations that blend with host theme
const StatusBadge = sdkComponent("StatusBadge", ({ label, status }) => {
    const colors = { ok: "#4ade80", warning: "#fbbf24", error: "#f87171", info: "#60a5fa", pending: "#94a3b8" };
    return _jsx("span", { style: { padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: `${colors[status] || colors.pending}22`, color: colors[status] || colors.pending }, children: label });
});
const MetricCard = sdkComponent("MetricCard", ({ label, value }) => (_jsxs("div", { style: { padding: "12px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", textAlign: "center" }, children: [_jsx("div", { style: { fontSize: "18px", fontWeight: 700 }, children: value }), _jsx("div", { style: { fontSize: "11px", opacity: 0.5 }, children: label })] })));
const LogView = sdkComponent("LogView", ({ entries, maxHeight, loading }) => (_jsxs("div", { style: { maxHeight: maxHeight || "400px", overflow: "auto", fontFamily: "monospace", fontSize: "12px", padding: "8px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" }, children: [entries.map((e, i) => (_jsxs("div", { style: { padding: "2px 0", color: e.level === "error" ? "#f87171" : e.level === "warn" ? "#fbbf24" : "inherit", opacity: e.level === "debug" ? 0.6 : 1 }, children: [_jsx("span", { style: { opacity: 0.4, marginRight: "8px" }, children: new Date(e.timestamp).toLocaleTimeString() }), e.message] }, i))), loading && _jsx("div", { style: { opacity: 0.5 }, children: "Loading..." })] })));
const DataTable = sdkComponent("DataTable", ({ columns, rows, loading, emptyMessage }) => (_jsxs("div", { style: { border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", overflow: "hidden" }, children: [_jsxs("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: "13px" }, children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((c) => _jsx("th", { style: { padding: "8px 12px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", opacity: 0.6, fontWeight: 600, textTransform: "uppercase", width: c.width }, children: c.header }, c.key)) }) }), _jsx("tbody", { children: rows.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length, style: { padding: "24px", textAlign: "center", opacity: 0.4 }, children: emptyMessage || "No data" }) })) : rows.map((row, i) => (_jsx("tr", { style: { borderBottom: "1px solid rgba(255,255,255,0.05)" }, children: columns.map((c) => _jsx("td", { style: { padding: "8px 12px" }, children: c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "") }, c.key)) }, row.id || i))) })] }), loading && _jsx("div", { style: { padding: "8px", textAlign: "center", opacity: 0.5 }, children: "Loading..." })] })));
const KeyValueList = sdkComponent("KeyValueList", ({ pairs }) => (_jsx("div", { style: { display: "grid", gap: "4px", fontSize: "13px" }, children: pairs.map((p, i) => (_jsxs("div", { style: { display: "flex", gap: "12px" }, children: [_jsx("span", { style: { opacity: 0.5, minWidth: "100px", flexShrink: 0 }, children: p.label }), _jsx("span", { children: p.value })] }, i))) })));
const ActionBar = sdkComponent("ActionBar", ({ actions, onSuccess, onError }) => {
    const act = usePluginAction;
    return (_jsx("div", { style: { display: "flex", gap: "8px" }, children: actions.map((a) => {
            const colors = { primary: "rgba(99,102,241,0.2)", destructive: "rgba(239,68,68,0.2)", default: "rgba(255,255,255,0.1)" };
            return (_jsx("button", { onClick: async () => {
                    try {
                        const fn = act(a.actionKey);
                        const r = await fn(a.params || {});
                        onSuccess?.(a.actionKey, r);
                    }
                    catch (e) {
                        onError?.(a.actionKey, e);
                    }
                }, style: { padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", background: colors[a.variant || "default"], color: "inherit" }, children: a.label }, a.actionKey + a.label));
        }) }));
});
const MarkdownBlock = sdkComponent("MarkdownBlock", ({ content }) => (_jsx("pre", { style: { fontSize: "13px", lineHeight: "1.5", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, maxHeight: "300px", overflow: "auto" }, children: content })));
const Spinner = sdkComponent("Spinner", ({ label }) => (_jsx("div", { style: { padding: "24px", textAlign: "center", opacity: 0.6 }, children: label || "Loading..." })));
const ErrorBoundary = sdkComponent("ErrorBoundary", ({ children }) => _jsx(_Fragment, { children: children }));
// =============================================================================
// Status mapping to native StatusBadge variants
// =============================================================================
function statusVariant(status) {
    switch (status) {
        case "complete":
        case "merged":
        case "approve":
        case "pass": return "ok";
        case "building":
        case "reviewing":
        case "advancing":
        case "dispatched":
        case "planning": return "info";
        case "needs-review":
        case "concerns":
        case "request-changes":
        case "warning": return "warning";
        case "failed":
        case "block":
        case "reject": return "error";
        default: return "pending";
    }
}
// =============================================================================
// Lightweight form primitives (SDK has no form components)
// =============================================================================
function FormField({ label, children }) {
    return (_jsxs("div", { style: { display: "grid", gap: "4px" }, children: [_jsx("label", { style: { fontSize: "12px", fontWeight: 500, opacity: 0.7 }, children: label }), children] }));
}
function TextInput({ value, onChange, placeholder, type = "text" }) {
    return (_jsx("input", { type: type, value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, style: {
            width: "100%", padding: "8px 10px", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "6px", fontSize: "13px", boxSizing: "border-box",
            background: "rgba(0,0,0,0.2)", color: "inherit",
        } }));
}
function TextAreaInput({ value, onChange, placeholder, rows = 3 }) {
    return (_jsx("textarea", { value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, rows: rows, style: {
            width: "100%", padding: "8px 10px", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "6px", fontSize: "13px", boxSizing: "border-box",
            background: "rgba(0,0,0,0.2)", color: "inherit", resize: "vertical", fontFamily: "monospace",
        } }));
}
function SelectInput({ value, onChange, options }) {
    return (_jsx("select", { value: value, onChange: (e) => onChange(e.target.value), style: {
            width: "100%", padding: "8px 10px", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "6px", fontSize: "13px", boxSizing: "border-box",
            background: "rgba(0,0,0,0.2)", color: "inherit",
        }, children: options.map((o) => _jsx("option", { value: o.value, children: o.label }, o.value)) }));
}
// =============================================================================
// Create Project Form
// =============================================================================
function CreateProjectForm({ onSubmit, onCancel }) {
    const [name, setName] = useState("");
    const [prdText, setPrdText] = useState("");
    const [priority, setPriority] = useState("P2");
    const [repoUrl, setRepoUrl] = useState("");
    const [reviewDir, setReviewDir] = useState("");
    const [fileName, setFileName] = useState(null);
    const [showAddRepo, setShowAddRepo] = useState(false);
    const [newRepoName, setNewRepoName] = useState("");
    const [newRepoUrl, setNewRepoUrl] = useState("");
    const [newRepoDir, setNewRepoDir] = useState("");
    const { data: savedRepos, refresh: refreshRepos } = usePluginData("saved-repos", {});
    const saveRepoAction = usePluginAction("save-repo");
    const deleteRepoAction = usePluginAction("delete-repo");
    const repos = savedRepos || [];
    const handleSelectRepo = (repoId) => {
        if (repoId === "__add__") {
            setShowAddRepo(true);
            return;
        }
        const repo = repos.find(r => r.id === repoId);
        if (repo) {
            setRepoUrl(repo.repoUrl);
            setReviewDir(repo.defaultReviewDir);
        }
    };
    const handleSaveNewRepo = async () => {
        if (!newRepoName || !newRepoUrl)
            return;
        await saveRepoAction({ name: newRepoName, repoUrl: newRepoUrl, defaultReviewDir: newRepoDir });
        setRepoUrl(newRepoUrl);
        setReviewDir(newRepoDir);
        setShowAddRepo(false);
        setNewRepoName("");
        setNewRepoUrl("");
        setNewRepoDir("");
        refreshRepos();
    };
    const handleDeleteRepo = async (repoId) => {
        await deleteRepoAction({ repoId });
        refreshRepos();
    };
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
        if (!name.trim()) {
            const baseName = file.name.replace(/\.(md|txt|markdown|rst|prd)$/i, "").replace(/[-_]/g, " ");
            setName(baseName);
        }
    };
    return (_jsxs("div", { style: { display: "grid", gap: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", marginBottom: "16px" }, children: [_jsx("div", { style: { fontSize: "16px", fontWeight: 600 }, children: "New Project" }), _jsx(FormField, { label: "Project Name", children: _jsx(TextInput, { value: name, onChange: setName, placeholder: "e.g. IAML Website Redesign" }) }), _jsx(FormField, { label: "Priority", children: _jsx(SelectInput, { value: priority, onChange: (v) => setPriority(v), options: [
                        { value: "P0", label: "P0 — Critical" },
                        { value: "P1", label: "P1 — High" },
                        { value: "P2", label: "P2 — Medium" },
                        { value: "P3", label: "P3 — Low" },
                    ] }) }), _jsx(FormField, { label: "Repository", children: repos.length > 0 ? (_jsxs("div", { style: { display: "grid", gap: "8px" }, children: [_jsx(SelectInput, { value: "", onChange: handleSelectRepo, options: [
                                { value: "", label: "Select a saved repo..." },
                                ...repos.map(r => ({ value: r.id, label: `${r.name} (${r.repoUrl})` })),
                                { value: "__add__", label: "+ Add new repo" },
                            ] }), repoUrl && (_jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }, children: [_jsx(TextInput, { value: repoUrl, onChange: setRepoUrl, placeholder: "owner/repo" }), _jsx(TextInput, { value: reviewDir, onChange: setReviewDir, placeholder: "Review directory" })] }))] })) : (_jsxs("div", { style: { display: "grid", gap: "8px" }, children: [_jsx("div", { style: { fontSize: "12px", opacity: 0.6 }, children: "No saved repos. Add one or enter manually:" }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }, children: [_jsx(TextInput, { value: repoUrl, onChange: setRepoUrl, placeholder: "owner/repo-name" }), _jsx(TextInput, { value: reviewDir, onChange: setReviewDir, placeholder: "Review directory (e.g. src/)" })] }), _jsx("button", { onClick: () => setShowAddRepo(true), style: { fontSize: "12px", background: "none", border: "none", color: "inherit", opacity: 0.6, cursor: "pointer", textAlign: "left", padding: 0 }, children: "+ Save this repo for future use" })] })) }), showAddRepo && (_jsxs("div", { style: { display: "grid", gap: "8px", padding: "12px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" }, children: [_jsx("div", { style: { fontSize: "13px", fontWeight: 500 }, children: "Save New Repo" }), _jsx(FormField, { label: "Display Name", children: _jsx(TextInput, { value: newRepoName, onChange: setNewRepoName, placeholder: "e.g. PopeBot Workspace" }) }), _jsx(FormField, { label: "GitHub Repo (owner/name)", children: _jsx(TextInput, { value: newRepoUrl, onChange: setNewRepoUrl, placeholder: "mikejackson-IAML/popebot-workspace" }) }), _jsx(FormField, { label: "Default Review Directory", children: _jsx(TextInput, { value: newRepoDir, onChange: setNewRepoDir, placeholder: "plugins/dev-department" }) }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx("button", { onClick: handleSaveNewRepo, style: { padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", background: "rgba(255,255,255,0.1)", color: "inherit" }, children: "Save Repo" }), _jsx("button", { onClick: () => setShowAddRepo(false), style: { padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", background: "none", color: "inherit", opacity: 0.6 }, children: "Cancel" })] })] })), repos.length > 0 && (_jsxs("details", { style: { fontSize: "12px", opacity: 0.6 }, children: [_jsxs("summary", { style: { cursor: "pointer" }, children: ["Manage saved repos (", repos.length, ")"] }), _jsx("div", { style: { marginTop: "8px", display: "grid", gap: "4px" }, children: repos.map(r => (_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }, children: [_jsxs("span", { children: [r.name, " \u2014 ", r.repoUrl, " (", r.defaultReviewDir || "root", ")"] }), _jsx("button", { onClick: () => handleDeleteRepo(r.id), style: { background: "none", border: "none", color: "inherit", cursor: "pointer", opacity: 0.5, fontSize: "11px" }, children: "remove" })] }, r.id))) })] })), _jsxs(FormField, { label: "PRD", children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }, children: [_jsxs("label", { style: { padding: "6px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.2)" }, children: ["Upload File", _jsx("input", { type: "file", accept: ".md,.txt,.markdown,.rst,.prd", onChange: handleFileUpload, style: { display: "none" } })] }), fileName && _jsx("span", { style: { fontSize: "12px", opacity: 0.6 }, children: fileName })] }), _jsx(TextAreaInput, { value: prdText, onChange: setPrdText, placeholder: "Paste your PRD here, or upload a file above...", rows: 12 })] }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx("button", { onClick: () => onSubmit({ name, prdText, priority, repoUrl: repoUrl || "mikejackson-IAML/popebot-workspace", reviewDir: reviewDir || "." }), disabled: !name.trim(), style: { padding: "8px 16px", borderRadius: "6px", border: "none", cursor: name.trim() ? "pointer" : "not-allowed", fontSize: "13px", fontWeight: 500, background: "rgba(255,255,255,0.1)", color: "inherit", opacity: name.trim() ? 1 : 0.4 }, children: "Create Project" }), _jsx("button", { onClick: onCancel, style: { padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", background: "none", color: "inherit", opacity: 0.6 }, children: "Cancel" })] })] }));
}
// =============================================================================
// Project Detail View
// =============================================================================
function ProjectDetailView({ projectId, parentProjectId, onBack }) {
    const [pollTick, setPollTick] = useState(0);
    const [pendingPoll, setPendingPoll] = useState(false);
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
        parentProjectId, projectId,
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
    const retryPipelineAction = usePluginAction("retry-pipeline");
    const toast = usePluginToast();
    const { data: apiKeyStatus, refresh: refreshApiKey } = usePluginData("api-key-status", {});
    const { data: rtxKeyStatus, refresh: refreshRtxKey } = usePluginData("rtx-key-status", {});
    const { data: progressData } = usePluginData("progress-log", { parentProjectId, projectId });
    const { data: pipelineEvents } = usePluginData("pipeline-events", { parentProjectId, projectId, _tick: pollTick });
    const { data: phaseReport } = usePluginData("phase-report", { parentProjectId, projectId });
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPrd, setEditPrd] = useState("");
    const [editPriority, setEditPriority] = useState("P2");
    const [actionError, setActionError] = useState(null);
    const [decomposing, setDecomposing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState("");
    const [rtxKeyInput, setRtxKeyInput] = useState("");
    const [pipelineStarting, setPipelineStarting] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [advancing, setAdvancing] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [expandedJobId, setExpandedJobId] = useState(null);
    if (loading)
        return _jsx(Spinner, { label: "Loading project..." });
    if (error)
        return _jsx(StatusBadge, { label: error.message, status: "error" });
    if (!data)
        return _jsx(StatusBadge, { label: "Project not found", status: "error" });
    const { project, jobs, pipeline, reviews, usage } = data;
    const totalCost = usage.reduce((sum, u) => sum + u.estimatedCostUsd, 0);
    const isActive = project.status === "building" || project.status === "reviewing" || project.status === "advancing";
    const needsReview = project.status === "needs-review";
    const canDecompose = project.prdText && (project.status === "draft" || project.status === "failed");
    const canStartPipeline = project.status === "ready" && jobs.length > 0;
    const isPipelineRunning = project.status === "building" || project.status === "reviewing";
    const isAdvancing = project.status === "advancing";
    const canAdvance = project.status === "complete" && !phaseReport;
    if (needsReview) {
        toast({ dedupeKey: `review-${projectId}`, title: "Review needed", body: `"${project.name}" — approve or reject.`, tone: "warn", ttlMs: 10000 });
    }
    if (isActive && !pendingPoll) {
        scheduleNextTick();
    }
    // ── Handlers ──
    const startEditing = () => { setEditName(project.name); setEditPrd(project.prdText); setEditPriority(project.priority); setEditing(true); };
    const handleSave = async () => {
        try {
            setActionError(null);
            await updateProject({ parentProjectId, projectId, updates: { name: editName, prdText: editPrd, priority: editPriority } });
            setEditing(false);
            refresh();
        }
        catch (err) {
            setActionError(err.message);
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
            setActionError(err.message);
        }
    };
    const handleDecompose = async () => {
        if (!apiKeyStatus?.configured) {
            setShowSettings(true);
            setActionError("Configure your Anthropic API key first.");
            return;
        }
        try {
            setActionError(null);
            setDecomposing(true);
            await decomposePrdAction({ parentProjectId, projectId });
        }
        catch (err) {
            setActionError(err.message);
            setDecomposing(false);
        }
    };
    const handleStartPipeline = async () => {
        if (!rtxKeyStatus?.configured) {
            setShowSettings(true);
            setActionError("Configure your RTX Pipeline Key first.");
            return;
        }
        try {
            setActionError(null);
            setPipelineStarting(true);
            await startPipelineAction({ parentProjectId, projectId });
            refresh();
        }
        catch (err) {
            setActionError(err.message);
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
            setActionError(err.message);
        }
        finally {
            setCancelling(false);
        }
    };
    const handleRetry = async () => {
        try {
            setActionError(null);
            await retryPipelineAction({ parentProjectId, projectId });
            refresh();
        }
        catch (err) {
            setActionError(err.message);
        }
    };
    const handleToggleAutoAdvance = async () => {
        try {
            setActionError(null);
            await toggleAutoAdvanceAction({ parentProjectId, projectId });
            refresh();
        }
        catch (err) {
            setActionError(err.message);
        }
    };
    const handleAdvance = async () => {
        try {
            setActionError(null);
            setAdvancing(true);
            await advanceProjectAction({ parentProjectId, projectId, phaseScope: `Phase ${project.phaseNumber || 1}` });
            refresh();
        }
        catch (err) {
            setActionError(err.message);
        }
        finally {
            setAdvancing(false);
        }
    };
    const handleApprove = async () => {
        try {
            setActionError(null);
            await approvePhaseAction({ parentProjectId, projectId });
            toast({ title: "Phase approved", body: project.autoAdvance ? "Auto-advancing..." : "Complete.", tone: "success", ttlMs: 5000 });
            refresh();
        }
        catch (err) {
            setActionError(err.message);
        }
    };
    const handleReject = async () => {
        try {
            setActionError(null);
            await rejectPhaseAction({ parentProjectId, projectId, reason: rejectReason || "Rejected by reviewer" });
            setShowRejectForm(false);
            setRejectReason("");
            toast({ title: "Phase rejected", body: rejectReason || "Rejected", tone: "error", ttlMs: 5000 });
            refresh();
        }
        catch (err) {
            setActionError(err.message);
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
            setActionError(err.message);
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
            setActionError(err.message);
        }
    };
    const handleUpdateJob = async (jobId, updates) => {
        try {
            setActionError(null);
            await updateJobAction({ parentProjectId, projectId, jobId, updates });
            refresh();
        }
        catch (err) {
            setActionError(err.message);
        }
    };
    // ── Pipeline events as LogView entries ──
    const logEntries = (pipelineEvents || []).map(evt => ({
        timestamp: evt.timestamp,
        level: evt.type.includes("failed") ? "error"
            : evt.type.includes("complete") ? "info"
                : evt.type.includes("started") ? "info"
                    : "debug",
        message: evt.message,
    }));
    // ── Progress log as LogView entries ──
    const progressEntries = (progressData || []).map(p => ({
        timestamp: p.timestamp, level: "info", message: p.message,
    }));
    // ── Build action bar items ──
    const actionItems = [];
    if (canDecompose) {
        actionItems.push({ label: decomposing ? "Analyzing..." : "Analyze PRD", actionKey: "decompose-prd", params: { parentProjectId, projectId }, variant: "primary" });
    }
    if (canStartPipeline && !isPipelineRunning) {
        actionItems.push({ label: pipelineStarting ? "Starting..." : "Start Build", actionKey: "start-pipeline", params: { parentProjectId, projectId }, variant: "primary" });
    }
    if (isPipelineRunning) {
        actionItems.push({ label: cancelling ? "Cancelling..." : "Cancel Pipeline", actionKey: "cancel-pipeline", params: { parentProjectId, projectId }, variant: "destructive" });
    }
    // ── Step label ──
    const stepLabel = (() => {
        if (!pipeline)
            return "";
        const steps = ["build", "review", "fix", "done"];
        const labels = { build: "Building code", review: "Running reviews", fix: "Applying fixes", advance: "Advancing phase", done: "Complete" };
        const current = pipeline.currentStep || "build";
        const stepNum = steps.indexOf(current) + 1 || 1;
        return `Step ${stepNum}/${steps.length}: ${labels[current] || current}`;
    })();
    return (_jsx(ErrorBoundary, { children: _jsxs("div", { style: { display: "grid", gap: "16px" }, children: [actionError && _jsx(StatusBadge, { label: actionError, status: "error" }), needsReview && (_jsxs("div", { style: { display: "grid", gap: "12px", padding: "16px", border: "2px solid orange", borderRadius: "8px" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx(StatusBadge, { label: "Review Required", status: "warning" }), _jsx(StatusBadge, { label: `Phase ${project.phaseNumber || 1}`, status: "info" })] }), _jsxs("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" }, children: [_jsx(MetricCard, { label: "Build Jobs", value: jobs.length }), _jsx(MetricCard, { label: "Reviews", value: reviews.length }), _jsx(MetricCard, { label: "Cost", value: `$${totalCost.toFixed(4)}` })] }), reviews.length > 0 && (_jsx("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" }, children: ["haiku", "deepseek", "codex"].map(tier => {
                                const latest = reviews.filter(r => r.tier === tier).pop();
                                if (!latest)
                                    return null;
                                return _jsx(StatusBadge, { label: `${tier}: ${latest.verdict}`, status: statusVariant(latest.verdict) }, tier);
                            }) })), pipeline?.completedAt && pipeline?.startedAt && (_jsx(KeyValueList, { pairs: [{
                                    label: "Pipeline duration",
                                    value: (() => {
                                        const ms = new Date(pipeline.completedAt).getTime() - new Date(pipeline.startedAt).getTime();
                                        const mins = Math.floor(ms / 60000);
                                        return mins > 0 ? `${mins}m ${Math.floor((ms % 60000) / 1000)}s` : `${Math.floor(ms / 1000)}s`;
                                    })(),
                                }] })), project.autoAdvance && (_jsx(StatusBadge, { label: `Auto-advance ON — will generate Phase ${(project.phaseNumber || 1) + 1}`, status: "info" })), !showRejectForm ? (_jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsxs("button", { onClick: handleApprove, style: { flex: 1, padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, background: "rgba(34,197,94,0.2)", color: "#4ade80" }, children: ["Approve Phase ", project.phaseNumber || 1] }), _jsx("button", { onClick: () => setShowRejectForm(true), style: { flex: 1, padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, background: "rgba(239,68,68,0.2)", color: "#f87171" }, children: "Reject" })] })) : (_jsxs("div", { style: { display: "grid", gap: "8px" }, children: [_jsx(FormField, { label: "Rejection reason", children: _jsx(TextAreaInput, { value: rejectReason, onChange: setRejectReason, placeholder: "What needs to change?", rows: 3 }) }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx("button", { onClick: handleReject, style: { padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", background: "rgba(239,68,68,0.2)", color: "#f87171" }, children: "Confirm Reject" }), _jsx("button", { onClick: () => { setShowRejectForm(false); setRejectReason(""); }, style: { padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", background: "none", color: "inherit", opacity: 0.6 }, children: "Cancel" })] })] }))] })), showSettings && (_jsxs("div", { style: { display: "grid", gap: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }, children: [_jsx("div", { style: { fontSize: "14px", fontWeight: 600 }, children: "Settings" }), _jsx(FormField, { label: `Anthropic API Key ${apiKeyStatus?.configured ? "(configured)" : ""}`, children: _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx(TextInput, { value: apiKeyInput, onChange: setApiKeyInput, placeholder: "sk-ant-...", type: "password" }), _jsx("button", { onClick: handleSaveApiKey, disabled: !apiKeyInput.trim(), style: { padding: "8px 12px", borderRadius: "6px", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.1)", color: "inherit", opacity: apiKeyInput.trim() ? 1 : 0.4 }, children: "Save" })] }) }), _jsx(FormField, { label: `RTX Pipeline Key ${rtxKeyStatus?.configured ? "(configured)" : ""}`, children: _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx(TextInput, { value: rtxKeyInput, onChange: setRtxKeyInput, placeholder: "API key from RTX", type: "password" }), _jsx("button", { onClick: handleSaveRtxKey, disabled: !rtxKeyInput.trim(), style: { padding: "8px 12px", borderRadius: "6px", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.1)", color: "inherit", opacity: rtxKeyInput.trim() ? 1 : 0.4 }, children: "Save" })] }) }), _jsx("button", { onClick: () => setShowSettings(false), style: { padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", background: "none", color: "inherit", opacity: 0.6, justifySelf: "end" }, children: "Close" })] })), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }, children: [_jsx("button", { onClick: onBack, style: { background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.6, fontSize: "13px" }, children: "\u2190 Back" }), _jsx("span", { style: { fontSize: "18px", fontWeight: 600, flex: 1 }, children: project.name }), _jsx(StatusBadge, { label: project.priority, status: "info" }), _jsx(StatusBadge, { label: project.status, status: statusVariant(project.status) }), _jsx(StatusBadge, { label: `Phase ${project.phaseNumber || 1}`, status: "info" })] }), _jsx("div", { style: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }, children: !editing && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: startEditing, style: { padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", fontSize: "12px", background: "rgba(0,0,0,0.2)", color: "inherit" }, children: "Edit" }), _jsx("button", { onClick: handleDelete, style: { padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: "12px", background: "rgba(239,68,68,0.1)", color: "#f87171" }, children: "Delete" }), project.status === "failed" && jobs.length > 0 && (_jsx("button", { onClick: handleRetry, style: { padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(245,158,11,0.3)", cursor: "pointer", fontSize: "12px", background: "rgba(245,158,11,0.1)", color: "#fbbf24" }, children: "Retry Pipeline" })), canAdvance && (_jsx("button", { onClick: handleAdvance, disabled: advancing, style: { padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(124,58,237,0.3)", cursor: "pointer", fontSize: "12px", background: "rgba(124,58,237,0.1)", color: "#c4b5fd" }, children: advancing ? "Advancing..." : `Advance to Phase ${(project.phaseNumber || 1) + 1}` })), _jsxs("div", { onClick: handleToggleAutoAdvance, style: { display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)" }, children: [_jsx("div", { style: { width: "28px", height: "14px", borderRadius: "7px", background: project.autoAdvance ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.15)", position: "relative" }, children: _jsx("div", { style: { width: "10px", height: "10px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px", left: project.autoAdvance ? "16px" : "2px", transition: "left 0.2s" } }) }), _jsx("span", { style: { fontSize: "11px", opacity: 0.7 }, children: "Auto-advance" })] }), _jsx("button", { onClick: () => setShowSettings(true), style: { padding: "6px 8px", borderRadius: "6px", border: "none", cursor: "pointer", background: "none", color: "inherit", opacity: 0.5, fontSize: "12px" }, children: "\u2699" })] })) }), editing && (_jsxs("div", { style: { display: "grid", gap: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }, children: [_jsx(FormField, { label: "Name", children: _jsx(TextInput, { value: editName, onChange: setEditName }) }), _jsx(FormField, { label: "Priority", children: _jsx(SelectInput, { value: editPriority, onChange: (v) => setEditPriority(v), options: [
                                    { value: "P0", label: "P0 — Critical" }, { value: "P1", label: "P1 — High" },
                                    { value: "P2", label: "P2 — Medium" }, { value: "P3", label: "P3 — Low" },
                                ] }) }), _jsx(FormField, { label: "PRD", children: _jsx(TextAreaInput, { value: editPrd, onChange: setEditPrd, rows: 10 }) }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx("button", { onClick: handleSave, style: { padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", background: "rgba(255,255,255,0.1)", color: "inherit" }, children: "Save" }), _jsx("button", { onClick: () => setEditing(false), style: { padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", background: "none", color: "inherit", opacity: 0.6 }, children: "Cancel" })] })] })), !editing && (_jsxs(_Fragment, { children: [_jsx(KeyValueList, { pairs: [
                                { label: "Repo", value: project.repoUrl || "Not set" },
                                { label: "Review Dir", value: project.reviewDir || "Not set" },
                                ...(project.decompositionSummary ? [{ label: "Summary", value: project.decompositionSummary }] : []),
                            ] }), project.prdText && _jsx(MarkdownBlock, { content: project.prdText })] })), progressEntries.length > 0 && (_jsx(LogView, { entries: progressEntries, maxHeight: "150px", autoScroll: true })), actionItems.length > 0 && (_jsx(ActionBar, { actions: actionItems, onSuccess: () => refresh(), onError: (_, err) => setActionError(String(err)) })), _jsxs("div", { children: [_jsxs("div", { style: { fontSize: "13px", fontWeight: 600, opacity: 0.6, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }, children: ["Build Jobs ", jobs.length > 0 && `(${jobs.length})`] }), jobs.length === 0 ? (_jsx("div", { style: { padding: "24px", textAlign: "center", opacity: 0.4, border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "8px" }, children: project.prdText ? 'Click "Analyze PRD" to decompose into build jobs.' : "Add a PRD first." })) : (_jsx(DataTable, { columns: [
                                { key: "name", header: "Job", width: "40%", render: (_v, row) => (_jsx("span", { style: { cursor: "pointer" }, onClick: () => setExpandedJobId(expandedJobId === row.id ? null : row.id), children: row.name })) },
                                { key: "targetFiles", header: "Files", render: (v) => v?.join(", ") || "—" },
                                { key: "jobType", header: "Type", width: "80px" },
                                { key: "status", header: "Status", width: "100px", render: (v) => _jsx(StatusBadge, { label: v, status: statusVariant(v) }) },
                                { key: "prUrl", header: "PR", width: "60px", render: (v) => v ? _jsx("a", { href: v, target: "_blank", rel: "noopener noreferrer", style: { color: "inherit", opacity: 0.7 }, children: "View" }) : "—" },
                            ], rows: jobs, emptyMessage: "No jobs" })), expandedJobId && (() => {
                            const job = jobs.find(j => j.id === expandedJobId);
                            if (!job)
                                return null;
                            return (_jsxs("div", { style: { padding: "12px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", marginTop: "8px" }, children: [_jsx("div", { style: { fontSize: "13px", fontWeight: 600, marginBottom: "8px" }, children: job.name }), _jsx(MarkdownBlock, { content: job.description }), _jsx(KeyValueList, { pairs: [
                                            { label: "Files", value: job.targetFiles.join(", ") },
                                            { label: "Dependencies", value: job.dependencies.join(", ") || "None" },
                                            { label: "Type", value: job.jobType },
                                        ] })] }));
                        })()] }), totalCost > 0 && (_jsx(MetricCard, { label: "Total LLM Cost", value: `$${totalCost.toFixed(4)}` })), _jsxs("div", { children: [_jsx("div", { style: { fontSize: "13px", fontWeight: 600, opacity: 0.6, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }, children: "Pipeline" }), pipeline ? (_jsxs("div", { style: { display: "grid", gap: "8px" }, children: [_jsxs("div", { style: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }, children: [_jsx(StatusBadge, { label: pipeline.status, status: statusVariant(pipeline.status) }), _jsx("span", { style: { fontSize: "12px", opacity: 0.6 }, children: stepLabel }), pipeline.rtxPipelineId && _jsxs("span", { style: { fontSize: "11px", opacity: 0.4 }, children: ["RTX: ", pipeline.rtxPipelineId.slice(0, 8), "..."] })] }), _jsx(KeyValueList, { pairs: [
                                        { label: "Started", value: new Date(pipeline.startedAt).toLocaleString() },
                                        ...(pipeline.completedAt ? [{ label: "Completed", value: new Date(pipeline.completedAt).toLocaleString() }] : []),
                                    ] })] })) : (_jsx("div", { style: { padding: "24px", textAlign: "center", opacity: 0.4, border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "8px" }, children: canStartPipeline ? `${jobs.length} jobs ready. Click "Start Build".` : "Decompose a PRD first." }))] }), logEntries.length > 0 && (_jsx(LogView, { entries: logEntries, maxHeight: "250px", autoScroll: true, loading: isPipelineRunning })), isAdvancing && _jsx(StatusBadge, { label: `Advancing to Phase ${(project.phaseNumber || 1) + 1}...`, status: "info" }), phaseReport && (_jsxs("div", { style: { display: "grid", gap: "8px" }, children: [_jsxs("div", { style: { fontSize: "13px", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.5px" }, children: ["Phase ", phaseReport.phaseNumber, " Report"] }), _jsx(KeyValueList, { pairs: [
                                { label: "Transition", value: `Phase ${phaseReport.phaseNumber} → ${phaseReport.nextPhase}` },
                                { label: "Generated", value: new Date(phaseReport.createdAt).toLocaleString() },
                                ...(phaseReport.nextProjectId ? [{ label: "Next project", value: phaseReport.nextProjectId.slice(0, 8) + "..." }] : []),
                            ] }), phaseReport.report && (_jsxs("details", { children: [_jsxs("summary", { style: { cursor: "pointer", fontSize: "12px", opacity: 0.6 }, children: ["Completion Report (", phaseReport.report.length, " chars)"] }), _jsx(MarkdownBlock, { content: phaseReport.report })] })), phaseReport.nextPrd && (_jsxs("details", { children: [_jsxs("summary", { style: { cursor: "pointer", fontSize: "12px", opacity: 0.6 }, children: ["Next Phase PRD (", phaseReport.nextPrd.length, " chars)"] }), _jsx(MarkdownBlock, { content: phaseReport.nextPrd })] }))] })), reviews.length > 0 && (_jsxs("div", { children: [_jsxs("div", { style: { fontSize: "13px", fontWeight: 600, opacity: 0.6, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }, children: ["Review Tiers (", reviews.length, " results)"] }), _jsx(DataTable, { columns: [
                                { key: "round", header: "Round", width: "60px" },
                                { key: "tier", header: "Tier", render: (v) => _jsx(StatusBadge, { label: v, status: "info" }) },
                                { key: "verdict", header: "Verdict", render: (v) => _jsx(StatusBadge, { label: v, status: statusVariant(v) }) },
                                { key: "createdAt", header: "Time", render: (v) => new Date(v).toLocaleTimeString() },
                            ], rows: reviews })] }))] }) }));
}
// =============================================================================
// Projects List View
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
    if (!parentProjectId)
        return _jsx("div", { style: { padding: "24px", opacity: 0.6 }, children: "Open a project to see its automation." });
    if (selectedProjectId) {
        return (_jsx("div", { style: { padding: "24px" }, children: _jsx(ProjectDetailView, { projectId: selectedProjectId, parentProjectId: parentProjectId, onBack: () => { setSelectedProjectId(null); refresh(); } }) }));
    }
    const handleCreate = async (data) => {
        try {
            setActionError(null);
            const result = await createProjectAction({
                parentProjectId, name: data.name, prdText: data.prdText,
                priority: data.priority, repoUrl: data.repoUrl, reviewDir: data.reviewDir,
            });
            setShowCreate(false);
            setSelectedProjectId(result.id);
            refresh();
        }
        catch (err) {
            setActionError(err.message);
        }
    };
    return (_jsxs("div", { style: { padding: "24px" }, children: [actionError && _jsx(StatusBadge, { label: actionError, status: "error" }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [_jsx("span", { style: { fontSize: "20px", fontWeight: 700 }, children: "Projects" }), _jsx("button", { onClick: () => setShowCreate(true), style: { padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", background: "rgba(255,255,255,0.1)", color: "inherit" }, children: "+ New Project" })] }), showCreate && _jsx(CreateProjectForm, { onSubmit: handleCreate, onCancel: () => setShowCreate(false) }), loading && _jsx(Spinner, { label: "Loading projects..." }), error && _jsx(StatusBadge, { label: error.message, status: "error" }), projects && projects.length === 0 && !showCreate ? (_jsxs("div", { style: { padding: "48px", textAlign: "center", opacity: 0.4, border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "8px" }, children: [_jsx("div", { style: { marginBottom: "8px", fontWeight: 600 }, children: "No projects yet" }), _jsx("div", { children: "Click \"+ New Project\" to create one." })] })) : (_jsx(DataTable, { columns: [
                    { key: "name", header: "Project", render: (_v, row) => (_jsx("span", { style: { cursor: "pointer", fontWeight: 500 }, onClick: () => setSelectedProjectId(row.id), children: row.name })) },
                    { key: "priority", header: "Priority", width: "80px", render: (v) => _jsx(StatusBadge, { label: v, status: "info" }) },
                    { key: "status", header: "Status", width: "120px", render: (v) => _jsx(StatusBadge, { label: v, status: statusVariant(v) }) },
                    { key: "phaseNumber", header: "Phase", width: "60px", render: (v) => `${v || 1}` },
                ], rows: (projects || []), emptyMessage: "No projects" }))] }));
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
    return (_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", fontSize: "14px", fontWeight: 500 }, children: [_jsx("span", { children: "Automation" }), reviewCount > 0 && (_jsx(StatusBadge, { label: `${reviewCount} review${reviewCount > 1 ? "s" : ""}`, status: "warning" }))] }));
}
export function ProjectsTab({ context }) {
    return (_jsx(ErrorBoundary, { children: _jsx(ProjectsView, {}) }));
}
//# sourceMappingURL=index.js.map