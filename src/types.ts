export interface WheelParameters {
  wheelRadius: number;
  spokeCount: number;
  axleLoad: number;
  impactIntensity: number;
  materialId: string;
  spokeWidth: number;
  spokeHeight: number;
  roadConditionId: string;
  operatingCycles: number;
}

export interface SpokeForceData {
  spokeIndex: number;
  angle: number;
  staticForce: number;
  impactForce: number;
  totalForce: number;
  fatigueRisk: number;
  exceedsThreshold: boolean;
  stress: number;
  damageAccumulated: number;
  remainingLife: number;
}

export interface SimulationResult {
  parameters: WheelParameters;
  spokeData: SpokeForceData[];
  maxForce: number;
  averageForce: number;
  threshold: number;
  timestamp: number;
  material: MaterialProperties;
  roadCondition: RoadCondition;
  fatigueAnalysis: FatigueAnalysis;
  multiRoadResults: MultiRoadResult[];
}

export interface SavedScheme {
  id: string;
  name: string;
  result: SimulationResult;
  createdAt: number;
}

export const FORCE_THRESHOLD = 8000;

export type RoadConditionId = 'paved' | 'gravel' | 'mud' | 'cobbles' | 'rough';

export interface RoadCondition {
  id: RoadConditionId;
  name: string;
  description: string;
  impactMultiplier: number;
  frequencyFactor: number;
  color: string;
  icon: string;
}

export const ROAD_CONDITIONS: RoadCondition[] = [
  { id: 'paved', name: '夯土路面', description: '古代夯土官道，路面平整坚硬', impactMultiplier: 0.6, frequencyFactor: 1.0, color: '#a0855b', icon: '🏛️' },
  { id: 'gravel', name: '碎石路面', description: '砂石混合路面，冲击中等', impactMultiplier: 1.0, frequencyFactor: 1.5, color: '#8b7355', icon: '🪨' },
  { id: 'mud', name: '泥泞路面', description: '雨后泥泞路面，冲击低但持续', impactMultiplier: 0.4, frequencyFactor: 2.0, color: '#6b4226', icon: '🌧️' },
  { id: 'cobbles', name: '石板路面', description: '不规则石板路面，高频冲击', impactMultiplier: 1.4, frequencyFactor: 2.5, color: '#708090', icon: '🧱' },
  { id: 'rough', name: '崎岖山道', description: '极端崎岖地形，剧烈连续冲击', impactMultiplier: 2.0, frequencyFactor: 3.0, color: '#556b2f', icon: '⛰️' },
];

export interface MaterialProperties {
  id: string;
  name: string;
  nameEn: string;
  density: number;
  tensileStrength: number;
  yieldStrength: number;
  enduranceLimit: number;
  elasticModulus: number;
  fatigueExponent: number;
  fatigueCoefficient: number;
  color: string;
  description: string;
}

export const MATERIALS: MaterialProperties[] = [
  {
    id: 'elm', name: '榆木', nameEn: 'Elm Wood',
    density: 560, tensileStrength: 95e6, yieldStrength: 65e6,
    enduranceLimit: 28e6, elasticModulus: 9.5e9,
    fatigueExponent: 8.5, fatigueCoefficient: 120e6,
    color: '#8B6914', description: '古代战车轮辐首选，韧性好，抗冲击',
  },
  {
    id: 'oak', name: '橡木', nameEn: 'Oak Wood',
    density: 680, tensileStrength: 110e6, yieldStrength: 75e6,
    enduranceLimit: 35e6, elasticModulus: 11e9,
    fatigueExponent: 9.0, fatigueCoefficient: 145e6,
    color: '#6B4226', description: '硬度高，承载能力强，但韧性稍低',
  },
  {
    id: 'ash', name: '白蜡木', nameEn: 'Ash Wood',
    density: 610, tensileStrength: 105e6, yieldStrength: 70e6,
    enduranceLimit: 32e6, elasticModulus: 10.5e9,
    fatigueExponent: 8.8, fatigueCoefficient: 135e6,
    color: '#C4A35A', description: '弹性好，抗弯性能优异，适合减震',
  },
  {
    id: 'iron', name: '铸铁加固', nameEn: 'Cast Iron Reinforced',
    density: 7200, tensileStrength: 250e6, yieldStrength: 180e6,
    enduranceLimit: 80e6, elasticModulus: 100e9,
    fatigueExponent: 6.0, fatigueCoefficient: 350e6,
    color: '#708090', description: '铁质加固轮辐，承载力大幅提升但重量增加',
  },
  {
    id: 'bamboo', name: '竹质复合', nameEn: 'Bamboo Composite',
    density: 500, tensileStrength: 85e6, yieldStrength: 55e6,
    enduranceLimit: 25e6, elasticModulus: 8e9,
    fatigueExponent: 7.5, fatigueCoefficient: 95e6,
    color: '#7CFC00', description: '轻质高弹，适合快速机动但耐久较低',
  },
];

export interface FatigueAnalysis {
  totalDamage: number;
  maxCycleLife: number;
  minCycleLife: number;
  avgCycleLife: number;
  failureProbability: number;
  snCurveData: SNCurvePoint[];
  damageAccumulationData: DamageAccumulationPoint[];
  criticalSpokes: number[];
  optimizationSuggestions: OptimizationSuggestion[];
  safetyFactor: number;
  remainingLifePercent: number;
}

export interface SNCurvePoint {
  cycles: number;
  stress: number;
}

export interface DamageAccumulationPoint {
  cycle: number;
  totalDamage: number;
  maxSpokeDamage: number;
  failedSpokes: number;
}

export interface OptimizationSuggestion {
  type: 'material' | 'geometry' | 'load' | 'road';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImprovement: string;
}

export interface MultiRoadResult {
  roadCondition: RoadCondition;
  maxForce: number;
  averageForce: number;
  exceededCount: number;
  avgFatigueRisk: number;
  totalDamage: number;
  estimatedLife: number;
}

export interface ComparisonItem {
  schemeId: string;
  schemeName: string;
  maxForce: number;
  averageForce: number;
  maxStress: number;
  totalDamage: number;
  estimatedLife: number;
  safetyFactor: number;
  failureProbability: number;
  materialName: string;
  roadConditionName: string;
  exceededCount: number;
}

export interface ReportSection {
  title: string;
  content: string;
  data?: Record<string, unknown>;
}

export interface EngineeringReport {
  title: string;
  generatedAt: number;
  schemeName: string;
  sections: ReportSection[];
  summary: {
    safetyLevel: 'safe' | 'warning' | 'danger';
    overallScore: number;
    keyFindings: string[];
    criticalIssues: string[];
  };
}

export const DEFAULT_PARAMETERS: WheelParameters = {
  wheelRadius: 1.0,
  spokeCount: 12,
  axleLoad: 500,
  impactIntensity: 2.0,
  materialId: 'elm',
  spokeWidth: 0.04,
  spokeHeight: 0.06,
  roadConditionId: 'gravel',
  operatingCycles: 100000,
};

export function getMaterialById(id: string): MaterialProperties {
  return MATERIALS.find((m) => m.id === id) || MATERIALS[0];
}

export function getRoadConditionById(id: string): RoadCondition {
  return ROAD_CONDITIONS.find((r) => r.id === id) || ROAD_CONDITIONS[1];
}
