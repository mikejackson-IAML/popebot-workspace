Now I have the full picture. Let me produce the review.

---

# Code Review: dev-department Plugin — Round 3

## Verdict: **REQUEST CHANGES**

1 critical compile-time failure remains. 2 moderate issues. Most prior findings are fixed.

---

## Status of Prior Findings

| Round | # | Issue | Current Status |
|-------|---|-------|----------------|
| R1-CR | 1 | DepartmentView passes wrong props to PhaseDetail | **NOT FIXED** |
| R1-CR | 2 | Default import of named export (ConversationRefs) | **FIXED** (both files) |
| R1-CR | 3 | Project-scoped conversation refs not cascade-deleted | **FIXED** |
| R1-CR | 4 | Phase 2 entities not cascade-deleted in deletePhase | **FIXED** |
| R1-DA | 3 | sortOrder/phaseNumber divergence | Not fixed (accepted as known limitation) |
| R1-DA | 4 | Spec/PRD missing timestamps | **FIXED** (types + state.ts) |
| R1-DA | 7 | No delete confirmation in PhaseList | Not fixed (PhaseList still has bare `x`) |
| R2-CR | 3 | index.tsx uses named import of default export | **NOT FIXED** |
| R2-DA | 2 | BuildOutput missing FK to BuildDispatch | **FIXED** (`buildDispatchId` added) |

---

## Critical Issues

### 1. DepartmentView passes incomplete props to PhaseDetail — compile failure

`DepartmentView.tsx:113-119` — `PhaseDetail` is rendered with 5 props:

```tsx
<PhaseDetail
  phase={selectedPhase}
  spec={null}
  prd={null}
  onSave={handleSavePhase}
  onCancel={() => setSelectedPhase(null)}
/>
```

But `PhaseDetailProps` (at `PhaseDetail.tsx:94-106`) requires 12 props. **Missing required props:**
- `conversationRefs` — no default, will be `undefined` and passed to `ConversationRefs` child
- `onAttachSpec` — no default
- `onAttachPRD` — no default
- `onAddConversationRef` — no default
- `onUpdateConversationRef` — no default
- `onDeleteConversationRef` — no default

This is a TypeScript compile error under `strict: true`. The component will also crash at runtime when it tries to call `onAttachSpec(...)`.

**Fix:** Add handlers to `DepartmentView` for spec/PRD attachment and phase-scoped conversation refs, and pass all required props. Alternatively, make the missing props optional in `PhaseDetailProps` if the features are intentionally stubbed out — but that pushes the null-check burden into `PhaseDetail`.

### 2. index.tsx uses named import of default export — compile failure

`src/ui/index.tsx:2`:
```tsx
import { DepartmentView } from './components/DepartmentView';
```

But `DepartmentView.tsx` uses `export default function DepartmentView`. A named import `{ DepartmentView }` will resolve to `undefined`.

**Fix:** Change to `import DepartmentView from './components/DepartmentView'`.

---

## Moderate Issues

### 3. PhaseList delete has no confirmation — inconsistent with PhaseDetail

`PhaseList.tsx:184-196` — The `x` button calls `onDelete(phase.id)` immediately with no confirmation step. Compare with `PhaseDetail.tsx` which has a proper two-step confirmation (`showDeleteConfirm` state at line 105, confirm UI at lines 256-287). A misclick on the `x` cascades through specs, PRDs, conversation refs, and Phase 2 entities.

**Fix:** Add a confirmation step (inline confirm/cancel or `window.confirm`) before calling `onDelete`.

---

## Minor Issues (informational, not blocking)

### 4. Redundant `as` casts in ConversationRefs

`ConversationRefs.tsx:107-110` — `r.system as ConversationSystem` and `r.role as ConversationRole` are unnecessary since `r` is already typed as `ConversationReference`. Also present at lines 148-149, 180-181. Noise, not a bug.

### 5. useEffect dependency on `phase.id` only

`PhaseDetail.tsx:109` — `useEffect(() => { setDraft({...phase}); }, [phase.id])` won't re-sync the draft if the phase object changes without the id changing (e.g., after a save updates `updatedAt`). Should depend on `[phase]` or `[phase.id, phase.updatedAt]`.

### 6. `ConversationReference.status` field is write-once/never-editable

`ConversationRefs.tsx` hardcodes `status: "active"` on add (line 236). The `EditingState` interface (line 97) omits `status`, so edits can never transition a ref to `"reference"` or `"archived"`. Not blocking for Phase 1 but the field accumulates meaningless data.

---

## What's Working Well

- **No `any` types.** All Maps, props, state, and function signatures are properly typed with union types and generics.
- **Plugin manifest is valid.** `paperclip-plugin.json` has correct `apiVersion`, slots, capabilities, entrypoints, and `exportName` values that match actual exports.
- **Cascade deletes are comprehensive.** `deleteProject` now cleans project-scoped refs, `deletePhase` cascades to specs, PRDs, conversation refs, and all Phase 2 entities.
- **Timestamps are in place.** Spec and PRD now have `createdAt`/`updatedAt` in both the type definitions and the StateStore methods.
- **`BuildOutput.buildDispatchId` FK added** — build provenance is now traceable.
- **Phase 2 readiness is solid.** Stub types, getter methods, cascade deletes, and placeholder UI sections are all in place.

---

## Required Changes Summary

| # | Severity | File:Line | Fix |
|---|----------|-----------|-----|
| 1 | **Critical** | `DepartmentView.tsx:113-119` | Pass all 12 required props to `PhaseDetail` |
| 2 | **Critical** | `src/ui/index.tsx:2` | Change to default import: `import DepartmentView from` |
| 3 | Moderate | `PhaseList.tsx:184-196` | Add delete confirmation before calling `onDelete` |
