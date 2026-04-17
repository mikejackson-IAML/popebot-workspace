**VERDICT: REQUEST CHANGES**

---

## Blocking Finding

**src/manifest.ts:24** — Missing sidebar slot definition

The `AutomationSidebar` component is exported from `src/ui/index.tsx` but missing from the UI slots in the manifest. The `paperclip-plugin.json` includes the `projectSidebarItem` slot, but `src/manifest.ts` only declares the `detailTab`. This mismatch will prevent the sidebar component from being registered at runtime.

**Fix**: Add the sidebar slot to `src/manifest.ts`:

```typescript
ui: {
  slots: [
    {
      type: "projectSidebarItem",
      id: "automation-sidebar",
      displayName: "Automation",
      exportName: "AutomationSidebar",
      entityTypes: ["project"],
    },
    {
      type: "detailTab",
      id: "automation-projects",
      displayName: "Projects",
      exportName: "ProjectsTab",
      entityTypes: ["project"],
    },
  ],
},
```

Also add `"ui.sidebar.register"` to the capabilities array to match `paperclip-plugin.json`.

---

All other files compile correctly, imports are valid, and props are properly typed. Fix the manifest registration and this is ready to merge.

---
REVIEW_TIER: haiku
