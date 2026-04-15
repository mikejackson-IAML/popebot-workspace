import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import DepartmentView from './components/DepartmentView';
// projectSidebarItem slot — compact view showing active project summary
export function DepartmentSidebar() {
    return (_jsxs("div", { style: { padding: '8px', fontSize: '14px' }, children: [_jsx("div", { style: { fontWeight: 'bold', marginBottom: '8px' }, children: "Dev Department" }), _jsx("div", { style: { color: '#666', fontSize: '12px' }, children: "Click Phases tab for full view" })] }));
}
// detailTab slot — full department view with project management
export function PhasesTab() {
    return _jsx(DepartmentView, {});
}
//# sourceMappingURL=index.js.map