The write permission was blocked. Could you approve the write so I can save the review file?

In the meantime, here's the full review:

---

# Devil's Advocate Review: dev-department Plugin — Phase 2 Scope

**Verdict: PASS**

The Code Reviewer approved with no blockers. Correct call. No compile errors, no wrong imports, no missing required props, no data model shapes that force a breaking migration.

---

## Prior Findings Status

All Round 2 critical issues (wrong props, bad imports, missing cascades) marked FIXED — confirmed. Round 1 DA findings (#1-#5) remain as low/medium-severity state management issues — none are compile errors or migration-forcing.

---

## What the Code Reviewer Did Not Cover

### 1. `handleDeletePhase` in UI still does not clean up `conversationRefs` state

`DepartmentView.tsx:93` — removes the phase from `phases` but leaves orphaned phase-scoped refs in `conversationRefs`. Flagged in Round 1 DA, still present. Not a compile error — refs silently accumulate as garbage.

**NOTE for Phase 2:** When persistence is wired, orphaned refs will persist unless the UI-side delete mirrors the worker-side cascade.

### 2. `handleAttachSpec` / `handleAttachPRD` are no-ops

`DepartmentView.tsx:141-146` — both stubs do nothing. User fills in the form, clicks save, data vanishes. Not a compile error — stubs are correctly typed.

**NOTE for Phase 2:** Wire these or remove the UI forms to avoid user confusion.

### 3. ProjectHeader state divergence persists

`ProjectHeader.tsx:25-27` — `useState` from props with no `useEffect` resync. Edit name in header -> select active phase -> `handleSetActivePhase` persists with old name -> header save persists without `activePhaseId`. Two writes, each missing the other's data.

**NOTE for Phase 2:** Fix before persistence integration. Functional updaters + `useEffect` resync on `[project]`.

### 4. `RevisionEvent` cascade deletes by `sourcePhaseId` only

`state.ts:80` — `deletePhase` cascades where `e.sourcePhaseId === id` but not where the deleted phase appears in `e.affectedPhaseIds`. Orphaned IDs remain.

**NOTE for Phase 2:** Filter or clean on delete before revision event UI renders.

---

## Summary

| # | Severity | Blocker? | Phase |
|---|----------|----------|-------|
| 1 | Low | No | NOTE for Phase 2 |
| 2 | Low | No | NOTE for Phase 2 |
| 3 | Medium | No | NOTE for Phase 2 |
| 4 | Low | No | NOTE for Phase 2 |

No compile-time errors missed. No data model shapes requiring breaking migration. All findings are state management hygiene for Phase 2.

**PASS.**
