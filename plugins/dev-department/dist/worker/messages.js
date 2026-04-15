export const VALID_TRANSITIONS = {
    DraftSpec: ["SpecApproved"],
    SpecApproved: ["PRDAttached", "DraftSpec"],
    PRDAttached: ["ReadyForBuild", "SpecApproved"],
    ReadyForBuild: ["Accepted", "ReworkRequired"],
    Accepted: ["Closed"],
    ReworkRequired: ["DraftSpec", "PRDAttached"],
    Closed: [],
};
//# sourceMappingURL=messages.js.map