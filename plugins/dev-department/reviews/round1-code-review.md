# Code Review: dev-department Plugin — Round 6

## Verdict: **APPROVE**

No critical or blocking issues remain. All prior critical findings are resolved.

---

## Status of Prior Findings

| Round | # | Issue | Status |
|-------|---|-------|--------|
| R2-CR | 1 | DepartmentView passes wrong props to PhaseDetail | **FIXED** |
| R2-CR | 2 | Default import of named export (ConversationRefs) | **FIXED** |
| R2-CR | 3 | Project-scoped conversation refs not cascade-deleted | **FIXED** |
| R2-CR | 4 | Phase 2 entities not cascade-deleted in deletePhase | **FIXED** |
| R5-CR | 1 | Missing `useState` import in DepartmentView | **FIXED** — `DepartmentView.tsx:1` now has `import React, { useState } from "react"` |

---

## Minor Issues (not blocking)

**1. Redundant `as` casts in ConversationRefs.tsx** — STILL PRESENT
`ConversationRefs.tsx:107-110`, `148-149`, `180-181` — `r.system as ConversationSystem` and `r.role as ConversationRole` where `r` is already typed as `ConversationReference`. Harmless but noisy.

**2. PhaseDetail useEffect depends on `[phase.id]` only** — STILL PRESENT
`PhaseDetail.tsx:121` — Won't re-sync draft if phase fields change without id changing. Low risk in Phase 1 since edits come from the same component.

**3. `ConversationReference.status` never editable from UI** — STILL PRESENT
Hardcoded `"active"` on add, no way to transition. Acceptable for Phase 1.

**4. `hasSpec`/`hasPRD` never passed to PhaseList** — STILL PRESENT
`DepartmentView.tsx:195` — `PhaseList` receives no `hasSpec`/`hasPRD` props, so Spec/PRD badges never render. Not a compile error — props default to `{}`.

**5. `handleDeletePhase` reads stale `selectedProject` via `handleSaveProject`** — STILL PRESENT
`DepartmentView.tsx:95-98` — Deleting the active phase calls `handleSaveProject({ activePhaseId: null })` which spreads over the captured `selectedProject`, potentially overwriting unsaved ProjectHeader edits. Low risk in Phase 1; should be fixed before persistence is wired.

---

## NOTE for Phase 2

- Worker/UI persistence wiring not present — expected.
- State machine validation not present — expected for Phase 3.
- `handleSaveProject` stale closure pattern (item 5 above) will become a race condition once persistence is wired. Switch to functional updater before Phase 2.
- `handleAttachSpec`/`handleAttachPRD` are no-op stubs — expected.
- `sortOrder`/`phaseNumber` diverge after reordering — cosmetic in Phase 1, should be addressed when persistence lands.

---

## Positive Observations

- **No `any` types** anywhere in the codebase.
- **All imports correct**: named exports use `{ }` imports, default exports use bare imports.
- **All PhaseDetail props satisfied**: `DepartmentView.tsx:149-160` passes all 12 required props.
- **Cascade deletes complete**: `state.ts:deleteProject` handles project-scoped refs, `deletePhase` handles specs, PRDs, conversation refs, and all Phase 2 entity maps.
- **Plugin manifest valid**: slots, entrypoints, capabilities all correctly declared.
- **Data model is clean**: no shapes that would require breaking migration if deferred items are added later.
