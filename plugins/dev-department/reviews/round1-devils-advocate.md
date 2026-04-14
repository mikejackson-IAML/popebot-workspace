The review file write was blocked. Here's the full review:

---

# Devil's Advocate Review: dev-department Plugin (Round 3)

**Verdict: CONCERNS**

The Code Reviewer correctly identified the PhaseDetail prop mismatch and the import bug — both compile-time failures. What they did not examine is *what happens after you fix those bugs*. The answer: specs and PRDs are still permanently null, half the data model fields are unreachable, navigation destroys session state, and the Phase 2 entity model encodes assumptions that will force a rewrite during the first rework cycle.

---

## Findings Not Covered in Any Previous Review

### 1. Specs and PRDs are permanently null in the UI — even after the prop fix

Previous reviews focused on the missing props to `PhaseDetail`. But fixing the props doesn't fix the data flow. `DepartmentView` has **no `useState` for specs or PRDs**. There is no `specs` map, no `handleAttachSpec` that creates a `Spec` object, no way to store or retrieve one. Even if you wire up `onAttachSpec` as a callback, it has nowhere to write to.

This means:
- `PhaseDetail` will always receive `spec={null}` and `prd={null}`
- The `hasSpec` / `hasPRD` props on `PhaseList` will always be `{}` — the Spec/PRD badges will never appear
- The "Attach Spec" form in PhaseDetail will call `onAttachSpec`, which will... do nothing, because nobody wrote the handler

The Code Reviewer verified the *interface contract* but not whether the contract can be fulfilled by the caller.

### 2. `handleSelectProject` destroys all phase state on navigation

`DepartmentView.tsx` line 46: `setPhases([])` — every time you click a project, phases reset to empty. This isn't just the persistence issue (covered in Round 2 DA #1). This is a **within-session navigation bug**:

1. Create project, add 3 phases, fill in details
2. Click "Back to Projects"
3. Click the same project again
4. All phases are gone

The user's work within a single session is destroyed by basic navigation. No prior review caught this because they focused on cross-session persistence.

### 3. `owner` and `roadmapSummary` are permanently empty — no UI to edit them

`DevProject` has `owner: string` and `roadmapSummary: string`. `handleCreateProject` sets both to `""`. `ProjectHeader` only exposes `name`, `objective`, and `status` for editing. There is no input field for `owner` or `roadmapSummary` anywhere in the UI.

Phase 2 impact: `owner` is the obvious field for "who can approve this build dispatch?" If it's always empty, authorization checks have nothing to check against.

### 4. Project deletion is impossible from the UI

`StateStore.deleteProject` exists and properly cascades. But no component renders a delete button for projects. Once created, a project persists forever (well, until refresh — see Round 2 DA #1). The operator has no way to clean up draft or archived projects.

### 5. Phase 2 data model assumes 1:1 for builds and reviews — no rework history

- `getBuildDispatchByPhase` returns the **first** match. One build per phase.
- `getReviewByPhase` returns the **first** match. One review per phase.

But the status model includes `ReworkRequired`, which implies: rework happens, then a *new* build is dispatched, then a *new* review occurs. The data model can't represent this. The second build overwrites the first's lookup. The second review overwrites the first's.

You lose the audit trail of "Build 1 failed review, rework was done, Build 2 passed." This is the core value proposition of the governance plugin.

### 6. `sortOrder` collision when adding phases after reordering

`handleAddPhase` sets `sortOrder: nextNumber` where `nextNumber = Math.max(...phases.map(p => p.phaseNumber)) + 1`. But `phaseNumber` is set at creation and never changes, while `sortOrder` is modified by reordering.

Scenario:
1. Add Phase 1 (sortOrder=1), Phase 2 (sortOrder=2), Phase 3 (sortOrder=3)
2. Move Phase 3 up twice: sortOrders become [3, 2, 1] (via swapping)
3. Delete Phase 3, then add Phase 4: `nextNumber = max(1,2)+1 = 3`, so `sortOrder=3`
4. If Phase 2's sortOrder was swapped to 3 earlier, you now have two phases with `sortOrder=3`
5. Sort is unstable — phase ordering becomes unpredictable

### 7. No error boundary — any component crash kills the entire plugin

React error boundaries are not optional for plugins running inside a host app. A null reference in `PhaseDetail` (very likely given the missing props) will unmount the entire `PhasesTab` slot with a white screen and no recovery path except page reload.

### 8. Phase-scoped and project-scoped conversation refs are siloed with no cross-visibility

`PhaseDetail` shows only phase-scoped refs. The project view shows only project-scoped refs. An operator working on Phase 3 cannot see the project-level architecture conversation that informed all phases. They have to navigate back to project view, find the ref, remember the URL, navigate back to the phase.

In Phase 2, when a review happens on a phase, the reviewer needs both the phase-level PRD conversation and the project-level architecture conversation. The UI makes this a multi-step manual process.

---

## Summary Table

| # | Risk | Area | Phase 2 Impact |
|---|------|------|----------------|
| 1 | **High** | Spec/PRD permanently null in UI | Attach Spec/PRD workflow is non-functional even after prop fix |
| 2 | **High** | Navigation destroys phase state | Within-session data loss on every project re-select |
| 3 | **Medium** | owner/roadmapSummary unreachable | Authorization and planning fields are dead weight |
| 4 | **Medium** | No project delete in UI | Operator cannot clean up projects |
| 5 | **Medium** | 1:1 build/review per phase | Rework cycles lose audit history |
| 6 | **Low** | sortOrder collision after reorder+delete+add | Unpredictable phase ordering |
| 7 | **Low** | No error boundary | Plugin crash = white screen, no recovery |
| 8 | **Low** | Conversation ref silos | Cross-scope context requires manual navigation |

---

## If I had to bet on what breaks in Phase 2, it would be...

**The 1:1 build/review assumption (#5) quietly eating audit history during rework cycles.** The whole point of this plugin is governance — proving that a spec was approved, a build matched the PRD, and a review accepted the output before the next phase unlocked. But the moment a phase goes through `ReworkRequired`, the second `BuildDispatch` becomes the only one `getBuildDispatchByPhase` returns, and the first review decision vanishes from `getReviewByPhase`. The operator can't reconstruct what happened. Someone will notice this only after a compliance question they can't answer, and the fix — changing from 1:1 to 1:many for builds and reviews — requires touching every getter, every cascade delete, every UI component that renders these entities, and the data model itself. It's a schema migration on a system that doesn't have a schema migration strategy yet, because the persistence layer (Round 2 DA #1) still doesn't exist.

The Spec/PRD null problem (#1 above) will be discovered first — someone will click "Attach Spec" and nothing will happen — but the 1:many problem is the one that invalidates the architecture.
