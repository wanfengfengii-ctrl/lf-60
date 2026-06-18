import {
  WheelParameters,
  SpokeForceData,
  SimulationResult,
  FatigueAnalysis,
  SNCurvePoint,
  DamageAccumulationPoint,
  OptimizationSuggestion,
  MultiRoadResult,
  FORCE_THRESHOLD,
  ROAD_CONDITIONS,
  MATERIALS,
  getMaterialById,
  getRoadConditionById,
} from '../types';

const GRAVITY = 9.81;

export function validateParameters(params: WheelParameters): string[] {
  const errors: string[] = [];
  if (params.wheelRadius <= 0) errors.push('车轮半径必须大于 0');
  if (params.spokeCount <= 0 || !Number.isInteger(params.spokeCount))
    errors.push('轮辐数量必须是大于 0 的整数');
  if (params.axleLoad <= 0) errors.push('车轴载重必须大于 0');
  if (params.impactIntensity < 0) errors.push('路面冲击强度不能为负数');
  if (params.spokeWidth <= 0) errors.push('轮辐截面宽度必须大于 0');
  if (params.spokeHeight <= 0) errors.push('轮辐截面高度必须大于 0');
  if (params.operatingCycles <= 0) errors.push('运行工况次数必须大于 0');
  return errors;
}

function calculateCrossSectionArea(width: number, height: number): number {
  return width * height;
}

function calculateMomentOfInertia(width: number, height: number): number {
  return (width * Math.pow(height, 3)) / 12;
}

function calculateBendingStress(
  force: number,
  spokeLength: number,
  width: number,
  height: number
): number {
  const M = force * spokeLength / 4;
  const I = calculateMomentOfInertia(width, height);
  if (I === 0) return Infinity;
  return (M * (height / 2)) / I;
}

function calculateSNLife(
  stressAmplitude: number,
  materialFatigueCoefficient: number,
  materialFatigueExponent: number,
  materialEnduranceLimit: number
): number {
  if (stressAmplitude <= materialEnduranceLimit) return Infinity;
  const ratio = materialFatigueCoefficient / stressAmplitude;
  if (ratio <= 1) return 0;
  const life = Math.pow(ratio, materialFatigueExponent);
  return Math.max(1, Math.round(life));
}

function calculateMinerDamage(
  stressAmplitude: number,
  cycles: number,
  materialFatigueCoefficient: number,
  materialFatigueExponent: number,
  materialEnduranceLimit: number
): number {
  if (stressAmplitude <= materialEnduranceLimit) return 0;
  const Nf = calculateSNLife(
    stressAmplitude,
    materialFatigueCoefficient,
    materialFatigueExponent,
    materialEnduranceLimit
  );
  if (Nf === Infinity || Nf === 0) return 0;
  return cycles / Nf;
}

function generateSNCurveData(material: typeof MATERIALS[0]): SNCurvePoint[] {
  const points: SNCurvePoint[] = [];
  const stressValues = [
    material.tensileStrength * 0.95,
    material.tensileStrength * 0.8,
    material.tensileStrength * 0.6,
    material.tensileStrength * 0.45,
    material.tensileStrength * 0.35,
    material.tensileStrength * 0.28,
    material.enduranceLimit * 1.5,
    material.enduranceLimit * 1.2,
    material.enduranceLimit * 1.05,
    material.enduranceLimit,
    material.enduranceLimit * 0.9,
  ];
  for (const stress of stressValues) {
    const life = calculateSNLife(
      stress,
      material.fatigueCoefficient,
      material.fatigueExponent,
      material.enduranceLimit
    );
    points.push({
      cycles: life === Infinity ? 1e9 : life,
      stress: Math.round(stress / 1e6) / 1e6,
    });
  }
  return points.sort((a, b) => a.stress - b.stress);
}

function generateDamageAccumulationData(
  spokeData: SpokeForceData[],
  operatingCycles: number,
  material: typeof MATERIALS[0]
): DamageAccumulationPoint[] {
  const points: DamageAccumulationPoint[] = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const cycle = Math.round((operatingCycles * i) / steps);
    let maxDamage = 0;
    let failedCount = 0;
    for (const spoke of spokeData) {
      const damage = calculateMinerDamage(
        spoke.stress,
        cycle,
        material.fatigueCoefficient,
        material.fatigueExponent,
        material.enduranceLimit
      );
      if (damage > maxDamage) maxDamage = damage;
      if (damage >= 1.0) failedCount++;
    }
    points.push({ cycle, totalDamage: maxDamage, maxSpokeDamage: maxDamage, failedSpokes: failedCount });
  }
  return points;
}

function generateOptimizationSuggestions(
  params: WheelParameters,
  spokeData: SpokeForceData[],
  material: typeof MATERIALS[0],
  roadCondition: ReturnType<typeof getRoadConditionById>,
  fatigueAnalysis: FatigueAnalysis
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  const exceededCount = spokeData.filter((s) => s.exceedsThreshold).length;
  const maxSpoke = spokeData.reduce((a, b) => (a.totalForce > b.totalForce ? a : b), spokeData[0]);

  if (exceededCount > 0) {
    const increaseCount = Math.ceil(params.spokeCount * 0.2);
    suggestions.push({
      type: 'geometry',
      priority: 'high',
      title: `增加轮辐数量至 ${params.spokeCount + increaseCount} 根`,
      description: `当前 ${exceededCount} 根轮辐超过阈值，增加轮辐数可有效分散载荷`,
      expectedImprovement: `最大受力预计降低 ${((increaseCount / (params.spokeCount + increaseCount)) * 100).toFixed(0)}%`,
    });
  }

  if (params.spokeWidth < 0.06 || params.spokeHeight < 0.08) {
    suggestions.push({
      type: 'geometry',
      priority: exceededCount > 0 ? 'high' : 'medium',
      title: '增大轮辐截面尺寸',
      description: `增加截面宽度(当前${(params.spokeWidth * 100).toFixed(1)}cm)或高度(当前${(params.spokeHeight * 100).toFixed(1)}cm)可显著降低弯曲应力`,
      expectedImprovement: '截面模量增大，应力水平降低 20-40%',
    });
  }

  if (material.id !== 'iron' && material.id !== 'oak') {
    if (maxSpoke.stress > material.enduranceLimit * 0.8) {
      const betterMat = MATERIALS.find(
        (m) => m.enduranceLimit > material.enduranceLimit * 1.2 && m.id !== material.id
      );
      if (betterMat) {
        suggestions.push({
          type: 'material',
          priority: 'high',
          title: `更换材料为${betterMat.name}`,
          description: `${betterMat.name}的疲劳极限(${(betterMat.enduranceLimit / 1e6).toFixed(0)}MPa)远高于当前${material.name}(${(material.enduranceLimit / 1e6).toFixed(0)}MPa)`,
          expectedImprovement: `疲劳寿命预计提升 ${((betterMat.enduranceLimit / material.enduranceLimit - 1) * 100).toFixed(0)}%`,
        });
      }
    }
  }

  if (roadCondition.impactMultiplier > 1.0 && fatigueAnalysis.failureProbability > 0.3) {
    const betterRoad = ROAD_CONDITIONS.find(
      (r) => r.impactMultiplier < roadCondition.impactMultiplier
    );
    if (betterRoad) {
      suggestions.push({
        type: 'road',
        priority: 'medium',
        title: `改善行驶路况至${betterRoad.name}`,
        description: `从${roadCondition.name}切换至${betterRoad.name}，冲击系数从${roadCondition.impactMultiplier}降至${betterRoad.impactMultiplier}`,
        expectedImprovement: `冲击受力降低 ${((1 - betterRoad.impactMultiplier / roadCondition.impactMultiplier) * 100).toFixed(0)}%`,
      });
    }
  }

  if (params.axleLoad > 800 && exceededCount > 0) {
    const reducedLoad = Math.round(params.axleLoad * 0.8);
    suggestions.push({
      type: 'load',
      priority: exceededCount > params.spokeCount / 2 ? 'high' : 'medium',
      title: `降低载重至 ${reducedLoad}kg`,
      description: `当前载重${params.axleLoad}kg导致多数轮辐超载，减载20%可显著改善受力状态`,
      expectedImprovement: `受力水平降低约 20%，疲劳寿命提升约 ${(Math.pow(1.25, material.fatigueExponent) * 100 - 100).toFixed(0)}%`,
    });
  }

  if (fatigueAnalysis.safetyFactor < 1.5 && fatigueAnalysis.safetyFactor >= 1.0) {
    suggestions.push({
      type: 'geometry',
      priority: 'low',
      title: '优化轮辐分布角度',
      description: '当前安全裕度不足，可考虑非均匀分布以强化高载区域',
      expectedImprovement: '高载区域应力降低 10-15%',
    });
  }

  return suggestions;
}

export function runSimulation(params: WheelParameters): SimulationResult {
  const validationErrors = validateParameters(params);
  if (validationErrors.length > 0) {
    throw new Error(`参数错误: ${validationErrors.join('; ')}`);
  }

  const { wheelRadius, spokeCount, axleLoad, impactIntensity } = params;
  const material = getMaterialById(params.materialId);
  const roadCondition = getRoadConditionById(params.roadConditionId);

  const spokeData: SpokeForceData[] = [];
  const totalLoad = axleLoad * GRAVITY;
  const staticPerSpoke = totalLoad / spokeCount;
  const spokeLength = wheelRadius - wheelRadius * 0.12;
  const crossArea = calculateCrossSectionArea(params.spokeWidth, params.spokeHeight);

  for (let i = 0; i < spokeCount; i++) {
    const angle = (2 * Math.PI * i) / spokeCount - Math.PI / 2;
    const verticalComponent = Math.sin(angle + Math.PI / 2);
    const staticForce = staticPerSpoke * Math.max(0, verticalComponent + 0.3);

    const impactAngle = (angle + Math.PI / 2) % (2 * Math.PI);
    const baseImpactFactor = Math.max(
      0,
      Math.cos(impactAngle) * 0.6 + Math.sin(impactAngle * 3) * 0.2 + 0.3
    );
    const roadAdjustedImpact =
      impactIntensity * roadCondition.impactMultiplier * baseImpactFactor * 1000;

    const radiusFactor = 1 + (wheelRadius - 0.5) * 0.5;
    const spokeFactor = 1 + (12 - Math.min(spokeCount, 24)) * 0.02;

    const totalForce =
      (staticForce + roadAdjustedImpact) * radiusFactor * spokeFactor;

    const bendingStress = calculateBendingStress(
      totalForce,
      spokeLength,
      params.spokeWidth,
      params.spokeHeight
    );
    const axialStress = totalForce / (crossArea || 1e-6);
    const combinedStress = Math.sqrt(
      bendingStress * bendingStress + axialStress * axialStress
    );

    const damagePerCycle = calculateMinerDamage(
      combinedStress,
      roadCondition.frequencyFactor,
      material.fatigueCoefficient,
      material.fatigueExponent,
      material.enduranceLimit
    );
    const totalDamage = damagePerCycle * params.operatingCycles;

    const fatigueRisk = calculateFatigueRisk(
      totalForce,
      spokeCount,
      impactIntensity,
      combinedStress,
      material
    );

    const remainingLife = totalDamage >= 1
      ? 0
      : Math.max(0, 1 - totalDamage);

    spokeData.push({
      spokeIndex: i,
      angle,
      staticForce: Math.round(staticForce * 100) / 100,
      impactForce: Math.round(roadAdjustedImpact * 100) / 100,
      totalForce: Math.round(totalForce * 100) / 100,
      fatigueRisk: Math.round(fatigueRisk * 100) / 100,
      exceedsThreshold: totalForce > FORCE_THRESHOLD,
      stress: Math.round(combinedStress * 100) / 100,
      damageAccumulated: Math.round(totalDamage * 10000) / 10000,
      remainingLife: Math.round(remainingLife * 10000) / 10000,
    });
  }

  const maxForce = Math.max(...spokeData.map((s) => s.totalForce));
  const averageForce =
    spokeData.reduce((sum, s) => sum + s.totalForce, 0) / spokeData.length;

  const fatigueAnalysis = buildFatigueAnalysis(
    spokeData,
    params,
    material,
    roadCondition
  );

  const multiRoadResults = buildMultiRoadResults(params, material);

  return {
    parameters: params,
    spokeData,
    maxForce: Math.round(maxForce * 100) / 100,
    averageForce: Math.round(averageForce * 100) / 100,
    threshold: FORCE_THRESHOLD,
    timestamp: Date.now(),
    material,
    roadCondition,
    fatigueAnalysis,
    multiRoadResults,
  };
}

function calculateFatigueRisk(
  force: number,
  spokeCount: number,
  impactIntensity: number,
  stress: number,
  material: typeof MATERIALS[0]
): number {
  const forceRatio = force / FORCE_THRESHOLD;
  const spokeStressFactor = spokeCount < 8 ? 1.3 : spokeCount > 16 ? 0.85 : 1;
  const impactFactor = 1 + impactIntensity * 0.15;
  const stressRatio = stress / material.enduranceLimit;

  let risk = forceRatio * spokeStressFactor * impactFactor * 30 +
    Math.max(0, stressRatio - 0.5) * 40;

  if (force > FORCE_THRESHOLD * 1.2) {
    risk += (force / FORCE_THRESHOLD - 1.2) * 150;
  }
  if (stressRatio > 1.0) {
    risk += (stressRatio - 1.0) * 200;
  }

  return Math.max(0, Math.min(100, risk));
}

function buildFatigueAnalysis(
  spokeData: SpokeForceData[],
  params: WheelParameters,
  material: typeof MATERIALS[0],
  roadCondition: ReturnType<typeof getRoadConditionById>
): FatigueAnalysis {
  const snCurveData = generateSNCurveData(material);
  const damageAccumulationData = generateDamageAccumulationData(
    spokeData,
    params.operatingCycles,
    material
  );

  const damages = spokeData.map((s) => s.damageAccumulated);
  const totalDamage = Math.max(...damages);

  const lives = spokeData.map((s) => {
    if (s.stress <= material.enduranceLimit) return Infinity;
    return calculateSNLife(
      s.stress,
      material.fatigueCoefficient,
      material.fatigueExponent,
      material.enduranceLimit
    );
  });
  const finiteLives = lives.filter((l) => l !== Infinity);
  const maxCycleLife = finiteLives.length > 0 ? Math.max(...finiteLives) : Infinity;
  const minCycleLife = finiteLives.length > 0 ? Math.min(...finiteLives) : Infinity;
  const avgCycleLife =
    finiteLives.length > 0
      ? finiteLives.reduce((a, b) => a + b, 0) / finiteLives.length
      : Infinity;

  const failedSpokes = damages.filter((d) => d >= 1.0).length;
  const failureProbability = Math.min(
    1,
    (failedSpokes / spokeData.length) * 0.7 + totalDamage * 0.3
  );

  const criticalSpokes = spokeData
    .filter((s) => s.damageAccumulated > 0.5 || s.exceedsThreshold)
    .map((s) => s.spokeIndex);

  const maxStress = Math.max(...spokeData.map((s) => s.stress));
  const safetyFactor = maxStress > 0 ? material.yieldStrength / maxStress : Infinity;
  const remainingLifePercent = Math.max(0, Math.min(100, (1 - totalDamage) * 100));

  const optimizationSuggestions = generateOptimizationSuggestions(
    params,
    spokeData,
    material,
    roadCondition,
    {
      totalDamage,
      maxCycleLife,
      minCycleLife,
      avgCycleLife,
      failureProbability,
      snCurveData,
      damageAccumulationData,
      criticalSpokes,
      optimizationSuggestions: [],
      safetyFactor,
      remainingLifePercent,
    }
  );

  return {
    totalDamage,
    maxCycleLife,
    minCycleLife,
    avgCycleLife,
    failureProbability,
    snCurveData,
    damageAccumulationData,
    criticalSpokes,
    optimizationSuggestions,
    safetyFactor,
    remainingLifePercent,
  };
}

function buildMultiRoadResults(
  params: WheelParameters,
  material: typeof MATERIALS[0]
): MultiRoadResult[] {
  return ROAD_CONDITIONS.map((road) => {
    const totalLoad = params.axleLoad * GRAVITY;
    const staticPerSpoke = totalLoad / params.spokeCount;
    let maxForce = 0;
    let totalForceSum = 0;
    let exceededCount = 0;
    let fatigueRiskSum = 0;

    for (let i = 0; i < params.spokeCount; i++) {
      const angle = (2 * Math.PI * i) / params.spokeCount - Math.PI / 2;
      const verticalComponent = Math.sin(angle + Math.PI / 2);
      const staticForce = staticPerSpoke * Math.max(0, verticalComponent + 0.3);

      const impactAngle = (angle + Math.PI / 2) % (2 * Math.PI);
      const baseImpactFactor = Math.max(
        0,
        Math.cos(impactAngle) * 0.6 + Math.sin(impactAngle * 3) * 0.2 + 0.3
      );
      const impactForce =
        params.impactIntensity * road.impactMultiplier * baseImpactFactor * 1000;

      const radiusFactor = 1 + (params.wheelRadius - 0.5) * 0.5;
      const spokeFactor = 1 + (12 - Math.min(params.spokeCount, 24)) * 0.02;
      const totalForce = (staticForce + impactForce) * radiusFactor * spokeFactor;

      if (totalForce > maxForce) maxForce = totalForce;
      totalForceSum += totalForce;
      if (totalForce > FORCE_THRESHOLD) exceededCount++;

      const spokeLength = params.wheelRadius - params.wheelRadius * 0.12;
      const stress = calculateBendingStress(
        totalForce,
        spokeLength,
        params.spokeWidth,
        params.spokeHeight
      );
      const axialStress = totalForce / (params.spokeWidth * params.spokeHeight || 1e-6);
      const combinedStress = Math.sqrt(stress * stress + axialStress * axialStress);

      const damagePerCycle = calculateMinerDamage(
        combinedStress,
        road.frequencyFactor,
        material.fatigueCoefficient,
        material.fatigueExponent,
        material.enduranceLimit
      );
      const risk = Math.min(100, damagePerCycle * params.operatingCycles * 100 + combinedStress / material.enduranceLimit * 20);
      fatigueRiskSum += risk;
    }

    const avgForce = totalForceSum / params.spokeCount;
    const avgFatigueRisk = fatigueRiskSum / params.spokeCount;

    const maxSpokeLength = params.wheelRadius - params.wheelRadius * 0.12;
    const maxStress = calculateBendingStress(
      maxForce,
      maxSpokeLength,
      params.spokeWidth,
      params.spokeHeight
    );
    const totalDamage = calculateMinerDamage(
      maxStress,
      params.operatingCycles * road.frequencyFactor,
      material.fatigueCoefficient,
      material.fatigueExponent,
      material.enduranceLimit
    );

    const estimatedLife =
      totalDamage > 0 && totalDamage < Infinity
        ? Math.round(params.operatingCycles / totalDamage)
        : totalDamage === 0
        ? Infinity
        : 0;

    return {
      roadCondition: road,
      maxForce: Math.round(maxForce * 100) / 100,
      averageForce: Math.round(avgForce * 100) / 100,
      exceededCount,
      avgFatigueRisk: Math.round(avgFatigueRisk * 100) / 100,
      totalDamage: Math.round(totalDamage * 10000) / 10000,
      estimatedLife: estimatedLife === Infinity ? -1 : estimatedLife,
    };
  });
}

export function generateReport(
  schemeName: string,
  result: SimulationResult
): import('../types').EngineeringReport {
  const { parameters, spokeData, fatigueAnalysis, multiRoadResults, material, roadCondition } = result;
  const exceededCount = spokeData.filter((s) => s.exceedsThreshold).length;
  const criticalCount = fatigueAnalysis.criticalSpokes.length;

  const safetyLevel: 'safe' | 'warning' | 'danger' =
    fatigueAnalysis.totalDamage >= 1 || exceededCount > spokeData.length / 2
      ? 'danger'
      : exceededCount > 0 || fatigueAnalysis.totalDamage > 0.5
      ? 'warning'
      : 'safe';

  const overallScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        exceededCount * 15 -
        fatigueAnalysis.totalDamage * 30 -
        (fatigueAnalysis.safetyFactor < 1.5 ? 20 : 0) -
        (criticalCount > 0 ? criticalCount * 5 : 0)
    )
  );

  const keyFindings: string[] = [
    `最大轮辐受力 ${result.maxForce.toLocaleString()} N，${result.maxForce > FORCE_THRESHOLD ? '超过' : '低于'}阈值 ${FORCE_THRESHOLD.toLocaleString()} N`,
    `材料 ${material.name} 的疲劳极限为 ${(material.enduranceLimit / 1e6).toFixed(0)} MPa`,
    `在${roadCondition.name}条件下运行 ${parameters.operatingCycles.toLocaleString()} 次后，累积损伤为 ${(fatigueAnalysis.totalDamage * 100).toFixed(1)}%`,
    `安全系数为 ${fatigueAnalysis.safetyFactor === Infinity ? '∞' : fatigueAnalysis.safetyFactor.toFixed(2)}`,
  ];

  const criticalIssues: string[] = [];
  if (exceededCount > 0) criticalIssues.push(`${exceededCount} 根轮辐超过承载阈值`);
  if (fatigueAnalysis.totalDamage > 0.8) criticalIssues.push('疲劳损伤累积接近失效临界值');
  if (fatigueAnalysis.safetyFactor < 1.5 && fatigueAnalysis.safetyFactor !== Infinity)
    criticalIssues.push(`安全系数 ${fatigueAnalysis.safetyFactor.toFixed(2)} 低于推荐值 1.5`);
  if (criticalCount > 0) criticalIssues.push(`${criticalCount} 根轮辐处于高损伤状态`);

  return {
    title: '古战车车轮多工况耐久性评估报告',
    generatedAt: Date.now(),
    schemeName,
    sections: [
      {
        title: '一、基本信息',
        content: `车轮半径: ${parameters.wheelRadius.toFixed(2)} m\n轮辐数量: ${parameters.spokeCount} 根\n车轴载重: ${parameters.axleLoad.toFixed(1)} kg\n冲击强度: ${parameters.impactIntensity.toFixed(2)}\n材料: ${material.name} (${material.nameEn})\n轮辐截面: ${(parameters.spokeWidth * 100).toFixed(1)}cm × ${(parameters.spokeHeight * 100).toFixed(1)}cm\n路况: ${roadCondition.name}\n运行工况: ${parameters.operatingCycles.toLocaleString()} 次`,
      },
      {
        title: '二、受力分析',
        content: `最大受力: ${result.maxForce.toLocaleString()} N\n平均受力: ${result.averageForce.toLocaleString()} N\n超载轮辐: ${exceededCount} / ${parameters.spokeCount} 根\n最大应力: ${Math.max(...spokeData.map((s) => s.stress)).toFixed(0)} Pa`,
      },
      {
        title: '三、疲劳耐久性评估',
        content: `累积损伤: ${(fatigueAnalysis.totalDamage * 100).toFixed(2)}%\n失效概率: ${(fatigueAnalysis.failureProbability * 100).toFixed(1)}%\n安全系数: ${fatigueAnalysis.safetyFactor === Infinity ? '∞' : fatigueAnalysis.safetyFactor.toFixed(2)}\n剩余寿命: ${fatigueAnalysis.remainingLifePercent.toFixed(1)}%\n最短轮辐寿命: ${fatigueAnalysis.minCycleLife === Infinity ? '∞' : fatigueAnalysis.minCycleLife.toLocaleString()} 次循环`,
      },
      {
        title: '四、多路况对比',
        content: multiRoadResults
          .map(
            (r) =>
              `${r.roadCondition.name}: 最大力${r.maxForce.toLocaleString()}N, 估算寿命${r.estimatedLife === -1 ? '∞' : r.estimatedLife.toLocaleString()}次, 损伤${(r.totalDamage * 100).toFixed(2)}%`
          )
          .join('\n'),
      },
      {
        title: '五、优化建议',
        content:
          fatigueAnalysis.optimizationSuggestions.length > 0
            ? fatigueAnalysis.optimizationSuggestions
                .map((s) => `[${s.priority === 'high' ? '高' : s.priority === 'medium' ? '中' : '低'}优先级] ${s.title}: ${s.description} (预期改善: ${s.expectedImprovement})`)
                .join('\n')
            : '当前设计在安全范围内，无紧急优化需求。',
      },
    ],
    summary: { safetyLevel, overallScore: Math.round(overallScore), keyFindings, criticalIssues },
  };
}
