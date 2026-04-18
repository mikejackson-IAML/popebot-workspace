It looks like write permissions to the reviews directory are being blocked. Could you approve the write permission so I can save the review file? 

In the meantime, here's the full review:

---

# Devil's Advocate Review: dev-department Plugin (Round 2)

**Verdict: CONCERNS**

The Code Reviewer caught real compile-time bugs (wrong props, bad imports, missing cascades). Those are fix-and-ship issues. What they missed is structural: the plugin has no working data path, the state machines are decorative, and the data model has gaps that will force a migration before Phase 2 ships anything useful.

---

## Findings the Code Reviewer Did Not Cover

### 1. Worker and UI are completely disconnected — there is no data path

The Code Reviewer praised "Worker/UI separation is correct" but missed that the separation is *total*: the UI never talks to the worker.

- `DepartmentView` initializes from `MOCK_PROJECTS: DevProject[] = []` and manages everything in local `useState`. It never calls `StateStore`, never sends messages to the worker, never uses `plugin.state.read` or `plugin.state.write`.
- `state.ts` exports a singleton `store` that nothing imports except `index.ts` (which re-exports it).
- The manifest declares capabilities `["plugin.state.read", "plugin.state.write"]` but no code exercises them.

**Impact:** Every piece of data the user enters is lost on tab close or refresh. Phase 2 entities need to reference persisted phases and specs. If Phase 1 data doesn't persist, Phase 2 has nothing to build on.

### 2. Phase status and freeze state are unvalidated — the state machines are decorative

- A user can set a phase from `DraftSpec` directly to `Accepted` via a dropdown, skipping every intermediate state.
- A user can set `freezeState` to `Locked` and continue editing every field — nothing reads `freezeState` to disable inputs or reject writes.
- `StateStore.updatePhase` accepts any partial update with no validation.

**Phase 2 impact:** The entire governance model depends on these states meaning something. If a build can be dispatched for a `DraftSpec` phase, the governance is theater.

### 3. `sortOrder` and `phaseNumber` diverge after reordering

`phaseNumber` is set at creation and never updated. `sortOrder` changes on reorder. After moving Phase 3 up twice, display shows "3, 1, 2" — operators will reference the wrong phase by number.

### 4. Spec and PRD have no timestamps — audit trail is impossible

`Spec`, `PRD`, and `BuildOutput` have no `createdAt`/`updatedAt`. In Phase 2 you can't answer "was the spec approved before the build was dispatched?" Adding timestamps later requires a data migration.

### 5. One spec / one PRD per phase, no version history

No mechanism to keep previous specs, know which version was active during a build, or compare versions after a revision event. The `version` field is freeform with no enforcement.

### 6. Linear scans on every phase-scoped lookup

`getSpecByPhase`, `getPRDByPhase`, `getBuildDispatchByPhase`, etc. all iterate entire maps. Phase 2 adds 4 more entity types doing the same. Should use phaseId-indexed lookups.

### 7. No confirmation on PhaseList delete — instant, irrecoverable

`PhaseDetail` has two-step delete confirmation. `PhaseList` has a bare `x` button that calls `onDelete` immediately. One misclick cascades through specs, PRDs, and conversation refs.

### 8. Plugin API version pinning with no degradation path

`apiVersion: 1` with no code checking host compatibility. Alpha plugin on alpha host — any slot type or capability rename causes silent load failure.

### 9. `RevisionEvent.affectedPhaseIds` has no referential integrity

Phase deletion doesn't clean orphaned IDs from revision events. Phase 2 UI rendering "affected phases" will get null lookups.

---

## Summary Table

| # | Risk | Area | Phase 2 Impact |
|---|------|------|----------------|
| 1 | **High** | No data path between UI and worker | Blocks all persistence |
| 2 | **High** | No state machine enforcement | Governance is bypassable |
| 3 | **Medium** | sortOrder/phaseNumber divergence | Wrong phase references |
| 4 | **Medium** | No timestamps on Spec/PRD | Audit trail impossible |
| 5 | **Medium** | No spec/PRD version history | Reviews can't reference what they reviewed |
| 6 | **Low** | Linear scans for lookups | Performance at scale |
| 7 | **Low** | No delete confirmation in PhaseList | Data loss on misclick |
| 8 | **Low** | No API version checking | Silent breakage |
| 9 | **Low** | Orphaned IDs in RevisionEvent | Null references in Phase 2 |

---

## If I had to bet on what breaks in Phase 2, it would be...

**The missing data path (#1) forces a rushed integration that gets state synchronization wrong.** Someone will wire up `plugin.state.write` calls, discover the Paperclip state API is async and doesn't match the synchronous `StateStore` interface, and bolt on an async layer that introduces race conditions between optimistic UI updates and persisted state. The `StateStore` singleton becomes a stale cache that disagrees with the plugin state API, and the unvalidated status transitions (#2) mean the disagreement goes unnoticed until a build gets dispatched against a phase the worker thinks is `ReadyForBuild` but persisted state says is `DraftSpec`. The operator sees the build fail with no useful error because none of these paths have error handling.

The fix is boring: establish the persistence pattern now — pick async-first for `StateStore`, wire one entity type end-to-end through the plugin state API, and validate the round-trip before building Phase 2 on top of it.
