"use client";

/**
 * DealRoom — TJX Relationship Page UI
 *
 * Client component that renders all six sections of the TJX Deal Room:
 *   1. Header — company name, stage, days since last interaction
 *   2. Primary Contact Card — Pam Vivera's behavioral profile
 *   3. Open Commitments — mine-to-hers / hers-to-mine checklists (visual only)
 *   4. Interaction Timeline — newest-first, expandable entries
 *   5. Next Action Card — highlighted open commitment + LLM-drafted email
 *   6. Compose in Gmail — pre-filled compose button
 */

import { useState } from "react";
import type {
  ContactProfile,
  DraftEmail,
  Interaction,
  TjxDealRoomPayload,
} from "@/app/api/phoebe/relationships/tjx/route";

// Re-export types for convenience
export type { TjxDealRoomPayload };

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - then.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z"); // noon UTC avoids TZ shifts
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mediumLabel(medium: Interaction["medium"]): string {
  const labels: Record<Interaction["medium"], string> = {
    phone: "📞 Phone",
    email: "✉️ Email",
    "in-person": "🤝 In-person",
    other: "💬 Other",
  };
  return labels[medium];
}

function buildGmailUrl(
  email: string,
  subject: string,
  body: string
): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: email,
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// 1. Header Section

interface HeaderSectionProps {
  lastInteractionDate: string | null;
}

function HeaderSection({ lastInteractionDate }: HeaderSectionProps) {
  const days = daysSince(lastInteractionDate);

  return (
    <div className="border-b border-zinc-700 pb-6 mb-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-400 mb-1">
            IAML · Relationship
          </p>
          <h1 className="text-3xl font-bold text-white">TJX Companies</h1>
          <p className="mt-1 text-zinc-300 text-sm">
            In-house training program — planning
          </p>
        </div>
        <div className="text-right">
          <span className="inline-block bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium px-3 py-1 rounded-full">
            Planning Stage
          </span>
          {days !== null && (
            <p className="mt-2 text-zinc-400 text-xs">
              {days === 0
                ? "Last interaction today"
                : `Last interaction ${days} day${days === 1 ? "" : "s"} ago`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// 2. Primary Contact Card

interface ContactCardProps {
  contact: ContactProfile;
}

function ContactCard({ contact }: ContactCardProps) {
  return (
    <section className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-4">
        Primary Contact
      </h2>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-semibold text-sm select-none">
          {contact.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div>
          <p className="text-white font-semibold">{contact.name}</p>
          <p className="text-zinc-400 text-sm">{contact.company}</p>
          {contact.role && (
            <p className="text-zinc-500 text-xs">{contact.role}</p>
          )}
        </div>
      </div>

      {contact.behavioralProfile.length > 0 && (
        <div className="mb-4">
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide mb-2">
            Behavioral Profile
          </p>
          <ul className="space-y-1">
            {contact.behavioralProfile.map((trait, i) => (
              <li key={i} className="text-zinc-300 text-sm flex items-start gap-2">
                <span className="text-violet-400 mt-0.5 shrink-0">·</span>
                {trait}
              </li>
            ))}
          </ul>
        </div>
      )}

      {contact.preferences.length > 0 && (
        <div className="mb-4">
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide mb-2">
            Preferences
          </p>
          <div className="flex flex-wrap gap-2">
            {contact.preferences.map((pref, i) => (
              <span
                key={i}
                className="bg-violet-900/40 border border-violet-700/50 text-violet-300 text-xs px-2 py-0.5 rounded-full"
              >
                {pref}
              </span>
            ))}
          </div>
        </div>
      )}

      {contact.personalNotes.length > 0 && (
        <div>
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide mb-2">
            Personal Notes
          </p>
          <ul className="space-y-1">
            {contact.personalNotes.map((note, i) => (
              <li key={i} className="text-zinc-300 text-sm flex items-start gap-2">
                <span className="text-amber-400 mt-0.5 shrink-0">⚑</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// 3. Open Commitments

interface CommitmentsProps {
  commitments: ContactProfile["commitments"];
}

function CommitmentsSection({ commitments }: CommitmentsProps) {
  return (
    <section className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-4">
        Open Commitments
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Mine to her */}
        <div>
          <p className="text-zinc-300 text-sm font-medium mb-3">Mine to her</p>
          {commitments.mineToHer.length === 0 ? (
            <p className="text-zinc-500 text-sm italic">None open</p>
          ) : (
            <ul className="space-y-2">
              {commitments.mineToHer.map((item, i) => (
                <li key={i} className="flex items-start gap-2 group">
                  <input
                    type="checkbox"
                    disabled
                    className="mt-0.5 shrink-0 accent-violet-500 cursor-default"
                    aria-label={item}
                  />
                  <span
                    className={`text-sm ${
                      i === 0
                        ? "text-white font-medium"
                        : "text-zinc-300"
                    }`}
                  >
                    {item}
                    {i === 0 && (
                      <span className="ml-2 text-xs text-amber-400 font-medium">
                        Next Action
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Hers to me */}
        <div>
          <p className="text-zinc-300 text-sm font-medium mb-3">Hers to me</p>
          {commitments.hersToMe.length === 0 ? (
            <p className="text-zinc-500 text-sm italic">None open</p>
          ) : (
            <ul className="space-y-2">
              {commitments.hersToMe.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    disabled
                    className="mt-0.5 shrink-0 accent-violet-500 cursor-default"
                    aria-label={item}
                  />
                  <span className="text-zinc-300 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

// 4. Interaction Timeline

interface TimelineSectionProps {
  interactions: Interaction[];
}

function TimelineSection({ interactions }: TimelineSectionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (interactions.length === 0) {
    return (
      <section className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5">
        <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-4">
          Interaction Timeline
        </h2>
        <p className="text-zinc-500 text-sm italic">No interactions logged yet.</p>
      </section>
    );
  }

  return (
    <section className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-4">
        Interaction Timeline
      </h2>
      <ol className="relative border-l border-zinc-700 space-y-0">
        {interactions.map((interaction, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <li key={i} className="ml-4 pb-6 last:pb-0">
              {/* Timeline dot */}
              <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full border-2 border-zinc-600 bg-zinc-900" />

              <button
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
                className="w-full text-left group focus:outline-none"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <time
                      dateTime={interaction.date}
                      className="text-zinc-400 text-xs font-mono"
                    >
                      {formatDate(interaction.date)}
                    </time>
                    <span className="text-zinc-500 text-xs">
                      {mediumLabel(interaction.medium)}
                    </span>
                  </div>
                  <span className="text-zinc-500 text-xs group-hover:text-zinc-300 transition-colors shrink-0">
                    {isExpanded ? "↑ collapse" : "↓ expand"}
                  </span>
                </div>
                <p className="mt-0.5 text-zinc-200 text-sm font-medium group-hover:text-white transition-colors">
                  {interaction.topic}
                </p>
              </button>

              {isExpanded && interaction.body && (
                <div className="mt-3 pl-0 pr-4 text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed border-l-2 border-violet-700/50 pl-3">
                  {interaction.body}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// 5 & 6. Next Action Card + Gmail Button

interface NextActionCardProps {
  nextAction: string;
  draftEmail: DraftEmail | null;
  contact: ContactProfile;
}

function NextActionCard({ nextAction, draftEmail, contact }: NextActionCardProps) {
  const [copied, setCopied] = useState(false);

  const gmailUrl =
    draftEmail && contact.email
      ? buildGmailUrl(contact.email, draftEmail.subject, draftEmail.body)
      : null;

  const missingEmail = !contact.email;

  function handleCopy() {
    if (!draftEmail) return;
    navigator.clipboard.writeText(draftEmail.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="bg-zinc-800/60 border border-violet-700/40 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-zinc-400 mb-4">
        Next Action
      </h2>

      {/* Highlighted next action */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 mb-5">
        <p className="text-amber-300 text-xs font-medium uppercase tracking-wide mb-1">
          Your next move
        </p>
        <p className="text-white font-semibold">{nextAction}</p>
      </div>

      {/* Draft email */}
      {draftEmail ? (
        <div>
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide mb-2">
            Draft Email
          </p>

          <div className="bg-zinc-900/60 border border-zinc-700 rounded-lg p-4 mb-4">
            <p className="text-zinc-400 text-xs mb-1">Subject</p>
            <p className="text-zinc-100 text-sm font-medium mb-4">
              {draftEmail.subject}
            </p>
            <p className="text-zinc-400 text-xs mb-1">Body</p>
            <p className="text-zinc-200 text-sm whitespace-pre-wrap leading-relaxed">
              {draftEmail.body}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Gmail compose button */}
            {gmailUrl ? (
              <a
                href={gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                  <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
                </svg>
                Compose in Gmail
              </a>
            ) : null}

            {/* Copy body fallback */}
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              {copied ? "Copied!" : "Copy email body"}
            </button>

            {/* Warning if no email */}
            {missingEmail && (
              <p className="text-amber-400 text-xs">
                ⚠ Pam&apos;s email address is not in the contact hub — add it to
                enable Gmail compose.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/40 border border-zinc-700 rounded-lg p-4 text-zinc-400 text-sm italic">
          Email draft could not be generated. Check the error banner above or
          refresh the page to try again.
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Error banner
// ---------------------------------------------------------------------------

interface ErrorBannerProps {
  errors: string[];
}

function ErrorBanner({ errors }: ErrorBannerProps) {
  if (errors.length === 0) return null;
  return (
    <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 mb-6">
      <p className="text-red-400 text-xs font-medium uppercase tracking-wide mb-2">
        Some data could not be loaded
      </p>
      <ul className="space-y-1">
        {errors.map((err, i) => (
          <li key={i} className="text-red-300 text-sm">
            {err}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main DealRoom component
// ---------------------------------------------------------------------------

interface DealRoomProps {
  data: TjxDealRoomPayload;
}

export function DealRoom({ data }: DealRoomProps) {
  const { contact, interactions, draftEmail, lastInteractionDate, errors } = data;

  const nextAction =
    contact?.commitments.mineToHer[0] ?? "Send instructor availability";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Section 1 — Header */}
        <HeaderSection lastInteractionDate={lastInteractionDate} />

        {/* Error banner (shown inline, not a crash) */}
        <ErrorBanner errors={errors} />

        {/* Section 2 — Contact Card */}
        {contact ? (
          <ContactCard contact={contact} />
        ) : (
          <section className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5 text-zinc-400 text-sm italic">
            Contact profile unavailable — check memory service.
          </section>
        )}

        {/* Section 3 — Open Commitments */}
        {contact ? (
          <CommitmentsSection commitments={contact.commitments} />
        ) : (
          <section className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5 text-zinc-400 text-sm italic">
            Commitments unavailable.
          </section>
        )}

        {/* Section 4 — Interaction Timeline */}
        <TimelineSection interactions={interactions} />

        {/* Sections 5 & 6 — Next Action + Gmail */}
        {contact ? (
          <NextActionCard
            nextAction={nextAction}
            draftEmail={draftEmail}
            contact={contact}
          />
        ) : (
          <section className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-5 text-zinc-400 text-sm italic">
            Next action card unavailable — contact profile could not be loaded.
          </section>
        )}
      </div>
    </div>
  );
}
