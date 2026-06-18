import {
  WheelParameters,
  SpokeForceData,
  SimulationResult,
  FORCE_THRESHOLD,
} from '../types';

const GRAVITY = 9.81;

export function validateParameters(params: WheelParameters): string[] {
  const errors: string[] = [];

  if (params.wheelRadius <= 0) {
    errors.push('车轮半径必须大于 0');
  }
  if (params.spokeCount <= 0 || !Number.isInteger(params.spokeCount)) {
    errors.push('轮辐数量必须是大于 0 的整数');
  }
  if (params.axleLoad <= 0) {
    errors.push('车轴载重必须大于 0');
  }
  if (params.impactIntensity < 0) {
    errors.push('路面冲击强度不能为负数');
  }

  return errors;
}

export function runSimulation(params: WheelParameters): SimulationResult {
  const validationErrors = validateParameters(params);
  if (validationErrors.length > 0) {
    throw new Error(`参数错误: ${validationErrors.join('; ')}`);
  }

  const { wheelRadius, spokeCount, axleLoad, impactIntensity } = params;
  const spokeData: SpokeForceData[] = [];
  const totalLoad = axleLoad * GRAVITY;
  const staticPerSpoke = totalLoad / spokeCount;

  for (let i = 0; i < spokeCount; i++) {
    const angle = (2 * Math.PI * i) / spokeCount - Math.PI / 2;

    const verticalComponent = Math.sin(angle + Math.PI / 2);
    const staticForce = staticPerSpoke * Math.max(0, verticalComponent + 0.3);

    const impactAngle = (angle + Math.PI / 2) % (2 * Math.PI);
    const impactFactor = Math.max(
      0,
      Math.cos(impactAngle) * 0.6 + Math.sin(impactAngle * 3) * 0.2 + 0.3
    );
    const impactForce = impactIntensity * impactFactor * 1000;

    const radiusFactor = 1 + (wheelRadius - 0.5) * 0.5;
    const spokeFactor = 1 + (12 - Math.min(spokeCount, 24)) * 0.02;

    const totalForce =
      (staticForce + impactForce) * radiusFactor * spokeFactor;

    const fatigueRisk = calculateFatigueRisk(
      totalForce,
      spokeCount,
      impactIntensity
    );

    spokeData.push({
      spokeIndex: i,
      angle,
      staticForce: Math.round(staticForce * 100) / 100,
      impactForce: Math.round(impactForce * 100) / 100,
      totalForce: Math.round(totalForce * 100) / 100,
      fatigueRisk: Math.round(fatigueRisk * 100) / 100,
      exceedsThreshold: totalForce > FORCE_THRESHOLD,
    });
  }

  const maxForce = Math.max(...spokeData.map((s) => s.totalForce));
  const averageForce =
    spokeData.reduce((sum, s) => sum + s.totalForce, 0) / spokeData.length;

  return {
    parameters: params,
    spokeData,
    maxForce: Math.round(maxForce * 100) / 100,
    averageForce: Math.round(averageForce * 100) / 100,
    threshold: FORCE_THRESHOLD,
    timestamp: Date.now(),
  };
}

function calculateFatigueRisk(
  force: number,
  spokeCount: number,
  impactIntensity: number
): number {
  const forceRatio = force / FORCE_THRESHOLD;
  const spokeStressFactor = spokeCount < 8 ? 1.3 : spokeCount > 16 ? 0.85 : 1;
  const impactFactor = 1 + impactIntensity * 0.15;

  let risk = forceRatio * spokeStressFactor * impactFactor * 50;

  if (force > FORCE_THRESHOLD * 1.2) {
    risk += (force / FORCE_THRESHOLD - 1.2) * 200;
  }

  return Math.max(0, Math.min(100, risk));
}
