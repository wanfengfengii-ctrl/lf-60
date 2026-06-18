import React from 'react';
import {
  Paper,
  Title,
  Stack,
  Text,
  Group,
  Badge,
  SimpleGrid,
  Card,
  Divider,
} from '@mantine/core';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  SimulationResult,
  FORCE_THRESHOLD,
  SpokeForceData,
} from '../types';

interface ForceChartsProps {
  result: SimulationResult | null;
}

interface ForceChartDataPoint {
  spokeIndex: string;
  staticForce: number;
  impactForce: number;
  totalForce: number;
  exceedsThreshold: boolean;
  fatigueRisk: number;
}

const ForceCharts: React.FC<ForceChartsProps> = ({ result }) => {
  if (!result) {
    return (
      <Paper shadow="sm" p="md" radius="md" withBorder h="100%">
        <Stack align="center" justify="center" h={400}>
          <Text c="dimmed" size="lg">
            请配置参数并运行模拟以查看结果
          </Text>
        </Stack>
      </Paper>
    );
  }

  const chartData: ForceChartDataPoint[] = result.spokeData.map(
    (spoke: SpokeForceData) => ({
      spokeIndex: `#${spoke.spokeIndex + 1}`,
      staticForce: spoke.staticForce,
      impactForce: spoke.impactForce,
      totalForce: spoke.totalForce,
      exceedsThreshold: spoke.exceedsThreshold,
      fatigueRisk: spoke.fatigueRisk,
    })
  );

  const radarData = result.spokeData.map((spoke: SpokeForceData) => ({
    spoke: `#${spoke.spokeIndex + 1}`,
    受力值: Math.min(100, (spoke.totalForce / result.maxForce) * 100),
    疲劳风险: spoke.fatigueRisk,
    fullMark: 100,
  }));

  const exceededCount = result.spokeData.filter(
    (s) => s.exceedsThreshold
  ).length;
  const highRiskCount = result.spokeData.filter((s) => s.fatigueRisk > 70)
    .length;
  const avgFatigueRisk =
    result.spokeData.reduce((sum, s) => sum + s.fatigueRisk, 0) /
    result.spokeData.length;

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={4}>模拟结果分析</Title>
          <Group gap="xs">
            <Badge color={exceededCount > 0 ? 'red' : 'green'} variant="light">
              超载: {exceededCount} 根
            </Badge>
            <Badge color={highRiskCount > 0 ? 'orange' : 'blue'} variant="light">
              高风险: {highRiskCount} 根
            </Badge>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
          <Card p="sm" shadow="sm" radius="md" withBorder>
            <Text size="xs" c="dimmed">
              最大受力
            </Text>
            <Text fw={700} size="xl">
              {result.maxForce.toLocaleString()} N
            </Text>
            <Badge
              color={result.maxForce > FORCE_THRESHOLD ? 'red' : 'green'}
              size="sm"
              variant="dot"
              mt="xs"
            >
              {result.maxForce > FORCE_THRESHOLD ? '超过阈值' : '安全范围内'}
            </Badge>
          </Card>
          <Card p="sm" shadow="sm" radius="md" withBorder>
            <Text size="xs" c="dimmed">
              平均受力
            </Text>
            <Text fw={700} size="xl">
              {result.averageForce.toLocaleString()} N
            </Text>
            <Badge
              color={result.averageForce > FORCE_THRESHOLD * 0.7 ? 'orange' : 'blue'}
              size="sm"
              variant="dot"
              mt="xs"
            >
              承载率: {((result.averageForce / FORCE_THRESHOLD) * 100).toFixed(1)}%
            </Badge>
          </Card>
          <Card p="sm" shadow="sm" radius="md" withBorder>
            <Text size="xs" c="dimmed">
              平均疲劳风险
            </Text>
            <Text fw={700} size="xl">
              {avgFatigueRisk.toFixed(1)}%
            </Text>
            <Badge
              color={avgFatigueRisk > 60 ? 'red' : avgFatigueRisk > 30 ? 'orange' : 'green'}
              size="sm"
              variant="dot"
              mt="xs"
            >
              {avgFatigueRisk > 60 ? '高风险' : avgFatigueRisk > 30 ? '中等' : '低风险'}
            </Badge>
          </Card>
          <Card p="sm" shadow="sm" radius="md" withBorder>
            <Text size="xs" c="dimmed">
              轮辐数量
            </Text>
            <Text fw={700} size="xl">
              {result.parameters.spokeCount} 根
            </Text>
            <Badge color="blue" size="sm" variant="dot" mt="xs">
              分布: 均匀 ({(360 / result.parameters.spokeCount).toFixed(1)}°/根)
            </Badge>
          </Card>
        </SimpleGrid>

        <Divider />

        <Stack gap="xs">
          <Group justify="space-between">
            <Title order={5}>各轮辐受力分布</Title>
            <Text size="xs" c="dimmed">
              红色虚线为承载阈值 ({FORCE_THRESHOLD.toLocaleString()} N)
            </Text>
          </Group>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="spokeIndex"
                  tick={{ fontSize: 11 }}
                  interval={Math.floor(result.spokeData.length / 12)}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  label={{
                    value: '受力 (N)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 12 },
                  }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()} N`,
                    name === 'staticForce'
                      ? '静态受力'
                      : name === 'impactForce'
                      ? '冲击受力'
                      : '总受力',
                  ]}
                  labelFormatter={(label) => `轮辐 ${label}`}
                />
                <Legend
                  formatter={(value) =>
                    value === 'staticForce'
                      ? '静态受力'
                      : value === 'impactForce'
                      ? '冲击受力'
                      : '总受力'
                  }
                />
                <ReferenceLine
                  y={FORCE_THRESHOLD}
                  stroke="#ff4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: '阈值',
                    position: 'right',
                    fill: '#ff4444',
                    fontSize: 11,
                  }}
                />
                <Bar
                  dataKey="staticForce"
                  stackId="force"
                  fill="#4dabf7"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="impactForce"
                  stackId="force"
                  fill="#ffa94d"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="totalForce"
                  fill="transparent"
                  stroke="transparent"
                  legendType="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.exceedsThreshold ? 'rgba(255, 0, 0, 0)' : 'rgba(0,0,0,0)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="spokeIndex"
                  tick={{ fontSize: 11 }}
                  interval={Math.floor(result.spokeData.length / 12)}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  label={{
                    value: '总受力 (N)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 12 },
                  }}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toLocaleString()} N`,
                    '总受力',
                  ]}
                  labelFormatter={(label) => `轮辐 ${label}`}
                />
                <ReferenceLine
                  y={FORCE_THRESHOLD}
                  stroke="#ff4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
                <Bar dataKey="totalForce" radius={[4, 4, 0, 0]} name="总受力">
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.exceedsThreshold
                          ? '#ff2222'
                          : entry.totalForce > FORCE_THRESHOLD * 0.8
                          ? '#ff8800'
                          : entry.totalForce > FORCE_THRESHOLD * 0.5
                          ? '#ffcc00'
                          : '#339af0'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Stack>

        <Divider />

        <Stack gap="xs">
          <Title order={5}>疲劳风险雷达图</Title>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#d0d0d0" />
                <PolarAngleAxis
                  dataKey="spoke"
                  tick={{ fontSize: 10 }}
                  interval={Math.floor(result.spokeData.length / 12)}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="相对受力值(%)"
                  dataKey="受力值"
                  stroke="#339af0"
                  fill="#339af0"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="疲劳风险(%)"
                  dataKey="疲劳风险"
                  stroke="#ff6b6b"
                  fill="#ff6b6b"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Stack>

        <Divider />

        <Stack gap="xs">
          <Title order={5}>疲劳风险指数</Title>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="spokeIndex"
                  tick={{ fontSize: 11 }}
                  interval={Math.floor(result.spokeData.length / 12)}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  domain={[0, 100]}
                  label={{
                    value: '风险指数 (%)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 12 },
                  }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, '疲劳风险']}
                  labelFormatter={(label) => `轮辐 ${label}`}
                />
                <ReferenceLine
                  y={70}
                  stroke="#ff4444"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{
                    value: '高风险线',
                    position: 'right',
                    fill: '#ff4444',
                    fontSize: 11,
                  }}
                />
                <ReferenceLine
                  y={30}
                  stroke="#ffbb33"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{
                    value: '中风险线',
                    position: 'right',
                    fill: '#ffbb33',
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="fatigueRisk" radius={[4, 4, 0, 0]} name="疲劳风险">
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`fatigue-${index}`}
                      fill={
                        entry.fatigueRisk > 70
                          ? '#ff2222'
                          : entry.fatigueRisk > 30
                          ? '#ffbb33'
                          : '#40c057'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default ForceCharts;
