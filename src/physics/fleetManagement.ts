import {
  WheelServiceRecord,
  WheelIdentity,
  ServicePhase,
  ServicePhaseRecord,
  FaultRecord,
  FaultType,
  FaultSeverity,
  FaultPatternAnalysis,
  MaintenanceTask,
  MaintenanceSchedule,
  LifePredictionResult,
  LifePredictionPoint,
  Warning,
  Technician,
  Equipment,
  ResourceSchedule,
  ResourceAllocation,
  SparePart,
  SparePartConsumption,
  SparePartAnalysis,
  Vehicle,
  Fleet,
  FleetOperationData,
  FleetKPI,
  SimulationResult,
  SERVICE_PHASE_LABELS,
} from '../types';

const generateId = (): string => Math.random().toString(36).substring(2, 15);

const WHEEL_POSITIONS = ['front_left', 'front_right', 'rear_left', 'rear_right'] as const;

const VEHICLE_TYPES = ['战车', '辎重车', '指挥车', '侦察车', '运输车'];

const FAULT_TYPES: FaultType[] = ['spoke_crack', 'hub_looseness', 'rim_deformation'];

const FAULT_SEVERITIES: FaultSeverity[] = ['mild', 'moderate', 'severe', 'critical'];

const FAULT_DESCRIPTIONS: Record<FaultType, string[]> = {
  spoke_crack: [
    '轮辐根部出现微小裂纹',
    '轮辐中部裂纹扩展',
    '轮辐边缘疲劳开裂',
    '多根轮辐同时出现裂纹',
  ],
  hub_looseness: [
    '轮毂螺栓轻微松动',
    '轮毂间隙增大，运转有异响',
    '轮毂严重松动，跳动明显',
    '轮毂轴承失效，濒临脱落',
  ],
  rim_deformation: [
    '轮辋轻微径向跳动',
    '轮辋侧向变形，影响平衡',
    '轮辋严重变形，漏气风险',
    '轮辋断裂，需立即更换',
  ],
};

const ROAD_CONDITIONS = ['夯土路面', '碎石路面', '泥泞路面', '石板路面', '崎岖山道'];

const WEATHER_CONDITIONS = ['晴朗', '多云', '小雨', '暴雨', '高温', '严寒'];

const OPERATOR_NOTES = [
  '行驶时感觉轻微颠簸',
  '转弯时异响明显',
  '高速行驶时振动加剧',
  '起步时听到咔哒声',
  '例行检查时发现',
];

export function generateWheelIdentity(
  fleetId: string,
  vehicleId: string,
  _position: string,
  materialId: string = 'elm',
  spokeCount: number = 12,
  wheelRadius: number = 1.0
): WheelIdentity {
  const now = Date.now();
  const randomOffset = Math.random() * 365 * 24 * 60 * 60 * 1000;
  return {
    id: generateId(),
    serialNumber: `WH-${fleetId.slice(0, 4).toUpperCase()}-${vehicleId.slice(0, 4).toUpperCase()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    vehicleId,
    fleetId,
    manufactureDate: now - randomOffset,
    installationDate: now - randomOffset * 0.5,
    materialId,
    spokeCount,
    wheelRadius,
  };
}

export function determineServicePhase(
  totalCycles: number,
  healthScore: number,
  _maxCycles: number = 1000000
): ServicePhase {
  const cycleRatio = totalCycles / 1000000;

  if (healthScore < 20) return 'retired';
  if (healthScore < 40) return 'critical';
  if (healthScore < 60) return 'wear_period';
  if (cycleRatio < 0.05) return 'new';
  if (cycleRatio < 0.15) return 'running_in';
  return 'normal_service';
}

export function generateWheelServiceRecord(
  identity: WheelIdentity,
  simResult?: SimulationResult
): WheelServiceRecord {
  const baseCycles = Math.floor(Math.random() * 800000) + 50000;
  const healthScore = simResult
    ? Math.max(20, Math.min(95, 100 - simResult.fatigueAnalysis.totalDamage * 80 - Math.random() * 10))
    : Math.floor(Math.random() * 60) + 30;

  const phase = determineServicePhase(baseCycles, healthScore);

  const phaseHistory: ServicePhaseRecord[] = [];
  let currentCycles = 0;
  const phases: ServicePhase[] = ['new', 'running_in', 'normal_service', 'wear_period', 'critical'];
  const phaseThresholds = [0.05, 0.15, 0.5, 0.8, 1.0];

  for (let i = 0; i < phases.length; i++) {
    const phaseCycleThreshold = phaseThresholds[i] * baseCycles;
    if (currentCycles < baseCycles) {
      const phaseEndCycles = Math.min(phaseCycleThreshold, baseCycles);
      if (phaseEndCycles > currentCycles) {
        phaseHistory.push({
          id: generateId(),
          phase: phases[i],
          startedAt: identity.installationDate + currentCycles * 10,
          endedAt: phases[i] === phase ? undefined : identity.installationDate + phaseEndCycles * 10,
          mileage: Math.floor(phaseEndCycles * 0.01),
          cycles: phaseEndCycles,
          notes: `${SERVICE_PHASE_LABELS[phases[i]]}阶段记录`,
        });
        currentCycles = phaseEndCycles;
      }
    }
    if (phases[i] === phase) break;
  }

  const maintenanceCount = Math.floor(baseCycles / 50000);
  const repairCount = Math.floor(Math.random() * (maintenanceCount / 2));
  const avgMaintenanceCost = 800 + Math.random() * 1200;

  return {
    identity,
    currentPhase: phase,
    phaseHistory,
    totalMileage: Math.floor(baseCycles * 0.01),
    totalCycles: baseCycles,
    maintenanceCount,
    repairCount,
    totalCost: Math.floor(maintenanceCount * avgMaintenanceCost + repairCount * avgMaintenanceCost * 3),
    currentHealthScore: healthScore,
    lastInspectionDate: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
    nextInspectionDate: Date.now() + (15 + Math.random() * 15) * 24 * 60 * 60 * 1000,
    position: identity.vehicleId.length % 2 === 0 ? WHEEL_POSITIONS[0] : WHEEL_POSITIONS[1],
  };
}

export function generateFaultRecord(
  wheelId: string,
  vehicleId: string,
  fleetId: string,
  totalCycles: number
): FaultRecord {
  const faultType = FAULT_TYPES[Math.floor(Math.random() * FAULT_TYPES.length)];
  const severity = FAULT_SEVERITIES[Math.floor(Math.random() * FAULT_SEVERITIES.length)];
  const descriptions = FAULT_DESCRIPTIONS[faultType];
  const severityIndex = FAULT_SEVERITIES.indexOf(severity);
  const description = descriptions[Math.min(severityIndex, descriptions.length - 1)];

  const detectedAt = Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000;
  const isRepaired = Math.random() > 0.2;
  const repairedAt = isRepaired ? detectedAt + Math.random() * 7 * 24 * 60 * 60 * 1000 : undefined;

  const baseCost = severity === 'critical' ? 5000 : severity === 'severe' ? 2500 : severity === 'moderate' ? 1000 : 300;
  const repairCost = baseCost + Math.random() * baseCost * 0.5;
  const downtimeHours = severity === 'critical' ? 48 : severity === 'severe' ? 24 : severity === 'moderate' ? 8 : 2;

  return {
    id: generateId(),
    wheelId,
    vehicleId,
    fleetId,
    faultType,
    severity,
    detectedAt,
    repairedAt,
    description,
    rootCause: Math.random() > 0.3 ? ['材料疲劳', '冲击损伤', '装配不当', '腐蚀老化'][Math.floor(Math.random() * 4)] : undefined,
    repairAction: isRepaired ? ['更换轮辐', '紧固轮毂', '校正轮辋', '全面大修'][Math.floor(Math.random() * 4)] : undefined,
    repairCost: Math.floor(repairCost),
    downtimeHours: Math.floor(downtimeHours + Math.random() * downtimeHours * 0.5),
    mileageAtFault: Math.floor(totalCycles * 0.01 * (0.8 + Math.random() * 0.4)),
    cyclesAtFault: Math.floor(totalCycles * (0.8 + Math.random() * 0.4)),
    roadCondition: ROAD_CONDITIONS[Math.floor(Math.random() * ROAD_CONDITIONS.length)],
    weatherCondition: WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)],
    operatorNotes: Math.random() > 0.5 ? OPERATOR_NOTES[Math.floor(Math.random() * OPERATOR_NOTES.length)] : undefined,
  };
}

export function analyzeFaultPatterns(faults: FaultRecord[]): FaultPatternAnalysis[] {
  const patternMap = new Map<FaultType, FaultPatternAnalysis>();

  FAULT_TYPES.forEach((type) => {
    const typeFaults = faults.filter((f) => f.faultType === type);
    if (typeFaults.length === 0) return;

    const severityCounts = new Map<FaultSeverity, number>();
    typeFaults.forEach((f) => {
      severityCounts.set(f.severity, (severityCounts.get(f.severity) || 0) + 1);
    });

    let mostCommonSeverity: FaultSeverity = 'mild';
    let maxCount = 0;
    severityCounts.forEach((count, severity) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonSeverity = severity;
      }
    });

    const mileageBuckets = [
      { startMileage: 0, endMileage: 10000, count: 0 },
      { startMileage: 10000, endMileage: 30000, count: 0 },
      { startMileage: 30000, endMileage: 50000, count: 0 },
      { startMileage: 50000, endMileage: 80000, count: 0 },
      { startMileage: 80000, endMileage: 999999, count: 0 },
    ];

    typeFaults.forEach((f) => {
      const bucket = mileageBuckets.find(
        (b) => f.mileageAtFault >= b.startMileage && f.mileageAtFault < b.endMileage
      );
      if (bucket) bucket.count++;
    });

    const seasonMap = new Map<string, number>();
    typeFaults.forEach((f) => {
      const month = new Date(f.detectedAt).getMonth();
      let season: string;
      if (month >= 2 && month <= 4) season = '春季';
      else if (month >= 5 && month <= 7) season = '夏季';
      else if (month >= 8 && month <= 10) season = '秋季';
      else season = '冬季';
      seasonMap.set(season, (seasonMap.get(season) || 0) + 1);
    });

    const seasonalTrends = Array.from(seasonMap.entries()).map(([season, count]) => ({
      season,
      count,
    }));

    patternMap.set(type, {
      faultType: type,
      totalCount: typeFaults.length,
      averageRepairCost: typeFaults.reduce((sum, f) => sum + f.repairCost, 0) / typeFaults.length,
      averageDowntime: typeFaults.reduce((sum, f) => sum + f.downtimeHours, 0) / typeFaults.length,
      mostCommonSeverity,
      highRiskPeriods: mileageBuckets.filter((b) => b.count > 0),
      seasonalTrends,
    });
  });

  return Array.from(patternMap.values());
}

export function generateMaintenanceTasks(
  wheels: WheelServiceRecord[],
  count: number = 20
): MaintenanceTask[] {
  const tasks: MaintenanceTask[] = [];
  const taskTypes: MaintenanceTask['taskType'][] = ['inspection', 'preventive', 'corrective', 'overhaul'];
  const taskTitles: Record<MaintenanceTask['taskType'], string[]> = {
    inspection: ['例行安全检查', '轮辐张力检测', '轮毂间隙检查', '轮辋跳动测量', '整体结构检测'],
    preventive: ['定期润滑保养', '轮辐预紧调整', '轮毂螺栓紧固', '防腐防锈处理', '平衡校准'],
    corrective: ['裂纹修复', '变形校正', '松动部件紧固', '磨损件更换', '故障排查修复'],
    overhaul: ['全面拆解检修', '轮辐更换', '轮毂总成更换', '轮辋更换', '整轮翻新'],
  };

  const statuses: MaintenanceTask['status'][] = ['scheduled', 'in_progress', 'completed', 'overdue'];

  for (let i = 0; i < count; i++) {
    const wheel = wheels[Math.floor(Math.random() * wheels.length)];
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const titles = taskTitles[taskType];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const scheduledDate = Date.now() + (i - 5) * 3 * 24 * 60 * 60 * 1000;
    const dueDate = scheduledDate + 7 * 24 * 60 * 60 * 1000;
    const completedDate = status === 'completed' ? scheduledDate + Math.random() * 3 * 24 * 60 * 60 * 1000 : undefined;

    const priority: MaintenanceTask['priority'] = taskType === 'corrective'
      ? ['high', 'critical'][Math.floor(Math.random() * 2)] as 'high' | 'critical'
      : taskType === 'overhaul'
      ? 'high'
      : ['low', 'medium'][Math.floor(Math.random() * 2)] as 'low' | 'medium';

    const estimatedDurationHours = taskType === 'overhaul'
      ? 8 + Math.random() * 16
      : taskType === 'corrective'
      ? 2 + Math.random() * 6
      : 1 + Math.random() * 3;

    const parts = generateRequiredParts(taskType);

    tasks.push({
      id: generateId(),
      wheelId: wheel.identity.id,
      vehicleId: wheel.identity.vehicleId,
      fleetId: wheel.identity.fleetId,
      taskType,
      title,
      description: `${title} - ${wheel.identity.serialNumber}`,
      scheduledDate,
      dueDate,
      completedDate,
      status,
      priority,
      estimatedDurationHours: Math.round(estimatedDurationHours * 10) / 10,
      actualDurationHours: status === 'completed' ? Math.round(estimatedDurationHours * (0.8 + Math.random() * 0.5) * 10) / 10 : undefined,
      assignedTechnician: status !== 'scheduled' ? ['张师傅', '李师傅', '王师傅', '赵师傅'][Math.floor(Math.random() * 4)] : undefined,
      requiredParts: parts,
      costEstimate: Math.round((50 + estimatedDurationHours * 150 + parts.reduce((s, p) => s + p.quantity * 100, 0)) * 100) / 100,
      actualCost: status === 'completed' ? Math.round((50 + estimatedDurationHours * 150 + parts.reduce((s, p) => s + p.quantity * 100, 0)) * (0.9 + Math.random() * 0.3) * 100) / 100 : undefined,
    });
  }

  return tasks.sort((a, b) => a.scheduledDate - b.scheduledDate);
}

function generateRequiredParts(taskType: MaintenanceTask['taskType']): { partId: string; partName: string; quantity: number }[] {
  const partPool = [
    { id: 'spoke_elm', name: '榆木轮辐' },
    { id: 'spoke_oak', name: '橡木轮辐' },
    { id: 'hub_bearing', name: '轮毂轴承' },
    { id: 'hub_bolt', name: '轮毂螺栓' },
    { id: 'rim_iron', name: '铁制轮辋' },
    { id: 'fastener', name: '紧固件套件' },
    { id: 'lubricant', name: '专用润滑油' },
    { id: 'sealant', name: '密封胶' },
  ];

  const parts: { partId: string; partName: string; quantity: number }[] = [];
  const numParts = taskType === 'overhaul' ? 3 + Math.floor(Math.random() * 3) : taskType === 'corrective' ? 1 + Math.floor(Math.random() * 3) : Math.floor(Math.random() * 2);

  const shuffled = [...partPool].sort(() => Math.random() - 0.5);
  for (let i = 0; i < numParts && i < shuffled.length; i++) {
    parts.push({
      partId: shuffled[i].id,
      partName: shuffled[i].name,
      quantity: 1 + Math.floor(Math.random() * (taskType === 'overhaul' ? 12 : 4)),
    });
  }

  return parts;
}

export function generateMaintenanceSchedule(tasks: MaintenanceTask[]): MaintenanceSchedule {
  const now = Date.now();
  const weekStart = now - (new Date(now).getDay() * 24 * 60 * 60 * 1000);
  const weeklySchedule: { date: number; tasks: MaintenanceTask[] }[] = [];

  for (let i = 0; i < 14; i++) {
    const day = weekStart + i * 24 * 60 * 60 * 1000;
    const dayStart = new Date(day).setHours(0, 0, 0, 0);
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const dayTasks = tasks.filter((t) => t.scheduledDate >= dayStart && t.scheduledDate < dayEnd);
    weeklySchedule.push({ date: dayStart, tasks: dayTasks });
  }

  const monthStart = now - new Date(now).getDate() * 24 * 60 * 60 * 1000;
  const monthEnd = monthStart + 30 * 24 * 60 * 60 * 1000;
  const monthTasks = tasks.filter((t) => t.scheduledDate >= monthStart && t.scheduledDate < monthEnd);

  return {
    tasks,
    weeklySchedule,
    monthlySummary: {
      totalTasks: monthTasks.length,
      completedTasks: monthTasks.filter((t) => t.status === 'completed').length,
      overdueTasks: monthTasks.filter((t) => t.status === 'overdue').length,
      estimatedCost: monthTasks.reduce((sum, t) => sum + t.costEstimate, 0),
      actualCost: monthTasks.reduce((sum, t) => sum + (t.actualCost || 0), 0),
    },
  };
}

export function predictLife(
  wheel: WheelServiceRecord,
  simResult?: SimulationResult
): LifePredictionResult {
  const currentHealth = wheel.currentHealthScore;
  const totalCycles = wheel.totalCycles;

  let degradationRate = 0.0001;
  if (simResult) {
    degradationRate += simResult.fatigueAnalysis.totalDamage * 0.00005;
    degradationRate *= simResult.roadCondition.impactMultiplier;
  }

  const criticalHealth = 20;
  const healthToDegrade = currentHealth - criticalHealth;
  const predictedRemainingCycles = Math.floor(healthToDegrade / degradationRate);
  const cyclesPerDay = 1000 + Math.random() * 2000;
  const predictedRemainingDays = predictedRemainingCycles / cyclesPerDay;

  const predictionCurve: LifePredictionPoint[] = [];
  const stepCycles = Math.max(10000, Math.floor(predictedRemainingCycles / 20));

  for (let i = 0; i <= 20; i++) {
    const cycles = totalCycles + i * stepCycles;
    const predictedHealth = Math.max(0, currentHealth - i * stepCycles * degradationRate);
    const uncertainty = 5 + i * 2;

    let riskLevel: LifePredictionPoint['riskLevel'] = 'low';
    if (predictedHealth < 30) riskLevel = 'critical';
    else if (predictedHealth < 50) riskLevel = 'high';
    else if (predictedHealth < 70) riskLevel = 'medium';

    predictionCurve.push({
      cycles,
      predictedHealthScore: Math.round(predictedHealth * 10) / 10,
      lowerBound: Math.max(0, Math.round((predictedHealth - uncertainty) * 10) / 10),
      upperBound: Math.min(100, Math.round((predictedHealth + uncertainty) * 10) / 10),
      riskLevel,
    });

    if (predictedHealth <= criticalHealth) break;
  }

  const warnings: Warning[] = [];

  if (currentHealth < 40) {
    warnings.push({
      id: generateId(),
      wheelId: wheel.identity.id,
      vehicleId: wheel.identity.vehicleId,
      type: 'health',
      level: 'critical',
      message: `车轮健康度已降至 ${currentHealth}%，建议立即安排大修或更换`,
      triggeredAt: Date.now(),
      acknowledged: false,
    });
  } else if (currentHealth < 60) {
    warnings.push({
      id: generateId(),
      wheelId: wheel.identity.id,
      vehicleId: wheel.identity.vehicleId,
      type: 'health',
      level: 'warning',
      message: `车轮健康度 ${currentHealth}%，建议尽快安排预防性维护`,
      triggeredAt: Date.now(),
      acknowledged: false,
    });
  }

  if (predictedRemainingDays < 30) {
    warnings.push({
      id: generateId(),
      wheelId: wheel.identity.id,
      vehicleId: wheel.identity.vehicleId,
      type: 'life',
      level: 'critical',
      message: `预测剩余寿命不足 30 天，请提前备料并安排更换计划`,
      triggeredAt: Date.now(),
      acknowledged: false,
    });
  } else if (predictedRemainingDays < 90) {
    warnings.push({
      id: generateId(),
      wheelId: wheel.identity.id,
      vehicleId: wheel.identity.vehicleId,
      type: 'life',
      level: 'warning',
      message: `预测剩余寿命约 ${Math.round(predictedRemainingDays)} 天，请规划后续维护方案`,
      triggeredAt: Date.now(),
      acknowledged: false,
    });
  }

  const keyFactors = [];
  if (simResult) {
    keyFactors.push({
      factor: '路况冲击',
      impact: simResult.roadCondition.impactMultiplier,
      description: `当前${simResult.roadCondition.name}路况冲击系数 ${simResult.roadCondition.impactMultiplier}x，${simResult.roadCondition.impactMultiplier > 1.2 ? '加速老化' : '影响较小'}`,
    });
    keyFactors.push({
      factor: '疲劳损伤',
      impact: simResult.fatigueAnalysis.totalDamage,
      description: `累积疲劳损伤 ${simResult.fatigueAnalysis.totalDamage.toFixed(3)}，${simResult.fatigueAnalysis.totalDamage > 0.5 ? '已接近临界值' : '处于可控范围'}`,
    });
  }

  keyFactors.push({
    factor: '维护频率',
    impact: wheel.maintenanceCount / Math.max(1, wheel.totalCycles / 100000),
    description: `已完成 ${wheel.maintenanceCount} 次维护，${wheel.maintenanceCount < 5 ? '维护不足，建议增加频次' : '维护记录良好'}`,
  });

  const recommendations = [];
  if (currentHealth < 60) {
    recommendations.push('立即安排全面检修，评估是否需要大修');
    recommendations.push('减少高冲击路况使用，降低负载');
  } else if (currentHealth < 80) {
    recommendations.push('按计划进行预防性维护');
    recommendations.push('增加检查频次，密切关注健康趋势');
  } else {
    recommendations.push('保持现有维护计划');
    recommendations.push('持续监控运行数据');
  }

  return {
    wheelId: wheel.identity.id,
    currentHealthScore: currentHealth,
    predictedRemainingCycles,
    predictedRemainingMileage: Math.floor(predictedRemainingCycles * 0.01),
    predictedEndOfLifeDate: Date.now() + predictedRemainingDays * 24 * 60 * 60 * 1000,
    confidenceInterval: {
      lower: Math.floor(predictedRemainingCycles * 0.7),
      upper: Math.floor(predictedRemainingCycles * 1.3),
    },
    predictionCurve,
    warnings,
    keyFactors,
    recommendations,
  };
}

export function generateTechnicians(count: number = 6): Technician[] {
  const names = ['张伟', '李明', '王强', '赵刚', '刘洋', '陈军'];
  const skillLevels: Technician['skillLevel'][] = ['junior', 'intermediate', 'senior', 'expert'];
  const specialties = [
    ['轮辐修复', '结构加固'],
    ['轮毂检修', '轴承更换'],
    ['轮辋校正', '平衡调校'],
    ['电气检测', '故障诊断'],
    ['综合维修', '项目管理'],
    ['质量检验', '技术培训'],
  ];

  return names.slice(0, count).map((name, i) => ({
    id: generateId(),
    name,
    skillLevel: skillLevels[Math.min(Math.floor(i / 1.5), 3)],
    specialties: specialties[i % specialties.length],
    hourlyRate: [100, 150, 220, 350][Math.min(Math.floor(i / 1.5), 3)],
    available: Math.random() > 0.2,
    currentWorkload: Math.round((20 + Math.random() * 60) * 10) / 10,
  }));
}

export function generateEquipment(count: number = 8): Equipment[] {
  const equipmentList = [
    { name: '轮辐压力试验机', type: '检测设备' },
    { name: '轮毂扭矩扳手', type: '工具' },
    { name: '轮辋跳动检测仪', type: '检测设备' },
    { name: '液压千斤顶', type: '起重设备' },
    { name: '振动分析仪', type: '检测设备' },
    { name: '超声波探伤仪', type: '检测设备' },
    { name: '轮辐更换工装', type: '工装夹具' },
    { name: '动平衡机', type: '校准设备' },
  ];

  return equipmentList.slice(0, count).map((eq, i) => ({
    id: generateId(),
    name: eq.name,
    type: eq.type,
    available: Math.random() > 0.15,
    maintenanceSchedule: [
      { date: Date.now() + (30 + i * 10) * 24 * 60 * 60 * 1000, description: '例行校准' },
    ],
  }));
}

export function generateResourceSchedule(
  tasks: MaintenanceTask[],
  technicians: Technician[],
  days: number = 7
): ResourceSchedule[] {
  const schedules: ResourceSchedule[] = [];
  const availableTechs = technicians.filter((t) => t.available);

  for (let day = 0; day < days; day++) {
    const date = Date.now() + day * 24 * 60 * 60 * 1000;
    const dayStart = new Date(date).setHours(0, 0, 0, 0);
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const dayTasks = tasks.filter(
      (t) => t.scheduledDate >= dayStart && t.scheduledDate < dayEnd && t.status !== 'completed' && t.status !== 'cancelled'
    );

    const allocations: ResourceAllocation[] = [];
    let totalAllocatedHours = 0;
    const totalAvailableHours = availableTechs.length * 8;

    let taskStartTime = new Date(date).setHours(8, 0, 0, 0);

    dayTasks.forEach((task, taskIdx) => {
      const techIdx = taskIdx % availableTechs.length;
      const tech = availableTechs[techIdx];
      const duration = task.estimatedDurationHours * 60 * 60 * 1000;

      allocations.push({
        taskId: task.id,
        technicianId: tech.id,
        equipmentIds: [techIdx % 3 === 0 ? 'eq_1' : 'eq_2'],
        startTime: taskStartTime,
        endTime: taskStartTime + duration,
        status: 'planned',
      });

      totalAllocatedHours += task.estimatedDurationHours;
      taskStartTime += duration + 30 * 60 * 1000;
    });

    schedules.push({
      date: dayStart,
      allocations,
      totalAvailableHours,
      totalAllocatedHours: Math.round(totalAllocatedHours * 10) / 10,
      utilizationRate: totalAvailableHours > 0 ? Math.round((totalAllocatedHours / totalAvailableHours) * 1000) / 10 : 0,
    });
  }

  return schedules;
}

export function generateSpareParts(): SparePart[] {
  const parts: Omit<SparePart, 'id'>[] = [
    { name: '榆木轮辐', category: 'spoke', unit: '根', unitCost: 120, currentStock: 48, minimumStock: 20, maximumStock: 100, leadTimeDays: 7, supplier: '古木工坊' },
    { name: '橡木轮辐', category: 'spoke', unit: '根', unitCost: 150, currentStock: 36, minimumStock: 15, maximumStock: 80, leadTimeDays: 7, supplier: '古木工坊' },
    { name: '白蜡木轮辐', category: 'spoke', unit: '根', unitCost: 135, currentStock: 24, minimumStock: 15, maximumStock: 60, leadTimeDays: 10, supplier: '古木工坊' },
    { name: '铸铁轮毂', category: 'hub', unit: '个', unitCost: 850, currentStock: 8, minimumStock: 5, maximumStock: 20, leadTimeDays: 14, supplier: '铸铁工坊' },
    { name: '轮毂轴承套件', category: 'hub', unit: '套', unitCost: 320, currentStock: 12, minimumStock: 8, maximumStock: 30, leadTimeDays: 10, supplier: '精密五金' },
    { name: '轮毂螺栓套装', category: 'fastener', unit: '套', unitCost: 85, currentStock: 60, minimumStock: 30, maximumStock: 100, leadTimeDays: 5, supplier: '精密五金' },
    { name: '铁制轮辋', category: 'rim', unit: '个', unitCost: 680, currentStock: 10, minimumStock: 5, maximumStock: 25, leadTimeDays: 14, supplier: '铸铁工坊' },
    { name: '轮辋密封胶', category: 'material', unit: '管', unitCost: 45, currentStock: 25, minimumStock: 15, maximumStock: 50, leadTimeDays: 3, supplier: '材料商行' },
    { name: '专用润滑油', category: 'material', unit: '升', unitCost: 65, currentStock: 18, minimumStock: 10, maximumStock: 40, leadTimeDays: 5, supplier: '材料商行' },
    { name: '防腐涂层', category: 'material', unit: '罐', unitCost: 120, currentStock: 8, minimumStock: 5, maximumStock: 20, leadTimeDays: 7, supplier: '材料商行' },
  ];

  return parts.map((p) => ({
    ...p,
    id: generateId(),
    lastRestockDate: Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
  }));
}

export function generateSparePartConsumptions(
  parts: SparePart[],
  tasks: MaintenanceTask[],
  count: number = 50
): SparePartConsumption[] {
  const consumptions: SparePartConsumption[] = [];

  for (let i = 0; i < count; i++) {
    const part = parts[Math.floor(Math.random() * parts.length)];
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    const usedAt = Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000;

    consumptions.push({
      id: generateId(),
      partId: part.id,
      partName: part.name,
      quantity: 1 + Math.floor(Math.random() * 5),
      usedAt,
      usedIn: task.title,
      wheelId: task.wheelId,
      vehicleId: task.vehicleId,
      cost: Math.round((1 + Math.random() * 5) * part.unitCost * 100) / 100,
    });
  }

  return consumptions.sort((a, b) => b.usedAt - a.usedAt);
}

export function analyzeSpareParts(
  parts: SparePart[],
  consumptions: SparePartConsumption[]
): SparePartAnalysis[] {
  return parts.map((part) => {
    const partConsumptions = consumptions.filter((c) => c.partId === part.id);
    const totalConsumed = partConsumptions.reduce((sum, c) => sum + c.quantity, 0);
    const totalCost = partConsumptions.reduce((sum, c) => sum + c.cost, 0);

    const monthlyMap = new Map<string, { quantity: number; cost: number }>();
    partConsumptions.forEach((c) => {
      const date = new Date(c.usedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyMap.get(monthKey) || { quantity: 0, cost: 0 };
      existing.quantity += c.quantity;
      existing.cost += c.cost;
      monthlyMap.set(monthKey, existing);
    });

    const monthlyConsumption = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month,
        quantity: data.quantity,
        cost: Math.round(data.cost * 100) / 100,
      }));

    const avgMonthlyConsumption = monthlyConsumption.length > 0
      ? monthlyConsumption.reduce((sum, m) => sum + m.quantity, 0) / monthlyConsumption.length
      : 0;

    const predictedConsumption = [];
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      predictedConsumption.push({
        month: `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`,
        predictedQuantity: Math.round(avgMonthlyConsumption * (0.9 + Math.random() * 0.3) * 10) / 10,
      });
    }

    const turnoverRate = part.currentStock > 0 ? (totalConsumed / 6) / part.currentStock : 0;
    const stockOutRisk = part.currentStock < part.minimumStock
      ? 'high'
      : part.currentStock < part.minimumStock * 1.5
      ? 'medium'
      : 'low';

    const costOptimizationPotential = avgMonthlyConsumption * part.unitCost * (0.05 + Math.random() * 0.1);

    return {
      partId: part.id,
      partName: part.name,
      totalConsumed,
      totalCost: Math.round(totalCost * 100) / 100,
      monthlyConsumption,
      predictedConsumption,
      turnoverRate: Math.round(turnoverRate * 1000) / 1000,
      stockOutRisk,
      costOptimizationPotential: Math.round(costOptimizationPotential * 100) / 100,
    };
  });
}

export function generateFleet(simResult?: SimulationResult): Fleet {
  const fleetId = generateId();
  const vehicleCount = 5 + Math.floor(Math.random() * 5);
  const vehicles: Vehicle[] = [];

  for (let v = 0; v < vehicleCount; v++) {
    const vehicleId = generateId();
    const wheels: WheelServiceRecord[] = [];

    for (let w = 0; w < 4; w++) {
      const identity = generateWheelIdentity(
        fleetId,
        vehicleId,
        WHEEL_POSITIONS[w],
        simResult?.parameters.materialId || 'elm',
        simResult?.parameters.spokeCount || 12,
        simResult?.parameters.wheelRadius || 1.0
      );
      wheels.push(generateWheelServiceRecord(identity, simResult));
    }

    const avgHealth = wheels.reduce((sum, w) => sum + w.currentHealthScore, 0) / wheels.length;
    const totalMileage = wheels.reduce((sum, w) => sum + w.totalMileage, 0) / 4;

    vehicles.push({
      id: vehicleId,
      name: `${VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)]}-${String(v + 1).padStart(2, '0')}`,
      fleetId,
      type: VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)],
      wheels,
      totalMileage: Math.floor(totalMileage),
      lastMaintenanceDate: Math.min(...wheels.map((w) => w.lastInspectionDate)),
      nextMaintenanceDate: Math.min(...wheels.map((w) => w.nextInspectionDate)),
      status: avgHealth < 40 ? 'maintenance' : Math.random() > 0.15 ? 'active' : 'idle',
      healthScore: Math.round(avgHealth * 10) / 10,
    });
  }

  const allWheels = vehicles.flatMap((v) => v.wheels);
  const activeWheels = allWheels.filter((w) => w.currentPhase !== 'retired' && w.currentPhase !== 'critical');
  const wheelsInMaintenance = allWheels.filter((w) => w.currentPhase === 'critical' || w.currentHealthScore < 50);
  const wheelsRetired = allWheels.filter((w) => w.currentPhase === 'retired');
  const avgHealth = allWheels.reduce((sum, w) => sum + w.currentHealthScore, 0) / allWheels.length;
  const totalCost = allWheels.reduce((sum, w) => sum + w.totalCost, 0);

  return {
    id: fleetId,
    name: `车队-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 100)}`,
    description: '古代战车运输车队',
    vehicles,
    totalWheels: allWheels.length,
    activeWheels: activeWheels.length,
    wheelsInMaintenance: wheelsInMaintenance.length,
    wheelsRetired: wheelsRetired.length,
    totalMaintenanceCost: totalCost,
    averageHealthScore: Math.round(avgHealth * 10) / 10,
  };
}

export function generateFleetOperationData(
  fleet: Fleet,
  faults: FaultRecord[],
  tasks: MaintenanceTask[],
  parts: SparePart[],
  warnings: Warning[]
): FleetOperationData {
  const allWheels = fleet.vehicles.flatMap((v) => v.wheels);

  const healthDistribution = [
    { level: '优秀', count: allWheels.filter((w) => w.currentHealthScore >= 80).length },
    { level: '良好', count: allWheels.filter((w) => w.currentHealthScore >= 60 && w.currentHealthScore < 80).length },
    { level: '中等', count: allWheels.filter((w) => w.currentHealthScore >= 40 && w.currentHealthScore < 60).length },
    { level: '危险', count: allWheels.filter((w) => w.currentHealthScore >= 20 && w.currentHealthScore < 40).length },
    { level: '报废', count: allWheels.filter((w) => w.currentHealthScore < 20).length },
  ].map((d) => ({
    ...d,
    percentage: allWheels.length > 0 ? Math.round((d.count / allWheels.length) * 1000) / 10 : 0,
  }));

  const criticalWarnings = warnings.filter((w) => w.level === 'critical').length;
  const upcomingTasks = tasks.filter((t) => t.status === 'scheduled' && t.scheduledDate > Date.now()).length;

  const totalStockValue = parts.reduce((sum, p) => sum + p.currentStock * p.unitCost, 0);

  const last30DaysFaults = faults.filter((f) => f.detectedAt > Date.now() - 30 * 24 * 60 * 60 * 1000);
  const failureRate = last30DaysFaults.length / Math.max(1, allWheels.length);

  const repairedFaults = faults.filter((f) => f.repairedAt);
  const meanTimeToRepair = repairedFaults.length > 0
    ? repairedFaults.reduce((sum, f) => sum + (f.repairedAt! - f.detectedAt), 0) / repairedFaults.length / (1000 * 60 * 60)
    : 0;

  const activeVehicles = fleet.vehicles.filter((v) => v.status === 'active').length;
  const availabilityRate = fleet.vehicles.length > 0 ? Math.round((activeVehicles / fleet.vehicles.length) * 1000) / 10 : 0;

  const topIssues = allWheels
    .filter((w) => w.currentHealthScore < 60)
    .sort((a, b) => a.currentHealthScore - b.currentHealthScore)
    .slice(0, 5)
    .map((w) => {
      const vehicle = fleet.vehicles.find((v) => v.id === w.identity.vehicleId);
      const wheelFaults = faults.filter((f) => f.wheelId === w.identity.id);
      const worstFault = wheelFaults.sort((a, b) => FAULT_SEVERITIES.indexOf(b.severity) - FAULT_SEVERITIES.indexOf(a.severity))[0];
      return {
        wheelId: w.identity.id,
        vehicleName: vehicle?.name || '未知车辆',
        issue: worstFault?.description || '健康度过低',
        severity: worstFault?.severity || (w.currentHealthScore < 40 ? 'severe' : 'moderate'),
      };
    });

  const costTrend = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    costTrend.push({
      month: monthKey,
      maintenanceCost: Math.round((8000 + Math.random() * 12000) * 100) / 100,
      sparePartsCost: Math.round((3000 + Math.random() * 5000) * 100) / 100,
    });
  }

  const availabilityTrend = costTrend.map((ct) => ({
    month: ct.month,
    availabilityRate: Math.round((85 + Math.random() * 13) * 10) / 10,
  }));

  const kpi: FleetKPI = {
    totalWheels: allWheels.length,
    activeWheels: fleet.activeWheels,
    wheelsInMaintenance: fleet.wheelsInMaintenance,
    averageHealthScore: fleet.averageHealthScore,
    healthDistribution,
    monthlyMaintenanceCost: costTrend[costTrend.length - 1].maintenanceCost,
    yearlyMaintenanceCost: costTrend.reduce((sum, c) => sum + c.maintenanceCost, 0) * 2,
    averageCostPerWheel: Math.round(fleet.totalMaintenanceCost / Math.max(1, allWheels.length) * 100) / 100,
    failureRate: Math.round(failureRate * 1000) / 1000,
    meanTimeToRepair: Math.round(meanTimeToRepair * 10) / 10,
    availabilityRate,
    criticalWarnings,
    upcomingMaintenanceTasks: upcomingTasks,
    sparePartsStockValue: Math.round(totalStockValue * 100) / 100,
  };

  return {
    fleet,
    kpi,
    topIssues,
    costTrend,
    availabilityTrend,
  };
}

export function generateAllFleetData(simResult?: SimulationResult) {
  const fleet = generateFleet(simResult);
  const allWheels = fleet.vehicles.flatMap((v) => v.wheels);

  const faults: FaultRecord[] = [];
  allWheels.forEach((wheel) => {
    const numFaults = Math.floor(Math.random() * 5);
    for (let i = 0; i < numFaults; i++) {
      faults.push(generateFaultRecord(wheel.identity.id, wheel.identity.vehicleId, fleet.id, wheel.totalCycles));
    }
  });

  const faultPatterns = analyzeFaultPatterns(faults);
  const maintenanceTasks = generateMaintenanceTasks(allWheels, 30);
  const maintenanceSchedule = generateMaintenanceSchedule(maintenanceTasks);

  const lifePredictions = allWheels.map((w) => predictLife(w, simResult));
  const allWarnings = lifePredictions.flatMap((lp) => lp.warnings);

  const technicians = generateTechnicians(6);
  const equipment = generateEquipment(8);
  const resourceSchedules = generateResourceSchedule(maintenanceTasks, technicians, 7);

  const spareParts = generateSpareParts();
  const sparePartConsumptions = generateSparePartConsumptions(spareParts, maintenanceTasks, 80);
  const sparePartAnalyses = analyzeSpareParts(spareParts, sparePartConsumptions);

  const fleetOperationData = generateFleetOperationData(fleet, faults, maintenanceTasks, spareParts, allWarnings);

  return {
    fleet,
    wheels: allWheels,
    faults,
    faultPatterns,
    maintenanceTasks,
    maintenanceSchedule,
    lifePredictions,
    warnings: allWarnings,
    technicians,
    equipment,
    resourceSchedules,
    spareParts,
    sparePartConsumptions,
    sparePartAnalyses,
    fleetOperationData,
  };
}
