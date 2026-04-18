# Code Review: dev-department Plugin

## Verdict: **REQUEST CHANGES**

---

### Critical Issues

**1. DepartmentView passes wrong props to PhaseDetail**
`DepartmentView.tsx:113-119` — `PhaseDetail` is called with `{phase, spec: null, prd: null, onSave, onCancel}` but `PhaseDetail`'s interface requires `conversationRefs`, `onAttachSpec`, `onAttachPRD`, `onAddConversationRef`, `onUpdateConversationRef`, and `onDeleteConversationRef`. This will fail at compile time.

```tsx
// Current (missing required props):
<PhaseDetail phase={selectedPhase} spec={null} prd={null} onSave={handleSavePhase} onCancel={() => setSelectedPhase(null)} />

// Required by PhaseDetailProps:
conversationRefs, onAttachSpec, onAttachPRD, onAddConversationRef, onUpdateConversationRef, onDeleteConversationRef
```

**2. Default import of named export — ConversationRefs**
`DepartmentView.tsx:6` and `PhaseDetail.tsx:3` both use `import ConversationRefs from "./ConversationRefs"` but `ConversationRefs.tsx` only has a **named export** (`export function ConversationRefs`). This will fail at runtime/compile time. Either add a default export or switch to `import { ConversationRefs }`.

---

### Moderate Issues

**3. Cascade delete incomplete for project-scoped conversation refs**
`state.ts:deleteProject` cascades into `deletePhase` which cleans up phase-scoped refs, but **project-scoped** conversation references (`scopeType === "project"`) are never deleted. Add:
```ts
for (const ref of this.getConversationRefs("project", id)) {
  this.conversationRefs.delete(ref.id);
}
```

**4. `deletePhase` doesn't cascade BuildDispatch, BuildOutput, Review, RevisionEvent**
Even though these are Phase 2 stubs, the maps exist and `deletePhase` doesn't clean them up. When Phase 2 lands, deleting a phase will orphan these records. Add cascade deletes now to avoid a latent bug.

**5. `ConversationReference.status` field never set from UI**
The `ConversationRefs` component hardcodes `status: "active"` on add but provides no way to change it. The `EditingState` interface omits `status` entirely, so `onUpdate` can never transition a ref to `"reference"` or `"archived"`. Minor for Phase 1 but worth noting.

---

### Minor / Style Issues

**6. Redundant `as` casts on data already typed**
`RefRow` casts `r.system as ConversationSystem` and `r.role as ConversationRole` even though `r` is already typed as `ConversationReference` where those fields have the correct types. These casts are noise.

**7. PhaseDetail `useEffect` dependency**
`PhaseDetail.tsx:109` — `useEffect` depends on `[phase.id]` but reads the entire `phase` object. If `phase` fields change without the `id` changing (e.g., after an external save), the draft won't reset. Depend on `[phase]` or at minimum `[phase.id, phase.updatedAt]`.

**8. Inline styles everywhere**
Every component uses extensive inline `style={{}}` objects. These create new object references on every render. Not a correctness issue, but worth flagging as tech debt — a shared style constants file or CSS module would improve maintainability.

---

### Positive Observations

- **Types are clean**: No `any` usage. All maps are properly typed with `Map<string, T>`. Union types for statuses/roles are well-defined.
- **Plugin manifest is valid**: `apiVersion`, entrypoints, slots, and capability declarations look correct per Paperclip conventions.
- **Worker/UI separation is correct**: Worker exports types and state; UI imports types only. No direct state mutation from UI components.
- **Phase 2 readiness is decent**: Stub types (`BuildDispatch`, `BuildOutput`, `Review`, `RevisionEvent`) and getter methods exist in `StateStore`. UI has grayed-out placeholder sections. The type system will guide Phase 2 implementation.

---

### Summary of Required Changes

| # | Severity | File | Fix |
|---|----------|------|-----|
| 1 | **Critical** | `DepartmentView.tsx` | Pass all required props to `PhaseDetail` |
| 2 | **Critical** | `DepartmentView.tsx`, `PhaseDetail.tsx` | Fix import to named export `{ ConversationRefs }` |
| 3 | **Moderate** | `state.ts` | Cascade-delete project-scoped conversation refs in `deleteProject` |
| 4 | **Moderate** | `state.ts` | Cascade-delete Phase 2 entities in `deletePhase` |
