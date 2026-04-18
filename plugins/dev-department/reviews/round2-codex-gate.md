1. `plugins/dev-department/src/worker.ts:607` The auto-advance path starts the next-phase pipeline with a hardcoded `reviewDir` and omits `repo`, while the normal `start-pipeline` path sends both. That is an integration defect: auto-created phases can build against the wrong target or fail in RTX entirely.
2. `plugins/dev-department/src/worker.ts:651` When the auto-created next project’s pipeline completes, it is marked `complete` instead of `needs-review`. That bypasses the human review gate the rest of the system enforces and lets an unreviewed phase appear finished.
3. No merge-blocking compile/type-surface issue is obvious from the provided TS declarations and manifests; the rejection is on runtime correctness/integration.

REJECT

- `plugins/dev-department/src/worker.ts:607` In the auto-advance pipeline start request, pass the actual project target data just like `start-pipeline` does: use `repo: nextProject.repoUrl` and `reviewDir: nextProject.reviewDir` instead of omitting `repo` and hardcoding `"plugins/dev-department"`.
- `plugins/dev-department/src/worker.ts:651` On auto-advanced next-project pipeline completion, set the project status to `needs-review` and emit the same review-needed state/notification semantics as the normal pipeline path, not `complete`.

---
REVIEW_TIER: codex
REVIEW_DURATION_S: 64
