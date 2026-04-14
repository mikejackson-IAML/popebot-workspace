import React from 'react';
import { DepartmentView } from './components/DepartmentView';

// projectSidebarItem slot — compact view showing active project summary
export function DepartmentSidebar() {
  return (
    <div style={{ padding: '8px', fontSize: '14px' }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Dev Department</div>
      <div style={{ color: '#666', fontSize: '12px' }}>Click Phases tab for full view</div>
    </div>
  );
}

// detailTab slot — full department view with project management
export function PhasesTab() {
  return <DepartmentView />;
}
