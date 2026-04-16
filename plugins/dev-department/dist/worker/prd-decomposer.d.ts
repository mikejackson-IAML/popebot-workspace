import type { BuildJob } from "./types.js";
import { type AgentClientDeps } from "./llm-client.js";
export interface DecompositionResult {
    jobs: BuildJob[];
    summary: string;
    sessionId: string;
    runId: string;
}
export declare function decomposePrd(deps: AgentClientDeps, agentId: string, companyId: string, projectId: string, prdText: string, onProgress?: (message: string) => void): Promise<DecompositionResult>;
//# sourceMappingURL=prd-decomposer.d.ts.map