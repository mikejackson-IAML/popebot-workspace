import { callLLM } from "./llm-client.js";
const SYSTEM_PROMPT = `You are an expert software architect. Your job is to decompose a Product Requirements Document (PRD) into a minimal ordered list of discrete build jobs.

## Rules

1. Each build job must target 1-3 files maximum. If more files are needed, split into multiple jobs.
2. Order jobs by dependency — jobs that other jobs depend on come first.
3. Each job gets a temporary ID like "job-1", "job-2", etc. Dependencies reference these IDs.
4. Be specific about which files will be created or modified. Use real file paths.
5. Keep job names short and action-oriented (e.g. "Create user auth service", "Add login page UI").
6. Each job description should be detailed enough for an AI coding agent to implement it without ambiguity.
7. Aim for the minimum number of jobs that covers the full PRD scope.

## Output Format

Return ONLY valid JSON with no markdown fencing. The format must be:

{
  "summary": "One paragraph summarizing the decomposition strategy",
  "jobs": [
    {
      "id": "job-1",
      "name": "Short action-oriented name",
      "description": "Detailed implementation instructions for a coding agent",
      "targetFiles": ["path/to/file1.ts", "path/to/file2.ts"],
      "dependencies": []
    },
    {
      "id": "job-2",
      "name": "Another job name",
      "description": "Detailed instructions...",
      "targetFiles": ["path/to/file3.ts"],
      "dependencies": ["job-1"]
    }
  ]
}`;
function validate(parsed) {
    const errors = [];
    if (!parsed.summary || typeof parsed.summary !== "string") {
        errors.push("Missing or invalid summary");
    }
    if (!Array.isArray(parsed.jobs) || parsed.jobs.length === 0) {
        errors.push("No jobs returned");
        return errors;
    }
    const ids = new Set(parsed.jobs.map((j) => j.id));
    for (const job of parsed.jobs) {
        if (!job.id || !job.name || !job.description) {
            errors.push(`Job missing required fields: ${JSON.stringify(job)}`);
        }
        if (!Array.isArray(job.targetFiles) || job.targetFiles.length === 0) {
            errors.push(`Job "${job.id}" has no target files`);
        }
        if (job.targetFiles && job.targetFiles.length > 3) {
            errors.push(`Job "${job.id}" targets ${job.targetFiles.length} files (max 3)`);
        }
        if (job.dependencies) {
            for (const dep of job.dependencies) {
                if (!ids.has(dep)) {
                    errors.push(`Job "${job.id}" depends on unknown job "${dep}"`);
                }
            }
        }
    }
    return errors;
}
export async function decomposePrd(deps, projectId, prdText, onProgress) {
    onProgress?.("Sending PRD to Opus for decomposition...");
    const { response, usageRecord } = await callLLM(deps, {
        model: "opus",
        purpose: "prd_decomposition",
        system: SYSTEM_PROMPT,
        messages: [
            {
                role: "user",
                content: `Decompose the following PRD into build jobs:\n\n${prdText}`,
            },
        ],
        maxTokens: 8192,
        temperature: 0.2,
    });
    onProgress?.(`Opus responded (${response.usage.inputTokens} in / ${response.usage.outputTokens} out tokens). Parsing...`);
    // Extract JSON — strip markdown fencing if present
    let jsonText = response.content.trim();
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch)
        jsonText = fenceMatch[1].trim();
    let parsed;
    try {
        parsed = JSON.parse(jsonText);
    }
    catch (e) {
        throw new Error(`Failed to parse Opus response as JSON: ${e.message}\n\nRaw response:\n${response.content.slice(0, 500)}`);
    }
    const errors = validate(parsed);
    if (errors.length > 0) {
        throw new Error(`Decomposition validation failed:\n${errors.join("\n")}`);
    }
    onProgress?.(`Validated ${parsed.jobs.length} build jobs. Saving...`);
    // Convert raw jobs to BuildJob entities
    const jobs = parsed.jobs.map((raw) => ({
        id: raw.id,
        projectId,
        name: raw.name,
        description: raw.description,
        targetFiles: raw.targetFiles,
        dependencies: raw.dependencies || [],
        status: "pending",
        popebotJobId: null,
        prUrl: null,
        dispatchedAt: null,
        completedAt: null,
    }));
    return {
        jobs,
        summary: parsed.summary,
        response,
        usageRecord,
    };
}
//# sourceMappingURL=prd-decomposer.js.map