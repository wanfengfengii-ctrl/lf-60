import {
  SimulationResult,
  DiagnosisResult,
  SpokeCrackFault,
  HubLoosenessFault,
  RimDeformationFault,
  FaultSeverity,
  MaintenanceRecommendation,
  MaintenancePlan,
  RepairAction,
  CostBreakdown,
  ExpectedEffect,
  MaintenanceComparison,
  ComparisonMetric,
  MATERIALS,
  FORCE_THRESHOLD,
} from '../types';

const MATERIAL_COSTS: Record<string, { perSpoke: number; perWheel: number }> = {
  elm: { perSpoke: 80, perWheel: 1200 },
  oak: { perSpoke: 100, perWheel: 1500 },
  ash: { perSpoke: 90, perWheel: 1300 },
  iron: { perSpoke: 300, perWheel: 4500 },
  bamboo: { perSpoke: 60, perWheel: 900 },
};

const LABOR_RATE = 150;
const DOWNTIME_COST_PER_HOUR = 500;

function evaluateSeverity(score: number): FaultSeverity {
  if (score >= 0.85) return 'critical';
  if (score >= 0.65) return 'severe';
  if (score >= 0.40) return 'moderate';
  if (score >= 0.15) return 'mild';
  return 'none';
}

function getOverallFaultLevel(
  crackCount: number,
  maxCrackSeverity: FaultSeverity,
  hubSeverity: FaultSeverity,
  rimSeverity: FaultSeverity
): FaultSeverity {
  const severityRank: Record<FaultSeverity, number> = {
    none: 0, mild: 1, moderate: 2, severe: 3, critical: 4,
  };
  const severities = [hubSeverity, rimSeverity];
  if (crackCount > 0) severities.push(maxCrackSeverity);
  if (crackCount >= 3) severities.push('severe');
  if (crackCount >= Math.ceil(12 / 2)) severities.push('critical');
  const maxRank = Math.max(...severities.map((s) => severityRank[s]));
  const rankToSeverity: FaultSeverity[] = ['none', 'mild', 'moderate', 'severe', 'critical'];
  return rankToSeverity[maxRank];
}

export function diagnoseSpokeCracks(result: SimulationResult): SpokeCrackFault[] {
  const { spokeData, fatigueAnalysis, material, parameters } = result;
  const spokeCount = spokeData.length;
  const cracks: SpokeCrackFault[] = [];

  for (let i = 0; i < spokeCount; i++) {
    const spoke = spokeData[i];
    const isCritical = fatigueAnalysis.criticalSpokes.includes(i);
    const stressRatio = spoke.stress / material.enduranceLimit;
    const damageScore = spoke.damageAccumulated;
    const overloadFactor = spoke.totalForce / FORCE_THRESHOLD;

    let crackProbability = 0;
    if (damageScore >= 0.95) crackProbability = 0.95;
    else if (damageScore >= 0.7) crackProbability = damageScore * 0.7 + stressRatio * 0.15 + Math.max(0, overloadFactor - 0.8) * 0.15;
    else if (isCritical || stressRatio > 0.8) crackProbability = damageScore * 0.5 + (stressRatio - 0.8) * 0.3;
    else if (overloadFactor > 1.0) crackProbability = (overloadFactor - 1.0) * 0.5 + damageScore * 0.2;
    else crackProbability = damageScore * 0.3 + Math.max(0, stressRatio - 0.6) * 0.1;

    crackProbability = Math.min(1, crackProbability + (spokeCount <= 8 ? 0.08 : 0));

    if (crackProbability >= 0.15) {
      const severity = evaluateSeverity(crackProbability);
      const positions: Array<'root' | 'middle' | 'rim'> = ['root', 'middle', 'rim'];
      let posIdx: number;
      if (overloadFactor > 1.2) posIdx = 0;
      else if (damageScore > 0.7) posIdx = 2;
      else posIdx = 1;
      const crackPosition = positions[posIdx];

      const baseLength = severity === 'critical' ? 80
        : severity === 'severe' ? 50
        : severity === 'moderate' ? 25
        : 10;
      const crackLength = baseLength + Math.random() * baseLength * 0.5;

      const depthRatio = severity === 'critical' ? 0.7
        : severity === 'severe' ? 0.5
        : severity === 'moderate' ? 0.3
        : 0.15;
      const crackDepth = parameters.spokeHeight * depthRatio;

      const stressConcentration = 1 + overloadFactor * 0.8 + damageScore * 0.5 + crackProbability * 0.3;
      const propagationRisk = Math.min(100,
        crackProbability * 50
        + overloadFactor * 20
        + (parameters.roadConditionId === 'rough' || parameters.roadConditionId === 'cobbles' ? 20 : 0)
        + (isCritical ? 15 : 0)
      );
      const structuralImpact = Math.min(100,
        crackProbability * 40
        + damageScore * 30
        + (severity === 'critical' ? 30 : severity === 'severe' ? 20 : severity === 'moderate' ? 10 : 0)
      );

      cracks.push({
        spokeIndex: i,
        severity,
        crackLength: Math.round(crackLength * 10) / 10,
        crackDepth: Math.round(crackDepth * 10000) / 10000,
        crackPosition,
        stressConcentration: Math.round(stressConcentration * 100) / 100,
        propagationRisk: Math.round(propagationRisk),
        structuralImpact: Math.round(structuralImpact),
      });
    }
  }

  return cracks.sort((a, b) => b.structuralImpact - a.structuralImpact);
}

export function diagnoseHubLooseness(result: SimulationResult): HubLoosenessFault {
  const { spokeData, fatigueAnalysis, parameters, roadCondition } = result;
  const maxForce = result.maxForce;
  const avgFatigueRisk = spokeData.reduce((s, sp) => s + sp.fatigueRisk, 0) / spokeData.length;
  const loadUnbalance = Math.max(...spokeData.map((s) => s.totalForce))
    - Math.min(...spokeData.filter((s) => s.totalForce > 0).map((s) => s.totalForce));
  const unbalanceRatio = loadUnbalance / (result.averageForce || 1);

  const vibrationScore = Math.min(1,
    avgFatigueRisk / 100 * 0.3
    + (maxForce / FORCE_THRESHOLD - 0.7) * 0.25
    + unbalanceRatio * 0.2
    + fatigueAnalysis.totalDamage * 0.25
  );

  const baseLooseness = vibrationScore * 0.6
    + (roadCondition.impactMultiplier - 0.6) * 0.1
    + parameters.impactIntensity / 10 * 0.2;
  const loosenessDegree = Math.min(100, baseLooseness * 100 + fatigueAnalysis.failureProbability * 30);

  const boltTensionLoss = Math.min(90, loosenessDegree * 0.7 + fatigueAnalysis.totalDamage * 20);
  const vibrationAmplitude = Math.min(5, 0.1 + loosenessDegree * 0.04 + (maxForce / FORCE_THRESHOLD) * 0.5);
  const runoutRisk = Math.min(100,
    loosenessDegree * 0.6 + boltTensionLoss * 0.3 + unbalanceRatio * 30
  );
  const safetyMargin = Math.max(0, 100 - runoutRisk * 0.6 - (maxForce / FORCE_THRESHOLD) * 20);

  const severity = evaluateSeverity(loosenessDegree / 100);

  return {
    severity,
    loosenessDegree: Math.round(loosenessDegree * 10) / 10,
    boltTensionLoss: Math.round(boltTensionLoss * 10) / 10,
    vibrationAmplitude: Math.round(vibrationAmplitude * 100) / 100,
    runoutRisk: Math.round(runoutRisk),
    safetyMargin: Math.round(safetyMargin),
  };
}

export function diagnoseRimDeformation(result: SimulationResult): RimDeformationFault {
  const { spokeData, fatigueAnalysis, parameters, roadCondition } = result;
  const spokeCount = spokeData.length;
  const forceVariance = spokeData.reduce((s, sp) => {
    const avg = result.averageForce;
    return s + Math.pow(sp.totalForce - avg, 2);
  }, 0) / spokeCount;
  const forceStdDev = Math.sqrt(forceVariance);
  const cv = forceStdDev / (result.averageForce || 1);

  const radialRunout = Math.min(30,
    cv * 15
    + (roadCondition.impactMultiplier - 0.6) * 8
    + fatigueAnalysis.totalDamage * 10
    + (parameters.axleLoad > 800 ? 5 : 0)
  );
  const lateralRunout = radialRunout * (0.6 + (roadCondition.id === 'rough' ? 0.4 : 0.2));
  const maxRunout = Math.max(radialRunout, lateralRunout);

  const cvThreshold = 0.25;
  let deformationType: 'radial' | 'lateral' | 'combined';
  if (cv > cvThreshold * 1.3 || fatigueAnalysis.criticalSpokes.length >= 2) {
    deformationType = 'combined';
  } else if (radialRunout >= lateralRunout * 1.3) {
    deformationType = 'radial';
  } else if (lateralRunout >= radialRunout * 1.3) {
    deformationType = 'lateral';
  } else {
    deformationType = cv > cvThreshold ? 'combined' : 'radial';
  }

  const deformationAngle = Math.min(15,
    cv * 20
    + (roadCondition.id === 'rough' ? 3 : 0)
    + fatigueAnalysis.totalDamage * 8
  );

  const tireSealRisk = Math.min(100,
    radialRunout * 2.5
    + deformationAngle * 3
    + (deformationType === 'combined' ? 15 : 0)
  );
  const balanceImpact = Math.min(100,
    lateralRunout * 3
    + cv * 100
    + (parameters.wheelRadius > 1.2 ? 5 : 0)
  );

  const severityScore = (maxRunout / 15) * 0.4 + tireSealRisk / 100 * 0.3 + balanceImpact / 100 * 0.3;
  const severity = evaluateSeverity(severityScore);

  return {
    severity,
    deformationType,
    maxRunout: Math.round(maxRunout * 10) / 10,
    deformationAngle: Math.round(deformationAngle * 10) / 10,
    tireSealRisk: Math.round(tireSealRisk),
    balanceImpact: Math.round(balanceImpact),
  };
}

export function computeImpacts(result: SimulationResult, diagnosis: {
  spokeCracks: SpokeCrackFault[];
  hubLooseness: HubLoosenessFault;
  rimDeformation: RimDeformationFault;
}) {
  const { spokeCracks, hubLooseness, rimDeformation } = diagnosis;

  const crackSafetyImpact = spokeCracks.reduce((s, c) => {
    const factor = c.severity === 'critical' ? 0.2
      : c.severity === 'severe' ? 0.12
      : c.severity === 'moderate' ? 0.07
      : 0.03;
    return s + factor;
  }, 0);
  const hubSafetyImpact = hubLooseness.severity === 'critical' ? 0.18
    : hubLooseness.severity === 'severe' ? 0.12
    : hubLooseness.severity === 'moderate' ? 0.07
    : hubLooseness.severity === 'mild' ? 0.03 : 0;
  const rimSafetyImpact = rimDeformation.severity === 'critical' ? 0.15
    : rimDeformation.severity === 'severe' ? 0.10
    : rimDeformation.severity === 'moderate' ? 0.06
    : rimDeformation.severity === 'mild' ? 0.02 : 0;

  const totalSafetyReduction = Math.min(0.8, crackSafetyImpact + hubSafetyImpact + rimSafetyImpact);
  const safetyFactorReduction = totalSafetyReduction * 100;
  const loadCapacityLoss = totalSafetyReduction * 85;
  const collapseRisk = Math.min(100,
    spokeCracks.filter(c => c.severity === 'critical').length * 25
    + (hubLooseness.severity === 'critical' ? 35 : hubLooseness.severity === 'severe' ? 20 : 0)
    + (rimDeformation.severity === 'critical' ? 30 : rimDeformation.severity === 'severe' ? 18 : 0)
    + totalSafetyReduction * 30
  );
  const structuralIntegrity = Math.max(0, 100 - totalSafetyReduction * 100 - collapseRisk * 0.3);

  const structuralSafety = {
    safetyFactorReduction: Math.round(safetyFactorReduction * 10) / 10,
    loadCapacityLoss: Math.round(loadCapacityLoss),
    collapseRisk: Math.round(collapseRisk),
    structuralIntegrity: Math.round(structuralIntegrity),
  };

  const crackLifeImpact = spokeCracks.reduce((s, c) => {
    const factor = c.severity === 'critical' ? 0.5
      : c.severity === 'severe' ? 0.3
      : c.severity === 'moderate' ? 0.15
      : 0.06;
    return s + factor;
  }, 0);
  const baseDamageLife = result.fatigueAnalysis.totalDamage;
  const acceleratedAging = Math.min(0.95, crackLifeImpact * 0.6 + baseDamageLife * 0.5 + hubLooseness.loosenessDegree / 200);
  const fatigueLifeReduction = Math.min(95, acceleratedAging * 100);
  const maintenanceInterval = Math.max(10, Math.round(100 - fatigueLifeReduction * 0.7));

  const lifeImpact = {
    fatigueLifeReduction: Math.round(fatigueLifeReduction),
    acceleratedAgingRate: Math.round(acceleratedAging * 100),
    maintenanceInterval,
  };

  const vibrationIncrease = Math.min(200,
    hubLooseness.vibrationAmplitude * 40
    + rimDeformation.balanceImpact
    + spokeCracks.length * 8
  );
  const handlingDegradation = Math.min(100,
    rimDeformation.maxRunout * 3
    + hubLooseness.runoutRisk * 0.4
    + spokeCracks.filter(c => c.structuralImpact > 50).length * 10
  );
  const noiseLevelIncrease = Math.min(100, vibrationIncrease * 0.4 + spokeCracks.length * 3);
  const rideComfortLoss = Math.min(100, vibrationIncrease * 0.3 + handlingDegradation * 0.5);

  const stabilityImpact = {
    vibrationIncrease: Math.round(vibrationIncrease),
    handlingDegradation: Math.round(handlingDegradation),
    noiseLevelIncrease: Math.round(noiseLevelIncrease),
    rideComfortLoss: Math.round(rideComfortLoss),
  };

  return { structuralSafety, lifeImpact, stabilityImpact };
}

export function runFullDiagnosis(result: SimulationResult): DiagnosisResult {
  const spokeCracks = diagnoseSpokeCracks(result);
  const hubLooseness = diagnoseHubLooseness(result);
  const rimDeformation = diagnoseRimDeformation(result);

  const maxCrackSeverity = spokeCracks.length > 0
    ? spokeCracks.reduce((a, b) => {
        const rank: Record<FaultSeverity, number> = { none: 0, mild: 1, moderate: 2, severe: 3, critical: 4 };
        return rank[a.severity] >= rank[b.severity] ? a : b;
      }).severity
    : 'none';

  const overallFaultLevel = getOverallFaultLevel(
    spokeCracks.length,
    maxCrackSeverity,
    hubLooseness.severity,
    rimDeformation.severity
  );

  const { structuralSafety, lifeImpact, stabilityImpact } = computeImpacts(
    result,
    { spokeCracks, hubLooseness, rimDeformation }
  );

  const riskScore = Math.min(100,
    structuralSafety.collapseRisk * 0.35
    + lifeImpact.fatigueLifeReduction * 0.30
    + stabilityImpact.handlingDegradation * 0.20
    + spokeCracks.length * 3
    + (hubLooseness.severity === 'critical' ? 15 : 0)
    + (rimDeformation.severity === 'critical' ? 12 : 0)
  );

  const immediateAttention: string[] = [];
  if (spokeCracks.some(c => c.severity === 'critical')) {
    const count = spokeCracks.filter(c => c.severity === 'critical').length;
    immediateAttention.push(`⚠️ ${count}根轮辐存在严重裂纹，存在断裂风险，禁止继续运行！`);
  }
  if (hubLooseness.severity === 'critical' || hubLooseness.severity === 'severe') {
    immediateAttention.push(`🔩 轮毂松动严重（松动度${hubLooseness.loosenessDegree}%），需立即紧固或更换！`);
  }
  if (rimDeformation.severity === 'critical') {
    immediateAttention.push(`⭕ 轮圈变形严重，最大偏摆${rimDeformation.maxRunout}mm，立即更换！`);
  }
  if (structuralSafety.collapseRisk > 50) {
    immediateAttention.push(`💀 整体结构崩溃风险${structuralSafety.collapseRisk}%，禁止运行！`);
  }
  if (spokeCracks.some(c => c.severity === 'severe')) {
    const count = spokeCracks.filter(c => c.severity === 'severe').length;
    immediateAttention.push(`🔧 ${count}根轮辐裂纹较严重，建议尽快维修。`);
  }
  if (structuralSafety.structuralIntegrity < 60 && immediateAttention.length === 0) {
    immediateAttention.push(`🔍 结构完整度降至${structuralSafety.structuralIntegrity}%，建议进行全面检查。`);
  }

  return {
    spokeCracks,
    hubLooseness,
    rimDeformation,
    overallFaultLevel,
    structuralSafety,
    lifeImpact,
    stabilityImpact,
    riskScore: Math.round(riskScore),
    immediateAttention,
    diagnosticTimestamp: Date.now(),
  };
}

function generateRepairActions(
  diagnosis: DiagnosisResult,
  result: SimulationResult
): { actions: RepairAction[]; plans: MaintenancePlan[] } {
  const actions: RepairAction[] = [];
  const criticalCracks = diagnosis.spokeCracks.filter(c => c.severity === 'critical');
  const severeCracks = diagnosis.spokeCracks.filter(c => c.severity === 'severe');
  const moderateCracks = diagnosis.spokeCracks.filter(c => c.severity === 'moderate');
  const mildCracks = diagnosis.spokeCracks.filter(c => c.severity === 'mild');

  if (criticalCracks.length > 0) {
    actions.push({
      id: 'act_spoke_replace_critical',
      type: 'spoke_replace',
      title: `紧急更换 ${criticalCracks.length} 根严重裂纹轮辐`,
      description: `第 ${criticalCracks.map(c => c.spokeIndex + 1).join('、')} 号轮辐裂纹严重，存在立即断裂风险，必须整体更换。`,
      priority: 'immediate',
      affectedComponents: criticalCracks.map(c => `轮辐#${c.spokeIndex + 1}`),
      complexity: 4,
      durationHours: criticalCracks.length * 2.5 + 1,
      prerequisites: ['拆卸轮胎', '清洁轮毂'],
    });
  }
  if (severeCracks.length > 0) {
    actions.push({
      id: 'act_spoke_replace_severe',
      type: 'spoke_replace',
      title: `更换 ${severeCracks.length} 根重度裂纹轮辐`,
      description: `第 ${severeCracks.map(c => c.spokeIndex + 1).join('、')} 号轮辐裂纹较深，结构承载能力大幅下降，建议更换。`,
      priority: 'high',
      affectedComponents: severeCracks.map(c => `轮辐#${c.spokeIndex + 1}`),
      complexity: 4,
      durationHours: severeCracks.length * 2 + 0.5,
      prerequisites: ['拆卸轮胎'],
    });
  }
  if (moderateCracks.length > 0 || mildCracks.length > 0) {
    const allMildModerate = [...moderateCracks, ...mildCracks];
    actions.push({
      id: 'act_spoke_reinforce',
      type: 'spoke_reinforce',
      title: `加固 ${allMildModerate.length} 根轻中度裂纹轮辐`,
      description: `第 ${allMildModerate.map(c => c.spokeIndex + 1).join('、')} 号轮辐采用箍环/嵌补工艺加固，阻止裂纹扩展。`,
      priority: 'medium',
      affectedComponents: allMildModerate.map(c => `轮辐#${c.spokeIndex + 1}`),
      complexity: 3,
      durationHours: allMildModerate.length * 0.8 + 0.5,
      prerequisites: ['清洁表面'],
    });
  }

  if (diagnosis.hubLooseness.severity === 'critical' || diagnosis.hubLooseness.severity === 'severe') {
    actions.push({
      id: 'act_hub_replace',
      type: 'hub_replace',
      title: '更换轮毂组件',
      description: '轮毂孔磨损严重，无法通过紧固恢复精度，建议更换整套轮毂并重新定位装配。',
      priority: 'immediate',
      affectedComponents: ['轮毂', '全部轮辐根部'],
      complexity: 5,
      durationHours: 8,
      prerequisites: ['全部分解', '备件准备'],
    });
  } else if (diagnosis.hubLooseness.severity === 'moderate' || diagnosis.hubLooseness.severity === 'mild') {
    actions.push({
      id: 'act_hub_tighten',
      type: 'hub_tighten',
      title: '重新紧固轮毂并校准',
      description: `轮毂松动度${diagnosis.hubLooseness.loosenessDegree}%，按力矩规范重新紧固全部紧固件并做动平衡校准。`,
      priority: diagnosis.hubLooseness.severity === 'moderate' ? 'high' : 'medium',
      affectedComponents: ['轮毂紧固件'],
      complexity: 2,
      durationHours: 1.5,
      prerequisites: ['清洁检查'],
    });
  }

  if (diagnosis.rimDeformation.severity === 'critical') {
    actions.push({
      id: 'act_rim_replace',
      type: 'rim_replace',
      title: '整体更换轮圈',
      description: `轮圈偏摆量${diagnosis.rimDeformation.maxRunout}mm超限，无法校正，必须更换整圈。`,
      priority: 'immediate',
      affectedComponents: ['轮圈', '轮胎'],
      complexity: 5,
      durationHours: 6,
      prerequisites: ['轮胎剥离', '备件准备'],
    });
  } else if (diagnosis.rimDeformation.severity === 'severe' || diagnosis.rimDeformation.severity === 'moderate') {
    actions.push({
      id: 'act_rim_true',
      type: 'rim_true',
      title: '轮圈校正整形',
      description: `使用校正工装对偏摆${diagnosis.rimDeformation.maxRunout}mm的轮圈进行径向/侧向矫正。`,
      priority: diagnosis.rimDeformation.severity === 'severe' ? 'high' : 'medium',
      affectedComponents: ['轮圈'],
      complexity: 3,
      durationHours: 3,
      prerequisites: ['轮胎剥离'],
    });
  }

  const currentMat = result.material;
  const betterMat = MATERIALS.find(
    m => m.yieldStrength > currentMat.yieldStrength * 1.1 && m.id !== currentMat.id
  );
  if (betterMat && (diagnosis.spokeCracks.length >= 3 || diagnosis.overallFaultLevel === 'severe' || diagnosis.overallFaultLevel === 'critical')) {
    actions.push({
      id: 'act_material_replace',
      type: 'material_replace',
      title: `升级材料为${betterMat.name}`,
      description: `当前材料${currentMat.name}屈服强度不足，升级至${betterMat.name}可全面提升承载和抗疲劳能力（屈服强度提升约${Math.round((betterMat.yieldStrength / currentMat.yieldStrength - 1) * 100)}%）。`,
      priority: 'high',
      affectedComponents: ['全部轮辐'],
      complexity: 5,
      durationHours: 12,
      prerequisites: ['新制轮辐', '全部分解'],
    });
  }

  if (result.parameters.axleLoad > 800 && diagnosis.spokeCracks.length > 0) {
    actions.push({
      id: 'act_load_adjust',
      type: 'load_adjust',
      title: `降低载重至 ${Math.round(result.parameters.axleLoad * 0.75)}kg`,
      description: `当前载重${result.parameters.axleLoad}kg加剧裂纹扩展，减载25%可显著降低轮辐受力，延缓故障恶化。`,
      priority: diagnosis.overallFaultLevel === 'critical' || diagnosis.overallFaultLevel === 'severe' ? 'immediate' : 'medium',
      affectedComponents: ['整车配置'],
      complexity: 1,
      durationHours: 0.5,
      prerequisites: ['评估运输需求'],
    });
  }

  if (result.roadCondition.impactMultiplier > 1.0) {
    actions.push({
      id: 'act_road_avoid',
      type: 'road_avoid',
      title: `规避${result.roadCondition.name}等高冲击路况`,
      description: `当前路况冲击系数${result.roadCondition.impactMultiplier}，建议改走较平整路线或降低行驶速度30%以上。`,
      priority: diagnosis.stabilityImpact.handlingDegradation > 50 ? 'high' : 'medium',
      affectedComponents: ['运输路线'],
      complexity: 1,
      durationHours: 0,
      prerequisites: ['路线规划'],
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: 'act_regular_inspection',
      type: 'regular_inspection',
      title: '常规预防性维护',
      description: '当前无显著故障，建议按周期进行目视检查、扭矩复核和清洁保养。',
      priority: 'low',
      affectedComponents: ['整轮'],
      complexity: 1,
      durationHours: 1,
      prerequisites: [],
    });
  }

  function buildPlans(actionsList: RepairAction[]): MaintenancePlan[] {
    const plans: MaintenancePlan[] = [];

    const immediateActions = actionsList.filter(a => a.priority === 'immediate');
    const highActions = actionsList.filter(a => a.priority === 'high');
    const mediumActions = actionsList.filter(a => a.priority === 'medium');
    const lowActions = actionsList.filter(a => a.priority === 'low');

    if (immediateActions.length > 0) {
      const allEmergency = [...immediateActions, ...highActions].slice(0, 6);
      plans.push({
        id: 'plan_emergency',
        name: '紧急维修方案',
        description: '针对立即危及安全的故障，优先处理断裂风险和严重变形。',
        planType: 'repair',
        actions: allEmergency,
        totalDurationHours: allEmergency.reduce((s, a) => s + a.durationHours, 0),
      });
    }

    const repairActions = [...immediateActions, ...highActions, ...mediumActions].slice(0, 8);
    if (repairActions.length > 0 && plans.length === 0 || plans[0]?.id !== 'plan_emergency') {
      plans.push({
        id: 'plan_standard',
        name: '标准维修方案',
        description: '覆盖全部显著故障的完整维修方案，兼顾安全性与经济性。',
        planType: 'repair',
        actions: repairActions,
        totalDurationHours: repairActions.reduce((s, a) => s + a.durationHours, 0),
      });
    } else if (plans.length > 0) {
      plans.push({
        id: 'plan_standard',
        name: '标准维修方案',
        description: '紧急维修后持续跟进的全面修复方案。',
        planType: 'repair',
        actions: [...immediateActions, ...highActions, ...mediumActions].slice(0, 8),
        totalDurationHours: [...immediateActions, ...highActions, ...mediumActions].slice(0, 8).reduce((s, a) => s + a.durationHours, 0),
      });
    }

    const reinforceActions = [...mediumActions, ...lowActions.filter(a => a.type === 'spoke_reinforce' || a.type === 'material_replace' || a.type === 'load_adjust' || a.type === 'road_avoid')];
    if (reinforceActions.length > 0 || actionsList.length > 0) {
      const allReinforce = reinforceActions.length > 0 ? reinforceActions : actionsList;
      plans.push({
        id: 'plan_reinforce',
        name: '加固优化方案',
        description: '在维修基础上升级材料、调整载重和规避坏路，延长整体寿命。',
        planType: 'reinforce',
        actions: allReinforce.slice(0, 6),
        totalDurationHours: allReinforce.slice(0, 6).reduce((s, a) => s + a.durationHours, 0),
      });
    }

    plans.push({
      id: 'plan_preventive',
      name: '预防性维护方案',
      description: '以检查、紧固、校准为主的定期维护，适合轻度损伤时延缓劣化。',
      planType: 'preventive',
      actions: lowActions.length > 0 ? lowActions : [
        {
          id: 'act_check',
          type: 'regular_inspection',
          title: '全面检查与紧固',
          description: '目视裂纹检查、紧固件扭矩复核、轮圈偏摆检测、润滑保养。',
          priority: 'low',
          affectedComponents: ['整轮'],
          complexity: 1,
          durationHours: 2,
          prerequisites: [],
        },
      ],
      totalDurationHours: 2,
    });

    return plans;
  }

  const plans = buildPlans(actions);
  return { actions, plans };
}

function estimateCosts(plans: MaintenancePlan[], result: SimulationResult): Record<string, CostBreakdown> {
  const costMap: Record<string, CostBreakdown> = {};
  const materialCostData = MATERIAL_COSTS[result.material.id] || MATERIAL_COSTS.elm;

  for (const plan of plans) {
    let materialCost = 0;
    let equipmentCost = 0;
    let inspectionCost = 0;
    let laborHours = 0;

    for (const action of plan.actions) {
      laborHours += action.durationHours;

      switch (action.type) {
        case 'spoke_replace': {
          const count = action.affectedComponents.length;
          materialCost += count * materialCostData.perSpoke;
          equipmentCost += count > 3 ? 200 : 80;
          inspectionCost += 50;
          break;
        }
        case 'spoke_reinforce': {
          const count = action.affectedComponents.length;
          materialCost += count * 25;
          equipmentCost += 60;
          break;
        }
        case 'hub_replace':
          materialCost += materialCostData.perWheel * 0.6 + 800;
          equipmentCost += 400;
          inspectionCost += 150;
          break;
        case 'hub_tighten':
          materialCost += 30;
          equipmentCost += 80;
          inspectionCost += 100;
          break;
        case 'rim_replace':
          materialCost += materialCostData.perWheel * 0.8 + 1000;
          equipmentCost += 500;
          inspectionCost += 120;
          break;
        case 'rim_true':
          materialCost += 40;
          equipmentCost += 250;
          inspectionCost += 80;
          break;
        case 'material_replace': {
          const better = MATERIALS.find(m => m.yieldStrength > result.material.yieldStrength * 1.1);
          const targetCost = better ? (MATERIAL_COSTS[better.id]?.perWheel || 1500) : 1500;
          materialCost += targetCost * 1.2;
          equipmentCost += 600;
          inspectionCost += 200;
          break;
        }
        case 'load_adjust':
        case 'road_avoid':
          materialCost += 0;
          break;
        case 'regular_inspection':
        default:
          inspectionCost += 120;
          materialCost += 20;
          break;
      }
    }

    const laborCost = laborHours * LABOR_RATE;
    const downtimeCost = (laborHours + 2) * DOWNTIME_COST_PER_HOUR;
    const subtotal = materialCost + laborCost + equipmentCost + inspectionCost;
    const totalCost = Math.round((subtotal + downtimeCost) * 100) / 100;

    costMap[plan.id] = {
      materialCost: Math.round(materialCost * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      laborHours: Math.round(laborHours * 10) / 10,
      equipmentCost: Math.round(equipmentCost * 100) / 100,
      inspectionCost: Math.round(inspectionCost * 100) / 100,
      downtimeCost: Math.round(downtimeCost * 100) / 100,
      totalCost,
    };
  }

  return costMap;
}

function estimateEffects(
  plans: MaintenancePlan[],
  result: SimulationResult,
  diagnosis: DiagnosisResult
): Record<string, ExpectedEffect> {
  const effects: Record<string, ExpectedEffect> = {};
  const baseDamage = result.fatigueAnalysis.totalDamage;
  const criticalCount = diagnosis.spokeCracks.filter(c => c.severity === 'critical').length;

  for (const plan of plans) {
    let sfImprove = 0;
    let lifeExt = 0;
    let loadRecover = 0;
    let stabilityRecover = 0;
    let vibReduce = 0;
    let scoreImprove = 0;

    for (const action of plan.actions) {
      switch (action.type) {
        case 'spoke_replace':
          sfImprove += Math.min(40, criticalCount * 12 + action.affectedComponents.length * 5);
          lifeExt += Math.min(70, action.affectedComponents.length * 10 + baseDamage * 40);
          loadRecover += Math.min(40, action.affectedComponents.length * 6);
          vibReduce += Math.min(20, action.affectedComponents.length * 3);
          scoreImprove += action.affectedComponents.length * 6;
          break;
        case 'spoke_reinforce':
          sfImprove += Math.min(15, action.affectedComponents.length * 3);
          lifeExt += Math.min(40, action.affectedComponents.length * 4);
          loadRecover += Math.min(20, action.affectedComponents.length * 3);
          vibReduce += Math.min(10, action.affectedComponents.length * 2);
          scoreImprove += action.affectedComponents.length * 3;
          break;
        case 'hub_replace':
          sfImprove += 25;
          lifeExt += 35;
          loadRecover += 20;
          stabilityRecover += 45;
          vibReduce += 55;
          scoreImprove += 22;
          break;
        case 'hub_tighten':
          sfImprove += 10;
          lifeExt += 15;
          loadRecover += 10;
          stabilityRecover += 30;
          vibReduce += 35;
          scoreImprove += 10;
          break;
        case 'rim_replace':
          sfImprove += 20;
          lifeExt += 25;
          loadRecover += 15;
          stabilityRecover += 55;
          vibReduce += 45;
          scoreImprove += 20;
          break;
        case 'rim_true':
          sfImprove += 8;
          lifeExt += 12;
          loadRecover += 8;
          stabilityRecover += 35;
          vibReduce += 25;
          scoreImprove += 12;
          break;
        case 'material_replace':
          sfImprove += 45;
          lifeExt += 60;
          loadRecover += 40;
          vibReduce += 10;
          scoreImprove += 30;
          break;
        case 'load_adjust':
          sfImprove += 15;
          lifeExt += 45;
          loadRecover += 0;
          vibReduce += 15;
          scoreImprove += 12;
          break;
        case 'road_avoid':
          sfImprove += 8;
          lifeExt += 30;
          loadRecover += 0;
          vibReduce += 12;
          scoreImprove += 8;
          break;
        case 'regular_inspection':
        default:
          sfImprove += 3;
          lifeExt += 8;
          stabilityRecover += 5;
          scoreImprove += 4;
          break;
      }
    }

    effects[plan.id] = {
      safetyFactorImprovement: Math.min(100, sfImprove),
      lifeExtension: Math.min(200, lifeExt),
      loadCapacityRecovery: Math.min(100, loadRecover),
      stabilityRecovery: Math.min(100, stabilityRecover),
      vibrationReduction: Math.min(95, vibReduce),
      overallScoreImprovement: Math.min(100, scoreImprove),
    };
  }

  return effects;
}

export function generateMaintenanceRecommendation(
  result: SimulationResult,
  diagnosis: DiagnosisResult
): MaintenanceRecommendation {
  const { actions, plans } = generateRepairActions(diagnosis, result);
  void actions;

  const costEstimates = estimateCosts(plans, result);
  const expectedEffects = estimateEffects(plans, result, diagnosis);

  let recommendedPlanId: string;

  if (diagnosis.overallFaultLevel === 'critical') {
    recommendedPlanId = plans.find(p => p.id === 'plan_emergency')?.id
      || plans[0]?.id || 'plan_standard';
  } else if (diagnosis.overallFaultLevel === 'severe') {
    recommendedPlanId = plans.find(p => p.id === 'plan_standard')?.id
      || plans[0]?.id || 'plan_standard';
  } else if (diagnosis.riskScore > 50) {
    recommendedPlanId = plans.find(p => p.id === 'plan_reinforce')?.id
      || plans.find(p => p.id === 'plan_standard')?.id || 'plan_standard';
  } else if (diagnosis.overallFaultLevel === 'none' && diagnosis.spokeCracks.length === 0) {
    recommendedPlanId = plans.find(p => p.id === 'plan_preventive')?.id || 'plan_preventive';
  } else {
    recommendedPlanId = plans.find(p => p.id === 'plan_standard')?.id || plans[0]?.id || 'plan_preventive';
  }

  return {
    diagnosisResult: diagnosis,
    plans,
    recommendedPlanId,
    costEstimates,
    expectedEffects,
  };
}

export function generateMaintenanceComparison(
  result: SimulationResult,
  recommendation: MaintenanceRecommendation,
  planId: string
): MaintenanceComparison {
  const plan = recommendation.plans.find(p => p.id === planId) || recommendation.plans[0];
  const effect = recommendation.expectedEffects[planId] || {
    safetyFactorImprovement: 0, lifeExtension: 0, loadCapacityRecovery: 0,
    stabilityRecovery: 0, vibrationReduction: 0, overallScoreImprovement: 0,
  };
  const d = recommendation.diagnosisResult;

  const baseSF = result.fatigueAnalysis.safetyFactor === Infinity ? 3.0 : result.fatigueAnalysis.safetyFactor;
  const sf = baseSF * (1 + effect.safetyFactorImprovement / 100);

  const baseLife = result.fatigueAnalysis.minCycleLife === Infinity ? 1e7 : result.fatigueAnalysis.minCycleLife;
  const lifeAfter = baseLife * (1 + effect.lifeExtension / 100);

  const baseStability = 100 - (d.stabilityImpact.handlingDegradation * 0.4
    + d.stabilityImpact.vibrationIncrease / 3 + d.stabilityImpact.rideComfortLoss * 0.2);
  const stabilityAfter = Math.min(100, baseStability + effect.stabilityRecovery * 0.4 + effect.vibrationReduction * 0.2);

  const beforeScore = Math.max(0, Math.min(100,
    100 - d.riskScore * 0.6
    - d.structuralSafety.collapseRisk * 0.3
    - result.fatigueAnalysis.totalDamage * 20
  ));
  const afterScore = Math.min(100, beforeScore + effect.overallScoreImprovement);

  const metricDefs = [
    { name: '安全系数', unit: '', before: baseSF, after: sf, higher: true },
    { name: '估算寿命', unit: '次循环', before: baseLife, after: lifeAfter, higher: true, format: (v: number) => v.toLocaleString() },
    { name: '承载能力', unit: '%', before: 100 - d.structuralSafety.loadCapacityLoss, after: Math.min(100, (100 - d.structuralSafety.loadCapacityLoss) + effect.loadCapacityRecovery), higher: true },
    { name: '结构完整度', unit: '%', before: d.structuralSafety.structuralIntegrity, after: Math.min(100, d.structuralSafety.structuralIntegrity + effect.safetyFactorImprovement * 0.6), higher: true },
    { name: '崩溃风险', unit: '%', before: d.structuralSafety.collapseRisk, after: Math.max(0, d.structuralSafety.collapseRisk - effect.safetyFactorImprovement * 0.7), higher: false },
    { name: '振动水平', unit: '%', before: d.stabilityImpact.vibrationIncrease, after: Math.max(0, d.stabilityImpact.vibrationIncrease - effect.vibrationReduction), higher: false },
    { name: '剩余寿命', unit: '%', before: result.fatigueAnalysis.remainingLifePercent, after: Math.min(100, result.fatigueAnalysis.remainingLifePercent + effect.lifeExtension * 0.35), higher: true },
  ];

  const metrics: ComparisonMetric[] = metricDefs.map(m => {
    const diff = m.after - m.before;
    const impPct = m.before === 0 ? (m.higher ? 100 : 0) : Math.round((diff / m.before) * 100 * 10) / 10;
    return {
      name: m.name,
      unit: m.unit,
      beforeValue: Math.round(m.before * 100) / 100,
      afterValue: Math.round(m.after * 100) / 100,
      improvement: Math.round(diff * 100) / 100,
      improvementPercent: m.higher ? impPct : -impPct,
    };
  });

  const radarData = [
    { category: '结构安全', before: Math.max(0, 100 - d.structuralSafety.collapseRisk), after: Math.min(100, (100 - d.structuralSafety.collapseRisk) + effect.safetyFactorImprovement * 0.5) },
    { category: '疲劳寿命', before: result.fatigueAnalysis.remainingLifePercent, after: Math.min(100, result.fatigueAnalysis.remainingLifePercent + effect.lifeExtension * 0.4) },
    { category: '承载能力', before: 100 - d.structuralSafety.loadCapacityLoss, after: Math.min(100, (100 - d.structuralSafety.loadCapacityLoss) + effect.loadCapacityRecovery) },
    { category: '运行稳定', before: Math.max(0, 100 - d.stabilityImpact.handlingDegradation), after: Math.min(100, (100 - d.stabilityImpact.handlingDegradation) + effect.stabilityRecovery) },
    { category: '振动控制', before: Math.max(0, 100 - d.stabilityImpact.vibrationIncrease / 2), after: Math.min(100, (100 - d.stabilityImpact.vibrationIncrease / 2) + effect.vibrationReduction * 0.4) },
    { category: '乘坐舒适', before: Math.max(0, 100 - d.stabilityImpact.rideComfortLoss), after: Math.min(100, (100 - d.stabilityImpact.rideComfortLoss) + effect.stabilityRecovery * 0.3) },
  ];

  return {
    planId: plan.id,
    planName: plan.name,
    metrics,
    beforeOverview: {
      structuralSafety: d.structuralSafety.structuralIntegrity,
      estimatedLife: result.fatigueAnalysis.remainingLifePercent,
      stability: Math.max(0, Math.round(stabilityAfter - effect.stabilityRecovery * 0.4 - effect.vibrationReduction * 0.2)),
      overallScore: Math.round(beforeScore),
    },
    afterOverview: {
      structuralSafety: Math.min(100, Math.round(d.structuralSafety.structuralIntegrity + effect.safetyFactorImprovement * 0.6)),
      estimatedLife: Math.min(100, Math.round(result.fatigueAnalysis.remainingLifePercent + effect.lifeExtension * 0.35)),
      stability: Math.round(stabilityAfter),
      overallScore: Math.round(afterScore),
    },
    radarData: radarData.map(r => ({
      category: r.category,
      before: Math.round(r.before),
      after: Math.min(100, Math.round(r.after)),
    })),
  };
}

export function enrichSimulationResult(result: SimulationResult): SimulationResult {
  const diagnosis = runFullDiagnosis(result);
  const recommendation = generateMaintenanceRecommendation(result, diagnosis);
  const comparison = generateMaintenanceComparison(result, recommendation, recommendation.recommendedPlanId);

  return {
    ...result,
    diagnosisResult: diagnosis,
    maintenanceRecommendation: recommendation,
    maintenanceComparison: comparison,
  };
}
