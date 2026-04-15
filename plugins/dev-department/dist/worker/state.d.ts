import type { PluginStateClient } from "@paperclipai/plugin-sdk";
import type { ManagedProject, BuildJob, PipelineRun, ReviewResult, LLMUsage } from "./types.js";
export declare function listProjects(state: PluginStateClient, parentProjectId: string): Promise<ManagedProject[]>;
export declare function getProject(state: PluginStateClient, parentProjectId: string, projectId: string): Promise<ManagedProject | null>;
export declare function createProject(state: PluginStateClient, parentProjectId: string, data: Omit<ManagedProject, "id" | "createdAt" | "updatedAt">): Promise<ManagedProject>;
export declare function updateProject(state: PluginStateClient, parentProjectId: string, projectId: string, data: Partial<ManagedProject>): Promise<ManagedProject>;
export declare function deleteProject(state: PluginStateClient, parentProjectId: string, projectId: string): Promise<void>;
export declare function getJobs(state: PluginStateClient, parentProjectId: string, projectId: string): Promise<BuildJob[]>;
export declare function setJobs(state: PluginStateClient, parentProjectId: string, projectId: string, jobs: BuildJob[]): Promise<void>;
export declare function updateJob(state: PluginStateClient, parentProjectId: string, projectId: string, jobId: string, data: Partial<BuildJob>): Promise<BuildJob>;
export declare function getPipelineRun(state: PluginStateClient, parentProjectId: string, projectId: string): Promise<PipelineRun | null>;
export declare function setPipelineRun(state: PluginStateClient, parentProjectId: string, projectId: string, run: PipelineRun): Promise<void>;
export declare function getReviews(state: PluginStateClient, parentProjectId: string, projectId: string): Promise<ReviewResult[]>;
export declare function addReview(state: PluginStateClient, parentProjectId: string, projectId: string, review: ReviewResult): Promise<void>;
export declare function getUsage(state: PluginStateClient, parentProjectId: string, projectId: string): Promise<LLMUsage[]>;
export declare function addUsage(state: PluginStateClient, parentProjectId: string, projectId: string, usage: LLMUsage): Promise<void>;
//# sourceMappingURL=state.d.ts.map