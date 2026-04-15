import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export function DepartmentSidebar({ context }) {
    return (_jsx("div", { style: { padding: "12px", color: "#22d3ee" }, children: _jsx("strong", { children: "Dev Department" }) }));
}
export function PhasesTab({ context }) {
    const [projects, setProjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState("");
    const handleCreate = () => {
        const project = {
            id: crypto.randomUUID(),
            name: newName || "New Project",
            status: "Draft"
        };
        setProjects(prev => [...prev, project]);
        setNewName("");
        setShowForm(false);
    };
    return (_jsxs("div", { style: {
            padding: "24px",
            color: "#e2e8f0",
            fontFamily: "system-ui, sans-serif",
            minHeight: "500px",
            backgroundColor: "rgba(15, 23, 42, 0.5)",
        }, children: [_jsxs("div", { style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                    paddingBottom: "16px",
                    borderBottom: "1px solid #334155",
                }, children: [_jsx("h2", { style: { margin: 0, fontSize: "20px", fontWeight: 700, color: "#f1f5f9" }, children: "Development Department" }), _jsx("button", { onClick: () => setShowForm(true), style: {
                            padding: "8px 16px",
                            backgroundColor: "#6366f1",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 600,
                        }, children: "+ Create Project" })] }), showForm && (_jsxs("div", { style: {
                    padding: "16px",
                    backgroundColor: "#1e293b",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    border: "1px solid #334155",
                }, children: [_jsx("input", { type: "text", placeholder: "Project name...", value: newName, onChange: e => setNewName(e.target.value), style: {
                            width: "100%",
                            padding: "10px 12px",
                            backgroundColor: "#0f172a",
                            color: "#e2e8f0",
                            border: "1px solid #475569",
                            borderRadius: "6px",
                            fontSize: "14px",
                            marginBottom: "12px",
                            boxSizing: "border-box",
                        } }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx("button", { onClick: handleCreate, style: {
                                    padding: "8px 16px",
                                    backgroundColor: "#22c55e",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                }, children: "Create" }), _jsx("button", { onClick: () => setShowForm(false), style: {
                                    padding: "8px 16px",
                                    backgroundColor: "#374151",
                                    color: "#e2e8f0",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                }, children: "Cancel" })] })] })), projects.length === 0 && !showForm ? (_jsxs("div", { style: {
                    padding: "48px",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "16px",
                    backgroundColor: "#1e293b",
                    borderRadius: "12px",
                    border: "1px dashed #475569",
                }, children: [_jsx("div", { style: { fontSize: "48px", marginBottom: "16px" }, children: "\uD83D\uDCCB" }), _jsx("div", { style: { fontWeight: 600, marginBottom: "8px", color: "#cbd5e1" }, children: "No projects yet" }), _jsx("div", { children: "Click \"Create Project\" to start your first phased development initiative." })] })) : (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: projects.map(p => (_jsxs("div", { style: {
                        padding: "16px",
                        backgroundColor: "#1e293b",
                        borderRadius: "8px",
                        border: "1px solid #334155",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600, fontSize: "15px", color: "#f1f5f9" }, children: p.name }), _jsx("div", { style: { fontSize: "12px", color: "#64748b", marginTop: "4px" }, children: "0 phases" })] }), _jsx("span", { style: {
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: 600,
                                backgroundColor: "#374151",
                                color: "#94a3b8",
                            }, children: p.status })] }, p.id))) }))] }));
}
//# sourceMappingURL=index.js.map