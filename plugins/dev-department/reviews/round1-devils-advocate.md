

## Devils Advocate Review — Phase 1: Tool & Integration Access

**Verdict: CONCERNS**

### Reviewed

All 8 source files, dist declarations, package.json, tsconfig, and plugin manifest.

### No Blockers Found

- Types compile cleanly — all imports resolve within the project or via `@paperclipai/plugin-sdk`
- No missing props on exported components (`AutomationSidebar` takes `PluginProjectSidebarItemProps`, `ProjectsTab` takes `PluginDetailTabProps`)
- Data model is internally consistent across `types.ts`, `state.ts`, `worker.ts`, and `ui/index.tsx`
- No breaking migration issues — state is key-value via `PluginStateClient`, not a schema'd DB

### Concerns

1. **NOTE for Phase 2** — `ui/index.tsx` uses `require("@paperclipai/plugin-sdk/dist/ui/runtime")` — a CJS `require` in an ESM module. This works today because the SDK runtime host likely provides a CJS shim, but it's brittle. Should move to dynamic `import()` with a try/catch.

2. **NOTE for Phase 2** — `ui/index.tsx` duplicates all type definitions from `worker/types.ts` rather than sharing them. These will drift. Consider a shared types package or re-export.

3. **NOTE for Phase 3** — The `ActionBar` fallback calls `usePluginAction` at the top of the component but invokes it inside a click handler loop. React hooks rules are technically satisfied (the hook is `usePluginAction` called once per render, returning a factory), but the pattern is unusual — verify the SDK's `usePluginAction` returns a stable callable, not a hook itself.

4. **NOTE for Phase 3** — `worker.ts` has deeply nested fire-and-forget async chains (advance → decompose → start pipeline → poll → chain next advance). Unhandled rejections in inner closures would be silently swallowed. Not a blocker, but a reliability concern for production.

5. **NOTE for Phase 2** — `prd-decomposer.ts` system prompt says "Sending PRD to **Sonnet**" but the progress message says "Sending PRD to **Sonnet** for decomposition" while the system prompt header says "Opus." The actual model used is `"sonnet"`. Minor confusion in naming only.

6. **NOTE for Phase 3** — `RTX_ORCHESTRATOR_URL` is hardcoded to a Tailscale hostname. Should be configurable via state/env for deployment flexibility.

---
REVIEW_TIER: claude
