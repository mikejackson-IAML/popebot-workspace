import { DevProject, Phase, Spec, PRD, ConversationReference, ScopeType, BuildDispatch, BuildOutput, Review, RevisionEvent, PhaseStatus, FreezeState } from "./types.js";
import { VALID_TRANSITIONS } from "./messages.js";

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
  private dirty = false;

  // Persistence

  serialize(): string {
    return JSON.stringify({
      projects: Object.fromEntries(this.projects),
      phases: Object.fromEntries(this.phases),
      specs: Object.fromEntries(this.specs),
      prds: Object.fromEntries(this.prds),
      conversationRefs: Object.fromEntries(this.conversationRefs),
      buildDispatches: Object.fromEntries(this.buildDispatches),
      buildOutputs: Object.fromEntries(this.buildOutputs),
      reviews: Object.fromEntries(this.reviews),
      revisionEvents: Object.fromEntries(this.revisionEvents),
    });
  }

  hydrate(json: string): void {
    const data = JSON.parse(json);
    if (data.projects) this.projects = new Map(Object.entries(data.projects));
    if (data.phases) this.phases = new Map(Object.entries(data.phases));
    if (data.specs) this.specs = new Map(Object.entries(data.specs));
    if (data.prds) this.prds = new Map(Object.entries(data.prds));
    if (data.conversationRefs) this.conversationRefs = new Map(Object.entries(data.conversationRefs));
    if (data.buildDispatches) this.buildDispatches = new Map(Object.entries(data.buildDispatches));
    if (data.buildOutputs) this.buildOutputs = new Map(Object.entries(data.buildOutputs));
    if (data.reviews) this.reviews = new Map(Object.entries(data.reviews));
    if (data.revisionEvents) this.revisionEvents = new Map(Object.entries(data.revisionEvents));
    this.dirty = false;
  }

  flush(): string { const s = this.serialize(); this.dirty = false; return s; }
  isDirty(): boolean { return this.dirty; }

  // Projects
  createProject(data: Omit<DevProject, "id" | "createdAt" | "updatedAt">): DevProject {
    const now = new Date().toISOString();
    const project: DevProject = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
    this.projects.set(project.id, project); this.dirty = true; return project;
  }
  getProject(id: string): DevProject | null { return this.projects.get(id) ?? null; }
  updateProject(id: string, data: Partial<DevProject>): DevProject {
    const existing = this.getProject(id);
    if (!existing) throw new Error(`Project ${id} not found`);
    const updated: DevProject = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    this.projects.set(id, updated); this.dirty = true; return updated;
  }
  deleteProject(id: string): void {
    for (const [refId, ref] of this.conversationRefs) {
      if (ref.scopeType === "project" && ref.scopeId === id) this.conversationRefs.delete(refId);
    }
    for (const phase of this.getPhasesByProject(id)) this.deletePhase(phase.id);
    this.projects.delete(id); this.dirty = true;
  }
  listProjects(): DevProject[] { return Array.from(this.projects.values()); }

  // Phases
  createPhase(data: Omit<Phase, "id" | "createdAt" | "updatedAt">): Phase {
    const now = new Date().toISOString();
    const phase: Phase = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
    this.phases.set(phase.id, phase); this.dirty = true; return phase;
  }
  getPhase(id: string): Phase | null { return this.phases.get(id) ?? null; }
  getPhasesByProject(projectId: string): Phase[] {
    return Array.from(this.phases.values()).filter(p => p.projectId === projectId).sort((a, b) => a.sortOrder - b.sortOrder);
  }
  updatePhase(id: string, data: Partial<Phase>): Phase {
    const existing = this.getPhase(id);
    if (!existing) throw new Error(`Phase ${id} not found`);
    // Freeze enforcement
    if (existing.freezeState === "Locked" && Object.keys(data).some(k => k !== "freezeState")) {
      throw new Error("Phase is locked. Only freeze state can be changed.");
    }
    // State machine enforcement
    if (data.status && data.status !== existing.status) {
      const allowed = VALID_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(data.status)) {
        throw new Error(`Invalid transition: ${existing.status} → ${data.status}`);
      }
    }
    const updated: Phase = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    this.phases.set(id, updated); this.dirty = true; return updated;
  }
  deletePhase(id: string): void {
    const spec = this.getSpecByPhase(id); if (spec) this.specs.delete(spec.id);
    const prd = this.getPRDByPhase(id); if (prd) this.prds.delete(prd.id);
    for (const [refId, ref] of this.conversationRefs) { if (ref.scopeType === "phase" && ref.scopeId === id) this.conversationRefs.delete(refId); }
    for (const [did, d] of this.buildDispatches) { if (d.phaseId === id) this.buildDispatches.delete(did); }
    for (const [oid, o] of this.buildOutputs) { if (o.phaseId === id) this.buildOutputs.delete(oid); }
    for (const [rid, r] of this.reviews) { if (r.phaseId === id) this.reviews.delete(rid); }
    for (const [eid, e] of this.revisionEvents) { if (e.sourcePhaseId === id) this.revisionEvents.delete(eid); }
    this.phases.delete(id); this.dirty = true;
  }
  reorderPhases(projectId: string, phaseIds: string[]): void {
    const now = new Date().toISOString();
    phaseIds.forEach((id, i) => { const p = this.getPhase(id); if (p && p.projectId === projectId) this.phases.set(id, { ...p, sortOrder: i, updatedAt: now }); });
    this.dirty = true;
  }

  // Specs
  createSpec(data: Omit<Spec, "id" | "createdAt" | "updatedAt">): Spec {
    const now = new Date().toISOString();
    const spec: Spec = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
    this.specs.set(spec.id, spec); this.dirty = true; return spec;
  }
  getSpecByPhase(phaseId: string): Spec | null { for (const s of this.specs.values()) { if (s.phaseId === phaseId) return s; } return null; }
  updateSpec(id: string, data: Partial<Spec>): Spec {
    const existing = this.specs.get(id); if (!existing) throw new Error(`Spec ${id} not found`);
    const updated: Spec = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    this.specs.set(id, updated); this.dirty = true; return updated;
  }
  deleteSpec(id: string): void { this.specs.delete(id); this.dirty = true; }

  // PRDs
  createPRD(data: Omit<PRD, "id" | "createdAt" | "updatedAt">): PRD {
    const now = new Date().toISOString();
    const prd: PRD = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
    this.prds.set(prd.id, prd); this.dirty = true; return prd;
  }
  getPRDByPhase(phaseId: string): PRD | null { for (const p of this.prds.values()) { if (p.phaseId === phaseId) return p; } return null; }
  updatePRD(id: string, data: Partial<PRD>): PRD {
    const existing = this.prds.get(id); if (!existing) throw new Error(`PRD ${id} not found`);
    const updated: PRD = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    this.prds.set(id, updated); this.dirty = true; return updated;
  }
  deletePRD(id: string): void { this.prds.delete(id); this.dirty = true; }

  // Conversation References
  createConversationRef(data: Omit<ConversationReference, "id">): ConversationReference {
    const ref: ConversationReference = { id: crypto.randomUUID(), ...data };
    this.conversationRefs.set(ref.id, ref); this.dirty = true; return ref;
  }
  getConversationRefs(scopeType: ScopeType, scopeId: string): ConversationReference[] {
    return Array.from(this.conversationRefs.values()).filter(r => r.scopeType === scopeType && r.scopeId === scopeId);
  }
  updateConversationRef(id: string, data: Partial<ConversationReference>): ConversationReference {
    const existing = this.conversationRefs.get(id); if (!existing) throw new Error(`Ref ${id} not found`);
    const updated: ConversationReference = { ...existing, ...data, id };
    this.conversationRefs.set(id, updated); this.dirty = true; return updated;
  }
  deleteConversationRef(id: string): void { this.conversationRefs.delete(id); this.dirty = true; }

  // Build Dispatch
  createBuildDispatch(data: Omit<BuildDispatch, "id" | "createdAt">): BuildDispatch {
    const dispatch: BuildDispatch = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
    this.buildDispatches.set(dispatch.id, dispatch); this.dirty = true; return dispatch;
  }
  getBuildDispatchByPhase(phaseId: string): BuildDispatch | null { for (const d of this.buildDispatches.values()) { if (d.phaseId === phaseId) return d; } return null; }
  updateBuildDispatch(id: string, data: Partial<BuildDispatch>): BuildDispatch {
    const existing = this.buildDispatches.get(id); if (!existing) throw new Error(`BuildDispatch ${id} not found`);
    const updated: BuildDispatch = { ...existing, ...data, id };
    this.buildDispatches.set(id, updated); this.dirty = true; return updated;
  }

  // Build Output
  createBuildOutput(data: Omit<BuildOutput, "id" | "createdAt">): BuildOutput {
    const output: BuildOutput = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
    this.buildOutputs.set(output.id, output); this.dirty = true; return output;
  }
  getBuildOutputByPhase(phaseId: string): BuildOutput | null { for (const o of this.buildOutputs.values()) { if (o.phaseId === phaseId) return o; } return null; }
  updateBuildOutput(id: string, data: Partial<BuildOutput>): BuildOutput {
    const existing = this.buildOutputs.get(id); if (!existing) throw new Error(`BuildOutput ${id} not found`);
    const updated: BuildOutput = { ...existing, ...data, id };
    this.buildOutputs.set(id, updated); this.dirty = true; return updated;
  }

  // Reviews
  createReview(data: Omit<Review, "id">): Review {
    const review: Review = { id: crypto.randomUUID(), ...data };
    this.reviews.set(review.id, review); this.dirty = true; return review;
  }
  getReviewByPhase(phaseId: string): Review | null { for (const r of this.reviews.values()) { if (r.phaseId === phaseId) return r; } return null; }
  updateReview(id: string, data: Partial<Review>): Review {
    const existing = this.reviews.get(id); if (!existing) throw new Error(`Review ${id} not found`);
    const updated: Review = { ...existing, ...data, id };
    this.reviews.set(id, updated); this.dirty = true; return updated;
  }

  // Revision Events
  createRevisionEvent(data: Omit<RevisionEvent, "id" | "createdAt">): RevisionEvent {
    const event: RevisionEvent = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
    this.revisionEvents.set(event.id, event); this.dirty = true; return event;
  }
  getRevisionEventsByPhase(phaseId: string): RevisionEvent[] {
    return Array.from(this.revisionEvents.values()).filter(e => e.sourcePhaseId === phaseId || e.affectedPhaseIds.includes(phaseId));
  }
}

export const store = new StateStore();
