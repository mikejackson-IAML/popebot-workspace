import { useState } from "react";
import type {
  PluginProjectSidebarItemProps,
  PluginDetailTabProps,
} from "@paperclipai/plugin-sdk/ui";
import {
  usePluginData,
  usePluginAction,
  useHostContext,
  usePluginToast,
} from "@paperclipai/plugin-sdk/ui";
// SDK shared components (StatusBadge, DataTable, etc.) are declared in the SDK
// but not wired into package exports. We access them via the internal runtime
// module. If they fail to load, we fall back to simple HTML equivalents.
let _getSdkUi: ((name: string) => any) | null = null;
try {
  // Dynamic import of the runtime accessor — works in Paperclip's module host
  const runtime = require("@paperclipai/plugin-sdk/dist/ui/runtime");
  _getSdkUi = runtime.getSdkUiRuntimeValue;
} catch { /* not available — fallbacks will be used */ }

function sdkComponent<P>(name: string, fallback: React.FC<P>): React.FC<P> {
  if (_getSdkUi) {
    try { const c = _getSdkUi(name); if (c) return c as React.FC<P>; } catch {}
  }
  return fallback;
}

// Fallback implementations that blend with host theme
const StatusBadge = sdkComponent<{ label: string; status: string }>("StatusBadge", ({ label, status }) => {
  const colors: Record<string, string> = { ok: "#4ade80", warning: "#fbbf24", error: "#f87171", info: "#60a5fa", pending: "#94a3b8" };
  return <span style={{ padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: `${colors[status] || colors.pending}22`, color: colors[status] || colors.pending }}>{label}</span>;
});
const MetricCard = sdkComponent<{ label: string; value: string | number }>("MetricCard", ({ label, value }) => (
  <div style={{ padding: "12px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", textAlign: "center" }}>
    <div style={{ fontSize: "18px", fontWeight: 700 }}>{value}</div>
    <div style={{ fontSize: "11px", opacity: 0.5 }}>{label}</div>
  </div>
));
const LogView = sdkComponent<{ entries: LogViewEntry[]; maxHeight?: string; autoScroll?: boolean; loading?: boolean }>("LogView", ({ entries, maxHeight, loading }) => (
  <div style={{ maxHeight: maxHeight || "400px", overflow: "auto", fontFamily: "monospace", fontSize: "12px", padding: "8px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" }}>
    {entries.map((e, i) => (
      <div key={i} style={{ padding: "2px 0", color: e.level === "error" ? "#f87171" : e.level === "warn" ? "#fbbf24" : "inherit", opacity: e.level === "debug" ? 0.6 : 1 }}>
        <span style={{ opacity: 0.4, marginRight: "8px" }}>{new Date(e.timestamp).toLocaleTimeString()}</span>{e.message}
      </div>
    ))}
    {loading && <div style={{ opacity: 0.5 }}>Loading...</div>}
  </div>
));
const DataTable = sdkComponent<{ columns: any[]; rows: any[]; loading?: boolean; emptyMessage?: string }>("DataTable", ({ columns, rows, loading, emptyMessage }) => (
  <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", overflow: "hidden" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
      <thead><tr>{columns.map((c: any) => <th key={c.key} style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)", fontSize: "11px", opacity: 0.6, fontWeight: 600, textTransform: "uppercase", width: c.width }}>{c.header}</th>)}</tr></thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={columns.length} style={{ padding: "24px", textAlign: "center", opacity: 0.4 }}>{emptyMessage || "No data"}</td></tr>
        ) : rows.map((row: any, i: number) => (
          <tr key={row.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            {columns.map((c: any) => <td key={c.key} style={{ padding: "8px 12px" }}>{c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "")}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
    {loading && <div style={{ padding: "8px", textAlign: "center", opacity: 0.5 }}>Loading...</div>}
  </div>
));
const KeyValueList = sdkComponent<{ pairs: Array<{ label: string; value: React.ReactNode }> }>("KeyValueList", ({ pairs }) => (
  <div style={{ display: "grid", gap: "4px", fontSize: "13px" }}>
    {pairs.map((p, i) => (
      <div key={i} style={{ display: "flex", gap: "12px" }}>
        <span style={{ opacity: 0.5, minWidth: "100px", flexShrink: 0 }}>{p.label}</span>
        <span>{p.value}</span>
      </div>
    ))}
  </div>
));
const ActionBar = sdkComponent<{ actions: ActionBarItem[]; onSuccess?: (k: string, r: unknown) => void; onError?: (k: string, e: unknown) => void }>("ActionBar", ({ actions, onSuccess, onError }) => {
  const act = usePluginAction;
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {actions.map((a) => {
        const colors: Record<string, string> = { primary: "rgba(99,102,241,0.2)", destructive: "rgba(239,68,68,0.2)", default: "rgba(255,255,255,0.1)" };
        return (
          <button key={a.actionKey + a.label} onClick={async () => {
            try { const fn = act(a.actionKey); const r = await fn(a.params || {}); onSuccess?.(a.actionKey, r); }
            catch (e) { onError?.(a.actionKey, e); }
          }} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", background: colors[a.variant || "default"], color: "inherit" }}>
            {a.label}
          </button>
        );
      })}
    </div>
  );
});
const MarkdownBlock = sdkComponent<{ content: string }>("MarkdownBlock", ({ content }) => (
  <pre style={{ fontSize: "13px", lineHeight: "1.5", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, maxHeight: "300px", overflow: "auto" }}>{content}</pre>
));
const Spinner = sdkComponent<{ size?: string; label?: string }>("Spinner", ({ label }) => (
  <div style={{ padding: "24px", textAlign: "center", opacity: 0.6 }}>{label || "Loading..."}</div>
));
const ErrorBoundary = sdkComponent<{ children: React.ReactNode; fallback?: React.ReactNode }>("ErrorBoundary", ({ children }) => <>{children}</>);

type StatusBadgeVariant = "ok" | "warning" | "error" | "info" | "pending";
interface LogViewEntry { timestamp: string; level: "info" | "warn" | "error" | "debug"; message: string; meta?: Record<string, unknown>; }
interface ActionBarItem { label: string; actionKey: string; params?: Record<string, unknown>; variant?: "default" | "primary" | "destructive"; confirm?: boolean; confirmMessage?: string; }

// =============================================================================
// Types (mirror worker/types.ts)
// =============================================================================

type ProjectStatus = "draft" | "planning" | "ready" | "building" | "reviewing" | "needs-review" | "complete" | "failed" | "advancing";
type ProjectPriority = "P0" | "P1" | "P2" | "P3";

interface ManagedProject {
  id: string;
  parentProjectId: string;
  name: string;
  prdText: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  decompositionSummary: string;
  repoUrl: string;
  reviewDir: string;
  phaseNumber: number;
  autoAdvance: boolean;
  sourceProjectId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BuildJob {
  id: string;
  projectId: string;
  name: string;
  description: string;
  targetFiles: string[];
  dependencies: string[];
  jobType: string;
  status: string;
  popebotJobId: string | null;
  prUrl: string | null;
  dispatchedAt: string | null;
  completedAt: string | null;
}

interface LLMUsageRecord {
  id: string;
  model: string;
  purpose: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  timestamp: string;
}

interface PipelineRun {
  id: string;
  projectId: string;
  status: string;
  currentStep: string;
  reviewRound: number;
  maxReviewRounds: number;
  rtxPipelineId: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface PipelineEvent {
  type: string;
  projectId: string;
  pipelineRunId: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

type ReviewTier = "haiku" | "deepseek" | "codex";
type ReviewVerdict = "approve" | "request-changes" | "block" | "pass" | "concerns" | "reject" | "unknown";

interface ReviewResult {
  id: string;
  projectId: string;
  pipelineRunId: string;
  tier: ReviewTier;
  round: number;
  verdict: ReviewVerdict;
  summary: string;
  findings: string[];
  createdAt: string;
}

interface PhaseReport {
  projectId: string;
  phaseNumber: number;
  report: string;
  nextPrd: string;
  nextPhase: number;
  nextProjectId: string | null;
  createdAt: string;
}

interface ProjectDetail {
  project: ManagedProject;
  jobs: BuildJob[];
  pipeline: PipelineRun | null;
  reviews: ReviewResult[];
  usage: LLMUsageRecord[];
}

interface SavedRepo {
  id: string;
  name: string;
  repoUrl: string;
  defaultReviewDir: string;
}

// =============================================================================
// Status mapping to native StatusBadge variants
// =============================================================================

function statusVariant(status: string): StatusBadgeVariant {
  switch (status) {
    case "complete": case "merged": case "approve": case "pass": return "ok";
    case "building": case "reviewing": case "advancing": case "dispatched": case "planning": return "info";
    case "needs-review": case "concerns": case "request-changes": case "warning": return "warning";
    case "failed": case "block": case "reject": return "error";
    default: return "pending";
  }
}

// =============================================================================
// Lightweight form primitives (SDK has no form components)
// =============================================================================

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: "4px" }}>
      <label style={{ fontSize: "12px", fontWeight: 500, opacity: 0.7 }}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: "100%", padding: "8px 10px", border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "6px", fontSize: "13px", boxSizing: "border-box",
        background: "rgba(0,0,0,0.2)", color: "inherit",
      }}
    />
  );
}

function TextAreaInput({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{
        width: "100%", padding: "8px 10px", border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "6px", fontSize: "13px", boxSizing: "border-box",
        background: "rgba(0,0,0,0.2)", color: "inherit", resize: "vertical", fontFamily: "monospace",
      }}
    />
  );
}

function SelectInput({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value} onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "8px 10px", border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "6px", fontSize: "13px", boxSizing: "border-box",
        background: "rgba(0,0,0,0.2)", color: "inherit",
      }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// =============================================================================
// Create Project Form
// =============================================================================

function CreateProjectForm({ onSubmit, onCancel }: {
  onSubmit: (data: { name: string; prdText: string; priority: ProjectPriority; repoUrl: string; reviewDir: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [prdText, setPrdText] = useState("");
  const [priority, setPriority] = useState<ProjectPriority>("P2");
  const [repoUrl, setRepoUrl] = useState("");
  const [reviewDir, setReviewDir] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoUrl, setNewRepoUrl] = useState("");
  const [newRepoDir, setNewRepoDir] = useState("");

  const { data: savedRepos, refresh: refreshRepos } = usePluginData<SavedRepo[]>("saved-repos", {});
  const saveRepoAction = usePluginAction("save-repo");
  const deleteRepoAction = usePluginAction("delete-repo");

  const repos = savedRepos || [];

  const handleSelectRepo = (repoId: string) => {
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
    if (!newRepoName || !newRepoUrl) return;
    await saveRepoAction({ name: newRepoName, repoUrl: newRepoUrl, defaultReviewDir: newRepoDir });
    setRepoUrl(newRepoUrl);
    setReviewDir(newRepoDir);
    setShowAddRepo(false);
    setNewRepoName("");
    setNewRepoUrl("");
    setNewRepoDir("");
    refreshRepos();
  };

  const handleDeleteRepo = async (repoId: string) => {
    await deleteRepoAction({ repoId });
    refreshRepos();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) setPrdText(text);
    };
    reader.readAsText(file);
    if (!name.trim()) {
      const baseName = file.name.replace(/\.(md|txt|markdown|rst|prd)$/i, "").replace(/[-_]/g, " ");
      setName(baseName);
    }
  };

  return (
    <div style={{ display: "grid", gap: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", marginBottom: "16px" }}>
      <div style={{ fontSize: "16px", fontWeight: 600 }}>New Project</div>

      <FormField label="Project Name">
        <TextInput value={name} onChange={setName} placeholder="e.g. IAML Website Redesign" />
      </FormField>

      <FormField label="Priority">
        <SelectInput
          value={priority}
          onChange={(v) => setPriority(v as ProjectPriority)}
          options={[
            { value: "P0", label: "P0 — Critical" },
            { value: "P1", label: "P1 — High" },
            { value: "P2", label: "P2 — Medium" },
            { value: "P3", label: "P3 — Low" },
          ]}
        />
      </FormField>

      <FormField label="Repository">
        {repos.length > 0 ? (
          <div style={{ display: "grid", gap: "8px" }}>
            <SelectInput
              value=""
              onChange={handleSelectRepo}
              options={[
                { value: "", label: "Select a saved repo..." },
                ...repos.map(r => ({ value: r.id, label: `${r.name} (${r.repoUrl})` })),
                { value: "__add__", label: "+ Add new repo" },
              ]}
            />
            {repoUrl && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <TextInput value={repoUrl} onChange={setRepoUrl} placeholder="owner/repo" />
                <TextInput value={reviewDir} onChange={setReviewDir} placeholder="Review directory" />
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            <div style={{ fontSize: "12px", opacity: 0.6 }}>No saved repos. Add one or enter manually:</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <TextInput value={repoUrl} onChange={setRepoUrl} placeholder="owner/repo-name" />
              <TextInput value={reviewDir} onChange={setReviewDir} placeholder="Review directory (e.g. src/)" />
            </div>
            <button
              onClick={() => setShowAddRepo(true)}
              style={{ fontSize: "12px", background: "none", border: "none", color: "inherit", opacity: 0.6, cursor: "pointer", textAlign: "left", padding: 0 }}
            >
              + Save this repo for future use
            </button>
          </div>
        )}
      </FormField>

      {showAddRepo && (
        <div style={{ display: "grid", gap: "8px", padding: "12px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" }}>
          <div style={{ fontSize: "13px", fontWeight: 500 }}>Save New Repo</div>
          <FormField label="Display Name">
            <TextInput value={newRepoName} onChange={setNewRepoName} placeholder="e.g. PopeBot Workspace" />
          </FormField>
          <FormField label="GitHub Repo (owner/name)">
            <TextInput value={newRepoUrl} onChange={setNewRepoUrl} placeholder="mikejackson-IAML/popebot-workspace" />
          </FormField>
          <FormField label="Default Review Directory">
            <TextInput value={newRepoDir} onChange={setNewRepoDir} placeholder="plugins/dev-department" />
          </FormField>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleSaveNewRepo} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", background: "rgba(255,255,255,0.1)", color: "inherit" }}>
              Save Repo
            </button>
            <button onClick={() => setShowAddRepo(false)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", background: "none", color: "inherit", opacity: 0.6 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saved repos list (for deletion) */}
      {repos.length > 0 && (
        <details style={{ fontSize: "12px", opacity: 0.6 }}>
          <summary style={{ cursor: "pointer" }}>Manage saved repos ({repos.length})</summary>
          <div style={{ marginTop: "8px", display: "grid", gap: "4px" }}>
            {repos.map(r => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                <span>{r.name} — {r.repoUrl} ({r.defaultReviewDir || "root"})</span>
                <button onClick={() => handleDeleteRepo(r.id)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", opacity: 0.5, fontSize: "11px" }}>remove</button>
              </div>
            ))}
          </div>
        </details>
      )}

      <FormField label="PRD">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
          <label style={{ padding: "6px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.2)" }}>
            Upload File
            <input type="file" accept=".md,.txt,.markdown,.rst,.prd" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>
          {fileName && <span style={{ fontSize: "12px", opacity: 0.6 }}>{fileName}</span>}
        </div>
        <TextAreaInput value={prdText} onChange={setPrdText} placeholder="Paste your PRD here, or upload a file above..." rows={12} />
      </FormField>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => onSubmit({ name, prdText, priority, repoUrl: repoUrl || "mikejackson-IAML/popebot-workspace", reviewDir: reviewDir || "." })}
          disabled={!name.trim()}
          style={{ padding: "8px 16px", borderRadius: "6px", border: "none", cursor: name.trim() ? "pointer" : "not-allowed", fontSize: "13px", fontWeight: 500, background: "rgba(255,255,255,0.1)", color: "inherit", opacity: name.trim() ? 1 : 0.4 }}
        >
          Create Project
        </button>
        <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", background: "none", color: "inherit", opacity: 0.6 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Project Detail View
// =============================================================================

function ProjectDetailView({ projectId, parentProjectId, onBack }: {
  projectId: string;
  parentProjectId: string;
  onBack: () => void;
}) {
  const [pollTick, setPollTick] = useState(0);
  const [pendingPoll, setPendingPoll] = useState(false);

  const scheduleNextTick = () => {
    if (pendingPoll) return;
    setPendingPoll(true);
    setTimeout(() => {
      setPollTick((t) => t + 1);
      setPendingPoll(false);
    }, 8_000);
  };

  const { data, loading, error, refresh } = usePluginData<ProjectDetail>("project-detail", {
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

  const { data: apiKeyStatus, refresh: refreshApiKey } = usePluginData<{ configured: boolean }>("api-key-status", {});
  const { data: rtxKeyStatus, refresh: refreshRtxKey } = usePluginData<{ configured: boolean }>("rtx-key-status", {});
  const { data: progressData } = usePluginData<Array<{ message: string; timestamp: string }>>("progress-log", { parentProjectId, projectId });
  const { data: pipelineEvents } = usePluginData<PipelineEvent[]>("pipeline-events", { parentProjectId, projectId, _tick: pollTick });
  const { data: phaseReport } = usePluginData<PhaseReport | null>("phase-report", { parentProjectId, projectId });

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPrd, setEditPrd] = useState("");
  const [editPriority, setEditPriority] = useState<ProjectPriority>("P2");
  const [actionError, setActionError] = useState<string | null>(null);
  const [decomposing, setDecomposing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [rtxKeyInput, setRtxKeyInput] = useState("");
  const [pipelineStarting, setPipelineStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  if (loading) return <Spinner label="Loading project..." />;
  if (error) return <StatusBadge label={error.message} status="error" />;
  if (!data) return <StatusBadge label="Project not found" status="error" />;

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
      setEditing(false); refresh();
    } catch (err: any) { setActionError(err.message); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this project and all associated data?")) return;
    try { await deleteProjectAction({ parentProjectId, projectId }); onBack(); }
    catch (err: any) { setActionError(err.message); }
  };

  const handleDecompose = async () => {
    if (!apiKeyStatus?.configured) { setShowSettings(true); setActionError("Configure your Anthropic API key first."); return; }
    try { setActionError(null); setDecomposing(true); await decomposePrdAction({ parentProjectId, projectId }); }
    catch (err: any) { setActionError(err.message); setDecomposing(false); }
  };

  const handleStartPipeline = async () => {
    if (!rtxKeyStatus?.configured) { setShowSettings(true); setActionError("Configure your RTX Pipeline Key first."); return; }
    try { setActionError(null); setPipelineStarting(true); await startPipelineAction({ parentProjectId, projectId }); refresh(); }
    catch (err: any) { setActionError(err.message); }
    finally { setPipelineStarting(false); }
  };

  const handleCancelPipeline = async () => {
    try { setActionError(null); setCancelling(true); await cancelPipelineAction({ parentProjectId, projectId }); refresh(); }
    catch (err: any) { setActionError(err.message); }
    finally { setCancelling(false); }
  };

  const handleRetry = async () => {
    try { setActionError(null); await retryPipelineAction({ parentProjectId, projectId }); refresh(); }
    catch (err: any) { setActionError(err.message); }
  };

  const handleToggleAutoAdvance = async () => {
    try { setActionError(null); await toggleAutoAdvanceAction({ parentProjectId, projectId }); refresh(); }
    catch (err: any) { setActionError(err.message); }
  };

  const handleAdvance = async () => {
    try { setActionError(null); setAdvancing(true); await advanceProjectAction({ parentProjectId, projectId, phaseScope: `Phase ${project.phaseNumber || 1}` }); refresh(); }
    catch (err: any) { setActionError(err.message); }
    finally { setAdvancing(false); }
  };

  const handleApprove = async () => {
    try {
      setActionError(null);
      await approvePhaseAction({ parentProjectId, projectId });
      toast({ title: "Phase approved", body: project.autoAdvance ? "Auto-advancing..." : "Complete.", tone: "success", ttlMs: 5000 });
      refresh();
    } catch (err: any) { setActionError(err.message); }
  };

  const handleReject = async () => {
    try {
      setActionError(null);
      await rejectPhaseAction({ parentProjectId, projectId, reason: rejectReason || "Rejected by reviewer" });
      setShowRejectForm(false); setRejectReason("");
      toast({ title: "Phase rejected", body: rejectReason || "Rejected", tone: "error", ttlMs: 5000 });
      refresh();
    } catch (err: any) { setActionError(err.message); }
  };

  const handleSaveApiKey = async () => {
    try { await saveApiKeyAction({ apiKey: apiKeyInput }); setApiKeyInput(""); setActionError(null); refreshApiKey(); }
    catch (err: any) { setActionError(err.message); }
  };

  const handleSaveRtxKey = async () => {
    try { await saveRtxKeyAction({ apiKey: rtxKeyInput }); setRtxKeyInput(""); setActionError(null); refreshRtxKey(); }
    catch (err: any) { setActionError(err.message); }
  };

  const handleUpdateJob = async (jobId: string, updates: Partial<BuildJob>) => {
    try { setActionError(null); await updateJobAction({ parentProjectId, projectId, jobId, updates }); refresh(); }
    catch (err: any) { setActionError(err.message); }
  };

  // ── Pipeline events as LogView entries ──
  const logEntries: LogViewEntry[] = (pipelineEvents || []).map(evt => ({
    timestamp: evt.timestamp,
    level: evt.type.includes("failed") ? "error" as const
      : evt.type.includes("complete") ? "info" as const
      : evt.type.includes("started") ? "info" as const
      : "debug" as const,
    message: evt.message,
  }));

  // ── Progress log as LogView entries ──
  const progressEntries: LogViewEntry[] = (progressData || []).map(p => ({
    timestamp: p.timestamp, level: "info" as const, message: p.message,
  }));

  // ── Build action bar items ──
  const actionItems: ActionBarItem[] = [];
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
    if (!pipeline) return "";
    const steps = ["build", "review", "fix", "done"];
    const labels: Record<string, string> = { build: "Building code", review: "Running reviews", fix: "Applying fixes", advance: "Advancing phase", done: "Complete" };
    const current = pipeline.currentStep || "build";
    const stepNum = steps.indexOf(current) + 1 || 1;
    return `Step ${stepNum}/${steps.length}: ${labels[current] || current}`;
  })();

  return (
    <ErrorBoundary>
      <div style={{ display: "grid", gap: "16px" }}>

        {/* Error */}
        {actionError && <StatusBadge label={actionError} status="error" />}

        {/* ── REVIEW GATE ── */}
        {needsReview && (
          <div style={{ display: "grid", gap: "12px", padding: "16px", border: "2px solid orange", borderRadius: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <StatusBadge label="Review Required" status="warning" />
              <StatusBadge label={`Phase ${project.phaseNumber || 1}`} status="info" />
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <MetricCard label="Build Jobs" value={jobs.length} />
              <MetricCard label="Reviews" value={reviews.length} />
              <MetricCard label="Cost" value={`$${totalCost.toFixed(4)}`} />
            </div>

            {/* Tier verdicts */}
            {reviews.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(["haiku", "deepseek", "codex"] as const).map(tier => {
                  const latest = reviews.filter(r => r.tier === tier).pop();
                  if (!latest) return null;
                  return <StatusBadge key={tier} label={`${tier}: ${latest.verdict}`} status={statusVariant(latest.verdict)} />;
                })}
              </div>
            )}

            {pipeline?.completedAt && pipeline?.startedAt && (
              <KeyValueList pairs={[{
                label: "Pipeline duration",
                value: (() => {
                  const ms = new Date(pipeline.completedAt).getTime() - new Date(pipeline.startedAt).getTime();
                  const mins = Math.floor(ms / 60000);
                  return mins > 0 ? `${mins}m ${Math.floor((ms % 60000) / 1000)}s` : `${Math.floor(ms / 1000)}s`;
                })(),
              }]} />
            )}

            {project.autoAdvance && (
              <StatusBadge label={`Auto-advance ON — will generate Phase ${(project.phaseNumber || 1) + 1}`} status="info" />
            )}

            {!showRejectForm ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleApprove} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, background: "rgba(34,197,94,0.2)", color: "#4ade80" }}>
                  Approve Phase {project.phaseNumber || 1}
                </button>
                <button onClick={() => setShowRejectForm(true)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, background: "rgba(239,68,68,0.2)", color: "#f87171" }}>
                  Reject
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "8px" }}>
                <FormField label="Rejection reason">
                  <TextAreaInput value={rejectReason} onChange={setRejectReason} placeholder="What needs to change?" rows={3} />
                </FormField>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleReject} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", background: "rgba(239,68,68,0.2)", color: "#f87171" }}>Confirm Reject</button>
                  <button onClick={() => { setShowRejectForm(false); setRejectReason(""); }} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", background: "none", color: "inherit", opacity: 0.6 }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Settings ── */}
        {showSettings && (
          <div style={{ display: "grid", gap: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600 }}>Settings</div>
            <FormField label={`Anthropic API Key ${apiKeyStatus?.configured ? "(configured)" : ""}`}>
              <div style={{ display: "flex", gap: "8px" }}>
                <TextInput value={apiKeyInput} onChange={setApiKeyInput} placeholder="sk-ant-..." type="password" />
                <button onClick={handleSaveApiKey} disabled={!apiKeyInput.trim()} style={{ padding: "8px 12px", borderRadius: "6px", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.1)", color: "inherit", opacity: apiKeyInput.trim() ? 1 : 0.4 }}>Save</button>
              </div>
            </FormField>
            <FormField label={`RTX Pipeline Key ${rtxKeyStatus?.configured ? "(configured)" : ""}`}>
              <div style={{ display: "flex", gap: "8px" }}>
                <TextInput value={rtxKeyInput} onChange={setRtxKeyInput} placeholder="API key from RTX" type="password" />
                <button onClick={handleSaveRtxKey} disabled={!rtxKeyInput.trim()} style={{ padding: "8px 12px", borderRadius: "6px", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.1)", color: "inherit", opacity: rtxKeyInput.trim() ? 1 : 0.4 }}>Save</button>
              </div>
            </FormField>
            <button onClick={() => setShowSettings(false)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", background: "none", color: "inherit", opacity: 0.6, justifySelf: "end" }}>Close</button>
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.6, fontSize: "13px" }}>← Back</button>
          <span style={{ fontSize: "18px", fontWeight: 600, flex: 1 }}>{project.name}</span>
          <StatusBadge label={project.priority} status="info" />
          <StatusBadge label={project.status} status={statusVariant(project.status)} />
          <StatusBadge label={`Phase ${project.phaseNumber || 1}`} status="info" />
        </div>

        {/* ── Controls ── */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {!editing && (
            <>
              <button onClick={startEditing} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", fontSize: "12px", background: "rgba(0,0,0,0.2)", color: "inherit" }}>Edit</button>
              <button onClick={handleDelete} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: "12px", background: "rgba(239,68,68,0.1)", color: "#f87171" }}>Delete</button>
              {project.status === "failed" && jobs.length > 0 && (
                <button onClick={handleRetry} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(245,158,11,0.3)", cursor: "pointer", fontSize: "12px", background: "rgba(245,158,11,0.1)", color: "#fbbf24" }}>Retry Pipeline</button>
              )}
              {canAdvance && (
                <button onClick={handleAdvance} disabled={advancing} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(124,58,237,0.3)", cursor: "pointer", fontSize: "12px", background: "rgba(124,58,237,0.1)", color: "#c4b5fd" }}>
                  {advancing ? "Advancing..." : `Advance to Phase ${(project.phaseNumber || 1) + 1}`}
                </button>
              )}
              <div onClick={handleToggleAutoAdvance} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ width: "28px", height: "14px", borderRadius: "7px", background: project.autoAdvance ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.15)", position: "relative" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px", left: project.autoAdvance ? "16px" : "2px", transition: "left 0.2s" }} />
                </div>
                <span style={{ fontSize: "11px", opacity: 0.7 }}>Auto-advance</span>
              </div>
              <button onClick={() => setShowSettings(true)} style={{ padding: "6px 8px", borderRadius: "6px", border: "none", cursor: "pointer", background: "none", color: "inherit", opacity: 0.5, fontSize: "12px" }}>&#9881;</button>
            </>
          )}
        </div>

        {/* ── Edit form ── */}
        {editing && (
          <div style={{ display: "grid", gap: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}>
            <FormField label="Name"><TextInput value={editName} onChange={setEditName} /></FormField>
            <FormField label="Priority">
              <SelectInput value={editPriority} onChange={(v) => setEditPriority(v as ProjectPriority)} options={[
                { value: "P0", label: "P0 — Critical" }, { value: "P1", label: "P1 — High" },
                { value: "P2", label: "P2 — Medium" }, { value: "P3", label: "P3 — Low" },
              ]} />
            </FormField>
            <FormField label="PRD"><TextAreaInput value={editPrd} onChange={setEditPrd} rows={10} /></FormField>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleSave} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", background: "rgba(255,255,255,0.1)", color: "inherit" }}>Save</button>
              <button onClick={() => setEditing(false)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", background: "none", color: "inherit", opacity: 0.6 }}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Project info ── */}
        {!editing && (
          <>
            <KeyValueList pairs={[
              { label: "Repo", value: project.repoUrl || "Not set" },
              { label: "Review Dir", value: project.reviewDir || "Not set" },
              ...(project.decompositionSummary ? [{ label: "Summary", value: project.decompositionSummary }] : []),
            ]} />
            {project.prdText && <MarkdownBlock content={project.prdText} />}
          </>
        )}

        {/* ── Progress log ── */}
        {progressEntries.length > 0 && (
          <LogView entries={progressEntries} maxHeight="150px" autoScroll />
        )}

        {/* ── Action bar ── */}
        {actionItems.length > 0 && (
          <ActionBar actions={actionItems} onSuccess={() => refresh()} onError={(_, err) => setActionError(String(err))} />
        )}

        {/* ── Build jobs ── */}
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, opacity: 0.6, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Build Jobs {jobs.length > 0 && `(${jobs.length})`}
          </div>
          {jobs.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", opacity: 0.4, border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "8px" }}>
              {project.prdText ? 'Click "Analyze PRD" to decompose into build jobs.' : "Add a PRD first."}
            </div>
          ) : (
            <DataTable
              columns={[
                { key: "name", header: "Job", width: "40%", render: (_v: any, row: any) => (
                  <span style={{ cursor: "pointer" }} onClick={() => setExpandedJobId(expandedJobId === row.id ? null : row.id)}>
                    {row.name}
                  </span>
                )},
                { key: "targetFiles", header: "Files", render: (v: any) => (v as string[])?.join(", ") || "—" },
                { key: "jobType", header: "Type", width: "80px" },
                { key: "status", header: "Status", width: "100px", render: (v: any) => <StatusBadge label={v as string} status={statusVariant(v as string)} /> },
                { key: "prUrl", header: "PR", width: "60px", render: (v: any) => v ? <a href={v as string} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", opacity: 0.7 }}>View</a> : "—" },
              ]}
              rows={jobs as any}
              emptyMessage="No jobs"
            />
          )}
          {expandedJobId && (() => {
            const job = jobs.find(j => j.id === expandedJobId);
            if (!job) return null;
            return (
              <div style={{ padding: "12px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", marginTop: "8px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>{job.name}</div>
                <MarkdownBlock content={job.description} />
                <KeyValueList pairs={[
                  { label: "Files", value: job.targetFiles.join(", ") },
                  { label: "Dependencies", value: job.dependencies.join(", ") || "None" },
                  { label: "Type", value: job.jobType },
                ]} />
              </div>
            );
          })()}
        </div>

        {/* ── Cost ── */}
        {totalCost > 0 && (
          <MetricCard label="Total LLM Cost" value={`$${totalCost.toFixed(4)}`} />
        )}

        {/* ── Pipeline ── */}
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, opacity: 0.6, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pipeline</div>
          {pipeline ? (
            <div style={{ display: "grid", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <StatusBadge label={pipeline.status} status={statusVariant(pipeline.status)} />
                <span style={{ fontSize: "12px", opacity: 0.6 }}>{stepLabel}</span>
                {pipeline.rtxPipelineId && <span style={{ fontSize: "11px", opacity: 0.4 }}>RTX: {pipeline.rtxPipelineId.slice(0, 8)}...</span>}
              </div>
              <KeyValueList pairs={[
                { label: "Started", value: new Date(pipeline.startedAt).toLocaleString() },
                ...(pipeline.completedAt ? [{ label: "Completed", value: new Date(pipeline.completedAt).toLocaleString() }] : []),
              ]} />
            </div>
          ) : (
            <div style={{ padding: "24px", textAlign: "center", opacity: 0.4, border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "8px" }}>
              {canStartPipeline ? `${jobs.length} jobs ready. Click "Start Build".` : "Decompose a PRD first."}
            </div>
          )}
        </div>

        {/* ── Pipeline log ── */}
        {logEntries.length > 0 && (
          <LogView entries={logEntries} maxHeight="250px" autoScroll loading={isPipelineRunning} />
        )}

        {/* ── Advancing state ── */}
        {isAdvancing && <StatusBadge label={`Advancing to Phase ${(project.phaseNumber || 1) + 1}...`} status="info" />}

        {/* ── Phase report ── */}
        {phaseReport && (
          <div style={{ display: "grid", gap: "8px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Phase {phaseReport.phaseNumber} Report
            </div>
            <KeyValueList pairs={[
              { label: "Transition", value: `Phase ${phaseReport.phaseNumber} → ${phaseReport.nextPhase}` },
              { label: "Generated", value: new Date(phaseReport.createdAt).toLocaleString() },
              ...(phaseReport.nextProjectId ? [{ label: "Next project", value: phaseReport.nextProjectId.slice(0, 8) + "..." }] : []),
            ]} />
            {phaseReport.report && (
              <details>
                <summary style={{ cursor: "pointer", fontSize: "12px", opacity: 0.6 }}>Completion Report ({phaseReport.report.length} chars)</summary>
                <MarkdownBlock content={phaseReport.report} />
              </details>
            )}
            {phaseReport.nextPrd && (
              <details>
                <summary style={{ cursor: "pointer", fontSize: "12px", opacity: 0.6 }}>Next Phase PRD ({phaseReport.nextPrd.length} chars)</summary>
                <MarkdownBlock content={phaseReport.nextPrd} />
              </details>
            )}
          </div>
        )}

        {/* ── Review tiers ── */}
        {reviews.length > 0 && (
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, opacity: 0.6, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Review Tiers ({reviews.length} results)
            </div>
            <DataTable
              columns={[
                { key: "round", header: "Round", width: "60px" },
                { key: "tier", header: "Tier", render: (v: any) => <StatusBadge label={v as string} status="info" /> },
                { key: "verdict", header: "Verdict", render: (v: any) => <StatusBadge label={v as string} status={statusVariant(v as string)} /> },
                { key: "createdAt", header: "Time", render: (v: any) => new Date(v as string).toLocaleTimeString() },
              ]}
              rows={reviews as any}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

// =============================================================================
// Projects List View
// =============================================================================

function ProjectsView() {
  const { projectId: parentProjectId } = useHostContext();
  const { data: projects, loading, error, refresh } = usePluginData<ManagedProject[]>("projects", {
    parentProjectId: parentProjectId || "",
  });
  const createProjectAction = usePluginAction("create-project");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!parentProjectId) return <div style={{ padding: "24px", opacity: 0.6 }}>Open a project to see its automation.</div>;

  if (selectedProjectId) {
    return (
      <div style={{ padding: "24px" }}>
        <ProjectDetailView
          projectId={selectedProjectId}
          parentProjectId={parentProjectId}
          onBack={() => { setSelectedProjectId(null); refresh(); }}
        />
      </div>
    );
  }

  const handleCreate = async (data: { name: string; prdText: string; priority: ProjectPriority; repoUrl: string; reviewDir: string }) => {
    try {
      setActionError(null);
      const result = await createProjectAction({
        parentProjectId, name: data.name, prdText: data.prdText,
        priority: data.priority, repoUrl: data.repoUrl, reviewDir: data.reviewDir,
      }) as ManagedProject;
      setShowCreate(false);
      setSelectedProjectId(result.id);
      refresh();
    } catch (err: any) { setActionError(err.message); }
  };

  return (
    <div style={{ padding: "24px" }}>
      {actionError && <StatusBadge label={actionError} status="error" />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <span style={{ fontSize: "20px", fontWeight: 700 }}>Projects</span>
        <button onClick={() => setShowCreate(true)} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "13px", background: "rgba(255,255,255,0.1)", color: "inherit" }}>+ New Project</button>
      </div>

      {showCreate && <CreateProjectForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />}

      {loading && <Spinner label="Loading projects..." />}
      {error && <StatusBadge label={error.message} status="error" />}

      {projects && projects.length === 0 && !showCreate ? (
        <div style={{ padding: "48px", textAlign: "center", opacity: 0.4, border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "8px" }}>
          <div style={{ marginBottom: "8px", fontWeight: 600 }}>No projects yet</div>
          <div>Click "+ New Project" to create one.</div>
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "Project", render: (_v: any, row: any) => (
              <span style={{ cursor: "pointer", fontWeight: 500 }} onClick={() => setSelectedProjectId(row.id)}>{row.name}</span>
            )},
            { key: "priority", header: "Priority", width: "80px", render: (v: any) => <StatusBadge label={v as string} status="info" /> },
            { key: "status", header: "Status", width: "120px", render: (v: any) => <StatusBadge label={v as string} status={statusVariant(v as string)} /> },
            { key: "phaseNumber", header: "Phase", width: "60px", render: (v: any) => `${v || 1}` },
          ]}
          rows={(projects || []) as any}
          emptyMessage="No projects"
        />
      )}
    </div>
  );
}

// =============================================================================
// Exported Slot Components
// =============================================================================

export function AutomationSidebar({ context }: PluginProjectSidebarItemProps) {
  const { projectId: parentProjectId } = useHostContext();
  const { data: reviewData } = usePluginData<{ count: number }>("review-count", {
    parentProjectId: parentProjectId || "",
  });
  const reviewCount = reviewData?.count || 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", fontSize: "14px", fontWeight: 500 }}>
      <span>Automation</span>
      {reviewCount > 0 && (
        <StatusBadge label={`${reviewCount} review${reviewCount > 1 ? "s" : ""}`} status="warning" />
      )}
    </div>
  );
}

export function ProjectsTab({ context }: PluginDetailTabProps) {
  return (
    <ErrorBoundary>
      <ProjectsView />
    </ErrorBoundary>
  );
}
