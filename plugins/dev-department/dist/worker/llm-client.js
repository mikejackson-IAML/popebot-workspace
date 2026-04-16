/**
 * Send a prompt to a PopeBot agent via a session, streaming events back.
 * Uses the Claude Code subscription through PopeBot — no direct API key needed.
 */
export async function callAgent(deps, request) {
    // Create a session with the target agent
    const session = await deps.agents.sessions.create(request.agentId, request.companyId, { reason: "prd-decomposition" });
    let fullContent = "";
    let runId = "";
    // Send the prompt with streaming callback
    const result = await deps.agents.sessions.sendMessage(session.sessionId, request.companyId, {
        prompt: request.prompt,
        onEvent: (event) => {
            runId = event.runId;
            if (event.eventType === "chunk" && event.message) {
                fullContent += event.message;
                // Don't relay every chunk to progress — too noisy
            }
            if (event.eventType === "status" && event.message) {
                request.onProgress?.(event.message);
            }
            if (event.eventType === "error") {
                request.onProgress?.(`Agent error: ${event.message || "unknown"}`);
            }
            if (event.eventType === "done") {
                request.onProgress?.("Agent finished processing.");
            }
            // Relay all events to stream channel if specified
            if (request.streamChannel) {
                deps.streams.emit(request.streamChannel, {
                    type: event.eventType,
                    message: event.message,
                    timestamp: new Date().toISOString(),
                });
            }
        },
    });
    runId = runId || result.runId;
    // Close the session — decomposition is a one-shot operation
    await deps.agents.sessions.close(session.sessionId, request.companyId);
    return {
        content: fullContent,
        sessionId: session.sessionId,
        runId,
    };
}
//# sourceMappingURL=llm-client.js.map