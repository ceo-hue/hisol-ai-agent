export interface ValueNode {
  term: string;
  frequency: number;
  importance: number;
  lastSeen: number;
  associations: {
    [targetTerm: string]: number;
  };
}

export interface ValueChain {
  nodes: { [term: string]: ValueNode };
  version: string;
}

export interface ValueDecisionContext {
  primaryValues: string[];
  narrative: string;
}
