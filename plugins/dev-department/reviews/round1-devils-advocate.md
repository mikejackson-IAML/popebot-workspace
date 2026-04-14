The review file write was blocked. Here's the full review:

---

# Devil's Advocate Review: dev-department Plugin (Round 2, Pass 2)

**Reviewer:** Devil's Advocate
**Date:** 2026-04-14
**Scope:** What prior reviews missed -- architecture risks, state fragility, missing error paths, operator experience, data model gaps

**Verdict: CONCERNS**

Prior reviews correctly identified compile failures (bad imports, missing props), missing persistence, decorative state machines, and cascade-delete gaps. All real. This review covers what nobody flagged yet.

---

## Findings Not Covered by Any Prior Review

### 1. `handleSelectProject` blanks phases on every navigation -- data is unrecoverable even within a session

`DepartmentView.tsx:51-55` -- Every time you click a project, `setPhases([])` fires. If you navigate from Project A to Project B and back, Project A's phases are gone. This isn't a persistence bug (prior review covered that); this is a **within-session navigation bug**. The phases state is global, not per-project. A `Map<projectId, Phase[]>` or scoped fetch is needed.

**Phase 2 impact:** An operator managing multiple projects during a build review cycle will lose in-progress phase data by clicking the wrong row.

### 2. `BuildOutput` has no foreign key to `BuildDispatch` -- you cannot trace provenance

`types.ts` -- `BuildOutput` references `phaseId` but not `buildDispatchId`. If a phase has multiple build attempts (failed then retried), there's no way to link an output to the dispatch that produced it. This is a data model gap, not a timestamp issue (prior review covered timestamps).

**Phase 2 impact:** "Which build produced this artifact?" is unanswerable. You'd need a schema migration to add the FK after data already exists.

### 3. `Review` has no reviewer identity

`types.ts` -- `Review` has `decision`, `comments`, `decidedAt` but no `reviewer` or `decidedBy` field. For a governance tool, "who approved this?" is a fundamental audit question.

### 4. No way to delete a project from the UI

`DepartmentView.tsx` -- The project list view has "Create Project" but no delete. `ProjectHeader` has Save/Cancel but no delete. `StateStore.deleteProject` exists and cascades correctly (modulo prior findings), but it's unreachable from the UI. Operators will accumulate abandoned projects with no cleanup path.

### 5. `owner` and `roadmapSummary` are write-only fields -- never editable from UI

`types.ts:14` -- `DevProject` has `owner` and `roadmapSummary`. `ProjectHeader.tsx` exposes `name`, `objective`, and `status` for editing but never `owner` or `roadmapSummary`. `handleCreateProject` sets both to `""`. There is no UI path to populate them.

### 6. `prerequisites` is freeform text, not a phase dependency graph

`types.ts:15` -- `Phase.prerequisites` is a `string`. There's no structured reference to other phase IDs. Phase 2's `RevisionEvent` assumes it can identify `affectedPhaseIds`, but nothing in the data model actually encodes which phases depend on which. The operator must manually determine downstream impact, which defeats the purpose of automated revision propagation.

### 7. StateStore throws on missing entities -- nothing catches

`state.ts:31,62,105,131` -- `updateProject`, `updatePhase`, `updateSpec`, `updatePRD` all `throw new Error(...)` on missing IDs. The UI calls these through handlers that have zero try/catch. In React, an uncaught throw during a click handler doesn't trigger error boundaries -- it silently fails or puts state in an inconsistent position.

### 8. sortOrder collision is possible on create after reorder+delete

`DepartmentView.tsx:80-81` -- `handleAddPhase` sets `sortOrder: nextNumber` where `nextNumber = Math.max(...phases.map(p => p.phaseNumber)) + 1`. But `sortOrder` and `phaseNumber` are independent values. After reordering and deleting, a new phase's sortOrder can collide with an existing one, making the sort non-deterministic for tied values.

### 9. Tabs naming mismatch creates operator confusion

`paperclip-plugin.json:21` -- The detail tab is named "Phases" but it renders `DepartmentView` which is a full project management interface. The sidebar says "Dev Department" with "Click Phases tab for full view" -- three different names for the same surface.

### 10. `ConversationReference.status` is a dead field (deepened)

Prior code review mentioned "status never set from UI" but treated it as minor. The edit form's `EditingState` interface also omits `status`, so even editing a ref can't change it. No filtering by status exists anywhere. This field will accumulate meaning-free data that Phase 2 code might incorrectly rely on.

---

## Summary Table

| # | Risk | Area | Phase 2 Impact |
|---|------|------|----------------|
| 1 | **High** | Phases blanked on project navigation | Data loss during multi-project workflows |
| 2 | **High** | BuildOutput has no FK to BuildDispatch | Build provenance untraceable |
| 3 | **Medium** | Review has no reviewer identity | Audit trail incomplete |
| 4 | **Medium** | No project delete in UI | Stale project accumulation |
| 5 | **Medium** | owner/roadmapSummary not editable | Dead fields in data model |
| 6 | **Medium** | Prerequisites are text, not phase refs | Revision propagation is manual guesswork |
| 7 | **Medium** | Uncaught throws from StateStore | Silent state corruption |
| 8 | **Low** | sortOrder collision after reorder+delete | Non-deterministic phase ordering |
| 9 | **Low** | Tab naming mismatch | Operator confusion |
| 10 | **Low** | ConversationReference.status is dead | False data accumulation |

---

## If I had to bet on what breaks in Phase 2, it would be...

**The missing `BuildDispatch` -> `BuildOutput` link (#2) combined with freeform prerequisites (#6) makes the review cycle unworkable.** Someone builds Phase 2's review flow: a build dispatches, produces output, a reviewer evaluates it. The reviewer asks "what spec version was this built against? which dispatch attempt is this output from?" and the data model can't answer either question. So they add `buildDispatchId` to `BuildOutput` and `specId`/`prdId` to `BuildDispatch` -- but now every existing record needs backfilling. Meanwhile, a revision event fires and needs to propagate to downstream phases, but `prerequisites` is a prose string so the code can't walk the dependency graph. Someone hacks in a regex parser for the prerequisites field or adds a parallel `dependsOn: string[]` field, creating two sources of truth for phase dependencies.

The root cause: the data model was designed for *display* (show a phase, show a spec) rather than for *traceability* (which version of which artifact flowed through which gate). Phase 2's entire value proposition is traceability, and the schema doesn't support it. Fix the entity relationships now -- add `buildDispatchId` to `BuildOutput`, `specId`/`prdId` to `BuildDispatch`, `reviewerId` to `Review`, and replace `prerequisites: string` with `dependsOnPhaseIds: string[]` -- before any Phase 2 logic gets written on top of the current model.
