export type Scope = "global" | "project" | "both";

export type Source = "global" | "project";

export type RememberConfig = {
  enabled: boolean;
  scope: Scope;
  inject: {
    count: number;
    lowThreshold: number;
    highThreshold: number;
  };
};

export type Store = { source: Source; dbPath: string };

export type MemoryRow = {
  id: number;
  content: string;
  timestamp: string;
  embedding: Buffer;
};

export type MemoryItem = { id: number; content: string; timestamp: string; source: string };

export type MemoryHit = { id: number; content: string; score: number; source: string };
