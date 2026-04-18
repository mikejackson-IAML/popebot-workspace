import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest: PaperclipPluginManifestV1 = {
  id: "dev-department",
  apiVersion: 1,
  version: "0.2.0",
  displayName: "Project Automation",
  description: "Automated build governance — drop a PRD, walk away",
  author: "Mike Jackson",
  categories: ["workspace"],
  capabilities: [
    "plugin.state.read",
    "plugin.state.write",
    "ui.sidebar.register",
    "ui.detailTab.register",
    "http.outbound",
    "secrets.read-ref",
    "projects.read",
    "activity.log.write",
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
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
};

export default manifest;
