import type { Phase, Spec, PRD, ConversationReference } from "../../worker/types.js";
interface PhaseDetailProps {
    phase: Phase;
    spec: Spec | null;
    prd: PRD | null;
    conversationRefs: ConversationReference[];
    onSave: (updates: Partial<Phase>) => void;
    onCancel: () => void;
    onDelete?: () => void;
    onAttachSpec: (data: {
        title: string;
        sourceRef: string;
    }) => void;
    onAttachPRD: (data: {
        title: string;
        sourceRef: string;
    }) => void;
    onAddConversationRef: (ref: Omit<ConversationReference, "id">) => void;
    onUpdateConversationRef: (id: string, updates: Partial<ConversationReference>) => void;
    onDeleteConversationRef: (id: string) => void;
}
export default function PhaseDetail({ phase, spec, prd, conversationRefs, onSave, onCancel, onDelete, onAttachSpec, onAttachPRD, onAddConversationRef, onUpdateConversationRef, onDeleteConversationRef, }: PhaseDetailProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=PhaseDetail.d.ts.map