const NS = "automation";
function key(parentProjectId, stateKey) {
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
export async function listProjects(state, parentProjectId) {
    const index = (await state.get(key(parentProjectId, "project-index")));
    if (!index || index.length === 0)
        return [];
    const projects = [];
    for (const id of index) {
        const p = (await state.get(key(parentProjectId, `project:${id}`)));
        if (p)
            projects.push(p);
    }
    return projects;
}
export async function getProject(state, parentProjectId, projectId) {
    return (await state.get(key(parentProjectId, `project:${projectId}`)));
}
export async function createProject(state, parentProjectId, data) {
    const now = new Date().toISOString();
    const project = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: now,
        updatedAt: now,
    };
    await state.set(key(parentProjectId, `project:${project.id}`), project);
    const index = (await state.get(key(parentProjectId, "project-index"))) || [];
    index.push(project.id);
    await state.set(key(parentProjectId, "project-index"), index);
    return project;
}
export async function updateProject(state, parentProjectId, projectId, data) {
    const existing = await getProject(state, parentProjectId, projectId);
    if (!existing)
        throw new Error("Project not found: " + projectId);
    const updated = {
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
export async function deleteProject(state, parentProjectId, projectId) {
    await state.delete(key(parentProjectId, `project:${projectId}`));
    const index = (await state.get(key(parentProjectId, "project-index"))) || [];
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
export async function getJobs(state, parentProjectId, projectId) {
    return (await state.get(key(parentProjectId, `jobs:${projectId}`))) || [];
}
export async function setJobs(state, parentProjectId, projectId, jobs) {
    await state.set(key(parentProjectId, `jobs:${projectId}`), jobs);
}
export async function updateJob(state, parentProjectId, projectId, jobId, data) {
    const jobs = await getJobs(state, parentProjectId, projectId);
    const idx = jobs.findIndex((j) => j.id === jobId);
    if (idx === -1)
        throw new Error("Job not found: " + jobId);
    jobs[idx] = { ...jobs[idx], ...data, id: jobs[idx].id, projectId: jobs[idx].projectId };
    await setJobs(state, parentProjectId, projectId, jobs);
    return jobs[idx];
}
// =============================================================================
// Pipeline Runs
// =============================================================================
export async function getPipelineRun(state, parentProjectId, projectId) {
    return (await state.get(key(parentProjectId, `pipeline:${projectId}`)));
}
export async function setPipelineRun(state, parentProjectId, projectId, run) {
    await state.set(key(parentProjectId, `pipeline:${projectId}`), run);
}
// =============================================================================
// Reviews
// =============================================================================
export async function getReviews(state, parentProjectId, projectId) {
    return (await state.get(key(parentProjectId, `reviews:${projectId}`))) || [];
}
export async function addReview(state, parentProjectId, projectId, review) {
    const reviews = await getReviews(state, parentProjectId, projectId);
    reviews.push(review);
    await state.set(key(parentProjectId, `reviews:${projectId}`), reviews);
}
// =============================================================================
// LLM Usage / Cost Tracking
// =============================================================================
export async function getUsage(state, parentProjectId, projectId) {
    return (await state.get(key(parentProjectId, `usage:${projectId}`))) || [];
}
export async function addUsage(state, parentProjectId, projectId, usage) {
    const existing = await getUsage(state, parentProjectId, projectId);
    existing.push(usage);
    await state.set(key(parentProjectId, `usage:${projectId}`), existing);
}
//# sourceMappingURL=state.js.map