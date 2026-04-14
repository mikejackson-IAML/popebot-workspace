# Code Review: dev-department Plugin — Round 3 (Phase 2 Scope)

## Verdict: **APPROVE**

No compile-time errors, incorrect imports, missing required props, or data model shapes requiring breaking migration.

---

## Status of All Prior Findings

| Round | # | Issue | Status |
|-------|---|-------|--------|
| R2-CR | 1 | Wrong props to PhaseDetail | **FIXED** — `DepartmentView.tsx:149-160` passes all 12 required props |
| R2-CR | 2 | Default import of named export | **FIXED** — `DepartmentView.tsx:6` uses `{ ConversationRefs }`, `PhaseDetail.tsx:3` uses `{ ConversationRefs }` |
| R2-CR | 3 | Project-scoped refs not cascade-deleted | **FIXED** — `state.ts:deleteProject` iterates `conversationRefs` for `scopeType === "project"` |
| R2-CR | 4 | Phase 2 entities not cascade-deleted | **FIXED** — `state.ts:deletePhase` cascades `buildDispatches`, `buildOutputs`, `reviews`, `revisionEvents` |
| R5-CR | 1 | Missing `useState` import | **FIXED** |

---

## Non-blocking Notes

1. **PhaseList delete now has confirmation** — `PhaseList.tsx:128-131` uses `window.confirm()`. Prior devil's advocate finding resolved.

2. **`hasSpec`/`hasPRD` still not passed from DepartmentView** — `DepartmentView.tsx:195` doesn't pass these optional props. Badges won't render. Not a compile error (defaults to `{}`).

3. **ProjectHeader still no `useEffect` resync** — NOTE for Phase 2: when persistence is wired, the stale-closure pattern in `handleSaveProject`/`handleSavePhase` and missing resync in `ProjectHeader` will cause last-write-wins bugs. Address before persistence integration.

4. **Spec/PRD missing `createdAt`/`updatedAt` in data model** — NOTE for Phase 2: `Spec` and `PRD` types already include these timestamps. `StateStore.createSpec`/`createPRD` set them. No migration issue.

5. **Worker/UI not yet wired** — Expected for current state; persistence wiring is Phase 2 work.
