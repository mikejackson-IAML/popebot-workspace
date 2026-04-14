The review file write was blocked. Here's the full review:

---

# Code Review: dev-department Plugin (Round 3)

## Verdict: **REQUEST CHANGES**

4 critical compile-time failures, 4 moderate issues. Multiple prior findings remain unfixed despite commits claiming otherwise.

---

## Status of Prior Findings

| Round | # | Issue | Status |
|-------|---|-------|--------|
| R1 | 1 | DepartmentView passes wrong props to PhaseDetail | **NOT FIXED** |
| R1 | 2 | Default import of named export (ConversationRefs) | **PARTIALLY FIXED** — PhaseDetail.tsx still broken, DepartmentView.tsx still broken |
| R1 | 3 | Project-scoped conversation refs not cascade-deleted | **NOT FIXED** |
| R1 | 4 | Phase 2 entities not cascade-deleted in deletePhase | **NOT FIXED** |
| R2 | 4 | Spec/PRD missing timestamps | **NOT FIXED** (types unchanged on disk) |
| R2 | 7 | No delete confirmation in PhaseList | **NOT FIXED** |
| R2 | 3 | sortOrder/phaseNumber divergence | **NOT FIXED** |

---

## Critical Issues (compile-time failures)

### 1. DepartmentView passes incomplete props to PhaseDetail
`DepartmentView.tsx:162-168`

PhaseDetail requires 12 props (`PhaseDetail.tsx:101-113`). DepartmentView passes only 5. **Missing:** `conversationRefs`, `onAttachSpec`, `onAttachPRD`, `onAddConversationRef`, `onUpdateConversationRef`, `onDeleteConversationRef`. This is a TS compile error.

### 2. Default import of named export — ConversationRefs in DepartmentView
`DepartmentView.tsx:6` — `import ConversationRefs from "./ConversationRefs"` but `ConversationRefs.tsx` only has `export function ConversationRefs` (named). Should be `import { ConversationRefs }`.

### 3. Named import of default export — DepartmentView in index.tsx
`index.tsx:2` — `import { DepartmentView } from './components/DepartmentView'` but `DepartmentView.tsx` uses `export default function DepartmentView`. Should be `import DepartmentView from`.

### 4. Default import of named export — ConversationRefs in PhaseDetail
`PhaseDetail.tsx:3` — Same bug as #2. Despite PR #35 claiming to fix this, on-disk file still has `import ConversationRefs from "./ConversationRefs"`.

---

## Moderate Issues

### 5. Cascade delete: project-scoped conversation refs orphaned
`state.ts:35-39` — `deleteProject` cascades into `deletePhase` (which only cleans phase-scoped refs). Refs with `scopeType === "project"` are never deleted.

### 6. Cascade delete: Phase 2 entities not cleaned in deletePhase
`state.ts:73-85` — `deletePhase` misses `buildDispatches`, `buildOutputs`, `reviews`, `revisionEvents`.

### 7. Spec and PRD interfaces still lack timestamps
`types.ts:16-17` — No `createdAt`/`updatedAt` fields. `state.ts:99-103,126-130` (`createSpec`/`createPRD`) don't generate timestamps either.

### 8. PhaseList delete has no confirmation
`PhaseList.tsx:218-232` — Bare `x` button calls `onDelete` immediately. Compare with PhaseDetail's proper two-step confirmation at `PhaseDetail.tsx:305-350`.

---

## Minor Issues

### 9. useEffect dependency incomplete
`PhaseDetail.tsx:138-141` — `useEffect` depends on `[phase.id]` but reads full `phase` object. Won't reset draft if phase fields change without id change.

### 10. sortOrder/phaseNumber divergence after reorder
`DepartmentView.tsx:104-117` — `handleReorderPhase` swaps `sortOrder` but never updates `phaseNumber`. Circle badge shows stale creation-time numbers.

---

## What's Working Well

- No `any` types. All Maps, props, state properly typed with union types.
- Plugin manifest (`paperclip-plugin.json`) is valid — correct `apiVersion`, slots, capabilities, entrypoints.
- Phase 2 stub types and placeholder UI sections are in place.
- PhaseDetail delete confirmation is properly two-step.

---

## Required Changes

| # | Severity | File:Line | Fix |
|---|----------|-----------|-----|
| 1 | **Critical** | `DepartmentView.tsx:162-168` | Pass all 12 required props to PhaseDetail |
| 2 | **Critical** | `DepartmentView.tsx:6` | `import { ConversationRefs }` (named) |
| 3 | **Critical** | `index.tsx:2` | `import DepartmentView from` (default) |
| 4 | **Critical** | `PhaseDetail.tsx:3` | `import { ConversationRefs }` (named) |
| 5 | Moderate | `state.ts:35-39` | Cascade-delete project-scoped conversation refs |
| 6 | Moderate | `state.ts:73-85` | Cascade-delete Phase 2 entities in deletePhase |
| 7 | Moderate | `types.ts:16-17` | Add `createdAt`/`updatedAt` to Spec and PRD |
| 8 | Moderate | `PhaseList.tsx:218-232` | Add delete confirmation |

**Note:** Commits #33-39 claim to fix several of these issues, but on-disk files at HEAD (`5a60cf3`) do not reflect the changes. All findings are based on actual file contents.
