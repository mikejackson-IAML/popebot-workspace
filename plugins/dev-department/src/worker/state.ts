// =============================================================================
// Async State Store — backed by Paperclip ctx.state
// =============================================================================
import type { PluginStateClient, ScopeKey } from "@paperclipai/plugin-sdk";
import type {
  ManagedProject,
  BuildJob,
  PipelineRun,
  PipelineEvent,
  ReviewResult,
  LLMUsage,
  PhaseReport,
} from "./types.js";

const NS = "automation";

function key(
  parentProjectId: string,
  stateKey: string
): ScopeKey {
  return {
    scopeKind: "project",
    scopeId: parentProjectId,
    namespace: NS,
    stateKey,
  };
}

// =============================================================================
// Project CRUD
// =============================================================================

export async function listProjects(
  state: PluginStateClient,
  parentProjectId: string
): Promise<ManagedProject[]> {
  const index = (await state.get(key(parentProjectId, "project-index"))) as string[] | null;
  if (!index || index.length === 0) return [];
  const projects: ManagedProject[] = [];
  for (const id of index) {
    const p = (await state.get(key(parentProjectId, `project:${id}`))) as ManagedProject | null;
    if (p) projects.push(p);
  }
  return projects;
}

export async function getProject(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string
): Promise<ManagedProject | null> {
  return (await state.get(key(parentProjectId, `project:${projectId}`))) as ManagedProject | null;
}

export async function createProject(
  state: PluginStateClient,
  parentProjectId: string,
  data: Omit<ManagedProject, "id" | "createdAt" | "updatedAt">
): Promise<ManagedProject> {
  const now = new Date().toISOString();
  const project: ManagedProject = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  await state.set(key(parentProjectId, `project:${project.id}`), project);
  const index = ((await state.get(key(parentProjectId, "project-index"))) as string[] | null) || [];
  index.push(project.id);
  await state.set(key(parentProjectId, "project-index"), index);
  return project;
}

export async function updateProject(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string,
  data: Partial<ManagedProject>
): Promise<ManagedProject> {
  const existing = await getProject(state, parentProjectId, projectId);
  if (!existing) throw new Error("Project not found: " + projectId);
  const updated: ManagedProject = {
    ...existing,
    ...data,
    id: existing.id,
    parentProjectId: existing.parentProjectId,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await state.set(key(parentProjectId, `project:${projectId}`), updated);
  return updated;
}

export async function deleteProject(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string
): Promise<void> {
  await state.delete(key(parentProjectId, `project:${projectId}`));
  const index = ((await state.get(key(parentProjectId, "project-index"))) as string[] | null) || [];
  const filtered = index.filter((id) => id !== projectId);
  await state.set(key(parentProjectId, "project-index"), filtered);
  // Cascade: delete jobs, pipeline runs, reviews, usage
  await state.delete(key(parentProjectId, `jobs:${projectId}`));
  await state.delete(key(parentProjectId, `pipeline:${projectId}`));
  await state.delete(key(parentProjectId, `reviews:${projectId}`));
  await state.delete(key(parentProjectId, `usage:${projectId}`));
}

// =============================================================================
// Build Jobs
// =============================================================================

export async function getJobs(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string
): Promise<BuildJob[]> {
  return ((await state.get(key(parentProjectId, `jobs:${projectId}`))) as BuildJob[] | null) || [];
}

export async function setJobs(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string,
  jobs: BuildJob[]
): Promise<void> {
  await state.set(key(parentProjectId, `jobs:${projectId}`), jobs);
}

export async function updateJob(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string,
  jobId: string,
  data: Partial<BuildJob>
): Promise<BuildJob> {
  const jobs = await getJobs(state, parentProjectId, projectId);
  const idx = jobs.findIndex((j) => j.id === jobId);
  if (idx === -1) throw new Error("Job not found: " + jobId);
  jobs[idx] = { ...jobs[idx], ...data, id: jobs[idx].id, projectId: jobs[idx].projectId };
  await setJobs(state, parentProjectId, projectId, jobs);
  return jobs[idx];
}

// =============================================================================
// Pipeline Runs
// =============================================================================

export async function getPipelineRun(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string
): Promise<PipelineRun | null> {
  return (await state.get(key(parentProjectId, `pipeline:${projectId}`))) as PipelineRun | null;
}

export async function setPipelineRun(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string,
  run: PipelineRun
): Promise<void> {
  await state.set(key(parentProjectId, `pipeline:${projectId}`), run);
}

// =============================================================================
// Pipeline Events
// =============================================================================

export async function getPipelineEvents(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string
): Promise<PipelineEvent[]> {
  return ((await state.get(key(parentProjectId, `pipeline-events:${projectId}`))) as PipelineEvent[] | null) || [];
}

export async function addPipelineEvent(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string,
  event: PipelineEvent
): Promise<void> {
  const events = await getPipelineEvents(state, parentProjectId, projectId);
  events.push(event);
  await state.set(key(parentProjectId, `pipeline-events:${projectId}`), events);
}

export async function clearPipelineEvents(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string
): Promise<void> {
  await state.set(key(parentProjectId, `pipeline-events:${projectId}`), []);
}

// =============================================================================
// Reviews
// =============================================================================

export async function getReviews(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string
): Promise<ReviewResult[]> {
  return ((await state.get(key(parentProjectId, `reviews:${projectId}`))) as ReviewResult[] | null) || [];
}

export async function addReview(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string,
  review: ReviewResult
): Promise<void> {
  const reviews = await getReviews(state, parentProjectId, projectId);
  reviews.push(review);
  await state.set(key(parentProjectId, `reviews:${projectId}`), reviews);
}

// =============================================================================
// Phase Reports
// =============================================================================

export async function getPhaseReport(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string
): Promise<PhaseReport | null> {
  return (await state.get(key(parentProjectId, `phase-report:${projectId}`))) as PhaseReport | null;
}

export async function setPhaseReport(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string,
  report: PhaseReport
): Promise<void> {
  await state.set(key(parentProjectId, `phase-report:${projectId}`), report);
}

// =============================================================================
// LLM Usage / Cost Tracking
// =============================================================================

export async function getUsage(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string
): Promise<LLMUsage[]> {
  return ((await state.get(key(parentProjectId, `usage:${projectId}`))) as LLMUsage[] | null) || [];
}

export async function addUsage(
  state: PluginStateClient,
  parentProjectId: string,
  projectId: string,
  usage: LLMUsage
): Promise<void> {
  const existing = await getUsage(state, parentProjectId, projectId);
  existing.push(usage);
  await state.set(key(parentProjectId, `usage:${projectId}`), existing);
}
