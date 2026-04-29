/**
 * GET /api/phoebe/relationships/tjx
 *
 * Server-side data loader for the TJX Deal Room page.
 * Fetches Pam Vivera's contact hub and TJX interaction history from the memory
 * proxy, then generates a draft follow-up email via Claude.
 *
 * All network calls are wrapped in try/catch so partial failures degrade
 * gracefully — the response always returns 200 with an `errors` array.
 */

import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContactCommitments {
  mineToHer: string[];
  hersToMe: string[];
}

export interface ContactProfile {
  name: string;
  email: string;
  company: string;
  role: string;
  behavioralProfile: string[];
  preferences: string[];
  personalNotes: string[];
  commitments: ContactCommitments;
}

export interface Interaction {
  date: string; // ISO date string, e.g. "2026-04-24"
  medium: "phone" | "email" | "in-person" | "other";
  topic: string;
  body: string;
}

export interface DraftEmail {
  subject: string;
  body: string;
}

export interface TjxDealRoomPayload {
  contact: ContactProfile | null;
  interactions: Interaction[];
  draftEmail: DraftEmail | null;
  lastInteractionDate: string | null;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Memory proxy helpers
// ---------------------------------------------------------------------------

const MEMORY_PROXY_URL = process.env.MEMORY_PROXY_URL ?? "";

/**
 * Calls the memory proxy search endpoint and returns raw document results.
 * The proxy is expected to return a JSON array of documents, each with
 * `frontmatter` (parsed YAML) and `body` (markdown string) fields.
 */
async function searchMemory(
  query: string
): Promise<Array<{ frontmatter: Record<string, unknown>; body: string }>> {
  if (!MEMORY_PROXY_URL) {
    throw new Error(
      "MEMORY_PROXY_URL is not configured. Set this environment variable."
    );
  }
  const url = `${MEMORY_PROXY_URL}/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Memory proxy returned ${res.status} for query "${query}": ${await res.text()}`
    );
  }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error(`Memory proxy returned unexpected shape for query "${query}"`);
  }
  return data as Array<{ frontmatter: Record<string, unknown>; body: string }>;
}

function asStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === "string");
}

function asString(val: unknown, fallback = ""): string {
  return typeof val === "string" ? val : fallback;
}

// ---------------------------------------------------------------------------
// Contact hub fetcher
// ---------------------------------------------------------------------------

async function fetchPamVivera(): Promise<ContactProfile> {
  const docs = await searchMemory("Pam Vivera contact hub TJX");

  // Pick the most relevant document — the one whose frontmatter name matches
  const doc =
    docs.find((d) => {
      const name = asString(d.frontmatter["name"]);
      return name.toLowerCase().includes("pam") || name.toLowerCase().includes("vivera");
    }) ?? docs[0];

  if (!doc) {
    throw new Error("Pam Vivera contact hub not found in memory system");
  }

  const fm = doc.frontmatter;

  // Commitments may be nested object or separate keys
  const rawCommitments = fm["commitments"] as Record<string, unknown> | undefined;
  const mineToHer = rawCommitments
    ? asStringArray(rawCommitments["mine_to_her"] ?? rawCommitments["mineToHer"])
    : asStringArray(fm["mine_to_her"]);
  const hersToMe = rawCommitments
    ? asStringArray(rawCommitments["hers_to_me"] ?? rawCommitments["hersToMe"])
    : asStringArray(fm["hers_to_me"]);

  return {
    name: asString(fm["name"], "Pam Vivera"),
    email: asString(fm["email"], ""),
    company: asString(fm["company"], "TJX Companies"),
    role: asString(fm["role"], ""),
    behavioralProfile: asStringArray(
      fm["behavioral_profile"] ?? fm["behavioralProfile"]
    ),
    preferences: asStringArray(fm["preferences"]),
    personalNotes: asStringArray(
      fm["personal_notes"] ?? fm["personalNotes"]
    ),
    commitments: { mineToHer, hersToMe },
  };
}

// ---------------------------------------------------------------------------
// Interaction timeline fetcher
// ---------------------------------------------------------------------------

const MEDIUM_VALUES = ["phone", "email", "in-person", "other"] as const;
type Medium = (typeof MEDIUM_VALUES)[number];

function toMedium(val: unknown): Medium {
  if (typeof val === "string" && (MEDIUM_VALUES as readonly string[]).includes(val)) {
    return val as Medium;
  }
  return "other";
}

async function fetchTjxInteractions(): Promise<Interaction[]> {
  const docs = await searchMemory("TJX interaction company:tjx");

  const interactions: Interaction[] = docs
    .filter((d) => {
      const company = asString(d.frontmatter["company"]);
      const tags = asStringArray(d.frontmatter["tags"]);
      return (
        company.toLowerCase() === "tjx" ||
        tags.some((t) => t.toLowerCase() === "tjx")
      );
    })
    .map((d): Interaction => ({
      date: asString(d.frontmatter["date"]),
      medium: toMedium(d.frontmatter["medium"]),
      topic: asString(d.frontmatter["topic"]),
      body: d.body.trim(),
    }));

  // Sort newest-first
  interactions.sort((a, b) => b.date.localeCompare(a.date));

  return interactions;
}

// ---------------------------------------------------------------------------
// Email draft generator
// ---------------------------------------------------------------------------

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DRAFT_MODEL = "claude-sonnet-4-6";

function buildEmailPrompt(
  contact: ContactProfile,
  interactions: Interaction[],
  nextAction: string
): string {
  const recentInteractions = interactions
    .slice(0, 3)
    .map((i) => `- ${i.date} (${i.medium}): ${i.topic}\n  ${i.body.slice(0, 300)}`)
    .join("\n\n");

  const behaviorPoints = contact.behavioralProfile.join("; ");
  const personalNotes = contact.personalNotes.join("; ");

  return `You are drafting a professional email from Mike (IAML founder) to ${contact.name} at TJX Companies.

RECIPIENT BEHAVIORAL PROFILE:
${behaviorPoints}

PERSONAL NOTES (use tastefully, not mechanically):
${personalNotes}

STATED PREFERENCES:
${contact.preferences.join("; ")}

RECENT INTERACTION HISTORY:
${recentInteractions || "No recent interactions logged."}

NEXT ACTION (this email's purpose):
${nextAction}

MIKE'S VOICE PROFILE:
Mike writes with warmth and directness. He is collegial, not formal — avoids corporate jargon. He leads with the most important thing first, keeps emails short, and uses plain language. He never over-explains. His closing lines feel genuinely personal, not boilerplate. He signs off simply.

INSTRUCTIONS:
1. Open with a brief, warm check-in. Acknowledge ${contact.personalNotes.some((n) => n.toLowerCase().includes("dog")) ? "Pam's dog (she mentioned her 13-year-old dog's health — a small but meaningful acknowledgment)" : "the recent conversation"}.
2. Transition naturally to the purpose: ${nextAction}.
3. Frame the content around virtual delivery and cross-functional scope — Pam's stated preferences.
4. If specific instructor availability dates are not available in this context, use clear placeholder text like [INSTRUCTOR NAME] and [DATES TBD].
5. Keep the email under 200 words. Do not use bullet points — flowing prose only.
6. End with a genuine, low-pressure closing.

Return your response as a JSON object with exactly two fields:
{
  "subject": "<email subject line>",
  "body": "<full email body, plain text, no markdown>"
}`;
}

async function generateDraftEmail(
  contact: ContactProfile,
  interactions: Interaction[],
  nextAction: string
): Promise<DraftEmail> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set — cannot generate email draft");
  }

  const prompt = buildEmailPrompt(contact, interactions, nextAction);

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: DRAFT_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  const rawText = data.content
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text!)
    .join("");

  // Parse the JSON response from the model
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Model did not return valid JSON for email draft");
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    subject?: unknown;
    body?: unknown;
  };

  return {
    subject: asString(parsed.subject, "Following up — instructor availability"),
    body: asString(
      parsed.body,
      "Unable to generate email body — please try refreshing the page."
    ),
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse<TjxDealRoomPayload>> {
  const errors: string[] = [];

  let contact: ContactProfile | null = null;
  let interactions: Interaction[] = [];
  let draftEmail: DraftEmail | null = null;
  let lastInteractionDate: string | null = null;

  // 1. Fetch contact profile
  try {
    contact = await fetchPamVivera();
  } catch (err) {
    errors.push(
      `Contact profile unavailable: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // 2. Fetch interactions
  try {
    interactions = await fetchTjxInteractions();
    lastInteractionDate = interactions[0]?.date ?? null;
  } catch (err) {
    errors.push(
      `Interactions unavailable: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // 3. Generate email draft (requires contact)
  if (contact) {
    const nextAction =
      contact.commitments.mineToHer[0] ?? "Send instructor availability";
    try {
      draftEmail = await generateDraftEmail(contact, interactions, nextAction);
    } catch (err) {
      errors.push(
        `Email draft unavailable: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return NextResponse.json({
    contact,
    interactions,
    draftEmail,
    lastInteractionDate,
    errors,
  });
}
