// =============================================================================
// Project Automation Plugin — Data Model
// =============================================================================

// -- Project status lifecycle --
export type ProjectStatus = "draft" | "planning" | "ready" | "building" | "reviewing" | "complete" | "failed";
export type ProjectPriority = "P0" | "P1" | "P2" | "P3";

// -- Build job status --
export type BuildJobStatus = "pending" | "dispatched" | "building" | "merged" | "failed" | "skipped";

// -- Build job type (determines which agent handles it) --
export type BuildJobType = "code" | "workflow" | "config" | "schema";

// -- Pipeline status --
export type PipelineStatus = "queued" | "building" | "reviewing" | "fixing" | "complete" | "failed" | "cancelled";
export type PipelineStep = "build" | "review" | "fix" | "advance";

// -- Review --
export type ReviewTier = "haiku" | "deepseek" | "codex";
export type ReviewVerdict = "approve" | "request-changes" | "block" | "pass" | "concerns" | "unknown";

// -- LLM model identifiers --
export type LLMModel = "opus" | "sonnet" | "haiku" | "deepseek" | "codex";
export type LLMPurpose =
  | "prd_decomposition"
  | "build"
  | "review_quick"
  | "review_adversarial"
  | "review_deep"
  | "fix_planning"
  | "phase_report"
  | "phase_advance";

// =============================================================================
// Core Entities
// =============================================================================

/** A managed project within a Paperclip parent project */
export interface ManagedProject {
  id: string;
  /** Paperclip project ID this belongs to */
  parentProjectId: string;
  name: string;
  /** Full PRD text pasted by the user */
  prdText: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  /** Summary generated after PRD decomposition */
  decompositionSummary: string;
  createdAt: string;
  updatedAt: string;
}

/** A single build job decomposed from a PRD by Opus */
export interface BuildJob {
  id: string;
  projectId: string;
  name: string;
  description: string;
  /** Files this job will create or modify (max 3) */
  targetFiles: string[];
  /** IDs of other BuildJobs that must complete first */
  dependencies: string[];
  /** Job type — determines routing: code→Builder, workflow→Workflow Builder */
  jobType: BuildJobType;
  status: BuildJobStatus;
  /** PopeBot agent_job_id after dispatch */
  popebotJobId: string | null;
  /** GitHub PR URL if created */
  prUrl: string | null;
  dispatchedAt: string | null;
  completedAt: string | null;
}

/** A pipeline execution run for a project */
export interface PipelineRun {
  id: string;
  projectId: string;
  status: PipelineStatus;
  currentStep: PipelineStep;
  reviewRound: number;
  maxReviewRounds: number;
  /** ID returned from RTX orchestrator */
  rtxPipelineId: string | null;
  startedAt: string;
  completedAt: string | null;
}

/** An event emitted during pipeline execution */
export interface PipelineEvent {
  type:
    | "build_started"
    | "build_dispatched"
    | "build_merged"
    | "build_failed"
    | "review_started"
    | "review_complete"
    | "fix_started"
    | "fix_applied"
    | "pipeline_complete"
    | "pipeline_failed"
    | "progress";
  projectId: string;
  pipelineRunId: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

/** Review result from any tier */
export interface ReviewResult {
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

/** LLM usage record for cost tracking */
export interface LLMUsage {
  id: string;
  projectId: string;
  model: LLMModel;
  purpose: LLMPurpose;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  timestamp: string;
}
