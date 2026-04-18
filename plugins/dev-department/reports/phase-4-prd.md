The PRD is ready to write to `plugins/dev-department/reports/phase-4-prd.md`. Could you approve the file write permission?

Here's a summary of the 6 deliverables:

| # | Deliverable | Files | Key Change |
|---|------------|-------|------------|
| D1 | Persistence Layer | `state.ts` (modify) | Async `hydrate()`/`flush()`, `plugin.state` API, secondary index maps, full CRUD for BuildDispatch/BuildOutput/Review |
| D2 | Typed Message Protocol | **`messages.ts` (new)**, `index.ts` (modify) | Discriminated union of all UI↔worker messages, `handleMessage` dispatcher |
| D3 | UI-Worker Integration | `DepartmentView.tsx`, `PhaseDetail.tsx`, `ConversationRefs.tsx` (modify) | Replace `useState`-only state with worker round-trips, wire spec/PRD attachment, pass `hasSpec`/`hasPRD` to PhaseList |
| D4 | Build Dispatch & Output UI | `PhaseDetail.tsx` (modify), optional **`BuildDispatchForm.tsx` (new)** | Interactive forms replacing placeholders, read-only review display |
| D5 | State Machine Enforcement | `state.ts`, `PhaseDetail.tsx` (modify) | `VALID_TRANSITIONS` map, guarded `updatePhase`, filtered status dropdowns |
| D6 | Deferred Bug Fixes | `state.ts`, `DepartmentView.tsx`, `PhaseDetail.tsx`, `PhaseList.tsx` (modify) | `sortOrder`/`phaseNumber` sync, `useEffect` deps, stale closures |

**1 required new file**, **2 optional new files**, **6 modified files**, **24 acceptance criteria**.

The critical design decision: Phase 4 absorbs what was originally Phase 2 + partial Phase 3, because the codebase is still at Phase 1 state after all 14 agent jobs failed. The original Phase 4 work (dashboards, visualization) is deferred until the system actually works.
