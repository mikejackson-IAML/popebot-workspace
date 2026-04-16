import type { PluginAgentsClient, PluginStreamsClient } from "@paperclipai/plugin-sdk";
export interface AgentClientDeps {
    agents: PluginAgentsClient;
    streams: PluginStreamsClient;
}
export interface AgentRequest {
    agentId: string;
    companyId: string;
    prompt: string;
    /** Stream channel to relay agent events to UI */
    streamChannel?: string;
    /** Callback for each streamed chunk */
    onProgress?: (message: string) => void;
}
export interface AgentResponse {
    /** Full accumulated text response from the agent */
    content: string;
    /** Session ID (can be reused for follow-up messages) */
    sessionId: string;
    /** Run ID for this specific invocation */
    runId: string;
}
/**
 * Send a prompt to a PopeBot agent via a session, streaming events back.
 * Uses the Claude Code subscription through PopeBot — no direct API key needed.
 */
export declare function callAgent(deps: AgentClientDeps, request: AgentRequest): Promise<AgentResponse>;
//# sourceMappingURL=llm-client.d.ts.map