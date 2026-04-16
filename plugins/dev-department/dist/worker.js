import { definePlugin, startWorkerRpcHost } from "@paperclipai/plugin-sdk";
import * as store from "./worker/state.js";
import { decomposePrd } from "./worker/prd-decomposer.js";
// RTX Pipeline Orchestrator (Tailscale)
const RTX_ORCHESTRATOR_URL = "http://mike-hp-z8-g4-workstation.tail0c39ca.ts.net:11438";
const plugin = definePlugin({
    async setup(ctx) {
        ctx.logger.info("project-automation: setting up");
        // ── Data handlers (usePluginData in UI) ──
        ctx.data.register("projects", async (params) => {
            const parentProjectId = params.parentProjectId;
            if (!parentProjectId)
                return [];
            return store.listProjects(ctx.state, parentProjectId);
        });
        ctx.data.register("project-detail", async (params) => {
            const parentProjectId = params.parentProjectId;
            const projectId = params.projectId;
            if (!parentProjectId || !projectId)
                return null;
            const project = await store.getProject(ctx.state, parentProjectId, projectId);
            if (!project)
                return null;
            const jobs = await store.getJobs(ctx.state, parentProjectId, projectId);
            const pipeline = await store.getPipelineRun(ctx.state, parentProjectId, projectId);
            const reviews = await store.getReviews(ctx.state, parentProjectId, projectId);
            const usage = await store.getUsage(ctx.state, parentProjectId, projectId);
            return { project, jobs, pipeline, reviews, usage };
        });
        ctx.data.register("progress-log", async (params) => {
            const parentProjectId = params.parentProjectId;
            const projectId = params.projectId;
            if (!parentProjectId || !projectId)
                return [];
            const log = await ctx.state.get({
                scopeKind: "project", scopeId: parentProjectId, namespace: "automation",
                stateKey: `progress:${projectId}`,
            });
            return log || [];
        });
        // ── Action handlers (usePluginAction in UI) ──
        ctx.actions.register("create-project", async (params) => {
            const parentProjectId = params.parentProjectId;
            const name = params.name;
            const prdText = params.prdText || "";
            const priority = params.priority || "P2";
            if (!parentProjectId)
                throw new Error("parentProjectId required");
            if (!name)
                throw new Error("Project name required");
            const phaseNumber = params.phaseNumber || 1;
            const autoAdvance = params.autoAdvance || false;
            const sourceProjectId = params.sourceProjectId || null;
            const repoUrl = params.repoUrl || "mikejackson-IAML/popebot-workspace";
            const reviewDir = params.reviewDir || "plugins/dev-department";
            const project = await store.createProject(ctx.state, parentProjectId, {
                parentProjectId,
                name,
                prdText,
                priority,
                status: "draft",
                decompositionSummary: "",
                repoUrl,
                reviewDir,
                phaseNumber,
                autoAdvance,
                sourceProjectId,
            });
            ctx.logger.info("project-automation: created project", { projectId: project.id, name });
            return project;
        });
        ctx.actions.register("update-project", async (params) => {
            const parentProjectId = params.parentProjectId;
            const projectId = params.projectId;
            const updates = params.updates;
            if (!parentProjectId || !projectId)
                throw new Error("parentProjectId and projectId required");
            const updated = await store.updateProject(ctx.state, parentProjectId, projectId, updates);
            ctx.logger.info("project-automation: updated project", { projectId });
            return updated;
        });
        ctx.actions.register("delete-project", async (params) => {
            const parentProjectId = params.parentProjectId;
            const projectId = params.projectId;
            if (!parentProjectId || !projectId)
                throw new Error("parentProjectId and projectId required");
            await store.deleteProject(ctx.state, parentProjectId, projectId);
            ctx.logger.info("project-automation: deleted project", { projectId });
            return { ok: true };
        });
        ctx.actions.register("update-job", async (params) => {
            const parentProjectId = params.parentProjectId;
            const projectId = params.projectId;
            const jobId = params.jobId;
            const updates = params.updates;
            if (!parentProjectId || !projectId || !jobId)
                throw new Error("parentProjectId, projectId, and jobId required");
            const updated = await store.updateJob(ctx.state, parentProjectId, projectId, jobId, updates);
            ctx.logger.info("project-automation: updated job", { projectId, jobId });
            return updated;
        });
        ctx.data.register("api-key-status", async () => {
            const config = await ctx.state.get({
                scopeKind: "instance", stateKey: "anthropic-api-key", namespace: "automation",
            });
            return { configured: !!config?.key };
        });
        ctx.actions.register("save-api-key", async (params) => {
            const apiKey = params.apiKey;
            if (!apiKey?.trim())
                throw new Error("API key required");
            await ctx.state.set({ scopeKind: "instance", stateKey: "anthropic-api-key", namespace: "automation" }, { key: apiKey.trim() });
            ctx.logger.info("project-automation: API key saved");
            return { ok: true };
        });
        // ── Saved repos ──
        ctx.data.register("saved-repos", async () => {
            const repos = await ctx.state.get({
                scopeKind: "instance", stateKey: "saved-repos", namespace: "automation",
            });
            return repos || [];
        });
        ctx.actions.register("save-repo", async (params) => {
            const name = params.name;
            const repoUrl = params.repoUrl;
            const defaultReviewDir = params.defaultReviewDir || "";
            if (!name || !repoUrl)
                throw new Error("name and repoUrl required");
            const repos = await ctx.state.get({
                scopeKind: "instance", stateKey: "saved-repos", namespace: "automation",
            }) || [];
            repos.push({ id: crypto.randomUUID(), name, repoUrl, defaultReviewDir });
            await ctx.state.set({ scopeKind: "instance", stateKey: "saved-repos", namespace: "automation" }, repos);
            return { ok: true };
        });
        ctx.actions.register("delete-repo", async (params) => {
            const repoId = params.repoId;
            if (!repoId)
                throw new Error("repoId required");
            const repos = await ctx.state.get({
                scopeKind: "instance", stateKey: "saved-repos", namespace: "automation",
            }) || [];
            const filtered = repos.filter(r => r.id !== repoId);
            await ctx.state.set({ scopeKind: "instance", stateKey: "saved-repos", namespace: "automation" }, filtered);
            return { ok: true };
        });
        // ── Pipeline events data handler ──
        ctx.data.register("pipeline-events", async (params) => {
            const parentProjectId = params.parentProjectId;
            const projectId = params.projectId;
            if (!parentProjectId || !projectId)
                return [];
            return store.getPipelineEvents(ctx.state, parentProjectId, projectId);
        });
        ctx.data.register("review-count", async (params) => {
            const parentProjectId = params.parentProjectId;
            if (!parentProjectId)
                return { count: 0 };
            const projects = await store.listProjects(ctx.state, parentProjectId);
            const count = projects.filter(p => p.status === "needs-review").length;
            return { count };
        });
        ctx.data.register("phase-report", async (params) => {
            const parentProjectId = params.parentProjectId;
            const projectId = params.projectId;
            if (!parentProjectId || !projectId)
                return null;
            return store.getPhaseReport(ctx.state, parentProjectId, projectId);
        });
        // ── Phase 2: PRD Decomposition (Opus via Anthropic API) ──
        ctx.actions.register("decompose-prd", async (params) => {
            const parentProjectId = params.parentProjectId;
            const projectId = params.projectId;
            if (!parentProjectId || !projectId)
                throw new Error("parentProjectId and projectId required");
            const project = await store.getProject(ctx.state, parentProjectId, projectId);
            if (!project)
                throw new Error("Project not found: " + projectId);
            if (!project.prdText)
                throw new Error("Project has no PRD text");
            // Read API key before going async
            const apiKeyConfig = await ctx.state.get({
                scopeKind: "instance", stateKey: "anthropic-api-key", namespace: "automation",
            });
            if (!apiKeyConfig?.key) {
                throw new Error("Anthropic API key not configured. Click the gear icon on Build Jobs to set it.");
            }
            // Update project status
            await store.updateProject(ctx.state, parentProjectId, projectId, { status: "planning" });
            // Write progress to state (UI reads via usePluginData)
            const progressKey = {
                scopeKind: "project", scopeId: parentProjectId, namespace: "automation",
                stateKey: `progress:${projectId}`,
            };
            // Clear previous progress log
            await ctx.state.set(progressKey, []);
            const emit = async (message) => {
                const log = await ctx.state.get(progressKey) || [];
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
                    const result = await decomposePrd({ http: ctx.http, apiKey }, projectId, prdText, emit);
                    // Save build jobs
                    await store.setJobs(ctx.state, parentProjectId, projectId, result.jobs);
                    // Save usage record
                    const usageEntry = {
                        id: crypto.randomUUID(),
                        projectId,
                        model: result.usageRecord.model,
                        purpose: result.usageRecord.purpose,
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
                }
                catch (err) {
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
            const parentProjectId = params.parentProjectId;
            const projectId = params.projectId;
            if (!parentProjectId || !projectId)
                throw new Error("parentProjectId and projectId required");
            const project = await store.getProject(ctx.state, parentProjectId, projectId);
            if (!project)
                throw new Error("Project not found: " + projectId);
            const jobs = await store.getJobs(ctx.state, parentProjectId, projectId);
            if (jobs.length === 0)
                throw new Error("No build jobs — decompose the PRD first");
            // Read API key for RTX orchestrator auth
            const apiKeyConfig = await ctx.state.get({
                scopeKind: "instance", stateKey: "rtx-api-key", namespace: "automation",
            });
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
                    const headers = { "content-type": "application/json" };
                    if (rtxApiKey)
                        headers["x-api-key"] = rtxApiKey;
                    const startRes = await ctx.http.fetch(`${RTX_ORCHESTRATOR_URL}/pipeline/start`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                            projectId,
                            jobs: jobsPayload,
                            reviewDir: project.reviewDir || "plugins/dev-department",
                            phaseScope: `Phase ${project.phaseNumber || 1}: ${project.name}`,
                            repo: project.repoUrl || "mikejackson-IAML/popebot-workspace",
                        }),
                    });
                    if (!startRes.ok) {
                        const errText = await startRes.text();
                        throw new Error(`RTX orchestrator ${startRes.status}: ${errText}`);
                    }
                    const startData = await startRes.json();
                    const rtxPipelineId = startData.pipelineId;
                    // Save pipeline run
                    const pipelineRun = {
                        id: crypto.randomUUID(),
                        projectId,
                        status: "building",
                        currentStep: "build",
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
                    const pollStartedAt = Date.now();
                    const MAX_POLL_MS = 30 * 60 * 1000; // 30 minutes max
                    let consecutive404s = 0;
                    while (!done) {
                        await new Promise(r => setTimeout(r, 10_000));
                        // Timeout guard
                        if (Date.now() - pollStartedAt > MAX_POLL_MS) {
                            await store.updateProject(ctx.state, parentProjectId, projectId, { status: "failed" });
                            await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                                type: "pipeline_failed",
                                projectId,
                                pipelineRunId: pipelineRun.id,
                                message: "Pipeline polling timed out after 30 minutes. The build may still be running on RTX — check manually.",
                                timestamp: new Date().toISOString(),
                            });
                            break;
                        }
                        try {
                            const statusRes = await ctx.http.fetch(`${RTX_ORCHESTRATOR_URL}/pipeline/${rtxPipelineId}/status?since=${eventsSeen}`, { method: "GET", headers });
                            if (statusRes.status === 404) {
                                consecutive404s++;
                                if (consecutive404s >= 3) {
                                    await store.updateProject(ctx.state, parentProjectId, projectId, { status: "failed" });
                                    await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                                        type: "pipeline_failed",
                                        projectId,
                                        pipelineRunId: pipelineRun.id,
                                        message: "Pipeline lost — RTX orchestrator may have restarted. Use Retry to re-run.",
                                        timestamp: new Date().toISOString(),
                                    });
                                    done = true;
                                    continue;
                                }
                            }
                            if (!statusRes.ok)
                                continue;
                            consecutive404s = 0;
                            const statusData = await statusRes.json();
                            // Write new events to state
                            for (const evt of statusData.events) {
                                await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                                    type: evt.type,
                                    projectId,
                                    pipelineRunId: pipelineRun.id,
                                    message: evt.message,
                                    details: evt.details,
                                    timestamp: evt.timestamp,
                                });
                                // Save PR URL when a build job is merged
                                if (evt.type === "build_merged" && evt.details) {
                                    const prUrl = evt.details.prUrl;
                                    if (prUrl) {
                                        // Try to match PR to a job (update first job without a PR URL)
                                        const currentJobs = await store.getJobs(ctx.state, parentProjectId, projectId);
                                        const jobWithoutPr = currentJobs.find(j => !j.prUrl && (j.status === "dispatched" || j.status === "building"));
                                        if (jobWithoutPr) {
                                            await store.updateJob(ctx.state, parentProjectId, projectId, jobWithoutPr.id, {
                                                prUrl,
                                                status: "merged",
                                                completedAt: new Date().toISOString(),
                                            });
                                        }
                                    }
                                }
                                // Save ReviewResult when a review tier completes
                                if (evt.type === "review_tier_complete" && evt.details) {
                                    const d = evt.details;
                                    if (d.tier && d.verdict) {
                                        const review = {
                                            id: crypto.randomUUID(),
                                            projectId,
                                            pipelineRunId: pipelineRun.id,
                                            tier: d.tier,
                                            round: pipelineRun.reviewRound || 1,
                                            verdict: d.verdict,
                                            summary: evt.message,
                                            findings: [],
                                            createdAt: evt.timestamp,
                                        };
                                        await store.addReview(ctx.state, parentProjectId, projectId, review);
                                    }
                                }
                            }
                            eventsSeen = statusData.totalEvents;
                            // Update pipeline run status
                            const stepMap = {
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
                                // Pipeline done — hold for human review
                                await store.updateProject(ctx.state, parentProjectId, projectId, { status: "needs-review" });
                                done = true;
                                await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                                    type: "pipeline_complete",
                                    projectId,
                                    pipelineRunId: pipelineRun.id,
                                    message: "Pipeline complete — awaiting human review.",
                                    timestamp: new Date().toISOString(),
                                });
                                // Write to Paperclip activity log
                                try {
                                    await ctx.activity.log({
                                        companyId: parentProjectId,
                                        message: `Pipeline complete for "${project.name}" (Phase ${project.phaseNumber || 1}) — review needed`,
                                        entityType: "automation-project",
                                        entityId: projectId,
                                        metadata: { status: "needs-review", phaseNumber: project.phaseNumber || 1 },
                                    });
                                }
                                catch (actErr) {
                                    ctx.logger.error("project-automation: activity log failed", { error: actErr.message });
                                }
                                ctx.logger.info("project-automation: pipeline needs review", { projectId });
                            }
                            else if (statusData.status === "failed") {
                                await store.updateProject(ctx.state, parentProjectId, projectId, { status: "failed" });
                                done = true;
                            }
                            else if (statusData.status === "cancelled") {
                                await store.updateProject(ctx.state, parentProjectId, projectId, { status: "ready" });
                                done = true;
                            }
                        }
                        catch (pollErr) {
                            ctx.logger.error("project-automation: poll error", { error: pollErr.message });
                            // Keep polling — transient network errors shouldn't kill the loop
                        }
                    }
                    ctx.logger.info("project-automation: pipeline finished", { projectId, rtxPipelineId });
                }
                catch (err) {
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
            const parentProjectId = params.parentProjectId;
            const projectId = params.projectId;
            if (!parentProjectId || !projectId)
                throw new Error("parentProjectId and projectId required");
            const pipeline = await store.getPipelineRun(ctx.state, parentProjectId, projectId);
            if (!pipeline?.rtxPipelineId)
                throw new Error("No active pipeline to cancel");
            const apiKeyConfig = await ctx.state.get({
                scopeKind: "instance", stateKey: "rtx-api-key", namespace: "automation",
            });
            const headers = { "content-type": "application/json" };
            if (apiKeyConfig?.key)
                headers["x-api-key"] = apiKeyConfig.key;
            const res = await ctx.http.fetch(`${RTX_ORCHESTRATOR_URL}/pipeline/${pipeline.rtxPipelineId}/cancel`, { method: "POST", headers });
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
        ctx.actions.register("retry-pipeline", async (params) => {
            const parentProjectId = params.parentProjectId;
            const projectId = params.projectId;
            if (!parentProjectId || !projectId)
                throw new Error("parentProjectId and projectId required");
            const project = await store.getProject(ctx.state, parentProjectId, projectId);
            if (!project)
                throw new Error("Project not found: " + projectId);
            if (project.status !== "failed")
                throw new Error("Can only retry failed projects");
            const jobs = await store.getJobs(ctx.state, parentProjectId, projectId);
            if (jobs.length === 0)
                throw new Error("No build jobs to retry");
            // Reset job statuses back to pending
            for (const job of jobs) {
                await store.updateJob(ctx.state, parentProjectId, projectId, job.id, {
                    status: "pending",
                    dispatchedAt: null,
                    completedAt: null,
                    popebotJobId: null,
                    prUrl: null,
                });
            }
            // Reset project status to ready so Start Build works
            await store.updateProject(ctx.state, parentProjectId, projectId, { status: "ready" });
            // Clear old pipeline data
            await store.clearPipelineEvents(ctx.state, parentProjectId, projectId);
            ctx.logger.info("project-automation: pipeline reset for retry", { projectId });
            return { reset: true, projectId };
        });
        // ── RTX API key config (separate from Anthropic key) ──
        ctx.data.register("rtx-key-status", async () => {
            const config = await ctx.state.get({
                scopeKind: "instance", stateKey: "rtx-api-key", namespace: "automation",
            });
            return { configured: !!config?.key };
        });
        ctx.actions.register("save-rtx-key", async (params) => {
            const apiKey = params.apiKey;
            if (!apiKey?.trim())
                throw new Error("API key required");
            await ctx.state.set({ scopeKind: "instance", stateKey: "rtx-api-key", namespace: "automation" }, { key: apiKey.trim() });
            ctx.logger.info("project-automation: RTX API key saved");
            return { ok: true };
        });
        // ── Human review gate: approve / reject ──
        ctx.actions.register("approve-phase", async (params) => {
            const parentProjectId = params.parentProjectId;
            const projectId = params.projectId;
            if (!parentProjectId || !projectId)
                throw new Error("parentProjectId and projectId required");
            const project = await store.getProject(ctx.state, parentProjectId, projectId);
            if (!project)
                throw new Error("Project not found: " + projectId);
            if (project.status !== "needs-review")
                throw new Error("Project is not awaiting review");
            await store.updateProject(ctx.state, parentProjectId, projectId, { status: "complete" });
            await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                type: "progress",
                projectId,
                pipelineRunId: "review-gate",
                message: "Phase approved by human reviewer.",
                timestamp: new Date().toISOString(),
            });
            // Write approval to activity log
            try {
                await ctx.activity.log({
                    companyId: parentProjectId,
                    message: `"${project.name}" (Phase ${project.phaseNumber || 1}) approved`,
                    entityType: "automation-project",
                    entityId: projectId,
                    metadata: { status: "approved", phaseNumber: project.phaseNumber || 1 },
                });
            }
            catch (actErr) {
                ctx.logger.error("project-automation: activity log failed", { error: actErr.message });
            }
            ctx.logger.info("project-automation: phase approved", { projectId });
            // If auto-advance is on, trigger advancement in background
            if (project.autoAdvance) {
                const rtxApiKey = ((await ctx.state.get({
                    scopeKind: "instance", stateKey: "rtx-api-key", namespace: "automation",
                }))?.key) || "";
                const headers = { "content-type": "application/json" };
                if (rtxApiKey)
                    headers["x-api-key"] = rtxApiKey;
                await store.updateProject(ctx.state, parentProjectId, projectId, { status: "advancing" });
                (async () => {
                    try {
                        await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                            type: "advance_started",
                            projectId,
                            pipelineRunId: "review-gate",
                            message: `Auto-advance: generating Phase ${(project.phaseNumber || 1) + 1} report and PRD...`,
                            timestamp: new Date().toISOString(),
                        });
                        const advStartRes = await ctx.http.fetch(`${RTX_ORCHESTRATOR_URL}/advance/start`, {
                            method: "POST",
                            headers,
                            body: JSON.stringify({
                                currentPhase: project.phaseNumber || 1,
                                pluginDir: "plugins/dev-department",
                                phaseScope: `Phase ${project.phaseNumber || 1}`,
                            }),
                        });
                        if (!advStartRes.ok) {
                            throw new Error(`RTX advance start ${advStartRes.status}: ${await advStartRes.text()}`);
                        }
                        const advData = await advStartRes.json();
                        let advDone = false;
                        while (!advDone) {
                            await new Promise(r => setTimeout(r, 15_000));
                            try {
                                const advStatusRes = await ctx.http.fetch(`${RTX_ORCHESTRATOR_URL}/advance/${advData.advanceId}/status`, { method: "GET", headers });
                                if (!advStatusRes.ok)
                                    continue;
                                const advStatus = await advStatusRes.json();
                                if (advStatus.status === "complete") {
                                    const phaseReport = {
                                        projectId,
                                        phaseNumber: project.phaseNumber || 1,
                                        report: advStatus.report,
                                        nextPrd: advStatus.nextPrd,
                                        nextPhase: advStatus.nextPhase,
                                        nextProjectId: null,
                                        createdAt: new Date().toISOString(),
                                    };
                                    await store.setPhaseReport(ctx.state, parentProjectId, projectId, phaseReport);
                                    await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                                        type: "advance_complete",
                                        projectId,
                                        pipelineRunId: "review-gate",
                                        message: `Phase report ready. Next PRD generated for Phase ${advStatus.nextPhase}.`,
                                        timestamp: new Date().toISOString(),
                                    });
                                    if (advStatus.nextPrd) {
                                        const nextProject = await store.createProject(ctx.state, parentProjectId, {
                                            parentProjectId,
                                            name: `${project.name.replace(/ — Phase \d+$/, "")} — Phase ${advStatus.nextPhase}`,
                                            prdText: advStatus.nextPrd,
                                            priority: project.priority,
                                            status: "draft",
                                            decompositionSummary: "",
                                            repoUrl: project.repoUrl || "mikejackson-IAML/popebot-workspace",
                                            reviewDir: project.reviewDir || "plugins/dev-department",
                                            phaseNumber: advStatus.nextPhase,
                                            autoAdvance: true,
                                            sourceProjectId: projectId,
                                        });
                                        phaseReport.nextProjectId = nextProject.id;
                                        await store.setPhaseReport(ctx.state, parentProjectId, projectId, phaseReport);
                                        await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                                            type: "progress",
                                            projectId,
                                            pipelineRunId: "review-gate",
                                            message: `Phase ${advStatus.nextPhase} project created: ${nextProject.id.slice(0, 8)}. Open it to continue.`,
                                            timestamp: new Date().toISOString(),
                                        });
                                    }
                                    await store.updateProject(ctx.state, parentProjectId, projectId, { status: "complete" });
                                    advDone = true;
                                }
                                else if (advStatus.status === "failed") {
                                    await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                                        type: "advance_failed",
                                        projectId,
                                        pipelineRunId: "review-gate",
                                        message: "Auto-advance failed on RTX.",
                                        timestamp: new Date().toISOString(),
                                    });
                                    await store.updateProject(ctx.state, parentProjectId, projectId, { status: "complete" });
                                    advDone = true;
                                }
                            }
                            catch (advPollErr) {
                                ctx.logger.error("project-automation: auto-advance poll error", { error: advPollErr.message });
                            }
                        }
                    }
                    catch (err) {
                        ctx.logger.error("project-automation: auto-advance failed after approval", { error: err.message });
                        await store.updateProject(ctx.state, parentProjectId, projectId, { status: "complete" });
                    }
                })();
            }
            return { approved: true, projectId, autoAdvancing: project.autoAdvance };
        });
        ctx.actions.register("reject-phase", async (params) => {
            const parentProjectId = params.parentProjectId;
            const projectId = params.projectId;
            const reason = params.reason || "Rejected by reviewer";
            if (!parentProjectId || !projectId)
                throw new Error("parentProjectId and projectId required");
            const project = await store.getProject(ctx.state, parentProjectId, projectId);
            if (!project)
                throw new Error("Project not found: " + projectId);
            if (project.status !== "needs-review")
                throw new Error("Project is not awaiting review");
            await store.updateProject(ctx.state, parentProjectId, projectId, { status: "failed" });
            await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                type: "pipeline_failed",
                projectId,
                pipelineRunId: "review-gate",
                message: `Phase rejected: ${reason}`,
                timestamp: new Date().toISOString(),
            });
            try {
                await ctx.activity.log({
                    companyId: parentProjectId,
                    message: `"${project.name}" (Phase ${project.phaseNumber || 1}) rejected: ${reason}`,
                    entityType: "automation-project",
                    entityId: projectId,
                    metadata: { status: "rejected", phaseNumber: project.phaseNumber || 1, reason },
                });
            }
            catch (actErr) {
                ctx.logger.error("project-automation: activity log failed", { error: actErr.message });
            }
            ctx.logger.info("project-automation: phase rejected", { projectId, reason });
            return { rejected: true, projectId };
        });
        // ── Phase 5: Toggle auto-advance ──
        ctx.actions.register("toggle-auto-advance", async (params) => {
            const parentProjectId = params.parentProjectId;
            const projectId = params.projectId;
            if (!parentProjectId || !projectId)
                throw new Error("parentProjectId and projectId required");
            const project = await store.getProject(ctx.state, parentProjectId, projectId);
            if (!project)
                throw new Error("Project not found: " + projectId);
            const updated = await store.updateProject(ctx.state, parentProjectId, projectId, {
                autoAdvance: !project.autoAdvance,
            });
            ctx.logger.info("project-automation: toggled auto-advance", { projectId, autoAdvance: updated.autoAdvance });
            return { autoAdvance: updated.autoAdvance };
        });
        // ── Phase 5: Advance project (report → next PRD → new project) ──
        ctx.actions.register("advance-project", async (params) => {
            const parentProjectId = params.parentProjectId;
            const projectId = params.projectId;
            const phaseScope = params.phaseScope || "";
            if (!parentProjectId || !projectId)
                throw new Error("parentProjectId and projectId required");
            const project = await store.getProject(ctx.state, parentProjectId, projectId);
            if (!project)
                throw new Error("Project not found: " + projectId);
            // Read RTX API key
            const apiKeyConfig = await ctx.state.get({
                scopeKind: "instance", stateKey: "rtx-api-key", namespace: "automation",
            });
            // Update project status to advancing
            await store.updateProject(ctx.state, parentProjectId, projectId, { status: "advancing" });
            await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                type: "advance_started",
                projectId,
                pipelineRunId: "advance",
                message: `Phase advancement started: Phase ${project.phaseNumber} → ${project.phaseNumber + 1}`,
                timestamp: new Date().toISOString(),
            });
            // Capture for closure
            const rtxApiKey = apiKeyConfig?.key || "";
            const phaseNumber = project.phaseNumber || 1;
            const autoAdvance = project.autoAdvance;
            // Fire-and-forget
            (async () => {
                try {
                    const headers = { "content-type": "application/json" };
                    if (rtxApiKey)
                        headers["x-api-key"] = rtxApiKey;
                    // Start advance on RTX orchestrator
                    const startRes = await ctx.http.fetch(`${RTX_ORCHESTRATOR_URL}/advance/start`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                            currentPhase: phaseNumber,
                            pluginDir: "plugins/dev-department",
                            phaseScope,
                        }),
                    });
                    if (!startRes.ok) {
                        const errText = await startRes.text();
                        throw new Error(`RTX advance start ${startRes.status}: ${errText}`);
                    }
                    const startData = await startRes.json();
                    const advanceId = startData.advanceId;
                    ctx.logger.info("project-automation: advance started on RTX", { projectId, advanceId });
                    // Poll for completion (advance can take several minutes)
                    let done = false;
                    while (!done) {
                        await new Promise(r => setTimeout(r, 15_000));
                        try {
                            const statusRes = await ctx.http.fetch(`${RTX_ORCHESTRATOR_URL}/advance/${advanceId}/status`, { method: "GET", headers });
                            if (!statusRes.ok)
                                continue;
                            const statusData = await statusRes.json();
                            if (statusData.status === "complete") {
                                // Save phase report
                                const phaseReport = {
                                    projectId,
                                    phaseNumber,
                                    report: statusData.report,
                                    nextPrd: statusData.nextPrd,
                                    nextPhase: statusData.nextPhase,
                                    nextProjectId: null,
                                    createdAt: new Date().toISOString(),
                                };
                                await store.setPhaseReport(ctx.state, parentProjectId, projectId, phaseReport);
                                await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                                    type: "advance_complete",
                                    projectId,
                                    pipelineRunId: "advance",
                                    message: `Phase report generated. Next-phase PRD ready (Phase ${statusData.nextPhase}).`,
                                    details: { nextPhase: statusData.nextPhase, reportLength: statusData.report.length, prdLength: statusData.nextPrd.length },
                                    timestamp: new Date().toISOString(),
                                });
                                // Auto-loop: if autoAdvance is on, create next project → decompose → build
                                if (autoAdvance && statusData.nextPrd) {
                                    await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                                        type: "progress",
                                        projectId,
                                        pipelineRunId: "advance",
                                        message: `Auto-advance: creating Phase ${statusData.nextPhase} project...`,
                                        timestamp: new Date().toISOString(),
                                    });
                                    // Create next project
                                    const nextProject = await store.createProject(ctx.state, parentProjectId, {
                                        parentProjectId,
                                        name: `${project.name} — Phase ${statusData.nextPhase}`,
                                        prdText: statusData.nextPrd,
                                        priority: project.priority,
                                        status: "draft",
                                        decompositionSummary: "",
                                        repoUrl: project.repoUrl || "mikejackson-IAML/popebot-workspace",
                                        reviewDir: project.reviewDir || "plugins/dev-department",
                                        phaseNumber: statusData.nextPhase,
                                        autoAdvance: true,
                                        sourceProjectId: projectId,
                                    });
                                    // Update phase report with next project ID
                                    phaseReport.nextProjectId = nextProject.id;
                                    await store.setPhaseReport(ctx.state, parentProjectId, projectId, phaseReport);
                                    await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                                        type: "progress",
                                        projectId,
                                        pipelineRunId: "advance",
                                        message: `Auto-advance: Phase ${statusData.nextPhase} project created (${nextProject.id.slice(0, 8)}). Decomposing PRD...`,
                                        timestamp: new Date().toISOString(),
                                    });
                                    // Read API key for decomposition
                                    const anthropicKeyConfig = await ctx.state.get({
                                        scopeKind: "instance", stateKey: "anthropic-api-key", namespace: "automation",
                                    });
                                    if (anthropicKeyConfig?.key) {
                                        try {
                                            // Decompose the next-phase PRD
                                            const result = await decomposePrd({ http: ctx.http, apiKey: anthropicKeyConfig.key }, nextProject.id, statusData.nextPrd);
                                            await store.setJobs(ctx.state, parentProjectId, nextProject.id, result.jobs);
                                            const usageEntry = {
                                                id: crypto.randomUUID(),
                                                projectId: nextProject.id,
                                                model: result.usageRecord.model,
                                                purpose: result.usageRecord.purpose,
                                                inputTokens: result.usageRecord.inputTokens,
                                                outputTokens: result.usageRecord.outputTokens,
                                                estimatedCostUsd: result.usageRecord.estimatedCostUsd,
                                                timestamp: new Date().toISOString(),
                                            };
                                            await store.addUsage(ctx.state, parentProjectId, nextProject.id, usageEntry);
                                            await store.updateProject(ctx.state, parentProjectId, nextProject.id, {
                                                status: "ready",
                                                decompositionSummary: result.summary,
                                            });
                                            await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                                                type: "progress",
                                                projectId,
                                                pipelineRunId: "advance",
                                                message: `Auto-advance: Phase ${statusData.nextPhase} decomposed into ${result.jobs.length} jobs. Starting pipeline...`,
                                                timestamp: new Date().toISOString(),
                                            });
                                            // Start pipeline on new project via RTX orchestrator
                                            const jobsPayload = result.jobs.map(j => ({
                                                id: j.id, name: j.name, description: j.description,
                                                targetFiles: j.targetFiles, jobType: j.jobType,
                                            }));
                                            const pipelineRes = await ctx.http.fetch(`${RTX_ORCHESTRATOR_URL}/pipeline/start`, {
                                                method: "POST",
                                                headers,
                                                body: JSON.stringify({
                                                    projectId: nextProject.id,
                                                    jobs: jobsPayload,
                                                    reviewDir: "plugins/dev-department",
                                                    phaseScope: `Phase ${statusData.nextPhase}`,
                                                }),
                                            });
                                            if (pipelineRes.ok) {
                                                const pipelineData = await pipelineRes.json();
                                                await store.updateProject(ctx.state, parentProjectId, nextProject.id, { status: "building" });
                                                const pipelineRun = {
                                                    id: crypto.randomUUID(),
                                                    projectId: nextProject.id,
                                                    status: "building",
                                                    currentStep: "build",
                                                    reviewRound: 0,
                                                    maxReviewRounds: 2,
                                                    rtxPipelineId: pipelineData.pipelineId,
                                                    startedAt: new Date().toISOString(),
                                                    completedAt: null,
                                                };
                                                await store.setPipelineRun(ctx.state, parentProjectId, nextProject.id, pipelineRun);
                                                await store.addPipelineEvent(ctx.state, parentProjectId, nextProject.id, {
                                                    type: "build_started",
                                                    projectId: nextProject.id,
                                                    pipelineRunId: pipelineRun.id,
                                                    message: `Auto-advance pipeline started (RTX ID: ${pipelineData.pipelineId})`,
                                                    timestamp: new Date().toISOString(),
                                                });
                                                // Start polling the new project's pipeline (same pattern as start-pipeline)
                                                // NOTE: this is a recursive loop — the new project's pipeline will also
                                                // trigger auto-advance if enabled. The chain continues until a pipeline
                                                // fails or auto-advance is disabled.
                                                let newEventsSeen = 0;
                                                let newDone = false;
                                                while (!newDone) {
                                                    await new Promise(r => setTimeout(r, 10_000));
                                                    try {
                                                        const sRes = await ctx.http.fetch(`${RTX_ORCHESTRATOR_URL}/pipeline/${pipelineData.pipelineId}/status?since=${newEventsSeen}`, { method: "GET", headers });
                                                        if (!sRes.ok)
                                                            continue;
                                                        const sData = await sRes.json();
                                                        for (const evt of sData.events) {
                                                            await store.addPipelineEvent(ctx.state, parentProjectId, nextProject.id, {
                                                                type: evt.type,
                                                                projectId: nextProject.id,
                                                                pipelineRunId: pipelineRun.id,
                                                                message: evt.message,
                                                                details: evt.details,
                                                                timestamp: evt.timestamp,
                                                            });
                                                            if (evt.type === "review_tier_complete" && evt.details) {
                                                                const d = evt.details;
                                                                if (d.tier && d.verdict) {
                                                                    await store.addReview(ctx.state, parentProjectId, nextProject.id, {
                                                                        id: crypto.randomUUID(),
                                                                        projectId: nextProject.id,
                                                                        pipelineRunId: pipelineRun.id,
                                                                        tier: d.tier,
                                                                        round: pipelineRun.reviewRound || 1,
                                                                        verdict: d.verdict,
                                                                        summary: evt.message,
                                                                        findings: [],
                                                                        createdAt: evt.timestamp,
                                                                    });
                                                                }
                                                            }
                                                        }
                                                        newEventsSeen = sData.totalEvents;
                                                        const stepMap = {
                                                            build: "build", review: "review", fix: "fix", advance: "advance",
                                                        };
                                                        await store.setPipelineRun(ctx.state, parentProjectId, nextProject.id, {
                                                            ...pipelineRun,
                                                            status: sData.status === "complete" ? "complete"
                                                                : sData.status === "failed" ? "failed"
                                                                    : sData.status === "cancelled" ? "cancelled"
                                                                        : "building",
                                                            currentStep: stepMap[sData.currentStep] || pipelineRun.currentStep,
                                                            completedAt: ["complete", "failed", "cancelled"].includes(sData.status)
                                                                ? new Date().toISOString() : null,
                                                        });
                                                        if (sData.status === "complete") {
                                                            await store.updateProject(ctx.state, parentProjectId, nextProject.id, { status: "complete" });
                                                            newDone = true;
                                                        }
                                                        else if (sData.status === "failed") {
                                                            await store.updateProject(ctx.state, parentProjectId, nextProject.id, { status: "failed" });
                                                            newDone = true;
                                                        }
                                                        else if (sData.status === "cancelled") {
                                                            await store.updateProject(ctx.state, parentProjectId, nextProject.id, { status: "ready" });
                                                            newDone = true;
                                                        }
                                                    }
                                                    catch (pollErr) {
                                                        ctx.logger.error("project-automation: auto-advance poll error", { error: pollErr.message });
                                                    }
                                                }
                                                // If next project completed + autoAdvance, trigger its advance too
                                                const nextProjectFinal = await store.getProject(ctx.state, parentProjectId, nextProject.id);
                                                if (nextProjectFinal?.status === "complete" && nextProjectFinal.autoAdvance) {
                                                    ctx.logger.info("project-automation: chaining auto-advance for next project", { nextProjectId: nextProject.id });
                                                    // Trigger advance on the next project — this creates a recursive chain
                                                    // We do this by directly calling the advance logic (the action handler
                                                    // would timeout, but we're already in a fire-and-forget context)
                                                    await store.addPipelineEvent(ctx.state, parentProjectId, nextProject.id, {
                                                        type: "advance_started",
                                                        projectId: nextProject.id,
                                                        pipelineRunId: "advance",
                                                        message: `Auto-advancing Phase ${nextProjectFinal.phaseNumber} → ${nextProjectFinal.phaseNumber + 1}`,
                                                        timestamp: new Date().toISOString(),
                                                    });
                                                    // NOTE: For safety, we stop the chain here. The user can trigger
                                                    // the next advance from the UI. Infinite loops = bad.
                                                    await store.updateProject(ctx.state, parentProjectId, nextProject.id, { status: "complete" });
                                                    await store.addPipelineEvent(ctx.state, parentProjectId, nextProject.id, {
                                                        type: "progress",
                                                        projectId: nextProject.id,
                                                        pipelineRunId: "advance",
                                                        message: "Pipeline complete. Click 'Advance Phase' to continue the chain.",
                                                        timestamp: new Date().toISOString(),
                                                    });
                                                }
                                                ctx.logger.info("project-automation: auto-advance pipeline complete", { nextProjectId: nextProject.id });
                                            }
                                            else {
                                                const errText = await pipelineRes.text();
                                                throw new Error(`Pipeline start failed: ${errText}`);
                                            }
                                        }
                                        catch (decompErr) {
                                            await store.updateProject(ctx.state, parentProjectId, nextProject.id, { status: "failed" });
                                            await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                                                type: "advance_failed",
                                                projectId,
                                                pipelineRunId: "advance",
                                                message: `Auto-advance failed during decompose/build: ${decompErr.message}`,
                                                timestamp: new Date().toISOString(),
                                            });
                                        }
                                    }
                                    else {
                                        await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                                            type: "progress",
                                            projectId,
                                            pipelineRunId: "advance",
                                            message: "Auto-advance: Anthropic API key not configured — cannot decompose. New project created in draft.",
                                            timestamp: new Date().toISOString(),
                                        });
                                    }
                                }
                                await store.updateProject(ctx.state, parentProjectId, projectId, { status: "complete" });
                                done = true;
                            }
                            else if (statusData.status === "failed") {
                                await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                                    type: "advance_failed",
                                    projectId,
                                    pipelineRunId: "advance",
                                    message: "Phase advancement failed on RTX",
                                    details: { log: statusData.log.slice(-5) },
                                    timestamp: new Date().toISOString(),
                                });
                                await store.updateProject(ctx.state, parentProjectId, projectId, { status: "complete" });
                                done = true;
                            }
                        }
                        catch (pollErr) {
                            ctx.logger.error("project-automation: advance poll error", { error: pollErr.message });
                        }
                    }
                }
                catch (err) {
                    await store.updateProject(ctx.state, parentProjectId, projectId, { status: "complete" });
                    await store.addPipelineEvent(ctx.state, parentProjectId, projectId, {
                        type: "advance_failed",
                        projectId,
                        pipelineRunId: "advance",
                        message: `Phase advancement failed: ${err.message}`,
                        timestamp: new Date().toISOString(),
                    });
                    ctx.logger.error("project-automation: advance failed", { projectId, error: err.message });
                }
            })();
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
//# sourceMappingURL=worker.js.map