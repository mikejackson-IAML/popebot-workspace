The review is ready but needs write permission. Here's the full review:

---

# Code Review: dev-department Plugin — Round 5

## Verdict: **REQUEST CHANGES**

1 critical compile-time failure remains. All prior critical issues are resolved.

---

## Status of Prior Findings

| Round | # | Issue | Status |
|-------|---|-------|--------|
| R2-CR | 1 | DepartmentView passes wrong props to PhaseDetail | **FIXED** — now passes all 12 props |
| R2-CR | 2 | Default import of named export (ConversationRefs) | **FIXED** |
| R2-CR | 3 | Project-scoped conversation refs not cascade-deleted | **FIXED** |
| R2-CR | 4 | Phase 2 entities not cascade-deleted in deletePhase | **FIXED** |
| R4-CR | 1 | DepartmentView passes incomplete props to PhaseDetail | **FIXED** |
| R4-CR | 2 | index.tsx uses named import of default export | **FIXED** — uses `import DepartmentView from` |
| R4-CR | 3 | PhaseList delete has no confirmation | **FIXED** — uses `window.confirm()` |

---

## Critical Issues

### 1. `DepartmentView.tsx` missing `useState` import — compile failure

`DepartmentView.tsx:1` — The file imports only types and components:

```tsx
import type { DevProject, Phase, ProjectStatus, ConversationReference } from "../../worker/types";
```

But the component body uses `useState` extensively (lines 33-37). There is **no import of `useState`** from `"react"`. With `"jsx": "react-jsx"` in tsconfig, `React` doesn't need to be in scope for JSX, but `useState` absolutely must be imported.

This is a TypeScript compile error under `strict: true`.

**Fix:** Add `import { useState } from "react";` at the top of the file.

---

## Minor Issues (not blocking)

**2.** Redundant `as` casts in `ConversationRefs.tsx:107-110`, `148-149`, `180-181` — casts on already-typed fields.

**3.** `PhaseDetail.tsx:121` — `useEffect` depends on `[phase.id]` only; won't re-sync draft if phase fields change without id changing.

**4.** `ConversationReference.status` never editable from UI — hardcoded `"active"` on add.

**5.** `hasSpec`/`hasPRD` never passed to `PhaseList` — Spec/PRD badges will never render.

---

## NOTE for Phase 2

- State machine validation not present — expected for Phase 2/3.
- Worker/UI persistence wiring not present — expected for Phase 2.
- ProjectHeader local state doesn't re-sync from props on external update — will cause data loss when persistence is wired.
- `AttachForm` only captures `title`/`sourceRef`; constructing a full `Spec`/`PRD` will need defaults or expanded form.

---

## Required Changes Summary

| # | Severity | File:Line | Fix |
|---|----------|-----------|-----|
| 1 | **Critical** | `DepartmentView.tsx:1` | Add `import { useState } from "react"` |
