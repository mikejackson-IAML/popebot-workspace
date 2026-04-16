import { useState } from "react";
import type {
  PluginProjectSidebarItemProps,
  PluginDetailTabProps,
} from "@paperclipai/plugin-sdk/ui";
import {
  usePluginData,
  usePluginAction,
  useHostContext,
} from "@paperclipai/plugin-sdk/ui";

// =============================================================================
// Types (mirror worker/types.ts for UI)
// =============================================================================

type ProjectStatus = "draft" | "planning" | "ready" | "building" | "reviewing" | "complete" | "failed" | "advancing";
type ProjectPriority = "P0" | "P1" | "P2" | "P3";

interface ManagedProject {
  id: string;
  parentProjectId: string;
  name: string;
  prdText: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  decompositionSummary: string;
  phaseNumber: number;
  autoAdvance: boolean;
  sourceProjectId: string | null;
  createdAt: string;
  updatedAt: string;
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

type BuildJobType = "code" | "workflow" | "config" | "schema";

interface BuildJob {
  id: string;
  projectId: string;
  name: string;
  description: string;
  targetFiles: string[];
  dependencies: string[];
  jobType: BuildJobType;
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

type PipelineStatus = "queued" | "building" | "reviewing" | "fixing" | "complete" | "failed" | "cancelled";

interface PipelineRun {
  id: string;
  projectId: string;
  status: PipelineStatus;
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

interface ProjectDetail {
  project: ManagedProject;
  jobs: BuildJob[];
  pipeline: PipelineRun | null;
  reviews: ReviewResult[];
  usage: LLMUsageRecord[];
}

interface ProgressMessage {
  message: string;
  timestamp: string;
}

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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#374151", text: "#9ca3af" },
  planning: { bg: "#1e3a5f", text: "#60a5fa" },
  ready: { bg: "#3b0764", text: "#c084fc" },
  building: { bg: "#064e3b", text: "#34d399" },
  reviewing: { bg: "#78350f", text: "#fbbf24" },
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

const TIER_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  haiku: { bg: "#1e3a5f", text: "#60a5fa", label: "Tier 1: Haiku" },
  deepseek: { bg: "#4c1d95", text: "#c4b5fd", label: "Tier 2: DeepSeek" },
  codex: { bg: "#064e3b", text: "#34d399", label: "Tier 3: Codex" },
};

const VERDICT_COLORS: Record<string, { bg: string; text: string }> = {
  approve: { bg: "#14532d", text: "#4ade80" },
  pass: { bg: "#14532d", text: "#4ade80" },
  concerns: { bg: "#78350f", text: "#fbbf24" },
  "request-changes": { bg: "#7f1d1d", text: "#f87171" },
  block: { bg: "#7f1d1d", text: "#f87171" },
  reject: { bg: "#7f1d1d", text: "#f87171" },
  unknown: { bg: "#374151", text: "#9ca3af" },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  P0: { bg: "#7f1d1d", text: "#fca5a5" },
  P1: { bg: "#78350f", text: "#fbbf24" },
  P2: { bg: "#1e3a5f", text: "#60a5fa" },
  P3: { bg: "#374151", text: "#9ca3af" },
};

// =============================================================================
// Primitives
// =============================================================================

function Badge({ label, colors }: { label: string; colors?: Record<string, { bg: string; text: string }> }) {
  const map = colors || STATUS_COLORS;
  const c = map[label] || { bg: "#374151", text: "#9ca3af" };
  return (
    <span style={{ padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, backgroundColor: c.bg, color: c.text }}>
      {label}
    </span>
  );
}

function Btn({ children, onClick, variant = "default", disabled = false, style }: {
  children: React.ReactNode;
  onClick: (e?: any) => void;
  variant?: "default" | "primary" | "danger" | "ghost";
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: { backgroundColor: "#374151", color: C.text },
    primary: { backgroundColor: C.accent, color: "#fff" },
    danger: { backgroundColor: C.dangerBg, color: "#f87171" },
    ghost: { backgroundColor: "transparent", color: C.textMuted },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 16px", border: "none", borderRadius: "6px",
        cursor: disabled ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 500,
        opacity: disabled ? 0.5 : 1, ...styles[variant], ...style,
      }}
    >
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: "100%", padding: "10px 12px", backgroundColor: C.bgInput, color: C.text,
        border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box",
      }}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{
        width: "100%", padding: "10px 12px", backgroundColor: C.bgInput, color: C.text,
        border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "14px",
        boxSizing: "border-box", resize: "vertical", fontFamily: "monospace",
      }}
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value} onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "10px 12px", backgroundColor: C.bgInput, color: C.text,
        border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box",
      }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Card({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "16px", backgroundColor: C.bgCard, borderRadius: "8px",
        border: `1px solid ${C.border}`, cursor: onClick ? "pointer" : "default", ...style,
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", color: C.textMuted, fontSize: "12px", marginBottom: "4px", fontWeight: 500 }}>{children}</label>;
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <Card style={{ marginBottom: "12px", borderColor: C.danger }}>
      <span style={{ color: "#f87171" }}>{message}</span>
    </Card>
  );
}

// =============================================================================
// Create Project Form
// =============================================================================

function CreateProjectForm({ onSubmit, onCancel }: {
  onSubmit: (data: { name: string; prdText: string; priority: ProjectPriority }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [prdText, setPrdText] = useState("");
  const [priority, setPriority] = useState<ProjectPriority>("P2");
  const [fileName, setFileName] = useState<string | null>(null);

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
    // Auto-fill project name from filename if empty
    if (!name.trim()) {
      const baseName = file.name.replace(/\.(md|txt|markdown|rst|prd)$/i, "").replace(/[-_]/g, " ");
      setName(baseName);
    }
  };

  return (
    <Card style={{ marginBottom: "16px" }}>
      <h3 style={{ margin: "0 0 16px 0", color: C.text, fontSize: "16px" }}>New Project</h3>
      <div style={{ display: "grid", gap: "12px" }}>
        <div>
          <Label>Project Name</Label>
          <Input value={name} onChange={setName} placeholder="e.g. IAML Website Redesign" />
        </div>
        <div>
          <Label>Priority</Label>
          <Select
            value={priority}
            onChange={(v) => setPriority(v as ProjectPriority)}
            options={[
              { value: "P0", label: "P0 — Critical" },
              { value: "P1", label: "P1 — High" },
              { value: "P2", label: "P2 — Medium" },
              { value: "P3", label: "P3 — Low" },
            ]}
          />
        </div>
        <div>
          <Label>PRD</Label>
          <div style={{
            display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px",
          }}>
            <label style={{
              padding: "8px 16px", backgroundColor: "#374151", color: C.text,
              borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
              border: `1px solid ${C.border}`,
            }}>
              Upload File
              <input
                type="file"
                accept=".md,.txt,.markdown,.rst,.prd"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </label>
            {fileName && (
              <span style={{ color: C.textMuted, fontSize: "13px" }}>{fileName}</span>
            )}
            <span style={{ color: C.textDim, fontSize: "12px" }}>or paste below</span>
          </div>
          <TextArea
            value={prdText}
            onChange={setPrdText}
            placeholder="Paste your PRD here, or upload a file above..."
            rows={12}
          />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Btn
            onClick={() => onSubmit({ name, prdText, priority })}
            variant="primary"
            disabled={!name.trim()}
          >
            Create Project
          </Btn>
          <Btn onClick={onCancel} variant="ghost">Cancel</Btn>
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// Project Detail View
// =============================================================================

// =============================================================================
// Editable Job Card
// =============================================================================

function EditableJobCard({ job, index, onSave }: {
  job: BuildJob;
  index: number;
  onSave: (updates: Partial<BuildJob>) => void;
}) {
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

  return (
    <Card style={{ padding: "12px 16px" }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        onClick={() => !editingJob && setExpanded(!expanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
          <span style={{ color: C.textDim, fontSize: "13px", fontWeight: 700, minWidth: "24px" }}>#{index + 1}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: C.text, fontSize: "14px" }}>{job.name}</div>
            <div style={{ fontSize: "12px", color: C.textDim, marginTop: "2px" }}>
              {job.targetFiles.join(", ") || "No target files"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {job.dependencies.length > 0 && (
            <span style={{ fontSize: "11px", color: C.textDim }}>
              depends: {job.dependencies.join(", ")}
            </span>
          )}
          {job.jobType && job.jobType !== "code" && (
            <Badge label={job.jobType} colors={{
              workflow: { bg: "#4c1d95", text: "#c4b5fd" },
              config: { bg: "#713f12", text: "#fde68a" },
              schema: { bg: "#164e63", text: "#67e8f9" },
            }} />
          )}
          <Badge label={job.status} />
          <span style={{ color: C.textDim, fontSize: "12px" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && !editingJob && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
          <pre style={{
            color: C.text, fontSize: "12px", lineHeight: "1.5",
            whiteSpace: "pre-wrap", wordBreak: "break-word", margin: "0 0 8px 0",
          }}>
            {job.description}
          </pre>
          {job.status === "pending" && (
            <Btn variant="ghost" onClick={(e: any) => { e.stopPropagation(); setEditingJob(true); }} style={{ fontSize: "12px", padding: "4px 10px" }}>
              Edit Job
            </Btn>
          )}
        </div>
      )}

      {editingJob && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${C.border}`, display: "grid", gap: "8px" }}>
          <div>
            <Label>Job Name</Label>
            <Input value={editName} onChange={setEditName} />
          </div>
          <div>
            <Label>Description</Label>
            <TextArea value={editDesc} onChange={setEditDesc} rows={4} />
          </div>
          <div>
            <Label>Target Files (comma-separated)</Label>
            <Input value={editFiles} onChange={setEditFiles} placeholder="src/foo.ts, src/bar.ts" />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Btn variant="primary" onClick={handleSaveJob} style={{ fontSize: "12px", padding: "4px 10px" }}>Save</Btn>
            <Btn variant="ghost" onClick={() => setEditingJob(false)} style={{ fontSize: "12px", padding: "4px 10px" }}>Cancel</Btn>
          </div>
        </div>
      )}
    </Card>
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

  // Schedule next poll tick. Uses pendingPoll flag to prevent stacking multiple
  // timeouts. The chain: Start Build → setPendingPoll(true) → render detects
  // pendingPoll+active → fires one setTimeout → tick increments → params change →
  // usePluginData re-fetches → render again → repeat while active.
  const scheduleNextTick = () => {
    if (pendingPoll) return;
    setPendingPoll(true);
    setTimeout(() => {
      setPollTick((t) => t + 1);
      setPendingPoll(false);
    }, 8_000);
  };

  const { data, loading, error, refresh } = usePluginData<ProjectDetail>("project-detail", {
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

  const { data: apiKeyStatus, refresh: refreshApiKey } = usePluginData<{ configured: boolean }>("api-key-status", {});
  const { data: rtxKeyStatus, refresh: refreshRtxKey } = usePluginData<{ configured: boolean }>("rtx-key-status", {});
  const { data: progressData } = usePluginData<ProgressMessage[]>("progress-log", {
    parentProjectId, projectId,
  });
  const { data: phaseReport } = usePluginData<PhaseReport | null>("phase-report", {
    parentProjectId, projectId,
  });
  const { data: pipelineEvents, refresh: refreshPipelineEvents } = usePluginData<PipelineEvent[]>("pipeline-events", {
    parentProjectId, projectId,
    _tick: pollTick,
  });

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPrd, setEditPrd] = useState("");
  const [editPriority, setEditPriority] = useState<ProjectPriority>("P2");
  const [actionError, setActionError] = useState<string | null>(null);
  const [decomposing, setDecomposing] = useState(false);
  const [showApiKeyConfig, setShowApiKeyConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [rtxKeyInput, setRtxKeyInput] = useState("");
  const [pipelineStarting, setPipelineStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  if (loading) return <div style={{ padding: "24px", color: C.textMuted }}>Loading...</div>;
  if (error) return <ErrorBanner message={error.message} />;
  if (!data) return <ErrorBanner message="Project not found" />;

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
    } catch (err: any) {
      setActionError(err.message || "Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this project and all associated data?")) return;
    try {
      await deleteProjectAction({ parentProjectId, projectId });
      onBack();
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
      setActionError(err.message || "Failed to save API key");
    }
  };

  const handleSaveRtxKey = async () => {
    try {
      await saveRtxKeyAction({ apiKey: rtxKeyInput });
      setRtxKeyInput("");
      setActionError(null);
      refreshRtxKey();
    } catch (err: any) {
      setActionError(err.message || "Failed to save RTX key");
    }
  };

  const handleUpdateJob = async (jobId: string, updates: Partial<BuildJob>) => {
    try {
      setActionError(null);
      await updateJobAction({ parentProjectId, projectId, jobId, updates });
      refresh();
    } catch (err: any) {
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
    } catch (err: any) {
      setActionError(err.message || "Failed to start pipeline");
    } finally {
      setPipelineStarting(false);
    }
  };

  const handleCancelPipeline = async () => {
    try {
      setActionError(null);
      setCancelling(true);
      await cancelPipelineAction({ parentProjectId, projectId });
      refresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to cancel pipeline");
    } finally {
      setCancelling(false);
    }
  };

  const handleToggleAutoAdvance = async () => {
    try {
      setActionError(null);
      await toggleAutoAdvanceAction({ parentProjectId, projectId });
      refresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to toggle auto-advance");
    }
  };

  const handleAdvanceProject = async () => {
    try {
      setActionError(null);
      setAdvancing(true);
      await advanceProjectAction({ parentProjectId, projectId, phaseScope: `Phase ${project.phaseNumber || 1}` });
      refresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to start phase advancement");
    } finally {
      setAdvancing(false);
    }
  };

  // Calculate total cost
  const totalCost = (usage as LLMUsageRecord[]).reduce((sum, u) => sum + u.estimatedCostUsd, 0);

  const canDecompose = project.prdText && (project.status === "draft" || project.status === "failed");
  const isPlanning = project.status === "planning";
  const canStartPipeline = project.status === "ready" && jobs.length > 0;
  const isPipelineRunning = project.status === "building" || project.status === "reviewing";
  const isAdvancing = project.status === "advancing";
  const canAdvance = project.status === "complete" && !phaseReport;
  const { pipeline } = data;
  const myPipelineEvents = pipelineEvents || [];

  return (
    <div>
      {actionError && <ErrorBanner message={actionError} />}

      {/* Settings Panel — API Keys */}
      {showApiKeyConfig && (
        <Card style={{ marginBottom: "16px", borderColor: C.accent }}>
          <h4 style={{ margin: "0 0 12px 0", color: C.text, fontSize: "14px" }}>Settings</h4>

          {/* Anthropic API Key */}
          <div style={{ marginBottom: "16px" }}>
            <Label>Anthropic API Key {apiKeyStatus?.configured && <span style={{ color: C.success, marginLeft: "6px" }}>configured</span>}</Label>
            <p style={{ color: C.textMuted, fontSize: "12px", margin: "0 0 6px 0" }}>
              Used for PRD decomposition (Sonnet).
            </p>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                style={{
                  flex: 1, padding: "10px 12px", backgroundColor: C.bgInput, color: C.text,
                  border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box",
                }}
              />
              <Btn variant="primary" onClick={handleSaveApiKey} disabled={!apiKeyInput.trim()}>Save</Btn>
            </div>
          </div>

          {/* RTX Pipeline API Key */}
          <div style={{ marginBottom: "12px" }}>
            <Label>RTX Pipeline Key {rtxKeyStatus?.configured && <span style={{ color: C.success, marginLeft: "6px" }}>configured</span>}</Label>
            <p style={{ color: C.textMuted, fontSize: "12px", margin: "0 0 6px 0" }}>
              Authenticates with RTX orchestrator. Same value as ~/.popebot-api-key on RTX.
            </p>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="password"
                value={rtxKeyInput}
                onChange={(e) => setRtxKeyInput(e.target.value)}
                placeholder="API key from RTX"
                style={{
                  flex: 1, padding: "10px 12px", backgroundColor: C.bgInput, color: C.text,
                  border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box",
                }}
              />
              <Btn variant="primary" onClick={handleSaveRtxKey} disabled={!rtxKeyInput.trim()}>Save</Btn>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setShowApiKeyConfig(false)}>Close</Btn>
          </div>
        </Card>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <Btn onClick={onBack} variant="ghost">← Back</Btn>
        <h2 style={{ margin: 0, color: C.text, fontSize: "18px", flex: 1 }}>{project.name}</h2>
        <Badge label={project.priority} colors={PRIORITY_COLORS} />
        <Badge label={project.status} />
      </div>

      {/* Edit / View toggle */}
      {editing ? (
        <Card style={{ marginBottom: "16px" }}>
          <div style={{ display: "grid", gap: "12px" }}>
            <div>
              <Label>Project Name</Label>
              <Input value={editName} onChange={setEditName} placeholder="Project name" />
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={editPriority}
                onChange={(v) => setEditPriority(v as ProjectPriority)}
                options={[
                  { value: "P0", label: "P0 — Critical" },
                  { value: "P1", label: "P1 — High" },
                  { value: "P2", label: "P2 — Medium" },
                  { value: "P3", label: "P3 — Low" },
                ]}
              />
            </div>
            <div>
              <Label>PRD</Label>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <label style={{
                  padding: "8px 16px", backgroundColor: "#374151", color: C.text,
                  borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                  border: `1px solid ${C.border}`,
                }}>
                  Upload File
                  <input
                    type="file"
                    accept=".md,.txt,.markdown,.rst,.prd"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const text = ev.target?.result as string;
                        if (text) setEditPrd(text);
                      };
                      reader.readAsText(file);
                    }}
                    style={{ display: "none" }}
                  />
                </label>
                <span style={{ color: C.textDim, fontSize: "12px" }}>or edit below</span>
              </div>
              <TextArea value={editPrd} onChange={setEditPrd} placeholder="PRD text..." rows={12} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn onClick={handleSave} variant="primary">Save</Btn>
              <Btn onClick={() => setEditing(false)} variant="ghost">Cancel</Btn>
            </div>
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: "12px", marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <Btn onClick={startEditing} variant="default">Edit Project</Btn>
            <Btn onClick={handleDelete} variant="danger">Delete</Btn>
            {canAdvance && (
              <Btn variant="primary" onClick={handleAdvanceProject} disabled={advancing}
                style={{ backgroundColor: "#7c3aed" }}>
                {advancing ? "Advancing..." : `Advance to Phase ${(project.phaseNumber || 1) + 1}`}
              </Btn>
            )}
            <div
              onClick={handleToggleAutoAdvance}
              style={{
                display: "flex", alignItems: "center", gap: "6px", cursor: "pointer",
                padding: "6px 12px", borderRadius: "6px",
                backgroundColor: project.autoAdvance ? "#4c1d95" : "#374151",
                border: `1px solid ${project.autoAdvance ? "#7c3aed" : C.border}`,
              }}
            >
              <div style={{
                width: "32px", height: "16px", borderRadius: "8px",
                backgroundColor: project.autoAdvance ? "#7c3aed" : "#4b5563",
                position: "relative", transition: "background-color 0.2s",
              }}>
                <div style={{
                  width: "12px", height: "12px", borderRadius: "50%",
                  backgroundColor: "#fff", position: "absolute", top: "2px",
                  left: project.autoAdvance ? "18px" : "2px",
                  transition: "left 0.2s",
                }} />
              </div>
              <span style={{ fontSize: "12px", color: project.autoAdvance ? "#c4b5fd" : C.textMuted }}>
                Auto-advance
              </span>
            </div>
            <span style={{
              fontSize: "12px", color: "#c4b5fd", fontWeight: 600,
              padding: "4px 10px", borderRadius: "12px",
              backgroundColor: "#4c1d95",
            }}>
              Phase {project.phaseNumber || 1}
            </span>
            {project.sourceProjectId && (
              <span style={{ fontSize: "11px", color: C.textDim }}>
                (from {project.sourceProjectId.slice(0, 8)})
              </span>
            )}
          </div>

          {/* Decomposition Summary */}
          {project.decompositionSummary && (
            <Card>
              <Label>Decomposition Summary</Label>
              <p style={{ color: C.text, fontSize: "13px", lineHeight: "1.5", margin: 0 }}>
                {project.decompositionSummary}
              </p>
            </Card>
          )}

          {/* PRD Display */}
          {project.prdText ? (
            <Card>
              <Label>PRD</Label>
              <pre style={{
                color: C.text, fontSize: "13px", lineHeight: "1.5",
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                maxHeight: "300px", overflow: "auto", margin: 0,
              }}>
                {project.prdText}
              </pre>
            </Card>
          ) : (
            <Card style={{ border: "1px dashed #475569" }}>
              <span style={{ color: C.textDim }}>No PRD attached. Edit this project to add one.</span>
            </Card>
          )}
        </div>
      )}

      {/* Progress Log */}
      {(isPlanning || myProgress.length > 0) && (
        <Card style={{ marginBottom: "16px", borderColor: C.accent }}>
          <Label>Progress</Label>
          <div style={{ maxHeight: "150px", overflow: "auto" }}>
            {myProgress.map((evt, i) => (
              <div key={i} style={{ fontSize: "12px", color: C.textMuted, padding: "2px 0", fontFamily: "monospace" }}>
                <span style={{ color: C.textDim, marginRight: "8px" }}>
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
                {evt.message}
              </div>
            ))}
            {decomposing && myProgress.length === 0 && (
              <div style={{ fontSize: "12px", color: C.accent }}>Starting decomposition...</div>
            )}
          </div>
        </Card>
      )}

      {/* Build Jobs Section */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ margin: 0, color: C.textMuted, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Build Jobs {jobs.length > 0 && `(${jobs.length})`}
          </h3>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {canDecompose && (
              <Btn variant="primary" onClick={handleDecompose} disabled={decomposing}>
                {decomposing ? "Analyzing..." : (jobs.length > 0 ? "Re-Analyze PRD" : "Analyze PRD")}
              </Btn>
            )}
            {canStartPipeline && !isPipelineRunning && (
              <Btn variant="primary" onClick={handleStartPipeline} disabled={pipelineStarting}
                style={{ backgroundColor: "#059669" }}>
                {pipelineStarting ? "Starting..." : "Start Build"}
              </Btn>
            )}
            <Btn variant="ghost" onClick={() => setShowApiKeyConfig(true)} style={{ fontSize: "12px", padding: "6px 8px" }}>
              &#9881;
            </Btn>
          </div>
        </div>
        {jobs.length === 0 ? (
          <Card style={{ border: "1px dashed #475569", textAlign: "center", padding: "24px" }}>
            <span style={{ color: C.textDim }}>
              {project.prdText
                ? 'PRD attached. Click "Analyze PRD" to decompose into build jobs.'
                : "Add a PRD first, then analyze it to generate build jobs."}
            </span>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {jobs.map((job, i) => (
              <EditableJobCard
                key={job.id}
                job={job}
                index={i}
                onSave={(updates) => handleUpdateJob(job.id, updates)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cost Tracking */}
      {totalCost > 0 && (
        <Card style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Label>LLM Cost</Label>
            <span style={{ color: C.success, fontSize: "14px", fontWeight: 600 }}>
              ${totalCost.toFixed(4)}
            </span>
          </div>
          <div style={{ marginTop: "4px" }}>
            {(usage as LLMUsageRecord[]).map((u, i) => (
              <div key={i} style={{ fontSize: "11px", color: C.textDim }}>
                {u.model} ({u.purpose}) — {u.inputTokens.toLocaleString()} in / {u.outputTokens.toLocaleString()} out — ${u.estimatedCostUsd.toFixed(4)}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pipeline Controls */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ margin: 0, color: C.textMuted, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Pipeline
          </h3>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {isPipelineRunning && (
              <Btn variant="danger" onClick={handleCancelPipeline} disabled={cancelling}>
                {cancelling ? "Cancelling..." : "Cancel"}
              </Btn>
            )}
          </div>
        </div>

        {/* Pipeline status card */}
        {pipeline && (
          <Card style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <Badge label={pipeline.status} />
                <span style={{ fontSize: "12px", color: C.textMuted }}>
                  {(() => {
                    const steps = ["build", "review", "fix", "done"];
                    const labels: Record<string, string> = {
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
                  })()}
                </span>
              </div>
              <span style={{ fontSize: "11px", color: C.textDim }}>
                {pipeline.rtxPipelineId ? `RTX: ${pipeline.rtxPipelineId.slice(0, 8)}...` : ""}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: C.textDim }}>
              Started: {new Date(pipeline.startedAt).toLocaleString()}
              {pipeline.completedAt && (
                <span> | Completed: {new Date(pipeline.completedAt).toLocaleString()}</span>
              )}
            </div>
          </Card>
        )}

        {/* Pipeline event log */}
        {myPipelineEvents.length > 0 && (
          <Card style={{ borderColor: isPipelineRunning ? C.accent : C.border }}>
            <Label>Pipeline Events</Label>
            <div style={{ maxHeight: "250px", overflow: "auto" }}>
              {myPipelineEvents.map((evt, i) => (
                <div key={i} style={{ fontSize: "12px", color: C.textMuted, padding: "2px 0", fontFamily: "monospace" }}>
                  <span style={{ color: C.textDim, marginRight: "8px" }}>
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                  <span style={{
                    color: evt.type === "pipeline_complete" ? C.success
                      : evt.type === "pipeline_failed" ? "#f87171"
                      : C.text,
                  }}>
                    {evt.message}
                  </span>
                </div>
              ))}
              {isPipelineRunning && (
                <div style={{ fontSize: "12px", color: C.accent, padding: "4px 0" }}>
                  Pipeline running... (updates every 10s)
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Empty state */}
        {!pipeline && !canStartPipeline && jobs.length === 0 && (
          <Card style={{ border: "1px dashed #475569", textAlign: "center", padding: "24px" }}>
            <span style={{ color: C.textDim }}>
              Decompose a PRD into build jobs first, then start the pipeline.
            </span>
          </Card>
        )}
        {!pipeline && canStartPipeline && (
          <Card style={{ border: "1px dashed #475569", textAlign: "center", padding: "24px" }}>
            <span style={{ color: C.textDim }}>
              {jobs.length} jobs ready. Click "Start Build" to launch the pipeline on RTX.
            </span>
          </Card>
        )}
      </div>

      {/* Advancing State */}
      {isAdvancing && (
        <Card style={{ marginBottom: "16px", borderColor: "#7c3aed" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#c4b5fd", fontSize: "14px", fontWeight: 600 }}>
              Advancing to Phase {(project.phaseNumber || 1) + 1}...
            </span>
            <span style={{ color: C.textDim, fontSize: "12px" }}>
              Generating report and next-phase PRD on RTX
            </span>
          </div>
        </Card>
      )}

      {/* Phase Report */}
      {phaseReport && (
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ margin: "0 0 12px 0", color: C.textMuted, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Phase {phaseReport.phaseNumber} Report
          </h3>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ color: "#c4b5fd", fontSize: "13px", fontWeight: 600 }}>
                Phase {phaseReport.phaseNumber} → {phaseReport.nextPhase}
              </span>
              <span style={{ fontSize: "11px", color: C.textDim }}>
                {new Date(phaseReport.createdAt).toLocaleString()}
              </span>
            </div>
            {phaseReport.report && (
              <details style={{ marginBottom: "8px" }}>
                <summary style={{ cursor: "pointer", color: C.textMuted, fontSize: "12px", marginBottom: "4px" }}>
                  Completion Report ({phaseReport.report.length} chars)
                </summary>
                <pre style={{
                  color: C.text, fontSize: "11px", lineHeight: "1.4",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  maxHeight: "300px", overflow: "auto", margin: "4px 0",
                  padding: "8px", backgroundColor: "#0f172a", borderRadius: "4px",
                }}>
                  {phaseReport.report}
                </pre>
              </details>
            )}
            {phaseReport.nextPrd && (
              <details>
                <summary style={{ cursor: "pointer", color: C.textMuted, fontSize: "12px", marginBottom: "4px" }}>
                  Next Phase PRD ({phaseReport.nextPrd.length} chars)
                </summary>
                <pre style={{
                  color: C.text, fontSize: "11px", lineHeight: "1.4",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  maxHeight: "300px", overflow: "auto", margin: "4px 0",
                  padding: "8px", backgroundColor: "#0f172a", borderRadius: "4px",
                }}>
                  {phaseReport.nextPrd}
                </pre>
              </details>
            )}
            {phaseReport.nextProjectId && (
              <div style={{ marginTop: "8px", fontSize: "12px", color: "#c4b5fd" }}>
                Next project: {phaseReport.nextProjectId.slice(0, 8)}... (go back to project list to open it)
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Review Tiers */}
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: "0 0 12px 0", color: C.textMuted, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Review Tiers {reviews.length > 0 && `(${reviews.length} results)`}
        </h3>

        {reviews.length === 0 ? (
          <Card style={{ border: "1px dashed #475569", textAlign: "center", padding: "24px" }}>
            <span style={{ color: C.textDim }}>
              Review results will appear here during pipeline execution.
              {isPipelineRunning && " Pipeline is running..."}
            </span>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Group reviews by round */}
            {Array.from(new Set(reviews.map(r => r.round))).sort().map(round => {
              const roundReviews = reviews.filter(r => r.round === round);
              // Order: haiku, deepseek, codex
              const tierOrder: ReviewTier[] = ["haiku", "deepseek", "codex"];
              const sorted = tierOrder
                .map(t => roundReviews.find(r => r.tier === t))
                .filter((r): r is ReviewResult => !!r);

              return (
                <Card key={round} style={{ padding: "12px 16px" }}>
                  <div style={{ fontSize: "12px", color: C.textMuted, marginBottom: "8px", fontWeight: 600 }}>
                    Round {round}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {sorted.map(review => {
                      const tc = TIER_COLORS[review.tier] || TIER_COLORS.haiku;
                      const vc = VERDICT_COLORS[review.verdict] || VERDICT_COLORS.unknown;
                      return (
                        <div key={review.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "8px 12px", backgroundColor: "#0f172a", borderRadius: "6px",
                          border: `1px solid ${C.border}`,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{
                              padding: "2px 10px", borderRadius: "12px", fontSize: "11px",
                              fontWeight: 600, backgroundColor: tc.bg, color: tc.text,
                            }}>
                              {tc.label}
                            </span>
                            <span style={{ fontSize: "12px", color: C.textDim }}>
                              {new Date(review.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <span style={{
                            padding: "2px 10px", borderRadius: "12px", fontSize: "11px",
                            fontWeight: 600, backgroundColor: vc.bg, color: vc.text,
                            textTransform: "uppercase",
                          }}>
                            {review.verdict}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Projects View
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

  if (!parentProjectId) {
    return (
      <div style={{ padding: "24px", color: C.textMuted }}>
        Open a project to see its automation.
      </div>
    );
  }

  // Detail view
  if (selectedProjectId) {
    return (
      <div style={{ padding: "24px", color: C.text, fontFamily: "system-ui" }}>
        <ProjectDetailView
          projectId={selectedProjectId}
          parentProjectId={parentProjectId}
          onBack={() => { setSelectedProjectId(null); refresh(); }}
        />
      </div>
    );
  }

  // List view
  const handleCreate = async (data: { name: string; prdText: string; priority: ProjectPriority }) => {
    try {
      setActionError(null);
      const result = await createProjectAction({
        parentProjectId,
        name: data.name,
        prdText: data.prdText,
        priority: data.priority,
      }) as ManagedProject;
      setShowCreate(false);
      setSelectedProjectId(result.id);
      refresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to create project");
    }
  };

  return (
    <div style={{ padding: "24px", color: C.text, fontFamily: "system-ui", minHeight: "400px" }}>
      {actionError && <ErrorBanner message={actionError} />}

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "24px", paddingBottom: "16px", borderBottom: `1px solid ${C.border}`,
      }}>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#f1f5f9" }}>
          Projects
        </h2>
        <Btn onClick={() => setShowCreate(true)} variant="primary">+ New Project</Btn>
      </div>

      {showCreate && (
        <CreateProjectForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {loading && <div style={{ color: C.textMuted }}>Loading...</div>}
      {error && <ErrorBanner message={error.message} />}

      {projects && projects.length === 0 && !showCreate ? (
        <Card style={{ textAlign: "center", padding: "48px", border: "1px dashed #475569" }}>
          <div style={{ fontSize: "36px", marginBottom: "16px" }}>&#x1f680;</div>
          <div style={{ fontWeight: 600, marginBottom: "8px", color: "#cbd5e1" }}>No projects yet</div>
          <div style={{ color: C.textMuted }}>
            Click "+ New Project" to create one. Paste a PRD and let the system build it for you.
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {(projects || []).map((p) => (
            <Card key={p.id} onClick={() => setSelectedProjectId(p.id)} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ fontWeight: 600, fontSize: "15px", color: "#f1f5f9" }}>{p.name}</div>
                  <Badge label={p.priority} colors={PRIORITY_COLORS} />
                </div>
                <div style={{ fontSize: "12px", color: C.textDim, marginTop: "4px" }}>
                  {p.prdText ? `PRD: ${p.prdText.slice(0, 80)}...` : "No PRD attached"}
                </div>
              </div>
              <Badge label={p.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Exported Slot Components
// =============================================================================

export function AutomationSidebar({ context }: PluginProjectSidebarItemProps) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "10px 14px", color: C.text, fontSize: "14px", fontWeight: 500,
    }}>
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: "24px", height: "24px", borderRadius: "6px",
        backgroundColor: C.accent, color: "#fff", fontSize: "13px", fontWeight: 700, flexShrink: 0,
      }}>
        A
      </span>
      <span>Automation</span>
    </div>
  );
}

export function ProjectsTab({ context }: PluginDetailTabProps) {
  return <ProjectsView />;
}
