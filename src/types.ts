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
