import type { PluginHttpClient } from "@paperclipai/plugin-sdk";
import type { LLMModel, LLMPurpose, LLMUsage } from "./types.js";
export interface LLMRequest {
    model: LLMModel;
    purpose: LLMPurpose;
    system?: string;
    messages: Array<{
        role: "user" | "assistant";
        content: string;
    }>;
    maxTokens?: number;
    temperature?: number;
}
export interface LLMResponse {
    content: string;
    usage: {
        inputTokens: number;
        outputTokens: number;
    };
    model: string;
    stopReason: string;
}
export interface LLMClientDeps {
    http: PluginHttpClient;
    apiKey: string;
}
export declare function callLLM(deps: LLMClientDeps, request: LLMRequest): Promise<{
    response: LLMResponse;
    usageRecord: Omit<LLMUsage, "id" | "projectId" | "timestamp">;
}>;
//# sourceMappingURL=llm-client.d.ts.map