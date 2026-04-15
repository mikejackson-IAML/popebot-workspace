import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import * as store from "./worker/state.js";
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
        ctx.logger.info("project-automation: setup complete");
    },
    async onHealth() {
        return { status: "ok", message: "Project Automation plugin ready" };
    },
});
export default plugin;
runWorker(plugin, import.meta.url);
//# sourceMappingURL=worker.js.map