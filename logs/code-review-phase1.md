# Code Review: dev-department Plugin — Phase 1

**Verdict: REQUEST CHANGES**
**Reviewer:** Code Reviewer (automated agent job)
**Date:** 2026-04-14
**Scope:** `plugins/dev-department/` — all source files

---

## Summary

The plugin has solid bones: the data model is complete, the TypeScript types are well-structured, phase status and freeze state are independently settable, and the UI components (especially `PhaseList` and `PhaseDetail`) are clean and extensible. However, there are two critical architectural defects — the state layer uses `any` internally and the UI is entirely disconnected from the `StateStore` — plus several errors that must be resolved before this ships. Phase 2 stubs are reasonable.

---

## Findings

### CRITICAL

#### C1 — `StateStore` typed as `Map<string, any>`
**File:** `src/worker/state.ts:4`

```ts
private store: Map<string, any> = new Map();
```

The entire store's type safety collapses here. Every `store.get()` call returns `any`, meaning the TypeScript strict mode configured in `tsconfig.json` provides no protection against runtime shape errors in the state layer. This is the data backbone of the plugin.

**Fix:** Use a discriminated union or a typed map structure:
```ts
type StoreValue = DevProject | Phase | Spec | PRD | ConversationReference;
private store: Map<string, StoreValue> = new Map();
```
Alternatively, split into typed sub-maps (`projectMap: Map<string, DevProject>`, etc.).

---

#### C2 — UI is completely disconnected from `StateStore`
**Files:** `src/ui/components/DepartmentView.tsx:89-116`, `src/ui/index.tsx:4-10`

`DepartmentView` manages all data in local React state (`useState`). It never calls the `StateStore`. Projects created in the UI disappear on unmount. The `handleCreateProject` function constructs IDs with `Date.now()` (line 97) rather than the `generateId()` method in the store, creating an inconsistency even if wiring is added later.

This is not a "stub" — it's a functional gap. The store has full CRUD but none of it is reachable from the UI.

**Fix:** Wire `DepartmentView` to call `store.*` methods (or a plugin state API if the host provides one). At minimum, document explicitly that persistence is deferred to a future PR so reviewers don't assume it works.

---

#### C3 — Both UI slots render identical component
**File:** `src/ui/index.tsx:4-10`

```tsx
export function DepartmentSidebar() { return <DepartmentView />; }
export function PhasesTab() { return <DepartmentView />; }
```

`DepartmentSidebar` (slot type: `projectSidebarItem`) and `PhasesTab` (slot type: `detailTab`) are different surfaces with different affordances. Rendering the full project management view in a sidebar slot will produce a broken layout. These need distinct, appropriately scoped components.

**Fix:** Create `SidebarView` (compact project list/active phase summary) and use `DepartmentView` only for the `detailTab` slot.

---

#### C4 — `PhaseList.tsx` is never used
**Files:** `src/ui/components/PhaseList.tsx`, `src/ui/components/DepartmentView.tsx:41-87`

`DepartmentView` contains its own inline `PhaseList` function (lines 41–87) and never imports `src/ui/components/PhaseList.tsx`. The standalone `PhaseList.tsx` — which has proper features (reorder, delete, freeze icons, spec/PRD badges) — is dead code. The inline version used in the app is a stripped-down duplicate.

**Fix:** Remove the inline `PhaseList` from `DepartmentView.tsx` and import `PhaseList` from `./PhaseList`. Wire the missing props (`onSelect`, `onAdd`, `onDelete`, `onReorder`).

---

### ERROR

#### E1 — `ref` is a reserved prop name in React
**File:** `src/ui/components/ConversationRefs.tsx:117`

```tsx
function RefRow({ ref: r, onUpdate, onDelete }: { ref: ConversationReference; ... })
```

`ref` is a reserved prop name in React (used for `React.forwardRef`). Passing it as a regular prop will silently fail in some React versions and generate warnings in React 19. The prop value will not be received by the component.

**Fix:** Rename to `item`, `conversationRef`, or `data`.

---

#### E2 — Missing `deleteSpec` and `deletePRD` methods
**File:** `src/worker/state.ts`

`createSpec`, `getSpecByPhase`, and `updateSpec` exist; `deleteSpec` does not. Same for PRD. There is no way to remove a spec or PRD from a phase without deleting the phase itself.

**Fix:** Add `deleteSpec(id: string): void` and `deletePRD(id: string): void`.

---

#### E3 — No cascade delete on `deleteProject` or `deletePhase`
**File:** `src/worker/state.ts:29-31`, `src/worker/state.ts:68-70`

```ts
deleteProject(id: string): void { this.store.delete(`project:${id}`); }
deletePhase(id: string): void { this.store.delete(`phase:${id}`); }
```

Deleting a project leaves orphaned `phase:*`, `spec:*`, `prd:*`, and `convref:*` entries in the store. Deleting a phase leaves orphaned specs, PRDs, and conversation refs. This will cause phantom data on list scans and misleading `getSpecByPhase`/`getPRDByPhase` lookups.

**Fix:** Implement cascade cleanup. For `deletePhase`: iterate and delete associated spec, PRD, and conversation refs. For `deleteProject`: call `deletePhase` for each of the project's phases.

---

#### E4 — No CRUD for `BuildDispatch`, `BuildOutput`, `Review`, `RevisionEvent`
**File:** `src/worker/state.ts`

All four interfaces are defined in `types.ts` but have zero corresponding state methods. These are Phase 2 entities, but the placeholder pattern used elsewhere (grayed UI blocks in `PhaseDetail`) should be mirrored in state — at minimum, stub read methods returning empty arrays, so Phase 2 can add write methods without architectural changes.

**Fix:** Add stub read methods (e.g., `getBuildOutputByPhase`, `getReviewByPhase`, `getRevisionEventsByPhase`) that return `null` / `[]` for now.

---

#### E5 — `phases` state in `DepartmentView` is never populated
**File:** `src/ui/components/DepartmentView.tsx:93`

```ts
const [phases] = useState<Phase[]>([]);
```

The setter is omitted from destructuring, so phases can never be updated even within local state. The phase list always renders empty.

**Fix:** Either wire to the store (preferred per C2) or at minimum destructure the setter and populate phases when a project is selected.

---

### WARNING

#### W1 — Duplicate type declarations in `ConversationRefs.tsx`
**File:** `src/ui/components/ConversationRefs.tsx:4-5`

```ts
type ConversationSystem = "Claude" | "ChatGPT" | "Other";
type ConversationRole = "planning" | "prd" | "architecture" | "review" | "revision";
```

These are re-declared locally despite being exported from `types.ts`. If the canonical types are updated (e.g., adding a new `ConversationSystem`), the local copies will silently diverge.

**Fix:** Remove local re-declarations; import from `../../worker/types`.

---

#### W2 — `scopeType` prop loses type safety
**File:** `src/ui/components/ConversationRefs.tsx:9`

```ts
scopeType: string;
```

Should be `ScopeType` (imported from `types.ts`). The cast on line 345 (`scopeType as ConversationReference["scopeType"]`) is a workaround for this.

**Fix:** Type as `ScopeType`.

---

#### W3 — `href={r.url}` without URL scheme validation
**File:** `src/ui/components/ConversationRefs.tsx:266`

```tsx
<a href={r.url} target="_blank" rel="noopener noreferrer">
```

If a user stores a `javascript:alert(1)` URL, clicking the link executes JavaScript. The `type="url"` input attribute does not prevent this.

**Fix:** Validate on add/display: `r.url.startsWith('https://') || r.url.startsWith('http://')`. In `handleAdd`, reject non-http(s) URLs before calling `onAdd`.

---

#### W4 — Hardcoded `id="auth-add"` on checkbox
**File:** `src/ui/components/ConversationRefs.tsx:451`

If two `ConversationRefs` components appear on the same page (e.g., project-scoped and phase-scoped refs side by side), duplicate IDs break the label/checkbox association.

**Fix:** Use a unique id, e.g., `` `auth-add-${scopeId}` ``.

---

#### W5 — Untyped string fields on Phase 2 interfaces
**File:** `src/worker/types.ts:13-16`

`BuildDispatch.status`, `BuildDispatch.buildClass`, `BuildDispatch.riskLevel`, `BuildOutput.status`, `Review.decision`, `Spec.approvalState`, `PRD.approvalState` are all `string`. These will have finite states; leaving them untyped invites inconsistent values across the system.

**Fix:** Define union types now even if Phase 2 implements them:
```ts
type ApprovalState = "Pending" | "Approved" | "Rejected";
type BuildStatus = "Queued" | "InProgress" | "Succeeded" | "Failed";
type ReviewDecision = "Accepted" | "ReworkRequired" | "Closed";
```

---

#### W6 — `react` and `typescript` in wrong dependency categories
**File:** `package.json`

- `react` / `react-dom` should be `peerDependencies` — bundling React into a plugin risks the "multiple React instances" problem when loaded into a host app that already provides React.
- `typescript` should be in `devDependencies` — it is a build-time tool, not a runtime dependency.

---

#### W7 — Phase number editable with no duplicate validation
**File:** `src/ui/components/PhaseDetail.tsx:116-122`

Users can set any integer as the phase number (including 0 or duplicates). `sortOrder` drives display order (which is correct), but `phaseNumber` is used as a display label and should be unique per project.

**Fix:** Validate uniqueness against sibling phases when saving, or make phase number read-only and auto-assign.

---

### INFO

#### I1 — Worker entry point is intentionally minimal
**File:** `src/worker/index.ts`

The worker is a pure re-export. For Phase 2, this is where a message handler / command dispatcher should be registered. The architecture supports this cleanly — no changes needed now, just a clear insertion point.

---

#### I2 — Grayed Phase 2 placeholders in PhaseDetail are good practice
**File:** `src/ui/components/PhaseDetail.tsx:307-317`

Build Output, Review, and Revision Events sections are shown with dashed placeholder blocks. This is the right pattern — it communicates intent and gives Phase 2 clear insertion points without shipping broken UI.

---

#### I3 — `hasSpec` / `hasPRD` maps in `PhaseList` are a clean Phase 2 hook
**File:** `src/ui/components/PhaseList.tsx:39-42`

The optional `hasSpec` and `hasPRD` record props default to empty maps, allowing Phase 2 to pass real data without changing the component interface. Good design.

---

#### I4 — `ConversationReference.status` field not surfaced in UI
**File:** `src/worker/types.ts:17`, `src/ui/components/ConversationRefs.tsx:344`

`status: ConversationStatus` (`"active" | "reference" | "archived"`) is always hardcoded to `"active"` on creation and never displayed or editable. For Phase 2, add status management to `RefRow`.

---

## Phase 2 Compatibility Assessment

| Concern | Assessment |
|---|---|
| Dispatch/queue hookup | `BuildDispatch` interface exists; state CRUD and worker message handler are missing — add stubs now |
| Review workflow | `Review` + `RevisionEvent` interfaces exist; no state or UI — same as above |
| State persistence | Currently ephemeral in-memory Map; needs plugin state API integration before Phase 2 begins |
| Slot separation | `DepartmentSidebar` and `PhasesTab` must be differentiated before Phase 2 adds more detail |
| ConversationRef status lifecycle | Type supports it; UI ignores it — needs exposing in Phase 2 |

---

## Required Fixes Before Approval

1. **C1** — Type the internal store map (no `any`)
2. **C2** — Wire UI to `StateStore` or explicitly document persistence as a known gap with a tracking issue
3. **C3** — Differentiate `DepartmentSidebar` and `PhasesTab` components
4. **C4** — Remove inline `PhaseList` duplicate from `DepartmentView`, use the standalone component
5. **E1** — Rename `ref` prop in `RefRow`
6. **E2** — Add `deleteSpec` and `deletePRD`
7. **E3** — Add cascade delete for projects and phases
8. **W3** — Validate URL scheme before rendering `href`

Items W1, W2, W4–W7 and E4–E5 can ship in the same PR or be tracked as follow-ups at the team's discretion.
