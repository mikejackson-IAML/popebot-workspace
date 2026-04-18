1. [plugins/dev-department/src/worker.ts:621](</tmp/tmp.q6VCJVGzMb/repo/plugins/dev-department/src/worker.ts:621>) Auto-advance marks the next-phase project `complete` as soon as the RTX pipeline finishes, which bypasses the plugin’s own `needs-review` human gate and changes the approval semantics.
2. [plugins/dev-department/src/worker.ts:575](</tmp/tmp.q6VCJVGzMb/repo/plugins/dev-department/src/worker.ts:575>) The auto-started next-phase pipeline hardcodes `reviewDir: "plugins/dev-department"` and omits the configured repo, so later phases can run against the wrong target and diverge from normal `start-pipeline` behavior.
3. [plugins/dev-department/src/ui/index.tsx:23](</tmp/tmp.q6VCJVGzMb/repo/plugins/dev-department/src/ui/index.tsx:23>) The file uses `React.FC`, `React.ReactNode`, and `React.ChangeEvent` without importing `React` types, which is a `tsc` break under this TS/ESM setup.
4. [plugins/dev-department/src/ui/index.tsx:92](</tmp/tmp.q6VCJVGzMb/repo/plugins/dev-department/src/ui/index.tsx:92>) `ActionBar` invokes `usePluginAction` inside the click handler instead of during render, which is an invalid hook call pattern and can break action dispatch at runtime.

REJECT

- [plugins/dev-department/src/ui/index.tsx:23](</tmp/tmp.q6VCJVGzMb/repo/plugins/dev-department/src/ui/index.tsx:23>) Import the needed React types explicitly, or stop using the `React.*` namespace entirely, so the file compiles cleanly.
- [plugins/dev-department/src/ui/index.tsx:92](</tmp/tmp.q6VCJVGzMb/repo/plugins/dev-department/src/ui/index.tsx:92>) Refactor `ActionBar` so plugin actions are resolved during render with valid hook usage, not inside the button `onClick` callback.
- [plugins/dev-department/src/worker.ts:575](</tmp/tmp.q6VCJVGzMb/repo/plugins/dev-department/src/worker.ts:575>) In the next-phase auto-start path, pass the actual `repoUrl` and `reviewDir` through to RTX exactly like `start-pipeline` does; remove the hardcoded plugin path.
- [plugins/dev-department/src/worker.ts:621](</tmp/tmp.q6VCJVGzMb/repo/plugins/dev-department/src/worker.ts:621>) When the auto-started next-phase pipeline completes, transition that project to `needs-review` and preserve the same review/approval gate as the primary pipeline flow instead of auto-completing it.

---
REVIEW_TIER: codex
REVIEW_DURATION_S: 70
