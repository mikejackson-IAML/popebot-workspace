import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
const STATUS_OPTIONS = ["Draft", "Active", "Blocked", "Archived"];
const statusColors = {
    Draft: "#6b7280",
    Active: "#16a34a",
    Blocked: "#dc2626",
    Archived: "#9ca3af",
};
export default function ProjectHeader({ project, phases, onSave, onCancel }) {
    const [name, setName] = useState(project.name);
    const [objective, setObjective] = useState(project.objective);
    const [status, setStatus] = useState(project.status);
    useEffect(() => { setName(project.name); setObjective(project.objective); setStatus(project.status); }, [project.id, project.updatedAt]);
    const activePhase = phases.find((p) => p.id === project.activePhaseId);
    const handleSave = () => {
        onSave({ name, objective, status });
    };
    const isDirty = name !== project.name || objective !== project.objective || status !== project.status;
    return (_jsxs("div", { style: { padding: "16px", borderBottom: "1px solid #374151" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }, children: [_jsx("input", { value: name, onChange: (e) => setName(e.target.value), style: {
                            flex: 1,
                            fontSize: "20px",
                            fontWeight: 600,
                            border: "1px solid #374151",
                            borderRadius: "6px",
                            padding: "6px 10px",
                            outline: "none",
                        }, placeholder: "Project name" }), _jsx("select", { value: status, onChange: (e) => setStatus(e.target.value), style: {
                            border: "1px solid #374151",
                            borderRadius: "6px",
                            padding: "6px 10px",
                            fontSize: "14px",
                            color: statusColors[status],
                            fontWeight: 600,
                            outline: "none",
                            cursor: "pointer",
                        }, children: STATUS_OPTIONS.map((s) => (_jsx("option", { value: s, style: { color: statusColors[s] }, children: s }, s))) })] }), _jsx("textarea", { value: objective, onChange: (e) => setObjective(e.target.value), rows: 3, style: {
                    width: "100%",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    fontSize: "14px",
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                }, placeholder: "Project objective" }), activePhase && (_jsxs("div", { style: {
                    marginTop: "10px",
                    fontSize: "13px",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                }, children: [_jsx("span", { style: { fontWeight: 600, color: "#cbd5e1" }, children: "Active phase:" }), _jsxs("span", { style: {
                            backgroundColor: "#eff6ff",
                            color: "#1d4ed8",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontWeight: 500,
                        }, children: ["Phase ", activePhase.phaseNumber, ": ", activePhase.title] })] })), _jsxs("div", { style: { display: "flex", gap: "8px", marginTop: "12px" }, children: [_jsx("button", { onClick: handleSave, disabled: !isDirty, style: {
                            padding: "6px 16px",
                            backgroundColor: isDirty ? "#2563eb" : "#93c5fd",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: isDirty ? "pointer" : "not-allowed",
                            fontSize: "14px",
                            fontWeight: 500,
                        }, children: "Save" }), _jsx("button", { onClick: onCancel, style: {
                            padding: "6px 16px",
                            backgroundColor: "#1e293b",
                            color: "#cbd5e1",
                            border: "1px solid #374151",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                        }, children: "Cancel" })] })] }));
}
//# sourceMappingURL=ProjectHeader.js.map