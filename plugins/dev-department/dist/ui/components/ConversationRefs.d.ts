import { ConversationReference, ScopeType } from "../../worker/types.js";
interface Props {
    references: ConversationReference[];
    scopeType: ScopeType;
    scopeId: string;
    onAdd: (ref: Omit<ConversationReference, "id">) => void;
    onUpdate: (id: string, updates: Partial<ConversationReference>) => void;
    onDelete: (id: string) => void;
}
export declare function ConversationRefs({ references, scopeType, scopeId, onAdd, onUpdate, onDelete }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ConversationRefs.d.ts.map