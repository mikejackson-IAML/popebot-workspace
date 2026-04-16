import { useState } from "react";
import type {
  PluginProjectSidebarItemProps,
  PluginDetailTabProps,
} from "@paperclipai/plugin-sdk/ui";
import {
  usePluginData,
  usePluginAction,
  useHostContext,
  usePluginStream,
} from "@paperclipai/plugin-sdk/ui";

// =============================================================================
// Types (mirror worker/types.ts for UI)
// =============================================================================

type ProjectStatus = "draft" | "planning" | "ready" | "building" | "reviewing" | "complete" | "failed";
type ProjectPriority = "P0" | "P1" | "P2" | "P3";

interface ManagedProject {
  id: string;
  parentProjectId: string;
  name: string;
  prdText: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  decompositionSummary: string;
  createdAt: string;
  updatedAt: string;
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

interface ProjectDetail {
  project: ManagedProject;
  jobs: BuildJob[];
  pipeline: unknown;
  reviews: unknown[];
  usage: LLMUsageRecord[];
}

interface PipelineProgressEvent {
  type: string;
  projectId: string;
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
  failed: { bg: "#7f1d1d", text: "#f87171" },
  // job statuses
  pending: { bg: "#374151", text: "#9ca3af" },
  dispatched: { bg: "#1e3a5f", text: "#60a5fa" },
  merged: { bg: "#14532d", text: "#4ade80" },
  skipped: { bg: "#1f2937", text: "#6b7280" },
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
  const { data, loading, error, refresh } = usePluginData<ProjectDetail>("project-detail", {
    parentProjectId,
    projectId,
  });

  const updateProject = usePluginAction("update-project");
  const deleteProjectAction = usePluginAction("delete-project");
  const decomposePrdAction = usePluginAction("decompose-prd");
  const updateJobAction = usePluginAction("update-job");
  const saveApiKeyAction = usePluginAction("save-api-key");

  const { data: apiKeyStatus, refresh: refreshApiKey } = usePluginData<{ configured: boolean }>("api-key-status", {});
  const { events: progressEvents } = usePluginStream<PipelineProgressEvent>("pipeline-progress");

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPrd, setEditPrd] = useState("");
  const [editPriority, setEditPriority] = useState<ProjectPriority>("P2");
  const [actionError, setActionError] = useState<string | null>(null);
  const [decomposing, setDecomposing] = useState(false);
  const [showApiKeyConfig, setShowApiKeyConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  if (loading) return <div style={{ padding: "24px", color: C.textMuted }}>Loading...</div>;
  if (error) return <ErrorBanner message={error.message} />;
  if (!data) return <ErrorBanner message="Project not found" />;

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
      refresh();
    } catch (err: any) {
      setActionError(err.message || "Decomposition failed");
    } finally {
      setDecomposing(false);
    }
  };

  const handleSaveApiKey = async () => {
    try {
      await saveApiKeyAction({ apiKey: apiKeyInput });
      setShowApiKeyConfig(false);
      setApiKeyInput("");
      setActionError(null);
      refreshApiKey();
    } catch (err: any) {
      setActionError(err.message || "Failed to save API key");
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

  // Calculate total cost
  const totalCost = (usage as LLMUsageRecord[]).reduce((sum, u) => sum + u.estimatedCostUsd, 0);

  const canDecompose = project.prdText && (project.status === "draft" || project.status === "failed");

  return (
    <div>
      {actionError && <ErrorBanner message={actionError} />}

      {/* API Key Config Panel */}
      {showApiKeyConfig && (
        <Card style={{ marginBottom: "16px", borderColor: C.accent }}>
          <h4 style={{ margin: "0 0 8px 0", color: C.text, fontSize: "14px" }}>Anthropic API Key</h4>
          <p style={{ color: C.textMuted, fontSize: "12px", margin: "0 0 8px 0" }}>
            Enter your API key from console.anthropic.com. Used for Opus PRD decomposition.
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
            <Btn variant="ghost" onClick={() => setShowApiKeyConfig(false)}>Cancel</Btn>
          </div>
          {apiKeyStatus?.configured && (
            <div style={{ marginTop: "6px", fontSize: "11px", color: C.success }}>Key already configured. Enter a new one to replace it.</div>
          )}
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
          <div style={{ display: "flex", gap: "8px" }}>
            <Btn onClick={startEditing} variant="default">Edit Project</Btn>
            <Btn onClick={handleDelete} variant="danger">Delete</Btn>
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

      {/* Streaming Progress */}
      {(decomposing || myProgress.length > 0) && (
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

      {/* Pipeline section placeholder */}
      <Card style={{ border: "1px dashed #475569", marginBottom: "12px" }}>
        <span style={{ color: C.textDim, fontSize: "13px" }}>Pipeline execution — coming in Phase 3</span>
      </Card>

      {/* Reviews placeholder */}
      <Card style={{ border: "1px dashed #475569" }}>
        <span style={{ color: C.textDim, fontSize: "13px" }}>Reviews and cost tracking — coming in Phase 4</span>
      </Card>
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
