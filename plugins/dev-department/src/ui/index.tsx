import type { PluginProjectSidebarItemProps, PluginDetailTabProps } from "@paperclipai/plugin-sdk/ui";
import DepartmentView from "./components/DepartmentView.js";

export function DepartmentSidebar({ context }: PluginProjectSidebarItemProps) {
  return (
    <div style={{ padding: "12px", fontSize: "14px" }}>
      <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#e2e8f0" }}>Dev Department</div>
      <div style={{ color: "#94a3b8", fontSize: "12px" }}>
        Project: {context.entityId?.slice(0, 8) || "none"}
      </div>
      <div style={{ color: "#64748b", fontSize: "11px", marginTop: "4px" }}>
        Click Phases tab for full view
      </div>
    </div>
  );
}

export function PhasesTab({ context }: PluginDetailTabProps) {
  return (
    <div style={{ padding: "16px", color: "#e2e8f0", minHeight: "400px" }}>
      <DepartmentView />
    </div>
  );
}
