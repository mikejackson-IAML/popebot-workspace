export type ProjectStatus = "Draft" | "Active" | "Blocked" | "Archived";
export type ApprovalState = 'Pending' | 'Approved' | 'Rejected';
export type BuildStatus = 'Queued' | 'InProgress' | 'Succeeded' | 'Failed';
export type BuildClass = 'standard' | 'elevated' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high';
export type ReviewDecision = 'Accepted' | 'ReworkRequired' | 'ConditionallyAccepted' | 'Closed';
export type PhaseStatus = "DraftSpec" | "SpecApproved" | "PRDAttached" | "ReadyForBuild" | "Accepted" | "ReworkRequired" | "Closed";
export type FreezeState = "Locked" | "FrozenDownstream" | "EditableDownstream" | "DownstreamRevisionRequired";
export type ConversationSystem = "Claude" | "ChatGPT" | "Other";
export type ConversationRole = "planning" | "prd" | "architecture" | "review" | "revision";
export type ConversationStatus = "active" | "reference" | "archived";
export type ScopeType = "project" | "phase";

export interface DevProject { id: string; name: string; objective: string; owner: string; status: ProjectStatus; activePhaseId: string | null; roadmapSummary: string; createdAt: string; updatedAt: string; }
export interface Phase { id: string; projectId: string; phaseNumber: number; title: string; objective: string; description: string; status: PhaseStatus; prerequisites: string; successCriteria: string; riskNotes: string; freezeState: FreezeState; sortOrder: number; createdAt: string; updatedAt: string; }
export interface Spec { id: string; phaseId: string; title: string; sourceRef: string; version: string; author: string; approvalState: ApprovalState; notes: string; createdAt: string; updatedAt: string; }
export interface PRD { id: string; phaseId: string; title: string; sourceRef: string; version: string; approvalState: ApprovalState; deviationNotes: string; notes: string; createdAt: string; updatedAt: string; }
export interface BuildDispatch { id: string; phaseId: string; status: BuildStatus; buildClass: BuildClass; riskLevel: RiskLevel; targetRepo: string; environment: string; createdAt: string; }
export interface BuildOutput { id: string; phaseId: string; buildDispatchId: string; status: BuildStatus; implementationSummary: string; artifactLinks: string[]; notes: string; createdAt: string; }
export interface Review { id: string; phaseId: string; decision: ReviewDecision; comments: string; impactOnFuturePhases: string; decidedAt: string; }
export interface RevisionEvent { id: string; sourcePhaseId: string; affectedPhaseIds: string[]; summary: string; reason: string; approvedBy: string; createdAt: string; }
export interface ConversationReference { id: string; scopeType: ScopeType; scopeId: string; system: ConversationSystem; role: ConversationRole; url: string; status: ConversationStatus; authoritative: boolean; notes: string; }
