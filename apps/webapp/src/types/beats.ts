export type BeatType =
  | "guide"        // DEFAULT — freeform, writer describes anything freely
  | "action"       // physical action, visual observation, event
  | "reaction"     // external/immediate reaction
  | "dialogue"     // spoken line, small exchange
  | "realization"  // internal awareness, epiphany
  | "decision"     // internal resolve, shift in intent
  | "transition";  // atmosphere shift, passage of time, movement

export type BeatAnchorAttrs = {
  id: string;
  beatType: BeatType;
  description: string;
  status: "pending" | "drafted" | "done";
  wordCount?: number;
};

export type SceneBeats = {
  schemaVersion: 1;
  sceneTitle: string;
  beats: {
    id: string;
    type: BeatType;
    description: string;
    status: "pending" | "drafted" | "done";
    wordCount?: number;
  }[];
};
