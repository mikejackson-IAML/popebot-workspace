The PRD is ready but I need write permission to save it to `plugins/dev-department/reports/phase-2-prd.md`. Could you approve the write?

Here's a summary of what the PRD covers:

**Phase 2: Dispatch Queue, Job Routing & Review Fixes**

**8 deliverables:**

1. **Dispatch Queue Engine** (new file `dispatch-queue.ts`) -- Dependency-aware job queue that routes `code`/`workflow`/`config`/`schema` jobs to different PopeBot agent endpoints, tracks individual `popebotJobId`, handles parallel batch dispatch for independent jobs
2. **RTX URL Configuration** -- Replace hardcoded Tailscale hostname with configurable URL stored in state
3. **Wire Dispatch Queue into Pipeline** -- Refactor the 270-line inline polling loop in `worker.ts` into a ~30-line call to the queue
4. **Shared Types** -- Delete 105 lines of duplicated types from UI, import from `worker/types.ts`, add missing `"reject"` verdict
5. **Auto-Advance Timeout Fix** -- Add 30-minute timeout guards to both advance polling loops
6. **CJS Require Fix** -- Replace `require()` with dynamic `import()` in ESM module
7. **ActionBar Hook Violation Fix** -- Extract action buttons into own components to satisfy React hook rules
8. **Clear Progress Log on Retry** -- One-liner fix

**18 testable acceptance criteria**, explicit scope boundaries (5 files not to touch, 5 features deferred to later phases), and risk callouts for RTX API contract dependencies and circular dependency edge cases.
