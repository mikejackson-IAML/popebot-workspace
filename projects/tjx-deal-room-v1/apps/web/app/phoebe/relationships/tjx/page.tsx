/**
 * /phoebe/relationships/tjx — TJX Deal Room page
 *
 * Server component. Fetches all deal room data from the local API route
 * (which handles memory proxy + email generation), then hands the result
 * to the DealRoom client component.
 *
 * Auth: Gated by the existing tenant middleware applied at the /phoebe layout
 * level. No additional auth check is required here.
 */

import type { Metadata } from "next";
import { headers } from "next/headers";
import { DealRoom } from "@/components/phoebe/relationships/DealRoom";
import type { TjxDealRoomPayload } from "@/app/api/phoebe/relationships/tjx/route";

export const metadata: Metadata = {
  title: "TJX Companies — Deal Room | Mission Control",
  description: "Relationship tracking for TJX Companies (Pam Vivera, in-house IAML training)",
};

// Disable page-level caching so memory data is always fresh
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Builds the absolute URL for the internal API route.
 * Works in both server-rendering and edge runtime by reading the Host header.
 */
async function buildApiUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}/api/phoebe/relationships/tjx`;
}

async function fetchDealRoomData(): Promise<TjxDealRoomPayload> {
  const url = await buildApiUrl();

  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (networkErr) {
    // Network failure — return graceful empty state
    return {
      contact: null,
      interactions: [],
      draftEmail: null,
      lastInteractionDate: null,
      errors: [
        `Memory service unreachable: ${
          networkErr instanceof Error ? networkErr.message : String(networkErr)
        }`,
      ],
    };
  }

  if (!res.ok) {
    return {
      contact: null,
      interactions: [],
      draftEmail: null,
      lastInteractionDate: null,
      errors: [`API returned ${res.status} — please try refreshing.`],
    };
  }

  return res.json() as Promise<TjxDealRoomPayload>;
}

export default async function TjxDealRoomPage() {
  const data = await fetchDealRoomData();
  return <DealRoom data={data} />;
}
