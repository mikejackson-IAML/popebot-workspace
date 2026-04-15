import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { ConversationRefs } from "./ConversationRefs.js";
const PHASE_STATUS_OPTIONS = [
    { value: "DraftSpec", label: "Draft Spec" },
    { value: "SpecApproved", label: "Spec Approved" },
    { value: "PRDAttached", label: "PRD Attached" },
    { value: "ReadyForBuild", label: "Ready for Build" },
    { value: "Accepted", label: "Accepted" },
    { value: "ReworkRequired", label: "Rework Required" },
    { value: "Closed", label: "Closed" },
];
const FREEZE_STATE_OPTIONS = [
    { value: "Locked", label: "Locked" },
    { value: "FrozenDownstream", label: "Frozen Downstream" },
    { value: "EditableDownstream", label: "Editable Downstream" },
    { value: "DownstreamRevisionRequired", label: "Downstream Revision Required" },
];
const LABEL_STYLE = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "4px",
};
const INPUT_STYLE = {
    width: "100%",
    padding: "7px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#111827",
    backgroundColor: "#fff",
    boxSizing: "border-box",
};
const TEXTAREA_STYLE = {
    ...INPUT_STYLE,
    resize: "vertical",
    minHeight: "80px",
    lineHeight: "1.5",
};
const SELECT_STYLE = {
    ...INPUT_STYLE,
    cursor: "pointer",
};
const FIELD_STYLE = {
    marginBottom: "14px",
};
const SECTION_HEADING = {
    fontSize: "13px",
    fontWeight: 700,
    color: "#374151",
    margin: "20px 0 10px",
    paddingBottom: "4px",
    borderBottom: "1px solid #e5e7eb",
};
const READONLY_BLOCK = {
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    backgroundColor: "#f9fafb",
    fontSize: "13px",
    color: "#6b7280",
};
const GRAYED_BLOCK = {
    padding: "12px",
    border: "1px dashed #d1d5db",
    borderRadius: "6px",
    backgroundColor: "#f9fafb",
    fontSize: "13px",
    color: "#9ca3af",
    fontStyle: "italic",
};
const BTN_SECONDARY = {
    padding: "5px 12px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 500,
};
export default function PhaseDetail({ phase, spec, prd, conversationRefs, onSave, onCancel, onDelete, onAttachSpec, onAttachPRD, onAddConversationRef, onUpdateConversationRef, onDeleteConversationRef, }) {
    const [draft, setDraft] = useState({ ...phase });
    const [dirty, setDirty] = useState(false);
    const [showSpecForm, setShowSpecForm] = useState(false);
    const [showPRDForm, setShowPRDForm] = useState(false);
    const [specForm, setSpecForm] = useState({ title: "", sourceRef: "" });
    const [prdForm, setPrdForm] = useState({ title: "", sourceRef: "" });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    useEffect(() => {
        setDraft({ ...phase });
        setDirty(false);
    }, [phase.id]);
    function update(key, value) {
        setDraft((prev) => ({ ...prev, [key]: value }));
        setDirty(true);
    }
    function handleSave() {
        onSave({ ...draft, updatedAt: new Date().toISOString() });
        setDirty(false);
    }
    function handleAttachSpec() {
        onAttachSpec(specForm);
        setSpecForm({ title: "", sourceRef: "" });
        setShowSpecForm(false);
    }
    function handleAttachPRD() {
        onAttachPRD(prdForm);
        setPrdForm({ title: "", sourceRef: "" });
        setShowPRDForm(false);
    }
    function handleDeleteConfirmed() {
        setShowDeleteConfirm(false);
        onDelete?.();
    }
    return (_jsxs("div", { style: { fontFamily: "system-ui, sans-serif", padding: "16px" }, children: [_jsxs("div", { style: FIELD_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: "Phase Number" }), _jsx("div", { style: { ...READONLY_BLOCK, display: "inline-block", minWidth: "48px", textAlign: "center" }, children: phase.phaseNumber }), _jsx("div", { style: { marginTop: "4px", fontSize: "11px", color: "#9ca3af" }, children: "Ordering is controlled by Sort Order" })] }), _jsxs("div", { style: FIELD_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: "Title" }), _jsx("input", { type: "text", value: draft.title, onChange: (e) => update("title", e.target.value), placeholder: "Phase title", style: INPUT_STYLE })] }), _jsxs("div", { style: FIELD_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: "Objective" }), _jsx("input", { type: "text", value: draft.objective, onChange: (e) => update("objective", e.target.value), placeholder: "What this phase achieves", style: INPUT_STYLE })] }), _jsxs("div", { style: FIELD_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: "Description" }), _jsx("textarea", { value: draft.description, onChange: (e) => update("description", e.target.value), placeholder: "Detailed description of the phase scope and approach", style: TEXTAREA_STYLE })] }), _jsxs("div", { style: { display: "flex", gap: "12px", marginBottom: "14px" }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: LABEL_STYLE, children: "Status" }), _jsx("select", { value: draft.status, onChange: (e) => update("status", e.target.value), style: SELECT_STYLE, children: PHASE_STATUS_OPTIONS.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: LABEL_STYLE, children: "Freeze State" }), _jsx("select", { value: draft.freezeState, onChange: (e) => update("freezeState", e.target.value), style: SELECT_STYLE, children: FREEZE_STATE_OPTIONS.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] })] }), _jsxs("div", { style: FIELD_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: "Prerequisites" }), _jsx("textarea", { value: draft.prerequisites, onChange: (e) => update("prerequisites", e.target.value), placeholder: "What must be true or complete before this phase starts", style: TEXTAREA_STYLE })] }), _jsxs("div", { style: FIELD_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: "Success Criteria" }), _jsx("textarea", { value: draft.successCriteria, onChange: (e) => update("successCriteria", e.target.value), placeholder: "How we know this phase is done", style: TEXTAREA_STYLE })] }), _jsxs("div", { style: FIELD_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: "Risk Notes" }), _jsx("textarea", { value: draft.riskNotes, onChange: (e) => update("riskNotes", e.target.value), placeholder: "Known risks, mitigations, or open questions", style: TEXTAREA_STYLE })] }), _jsxs("div", { style: { display: "flex", gap: "8px", marginTop: "4px", alignItems: "center" }, children: [_jsx("button", { onClick: handleSave, disabled: !dirty, style: {
                            padding: "7px 18px",
                            backgroundColor: dirty ? "#2563eb" : "#93c5fd",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: dirty ? "pointer" : "default",
                            fontSize: "13px",
                            fontWeight: 500,
                        }, children: "Save" }), _jsx("button", { onClick: onCancel, style: {
                            padding: "7px 18px",
                            backgroundColor: "#f3f4f6",
                            color: "#374151",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 500,
                        }, children: "Cancel" }), onDelete && !showDeleteConfirm && (_jsx("button", { onClick: () => setShowDeleteConfirm(true), style: {
                            marginLeft: "auto",
                            padding: "7px 14px",
                            backgroundColor: "#fff",
                            color: "#dc2626",
                            border: "1px solid #fca5a5",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 500,
                        }, children: "Delete Phase" })), onDelete && showDeleteConfirm && (_jsxs("div", { style: { marginLeft: "auto", display: "flex", gap: "6px", alignItems: "center" }, children: [_jsx("span", { style: { fontSize: "13px", color: "#dc2626", fontWeight: 500 }, children: "Delete this phase?" }), _jsx("button", { onClick: handleDeleteConfirmed, style: {
                                    padding: "5px 12px",
                                    backgroundColor: "#dc2626",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                }, children: "Confirm" }), _jsx("button", { onClick: () => setShowDeleteConfirm(false), style: BTN_SECONDARY, children: "Cancel" })] }))] }), _jsxs("div", { style: { ...SECTION_HEADING, display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsx("span", { children: "Spec" }), !spec && !showSpecForm && (_jsx("button", { onClick: () => setShowSpecForm(true), style: BTN_SECONDARY, children: "+ Attach Spec" }))] }), showSpecForm && (_jsxs("div", { style: { marginBottom: "12px", padding: "12px", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "#f9fafb" }, children: [_jsxs("div", { style: FIELD_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: "Title" }), _jsx("input", { type: "text", value: specForm.title, onChange: (e) => setSpecForm((f) => ({ ...f, title: e.target.value })), placeholder: "Spec title", style: INPUT_STYLE })] }), _jsxs("div", { style: FIELD_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: "Source URL" }), _jsx("input", { type: "url", value: specForm.sourceRef, onChange: (e) => setSpecForm((f) => ({ ...f, sourceRef: e.target.value })), placeholder: "https://...", style: INPUT_STYLE })] }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx("button", { onClick: handleAttachSpec, disabled: !specForm.title.trim(), style: {
                                    padding: "5px 14px",
                                    backgroundColor: specForm.title.trim() ? "#2563eb" : "#93c5fd",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: specForm.title.trim() ? "pointer" : "default",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                }, children: "Save Spec" }), _jsx("button", { onClick: () => { setShowSpecForm(false); setSpecForm({ title: "", sourceRef: "" }); }, style: BTN_SECONDARY, children: "Cancel" })] })] })), spec ? (_jsxs("div", { style: READONLY_BLOCK, children: [_jsx("div", { style: { fontWeight: 600, color: "#111827", marginBottom: "4px" }, children: spec.title || "Untitled Spec" }), _jsxs("div", { style: { display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px" }, children: [_jsxs("span", { children: [_jsx("strong", { children: "Version:" }), " ", spec.version || "—"] }), _jsxs("span", { children: [_jsx("strong", { children: "Author:" }), " ", spec.author || "—"] }), _jsxs("span", { children: [_jsx("strong", { children: "Approval:" }), " ", spec.approvalState || "—"] })] }), spec.sourceRef && (_jsxs("div", { style: { marginTop: "6px", fontSize: "12px" }, children: [_jsx("strong", { children: "Source:" }), " ", _jsx("span", { style: { color: "#6b7280", wordBreak: "break-all" }, children: spec.sourceRef })] })), spec.notes && (_jsx("div", { style: { marginTop: "6px", fontSize: "12px", color: "#6b7280" }, children: spec.notes }))] })) : !showSpecForm ? (_jsx("div", { style: READONLY_BLOCK, children: "No spec attached to this phase." })) : null, _jsxs("div", { style: { ...SECTION_HEADING, display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsx("span", { children: "PRD" }), !prd && !showPRDForm && (_jsx("button", { onClick: () => setShowPRDForm(true), style: BTN_SECONDARY, children: "+ Attach PRD" }))] }), showPRDForm && (_jsxs("div", { style: { marginBottom: "12px", padding: "12px", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "#f9fafb" }, children: [_jsxs("div", { style: FIELD_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: "Title" }), _jsx("input", { type: "text", value: prdForm.title, onChange: (e) => setPrdForm((f) => ({ ...f, title: e.target.value })), placeholder: "PRD title", style: INPUT_STYLE })] }), _jsxs("div", { style: FIELD_STYLE, children: [_jsx("label", { style: LABEL_STYLE, children: "Source URL" }), _jsx("input", { type: "url", value: prdForm.sourceRef, onChange: (e) => setPrdForm((f) => ({ ...f, sourceRef: e.target.value })), placeholder: "https://...", style: INPUT_STYLE })] }), _jsxs("div", { style: { display: "flex", gap: "8px" }, children: [_jsx("button", { onClick: handleAttachPRD, disabled: !prdForm.title.trim(), style: {
                                    padding: "5px 14px",
                                    backgroundColor: prdForm.title.trim() ? "#2563eb" : "#93c5fd",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: prdForm.title.trim() ? "pointer" : "default",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                }, children: "Save PRD" }), _jsx("button", { onClick: () => { setShowPRDForm(false); setPrdForm({ title: "", sourceRef: "" }); }, style: BTN_SECONDARY, children: "Cancel" })] })] })), prd ? (_jsxs("div", { style: READONLY_BLOCK, children: [_jsx("div", { style: { fontWeight: 600, color: "#111827", marginBottom: "4px" }, children: prd.title || "Untitled PRD" }), _jsxs("div", { style: { display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px" }, children: [_jsxs("span", { children: [_jsx("strong", { children: "Version:" }), " ", prd.version || "—"] }), _jsxs("span", { children: [_jsx("strong", { children: "Approval:" }), " ", prd.approvalState || "—"] })] }), prd.sourceRef && (_jsxs("div", { style: { marginTop: "6px", fontSize: "12px" }, children: [_jsx("strong", { children: "Source:" }), " ", _jsx("span", { style: { color: "#6b7280", wordBreak: "break-all" }, children: prd.sourceRef })] })), prd.deviationNotes && (_jsxs("div", { style: { marginTop: "6px", fontSize: "12px" }, children: [_jsx("strong", { children: "Deviation Notes:" }), " ", _jsx("span", { style: { color: "#6b7280" }, children: prd.deviationNotes })] })), prd.notes && (_jsx("div", { style: { marginTop: "6px", fontSize: "12px", color: "#6b7280" }, children: prd.notes }))] })) : !showPRDForm ? (_jsx("div", { style: READONLY_BLOCK, children: "No PRD attached to this phase." })) : null, _jsx("div", { style: SECTION_HEADING, children: "Conversation References" }), _jsx(ConversationRefs, { references: conversationRefs, scopeType: "phase", scopeId: phase.id, onAdd: onAddConversationRef, onUpdate: onUpdateConversationRef, onDelete: onDeleteConversationRef }), _jsx("div", { style: SECTION_HEADING, children: "Build Output" }), _jsx("div", { style: GRAYED_BLOCK, children: "Build output will appear here once a build has been dispatched." }), _jsx("div", { style: SECTION_HEADING, children: "Review" }), _jsx("div", { style: GRAYED_BLOCK, children: "Review decision will appear here after a review is completed." }), _jsx("div", { style: SECTION_HEADING, children: "Revision Events" }), _jsx("div", { style: { ...GRAYED_BLOCK, marginBottom: "8px" }, children: "Revision events affecting this phase will appear here." })] }));
}
//# sourceMappingURL=PhaseDetail.js.map