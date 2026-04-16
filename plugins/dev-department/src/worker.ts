import { definePlugin, startWorkerRpcHost } from "@paperclipai/plugin-sdk";
import type { ManagedProject, ProjectPriority, PipelineEvent, LLMUsage } from "./worker/types.js";
import * as store from "./worker/state.js";
import { decomposePrd } from "./worker/prd-decomposer.js";

// RTX Pipeline Orchestrator (Tailscale)
const RTX_ORCHESTRATOR_URL = "http://mike-hp-z8-g4-workstation.tail0c39ca.ts.net:11438";

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

    // ── Pipeline events data handler ──

    ctx.data.register("pipeline-events", async (params) => {
      const parentProjectId = params.parentProjectId as string;
      const projectId = params.projectId as string;
      if (!parentProjectId || !projectId) return [];
      return store.getPipelineEvents(ctx.state, parentProjectId, projectId);
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

    // ── Phase 3: RTX Pipeline Orchestrator Bridge ──

    ctx.actions.register("start-pipeline", async (params) => {
      const parentProjectId = params.parentProjectId as string;
      const projectId = params.projectId as string;
      const reviewDir = (params.reviewDir as string) || "plugins/dev-department";
      const phaseScope = (params.phaseScope as string) || "";

      if (!parentProjectId || !projectId) throw new Error("parentProjectId and projectId required");

      const project = await store.getProject(ctx.state, parentProjectId, projectId);
      if (!project) throw new Error("Project not found: " + projectId);

      const jobs = await store.getJobs(ctx.state, parentProjectId, projectId);
      if (jobs.length === 0) throw new Error("No build jobs — decompose the PRD first");

      // Read API key for RTX orchestrator auth
      const apiKeyConfig = await ctx.state.get({
        scopeKind: "instance", stateKey: "rtx-api-key", namespace: "automation",
      }) as { key: string } | null;

      // Clear previous pipeline events
      await store.clearPipelineEvents(ctx.state, parentProjectId, projectId);

      // Update project status
      await store.updateProject(ctx.state, parentProjectId, projectId, { status: "building" });

      // Mark all pending jobs as dispatched
      for (const job of jobs) {
        if (job.status === "pending") {
          await store.updateJob(ctx.state, parentProjectId, projectId, job.id, {
            status: "dispatched",
            dispatchedAt: new Date().toISOString(),
          });
        }
      }

      // Capture for closure
      const rtxApiKey = apiKeyConfig?.key || "";
      const jobsPayload = jobs.filter(j => j.status === "pending" || j.status === "dispatched").map(j => ({
        id: j.id,
        name: j.name,
        description: j.description,
        targetFiles: j.targetFiles,
        jobType: j.jobType,
      }));

      // Fire-and-forget: call RTX orchestrator and start polling
      (async () => {
        try {
          const headers: Record<string, string> = { "content-type": "application/json" };
          if (rtxApiKey) headers["x-api-key"] = rtxApiKey;

          const startRes = await ctx.http.fetch(`${RTX_ORCHESTRATOR_URL}/pipeline/start`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              projectId,
              jobs: jobsPayload,
              reviewDir,
              phaseScope,
            }),
          });

          if (!startRes.ok) {
            const errText = await startRes.text();
            throw new Error(`RTX orchestrator ${startRes.status}: ${errText}`);
          }

          const startData = await startRes.json() as { pipelineId: string };
          const rtxPipelineId = startData.pipelineId;

          // Save pipeline run
          const pipelineRun = {
            id: crypto.randomUUID(),
            projectId,
            status: "building" as const,
            currentStep: "build" as const,
            reviewRound: 0,
            maxReviewRounds: 2,
            rtxPipelineId,
            startedAt: new Date().toISOString(),
            completedAt: null,
          };
          await store.setPipelineRun(ctx.state, parentProjectId, projectId, pipelineRun);

          await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
            type: "build_started",
            projectId,
            pipelineRunId: pipelineRun.id,
            message: `Pipeline started (RTX ID: ${rtxPipelineId})`,
            timestamp: new Date().toISOString(),
          });

          ctx.logger.info("project-automation: pipeline started", { projectId, rtxPipelineId });

          // Background polling loop — check status every 10s until done
          let eventsSeen = 0;
          let done = false;

          while (!done) {
            await new Promise(r => setTimeout(r, 10_000));

            try {
              const statusRes = await ctx.http.fetch(
                `${RTX_ORCHESTRATOR_URL}/pipeline/${rtxPipelineId}/status?since=${eventsSeen}`,
                { method: "GET", headers },
              );

              if (!statusRes.ok) continue;

              const statusData = await statusRes.json() as {
                status: string;
                currentStep: string;
                events: Array<{ type: string; message: string; timestamp: string }>;
                totalEvents: number;
              };

              // Write new events to state
              for (const evt of statusData.events) {
                await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                  type: evt.type as PipelineEvent["type"],
                  projectId,
                  pipelineRunId: pipelineRun.id,
                  message: evt.message,
                  timestamp: evt.timestamp,
                });
              }
              eventsSeen = statusData.totalEvents;

              // Update pipeline run status
              const stepMap: Record<string, "build" | "review" | "fix" | "advance"> = {
                build: "build", review: "review", fix: "fix", advance: "advance",
              };
              const currentStep = stepMap[statusData.currentStep] || pipelineRun.currentStep;

              await store.setPipelineRun(ctx.state, parentProjectId, projectId, {
                ...pipelineRun,
                status: statusData.status === "complete" ? "complete"
                  : statusData.status === "failed" ? "failed"
                  : statusData.status === "cancelled" ? "cancelled"
                  : "building",
                currentStep,
                completedAt: ["complete", "failed", "cancelled"].includes(statusData.status)
                  ? new Date().toISOString() : null,
              });

              // Update project status
              if (statusData.status === "complete") {
                await store.updateProject(ctx.state, parentProjectId, projectId, { status: "complete" });
                done = true;
              } else if (statusData.status === "failed") {
                await store.updateProject(ctx.state, parentProjectId, projectId, { status: "failed" });
                done = true;
              } else if (statusData.status === "cancelled") {
                await store.updateProject(ctx.state, parentProjectId, projectId, { status: "ready" });
                done = true;
              }
            } catch (pollErr: any) {
              ctx.logger.error("project-automation: poll error", { error: pollErr.message });
              // Keep polling — transient network errors shouldn't kill the loop
            }
          }

          ctx.logger.info("project-automation: pipeline finished", { projectId, rtxPipelineId });

        } catch (err: any) {
          await store.updateProject(ctx.state, parentProjectId, projectId, { status: "failed" });
          await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
            type: "pipeline_failed",
            projectId,
            pipelineRunId: "unknown",
            message: `Failed to start pipeline: ${err.message}`,
            timestamp: new Date().toISOString(),
          });
          ctx.logger.error("project-automation: pipeline start failed", { projectId, error: err.message });
        }
      })();

      return { started: true, projectId };
    });

    ctx.actions.register("cancel-pipeline", async (params) => {
      const parentProjectId = params.parentProjectId as string;
      const projectId = params.projectId as string;

      if (!parentProjectId || !projectId) throw new Error("parentProjectId and projectId required");

      const pipeline = await store.getPipelineRun(ctx.state, parentProjectId, projectId);
      if (!pipeline?.rtxPipelineId) throw new Error("No active pipeline to cancel");

      const apiKeyConfig = await ctx.state.get({
        scopeKind: "instance", stateKey: "rtx-api-key", namespace: "automation",
      }) as { key: string } | null;

      const headers: Record<string, string> = { "content-type": "application/json" };
      if (apiKeyConfig?.key) headers["x-api-key"] = apiKeyConfig.key;

      const res = await ctx.http.fetch(
        `${RTX_ORCHESTRATOR_URL}/pipeline/${pipeline.rtxPipelineId}/cancel`,
        { method: "POST", headers },
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Cancel failed: ${errText}`);
      }

      await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
        type: "pipeline_failed",
        projectId,
        pipelineRunId: pipeline.id,
        message: "Pipeline cancelled by user",
        timestamp: new Date().toISOString(),
      });

      ctx.logger.info("project-automation: pipeline cancelled", { projectId });
      return { cancelled: true };
    });

    // ── RTX API key config (separate from Anthropic key) ──

    ctx.data.register("rtx-key-status", async () => {
      const config = await ctx.state.get({
        scopeKind: "instance", stateKey: "rtx-api-key", namespace: "automation",
      }) as { key: string } | null;
      return { configured: !!config?.key };
    });

    ctx.actions.register("save-rtx-key", async (params) => {
      const apiKey = params.apiKey as string;
      if (!apiKey?.trim()) throw new Error("API key required");
      await ctx.state.set(
        { scopeKind: "instance", stateKey: "rtx-api-key", namespace: "automation" },
        { key: apiKey.trim() },
      );
      ctx.logger.info("project-automation: RTX API key saved");
      return { ok: true };
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
