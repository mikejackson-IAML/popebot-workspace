import { useState } from "react";

export function DepartmentSidebar({ context }: any) {
  return (
    <div style={{ padding: "12px", color: "#22d3ee" }}>
      <strong>Dev Department</strong>
    </div>
  );
}

export function PhasesTab({ context }: any) {
  const [projects, setProjects] = useState<Array<{id: string; name: string; status: string}>>([]);
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

  return (
    <div style={{
      padding: "24px",
      color: "#e2e8f0",
      fontFamily: "system-ui, sans-serif",
      minHeight: "500px",
      backgroundColor: "rgba(15, 23, 42, 0.5)",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        paddingBottom: "16px",
        borderBottom: "1px solid #334155",
      }}>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#f1f5f9" }}>
          Development Department
        </h2>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          + Create Project
        </button>
      </div>

      {showForm && (
        <div style={{
          padding: "16px",
          backgroundColor: "#1e293b",
          borderRadius: "8px",
          marginBottom: "16px",
          border: "1px solid #334155",
        }}>
          <input
            type="text"
            placeholder="Project name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              backgroundColor: "#0f172a",
              color: "#e2e8f0",
              border: "1px solid #475569",
              borderRadius: "6px",
              fontSize: "14px",
              marginBottom: "12px",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleCreate}
              style={{
                padding: "8px 16px",
                backgroundColor: "#22c55e",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#374151",
                color: "#e2e8f0",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {projects.length === 0 && !showForm ? (
        <div style={{
          padding: "48px",
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "16px",
          backgroundColor: "#1e293b",
          borderRadius: "12px",
          border: "1px dashed #475569",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
          <div style={{ fontWeight: 600, marginBottom: "8px", color: "#cbd5e1" }}>No projects yet</div>
          <div>Click "Create Project" to start your first phased development initiative.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {projects.map(p => (
            <div
              key={p.id}
              style={{
                padding: "16px",
                backgroundColor: "#1e293b",
                borderRadius: "8px",
                border: "1px solid #334155",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "15px", color: "#f1f5f9" }}>{p.name}</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>0 phases</div>
              </div>
              <span style={{
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: "#374151",
                color: "#94a3b8",
              }}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
