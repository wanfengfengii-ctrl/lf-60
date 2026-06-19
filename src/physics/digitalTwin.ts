import {
  WheelParameters,
  SimulationResult,
  TimeSeriesDataPoint,
  TimeSeriesRecord,
  DamageEvolutionState,
  DamageEvolutionResult,
  BattlefieldTerrain,
  BATTLEFIELD_TERRAINS,
  LoadMission,
  MissionGroup,
  FailureEvent,
  FailurePlaybackSession,
  StructuralOptimizationScheme,
  OptimizationObjective,
  OptimizationConstraint,
  DECISION_CRITERIA,
  SchemeScore,
  MultiSchemeDecisionResult,
  MATERIALS,
  getMaterialById,
  FORCE_THRESHOLD,
} from '../types';
import { runSimulation, calculateBendingStress } from './simulation';

const generateId = (): string => Math.random().toString(36).substring(2, 15);

export function generateTimeSeriesData(
  baseResult: SimulationResult,
  durationCycles: number,
  sampleInterval: number = 1000,
  variability: number = 0.15
): TimeSeriesRecord {
  const { parameters, material, roadCondition } = baseResult;
  const spokeCount = parameters.spokeCount;
  const dataPoints: TimeSeriesDataPoint[] = [];
  const startTime = Date.now();

  const numSamples = Math.floor(durationCycles / sampleInterval);

  for (let i = 0; i <= numSamples; i++) {
    const cycle = i * sampleInterval;
    const timestamp = startTime + (cycle / 100) * 1000;
    const mileage = cycle * 0.01;

    const fatigueFactor = 1 + (cycle / durationCycles) * 0.3;
    const randomFactor = 1 + (Math.random() - 0.5) * variability;

    const spokeForces: number[] = [];
    const spokeStresses: number[] = [];
    const spokeDamages: number[] = [];
    let maxForce = 0;
    let totalForce = 0;
    let maxStress = 0;
    let totalDamage = 0;

    for (let j = 0; j < spokeCount; j++) {
      const baseSpoke = baseResult.spokeData[j];
      const cycleFactor = 1 + Math.sin(cycle / 1000 + j * 0.5) * 0.1;
      const randomVariation = 1 + (Math.random() - 0.5) * variability;

      const force = baseSpoke.totalForce * fatigueFactor * cycleFactor * randomVariation;
      const stress = baseSpoke.stress * fatigueFactor * cycleFactor * randomVariation;
      const damage = Math.min(1, baseSpoke.damageAccumulated * (cycle / durationCycles) * (1 + Math.random() * 0.2));

      spokeForces.push(Math.round(force * 100) / 100);
      spokeStresses.push(Math.round(stress * 100) / 100);
      spokeDamages.push(Math.round(damage * 10000) / 10000);

      if (force > maxForce) maxForce = force;
      totalForce += force;
      if (stress > maxStress) maxStress = stress;
      if (damage > totalDamage) totalDamage = damage;
    }

    const avgForce = totalForce / spokeCount;
    const healthScore = Math.max(0, Math.min(100, 100 - totalDamage * 80 - (cycle / durationCycles) * 20));

    dataPoints.push({
      timestamp,
      cycle,
      mileage: Math.round(mileage * 100) / 100,
      spokeForces,
      spokeStresses,
      spokeDamages,
      maxForce: Math.round(maxForce * 100) / 100,
      avgForce: Math.round(avgForce * 100) / 100,
      maxStress: Math.round(maxStress * 100) / 100,
      totalDamage: Math.round(totalDamage * 10000) / 10000,
      healthScore: Math.round(healthScore * 10) / 10,
      temperature: 20 + Math.random() * 30 + (cycle / durationCycles) * 15,
      vibration: 0.5 + Math.random() * 2 + totalDamage * 3,
      roadConditionId: roadCondition.id,
      axleLoad: parameters.axleLoad * randomFactor,
      speed: 10 + Math.random() * 10,
    });
  }

  return {
    id: generateId(),
    wheelId: generateId(),
    startTime,
    endTime: dataPoints[dataPoints.length - 1].timestamp,
    totalCycles: durationCycles,
    totalMileage: Math.round(durationCycles * 0.01 * 100) / 100,
    dataPoints,
    sampleInterval,
    metadata: {
      material: material.name,
      roadCondition: roadCondition.name,
      spokeCount,
      baseLoad: parameters.axleLoad,
    },
  };
}

export function simulateDamageEvolution(
  parameters: WheelParameters,
  terrain: BattlefieldTerrain,
  totalCycles: number,
  samplePoints: number = 50
): DamageEvolutionResult {
  const material = getMaterialById(parameters.materialId);
  const spokeCount = parameters.spokeCount;
  const states: DamageEvolutionState[] = [];

  const initialState: DamageEvolutionState = {
    cycle: 0,
    spokeDamages: new Array(spokeCount).fill(0),
    totalDamage: 0,
    maxDamage: 0,
    failedSpokes: [],
    crackLengths: new Array(spokeCount).fill(0),
    crackDepths: new Array(spokeCount).fill(0),
    stressConcentrations: new Array(spokeCount).fill(1),
    remainingLives: new Array(spokeCount).fill(Infinity),
    safetyFactor: material.yieldStrength / (material.enduranceLimit * 0.5),
    structuralIntegrity: 100,
    failureProbability: 0,
  };

  states.push(initialState);

  const cycleStep = Math.floor(totalCycles / samplePoints);
  let failureCycle: number | null = null;
  let failureMode: DamageEvolutionResult['failureMode'] = null;
  let criticalSpokeIndex: number | null = null;

  const terrainParams = {
    impactMultiplier: terrain.impactMultiplier,
    frequencyFactor: terrain.frequencyFactor,
    loadReduction: terrain.loadReduction,
  };

  const effectiveLoad = parameters.axleLoad * (1 - terrainParams.loadReduction);
  const GRAVITY = 9.81;
  const totalLoad = effectiveLoad * GRAVITY;
  const staticPerSpoke = totalLoad / spokeCount;
  const spokeLength = parameters.wheelRadius - parameters.wheelRadius * 0.12;
  const crossArea = parameters.spokeWidth * parameters.spokeHeight;

  for (let s = 1; s <= samplePoints; s++) {
    const cycle = s * cycleStep;
    const prevState = states[s - 1];
    const cycleRatio = cycle / totalCycles;

    const spokeDamages: number[] = [];
    const crackLengths: number[] = [];
    const crackDepths: number[] = [];
    const stressConcentrations: number[] = [];
    const remainingLives: number[] = [];
    const failedSpokes: number[] = [];

    let maxDamage = 0;

    for (let i = 0; i < spokeCount; i++) {
      const angle = (2 * Math.PI * i) / spokeCount - Math.PI / 2;
      const verticalComponent = Math.sin(angle + Math.PI / 2);
      const staticForce = staticPerSpoke * Math.max(0, verticalComponent + 0.3);

      const impactAngle = (angle + Math.PI / 2) % (2 * Math.PI);
      const baseImpactFactor = Math.max(
        0,
        Math.cos(impactAngle) * 0.6 + Math.sin(impactAngle * 3) * 0.2 + 0.3
      );

      const shockIntensity = 1 + Math.sin(cycle / 500 + i) * 0.3;
      const impactForce = parameters.impactIntensity * terrainParams.impactMultiplier *
        baseImpactFactor * shockIntensity * 1000;

      const radiusFactor = 1 + (parameters.wheelRadius - 0.5) * 0.5;
      const spokeFactor = 1 + (12 - Math.min(spokeCount, 24)) * 0.02;
      const fatigueFactor = 1 + cycleRatio * 0.5;

      const totalForce = (staticForce + impactForce) * radiusFactor * spokeFactor * fatigueFactor;

      const bendingStress = calculateBendingStress(
        totalForce,
        spokeLength,
        parameters.spokeWidth,
        parameters.spokeHeight
      );
      const axialStress = totalForce / (crossArea || 1e-6);
      const combinedStress = Math.sqrt(bendingStress * bendingStress + axialStress * axialStress);

      const stressAmplitude = combinedStress * terrainParams.frequencyFactor;
      let damageIncrement = 0;

      if (stressAmplitude > material.enduranceLimit) {
        const Nf = Math.pow(
          material.fatigueCoefficient / stressAmplitude,
          material.fatigueExponent
        );
        damageIncrement = (cycleStep * terrainParams.frequencyFactor) / Math.max(1, Nf);
      }

      const prevDamage = prevState.spokeDamages[i];
      const accelerationFactor = 1 + prevDamage * 2;
      const newDamage = Math.min(1, prevDamage + damageIncrement * accelerationFactor);

      const crackLength = newDamage >= 0.3 ? (newDamage - 0.3) * 200 : 0;
      const crackDepth = newDamage >= 0.5 ? (newDamage - 0.5) * parameters.spokeHeight : 0;
      const stressConc = 1 + newDamage * 2 + crackLength * 0.01;

      const remainingLife = newDamage >= 1 ? 0 :
        Math.max(0, Math.round((1 - newDamage) * totalCycles));

      spokeDamages.push(Math.round(newDamage * 10000) / 10000);
      crackLengths.push(Math.round(crackLength * 10) / 10);
      crackDepths.push(Math.round(crackDepth * 10000) / 10000);
      stressConcentrations.push(Math.round(stressConc * 100) / 100);
      remainingLives.push(remainingLife);

      if (newDamage > maxDamage) maxDamage = newDamage;
      if (newDamage >= 1) {
        failedSpokes.push(i);
        if (failureCycle === null) {
          failureCycle = cycle;
          failureMode = 'spoke_fracture';
          criticalSpokeIndex = i;
        }
      }
    }

    const totalDamage = Math.max(...spokeDamages);
    const maxStress = Math.max(...stressConcentrations) * material.enduranceLimit;
    const safetyFactor = maxStress > 0 ? material.yieldStrength / maxStress : Infinity;
    const structuralIntegrity = Math.max(0, 100 - totalDamage * 80 - failedSpokes.length * 15);
    const failureProbability = Math.min(1,
      totalDamage * 0.6 + failedSpokes.length / spokeCount * 0.4);

    states.push({
      cycle,
      spokeDamages,
      totalDamage: Math.round(totalDamage * 10000) / 10000,
      maxDamage: Math.round(maxDamage * 10000) / 10000,
      failedSpokes,
      crackLengths,
      crackDepths,
      stressConcentrations,
      remainingLives,
      safetyFactor: safetyFactor === Infinity ? 10 : Math.round(safetyFactor * 100) / 100,
      structuralIntegrity: Math.round(structuralIntegrity * 10) / 10,
      failureProbability: Math.round(failureProbability * 10000) / 10000,
    });

    if (failedSpokes.length >= spokeCount / 2 && failureMode === null) {
      failureCycle = cycle;
      failureMode = 'fatigue_cumulative';
    }
  }

  const evolutionRate = totalCycles > 0 ?
    states[states.length - 1].totalDamage / totalCycles : 0;

  return {
    id: generateId(),
    wheelId: generateId(),
    states,
    initialState: states[0],
    finalState: states[states.length - 1],
    totalCycles,
    failureCycle,
    failureMode,
    criticalSpokeIndex,
    evolutionRate,
  };
}

export function getTerrainById(id: string): BattlefieldTerrain | undefined {
  return BATTLEFIELD_TERRAINS.find(t => t.id === id);
}

export function getTerrainsByType(type: BattlefieldTerrain['type']): BattlefieldTerrain[] {
  return BATTLEFIELD_TERRAINS.filter(t => t.type === type);
}

export function simulateMissionGroup(
  baseParameters: WheelParameters,
  missionGroup: MissionGroup
): {
  timeSeries: TimeSeriesRecord;
  damageEvolution: DamageEvolutionResult;
  finalResult: SimulationResult;
  cumulativeDamage: number;
  missionSuccessProbability: number;
} {
  let cumulativeDamage = 0;
  let currentParameters = { ...baseParameters };
  const allDataPoints: TimeSeriesDataPoint[] = [];
  const startTime = Date.now();
  let currentCycle = 0;

  for (const mission of missionGroup.missions) {
    for (const terrainId of mission.terrainIds) {
      const terrain = getTerrainById(terrainId);
      if (!terrain) continue;

      const missionCycles = Math.floor(mission.durationCycles / mission.terrainIds.length);
      const effectiveLoad = Math.min(
        mission.totalLoad * (1 - terrain.loadReduction),
        mission.maxAllowedLoad
      );

      currentParameters = {
        ...currentParameters,
        axleLoad: effectiveLoad,
        impactIntensity: Math.max(currentParameters.impactIntensity, terrain.impactMultiplier * 2),
      };

      const segmentResult = runSimulation(currentParameters);
      const segmentTimeSeries = generateTimeSeriesData(
        segmentResult,
        missionCycles,
        Math.floor(missionCycles / 20),
        mission.loadVariability
      );

      for (const point of segmentTimeSeries.dataPoints) {
        allDataPoints.push({
          ...point,
          cycle: point.cycle + currentCycle,
          timestamp: point.timestamp + currentCycle * 10,
          mileage: point.mileage + currentCycle * 0.01,
          roadConditionId: terrainId,
          axleLoad: effectiveLoad,
        });
      }

      cumulativeDamage += mission.estimatedDamage * (1 + terrain.impactMultiplier * 0.5);
      currentCycle += missionCycles;
    }
  }

  const finalParameters = {
    ...currentParameters,
    operatingCycles: missionGroup.totalCycles,
  };

  const finalResult = runSimulation(finalParameters);

  const adjustedDamage = Math.min(1, cumulativeDamage);
  const adjustedSpokeData = finalResult.spokeData.map(s => ({
    ...s,
    damageAccumulated: Math.min(1, s.damageAccumulated + adjustedDamage * 0.5),
    remainingLife: Math.max(0, s.remainingLife - adjustedDamage * 0.5),
  }));

  const adjustedFinalResult = {
    ...finalResult,
    spokeData: adjustedSpokeData,
    fatigueAnalysis: {
      ...finalResult.fatigueAnalysis,
      totalDamage: Math.min(1, finalResult.fatigueAnalysis.totalDamage + adjustedDamage * 0.3),
      remainingLifePercent: Math.max(0, finalResult.fatigueAnalysis.remainingLifePercent - adjustedDamage * 30),
    },
  };

  const damageEvolution = simulateDamageEvolution(
    finalParameters,
    getTerrainById(missionGroup.terrainSequence[0]) || BATTLEFIELD_TERRAINS[0],
    missionGroup.totalCycles,
    40
  );

  const healthScore = 100 - adjustedDamage * 80;
  const terrainRisk = missionGroup.terrainSequence.reduce((sum, tId) => {
    const t = getTerrainById(tId);
    return sum + (t?.impactMultiplier || 1) * 10;
  }, 0) / missionGroup.terrainSequence.length;

  const missionSuccessProbability = Math.max(0, Math.min(1,
    healthScore / 100 * 0.6 +
    (1 - Math.min(1, adjustedDamage)) * 0.3 +
    (100 - Math.min(100, terrainRisk)) / 100 * 0.1
  ));

  const timeSeriesRecord: TimeSeriesRecord = {
    id: generateId(),
    wheelId: generateId(),
    startTime,
    endTime: allDataPoints[allDataPoints.length - 1]?.timestamp || startTime,
    totalCycles: missionGroup.totalCycles,
    totalMileage: Math.round(missionGroup.totalCycles * 0.01 * 100) / 100,
    dataPoints: allDataPoints,
    sampleInterval: allDataPoints.length > 1 ?
      Math.floor(missionGroup.totalCycles / allDataPoints.length) : 1000,
    metadata: {
      missionGroupId: missionGroup.id,
      missionGroupName: missionGroup.name,
      missionCount: missionGroup.missions.length,
      terrains: missionGroup.terrainSequence,
    },
  };

  return {
    timeSeries: timeSeriesRecord,
    damageEvolution,
    finalResult: adjustedFinalResult,
    cumulativeDamage: Math.round(adjustedDamage * 10000) / 10000,
    missionSuccessProbability: Math.round(missionSuccessProbability * 10000) / 10000,
  };
}

export function createFailurePlaybackSession(
  wheelId: string,
  timeSeries: TimeSeriesRecord,
  damageEvolution: DamageEvolutionResult
): FailurePlaybackSession {
  const failureEvents: FailureEvent[] = [];

  for (let i = 1; i < damageEvolution.states.length; i++) {
    const state = damageEvolution.states[i];
    const prevState = damageEvolution.states[i - 1];

    for (const spokeIdx of state.failedSpokes) {
      if (!prevState.failedSpokes.includes(spokeIdx)) {
        const dataPoint = timeSeries.dataPoints.find(d => d.cycle >= state.cycle);
        failureEvents.push({
          id: generateId(),
          timestamp: dataPoint?.timestamp || Date.now(),
          cycle: state.cycle,
          type: 'spoke_fracture',
          severity: state.failedSpokes.length >= 3 ? 'critical' : 'severe',
          description: `轮辐#${spokeIdx + 1}发生断裂`,
          affectedComponents: [`轮辐#${spokeIdx + 1}`],
          rootCause: '累积疲劳损伤导致断裂',
          contributingFactors: [
            `累积损伤: ${(state.spokeDamages[spokeIdx] * 100).toFixed(1)}%`,
            `裂纹长度: ${state.crackLengths[spokeIdx].toFixed(1)}mm`,
          ],
          immediateActions: [
            '立即停车检查',
            '更换断裂轮辐',
            '检查相邻轮辐损伤情况',
          ],
          forceAtFailure: dataPoint?.spokeForces[spokeIdx] || 0,
          stressAtFailure: dataPoint?.spokeStresses[spokeIdx] || 0,
          damageAtFailure: state.spokeDamages[spokeIdx],
          roadConditionAtFailure: dataPoint?.roadConditionId || 'unknown',
          loadAtFailure: dataPoint?.axleLoad || 0,
          speedAtFailure: dataPoint?.speed,
        });
      }
    }

    if (state.structuralIntegrity < 50 && prevState.structuralIntegrity >= 50) {
      const dataPoint = timeSeries.dataPoints.find(d => d.cycle >= state.cycle);
      failureEvents.push({
        id: generateId(),
        timestamp: dataPoint?.timestamp || Date.now(),
        cycle: state.cycle,
        type: 'fatigue_cumulative',
        severity: 'critical',
        description: '整体结构完整性降至临界值以下',
        affectedComponents: ['整车结构'],
        rootCause: '多根轮辐累积损伤导致整体承载能力下降',
        contributingFactors: [
          `失效轮辐: ${state.failedSpokes.length}根`,
          `结构完整度: ${state.structuralIntegrity.toFixed(1)}%`,
        ],
        immediateActions: [
          '禁止继续行驶',
          '全面评估结构损伤',
          '考虑整车报废',
        ],
        forceAtFailure: dataPoint?.maxForce || 0,
        stressAtFailure: dataPoint?.maxStress || 0,
        damageAtFailure: state.totalDamage,
        roadConditionAtFailure: dataPoint?.roadConditionId || 'unknown',
        loadAtFailure: dataPoint?.axleLoad || 0,
      });
    }
  }

  const keyFrames = [
    {
      cycle: 0,
      timestamp: timeSeries.startTime,
      label: '初始状态',
      description: '全新车轮，无损伤',
    },
    {
      cycle: Math.floor(timeSeries.totalCycles * 0.25),
      timestamp: timeSeries.startTime + timeSeries.totalCycles * 0.25 * 10,
      label: '损伤初期',
      description: '开始出现微小裂纹',
    },
    {
      cycle: Math.floor(timeSeries.totalCycles * 0.5),
      timestamp: timeSeries.startTime + timeSeries.totalCycles * 0.5 * 10,
      label: '损伤中期',
      description: '裂纹扩展，需要关注',
    },
    {
      cycle: Math.floor(timeSeries.totalCycles * 0.75),
      timestamp: timeSeries.startTime + timeSeries.totalCycles * 0.75 * 10,
      label: '损伤后期',
      description: '接近失效临界值',
    },
    {
      cycle: timeSeries.totalCycles,
      timestamp: timeSeries.endTime,
      label: '最终状态',
      description: damageEvolution.failureCycle ? '车轮失效' : '任务完成',
    },
  ];

  if (damageEvolution.failureCycle) {
    const failurePoint = timeSeries.dataPoints.find(d => d.cycle >= damageEvolution.failureCycle!);
    keyFrames.push({
      cycle: damageEvolution.failureCycle,
      timestamp: failurePoint?.timestamp || Date.now(),
      label: '失效时刻',
      description: '车轮发生结构性失效',
    });
  }

  return {
    id: generateId(),
    wheelId,
    startTime: timeSeries.startTime,
    endTime: timeSeries.endTime,
    totalCycles: timeSeries.totalCycles,
    failureEvents,
    timeSeriesData: timeSeries.dataPoints,
    evolutionStates: damageEvolution.states,
    currentPlaybackTime: timeSeries.startTime,
    currentCycle: 0,
    isPlaying: false,
    playbackSpeed: 1,
    playbackDirection: 'forward',
    keyFrames: keyFrames.sort((a, b) => a.cycle - b.cycle),
  };
}

export function generateOptimizationSchemes(
  baseResult: SimulationResult,
  numSchemes: number = 5
): StructuralOptimizationScheme[] {
  const schemes: StructuralOptimizationScheme[] = [];
  const baseParams = baseResult.parameters;
  const baseMaterial = baseResult.material;

  const strategyFactories = [
    () => {
      const betterMat = MATERIALS.find(m =>
        m.enduranceLimit > baseMaterial.enduranceLimit * 1.2 && m.id !== baseMaterial.id
      );
      if (!betterMat) return null;
      return {
        name: `材料升级方案 - ${betterMat.name}`,
        description: `将轮辐材料从${baseMaterial.name}升级为${betterMat.name}，提升疲劳极限和承载能力`,
        type: 'material' as const,
        params: { ...baseParams, materialId: betterMat.id },
        complexity: 'medium' as const,
        estimatedCost: (MATERIAL_COSTS[betterMat.id]?.perWheel || 1500) * 1.2,
      };
    },
    () => {
      const newCount = Math.min(36, baseParams.spokeCount + 6);
      return {
        name: `增加轮辐方案 - ${newCount}根`,
        description: `将轮辐数量从${baseParams.spokeCount}根增加到${newCount}根，分散载荷`,
        type: 'geometry' as const,
        params: { ...baseParams, spokeCount: newCount },
        complexity: 'high' as const,
        estimatedCost: (newCount - baseParams.spokeCount) * (MATERIAL_COSTS[baseMaterial.id]?.perSpoke || 100) * 2,
      };
    },
    () => {
      const newWidth = Math.min(0.12, baseParams.spokeWidth * 1.3);
      const newHeight = Math.min(0.16, baseParams.spokeHeight * 1.3);
      return {
        name: `增大截面方案 - ${(newWidth * 100).toFixed(0)}x${(newHeight * 100).toFixed(0)}cm`,
        description: `增大轮辐截面尺寸，提升抗弯能力`,
        type: 'geometry' as const,
        params: { ...baseParams, spokeWidth: newWidth, spokeHeight: newHeight },
        complexity: 'high' as const,
        estimatedCost: (newWidth * newHeight / (baseParams.spokeWidth * baseParams.spokeHeight) - 1) * 800,
      };
    },
    () => {
      const newRadius = Math.min(1.6, baseParams.wheelRadius * 1.15);
      return {
        name: `增大轮径方案 - ${newRadius.toFixed(2)}m`,
        description: `增大车轮半径，提升通过性和稳定性`,
        type: 'geometry' as const,
        params: { ...baseParams, wheelRadius: newRadius },
        complexity: 'medium' as const,
        estimatedCost: (newRadius / baseParams.wheelRadius - 1) * 1500,
      };
    },
    () => {
      const betterMat = MATERIALS.find(m => m.id === 'iron')!;
      const newCount = Math.min(36, baseParams.spokeCount + 4);
      return {
        name: '综合优化方案 - 铸铁加固+24辐',
        description: '同时升级材料为铸铁加固，并增加轮辐数量，全面提升性能',
        type: 'comprehensive' as const,
        params: { ...baseParams, materialId: betterMat.id, spokeCount: newCount },
        complexity: 'high' as const,
        estimatedCost: 3500,
      };
    },
    () => {
      return {
        name: '轻量高速方案 - 竹质复合+16辐',
        description: '使用轻质竹质复合材料，减少轮辐数量，提升机动性',
        type: 'comprehensive' as const,
        params: { ...baseParams, materialId: 'bamboo', spokeCount: 16, wheelRadius: 1.1 },
        complexity: 'medium' as const,
        estimatedCost: 1800,
      };
    },
  ];

  const strategies = strategyFactories
    .map(f => f())
    .filter(Boolean)
    .slice(0, numSchemes);

  for (const strategy of strategies) {
    if (!strategy) continue;

    try {
      const optimizedResult = runSimulation(strategy.params);
      const parameterChanges = calculateParameterChanges(baseParams, strategy.params);
      const improvementMetrics = calculateImprovementMetrics(baseResult, optimizedResult);
      const objectives = generateObjectives(baseResult, optimizedResult);
      const constraints = generateConstraints(baseResult, optimizedResult);

      const overallImprovement = improvementMetrics
        .filter(m => m.isBetter)
        .reduce((sum, m) => sum + Math.abs(m.improvementPercent), 0) /
        Math.max(1, improvementMetrics.filter(m => m.isBetter).length);

      const feasibilityScore = calculateFeasibilityScore(
        improvementMetrics,
        strategy.complexity,
        strategy.estimatedCost
      );

      const riskLevel = strategy.type === 'comprehensive' ? 'medium' :
        strategy.complexity === 'high' ? 'medium' : 'low';

      schemes.push({
        id: generateId(),
        name: strategy.name,
        description: strategy.description,
        type: strategy.type,
        baseParameters: baseParams,
        optimizedParameters: strategy.params,
        parameterChanges,
        objectives,
        constraints,
        baseSimulationResult: baseResult,
        optimizedSimulationResult: optimizedResult,
        improvementMetrics,
        overallImprovement: Math.round(overallImprovement * 10) / 10,
        feasibilityScore: Math.round(feasibilityScore * 10) / 10,
        implementationComplexity: strategy.complexity,
        estimatedCost: Math.round(strategy.estimatedCost * 100) / 100,
        estimatedTime: strategy.complexity === 'high' ? 24 : strategy.complexity === 'medium' ? 12 : 6,
        riskLevel,
        recommendations: generateRecommendations(improvementMetrics, riskLevel),
        createdAt: Date.now(),
      });
    } catch {
      continue;
    }
  }

  return schemes.sort((a, b) => b.overallImprovement - a.overallImprovement);
}

const MATERIAL_COSTS: Record<string, { perSpoke: number; perWheel: number }> = {
  elm: { perSpoke: 80, perWheel: 1200 },
  oak: { perSpoke: 100, perWheel: 1500 },
  ash: { perSpoke: 90, perWheel: 1300 },
  iron: { perSpoke: 300, perWheel: 4500 },
  bamboo: { perSpoke: 60, perWheel: 900 },
};

function calculateParameterChanges(
  oldParams: WheelParameters,
  newParams: WheelParameters
): StructuralOptimizationScheme['parameterChanges'] {
  const changes: StructuralOptimizationScheme['parameterChanges'] = [];
  const paramNames: Record<keyof WheelParameters, string> = {
    wheelRadius: '车轮半径',
    spokeCount: '轮辐数量',
    axleLoad: '车轴载重',
    impactIntensity: '冲击强度',
    materialId: '轮辐材料',
    spokeWidth: '轮辐宽度',
    spokeHeight: '轮辐高度',
    roadConditionId: '路况类型',
    operatingCycles: '运行循环次数',
  };

  const betterParams: Record<keyof WheelParameters, (oldVal: any, newVal: any) => boolean> = {
    wheelRadius: (oldV, newV) => newV > oldV,
    spokeCount: (oldV, newV) => newV > oldV,
    axleLoad: (oldV, newV) => newV < oldV,
    impactIntensity: (oldV, newV) => newV < oldV,
    materialId: (oldV, newV) => {
      const oldMat = getMaterialById(oldV);
      const newMat = getMaterialById(newV);
      return oldMat && newMat ? newMat.enduranceLimit > oldMat.enduranceLimit : false;
    },
    spokeWidth: (oldV, newV) => newV > oldV,
    spokeHeight: (oldV, newV) => newV > oldV,
    roadConditionId: () => false,
    operatingCycles: () => false,
  };

  for (const key of Object.keys(paramNames) as Array<keyof WheelParameters>) {
    const oldValue = oldParams[key];
    const newValue = newParams[key];
    if (oldValue !== newValue) {
      let changePercent = 0;
      if (typeof oldValue === 'number' && typeof newValue === 'number' && oldValue !== 0) {
        changePercent = ((newValue - oldValue) / oldValue) * 100;
      }
      const isBetter = betterParams[key](oldValue, newValue);
      changes.push({
        parameterId: key,
        parameterName: paramNames[key],
        oldValue,
        newValue,
        changePercent: Math.round(changePercent * 10) / 10,
        isBetter,
      });
    }
  }

  return changes;
}

function calculateImprovementMetrics(
  base: SimulationResult,
  optimized: SimulationResult
): StructuralOptimizationScheme['improvementMetrics'] {
  const baseMaxForce = base.maxForce;
  const optimizedMaxForce = optimized.maxForce;
  const forceImprovement = baseMaxForce - optimizedMaxForce;
  const forceImprovementPercent = (forceImprovement / baseMaxForce) * 100;

  const baseDamage = base.fatigueAnalysis.totalDamage;
  const optimizedDamage = optimized.fatigueAnalysis.totalDamage;
  const damageImprovement = baseDamage - optimizedDamage;
  const damageImprovementPercent = (damageImprovement / Math.max(0.001, baseDamage)) * 100;

  const baseSF = base.fatigueAnalysis.safetyFactor === Infinity ? 10 : base.fatigueAnalysis.safetyFactor;
  const optimizedSF = optimized.fatigueAnalysis.safetyFactor === Infinity ? 10 : optimized.fatigueAnalysis.safetyFactor;
  const sfImprovement = optimizedSF - baseSF;
  const sfImprovementPercent = (sfImprovement / baseSF) * 100;

  const baseLife = base.fatigueAnalysis.minCycleLife === Infinity ? 1e7 : base.fatigueAnalysis.minCycleLife;
  const optimizedLife = optimized.fatigueAnalysis.minCycleLife === Infinity ? 1e7 : optimized.fatigueAnalysis.minCycleLife;
  const lifeImprovement = optimizedLife - baseLife;
  const lifeImprovementPercent = (lifeImprovement / baseLife) * 100;

  const baseWeight = calculateWheelWeight(base.parameters);
  const optimizedWeight = calculateWheelWeight(optimized.parameters);
  const weightChange = optimizedWeight - baseWeight;
  const weightChangePercent = (weightChange / baseWeight) * 100;

  const baseCost = MATERIAL_COSTS[base.material.id]?.perWheel || 1200;
  const optimizedCost = MATERIAL_COSTS[optimized.material.id]?.perWheel || 1200;
  const costChange = optimizedCost - baseCost;
  const costChangePercent = (costChange / baseCost) * 100;

  return [
    {
      metric: '最大受力',
      before: baseMaxForce,
      after: optimizedMaxForce,
      improvement: forceImprovement,
      improvementPercent: forceImprovementPercent,
      unit: 'N',
      isBetter: optimizedMaxForce < baseMaxForce,
    },
    {
      metric: '累积损伤',
      before: baseDamage,
      after: optimizedDamage,
      improvement: damageImprovement,
      improvementPercent: damageImprovementPercent,
      unit: '',
      isBetter: optimizedDamage < baseDamage,
    },
    {
      metric: '安全系数',
      before: baseSF,
      after: optimizedSF,
      improvement: sfImprovement,
      improvementPercent: sfImprovementPercent,
      unit: 'x',
      isBetter: optimizedSF > baseSF,
    },
    {
      metric: '最短寿命',
      before: baseLife,
      after: optimizedLife,
      improvement: lifeImprovement,
      improvementPercent: lifeImprovementPercent,
      unit: '次',
      isBetter: optimizedLife > baseLife,
    },
    {
      metric: '车轮重量',
      before: baseWeight,
      after: optimizedWeight,
      improvement: -weightChange,
      improvementPercent: -weightChangePercent,
      unit: 'kg',
      isBetter: optimizedWeight < baseWeight,
    },
    {
      metric: '材料成本',
      before: baseCost,
      after: optimizedCost,
      improvement: -costChange,
      improvementPercent: -costChangePercent,
      unit: '钱',
      isBetter: optimizedCost < baseCost,
    },
  ];
}

function calculateWheelWeight(params: WheelParameters): number {
  const material = getMaterialById(params.materialId);
  const hubVolume = Math.PI * Math.pow(params.wheelRadius * 0.12, 2) * params.wheelRadius * 0.2;
  const rimVolume = 2 * Math.PI * params.wheelRadius * params.wheelRadius * 0.06 * params.wheelRadius * 0.06;
  const spokeVolume = params.spokeCount * params.spokeWidth * params.spokeHeight * (params.wheelRadius - params.wheelRadius * 0.12);
  const totalVolume = hubVolume + rimVolume + spokeVolume;
  return Math.round(totalVolume * material.density * 100) / 100;
}

function generateObjectives(
  base: SimulationResult,
  optimized: SimulationResult
): OptimizationObjective[] {
  return [
    {
      id: 'min_force',
      name: '最小化最大受力',
      description: '降低轮辐最大受力',
      target: 'minimize',
      currentValue: base.maxForce,
      targetValue: optimized.maxForce,
      unit: 'N',
      weight: 20,
      isPrimary: true,
    },
    {
      id: 'max_safety_factor',
      name: '最大化安全系数',
      description: '提升结构安全系数',
      target: 'maximize',
      currentValue: base.fatigueAnalysis.safetyFactor === Infinity ? 10 : base.fatigueAnalysis.safetyFactor,
      targetValue: optimized.fatigueAnalysis.safetyFactor === Infinity ? 10 : optimized.fatigueAnalysis.safetyFactor,
      unit: 'x',
      weight: 25,
      isPrimary: true,
    },
    {
      id: 'max_life',
      name: '最大化疲劳寿命',
      description: '延长车轮使用寿命',
      target: 'maximize',
      currentValue: base.fatigueAnalysis.minCycleLife === Infinity ? 1e7 : base.fatigueAnalysis.minCycleLife,
      targetValue: optimized.fatigueAnalysis.minCycleLife === Infinity ? 1e7 : optimized.fatigueAnalysis.minCycleLife,
      unit: '次',
      weight: 20,
      isPrimary: true,
    },
    {
      id: 'min_damage',
      name: '最小化累积损伤',
      description: '降低疲劳累积损伤',
      target: 'minimize',
      currentValue: base.fatigueAnalysis.totalDamage,
      targetValue: optimized.fatigueAnalysis.totalDamage,
      unit: '',
      weight: 15,
      isPrimary: false,
    },
    {
      id: 'min_weight',
      name: '最小化车轮重量',
      description: '降低车轮总重量',
      target: 'minimize',
      currentValue: calculateWheelWeight(base.parameters),
      targetValue: calculateWheelWeight(optimized.parameters),
      unit: 'kg',
      weight: 10,
      isPrimary: false,
    },
    {
      id: 'min_cost',
      name: '最小化材料成本',
      description: '控制制造成本',
      target: 'minimize',
      currentValue: MATERIAL_COSTS[base.material.id]?.perWheel || 1200,
      targetValue: MATERIAL_COSTS[optimized.material.id]?.perWheel || 1200,
      unit: '钱',
      weight: 10,
      isPrimary: false,
    },
  ];
}

function generateConstraints(
  base: SimulationResult,
  optimized: SimulationResult
): OptimizationConstraint[] {
  const constraints: OptimizationConstraint[] = [];

  constraints.push({
    id: 'max_force',
    name: '最大受力约束',
    description: '轮辐最大受力不得超过阈值',
    type: 'max_force',
    limitValue: FORCE_THRESHOLD,
    currentValue: optimized.maxForce,
    unit: 'N',
    isViolated: optimized.maxForce > FORCE_THRESHOLD,
    violationAmount: Math.max(0, optimized.maxForce - FORCE_THRESHOLD),
  });

  const minSF = 1.5;
  const currentSF = optimized.fatigueAnalysis.safetyFactor === Infinity ? 10 : optimized.fatigueAnalysis.safetyFactor;
  constraints.push({
    id: 'min_safety_factor',
    name: '安全系数约束',
    description: '安全系数不得低于推荐值',
    type: 'min_safety_factor',
    limitValue: minSF,
    currentValue: currentSF,
    unit: 'x',
    isViolated: currentSF < minSF,
    violationAmount: Math.max(0, minSF - currentSF),
  });

  const maxDamage = 0.8;
  constraints.push({
    id: 'max_damage',
    name: '最大损伤约束',
    description: '累积损伤不得超过临界值',
    type: 'max_damage',
    limitValue: maxDamage,
    currentValue: optimized.fatigueAnalysis.totalDamage,
    unit: '',
    isViolated: optimized.fatigueAnalysis.totalDamage > maxDamage,
    violationAmount: Math.max(0, optimized.fatigueAnalysis.totalDamage - maxDamage),
  });

  const minLife = base.parameters.operatingCycles;
  const currentLife = optimized.fatigueAnalysis.minCycleLife === Infinity ? 1e7 : optimized.fatigueAnalysis.minCycleLife;
  constraints.push({
    id: 'min_life',
    name: '最低寿命约束',
    description: '疲劳寿命不得低于设计寿命',
    type: 'min_life',
    limitValue: minLife,
    currentValue: currentLife,
    unit: '次',
    isViolated: currentLife < minLife,
    violationAmount: Math.max(0, minLife - currentLife),
  });

  return constraints;
}

function calculateFeasibilityScore(
  metrics: StructuralOptimizationScheme['improvementMetrics'],
  complexity: 'low' | 'medium' | 'high',
  estimatedCost: number
): number {
  const improvementScore = metrics
    .filter(m => m.isBetter)
    .reduce((sum, m) => sum + Math.abs(m.improvementPercent), 0);

  const complexityPenalty = complexity === 'high' ? 20 : complexity === 'medium' ? 10 : 0;
  const costPenalty = Math.min(30, estimatedCost / 100);

  return Math.max(0, Math.min(100, improvementScore - complexityPenalty - costPenalty));
}

function generateRecommendations(
  metrics: StructuralOptimizationScheme['improvementMetrics'],
  riskLevel: 'low' | 'medium' | 'high'
): string[] {
  const recommendations: string[] = [];

  const goodMetrics = metrics.filter(m => m.isBetter && Math.abs(m.improvementPercent) > 5);
  const badMetrics = metrics.filter(m => !m.isBetter && Math.abs(m.improvementPercent) > 5);

  if (goodMetrics.length > 0) {
    recommendations.push(`优势: ${goodMetrics.map(m => `${m.metric}改善${Math.abs(m.improvementPercent).toFixed(1)}%`).join('，')}`);
  }

  if (badMetrics.length > 0) {
    recommendations.push(`注意: ${badMetrics.map(m => `${m.metric}恶化${Math.abs(m.improvementPercent).toFixed(1)}%`).join('，')}`);
  }

  if (riskLevel === 'high') {
    recommendations.push('风险较高，建议先进行小规模试验验证');
  } else if (riskLevel === 'medium') {
    recommendations.push('风险中等，建议制定详细的实施计划');
  } else {
    recommendations.push('风险较低，可按计划实施');
  }

  return recommendations;
}

export function evaluateMultiSchemeDecision(
  schemes: StructuralOptimizationScheme[],
  customWeights?: Record<string, number>
): MultiSchemeDecisionResult {
  const criteria = customWeights ?
    DECISION_CRITERIA.map(c => ({
      ...c,
      weight: customWeights[c.id] ?? c.weight,
    })) :
    DECISION_CRITERIA;

  const scores: SchemeScore[] = schemes.map(scheme => {
    const metrics = scheme.improvementMetrics;
    const criteriaScores: SchemeScore['criteriaScores'] = [];

    for (const criterion of criteria) {
      let rawValue = 0;

      switch (criterion.id) {
        case 'max_force_reduction':
          rawValue = Math.max(0, metrics.find(m => m.metric === '最大受力')?.improvementPercent || 0);
          break;
        case 'safety_factor_improvement':
          rawValue = Math.max(0, metrics.find(m => m.metric === '安全系数')?.improvementPercent || 0);
          break;
        case 'life_extension':
          rawValue = Math.max(0, metrics.find(m => m.metric === '最短寿命')?.improvementPercent || 0);
          break;
        case 'damage_reduction':
          rawValue = Math.max(0, metrics.find(m => m.metric === '累积损伤')?.improvementPercent || 0);
          break;
        case 'implementation_cost':
          rawValue = scheme.estimatedCost;
          break;
        case 'weight_effect':
          rawValue = Math.max(0, metrics.find(m => m.metric === '车轮重量')?.improvementPercent || 0);
          break;
        case 'maintainability':
          rawValue = scheme.implementationComplexity === 'low' ? 90 :
            scheme.implementationComplexity === 'medium' ? 70 : 50;
          break;
        case 'strategic_value':
          rawValue = scheme.type === 'comprehensive' ? 90 :
            scheme.type === 'material' ? 80 :
              scheme.type === 'geometry' ? 70 : 60;
          break;
      }

      const allValues = schemes.map(s => {
        switch (criterion.id) {
          case 'max_force_reduction':
            return Math.max(0, s.improvementMetrics.find(m => m.metric === '最大受力')?.improvementPercent || 0);
          case 'safety_factor_improvement':
            return Math.max(0, s.improvementMetrics.find(m => m.metric === '安全系数')?.improvementPercent || 0);
          case 'life_extension':
            return Math.max(0, s.improvementMetrics.find(m => m.metric === '最短寿命')?.improvementPercent || 0);
          case 'damage_reduction':
            return Math.max(0, s.improvementMetrics.find(m => m.metric === '累积损伤')?.improvementPercent || 0);
          case 'implementation_cost':
            return s.estimatedCost;
          case 'weight_effect':
            return Math.max(0, s.improvementMetrics.find(m => m.metric === '车轮重量')?.improvementPercent || 0);
          case 'maintainability':
            return s.implementationComplexity === 'low' ? 90 :
              s.implementationComplexity === 'medium' ? 70 : 50;
          case 'strategic_value':
            return s.type === 'comprehensive' ? 90 :
              s.type === 'material' ? 80 :
                s.type === 'geometry' ? 70 : 60;
          default:
            return 0;
        }
      });

      const minVal = Math.min(...allValues);
      const maxVal = Math.max(...allValues);
      const range = maxVal - minVal;

      let normalizedScore = 0;
      if (range > 0) {
        if (criterion.higherIsBetter) {
          normalizedScore = ((rawValue - minVal) / range) * 100;
        } else {
          normalizedScore = ((maxVal - rawValue) / range) * 100;
        }
      } else {
        normalizedScore = 50;
      }

      const weightedScore = (normalizedScore / 100) * criterion.weight;

      criteriaScores.push({
        criteriaId: criterion.id,
        criteriaName: criterion.name,
        rawValue: Math.round(rawValue * 100) / 100,
        normalizedScore: Math.round(normalizedScore * 10) / 10,
        weightedScore: Math.round(weightedScore * 10) / 10,
      });
    }

    const totalScore = criteriaScores.reduce((sum, cs) => sum + cs.weightedScore, 0);
    const maxPossibleScore = criteria.reduce((sum, c) => sum + c.weight, 0);
    const normalizedTotalScore = (totalScore / maxPossibleScore) * 100;

    let grade: SchemeScore['grade'] = 'D';
    if (normalizedTotalScore >= 90) grade = 'S';
    else if (normalizedTotalScore >= 80) grade = 'A';
    else if (normalizedTotalScore >= 70) grade = 'B';
    else if (normalizedTotalScore >= 60) grade = 'C';

    const strengths = criteriaScores
      .filter(cs => cs.normalizedScore >= 70)
      .map(cs => `${cs.criteriaName}: ${cs.normalizedScore.toFixed(1)}分`);

    const weaknesses = criteriaScores
      .filter(cs => cs.normalizedScore < 50)
      .map(cs => `${cs.criteriaName}: ${cs.normalizedScore.toFixed(1)}分`);

    const recommendations: string[] = [];
    if (grade === 'S' || grade === 'A') {
      recommendations.push('方案优秀，推荐优先采用');
    } else if (grade === 'B') {
      recommendations.push('方案良好，可考虑实施');
    } else if (grade === 'C') {
      recommendations.push('方案一般，建议进一步优化');
    } else {
      recommendations.push('方案较差，不建议采用');
    }

    if (weaknesses.length > 0) {
      recommendations.push(`需改进: ${weaknesses.map(w => w.split(':')[0]).join('、')}`);
    }

    return {
      schemeId: scheme.id,
      schemeName: scheme.name,
      criteriaScores,
      totalScore: Math.round(totalScore * 10) / 10,
      maxPossibleScore,
      normalizedTotalScore: Math.round(normalizedTotalScore * 10) / 10,
      grade,
      rank: 0,
      strengths,
      weaknesses,
      recommendations,
    };
  });

  scores.sort((a, b) => b.normalizedTotalScore - a.normalizedTotalScore);
  scores.forEach((score, index) => {
    score.rank = index + 1;
  });

  const recommendedSchemeId = scores[0]?.schemeId || '';

  const comparisonMatrix = schemes.map((scheme, _) =>
    schemes.map((_, j) => {
      const scoreI = scores.find(s => s.schemeId === scheme.id);
      const scoreJ = scores.find(s => s.schemeId === schemes[j].id);
      if (!scoreI || !scoreJ) return 0;
      return scoreI.normalizedTotalScore - scoreJ.normalizedTotalScore;
    })
  );

  const sensitivityAnalysis = criteria.map(criterion => {
    const originalWeights = Object.fromEntries(criteria.map(c => [c.id, c.weight]));
    const perturbedWeights = { ...originalWeights, [criterion.id]: criterion.weight * 1.5 };
    const perturbedScores = evaluateMultiSchemeDecision(schemes, perturbedWeights).scores;

    const originalRanks = Object.fromEntries(scores.map(s => [s.schemeId, s.rank]));
    const perturbedRanks = Object.fromEntries(perturbedScores.map(s => [s.schemeId, s.rank]));

    let maxRankChange = 0;
    for (const schemeId of Object.keys(originalRanks)) {
      const change = Math.abs(originalRanks[schemeId] - perturbedRanks[schemeId]);
      if (change > maxRankChange) maxRankChange = change;
    }

    return {
      criteriaId: criterion.id,
      weightChange: 50,
      rankChange: maxRankChange,
    };
  });

  const topScheme = schemes.find(s => s.id === recommendedSchemeId);
  const conclusion = topScheme ?
    `综合评估结果，推荐采用"${topScheme.name}"。该方案在${scores[0]?.strengths.slice(0, 2).join('、')}等方面表现突出，综合得分为${scores[0]?.normalizedTotalScore.toFixed(1)}分，评级为${scores[0]?.grade}级。` :
    '未能确定最优方案，建议重新评估。';

  return {
    id: generateId(),
    name: '多方案决策评估',
    description: '基于多准则决策分析的结构优化方案综合评估',
    createdAt: Date.now(),
    schemes,
    scores,
    criteria,
    recommendedSchemeId,
    comparisonMatrix,
    sensitivityAnalysis,
    conclusion,
  };
}

export function createMissionFromTemplate(
  template: LoadMission,
  customOverrides?: Partial<LoadMission>
): LoadMission {
  return {
    ...template,
    id: generateId(),
    ...customOverrides,
  };
}

export function createMissionGroup(
  name: string,
  description: string,
  missions: LoadMission[],
  startTime: number = Date.now()
): MissionGroup {
  const totalCycles = missions.reduce((sum, m) => sum + m.durationCycles, 0);
  const totalLoad = missions.reduce((sum, m) => sum + m.totalLoad, 0);
  const maxLoad = Math.max(...missions.map(m => m.totalLoad));
  const terrainSequence = missions.flatMap(m => m.terrainIds);
  const estimatedTotalDamage = missions.reduce((sum, m) => sum + m.estimatedDamage, 0);

  const endTime = startTime + missions.reduce((sum, m) => sum + m.durationHours, 0) * 60 * 60 * 1000;

  return {
    id: generateId(),
    name,
    description,
    missions,
    startTime,
    endTime,
    totalCycles,
    totalLoad,
    averageLoad: Math.round((totalLoad / missions.length) * 100) / 100,
    maxLoad,
    terrainSequence,
    estimatedTotalDamage: Math.round(estimatedTotalDamage * 10000) / 10000,
    requiredWheels: missions.length * 4,
    status: 'planned',
    missionProgress: 0,
  };
}
