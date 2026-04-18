Here's the review — I'll need write permission to save it to the reviews directory.

---

# Devil's Advocate Review — Round 1 (Phase: review-only clean repo)

**Verdict: CONCERNS**

No compile errors, no wrong imports, no missing props, no breaking data model issues. The codebase compiles and the manifest correctly references exported components.

---

## Verified Clean

1. **Manifest ↔ UI exports match.** `AutomationSidebar` and `ProjectsTab` exported from `ui/index.tsx` with correct prop types. Manifest `exportName` values align.
2. **Manifest capabilities match usage.** Worker uses `ctx.state`, `ctx.http.fetch`, `ctx.activity.log` — all declared in manifest.
3. **Worker imports resolve.** `worker/types.js`, `worker/state.js`, `worker/prd-decomposer.js` all exist and export what's referenced.
4. **Data model consistent.** UI mirror types match `worker/types.ts` field-for-field on all boundary entities.
5. **`index.ts` re-exports correct.** `manifest` and `worker` from their modules.

---

## CONCERNS (not blockers)

### 1. `usePluginAction` called inside click handler (ActionBar fallback) — Rules of Hooks violation
`ui/index.tsx:85` — Fallback `ActionBar` assigns `const act = usePluginAction` then calls `act(a.actionKey)` inside `onClick`. If this is a React hook (name says yes), this violates Rules of Hooks and throws at runtime when the fallback is active.
**NOTE for Phase 2**

### 2. UI `ReviewVerdict` type wider than worker canonical type
`ui/index.tsx:178` adds `"reject"` to the union; `worker/types.ts:21` doesn't have it. Not a bug today but type drift waiting to happen.
**NOTE for Phase 2**

### 3. API keys stored in plugin state, not secrets
`worker.ts:126-131` — Keys saved via `ctx.state.set`. Manifest declares `secrets.read-ref` but never uses it. State is readable by any code with state access.
**NOTE for Phase 2**

### 4. Fire-and-forget async with no cancellation guard
`worker.ts:246-289`, `341-565` — If user deletes project mid-flight, closures keep writing to state keys for a deleted entity.
**NOTE for Phase 3**

### 5. Toast called during render
`ui/index.tsx:561` — `toast()` fires unconditionally on every render when `needsReview`. `dedupeKey` helps but side effects during render break React strict mode.
**NOTE for Phase 2**

---

| # | Severity | Issue | Phase |
|---|----------|-------|-------|
| 1 | Medium | Hooks violation in ActionBar fallback | 2 |
| 2 | Low | Type drift on ReviewVerdict | 2 |
| 3 | Medium | API keys in state, not secrets | 2 |
| 4 | Low | No cancellation for fire-and-forget | 3 |
| 5 | Low | Side effect during render | 2 |

Nothing blocks this phase. Code compiles, imports resolve, props match, data model is internally consistent.

---
REVIEW_TIER: claude
