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
  diagnosisResult?: DiagnosisResult;
  maintenanceRecommendation?: MaintenanceRecommendation;
  maintenanceComparison?: MaintenanceComparison;
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

export type FaultType = 'spoke_crack' | 'hub_looseness' | 'rim_deformation';

export type FaultSeverity = 'none' | 'mild' | 'moderate' | 'severe' | 'critical';

export interface SpokeCrackFault {
  spokeIndex: number;
  severity: FaultSeverity;
  crackLength: number;
  crackDepth: number;
  crackPosition: 'root' | 'middle' | 'rim';
  stressConcentration: number;
  propagationRisk: number;
  structuralImpact: number;
}

export interface HubLoosenessFault {
  severity: FaultSeverity;
  loosenessDegree: number;
  boltTensionLoss: number;
  vibrationAmplitude: number;
  runoutRisk: number;
  safetyMargin: number;
}

export interface RimDeformationFault {
  severity: FaultSeverity;
  deformationType: 'radial' | 'lateral' | 'combined';
  maxRunout: number;
  deformationAngle: number;
  tireSealRisk: number;
  balanceImpact: number;
}

export interface StructuralSafetyImpact {
  safetyFactorReduction: number;
  loadCapacityLoss: number;
  collapseRisk: number;
  structuralIntegrity: number;
}

export interface LifeImpact {
  fatigueLifeReduction: number;
  acceleratedAgingRate: number;
  maintenanceInterval: number;
}

export interface StabilityImpact {
  vibrationIncrease: number;
  handlingDegradation: number;
  noiseLevelIncrease: number;
  rideComfortLoss: number;
}

export interface DiagnosisResult {
  spokeCracks: SpokeCrackFault[];
  hubLooseness: HubLoosenessFault;
  rimDeformation: RimDeformationFault;
  overallFaultLevel: FaultSeverity;
  structuralSafety: StructuralSafetyImpact;
  lifeImpact: LifeImpact;
  stabilityImpact: StabilityImpact;
  riskScore: number;
  immediateAttention: string[];
  diagnosticTimestamp: number;
}

export type RepairActionType =
  | 'material_replace'
  | 'spoke_reinforce'
  | 'spoke_replace'
  | 'hub_tighten'
  | 'hub_replace'
  | 'rim_true'
  | 'rim_replace'
  | 'load_adjust'
  | 'road_avoid'
  | 'regular_inspection';

export interface RepairAction {
  id: string;
  type: RepairActionType;
  title: string;
  description: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  affectedComponents: string[];
  complexity: number;
  durationHours: number;
  prerequisites: string[];
}

export interface CostBreakdown {
  materialCost: number;
  laborCost: number;
  laborHours: number;
  equipmentCost: number;
  inspectionCost: number;
  downtimeCost: number;
  totalCost: number;
}

export interface MaintenancePlan {
  id: string;
  name: string;
  description: string;
  planType: 'repair' | 'reinforce' | 'overhaul' | 'preventive';
  actions: RepairAction[];
  totalDurationHours: number;
}

export interface ExpectedEffect {
  safetyFactorImprovement: number;
  lifeExtension: number;
  loadCapacityRecovery: number;
  stabilityRecovery: number;
  vibrationReduction: number;
  overallScoreImprovement: number;
}

export interface MaintenanceRecommendation {
  diagnosisResult: DiagnosisResult;
  plans: MaintenancePlan[];
  recommendedPlanId: string;
  costEstimates: Record<string, CostBreakdown>;
  expectedEffects: Record<string, ExpectedEffect>;
}

export interface ComparisonMetric {
  name: string;
  unit: string;
  beforeValue: number;
  afterValue: number;
  improvement: number;
  improvementPercent: number;
}

export interface MaintenanceComparison {
  planId: string;
  planName: string;
  metrics: ComparisonMetric[];
  beforeOverview: {
    structuralSafety: number;
    estimatedLife: number;
    stability: number;
    overallScore: number;
  };
  afterOverview: {
    structuralSafety: number;
    estimatedLife: number;
    stability: number;
    overallScore: number;
  };
  radarData: {
    category: string;
    before: number;
    after: number;
  }[];
}

export type ServicePhase = 'new' | 'running_in' | 'normal_service' | 'wear_period' | 'critical' | 'retired';

export interface ServicePhaseRecord {
  id: string;
  phase: ServicePhase;
  startedAt: number;
  endedAt?: number;
  mileage: number;
  cycles: number;
  notes: string;
}

export interface WheelIdentity {
  id: string;
  serialNumber: string;
  vehicleId: string;
  fleetId: string;
  manufactureDate: number;
  installationDate: number;
  materialId: string;
  spokeCount: number;
  wheelRadius: number;
}

export interface WheelServiceRecord {
  identity: WheelIdentity;
  currentPhase: ServicePhase;
  phaseHistory: ServicePhaseRecord[];
  totalMileage: number;
  totalCycles: number;
  maintenanceCount: number;
  repairCount: number;
  totalCost: number;
  currentHealthScore: number;
  lastInspectionDate: number;
  nextInspectionDate: number;
  position: 'front_left' | 'front_right' | 'rear_left' | 'rear_right';
}

export const SERVICE_PHASE_LABELS: Record<ServicePhase, string> = {
  new: '全新',
  running_in: '磨合期',
  normal_service: '正常服役',
  wear_period: '磨损期',
  critical: '临界状态',
  retired: '已报废',
};

export const SERVICE_PHASE_COLORS: Record<ServicePhase, string> = {
  new: 'blue',
  running_in: 'cyan',
  normal_service: 'green',
  wear_period: 'yellow',
  critical: 'orange',
  retired: 'gray',
};

export interface FaultRecord {
  id: string;
  wheelId: string;
  vehicleId: string;
  fleetId: string;
  faultType: FaultType;
  severity: FaultSeverity;
  detectedAt: number;
  repairedAt?: number;
  description: string;
  rootCause?: string;
  repairAction?: string;
  repairCost: number;
  downtimeHours: number;
  mileageAtFault: number;
  cyclesAtFault: number;
  roadCondition: string;
  weatherCondition?: string;
  operatorNotes?: string;
}

export interface FaultPatternAnalysis {
  faultType: FaultType;
  totalCount: number;
  averageRepairCost: number;
  averageDowntime: number;
  mostCommonSeverity: FaultSeverity;
  highRiskPeriods: { startMileage: number; endMileage: number; count: number }[];
  seasonalTrends: { season: string; count: number }[];
}

export interface MaintenanceTask {
  id: string;
  wheelId: string;
  vehicleId: string;
  fleetId: string;
  taskType: 'inspection' | 'preventive' | 'corrective' | 'overhaul';
  title: string;
  description: string;
  scheduledDate: number;
  dueDate: number;
  completedDate?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDurationHours: number;
  actualDurationHours?: number;
  assignedTechnician?: string;
  requiredParts: { partId: string; partName: string; quantity: number }[];
  costEstimate: number;
  actualCost?: number;
  notes?: string;
}

export interface MaintenanceSchedule {
  tasks: MaintenanceTask[];
  weeklySchedule: { date: number; tasks: MaintenanceTask[] }[];
  monthlySummary: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    estimatedCost: number;
    actualCost: number;
  };
}

export const MAINTENANCE_TASK_TYPE_LABELS: Record<MaintenanceTask['taskType'], string> = {
  inspection: '例行检查',
  preventive: '预防性维护',
  corrective: '故障维修',
  overhaul: '大修',
};

export interface LifePredictionPoint {
  cycles: number;
  predictedHealthScore: number;
  lowerBound: number;
  upperBound: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface Warning {
  id: string;
  wheelId: string;
  vehicleId: string;
  type: 'health' | 'life' | 'maintenance' | 'spare_parts' | 'resource';
  level: 'info' | 'warning' | 'critical';
  message: string;
  triggeredAt: number;
  acknowledged: boolean;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
}

export interface LifePredictionResult {
  wheelId: string;
  currentHealthScore: number;
  predictedRemainingCycles: number;
  predictedRemainingMileage: number;
  predictedEndOfLifeDate: number;
  confidenceInterval: { lower: number; upper: number };
  predictionCurve: LifePredictionPoint[];
  warnings: Warning[];
  keyFactors: { factor: string; impact: number; description: string }[];
  recommendations: string[];
}

export interface Technician {
  id: string;
  name: string;
  skillLevel: 'junior' | 'intermediate' | 'senior' | 'expert';
  specialties: string[];
  hourlyRate: number;
  available: boolean;
  currentWorkload: number;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  available: boolean;
  maintenanceSchedule: { date: number; description: string }[];
}

export interface ResourceAllocation {
  taskId: string;
  technicianId: string;
  equipmentIds: string[];
  startTime: number;
  endTime: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}

export interface ResourceSchedule {
  date: number;
  allocations: ResourceAllocation[];
  totalAvailableHours: number;
  totalAllocatedHours: number;
  utilizationRate: number;
}

export const TECHNICIAN_SKILL_LABELS: Record<Technician['skillLevel'], string> = {
  junior: '初级',
  intermediate: '中级',
  senior: '高级',
  expert: '专家',
};

export interface SparePart {
  id: string;
  name: string;
  category: 'spoke' | 'hub' | 'rim' | 'fastener' | 'material' | 'tool' | 'other';
  unit: string;
  unitCost: number;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  leadTimeDays: number;
  supplier: string;
  lastRestockDate?: number;
}

export interface SparePartConsumption {
  id: string;
  partId: string;
  partName: string;
  quantity: number;
  usedAt: number;
  usedIn: string;
  wheelId?: string;
  vehicleId?: string;
  cost: number;
}

export interface SparePartAnalysis {
  partId: string;
  partName: string;
  totalConsumed: number;
  totalCost: number;
  monthlyConsumption: { month: string; quantity: number; cost: number }[];
  predictedConsumption: { month: string; predictedQuantity: number }[];
  turnoverRate: number;
  stockOutRisk: 'low' | 'medium' | 'high';
  costOptimizationPotential: number;
}

export const SPARE_PART_CATEGORY_LABELS: Record<SparePart['category'], string> = {
  spoke: '轮辐',
  hub: '轮毂',
  rim: '轮辋',
  fastener: '紧固件',
  material: '材料',
  tool: '工具',
  other: '其他',
};

export interface Vehicle {
  id: string;
  name: string;
  fleetId: string;
  type: string;
  wheels: WheelServiceRecord[];
  totalMileage: number;
  lastMaintenanceDate: number;
  nextMaintenanceDate: number;
  status: 'active' | 'maintenance' | 'idle' | 'retired';
  healthScore: number;
}

export interface Fleet {
  id: string;
  name: string;
  description: string;
  vehicles: Vehicle[];
  totalWheels: number;
  activeWheels: number;
  wheelsInMaintenance: number;
  wheelsRetired: number;
  totalMaintenanceCost: number;
  averageHealthScore: number;
}

export interface FleetKPI {
  totalWheels: number;
  activeWheels: number;
  wheelsInMaintenance: number;
  averageHealthScore: number;
  healthDistribution: { level: string; count: number; percentage: number }[];
  monthlyMaintenanceCost: number;
  yearlyMaintenanceCost: number;
  averageCostPerWheel: number;
  failureRate: number;
  meanTimeToRepair: number;
  availabilityRate: number;
  criticalWarnings: number;
  upcomingMaintenanceTasks: number;
  sparePartsStockValue: number;
}

export interface FleetOperationData {
  fleet: Fleet;
  kpi: FleetKPI;
  topIssues: { wheelId: string; vehicleName: string; issue: string; severity: FaultSeverity }[];
  costTrend: { month: string; maintenanceCost: number; sparePartsCost: number }[];
  availabilityTrend: { month: string; availabilityRate: number }[];
}

export interface TimeSeriesDataPoint {
  timestamp: number;
  cycle: number;
  mileage: number;
  spokeForces: number[];
  spokeStresses: number[];
  spokeDamages: number[];
  maxForce: number;
  avgForce: number;
  maxStress: number;
  totalDamage: number;
  healthScore: number;
  temperature?: number;
  vibration?: number;
  roadConditionId: string;
  axleLoad: number;
  speed?: number;
}

export interface TimeSeriesRecord {
  id: string;
  wheelId: string;
  startTime: number;
  endTime: number;
  totalCycles: number;
  totalMileage: number;
  dataPoints: TimeSeriesDataPoint[];
  sampleInterval: number;
  metadata: Record<string, unknown>;
}

export interface DamageEvolutionState {
  cycle: number;
  spokeDamages: number[];
  totalDamage: number;
  maxDamage: number;
  failedSpokes: number[];
  crackLengths: number[];
  crackDepths: number[];
  stressConcentrations: number[];
  remainingLives: number[];
  safetyFactor: number;
  structuralIntegrity: number;
  failureProbability: number;
}

export interface DamageEvolutionResult {
  id: string;
  wheelId: string;
  states: DamageEvolutionState[];
  initialState: DamageEvolutionState;
  finalState: DamageEvolutionState;
  totalCycles: number;
  failureCycle: number | null;
  failureMode: 'spoke_fracture' | 'hub_failure' | 'rim_failure' | 'fatigue_cumulative' | null;
  criticalSpokeIndex: number | null;
  evolutionRate: number;
}

export type TerrainType = 'plain' | 'hilly' | 'mountain' | 'desert' | 'marsh' | 'forest' | 'river' | 'siege';

export interface BattlefieldTerrain {
  id: string;
  name: string;
  description: string;
  type: TerrainType;
  icon: string;
  color: string;
  elevation: number;
  slope: number;
  roughness: number;
  obstacleDensity: number;
  impactMultiplier: number;
  frequencyFactor: number;
  speedLimit: number;
  loadReduction: number;
  historicalContext: string;
  strategicImportance: 'low' | 'medium' | 'high' | 'critical';
  recommendedMaterial: string;
  warningNotes: string[];
}

export const BATTLEFIELD_TERRAINS: BattlefieldTerrain[] = [
  {
    id: 'plain_central',
    name: '中原平原',
    description: '华北平原开阔地带，地势平坦，适合战车机动',
    type: 'plain',
    icon: '🏛️',
    color: '#d4a574',
    elevation: 50,
    slope: 0.02,
    roughness: 0.3,
    obstacleDensity: 0.1,
    impactMultiplier: 0.6,
    frequencyFactor: 1.0,
    speedLimit: 25,
    loadReduction: 0,
    historicalContext: '春秋时期中原诸侯征战的主要战场',
    strategicImportance: 'high',
    recommendedMaterial: 'elm',
    warningNotes: ['雨季可能形成泥泞', '注意避让农田沟渠'],
  },
  {
    id: 'hilly_gateway',
    name: '函谷关隘口',
    description: '黄土高原丘陵地带，道路崎岖，易守难攻',
    type: 'hilly',
    icon: '🏔️',
    color: '#8b7355',
    elevation: 800,
    slope: 0.15,
    roughness: 0.7,
    obstacleDensity: 0.4,
    impactMultiplier: 1.4,
    frequencyFactor: 2.0,
    speedLimit: 12,
    loadReduction: 0.3,
    historicalContext: '秦国东出的重要关隘，战车通行困难',
    strategicImportance: 'critical',
    recommendedMaterial: 'oak',
    warningNotes: ['坡度大，需减载通行', '轮辐受力集中，易断裂'],
  },
  {
    id: 'mountain_qi',
    name: '祁连山道',
    description: '河西走廊山地通道，海拔高，路况恶劣',
    type: 'mountain',
    icon: '⛰️',
    color: '#556b2f',
    elevation: 2500,
    slope: 0.25,
    roughness: 0.9,
    obstacleDensity: 0.6,
    impactMultiplier: 2.2,
    frequencyFactor: 3.0,
    speedLimit: 8,
    loadReduction: 0.5,
    historicalContext: '汉代丝绸之路的重要路段',
    strategicImportance: 'high',
    recommendedMaterial: 'iron',
    warningNotes: ['高海拔可能导致材料性能变化', '低温环境需特殊防护'],
  },
  {
    id: 'desert_gobi',
    name: '戈壁沙漠',
    description: '西北戈壁滩，沙石遍地，温差极大',
    type: 'desert',
    icon: '🏜️',
    color: '#daa520',
    elevation: 1200,
    slope: 0.05,
    roughness: 0.6,
    obstacleDensity: 0.2,
    impactMultiplier: 1.8,
    frequencyFactor: 2.5,
    speedLimit: 15,
    loadReduction: 0.2,
    historicalContext: '汉军远征匈奴的主要补给路线',
    strategicImportance: 'medium',
    recommendedMaterial: 'ash',
    warningNotes: ['沙尘易进入轮毂轴承', '昼夜温差大，材料易疲劳'],
  },
  {
    id: 'marsh_jiangnan',
    name: '江南水网',
    description: '长江下游河湖密布，道路泥泞湿滑',
    type: 'marsh',
    icon: '🌊',
    color: '#4682b4',
    elevation: 10,
    slope: 0.03,
    roughness: 0.5,
    obstacleDensity: 0.3,
    impactMultiplier: 0.8,
    frequencyFactor: 1.5,
    speedLimit: 10,
    loadReduction: 0.4,
    historicalContext: '吴越争霸时期的水网作战区域',
    strategicImportance: 'medium',
    recommendedMaterial: 'bamboo',
    warningNotes: ['泥泞易陷车，需减重', '木材易腐，需防腐处理'],
  },
  {
    id: 'forest_shennong',
    name: '神农架林区',
    description: '原始森林地带，树木茂密，路径狭窄',
    type: 'forest',
    icon: '🌲',
    color: '#228b22',
    elevation: 1500,
    slope: 0.12,
    roughness: 0.8,
    obstacleDensity: 0.7,
    impactMultiplier: 1.6,
    frequencyFactor: 2.2,
    speedLimit: 6,
    loadReduction: 0.35,
    historicalContext: '古代荆楚地区的隐秘行军路线',
    strategicImportance: 'low',
    recommendedMaterial: 'elm',
    warningNotes: ['树木障碍多，通行困难', '潮湿环境易滋生霉菌'],
  },
  {
    id: 'river_huanghe',
    name: '黄河渡口',
    description: '黄河滩涂地带，沙土松软，坡度变化大',
    type: 'river',
    icon: '🌉',
    color: '#cd853f',
    elevation: 80,
    slope: 0.08,
    roughness: 0.7,
    obstacleDensity: 0.35,
    impactMultiplier: 1.5,
    frequencyFactor: 1.8,
    speedLimit: 8,
    loadReduction: 0.45,
    historicalContext: '古代重要的渡河地点，战车需特别加固',
    strategicImportance: 'high',
    recommendedMaterial: 'oak',
    warningNotes: ['滩涂松软，易陷车', '水流冲刷，路况不稳定'],
  },
  {
    id: 'siege_changan',
    name: '长安城垣',
    description: '古代都城攻防战场景，壕沟、拒马、碎石密布',
    type: 'siege',
    icon: '🏯',
    color: '#696969',
    elevation: 400,
    slope: 0.2,
    roughness: 1.0,
    obstacleDensity: 0.9,
    impactMultiplier: 2.5,
    frequencyFactor: 3.5,
    speedLimit: 5,
    loadReduction: 0.6,
    historicalContext: '典型的攻城战场景，战车损耗极大',
    strategicImportance: 'critical',
    recommendedMaterial: 'iron',
    warningNotes: ['障碍密集，冲击载荷极大', '需使用加固型战车', '维修间隔大幅缩短'],
  },
];

export interface LoadMission {
  id: string;
  name: string;
  description: string;
  type: 'transport' | 'combat' | 'patrol' | 'supply' | 'retreat' | 'reconnaissance';
  icon: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  baseLoad: number;
  loadVariability: number;
  durationCycles: number;
  durationHours: number;
  terrainIds: string[];
  speedProfile: 'constant' | 'variable' | 'stop_go';
  shockEvents: {
    frequency: number;
    intensity: number;
    description: string;
  }[];
  equipment: {
    name: string;
    weight: number;
    count: number;
  }[];
  personnel: {
    role: string;
    count: number;
    weightPerPerson: number;
  }[];
  totalLoad: number;
  maxAllowedLoad: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  estimatedDamage: number;
}

export interface MissionGroup {
  id: string;
  name: string;
  description: string;
  missions: LoadMission[];
  startTime: number;
  endTime: number;
  totalCycles: number;
  totalLoad: number;
  averageLoad: number;
  maxLoad: number;
  terrainSequence: string[];
  estimatedTotalDamage: number;
  requiredWheels: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  missionProgress: number;
}

export const MISSION_TEMPLATES: LoadMission[] = [
  {
    id: 'mission_transport_grain',
    name: '粮草运输',
    description: '从后方粮仓向前线运输粮草辎重',
    type: 'transport',
    icon: '🌾',
    priority: 'high',
    baseLoad: 800,
    loadVariability: 0.2,
    durationCycles: 50000,
    durationHours: 72,
    terrainIds: ['plain_central', 'hilly_gateway'],
    speedProfile: 'constant',
    shockEvents: [
      { frequency: 0.01, intensity: 1.5, description: '道路坑洼颠簸' },
    ],
    equipment: [
      { name: '粮草麻袋', weight: 50, count: 12 },
      { name: '饮水木桶', weight: 30, count: 4 },
    ],
    personnel: [
      { role: '车夫', count: 1, weightPerPerson: 70 },
      { role: '护卫', count: 2, weightPerPerson: 75 },
    ],
    totalLoad: 800 + 12 * 50 + 4 * 30 + 1 * 70 + 2 * 75,
    maxAllowedLoad: 1200,
    riskLevel: 'medium',
    estimatedDamage: 0.15,
  },
  {
    id: 'mission_combat_charge',
    name: '战场冲锋',
    description: '战车阵列冲锋，伴随激烈冲撞',
    type: 'combat',
    icon: '⚔️',
    priority: 'critical',
    baseLoad: 600,
    loadVariability: 0.5,
    durationCycles: 10000,
    durationHours: 4,
    terrainIds: ['plain_central', 'siege_changan'],
    speedProfile: 'variable',
    shockEvents: [
      { frequency: 0.1, intensity: 3.0, description: '撞击敌方战车' },
      { frequency: 0.05, intensity: 2.5, description: '碾压障碍' },
      { frequency: 0.2, intensity: 2.0, description: '武器格挡冲击' },
    ],
    equipment: [
      { name: '青铜戈', weight: 2, count: 3 },
      { name: '盾牌', weight: 8, count: 3 },
      { name: '箭矢', weight: 1, count: 100 },
    ],
    personnel: [
      { role: '驭手', count: 1, weightPerPerson: 70 },
      { role: '甲士', count: 2, weightPerPerson: 85 },
    ],
    totalLoad: 600 + 3 * 2 + 3 * 8 + 100 * 1 + 1 * 70 + 2 * 85,
    maxAllowedLoad: 900,
    riskLevel: 'extreme',
    estimatedDamage: 0.45,
  },
  {
    id: 'mission_patrol_border',
    name: '边境巡逻',
    description: '沿边境线例行巡逻，路况复杂多变',
    type: 'patrol',
    icon: '🛡️',
    priority: 'medium',
    baseLoad: 400,
    loadVariability: 0.1,
    durationCycles: 80000,
    durationHours: 120,
    terrainIds: ['plain_central', 'desert_gobi', 'hilly_gateway'],
    speedProfile: 'stop_go',
    shockEvents: [
      { frequency: 0.03, intensity: 1.8, description: '突发状况急停' },
    ],
    equipment: [
      { name: '侦察望远镜', weight: 1, count: 1 },
      { name: '信号旗', weight: 0.5, count: 5 },
      { name: '应急补给', weight: 20, count: 2 },
    ],
    personnel: [
      { role: '斥候', count: 2, weightPerPerson: 70 },
    ],
    totalLoad: 400 + 1 * 1 + 5 * 0.5 + 2 * 20 + 2 * 70,
    maxAllowedLoad: 700,
    riskLevel: 'low',
    estimatedDamage: 0.08,
  },
  {
    id: 'mission_siege_assault',
    name: '攻城作战',
    description: '参与城市攻防战，面对壕沟、拒马等人工障碍',
    type: 'combat',
    icon: '🏰',
    priority: 'critical',
    baseLoad: 700,
    loadVariability: 0.4,
    durationCycles: 15000,
    durationHours: 8,
    terrainIds: ['siege_changan'],
    speedProfile: 'stop_go',
    shockEvents: [
      { frequency: 0.15, intensity: 3.5, description: '撞击城门/城墙' },
      { frequency: 0.25, intensity: 2.8, description: '碾压拒马鹿砦' },
      { frequency: 0.3, intensity: 2.2, description: '落石/滚木冲击' },
    ],
    equipment: [
      { name: '攻城锤', weight: 100, count: 1 },
      { name: '登城梯', weight: 30, count: 2 },
      { name: '防护盾牌', weight: 10, count: 5 },
    ],
    personnel: [
      { role: '驭手', count: 1, weightPerPerson: 70 },
      { role: '攻城兵', count: 3, weightPerPerson: 80 },
    ],
    totalLoad: 700 + 1 * 100 + 2 * 30 + 5 * 10 + 1 * 70 + 3 * 80,
    maxAllowedLoad: 1000,
    riskLevel: 'extreme',
    estimatedDamage: 0.6,
  },
  {
    id: 'mission_retreat_rapid',
    name: '快速撤退',
    description: '战况不利时的紧急撤退，高速行驶',
    type: 'retreat',
    icon: '🏃',
    priority: 'high',
    baseLoad: 300,
    loadVariability: 0.15,
    durationCycles: 30000,
    durationHours: 24,
    terrainIds: ['hilly_gateway', 'mountain_qi'],
    speedProfile: 'variable',
    shockEvents: [
      { frequency: 0.08, intensity: 2.0, description: '紧急制动' },
      { frequency: 0.04, intensity: 2.5, description: '规避障碍急转' },
    ],
    equipment: [
      { name: '辎重物资', weight: 50, count: 4 },
      { name: '应急医药', weight: 10, count: 2 },
    ],
    personnel: [
      { role: '驭手', count: 1, weightPerPerson: 70 },
      { role: '伤员', count: 2, weightPerPerson: 70 },
    ],
    totalLoad: 300 + 4 * 50 + 2 * 10 + 1 * 70 + 2 * 70,
    maxAllowedLoad: 600,
    riskLevel: 'high',
    estimatedDamage: 0.25,
  },
];

export interface FailureEvent {
  id: string;
  timestamp: number;
  cycle: number;
  type: 'spoke_fracture' | 'hub_failure' | 'rim_failure' | 'fatigue_cumulative';
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  description: string;
  affectedComponents: string[];
  rootCause: string;
  contributingFactors: string[];
  immediateActions: string[];
  forceAtFailure: number;
  stressAtFailure: number;
  damageAtFailure: number;
  temperatureAtFailure?: number;
  roadConditionAtFailure: string;
  loadAtFailure: number;
  speedAtFailure?: number;
}

export interface FailurePlaybackSession {
  id: string;
  wheelId: string;
  startTime: number;
  endTime: number;
  totalCycles: number;
  failureEvents: FailureEvent[];
  timeSeriesData: TimeSeriesDataPoint[];
  evolutionStates: DamageEvolutionState[];
  currentPlaybackTime: number;
  currentCycle: number;
  isPlaying: boolean;
  playbackSpeed: number;
  playbackDirection: 'forward' | 'reverse';
  keyFrames: {
    cycle: number;
    timestamp: number;
    label: string;
    description: string;
  }[];
}

export interface OptimizationParameter {
  id: string;
  name: string;
  description: string;
  parameterType: 'material' | 'geometry' | 'structural' | 'process';
  currentValue: number | string;
  minValue: number;
  maxValue: number;
  step: number;
  unit: string;
  options?: string[];
  weight: number;
  isConstrained: boolean;
  constraintDescription?: string;
}

export interface OptimizationObjective {
  id: string;
  name: string;
  description: string;
  target: 'minimize' | 'maximize';
  currentValue: number;
  targetValue: number;
  unit: string;
  weight: number;
  isPrimary: boolean;
}

export interface OptimizationConstraint {
  id: string;
  name: string;
  description: string;
  type: 'max_force' | 'max_stress' | 'min_safety_factor' | 'max_damage' | 'min_life' | 'max_cost' | 'max_weight';
  limitValue: number;
  currentValue: number;
  unit: string;
  isViolated: boolean;
  violationAmount: number;
}

export interface StructuralOptimizationScheme {
  id: string;
  name: string;
  description: string;
  type: 'material' | 'geometry' | 'structural' | 'process' | 'comprehensive';
  baseParameters: WheelParameters;
  optimizedParameters: WheelParameters;
  parameterChanges: {
    parameterId: string;
    parameterName: string;
    oldValue: number | string;
    newValue: number | string;
    changePercent: number;
    isBetter: boolean;
  }[];
  objectives: OptimizationObjective[];
  constraints: OptimizationConstraint[];
  baseSimulationResult: SimulationResult;
  optimizedSimulationResult: SimulationResult;
  improvementMetrics: {
    metric: string;
    before: number;
    after: number;
    improvement: number;
    improvementPercent: number;
    unit: string;
    isBetter: boolean;
  }[];
  overallImprovement: number;
  feasibilityScore: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  estimatedCost: number;
  estimatedTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  createdAt: number;
}

export interface DecisionCriteria {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'cost' | 'reliability' | 'maintainability' | 'strategic';
  weight: number;
  unit?: string;
  higherIsBetter: boolean;
}

export const DECISION_CRITERIA: DecisionCriteria[] = [
  {
    id: 'max_force_reduction',
    name: '最大受力降低',
    description: '优化后最大轮辐受力的降低幅度',
    category: 'performance',
    weight: 15,
    unit: '%',
    higherIsBetter: true,
  },
  {
    id: 'safety_factor_improvement',
    name: '安全系数提升',
    description: '安全系数的提升程度',
    category: 'reliability',
    weight: 20,
    unit: 'x',
    higherIsBetter: true,
  },
  {
    id: 'life_extension',
    name: '寿命延长',
    description: '疲劳寿命的延长比例',
    category: 'reliability',
    weight: 18,
    unit: '%',
    higherIsBetter: true,
  },
  {
    id: 'damage_reduction',
    name: '损伤降低',
    description: '累积损伤的降低幅度',
    category: 'reliability',
    weight: 12,
    unit: '%',
    higherIsBetter: true,
  },
  {
    id: 'implementation_cost',
    name: '实施成本',
    description: '方案实施的预估成本',
    category: 'cost',
    weight: 10,
    unit: '钱',
    higherIsBetter: false,
  },
  {
    id: 'weight_effect',
    name: '重量变化',
    description: '车轮总重量的变化',
    category: 'performance',
    weight: 8,
    unit: 'kg',
    higherIsBetter: false,
  },
  {
    id: 'maintainability',
    name: '可维护性',
    description: '日常维护的便捷程度',
    category: 'maintainability',
    weight: 7,
    unit: '分',
    higherIsBetter: true,
  },
  {
    id: 'strategic_value',
    name: '战略价值',
    description: '对整体战术能力的提升',
    category: 'strategic',
    weight: 10,
    unit: '分',
    higherIsBetter: true,
  },
];

export interface SchemeScore {
  schemeId: string;
  schemeName: string;
  criteriaScores: {
    criteriaId: string;
    criteriaName: string;
    rawValue: number;
    normalizedScore: number;
    weightedScore: number;
  }[];
  totalScore: number;
  maxPossibleScore: number;
  normalizedTotalScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  rank: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface MultiSchemeDecisionResult {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  schemes: StructuralOptimizationScheme[];
  scores: SchemeScore[];
  criteria: DecisionCriteria[];
  recommendedSchemeId: string;
  comparisonMatrix: number[][];
  sensitivityAnalysis: {
    criteriaId: string;
    weightChange: number;
    rankChange: number;
  }[];
  conclusion: string;
}

export interface CombatMissionScenario {
  id: string;
  name: string;
  description: string;
  historicalReference: string;
  year: number;
  belligerents: string[];
  terrain: BattlefieldTerrain;
  missionGroup: MissionGroup;
  wheelConfiguration: WheelParameters;
  expectedOutcome: {
    successProbability: number;
    expectedDamage: number;
    expectedCasualties: number;
    estimatedDuration: number;
  };
  alternativeConfigurations: {
    name: string;
    parameters: WheelParameters;
    successProbability: number;
    advantage: string;
    disadvantage: string;
  }[];
  strategicNotes: string[];
}

export const COMBAT_SCENARIOS: CombatMissionScenario[] = [
  {
    id: 'scenario_chengpu',
    name: '城濮之战',
    description: '公元前632年晋楚争霸的决定性战役，战车大规模作战的经典战例',
    historicalReference: '《左传·僖公二十八年》',
    year: -632,
    belligerents: ['晋国', '楚国'],
    terrain: BATTLEFIELD_TERRAINS[0],
    missionGroup: {
      id: 'mg_chengpu',
      name: '城濮战役编组',
      description: '晋军上中下三军战车编组',
      missions: [MISSION_TEMPLATES[1], MISSION_TEMPLATES[3]],
      startTime: Date.now(),
      endTime: Date.now() + 8 * 60 * 60 * 1000,
      totalCycles: 25000,
      totalLoad: 700,
      averageLoad: 650,
      maxLoad: 900,
      terrainSequence: ['plain_central'],
      estimatedTotalDamage: 0.55,
      requiredWheels: 2800,
      status: 'planned',
      missionProgress: 0,
    },
    wheelConfiguration: {
      wheelRadius: 1.2,
      spokeCount: 18,
      axleLoad: 700,
      impactIntensity: 3.0,
      materialId: 'oak',
      spokeWidth: 0.06,
      spokeHeight: 0.08,
      roadConditionId: 'rough',
      operatingCycles: 25000,
    },
    expectedOutcome: {
      successProbability: 0.65,
      expectedDamage: 0.55,
      expectedCasualties: 30,
      estimatedDuration: 8,
    },
    alternativeConfigurations: [
      {
        name: '轻装突击型',
        parameters: {
          wheelRadius: 1.0,
          spokeCount: 12,
          axleLoad: 500,
          impactIntensity: 2.5,
          materialId: 'elm',
          spokeWidth: 0.05,
          spokeHeight: 0.07,
          roadConditionId: 'gravel',
          operatingCycles: 25000,
        },
        successProbability: 0.58,
        advantage: '机动性强，速度快',
        disadvantage: '防护力弱，易损坏',
      },
      {
        name: '重装攻坚型',
        parameters: {
          wheelRadius: 1.4,
          spokeCount: 24,
          axleLoad: 900,
          impactIntensity: 3.5,
          materialId: 'iron',
          spokeWidth: 0.07,
          spokeHeight: 0.10,
          roadConditionId: 'cobbles',
          operatingCycles: 25000,
        },
        successProbability: 0.72,
        advantage: '防护力强，冲击力大',
        disadvantage: '机动性差，油耗高',
      },
    ],
    strategicNotes: [
      '城濮之战晋军采用"退避三舍"策略，诱敌深入',
      '战车分为上中下三军，协同作战',
      '楚军轻敌冒进，被晋军分割歼灭',
    ],
  },
  {
    id: 'scenario_changping',
    name: '长平之战',
    description: '公元前260年秦赵长平之战，古代最大规模的围歼战',
    historicalReference: '《史记·白起王翦列传》',
    year: -260,
    belligerents: ['秦国', '赵国'],
    terrain: BATTLEFIELD_TERRAINS[1],
    missionGroup: {
      id: 'mg_changping',
      name: '长平战役编组',
      description: '秦军包围歼灭作战',
      missions: [MISSION_TEMPLATES[3], MISSION_TEMPLATES[4]],
      startTime: Date.now(),
      endTime: Date.now() + 24 * 60 * 60 * 1000,
      totalCycles: 45000,
      totalLoad: 800,
      averageLoad: 750,
      maxLoad: 1000,
      terrainSequence: ['hilly_gateway', 'mountain_qi'],
      estimatedTotalDamage: 0.7,
      requiredWheels: 3200,
      status: 'planned',
      missionProgress: 0,
    },
    wheelConfiguration: {
      wheelRadius: 1.3,
      spokeCount: 20,
      axleLoad: 800,
      impactIntensity: 3.5,
      materialId: 'oak',
      spokeWidth: 0.065,
      spokeHeight: 0.09,
      roadConditionId: 'rough',
      operatingCycles: 45000,
    },
    expectedOutcome: {
      successProbability: 0.75,
      expectedDamage: 0.7,
      expectedCasualties: 45,
      estimatedDuration: 24,
    },
    alternativeConfigurations: [
      {
        name: '山地机动型',
        parameters: {
          wheelRadius: 1.1,
          spokeCount: 16,
          axleLoad: 600,
          impactIntensity: 3.0,
          materialId: 'ash',
          spokeWidth: 0.06,
          spokeHeight: 0.08,
          roadConditionId: 'rough',
          operatingCycles: 45000,
        },
        successProbability: 0.68,
        advantage: '山地适应性好，转向灵活',
        disadvantage: '载重量有限',
      },
    ],
    strategicNotes: [
      '白起采用诱敌深入、分割包围的战术',
      '地形复杂，战车机动受限',
      '赵军被围46天，最终投降',
    ],
  },
];

