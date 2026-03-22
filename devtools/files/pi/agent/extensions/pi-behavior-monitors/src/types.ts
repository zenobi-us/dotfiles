export interface CollectorDescriptor {
  name: string;
  description: string;
  limits?: string;
}
export interface WhenConditionDescriptor {
  name: string;
  description: string;
  parameterized: boolean;
}
export interface MonitorScope {
  target: "main" | "subagent" | "all" | "workflow";
  filter?: {
    agent_type?: string[];
    step_name?: string;
    workflow?: string;
  };
}
export interface MonitorAction {
  steer?: string | null;
  learn_pattern?: boolean;
  write?: {
    path: string;
    schema?: string;
    merge: "append" | "upsert";
    array_field: string;
    template: Record<string, string>;
  };
}
export type MonitorEvent = "message_end" | "turn_end" | "agent_end" | "command";
export interface MonitorSpec {
  name: string;
  description: string;
  event: MonitorEvent;
  when: string;
  scope: MonitorScope;
  classify: {
    model: string;
    context: string[];
    excludes: string[];
    prompt: string;
    promptTemplate?: string;
  };
  patterns: {
    path: string;
    learn: boolean;
  };
  instructions: {
    path: string;
  };
  actions: {
    on_flag?: MonitorAction | null;
    on_new?: MonitorAction | null;
    on_clean?: MonitorAction | null;
  };
  ceiling: number;
  escalate: "ask" | "dismiss";
}
export interface MonitorPattern {
  id: string;
  description: string;
  severity?: string;
  category?: string;
  examples?: string[];
  learned_at?: string;
  source?: string;
}
export interface MonitorInstruction {
  text: string;
  added_at?: string;
}
export interface Monitor extends MonitorSpec {
  dir: string;
  resolvedPatternsPath: string;
  resolvedInstructionsPath: string;
  activationCount: number;
  whileCount: number;
  lastUserText: string;
  dismissed: boolean;
}
export interface ClassifyResult {
  verdict: "clean" | "flag" | "new";
  description?: string;
  newPattern?: string;
}
export interface MonitorMessageDetails {
  monitorName: string;
  verdict: "flag" | "new";
  description: string;
  steer: string;
  whileCount: number;
  ceiling: number;
}
export type MonitorsCommand =
  | { type: "list" }
  | { type: "on" }
  | { type: "off" }
  | { type: "inspect"; name: string }
  | { type: "rules-list"; name: string }
  | { type: "rules-add"; name: string; text: string }
  | { type: "rules-remove"; name: string; index: number }
  | { type: "rules-replace"; name: string; index: number; text: string }
  | { type: "patterns-list"; name: string }
  | { type: "dismiss"; name: string }
  | { type: "reset"; name: string }
  | { type: "error"; message: string };
