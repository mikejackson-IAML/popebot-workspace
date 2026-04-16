import type { BuildJob } from "./types.js";
import { type LLMClientDeps, type LLMResponse } from "./llm-client.js";
export interface DecompositionResult {
    jobs: BuildJob[];
    summary: string;
    response: LLMResponse;
    usageRecord: {
        model: string;
        purpose: string;
        inputTokens: number;
        outputTokens: number;
        estimatedCostUsd: number;
    };
}
export declare function decomposePrd(deps: LLMClientDeps, projectId: string, prdText: string, onProgress?: (message: string) => void | Promise<void>): Promise<DecompositionResult>;
//# sourceMappingURL=prd-decomposer.d.ts.map