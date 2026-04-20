## Devils Advocate Review — Round 1

**Verdict: CONCERNS**

---

### 1. `React` namespace used without import (compile risk)

`src/ui/index.tsx` references `React.FC<P>`, `React.ReactNode`, and `React.ChangeEvent<HTMLInputElement>` without importing the `React` namespace. With `jsx: "react-jsx"`, JSX transforms are auto-injected, but type-level namespace references still require an explicit import.

This was flagged as a REJECT by the round-1 codex gate and acknowledged (but not confirmed) by round-2 codex. The dist `.d.ts` files exist and appear correct, so the build may have succeeded under a different environment or older source. **I cannot confirm a hard compile failure without running `tsc`, so I'm not blocking**, but this is the single highest-risk item.

**NOTE for Phase 2:** Add `import type React from "react"` or destructure the needed types (`FC`, `ReactNode`, `ChangeEvent`) at the top of `src/ui/index.tsx`. One-line fix.

### 2. UI `ReviewVerdict` includes `"reject"` not in worker type

The UI's local `ReviewVerdict` adds `"reject"` which doesn't exist in `src/worker/types.ts`. Structurally safe (UI is more permissive), but the drift means a future refactor that imports from the canonical type will silently drop it.

**NOTE for Phase 2:** Unify UI types with worker types via shared import or re-export.

### 3. `usePluginAction` called inside event handler (ActionBar fallback)

The `ActionBar` fallback component assigns `usePluginAction` to `act` and calls `act(a.actionKey)` inside an `onClick` handler. If the SDK treats this as a React hook, it violates rules of hooks. Works only if the SDK exports it as a plain function.

**NOTE for Phase 3:** Verify SDK contract; if it's a hook, lift calls to component top level.

---

No compile errors confirmed, no wrong imports, no missing props, no breaking data model issues. All concerns are future-phase.

---
REVIEW_TIER: claude

---
REVIEW_TIER: claude
