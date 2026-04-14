import React, { useState } from "react";
import { ConversationReference } from "../../worker/types";

type ConversationSystem = "Claude" | "ChatGPT" | "Other";
type ConversationRole = "planning" | "prd" | "architecture" | "review" | "revision";

interface Props {
  references: ConversationReference[];
  scopeType: string;
  scopeId: string;
  onAdd: (ref: Omit<ConversationReference, "id">) => void;
  onUpdate: (id: string, updates: Partial<ConversationReference>) => void;
  onDelete: (id: string) => void;
}

const SYSTEM_COLORS: Record<ConversationSystem, { bg: string; text: string }> = {
  Claude: { bg: "#ede9fe", text: "#6d28d9" },
  ChatGPT: { bg: "#d1fae5", text: "#065f46" },
  Other: { bg: "#f3f4f6", text: "#374151" },
};

const ROLE_LABELS: Record<ConversationRole, string> = {
  planning: "Planning",
  prd: "PRD",
  architecture: "Architecture",
  review: "Review",
  revision: "Revision",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "4px",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "13px",
  boxSizing: "border-box",
};

const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  background: "#fff",
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  minHeight: "64px",
  resize: "vertical",
};

const FIELD_STYLE: React.CSSProperties = {
  marginBottom: "10px",
};

const emptyForm = {
  url: "",
  system: "Claude" as ConversationSystem,
  role: "planning" as ConversationRole,
  authoritative: false,
  notes: "",
};

function RoleBadge({ role }: { role: ConversationRole }) {
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 7px",
        borderRadius: "10px",
        background: "#e0f2fe",
        color: "#0369a1",
      }}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

function SystemBadge({ system }: { system: ConversationSystem }) {
  const colors = SYSTEM_COLORS[system] ?? SYSTEM_COLORS.Other;
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 7px",
        borderRadius: "10px",
        background: colors.bg,
        color: colors.text,
      }}
    >
      {system}
    </span>
  );
}

interface EditingState {
  url: string;
  system: ConversationSystem;
  role: ConversationRole;
  authoritative: boolean;
  notes: string;
}

function RefRow({
  ref: r,
  onUpdate,
  onDelete,
}: {
  ref: ConversationReference;
  onUpdate: (id: string, updates: Partial<ConversationReference>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditingState>({
    url: r.url,
    system: r.system as ConversationSystem,
    role: r.role as ConversationRole,
    authoritative: r.authoritative,
    notes: r.notes,
  });

  function handleSave() {
    onUpdate(r.id, form);
    setEditing(false);
  }

  function handleCancel() {
    setForm({
      url: r.url,
      system: r.system as ConversationSystem,
      role: r.role as ConversationRole,
      authoritative: r.authoritative,
      notes: r.notes,
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <div
        style={{
          padding: "12px",
          border: "1px solid #93c5fd",
          borderRadius: "8px",
          background: "#eff6ff",
          marginBottom: "8px",
        }}
      >
        <div style={FIELD_STYLE}>
          <label style={LABEL_STYLE}>URL</label>
          <input
            style={INPUT_STYLE}
            type="url"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          />
        </div>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <div style={{ flex: 1 }}>
            <label style={LABEL_STYLE}>System</label>
            <select
              style={SELECT_STYLE}
              value={form.system}
              onChange={(e) =>
                setForm((f) => ({ ...f, system: e.target.value as ConversationSystem }))
              }
            >
              <option value="Claude">Claude</option>
              <option value="ChatGPT">ChatGPT</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={LABEL_STYLE}>Role</label>
            <select
              style={SELECT_STYLE}
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as ConversationRole }))
              }
            >
              {(Object.keys(ROLE_LABELS) as ConversationRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={FIELD_STYLE}>
          <label style={LABEL_STYLE}>Notes</label>
          <textarea
            style={TEXTAREA_STYLE}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <input
            id={`auth-edit-${r.id}`}
            type="checkbox"
            checked={form.authoritative}
            onChange={(e) => setForm((f) => ({ ...f, authoritative: e.target.checked }))}
          />
          <label htmlFor={`auth-edit-${r.id}`} style={{ fontSize: "13px", color: "#374151" }}>
            Authoritative source
          </label>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleSave}
            style={{
              padding: "6px 14px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            style={{
              padding: "6px 14px",
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "10px 12px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        background: "#fff",
        marginBottom: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <SystemBadge system={r.system as ConversationSystem} />
        <RoleBadge role={r.role as ConversationRole} />
        <a
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "13px",
            color: "#2563eb",
            textDecoration: "none",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={r.url}
        >
          {r.url}
        </a>
        {r.authoritative && (
          <span title="Authoritative source" style={{ fontSize: "15px", lineHeight: 1 }}>
            ⭐
          </span>
        )}
        <button
          onClick={() => setEditing(true)}
          style={{
            padding: "3px 10px",
            fontSize: "12px",
            border: "1px solid #d1d5db",
            borderRadius: "5px",
            background: "#f9fafb",
            cursor: "pointer",
            color: "#374151",
          }}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(r.id)}
          style={{
            padding: "3px 10px",
            fontSize: "12px",
            border: "1px solid #fca5a5",
            borderRadius: "5px",
            background: "#fff1f2",
            cursor: "pointer",
            color: "#dc2626",
          }}
        >
          Delete
        </button>
      </div>
      {r.notes && (
        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
            color: "#6b7280",
            paddingLeft: "2px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={r.notes}
        >
          {r.notes}
        </div>
      )}
    </div>
  );
}

export function ConversationRefs({ references, scopeType, scopeId, onAdd, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  function handleAdd() {
    if (!form.url.trim()) return;
    onAdd({
      scopeType: scopeType as ConversationReference["scopeType"],
      scopeId,
      system: form.system,
      role: form.role,
      url: form.url.trim(),
      status: "active",
      authoritative: form.authoritative,
      notes: form.notes,
    });
    setForm({ ...emptyForm });
    setShowForm(false);
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>
          Conversation References
        </span>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: "5px 12px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add
          </button>
        )}
      </div>

      {showForm && (
        <div
          style={{
            padding: "12px",
            border: "1px solid #93c5fd",
            borderRadius: "8px",
            background: "#eff6ff",
            marginBottom: "12px",
          }}
        >
          <div style={FIELD_STYLE}>
            <label style={LABEL_STYLE}>URL</label>
            <input
              style={INPUT_STYLE}
              type="url"
              placeholder="https://..."
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />
          </div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <div style={{ flex: 1 }}>
              <label style={LABEL_STYLE}>System</label>
              <select
                style={SELECT_STYLE}
                value={form.system}
                onChange={(e) =>
                  setForm((f) => ({ ...f, system: e.target.value as ConversationSystem }))
                }
              >
                <option value="Claude">Claude</option>
                <option value="ChatGPT">ChatGPT</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={LABEL_STYLE}>Role</label>
              <select
                style={SELECT_STYLE}
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as ConversationRole }))
                }
              >
                {(Object.keys(ROLE_LABELS) as ConversationRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={FIELD_STYLE}>
            <label style={LABEL_STYLE}>Notes</label>
            <textarea
              style={TEXTAREA_STYLE}
              placeholder="Optional notes..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <input
              id="auth-add"
              type="checkbox"
              checked={form.authoritative}
              onChange={(e) => setForm((f) => ({ ...f, authoritative: e.target.checked }))}
            />
            <label htmlFor="auth-add" style={{ fontSize: "13px", color: "#374151" }}>
              Authoritative source
            </label>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleAdd}
              disabled={!form.url.trim()}
              style={{
                padding: "6px 14px",
                background: form.url.trim() ? "#2563eb" : "#93c5fd",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: form.url.trim() ? "pointer" : "not-allowed",
              }}
            >
              Add Reference
            </button>
            <button
              onClick={() => {
                setForm({ ...emptyForm });
                setShowForm(false);
              }}
              style={{
                padding: "6px 14px",
                background: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {references.length === 0 && !showForm && (
        <div style={{ fontSize: "13px", color: "#9ca3af", padding: "8px 0" }}>
          No conversation references yet.
        </div>
      )}

      {references.map((r) => (
        <RefRow key={r.id} ref={r} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
}
