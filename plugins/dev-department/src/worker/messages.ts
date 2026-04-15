import type { DevProject, Phase, Spec, PRD, ConversationReference, BuildDispatch, BuildOutput, Review, RevisionEvent, ScopeType, PhaseStatus } from "./types.js";

export type WorkerRequest =
  | { type: "init" }
  | { type: "listProjects" }
  | { type: "createProject"; data: Omit<DevProject, "id" | "createdAt" | "updatedAt"> }
  | { type: "updateProject"; id: string; data: Partial<DevProject> }
  | { type: "deleteProject"; id: string }
  | { type: "getPhasesByProject"; projectId: string }
  | { type: "createPhase"; data: Omit<Phase, "id" | "createdAt" | "updatedAt"> }
  | { type: "updatePhase"; id: string; data: Partial<Phase> }
  | { type: "deletePhase"; id: string }
  | { type: "reorderPhases"; projectId: string; phaseIds: string[] }
  | { type: "createSpec"; data: Omit<Spec, "id" | "createdAt" | "updatedAt"> }
  | { type: "updateSpec"; id: string; data: Partial<Spec> }
  | { type: "createPRD"; data: Omit<PRD, "id" | "createdAt" | "updatedAt"> }
  | { type: "updatePRD"; id: string; data: Partial<PRD> }
  | { type: "getSpecByPhase"; phaseId: string }
  | { type: "getPRDByPhase"; phaseId: string }
  | { type: "createConversationRef"; data: Omit<ConversationReference, "id"> }
  | { type: "updateConversationRef"; id: string; data: Partial<ConversationReference> }
  | { type: "deleteConversationRef"; id: string }
  | { type: "getConversationRefs"; scopeType: ScopeType; scopeId: string }
  | { type: "getBuildDispatchByPhase"; phaseId: string }
  | { type: "getBuildOutputByPhase"; phaseId: string }
  | { type: "getReviewByPhase"; phaseId: string }
  | { type: "createBuildDispatch"; data: Omit<BuildDispatch, "id" | "createdAt"> }
  | { type: "createBuildOutput"; data: Omit<BuildOutput, "id" | "createdAt"> }
  | { type: "createReview"; data: Omit<Review, "id"> }
  | { type: "flush" };

export type WorkerResponse =
  | { type: "projects"; data: DevProject[] }
  | { type: "project"; data: DevProject }
  | { type: "phases"; data: Phase[] }
  | { type: "phase"; data: Phase }
  | { type: "spec"; data: Spec | null }
  | { type: "prd"; data: PRD | null }
  | { type: "conversationRefs"; data: ConversationReference[] }
  | { type: "buildDispatch"; data: BuildDispatch | null }
  | { type: "buildOutput"; data: BuildOutput | null }
  | { type: "review"; data: Review | null }
  | { type: "error"; message: string }
  | { type: "ok" };

export const VALID_TRANSITIONS: Record<PhaseStatus, PhaseStatus[]> = {
  DraftSpec: ["SpecApproved"],
  SpecApproved: ["PRDAttached", "DraftSpec"],
  PRDAttached: ["ReadyForBuild", "SpecApproved"],
  ReadyForBuild: ["Accepted", "ReworkRequired"],
  Accepted: ["Closed"],
  ReworkRequired: ["DraftSpec", "PRDAttached"],
  Closed: [],
};
