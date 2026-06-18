export interface WheelParameters {
  wheelRadius: number;
  spokeCount: number;
  axleLoad: number;
  impactIntensity: number;
}

export interface SpokeForceData {
  spokeIndex: number;
  angle: number;
  staticForce: number;
  impactForce: number;
  totalForce: number;
  fatigueRisk: number;
  exceedsThreshold: boolean;
}

export interface SimulationResult {
  parameters: WheelParameters;
  spokeData: SpokeForceData[];
  maxForce: number;
  averageForce: number;
  threshold: number;
  timestamp: number;
}

export interface SavedScheme {
  id: string;
  name: string;
  result: SimulationResult;
  createdAt: number;
}

export const FORCE_THRESHOLD = 8000;
