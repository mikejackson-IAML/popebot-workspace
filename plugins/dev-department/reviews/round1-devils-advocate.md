The review is ready. Here's the full content:

---

# Devil's Advocate Review: dev-department Plugin (Round 6)

**Verdict: PASS**

The Code Reviewer approved with no blockers. That's the right call — no compile errors, no wrong imports, no data model shapes that force a breaking migration. What follows is what they didn't examine.

---

## New Findings the Code Reviewer Did Not Cover

### 1. Phase delete in UI does not clean up conversation refs from local state
`DepartmentView.tsx:93` — `handleDeletePhase` removes the phase from `phases` state but never touches `conversationRefs`. Phase-scoped refs become invisible but accumulate as garbage. The CR caught the worker-side cascade in Round 2 but never checked the UI-side equivalent.

### 2. `conversationRefs` state is flat and global — no project scoping on navigation
`DepartmentView.tsx:41` — single flat array shared across all projects. `handleSelectProject` resets `phases` to `[]` but not `conversationRefs`. Grows unboundedly across project switches.

### 3. `ProjectHeader` local state diverges from parent on external update
`ProjectHeader.tsx:25-27` — initializes from props via `useState` with **no** `useEffect` resync (unlike `PhaseDetail` which at least has `[phase.id]`). When `handleSetActivePhase` calls `handleSaveProject({ activePhaseId })`, `selectedProject` updates but header keeps showing stale values. Subsequent header save overwrites `activePhaseId`. **Medium severity** — silent data loss within a session.

### 4. `handleSavePhase` has the same stale-closure problem as `handleSaveProject`
`DepartmentView.tsx:116-120` — spreads over `selectedPhase` from the closure. CR flagged `handleSaveProject` (item #5) but missed the identical pattern here.

### 5. `RefRow` editing state doesn't resync from props
Same class as #3 — `useState` from props, no `useEffect`. Cosmetic.

---

## Summary

| # | Risk | Area |
|---|------|------|
| 1 | Low | Orphaned conversation refs in UI state |
| 2 | Low | Flat global refs array, no project scoping |
| 3 | **Medium** | ProjectHeader never resyncs, causes silent overwrites |
| 4 | Low | handleSavePhase stale closure (NOTE for Phase 2) |
| 5 | Low | RefRow editing state stale (cosmetic) |

No compile-time blockers. No breaking migration risk. PASS for Phase 1 scope.

---

## If I had to bet on what breaks next phase, it would be...

**The ProjectHeader state divergence (#3) combining with the stale closure pattern to produce "last write wins, but the last write is wrong" bugs.** Phase 2 wires persistence. Operator edits project name in header, then selects an active phase from the dropdown. `handleSetActivePhase` persists `{ ...selectedProject, activePhaseId }` — with the *old* name. Operator saves from header — persists `{ name, objective, status }` — without `activePhaseId`. One write stomps the other. The fix is the same one recommended since Round 5: derive `selectedProject` from `projects` state, use functional updaters, add `useEffect` resyncs in `ProjectHeader`. It hasn't been done, and the risk compounds with each new save path in Phase 2.
