import type { Phase } from "../../worker/types.js";
interface PhaseListProps {
    phases: Phase[];
    selectedPhaseId?: string | null;
    onSelect: (phase: Phase) => void;
    onAdd: () => void;
    onDelete: (phaseId: string) => void;
    onReorder: (phaseId: string, direction: "up" | "down") => void;
    /** Map of phaseId → has spec */
    hasSpec?: Record<string, boolean>;
    /** Map of phaseId → has PRD */
    hasPRD?: Record<string, boolean>;
}
export default function PhaseList({ phases, selectedPhaseId, onSelect, onAdd, onDelete, onReorder, hasSpec, hasPRD, }: PhaseListProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=PhaseList.d.ts.map