import { store } from "./state.js";
export { store } from "./state.js";
export * from "./types.js";
export * from "./messages.js";
export function handleMessage(request) {
    try {
        switch (request.type) {
            case "init":
            case "listProjects":
                return { type: "projects", data: store.listProjects() };
            case "createProject":
                return { type: "project", data: store.createProject(request.data) };
            case "updateProject":
                return { type: "project", data: store.updateProject(request.id, request.data) };
            case "deleteProject":
                store.deleteProject(request.id);
                return { type: "ok" };
            case "getPhasesByProject":
                return { type: "phases", data: store.getPhasesByProject(request.projectId) };
            case "createPhase":
                return { type: "phase", data: store.createPhase(request.data) };
            case "updatePhase":
                return { type: "phase", data: store.updatePhase(request.id, request.data) };
            case "deletePhase":
                store.deletePhase(request.id);
                return { type: "ok" };
            case "reorderPhases":
                store.reorderPhases(request.projectId, request.phaseIds);
                return { type: "ok" };
            case "createSpec":
                return { type: "spec", data: store.createSpec(request.data) };
            case "updateSpec":
                return { type: "spec", data: store.updateSpec(request.id, request.data) };
            case "getSpecByPhase":
                return { type: "spec", data: store.getSpecByPhase(request.phaseId) };
            case "createPRD":
                return { type: "prd", data: store.createPRD(request.data) };
            case "updatePRD":
                return { type: "prd", data: store.updatePRD(request.id, request.data) };
            case "getPRDByPhase":
                return { type: "prd", data: store.getPRDByPhase(request.phaseId) };
            case "createConversationRef":
                return { type: "conversationRefs", data: [store.createConversationRef(request.data)] };
            case "updateConversationRef":
                return { type: "conversationRefs", data: [store.updateConversationRef(request.id, request.data)] };
            case "deleteConversationRef":
                store.deleteConversationRef(request.id);
                return { type: "ok" };
            case "getConversationRefs":
                return { type: "conversationRefs", data: store.getConversationRefs(request.scopeType, request.scopeId) };
            case "getBuildDispatchByPhase":
                return { type: "buildDispatch", data: store.getBuildDispatchByPhase(request.phaseId) };
            case "getBuildOutputByPhase":
                return { type: "buildOutput", data: store.getBuildOutputByPhase(request.phaseId) };
            case "getReviewByPhase":
                return { type: "review", data: store.getReviewByPhase(request.phaseId) };
            case "createBuildDispatch":
                return { type: "buildDispatch", data: store.createBuildDispatch(request.data) };
            case "createBuildOutput":
                return { type: "buildOutput", data: store.createBuildOutput(request.data) };
            case "createReview":
                return { type: "review", data: store.createReview(request.data) };
            case "flush":
                store.flush();
                return { type: "ok" };
            default:
                return { type: "error", message: "Unknown request type" };
        }
    }
    catch (err) {
        return { type: "error", message: err instanceof Error ? err.message : String(err) };
    }
}
//# sourceMappingURL=index.js.map