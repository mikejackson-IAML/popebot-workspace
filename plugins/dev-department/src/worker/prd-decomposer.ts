// =============================================================================
// PRD Decomposer — sends PRD to PopeBot agent, parses BuildJob[] response
// =============================================================================
import type { BuildJob, BuildJobType } from "./types.js";
import { callAgent, type AgentClientDeps } from "./llm-client.js";

export interface DecompositionResult {
  jobs: BuildJob[];
  summary: string;
  sessionId: string;
  runId: string;
}

interface RawJob {
  id: string;
  name: string;
  description: string;
  targetFiles: string[];
  dependencies: string[];
  jobType?: string;
}

interface RawDecomposition {
  summary: string;
  jobs: RawJob[];
}

const VALID_JOB_TYPES = new Set(["code", "workflow", "config", "schema"]);

function validate(parsed: RawDecomposition): string[] {
  const errors: string[] = [];
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

export async function decomposePrd(
  deps: AgentClientDeps,
  agentId: string,
  companyId: string,
  projectId: string,
  prdText: string,
  onProgress?: (message: string) => void,
): Promise<DecompositionResult> {
  onProgress?.("Sending PRD to decomposer agent...");

  const response = await callAgent(deps, {
    agentId,
    companyId,
    prompt: `Decompose the following PRD into build jobs:\n\n${prdText}`,
    onProgress,
  });

  onProgress?.("Agent responded. Parsing build jobs...");

  // Extract JSON from the response — strip markdown fencing if present
  let jsonText = response.content.trim();
  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonText = fenceMatch[1].trim();

  // Try to find JSON object if there's surrounding text
  if (!jsonText.startsWith("{")) {
    const jsonStart = jsonText.indexOf("{");
    const jsonEnd = jsonText.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonText = jsonText.slice(jsonStart, jsonEnd + 1);
    }
  }

  let parsed: RawDecomposition;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(
      `Failed to parse agent response as JSON: ${(e as Error).message}\n\nRaw response (first 500 chars):\n${response.content.slice(0, 500)}`
    );
  }

  const errors = validate(parsed);
  if (errors.length > 0) {
    throw new Error(`Decomposition validation failed:\n${errors.join("\n")}`);
  }

  onProgress?.(`Validated ${parsed.jobs.length} build jobs. Saving...`);

  // Convert raw jobs to BuildJob entities
  const jobs: BuildJob[] = parsed.jobs.map((raw) => ({
    id: raw.id,
    projectId,
    name: raw.name,
    description: raw.description,
    targetFiles: raw.targetFiles,
    dependencies: raw.dependencies || [],
    jobType: (VALID_JOB_TYPES.has(raw.jobType || "") ? raw.jobType : "code") as BuildJobType,
    status: "pending",
    popebotJobId: null,
    prUrl: null,
    dispatchedAt: null,
    completedAt: null,
  }));

  return {
    jobs,
    summary: parsed.summary,
    sessionId: response.sessionId,
    runId: response.runId,
  };
}
