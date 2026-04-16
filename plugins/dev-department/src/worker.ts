import { definePlugin, startWorkerRpcHost } from "@paperclipai/plugin-sdk";
import type { ManagedProject, ProjectPriority } from "./worker/types.js";
import * as store from "./worker/state.js";
import { decomposePrd } from "./worker/prd-decomposer.js";

const plugin = definePlugin({
  async setup(ctx) {
    ctx.logger.info("project-automation: setting up");

    // ── Data handlers (usePluginData in UI) ──

    ctx.data.register("projects", async (params) => {
      const parentProjectId = params.parentProjectId as string;
      if (!parentProjectId) return [];
      return store.listProjects(ctx.state, parentProjectId);
    });

    ctx.data.register("project-detail", async (params) => {
      const parentProjectId = params.parentProjectId as string;
      const projectId = params.projectId as string;
      if (!parentProjectId || !projectId) return null;
      const project = await store.getProject(ctx.state, parentProjectId, projectId);
      if (!project) return null;
      const jobs = await store.getJobs(ctx.state, parentProjectId, projectId);
      const pipeline = await store.getPipelineRun(ctx.state, parentProjectId, projectId);
      const reviews = await store.getReviews(ctx.state, parentProjectId, projectId);
      const usage = await store.getUsage(ctx.state, parentProjectId, projectId);
      return { project, jobs, pipeline, reviews, usage };
    });

    ctx.data.register("agent-config", async (params) => {
      const parentProjectId = params.parentProjectId as string;
      if (!parentProjectId) return { decomposerAgentId: null };
      const config = await ctx.state.get({
        scopeKind: "project", scopeId: parentProjectId, namespace: "automation", stateKey: "agent-config",
      }) as { decomposerAgentId: string } | null;
      return config || { decomposerAgentId: null };
    });

    // ── Action handlers (usePluginAction in UI) ──

    ctx.actions.register("create-project", async (params) => {
      const parentProjectId = params.parentProjectId as string;
      const name = params.name as string;
      const prdText = (params.prdText as string) || "";
      const priority = (params.priority as ProjectPriority) || "P2";

      if (!parentProjectId) throw new Error("parentProjectId required");
      if (!name) throw new Error("Project name required");

      const project = await store.createProject(ctx.state, parentProjectId, {
        parentProjectId,
        name,
        prdText,
        priority,
        status: prdText ? "draft" : "draft",
        decompositionSummary: "",
      });

      ctx.logger.info("project-automation: created project", { projectId: project.id, name });
      return project;
    });

    ctx.actions.register("update-project", async (params) => {
      const parentProjectId = params.parentProjectId as string;
      const projectId = params.projectId as string;
      const updates = params.updates as Partial<ManagedProject>;

      if (!parentProjectId || !projectId) throw new Error("parentProjectId and projectId required");

      const updated = await store.updateProject(ctx.state, parentProjectId, projectId, updates);
      ctx.logger.info("project-automation: updated project", { projectId });
      return updated;
    });

    ctx.actions.register("delete-project", async (params) => {
      const parentProjectId = params.parentProjectId as string;
      const projectId = params.projectId as string;

      if (!parentProjectId || !projectId) throw new Error("parentProjectId and projectId required");

      await store.deleteProject(ctx.state, parentProjectId, projectId);
      ctx.logger.info("project-automation: deleted project", { projectId });
      return { ok: true };
    });

    ctx.actions.register("save-agent-config", async (params) => {
      const parentProjectId = params.parentProjectId as string;
      const decomposerAgentId = params.decomposerAgentId as string;
      if (!parentProjectId) throw new Error("parentProjectId required");
      await ctx.state.set(
        { scopeKind: "project", scopeId: parentProjectId, namespace: "automation", stateKey: "agent-config" },
        { decomposerAgentId },
      );
      ctx.logger.info("project-automation: saved agent config", { parentProjectId, decomposerAgentId });
      return { ok: true };
    });

    ctx.actions.register("update-job", async (params) => {
      const parentProjectId = params.parentProjectId as string;
      const projectId = params.projectId as string;
      const jobId = params.jobId as string;
      const updates = params.updates as Partial<{ name: string; description: string; targetFiles: string[] }>;

      if (!parentProjectId || !projectId || !jobId) throw new Error("parentProjectId, projectId, and jobId required");

      const updated = await store.updateJob(ctx.state, parentProjectId, projectId, jobId, updates);
      ctx.logger.info("project-automation: updated job", { projectId, jobId });
      return updated;
    });

    // ── Phase 2: PRD Decomposition via PopeBot Agent ──

    ctx.actions.register("decompose-prd", async (params) => {
      const parentProjectId = params.parentProjectId as string;
      const projectId = params.projectId as string;
      const agentId = params.agentId as string;
      const companyId = params.companyId as string;

      if (!parentProjectId || !projectId) throw new Error("parentProjectId and projectId required");
      if (!agentId) throw new Error("agentId required — configure PRD Decomposer agent in PopeBot");
      if (!companyId) throw new Error("companyId required");

      const project = await store.getProject(ctx.state, parentProjectId, projectId);
      if (!project) throw new Error("Project not found: " + projectId);
      if (!project.prdText) throw new Error("Project has no PRD text");

      // Update project status
      await store.updateProject(ctx.state, parentProjectId, projectId, { status: "planning" });

      // Stream progress to UI
      const emit = (message: string) => {
        ctx.streams.emit("pipeline-progress", {
          type: "progress",
          projectId,
          message,
          timestamp: new Date().toISOString(),
        });
      };

      try {
        emit("Sending PRD to decomposer agent...");

        const result = await decomposePrd(
          { agents: ctx.agents, streams: ctx.streams },
          agentId,
          companyId,
          projectId,
          project.prdText,
          emit,
        );

        // Save build jobs
        await store.setJobs(ctx.state, parentProjectId, projectId, result.jobs);

        // Update project status and summary
        await store.updateProject(ctx.state, parentProjectId, projectId, {
          status: "ready",
          decompositionSummary: result.summary,
        });

        emit(`Decomposition complete — ${result.jobs.length} build jobs created.`);

        ctx.logger.info("project-automation: PRD decomposed", {
          projectId,
          jobCount: result.jobs.length,
        });

        return {
          jobCount: result.jobs.length,
          summary: result.summary,
        };
      } catch (err: any) {
        await store.updateProject(ctx.state, parentProjectId, projectId, { status: "failed" });
        emit(`Decomposition failed: ${err.message}`);
        ctx.logger.error("project-automation: decomposition failed", { projectId, error: err.message });
        throw err;
      }
    });

    ctx.logger.info("project-automation: setup complete");
  },

  async onHealth() {
    return { status: "ok", message: "Project Automation plugin ready" };
  },
});

export default plugin;
// Use startWorkerRpcHost directly — runWorker's main-module check
// fails when Paperclip loads the worker via its own bootstrap process
startWorkerRpcHost({ plugin });
