import type { DevProject, Phase } from "../../worker/types.js";
interface ProjectHeaderProps {
    project: DevProject;
    phases: Phase[];
    onSave: (updates: Partial<DevProject>) => void;
    onCancel: () => void;
}
export default function ProjectHeader({ project, phases, onSave, onCancel }: ProjectHeaderProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ProjectHeader.d.ts.map