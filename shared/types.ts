// CiteSafe shared types

export type InspectionStatus = "violation" | "clear" | "unclear";
export type ViolationSeverity = "willful" | "serious" | "repeat" | "other-than-serious" | "none";

export interface Citation {
  code: string;
  title: string;
  relevance: string;
}

export interface InspectionResult {
  status: InspectionStatus;
  headline: string;
  analysis: string;
  clarifyingQuestion?: string;
  citations: Citation[];
  correctiveAction?: string;
  severity: ViolationSeverity;
  maxPenalty: string;
  confidence: number;
}

export interface InspectionRecord {
  id: number;
  userId: number;
  status: InspectionStatus;
  headline: string;
  citation: string;
  analysis: string;
  severity: string;
  maxPenalty: string;
  confidence: number;
  fullResult: string; // JSON stringified InspectionResult
  createdAt: Date;
}

export interface AnalyzeInput {
  text?: string;
  imageBase64?: string;
  imageMimeType?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}
