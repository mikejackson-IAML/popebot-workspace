The PRD is ready to write to `plugins/dev-department/reports/phase-2-prd.md`. Here's a summary of what it covers:

**5 deliverables:**

1. **Persistence Layer** — async `StateStore` with `hydrate()`/`flush()`, `plugin.state` API integration, phaseId-indexed secondary maps, and a typed worker-UI message protocol (`src/worker/messages.ts` new file)

2. **UI-to-Worker Integration** — replace `useState`-only state management in `DepartmentView` with worker message-passing, wire the spec/PRD attachment stubs, pass `hasSpec`/`hasPRD` to `PhaseList`

3. **Build Dispatch** — full `BuildDispatch` CRUD, dispatch form in `PhaseDetail`, build packet assembly and emission to Paperclip event system (`src/worker/buildPacket.ts` new file)

4. **Minimal Status Transition Validation** — gate `ReadyForBuild` on approved spec + attached PRD, gate dispatch on `ReadyForBuild` status, inline error messages in UI

5. **Deferred Bug Fixes** — stale closures, `sortOrder`/`phaseNumber` reconciliation, conversation ref status editing, `PhaseList` inline delete confirmation, redundant type casts

**Files modified:** 6 existing (`state.ts`, `index.ts`, `DepartmentView.tsx`, `PhaseDetail.tsx`, `PhaseList.tsx`, `ConversationRefs.tsx`)
**Files created:** 2 new (`messages.ts`, `buildPacket.ts`), 1 optional (`usePluginState.ts`)
**20 testable acceptance criteria** across all deliverables.

Would you like to approve the file write?
