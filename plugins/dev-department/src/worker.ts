import { definePlugin, startWorkerRpcHost } from "@paperclipai/plugin-sdk";
import type { ManagedProject, ProjectPriority, LLMUsage } from "./worker/types.js";
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

    ctx.data.register("progress-log", async (params) => {
      const parentProjectId = params.parentProjectId as string;
      const projectId = params.projectId as string;
      if (!parentProjectId || !projectId) return [];
      const log = await ctx.state.get({
        scopeKind: "project", scopeId: parentProjectId, namespace: "automation",
        stateKey: `progress:${projectId}`,
      }) as Array<{ message: string; timestamp: string }> | null;
      return log || [];
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
        status: "draft",
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

    ctx.data.register("api-key-status", async () => {
      const config = await ctx.state.get({
        scopeKind: "instance", stateKey: "anthropic-api-key", namespace: "automation",
      }) as { key: string } | null;
      return { configured: !!config?.key };
    });

    ctx.actions.register("save-api-key", async (params) => {
      const apiKey = params.apiKey as string;
      if (!apiKey?.trim()) throw new Error("API key required");
      await ctx.state.set(
        { scopeKind: "instance", stateKey: "anthropic-api-key", namespace: "automation" },
        { key: apiKey.trim() },
      );
      ctx.logger.info("project-automation: API key saved");
      return { ok: true };
    });

    // ── Phase 2: PRD Decomposition (Opus via Anthropic API) ──

    ctx.actions.register("decompose-prd", async (params) => {
      const parentProjectId = params.parentProjectId as string;
      const projectId = params.projectId as string;

      if (!parentProjectId || !projectId) throw new Error("parentProjectId and projectId required");

      const project = await store.getProject(ctx.state, parentProjectId, projectId);
      if (!project) throw new Error("Project not found: " + projectId);
      if (!project.prdText) throw new Error("Project has no PRD text");

      // Read API key before going async
      const apiKeyConfig = await ctx.state.get({
        scopeKind: "instance", stateKey: "anthropic-api-key", namespace: "automation",
      }) as { key: string } | null;
      if (!apiKeyConfig?.key) {
        throw new Error("Anthropic API key not configured. Click the gear icon on Build Jobs to set it.");
      }

      // Update project status
      await store.updateProject(ctx.state, parentProjectId, projectId, { status: "planning" });

      // Write progress to state (UI reads via usePluginData)
      const progressKey = {
        scopeKind: "project" as const, scopeId: parentProjectId, namespace: "automation",
        stateKey: `progress:${projectId}`,
      };
      // Clear previous progress log
      await ctx.state.set(progressKey, []);

      const emit = async (message: string) => {
        const log = (await ctx.state.get(progressKey) as Array<{ message: string; timestamp: string }> | null) || [];
        log.push({ message, timestamp: new Date().toISOString() });
        await ctx.state.set(progressKey, log);
      };

      await emit("Starting PRD decomposition with Sonnet...");

      // Fire-and-forget: run decomposition in background so the action
      // returns immediately (avoids Paperclip's 30s RPC timeout).
      // Progress and results are streamed/saved via state + events.
      const prdText = project.prdText;
      const apiKey = apiKeyConfig.key;

      (async () => {
        try {
          const result = await decomposePrd(
            { http: ctx.http, apiKey },
            projectId,
            prdText,
            emit,
          );

          // Save build jobs
          await store.setJobs(ctx.state, parentProjectId, projectId, result.jobs);

          // Save usage record
          const usageEntry: LLMUsage = {
            id: crypto.randomUUID(),
            projectId,
            model: result.usageRecord.model as LLMUsage["model"],
            purpose: result.usageRecord.purpose as LLMUsage["purpose"],
            inputTokens: result.usageRecord.inputTokens,
            outputTokens: result.usageRecord.outputTokens,
            estimatedCostUsd: result.usageRecord.estimatedCostUsd,
            timestamp: new Date().toISOString(),
          };
          await store.addUsage(ctx.state, parentProjectId, projectId, usageEntry);

          // Update project status and summary
          await store.updateProject(ctx.state, parentProjectId, projectId, {
            status: "ready",
            decompositionSummary: result.summary,
          });

          await emit(`Decomposition complete — ${result.jobs.length} build jobs created. Cost: $${usageEntry.estimatedCostUsd.toFixed(4)}`);

          ctx.logger.info("project-automation: PRD decomposed", {
            projectId,
            jobCount: result.jobs.length,
            cost: usageEntry.estimatedCostUsd,
          });
        } catch (err: any) {
          await store.updateProject(ctx.state, parentProjectId, projectId, { status: "failed" });
          await emit(`Decomposition failed: ${err.message}`);
          ctx.logger.error("project-automation: decomposition failed", { projectId, error: err.message });
        }
      })();

      // Return immediately — UI will see progress via stream and refresh for results
      return { started: true, projectId };
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
