import * as types from "./types";
import { DevProject, Phase, Spec, PRD, ConversationReference, ScopeType } from "./types";

export class StateStore {
  private store: Map<string, any> = new Map();

  generateId(): string {
    return crypto.randomUUID();
  }

  createProject(data: Omit<DevProject, "id" | "createdAt" | "updatedAt">): DevProject {
    const now = new Date().toISOString();
    const project: DevProject = { id: this.generateId(), ...data, createdAt: now, updatedAt: now };
    this.store.set(`project:${project.id}`, project);
    return project;
  }

  getProject(id: string): DevProject | null {
    return this.store.get(`project:${id}`) ?? null;
  }

  updateProject(id: string, data: Partial<DevProject>): DevProject {
    const existing = this.getProject(id);
    if (!existing) throw new Error(`Project ${id} not found`);
    const updated: DevProject = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    this.store.set(`project:${id}`, updated);
    return updated;
  }

  deleteProject(id: string): void {
    this.store.delete(`project:${id}`);
  }

  listProjects(): DevProject[] {
    const projects: DevProject[] = [];
    for (const [key, val] of this.store) {
      if (key.startsWith("project:")) projects.push(val);
    }
    return projects;
  }

  createPhase(data: Omit<Phase, "id" | "createdAt" | "updatedAt">): Phase {
    const now = new Date().toISOString();
    const phase: Phase = { id: this.generateId(), ...data, createdAt: now, updatedAt: now };
    this.store.set(`phase:${phase.id}`, phase);
    return phase;
  }

  getPhase(id: string): Phase | null {
    return this.store.get(`phase:${id}`) ?? null;
  }

  getPhasesByProject(projectId: string): Phase[] {
    const phases: Phase[] = [];
    for (const [key, val] of this.store) {
      if (key.startsWith("phase:") && val.projectId === projectId) phases.push(val);
    }
    return phases.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  updatePhase(id: string, data: Partial<Phase>): Phase {
    const existing = this.getPhase(id);
    if (!existing) throw new Error(`Phase ${id} not found`);
    const updated: Phase = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    this.store.set(`phase:${id}`, updated);
    return updated;
  }

  deletePhase(id: string): void {
    this.store.delete(`phase:${id}`);
  }

  reorderPhases(projectId: string, phaseIds: string[]): void {
    phaseIds.forEach((id, index) => {
      const phase = this.getPhase(id);
      if (phase && phase.projectId === projectId) {
        this.store.set(`phase:${id}`, { ...phase, sortOrder: index, updatedAt: new Date().toISOString() });
      }
    });
  }

  createSpec(data: Omit<Spec, "id">): Spec {
    const spec: Spec = { id: this.generateId(), ...data };
    this.store.set(`spec:${spec.id}`, spec);
    return spec;
  }

  getSpecByPhase(phaseId: string): Spec | null {
    for (const [key, val] of this.store) {
      if (key.startsWith("spec:") && val.phaseId === phaseId) return val;
    }
    return null;
  }

  updateSpec(id: string, data: Partial<Spec>): Spec {
    const existing = this.store.get(`spec:${id}`);
    if (!existing) throw new Error(`Spec ${id} not found`);
    const updated: Spec = { ...existing, ...data, id };
    this.store.set(`spec:${id}`, updated);
    return updated;
  }

  createPRD(data: Omit<PRD, "id">): PRD {
    const prd: PRD = { id: this.generateId(), ...data };
    this.store.set(`prd:${prd.id}`, prd);
    return prd;
  }

  getPRDByPhase(phaseId: string): PRD | null {
    for (const [key, val] of this.store) {
      if (key.startsWith("prd:") && val.phaseId === phaseId) return val;
    }
    return null;
  }

  updatePRD(id: string, data: Partial<PRD>): PRD {
    const existing = this.store.get(`prd:${id}`);
    if (!existing) throw new Error(`PRD ${id} not found`);
    const updated: PRD = { ...existing, ...data, id };
    this.store.set(`prd:${id}`, updated);
    return updated;
  }

  createConversationRef(data: Omit<ConversationReference, "id">): ConversationReference {
    const ref: ConversationReference = { id: this.generateId(), ...data };
    this.store.set(`convref:${ref.id}`, ref);
    return ref;
  }

  getConversationRefs(scopeType: ScopeType, scopeId: string): ConversationReference[] {
    const refs: ConversationReference[] = [];
    for (const [key, val] of this.store) {
      if (key.startsWith("convref:") && val.scopeType === scopeType && val.scopeId === scopeId) refs.push(val);
    }
    return refs;
  }

  updateConversationRef(id: string, data: Partial<ConversationReference>): ConversationReference {
    const existing = this.store.get(`convref:${id}`);
    if (!existing) throw new Error(`ConversationReference ${id} not found`);
    const updated: ConversationReference = { ...existing, ...data, id };
    this.store.set(`convref:${id}`, updated);
    return updated;
  }

  deleteConversationRef(id: string): void {
    this.store.delete(`convref:${id}`);
  }
}

export const stateStore = new StateStore();
