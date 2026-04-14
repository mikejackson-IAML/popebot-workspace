The review is ready but needs write permission. Here's the full review:

---

# Devil's Advocate Review: dev-department Plugin (Round 4)

**Verdict: CONCERNS**

The Code Reviewer correctly identified the two remaining compile-time failures (wrong props, wrong import) and the missing delete confirmation. Those are mechanical fixes. What they continue to miss — across four rounds — are structural issues that cost more to fix the longer they're deferred.

Scoped to Phase 1 (data model, CRUD, basic UI). Not re-raising anything marked FIXED or covered in prior DA reviews.

---

## Findings the Code Reviewer Did Not Cover

### 1. Spec/PRD attach form shape is incomplete at the interface boundary

`PhaseDetail.handleAttachSpec` passes `{ title, sourceRef }` via the `AttachForm` type, but constructing a valid `Spec` requires `phaseId`, `version`, `author`, `approvalState`, `notes`. Whoever wires this up in DepartmentView must either hardcode defaults (making those fields dead weight) or expand the form (UI change). The data shape at the callback boundary doesn't match what the data model needs.

### 2. `ProjectHeader` local state diverges from parent on external save

`ProjectHeader` initializes `useState` from props but has **no `useEffect`** to re-sync when the parent updates. Scenario: edit project name to "Foo" (unsaved), select an active phase from the dropdown (calls `handleSaveProject({ activePhaseId })`), ProjectHeader re-renders with new `project` prop but local `name` state still shows "Foo". User thinks it saved. It didn't. Same class of bug the Code Reviewer flagged in PhaseDetail (#5) but missed here where there's no reset mechanism at all.

### 3. Phase delete doesn't clean conversation refs from UI state

`DepartmentView.handleDeletePhase` filters `phases` state but doesn't touch `conversationRefs` state. `StateStore.deletePhase` cascades correctly on the worker side, but the UI doesn't use the worker. Orphaned refs accumulate in React state.

### 4. `handleSavePhase`/`handleSaveProject` use stale closure — last-write-wins

Both spread over the captured `selectedPhase`/`selectedProject` rather than using a functional updater. Two rapid saves will lose the first. Phase 2 introduces automated status transitions that will trigger this.

### 5. `hasSpec`/`hasPRD` never passed to PhaseList — badges are dead UI

`PhaseList` accepts optional `hasSpec`/`hasPRD` props (default `{}`). `DepartmentView` never passes them. Spec/PRD badges will never render in the list view even after specs are wirable.

### 6. `RefRow` delete has no confirmation — same class as CR #3

Code Reviewer flagged PhaseList's bare delete. `ConversationRefs.tsx` RefRow has the identical pattern: "Delete" button calls `onDelete(r.id)` immediately.

---

## Summary Table

| # | Risk | Area | Phase Scope |
|---|------|------|-------------|
| 1 | Medium | Attach form shape incomplete | Phase 1 — data model gap |
| 2 | Medium | ProjectHeader never re-syncs | Phase 1 — state bug |
| 3 | Low | Phase delete orphans UI refs | Phase 1 — orphan state |
| 4 | Low | Stale closure in save handlers | NOTE for Phase 2 |
| 5 | Low | hasSpec/hasPRD never passed | Phase 1 — dead feature |
| 6 | Low | RefRow delete no confirmation | Phase 1 — UX consistency |

None are compile-time blockers. The Code Reviewer's two critical findings (wrong props, wrong import) remain the actual blockers.

---

## If I had to bet on what breaks next phase, it would be...

**The ProjectHeader state divergence (#2) combined with the stale-closure save pattern (#4) producing silent data loss blamed on the persistence layer.** Phase 2 wires up persistence. Operator edits project name in ProjectHeader, then selects an active phase from the dropdown (triggering `handleSaveProject`). Persistence saves the project with the *old* name because ProjectHeader's local state didn't feed into the activePhaseId save. Operator sees "Foo" on screen, database has "New Project". Reload reverts it. Team spends a day investigating the plugin state API before discovering it's a React state bug that's been there since Phase 1. Fix: add `useEffect` to ProjectHeader (same pattern PhaseDetail uses), and switch save handlers to functional state updates.
