import { DevProject, Phase, Spec, PRD, ConversationReference, ScopeType, BuildDispatch, BuildOutput, Review, RevisionEvent } from "./types";

export class StateStore {
  private projects: Map<string, DevProject> = new Map();
  private phases: Map<string, Phase> = new Map();
  private specs: Map<string, Spec> = new Map();
  private prds: Map<string, PRD> = new Map();
  private conversationRefs: Map<string, ConversationReference> = new Map();
  private buildDispatches: Map<string, BuildDispatch> = new Map();
  private buildOutputs: Map<string, BuildOutput> = new Map();
  private reviews: Map<string, Review> = new Map();
  private revisionEvents: Map<string, RevisionEvent> = new Map();

  // Projects

  createProject(data: Omit<DevProject, "id" | "createdAt" | "updatedAt">): DevProject {
    const now = new Date().toISOString();
    const project: DevProject = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
    this.projects.set(project.id, project);
    return project;
  }

  getProject(id: string): DevProject | null {
    return this.projects.get(id) ?? null;
  }

  updateProject(id: string, data: Partial<DevProject>): DevProject {
    const existing = this.getProject(id);
    if (!existing) throw new Error(`Project ${id} not found`);
    const updated: DevProject = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    this.projects.set(id, updated);
    return updated;
  }

  deleteProject(id: string): void {
    for (const phase of this.getPhasesByProject(id)) {
      this.deletePhase(phase.id);
    }
    this.projects.delete(id);
  }

  listProjects(): DevProject[] {
    return Array.from(this.projects.values());
  }

  // Phases

  createPhase(data: Omit<Phase, "id" | "createdAt" | "updatedAt">): Phase {
    const now = new Date().toISOString();
    const phase: Phase = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
    this.phases.set(phase.id, phase);
    return phase;
  }

  getPhase(id: string): Phase | null {
    return this.phases.get(id) ?? null;
  }

  getPhasesByProject(projectId: string): Phase[] {
    return Array.from(this.phases.values())
      .filter(p => p.projectId === projectId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  updatePhase(id: string, data: Partial<Phase>): Phase {
    const existing = this.getPhase(id);
    if (!existing) throw new Error(`Phase ${id} not found`);
    const updated: Phase = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    this.phases.set(id, updated);
    return updated;
  }

  deletePhase(id: string): void {
    const spec = this.getSpecByPhase(id);
    if (spec) this.specs.delete(spec.id);

    const prd = this.getPRDByPhase(id);
    if (prd) this.prds.delete(prd.id);

    for (const ref of this.getConversationRefsByPhase(id)) {
      this.conversationRefs.delete(ref.id);
    }

    this.phases.delete(id);
  }

  reorderPhases(projectId: string, phaseIds: string[]): void {
    const now = new Date().toISOString();
    phaseIds.forEach((id, index) => {
      const phase = this.getPhase(id);
      if (phase && phase.projectId === projectId) {
        this.phases.set(id, { ...phase, sortOrder: index, updatedAt: now });
      }
    });
  }

  // Specs

  createSpec(data: Omit<Spec, "id">): Spec {
    const spec: Spec = { id: crypto.randomUUID(), ...data };
    this.specs.set(spec.id, spec);
    return spec;
  }

  getSpecByPhase(phaseId: string): Spec | null {
    for (const spec of this.specs.values()) {
      if (spec.phaseId === phaseId) return spec;
    }
    return null;
  }

  updateSpec(id: string, data: Partial<Spec>): Spec {
    const existing = this.specs.get(id);
    if (!existing) throw new Error(`Spec ${id} not found`);
    const updated: Spec = { ...existing, ...data, id };
    this.specs.set(id, updated);
    return updated;
  }

  deleteSpec(id: string): void {
    this.specs.delete(id);
  }

  // PRDs

  createPRD(data: Omit<PRD, "id">): PRD {
    const prd: PRD = { id: crypto.randomUUID(), ...data };
    this.prds.set(prd.id, prd);
    return prd;
  }

  getPRDByPhase(phaseId: string): PRD | null {
    for (const prd of this.prds.values()) {
      if (prd.phaseId === phaseId) return prd;
    }
    return null;
  }

  updatePRD(id: string, data: Partial<PRD>): PRD {
    const existing = this.prds.get(id);
    if (!existing) throw new Error(`PRD ${id} not found`);
    const updated: PRD = { ...existing, ...data, id };
    this.prds.set(id, updated);
    return updated;
  }

  deletePRD(id: string): void {
    this.prds.delete(id);
  }

  // Conversation References

  createConversationRef(data: Omit<ConversationReference, "id">): ConversationReference {
    const ref: ConversationReference = { id: crypto.randomUUID(), ...data };
    this.conversationRefs.set(ref.id, ref);
    return ref;
  }

  getConversationRefs(scopeType: ScopeType, scopeId: string): ConversationReference[] {
    return Array.from(this.conversationRefs.values()).filter(
      r => r.scopeType === scopeType && r.scopeId === scopeId
    );
  }

  private getConversationRefsByPhase(phaseId: string): ConversationReference[] {
    return this.getConversationRefs("phase", phaseId);
  }

  updateConversationRef(id: string, data: Partial<ConversationReference>): ConversationReference {
    const existing = this.conversationRefs.get(id);
    if (!existing) throw new Error(`ConversationReference ${id} not found`);
    const updated: ConversationReference = { ...existing, ...data, id };
    this.conversationRefs.set(id, updated);
    return updated;
  }

  deleteConversationRef(id: string): void {
    this.conversationRefs.delete(id);
  }

  // Phase 2 entity stubs

  getBuildDispatchByPhase(phaseId: string): BuildDispatch | null {
    for (const dispatch of this.buildDispatches.values()) {
      if (dispatch.phaseId === phaseId) return dispatch;
    }
    return null;
  }

  getBuildOutputByPhase(phaseId: string): BuildOutput | null {
    for (const output of this.buildOutputs.values()) {
      if (output.phaseId === phaseId) return output;
    }
    return null;
  }

  getReviewByPhase(phaseId: string): Review | null {
    for (const review of this.reviews.values()) {
      if (review.phaseId === phaseId) return review;
    }
    return null;
  }

  getRevisionEventsByPhase(phaseId: string): RevisionEvent[] {
    return Array.from(this.revisionEvents.values()).filter(
      e => e.sourcePhaseId === phaseId || e.affectedPhaseIds.includes(phaseId)
    );
  }
}

export const store = new StateStore();
