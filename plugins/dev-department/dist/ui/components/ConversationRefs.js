import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
const SYSTEM_COLORS = {
    Claude: { bg: "#ede9fe", text: "#6d28d9" },
    ChatGPT: { bg: "#d1fae5", text: "#065f46" },
    Other: { bg: "#f3f4f6", text: "#374151" },
};
const ROLE_LABELS = {
    planning: "Planning",
    prd: "PRD",
    architecture: "Architecture",
    review: "Review",
    revision: "Revision",
};
const LABEL_STYLE = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "#cbd5e1",
    marginBottom: "4px",
};
const INPUT_STYLE = {
    width: "100%",
    padding: "6px 10px",
    border: "1px solid #374151",
    borderRadius: "6px",
    fontSize: "13px",
    boxSizing: "border-box",
};
const SELECT_STYLE = {
    ...INPUT_STYLE,
    background: "#1e293b",
};
const TEXTAREA_STYLE = {
    ...INPUT_STYLE,
    minHeight: "64px",
    resize: "vertical",
};
const FIELD_STYLE = {
    marginBottom: "10px",
};
const emptyForm = {
    url: "",
    system: "Claude",
    role: "planning",
    authoritative: false,
    notes: "",
};
function RoleBadge({ role }) {
    return (_jsx("span", { style: {
            fontSize: "11px",
            fontWeight: 600,
            padding: "2px 7px",
            borderRadius: "10px",
            background: "#e0f2fe",
            color: "#0369a1",
        }, children: ROLE_LABELS[role] }));
}
function SystemBadge({ system }) {
    const colors = SYSTEM_COLORS[system] ?? SYSTEM_COLORS.Other;
    return (_jsx("span", { style: {
            fontSize: "11px",
            fontWeight: 600,
            padding: "2px 7px",
            borderRadius: "10px",
            background: colors.bg,
            color: colors.text,
        }, children: system }));
}
function RefRow({ conversationRef: r, onUpdate, onDelete, }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        url: r.url,
        system: r.system,
        role: r.role,
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
            system: r.system,
            role: r.role,
            authoritative: r.authoritative,
            notes: r.notes,
        });
        setEditing(false);
    }
    if (editing) {
        return (_jsxs("div", { style: {
                padding: "12px",
                border: "1px solid #93c5fd",
                borderRadius: "8px",
                background: "#eff6ff",
                marginBottom: "8px",
            }, children: [_jsxs("div", { style: FIELD_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: "URL" }), _jsx("input", { style: INPUT_STYLE, type: "url", value: form.url, onChange: (e) => setForm((f) => ({ ...f, url: e.target.value })) })] }), _jsxs("div", { style: { display: "flex", gap: "10px", marginBottom: "10px" }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: LABEL_STYLE, children: "System" }), _jsxs("select", { style: SELECT_STYLE, value: form.system, onChange: (e) => setForm((f) => ({ ...f, system: e.target.value })), children: [_jsx("option", { value: "Claude", children: "Claude" }), _jsx("option", { value: "ChatGPT", children: "ChatGPT" }), _jsx("option", { value: "Other", children: "Other" })] })] }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: LABEL_STYLE, children: "Role" }), _jsx("select", { style: SELECT_STYLE, value: form.role, onChange: (e) => setForm((f) => ({ ...f, role: e.target.value })), children: Object.keys(ROLE_LABELS).map((r) => (_jsx("option", { value: r, children: ROLE_LABELS[r] }, r))) })] })] }), _jsxs("div", { style: FIELD_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: "Notes" }), _jsx("textarea", { style: TEXTAREA_STYLE, value: form.notes, onChange: (e) => setForm((f) => ({ ...f, notes: e.target.value })) })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }, children: [_jsx("input", { id: `auth-edit-${r.id}`, type: "checkbox", checked: form.authoritative, onChange: (e) => setForm((f) => ({ ...f, authoritative: e.target.checked })) }), _jsx("label", { htmlFor: `auth-edit-${r.id}`, style: { fontSize: "13px", color: "#cbd5e1" }, children: "Authoritative source" })] }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx("button", { onClick: handleSave, style: {
                                padding: "6px 14px",
                                background: "#2563eb",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "13px",
                                cursor: "pointer",
                                fontWeight: 600,
                            }, children: "Save" }), _jsx("button", { onClick: handleCancel, style: {
                                padding: "6px 14px",
                                background: "#f3f4f6",
                                color: "#cbd5e1",
                                border: "1px solid #374151",
                                borderRadius: "6px",
                                fontSize: "13px",
                                cursor: "pointer",
                            }, children: "Cancel" })] })] }));
    }
    return (_jsxs("div", { style: {
            padding: "10px 12px",
            border: "1px solid #374151",
            borderRadius: "8px",
            background: "#1e293b",
            marginBottom: "8px",
        }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }, children: [_jsx(SystemBadge, { system: r.system }), _jsx(RoleBadge, { role: r.role }), _jsx("a", { href: r.url, target: "_blank", rel: "noopener noreferrer", style: {
                            fontSize: "13px",
                            color: "#2563eb",
                            textDecoration: "none",
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }, title: r.url, children: r.url }), r.authoritative && (_jsx("span", { title: "Authoritative source", style: { fontSize: "15px", lineHeight: 1 }, children: "\u2B50" })), _jsx("button", { onClick: () => setEditing(true), style: {
                            padding: "3px 10px",
                            fontSize: "12px",
                            border: "1px solid #374151",
                            borderRadius: "5px",
                            background: "#f9fafb",
                            cursor: "pointer",
                            color: "#cbd5e1",
                        }, children: "Edit" }), _jsx("button", { onClick: () => onDelete(r.id), style: {
                            padding: "3px 10px",
                            fontSize: "12px",
                            border: "1px solid #fca5a5",
                            borderRadius: "5px",
                            background: "#fff1f2",
                            cursor: "pointer",
                            color: "#dc2626",
                        }, children: "Delete" })] }), r.notes && (_jsx("div", { style: {
                    marginTop: "6px",
                    fontSize: "12px",
                    color: "#94a3b8",
                    paddingLeft: "2px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }, title: r.notes, children: r.notes }))] }));
}
export function ConversationRefs({ references, scopeType, scopeId, onAdd, onUpdate, onDelete }) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ ...emptyForm });
    function handleAdd() {
        const trimmedUrl = form.url.trim();
        if (!trimmedUrl)
            return;
        if (!trimmedUrl.startsWith("https://") && !trimmedUrl.startsWith("http://"))
            return;
        onAdd({
            scopeType,
            scopeId,
            system: form.system,
            role: form.role,
            url: trimmedUrl,
            status: "active",
            authoritative: form.authoritative,
            notes: form.notes,
        });
        setForm({ ...emptyForm });
        setShowForm(false);
    }
    return (_jsxs("div", { children: [_jsxs("div", { style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                }, children: [_jsx("span", { style: { fontSize: "14px", fontWeight: 700, color: "#e2e8f0" }, children: "Conversation References" }), !showForm && (_jsx("button", { onClick: () => setShowForm(true), style: {
                            padding: "5px 12px",
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                        }, children: "+ Add" }))] }), showForm && (_jsxs("div", { style: {
                    padding: "12px",
                    border: "1px solid #93c5fd",
                    borderRadius: "8px",
                    background: "#eff6ff",
                    marginBottom: "12px",
                }, children: [_jsxs("div", { style: FIELD_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: "URL" }), _jsx("input", { style: INPUT_STYLE, type: "url", placeholder: "https://...", value: form.url, onChange: (e) => setForm((f) => ({ ...f, url: e.target.value })) })] }), _jsxs("div", { style: { display: "flex", gap: "10px", marginBottom: "10px" }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: LABEL_STYLE, children: "System" }), _jsxs("select", { style: SELECT_STYLE, value: form.system, onChange: (e) => setForm((f) => ({ ...f, system: e.target.value })), children: [_jsx("option", { value: "Claude", children: "Claude" }), _jsx("option", { value: "ChatGPT", children: "ChatGPT" }), _jsx("option", { value: "Other", children: "Other" })] })] }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: LABEL_STYLE, children: "Role" }), _jsx("select", { style: SELECT_STYLE, value: form.role, onChange: (e) => setForm((f) => ({ ...f, role: e.target.value })), children: Object.keys(ROLE_LABELS).map((r) => (_jsx("option", { value: r, children: ROLE_LABELS[r] }, r))) })] })] }), _jsxs("div", { style: FIELD_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: "Notes" }), _jsx("textarea", { style: TEXTAREA_STYLE, placeholder: "Optional notes...", value: form.notes, onChange: (e) => setForm((f) => ({ ...f, notes: e.target.value })) })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }, children: [_jsx("input", { id: `auth-add-${scopeId}`, type: "checkbox", checked: form.authoritative, onChange: (e) => setForm((f) => ({ ...f, authoritative: e.target.checked })) }), _jsx("label", { htmlFor: `auth-add-${scopeId}`, style: { fontSize: "13px", color: "#cbd5e1" }, children: "Authoritative source" })] }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx("button", { onClick: handleAdd, disabled: !form.url.trim(), style: {
                                    padding: "6px 14px",
                                    background: form.url.trim() ? "#2563eb" : "#93c5fd",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: form.url.trim() ? "pointer" : "not-allowed",
                                }, children: "Add Reference" }), _jsx("button", { onClick: () => {
                                    setForm({ ...emptyForm });
                                    setShowForm(false);
                                }, style: {
                                    padding: "6px 14px",
                                    background: "#f3f4f6",
                                    color: "#cbd5e1",
                                    border: "1px solid #374151",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                }, children: "Cancel" })] })] })), references.length === 0 && !showForm && (_jsx("div", { style: { fontSize: "13px", color: "#94a3b8", padding: "8px 0" }, children: "No conversation references yet." })), references.map((r) => (_jsx(RefRow, { conversationRef: r, onUpdate: onUpdate, onDelete: onDelete }, r.id)))] }));
}
//# sourceMappingURL=ConversationRefs.js.map