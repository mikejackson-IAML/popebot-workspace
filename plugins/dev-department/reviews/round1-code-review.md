# Code Review: dev-department Plugin — Round 4

## Verdict: **REQUEST CHANGES**

2 critical compile-time failures remain from prior rounds. 1 moderate issue persists.

---

## Status of Prior Findings

| Round | # | Issue | Status |
|-------|---|-------|--------|
| R2-CR | 1 | DepartmentView passes wrong props to PhaseDetail | **STILL PRESENT** — `DepartmentView.tsx:131-137` still passes only 5 of 12 required props |
| R2-CR | 2 | Default import of named export (ConversationRefs) | **FIXED** — both files use `{ ConversationRefs }` |
| R2-CR | 3 | Project-scoped conversation refs not cascade-deleted | **FIXED** — `state.ts:34-38` |
| R2-CR | 4 | Phase 2 entities not cascade-deleted in deletePhase | **FIXED** — `state.ts:78-81` |
| R3-CR | 2 | index.tsx uses named import of default export | **STILL PRESENT** — `index.tsx:2` uses `{ DepartmentView }` but `DepartmentView.tsx` uses `export default` |
| R3-CR | 3 | PhaseList delete has no confirmation | **STILL PRESENT** — `PhaseList.tsx:184-196` bare `×` button |

---

## Critical Issues

### 1. DepartmentView passes incomplete props to PhaseDetail — compile failure

`DepartmentView.tsx:131-137`:

```tsx
<PhaseDetail
  phase={selectedPhase}
  spec={null}
  prd={null}
  onSave={handleSavePhase}
  onCancel={() => setSelectedPhase(null)}
/>
```

`PhaseDetailProps` (`PhaseDetail.tsx:94-106`) requires 12 props. **Missing:**
- `conversationRefs`
- `onAttachSpec`
- `onAttachPRD`
- `onAddConversationRef`
- `onUpdateConversationRef`
- `onDeleteConversationRef`

This is a TypeScript compile error under `strict: true`.

**Fix:** Either pass all required props (wire up handlers using the existing `conversationRefs` state and `handleAddRef`/`handleUpdateRef`/`handleDeleteRef` already in `DepartmentView`), or make the missing props optional in `PhaseDetailProps` if intentionally stubbed.

### 2. index.tsx uses named import of default export — compile failure

`src/ui/index.tsx:2`:
```tsx
import { DepartmentView } from './components/DepartmentView';
```

`DepartmentView.tsx` uses `export default function DepartmentView`. Named import `{ DepartmentView }` resolves to `undefined`.

**Fix:** Change to `import DepartmentView from './components/DepartmentView'`.

---

## Moderate Issues

### 3. PhaseList delete has no confirmation — inconsistent with PhaseDetail

`PhaseList.tsx:184-196` — The `×` button calls `onDelete(phase.id)` immediately. `PhaseDetail.tsx` has proper two-step confirmation. A misclick cascades through specs, PRDs, conversation refs, and Phase 2 entities.

**Fix:** Add confirmation before calling `onDelete`.

---

## Minor Issues (not blocking)

### 4. Redundant `as` casts in ConversationRefs
`ConversationRefs.tsx:107-110`, `148-149`, `180-181` — casts on already-typed fields.

### 5. useEffect dependency on `phase.id` only
`PhaseDetail.tsx:109` — won't re-sync draft if phase fields change without id changing.

### 6. `ConversationReference.status` never editable from UI
`ConversationRefs.tsx` hardcodes `status: "active"` on add; `EditingState` omits `status`.

---

## NOTE for Phase 2

- State machine validation (status transitions, freeze state enforcement) is not present — expected for Phase 2/3.
- Worker/UI persistence wiring not present — expected for Phase 2.
- `getBuildDispatchByPhase`/`getReviewByPhase` return first match only (1:1) — will need 1:many for rework cycles.

---

## Required Changes Summary

| # | Severity | File:Line | Fix |
|---|----------|-----------|-----|
| 1 | **Critical** | `DepartmentView.tsx:131-137` | Pass all 12 required props to `PhaseDetail` |
| 2 | **Critical** | `src/ui/index.tsx:2` | Change to default import: `import DepartmentView from` |
| 3 | Moderate | `PhaseList.tsx:184-196` | Add delete confirmation before calling `onDelete` |
