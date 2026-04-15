import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest: PaperclipPluginManifestV1 = {
  id: "dev-department",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Development Department",
  description: "Phase-aware build governance for phased architecture projects",
  author: "Mike Jackson",
  categories: ["productivity"],
  capabilities: ["plugin.state.read", "plugin.state.write"],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  ui: {
    slots: [
      {
        type: "projectSidebarItem",
        id: "dev-dept-sidebar",
        displayName: "Development Department",
        exportName: "DepartmentSidebar",
        entityTypes: ["project"],
      },
      {
        type: "detailTab",
        id: "dev-dept-phases",
        displayName: "Phases",
        exportName: "PhasesTab",
        entityTypes: ["project"],
      },
    ],
  },
};

export default manifest;
