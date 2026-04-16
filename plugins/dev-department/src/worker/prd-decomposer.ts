// =============================================================================
// PRD Decomposer — Opus decomposes a PRD into ordered BuildJob[]
// =============================================================================
import type { BuildJob, BuildJobType } from "./types.js";
import { callLLM, type LLMClientDeps, type LLMResponse } from "./llm-client.js";

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

const SYSTEM_PROMPT = `You are an expert software architect. Your job is to decompose a Product Requirements Document (PRD) into a minimal ordered list of discrete build jobs.

## Rules

1. Each build job must target 1-3 files maximum. If more files are needed, split into multiple jobs.
2. Order jobs by dependency — jobs that other jobs depend on come first.
3. Each job gets a temporary ID like "job-1", "job-2", etc. Dependencies reference these IDs.
4. Be specific about which files will be created or modified. Use real file paths.
5. Keep job names short and action-oriented (e.g. "Create user auth service", "Add login page UI").
6. Each job description should be detailed enough for an AI coding agent to implement it without ambiguity.
7. Aim for the minimum number of jobs that covers the full PRD scope.

## Job Types

Not every job is a code file. Jobs can target:
- **Source code** — .ts, .tsx, .py, .js, etc. (jobType: "code")
- **Workflow definitions** — n8n workflow JSON, automation configs (jobType: "workflow")
- **Configuration** — environment variables, service configs, docker-compose changes (jobType: "config")
- **Schema/data** — database migrations, API schemas, type definitions (jobType: "schema")

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
      "dependencies": [],
      "jobType": "code"
    },
    {
      "id": "job-2",
      "name": "Another job name",
      "description": "Detailed instructions...",
      "targetFiles": ["path/to/file3.ts"],
      "dependencies": ["job-1"],
      "jobType": "code"
    }
  ]
}

Valid jobType values: "code", "workflow", "config", "schema"`;

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
  deps: LLMClientDeps,
  projectId: string,
  prdText: string,
  onProgress?: (message: string) => void,
): Promise<DecompositionResult> {
  onProgress?.("Sending PRD to Opus for decomposition...");

  const { response, usageRecord } = await callLLM(deps, {
    model: "sonnet",
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
    throw new Error(`Failed to parse Opus response as JSON: ${(e as Error).message}\n\nRaw response:\n${response.content.slice(0, 500)}`);
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
    response,
    usageRecord,
  };
}
