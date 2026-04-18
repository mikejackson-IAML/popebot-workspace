

## Devils Advocate Review — Round 2

**Phase: Test: codex advisory mode**

### Verdict: **CONCERNS**

---

**No compile errors, no wrong imports, no missing props, no breaking data model issues found.**

The types align between `worker/types.ts` and the UI's mirrored interfaces. All SDK imports (`@paperclipai/plugin-sdk`, `@paperclipai/plugin-sdk/ui`) match the installed package. Props for exported components (`AutomationSidebar`, `ProjectsTab`) match their declared slot types. The `tsconfig.json` is valid and the `dist/*.d.ts` files confirm a successful prior build.

---

### Notes for future phases:

**NOTE for Phase 3 (hardening):** The UI mirrors types from `worker/types.ts` manually. The `ReviewVerdict` type in the UI includes `"reject"` which doesn't exist in the canonical `worker/types.ts` (`"unknown"` is the catch-all there). Not a compile error since the UI defines its own local type, but a drift risk — consider importing from a shared location.

**NOTE for Phase 3:** `require("@paperclipai/plugin-sdk/dist/ui/runtime")` in the UI is a CJS `require` call inside an ESM module (`"type": "module"` in package.json). This works only because Paperclip's module host handles it specially. If the bundling strategy changes, this will break at runtime (not compile time).

**NOTE for Phase 4 (security):** API keys are stored via `ctx.state.set` with `scopeKind: "instance"`. Depending on the SDK's storage backend, these may be persisted in plaintext. The manifest declares `secrets.read-ref` capability but doesn't use the secrets API — keys should migrate to the secrets store.

**NOTE for Phase 4:** The `RTX_ORCHESTRATOR_URL` is a hardcoded Tailscale hostname. Fine for current single-tenant use, but should become configurable before multi-tenant deployment.

**NOTE for Phase 3:** The auto-advance polling loop in `advance-project` has no timeout guard (unlike `start-pipeline` which has a 30-min cap). An orphaned RTX advance job would cause the worker to poll indefinitely.

---
REVIEW_TIER: claude
