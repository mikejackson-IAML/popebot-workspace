// Model ID mapping
const MODEL_IDS = {
    opus: "claude-opus-4-20250514",
    sonnet: "claude-sonnet-4-20250514",
    haiku: "claude-haiku-4-5-20251001",
};
// Cost per million tokens (USD) — approximate
const COST_PER_M_TOKENS = {
    opus: { input: 15, output: 75 },
    sonnet: { input: 3, output: 15 },
    haiku: { input: 0.8, output: 4 },
};
const API_URL = "https://api.anthropic.com/v1/messages";
export async function callLLM(deps, request) {
    const apiKey = await deps.secrets.resolve("ANTHROPIC_API_KEY");
    const modelId = MODEL_IDS[request.model];
    if (!modelId)
        throw new Error(`Unknown model: ${request.model}`);
    const body = {
        model: modelId,
        max_tokens: request.maxTokens || 4096,
        messages: request.messages,
    };
    if (request.system)
        body.system = request.system;
    if (request.temperature !== undefined)
        body.temperature = request.temperature;
    const res = await deps.http.fetch(API_URL, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Claude API ${res.status}: ${errText}`);
    }
    const data = await res.json();
    const textContent = data.content
        .filter((c) => c.type === "text" && c.text)
        .map((c) => c.text)
        .join("");
    const inputTokens = data.usage.input_tokens;
    const outputTokens = data.usage.output_tokens;
    const costs = COST_PER_M_TOKENS[request.model] || { input: 0, output: 0 };
    const estimatedCostUsd = (inputTokens / 1_000_000) * costs.input +
        (outputTokens / 1_000_000) * costs.output;
    return {
        response: {
            content: textContent,
            usage: { inputTokens, outputTokens },
            model: data.model,
            stopReason: data.stop_reason,
        },
        usageRecord: {
            model: request.model,
            purpose: request.purpose,
            inputTokens,
            outputTokens,
            estimatedCostUsd,
        },
    };
}
//# sourceMappingURL=llm-client.js.map