export type ProjectStatus = "Draft" | "Active" | "Blocked" | "Archived";
export type PhaseStatus = "DraftSpec" | "SpecApproved" | "PRDAttached" | "ReadyForBuild" | "Accepted" | "ReworkRequired" | "Closed";
export type FreezeState = "Locked" | "FrozenDownstream" | "EditableDownstream" | "DownstreamRevisionRequired";
export type ConversationSystem = "Claude" | "ChatGPT" | "Other";
export type ConversationRole = "planning" | "prd" | "architecture" | "review" | "revision";
export type ConversationStatus = "active" | "reference" | "archived";
export type ScopeType = "project" | "phase";

export interface DevProject { id: string; name: string; objective: string; owner: string; status: ProjectStatus; activePhaseId: string | null; roadmapSummary: string; createdAt: string; updatedAt: string; }
export interface Phase { id: string; projectId: string; phaseNumber: number; title: string; objective: string; description: string; status: PhaseStatus; prerequisites: string; successCriteria: string; riskNotes: string; freezeState: FreezeState; sortOrder: number; createdAt: string; updatedAt: string; }
export interface Spec { id: string; phaseId: string; title: string; sourceRef: string; version: string; author: string; approvalState: string; notes: string; }
export interface PRD { id: string; phaseId: string; title: string; sourceRef: string; version: string; approvalState: string; deviationNotes: string; notes: string; }
export interface BuildDispatch { id: string; phaseId: string; status: string; buildClass: string; riskLevel: string; targetRepo: string; environment: string; createdAt: string; }
export interface BuildOutput { id: string; phaseId: string; status: string; implementationSummary: string; artifactLinks: string[]; notes: string; }
export interface Review { id: string; phaseId: string; decision: string; comments: string; impactOnFuturePhases: string; decidedAt: string; }
export interface RevisionEvent { id: string; sourcePhaseId: string; affectedPhaseIds: string[]; summary: string; reason: string; approvedBy: string; createdAt: string; }
export interface ConversationReference { id: string; scopeType: ScopeType; scopeId: string; system: ConversationSystem; role: ConversationRole; url: string; status: ConversationStatus; authoritative: boolean; notes: string; }
