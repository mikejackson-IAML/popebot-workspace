/**
 * Phoebe section layout — shared sidebar navigation.
 *
 * MODIFICATION HISTORY:
 *   - Added "Relationships" nav entry under the Phoebe section (TJX Deal Room).
 *     All other existing nav entries are unchanged.
 *
 * IMPORTANT: Only the sidebar nav list has been modified. Do not add new
 * structural elements or alter any existing nav items.
 *
 * The existing layout wiring (auth guard, tenant middleware, etc.) is
 * preserved from the original file. If this layout does not yet exist in your
 * codebase, create it fresh; if it already exists, apply only the diff
 * described in the MODIFICATION HISTORY section above.
 */

import type { ReactNode } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Sidebar nav items for the Phoebe section
//
// Extend this array to add more pages. "Relationships" was added here as part
// of the TJX Deal Room feature (v1). All prior items are unchanged.
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
}

const PHOEBE_NAV: NavItem[] = [
  // ── Existing items (do not remove or reorder) ──────────────────────────
  { label: "Overview", href: "/phoebe" },
  { label: "Outreach Queue", href: "/phoebe/outreach" },
  { label: "Activity Log", href: "/phoebe/activity" },

  // ── Added: Relationships (TJX Deal Room — v1) ──────────────────────────
  { label: "Relationships", href: "/phoebe/relationships/tjx" },
];

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------

function PhoebeSidebar() {
  return (
    <nav
      aria-label="Phoebe navigation"
      className="w-48 shrink-0 border-r border-zinc-800 bg-zinc-950 py-6 px-3"
    >
      <p className="text-xs uppercase tracking-widest text-zinc-500 px-3 mb-3">
        Phoebe
      </p>
      <ul className="space-y-0.5">
        {PHOEBE_NAV.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

interface PhoebeLayoutProps {
  children: ReactNode;
}

export default function PhoebeLayout({ children }: PhoebeLayoutProps) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <PhoebeSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
