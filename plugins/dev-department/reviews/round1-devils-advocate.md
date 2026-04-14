The review is ready but needs write permission. Here's the full review:

---

# Devil's Advocate Review: dev-department Plugin (Round 5)

**Verdict: CONCERNS**

The Code Reviewer found the remaining compile blocker (`useState` not imported). That's correct and must be fixed. What follows is everything else they missed.

---

## Status of Prior DA Findings

| Round | # | Issue | Status |
|-------|---|-------|--------|
| R2-DA | 1 | No data path between UI and worker | Still present — **NOTE for Phase 2** |
| R2-DA | 2 | No state machine enforcement | Still present — **NOTE for Phase 3** |
| R2-DA | 3 | sortOrder/phaseNumber diverge after reorder | **OPEN** |
| R2-DA | 4 | Spec/PRD have no timestamps | **FIXED** |
| R2-DA | 5 | No spec/PRD version history | **NOTE for Phase 2** |
| R2-DA | 6 | Linear scans on phase-scoped lookups | **NOTE for Phase 2** |
| R2-DA | 7 | No confirmation on PhaseList delete | **FIXED** |
| R2-DA | 8 | No API version degradation path | Low risk for Phase 1 |
| R2-DA | 9 | RevisionEvent orphaned IDs | **NOTE for Phase 2** |
| R4-DA | 1 | Attach form shape incomplete | **OPEN** |
| R4-DA | 2 | ProjectHeader never re-syncs from props | **OPEN** |
| R4-DA | 3 | Phase delete orphans UI conversation refs | **OPEN** |
| R4-DA | 4 | Stale closure in save handlers | **NOTE for Phase 2** |
| R4-DA | 5 | hasSpec/hasPRD never passed to PhaseList | **OPEN** |
| R4-DA | 6 | RefRow delete no confirmation | **OPEN** |

---

## New Findings the Code Reviewer Did Not Cover

### 1. `handleDeletePhase` triggers `handleSaveProject` which reads stale `selectedProject`

`DepartmentView.tsx:95-98` — When deleting the active phase:

```tsx
if (selectedProject?.activePhaseId === phaseId) {
  handleSaveProject({ activePhaseId: null });
}
```

`handleSaveProject` spreads over the captured `selectedProject`:

```tsx
const updated = { ...selectedProject, ...updates, updatedAt: new Date().toISOString() };
```

This is a closure over `selectedProject` from the current render. If the user edited ProjectHeader fields (name, objective, status) but hasn't saved yet, `handleSaveProject` overwrites `projects` state with the *stale* `selectedProject` — discarding any pending ProjectHeader edits. `setSelectedProject(updated)` cements the stale version.

Interaction path: edit project name → add phases → delete the active phase → project name reverts silently.

**Severity:** Medium. Phase 1 data loss within a session.

### 2. `handleAttachSpec` / `handleAttachPRD` are no-ops that silently eat user input

`DepartmentView.tsx:126-132` — The user fills in the form, clicks "Save Spec", the form closes, and nothing happens. No spec appears. No feedback. PhaseDetail shows "No spec attached" immediately after.

The Code Reviewer noted the form shape is incomplete (Phase 2 note) but didn't flag that the *current* UX is actively misleading. Either disable the buttons with a "Coming soon" tooltip or show feedback when the stub is hit.

**Severity:** Low (UX). An operator will file this as a bug within minutes.

### 3. Project delete is not implemented — no way to remove a project

`DepartmentView` has Create and Save but no Delete for projects. The project list has no delete control. `StateStore.deleteProject` exists on the worker side but is unreachable from UI. For Phase 1 CRUD, the "D" is missing for the top-level entity.

**Severity:** Low. Incomplete CRUD surface.

### 4. `owner` and `roadmapSummary` fields on `DevProject` are unreachable from UI

`ProjectHeader` only exposes `name`, `objective`, and `status`. `handleCreateProject` hardcodes `owner: ""` and `roadmapSummary: ""`. No UI path to set or view these fields. If `owner` is load-bearing for Phase 2 (e.g., approval authority), it'll need UI. If not, they're dead weight.

**Severity:** Low. No migration risk — already in the type.

### 5. `ConversationReference` URL validation is protocol-only with silent failure

`ConversationRefs.tsx:258-259` — Accepts `https://` (empty after protocol), rejects `claude.ai/chat/...` (missing protocol) with no error message. `handleAdd` silently returns. The user clicks Add, nothing happens, no feedback.

**Severity:** Low. UX friction.

---

## Summary Table

| # | Risk | Area | Phase Scope |
|---|------|------|-------------|
| 1 | **Medium** | Stale closure overwrites project on active-phase delete | Phase 1 — session data loss |
| 2 | Low | Attach Spec/PRD stubs silently eat input | Phase 1 — misleading UX |
| 3 | Low | No project delete in UI | Phase 1 — incomplete CRUD |
| 4 | Low | owner/roadmapSummary unreachable from UI | Phase 1 — dead fields |
| 5 | Low | URL validation silent failure | Phase 1 — UX friction |

No new compile-time blockers beyond the Code Reviewer's `useState` finding.

---

## If I had to bet on what breaks next phase, it would be...

**The stale closure pattern (#1, plus R4-DA #4) turning into a class of bugs that are hard to diagnose once persistence is wired.** Right now every save handler does `{ ...selectedProject, ...updates }` — spreading over a captured snapshot from render time, not current state. In Phase 1 this mostly works because there's one user, one tab, no async, and refresh resets everything. Phase 2 adds persistence: now `handleSaveProject({ activePhaseId })` writes stale `name`/`objective`/`status` to the plugin state API, overwriting what `ProjectHeader.handleSave` wrote moments before. The operator sees their project name revert after selecting an active phase. The debugging session goes: "is it the plugin state API? the worker? the store?" — no, it's a React closure bug that's been here since Phase 1.

The fix is mechanical: switch `handleSaveProject` to use a functional updater (`setProjects(prev => prev.map(...))`) and derive `selectedProject` from `projects` state rather than maintaining it as independent state. Same for `handleSavePhase`. Do it before Phase 2 wires persistence, or it becomes a race condition instead of just a stale read.
