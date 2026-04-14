# Devil's Advocate Review — Phase 1 Plugin Code
**Date:** 2026-04-14
**Reviewer:** Devils Advocate Agent
**Verdict: BLOCK**

> Note: `logs/code-review-phase1.md` did not exist at review time. This review is independent, based on direct code inspection. Findings below focus on architectural wisdom, not syntax correctness.

---

## Findings (ranked by future-phase risk)

---

### 🔴 BLOCK-1: The Worker Does Nothing — All State Lives in a Dead Singleton

**File:** `src/worker/index.ts`, `src/worker/state.ts:150`

`src/worker/index.ts` is two re-export lines. There is no message handler registration, no `plugin.state` API binding, no subscription setup. The `StateStore` is a module-level in-memory `Map` singleton (`export const store = new StateStore()`) that is never connected to any persistence layer.

`paperclip-plugin.json` declares capabilities `["plugin.state.read", "plugin.state.write"]` but nowhere in the worker is any plugin API called.

**What goes wrong if ignored:** Every project and phase Mike creates will be silently lost on plugin reload. Phase 2 assumes a populated, persistent data store; it will arrive at an empty Map every run. The entire Phase 1 data model has been built in a void.

**When:** Immediately, on first real use. This isn't a Phase 2 problem — it's a Phase 1 problem that blocks Phase 2 from being buildable at all.

---

### 🔴 BLOCK-2: UI State Is a Parallel, Disconnected Universe

**File:** `src/ui/components/DepartmentView.tsx:6, 90-116`

The UI manages its own React `useState` with `MOCK_PROJECTS = []`. There is no `plugin.state.read()`, no message passing to the worker, no bridge of any kind. Projects created in the UI exist only in the React component tree and die when the component unmounts.

The worker's `StateStore` and the UI's `useState` are two entirely separate state machines that have never met.

**What goes wrong if ignored:** Phase 2 dispatch triggers and review events are supposed to be driven by data in the worker. But the UI will never show worker data and the worker will never see UI changes. Phase 2 integration code will have to tear out and rewire every data flow in both the UI and worker simultaneously.

**When:** Phase 2, day one. The integration cost is high because both sides are written as if the other doesn't exist.

---

### 🔴 BLOCK-3: Conflicting ID Generation Strategies Will Produce Broken Cross-References

**File:** `src/worker/state.ts:6-8` vs `src/ui/components/DepartmentView.tsx:98`

The `StateStore` generates IDs via `crypto.randomUUID()`. The UI creates projects with `id: \`proj-${Date.now()}\``. These will coexist in the eventual integrated system producing IDs that don't match between layers.

Phase-level entities (phases, specs, PRDs, conversation refs) use worker-generated UUIDs. If project IDs from the UI are timestamp-based strings, any cross-entity query (`getPhasesByProject(projectId)`) will find nothing.

**What goes wrong if ignored:** Silent data failures — queries return empty arrays with no error, because the project ID format from the UI never matches what the worker indexed. Mike will create a project, add phases, reload, and find both gone.

**When:** Phase 2 integration, when UI is wired to worker.

---

### 🟠 CONCERN-1: deleteProject Orphans All Child Phases

**File:** `src/worker/state.ts:29-31`

`deleteProject(id)` deletes only the project key. All phases with `projectId === id` remain in the Map indefinitely. `getPhasesByProject()` will continue returning them, `listProjects()` won't list them, and phase IDs remain queryable.

Phase 2's revision events reference `affectedPhaseIds[]` — if a project is deleted, those revision events will reference phases that belong to a ghost project. Cross-phase cascade logic will behave unpredictably.

**What goes wrong if ignored:** Orphaned phases accumulate silently. Phase 2 revision/review features will find "phases" with no parent project, causing undefined states in the governance workflow.

**When:** Any time Mike deletes a project in Phase 2+.

---

### 🟠 CONCERN-2: PhaseNumber Is a Manually Editable Field — It Will Diverge From sortOrder

**File:** `src/ui/components/PhaseDetail.tsx:116-122`, `src/worker/types.ts:10`

`phaseNumber` is an editable `<input type="number">` in PhaseDetail. `sortOrder` is the actual ordering field updated by the reorder buttons in PhaseList. The two fields will drift immediately: Mike can set Phase 3's `phaseNumber` to 1 while its `sortOrder` remains 2.

Phase 2 will need to determine phase sequence for build dispatch gating. If `phaseNumber` and `sortOrder` disagree, any code that uses `phaseNumber` for sequencing (e.g., "don't dispatch Phase 3 until Phase 2 is Accepted") will silently use the wrong ordering.

**What goes wrong if ignored:** Build governance gates on the wrong sequence. A phase can be dispatched before its actual predecessor is complete, defeating the core purpose of the plugin.

**When:** First time Mike edits a phase and reorders another. Guaranteed divergence within days.

---

### 🟠 CONCERN-3: FreezeState and PhaseStatus Have No Transition Rules — Invalid Combinations Are Silently Accepted

**File:** `src/ui/components/PhaseDetail.tsx:157-182`

Both `status` and `freezeState` are independent dropdowns with no validation between them. A phase can be simultaneously `DraftSpec` + `Locked`, or `Accepted` + `DownstreamRevisionRequired`. The type system treats these as orthogonal dimensions.

Phase 2's downstream freeze propagation logic needs to know what "Locked" means for a phase that hasn't been spec'd yet. There is no canonical answer because the model allows nonsense combinations.

**What goes wrong if ignored:** Phase 2 freeze propagation code will have to write defensive guards against all invalid state combinations, or it will propagate incorrect freeze signals to downstream phases.

**When:** Phase 2 freeze cascade implementation.

---

### 🟠 CONCERN-4: BuildDispatch, BuildOutput, Review, RevisionEvent Types Have No StateStore Methods

**File:** `src/worker/types.ts:13-16`, `src/worker/state.ts` (entirely absent)

Types for `BuildDispatch`, `BuildOutput`, `Review`, and `RevisionEvent` are defined in types.ts but `StateStore` has zero CRUD methods for any of them. The placeholder sections in `PhaseDetail.tsx` (lines 307-317) render grayed-out blocks with no props.

If Phase 2 adds these to the current in-memory StateStore and later needs to switch to real persistence (which BLOCK-1 makes inevitable), all the StateStore CRUD methods will be written twice.

**What goes wrong if ignored:** Phase 2 will add methods to a store that was always wrong (in-memory, not persisted). The storage layer refactor and the feature build happen simultaneously, multiplying the risk.

**When:** Phase 2 kickoff. The cost is doubled effort, not a hard block — but it's avoidable.

---

### 🟠 CONCERN-5: approvalState Is Typed as `string` on Both Spec and PRD

**File:** `src/worker/types.ts:11-12`

`Spec.approvalState: string` and `PRD.approvalState: string` — no enum constraint. Every other state field in the model uses a proper union type. Approval state will be whatever string Mike or a Phase 2 build agent happens to write.

Phase 2 will likely need to gate PRD progression on approval state (e.g., "if `approvalState === 'Approved'` advance to ReadyForBuild"). Without an enum, Phase 2 code has to hardcode magic strings, and any variation (`"approved"`, `"Approved"`, `"APPROVED"`, `"Accepted"`) silently fails the gate.

**What goes wrong if ignored:** Phase 2 build dispatch gates based on string comparisons against values that were never constrained. Mike will type "Approved" once and "approved" another time and wonder why a phase won't advance.

**When:** Phase 2 state machine transitions.

---

### 🟡 CONCERN-6: DepartmentSidebar and PhasesTab Render Identical Independent Components

**File:** `src/ui/index.tsx:4-10`, `paperclip-plugin.json:10-29`

Both UI slots (`projectSidebarItem` and `detailTab`) render `<DepartmentView />` with no shared state. When both are visible simultaneously, Mike sees two independent copies of the plugin with separate project lists and independent edit forms.

**What goes wrong if ignored:** Mike makes changes in the sidebar, switches to the tab, and finds different (stale) data. Confusing operator experience in Phase 1; in Phase 2 when real persistence exists, the stale UI won't know to re-read.

**When:** First time Mike opens both slots. Immediate UX confusion.

---

### 🟡 CONCERN-7: Hardcoded HTML `id="auth-add"` in ConversationRefs

**File:** `src/ui/components/ConversationRefs.tsx:453`

The "Authoritative source" checkbox uses a hardcoded `id="auth-add"`. If `ConversationRefs` is rendered for both a project scope and a phase scope on the same page (which the `ScopeType` model explicitly supports), there will be two elements with the same HTML id. The `<label htmlFor="auth-add">` click will activate the wrong checkbox.

**What goes wrong if ignored:** Clicking the authoritative checkbox label in one panel toggles the checkbox in a different panel. Silent data corruption — Mike marks a conversation as authoritative but the wrong reference gets flagged.

**When:** Any view that shows both project-level and phase-level conversation refs simultaneously.

---

### 🟡 CONCERN-8: ConversationRefs Re-declares Types Already in types.ts

**File:** `src/ui/components/ConversationRefs.tsx:4-5`

```ts
type ConversationSystem = "Claude" | "ChatGPT" | "Other";
type ConversationRole = "planning" | "prd" | "architecture" | "review" | "revision";
```

These are re-declared locally despite identical definitions existing in `types.ts`. The component imports `ConversationReference` from types but re-declares its component types, then casts back at usage (`r.system as ConversationSystem`). If `types.ts` adds a new system (e.g., `"Gemini"`) the component won't know about it and will silently show broken badge colors.

**What goes wrong if ignored:** A Phase 2 extension of supported AI systems requires updates in two places that aren't linked by the type system. One gets updated, one doesn't.

**When:** First time someone adds a new AI system to the model.

---

### 🟡 CONCERN-9: "Cancel" in ProjectHeader Navigates Away Instead of Discarding Edits

**File:** `src/ui/components/ProjectHeader.tsx:132-143`, `src/ui/components/DepartmentView.tsx:145`

The `onCancel` prop on `ProjectHeader` calls `setSelectedProject(null)` in `DepartmentView` — it navigates back to the project list. This is the opposite of expected UX: Cancel should mean "discard unsaved changes," not "leave this screen."

If Mike opens a project, makes edits, then clicks Cancel expecting to revert — he'll instead be kicked back to the project list with his edits discarded but no warning.

**What goes wrong if ignored:** Mike loses work silently. In Phase 2 when phases have complex spec/PRD data attached, an accidental Cancel on the project header destroys unsaved work across the entire view.

**When:** First real use.

---

## What Wasn't Built (PRD Gaps)

1. **No mechanism for Mike to set `activePhaseId` on a project** — the field exists in the type and is displayed in `ProjectHeader.tsx` if set, but there is no UI to set it. The active phase indicator will never show.

2. **Spec and PRD are read-only in PhaseDetail** — there's no "Attach Spec" or "Attach PRD" button. The `createSpec` and `createPRD` methods exist in StateStore but the UI has no way to invoke them. Phase 1 was supposed to include creating/attaching these.

3. **No way to view or add ConversationRefs in the current UI** — `ConversationRefs.tsx` is a complete, well-built component but it is never rendered anywhere in `DepartmentView.tsx` or `PhaseDetail.tsx`. It exists but is unreachable.

4. **No phase deletion confirmation** — The delete button (`×`) in PhaseList triggers `onDelete` immediately with no confirmation dialog. A single click on a loaded phase deletes it permanently (or would, if persistence worked).

---

## If I Had to Bet on What Breaks in Phase 2

The worker/UI split is completely unimplemented — the worker is a dead no-op and the UI is an isolated React toy — so Phase 2 doesn't inherit a foundation to build on, it inherits a facade that needs to be torn down first. The most likely breaking point is the state integration work: whoever picks up Phase 2 will discover that wiring `plugin.state` requires rethinking both sides simultaneously, the conflicting ID strategies will produce silent cross-reference failures that are hard to diagnose, and the `phaseNumber`/`sortOrder` divergence will corrupt build sequencing gates on first real use. The sum of these is that Phase 2 will effectively need to rewrite the data layer, re-plumb the UI, and fix the data model before any new feature work begins — which means Phase 2's scope estimate based on Phase 1's apparent completeness will be badly wrong.
