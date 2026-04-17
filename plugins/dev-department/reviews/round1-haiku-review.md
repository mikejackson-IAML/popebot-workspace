**VERDICT: REQUEST CHANGES**

---

## Blocking Findings

**plugins/dev-department/src/manifest.ts:11–31**
- Missing `"ui.sidebar.register"` capability (declared in `paperclip-plugin.json` but not in source manifest)
- Missing `projectSidebarItem` slot definition for `AutomationSidebar` component (component is exported in `src/ui/index.tsx` but not declared in manifest)

The compiled manifest (`dist/manifest.js`) will be missing the sidebar UI slot declaration, causing the `AutomationSidebar` component to fail registration at plugin initialization. This is a missing declaration issue that blocks Phase 1 integration.

**Fix:** Add the missing capability and UI slot to match `paperclip-plugin.json`:
- Add `"ui.sidebar.register"` to the `capabilities` array
- Add the `projectSidebarItem` slot to `ui.slots` (copy from `paperclip-plugin.json`)

---
REVIEW_TIER: haiku
