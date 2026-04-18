**VERDICT: REQUEST CHANGES**

---

## Blocking Findings

### 1. Manifest Capability Mismatch
**Files:** `paperclip-plugin.json` vs `src/manifest.ts`

The TypeScript manifest is missing `"secrets.read-ref"` capability that is present in the JSON manifest. This inconsistency will break worker-level secret reads if the worker code depends on this permission.

**Fix:** Add `"secrets.read-ref"` to the `capabilities` array in `src/manifest.ts` (line ~14, after `"http.outbound"`), matching `paperclip-plugin.json`.

### 2. Entrypoints Path Format Inconsistency
**Files:** `paperclip-plugin.json` vs `src/manifest.ts`

- JSON uses `"dist/worker.js"` and `"dist/ui/"`
- TypeScript uses `"./dist/worker.js"` and `"./dist/ui"`

Pick one format consistently (`./ prefix` is preferred in TypeScript). Align both files.

---

## Non-Blocking Notes

- UI components export correctly (`AutomationSidebar`, `ProjectsTab`) matching manifest slot declarations ✓
- Type interfaces well-defined and used consistently throughout ✓
- Plugin data hooks (`usePluginData`, `usePluginAction`) usage looks sound ✓

---
REVIEW_TIER: haiku
