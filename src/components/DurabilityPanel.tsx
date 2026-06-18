import React from 'react';
import { Paper, Title, Stack, Text, Group, Badge, SimpleGrid, Card, Divider, Progress, Accordion, ThemeIcon, RingProgress, Box, Tooltip } from '@mantine/core';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer, ReferenceLine, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { SimulationResult, FORCE_THRESHOLD, SNCurvePoint, DamageAccumulationPoint, MultiRoadResult, OptimizationSuggestion } from '../types';
import { IconAlertTriangle, IconCheck, IconBulb, IconTrendingDown, IconShield, IconFlame } from '@tabler/icons-react';

interface DurabilityPanelProps {
  result: SimulationResult | null;
}

function getDamageColor(damage: number): string {
  if (damage < 0.3) return '#40c057';
  if (damage < 0.7) return '#fd7e14';
  return '#fa5252';
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return 'red';
    case 'medium': return 'orange';
    case 'low': return 'green';
    default: return 'gray';
  }
}

function getTypeBadgeColor(type: string): string {
  switch (type) {
    case 'material': return 'blue';
    case 'geometry': return 'violet';
    case 'load': return 'teal';
    case 'road': return 'yellow';
    default: return 'gray';
  }
}

function formatNumber(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(0);
}

const DurabilityPanel: React.FC<DurabilityPanelProps> = ({ result }) => {
  if (!result) {
    return (
      <Paper p="xl" withBorder>
        <Stack align="center" gap="md">
          <IconShield size={48} color="gray" />
          <Text c="dimmed" size="lg">请先运行仿真以查看耐久性评估结果</Text>
        </Stack>
      </Paper>
    );
  }

  const fatigue = result.fatigueAnalysis;

  const snCurveDataMpa = fatigue.snCurveData.map((point: SNCurvePoint) => ({
    cycles: point.cycles,
    stress: point.stress / 1e6,
  }));

  const enduranceLimitMpa = result.material.enduranceLimit / 1e6;

  const damageAccumulationData = fatigue.damageAccumulationData.map((point: DamageAccumulationPoint) => ({
    ...point,
    cycleLabel: formatNumber(point.cycle),
    fill: point.totalDamage >= 0.7 ? '#fa5252' : point.totalDamage >= 0.3 ? '#fd7e14' : '#40c057',
  }));

  const multiRoadData = result.multiRoadResults.map((mr: MultiRoadResult) => ({
    name: mr.roadCondition.name,
    maxForce: mr.maxForce,
    estimatedLife: mr.estimatedLife,
    color: mr.roadCondition.color,
  }));

  const criticalSpokesCount = fatigue.criticalSpokes.length;

  const safetyFactorDisplay = fatigue.safetyFactor === Infinity ? '∞' : fatigue.safetyFactor.toFixed(2);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={4} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconFlame size={22} />
          古战车车轮多工况耐久性评估
        </Title>
        <Badge size="lg" variant="light" color={getDamageColor(fatigue.totalDamage)}>
          {fatigue.totalDamage < 0.3 ? '安全' : fatigue.totalDamage < 0.7 ? '警告' : '危险'}
        </Badge>
      </Group>

      <SimpleGrid cols={5} spacing="sm">
        <Card withBorder padding="sm">
          <Stack gap={4} align="center">
            <Text size="xs" c="dimmed">累积损伤</Text>
            <Text fw={700} size="xl" c={getDamageColor(fatigue.totalDamage)}>
              {fatigue.totalDamage.toFixed(4)}
            </Text>
            <Progress
              value={Math.min(fatigue.totalDamage * 100, 100)}
              color={getDamageColor(fatigue.totalDamage)}
              size="sm"
              w="100%"
            />
          </Stack>
        </Card>

        <Card withBorder padding="sm">
          <Stack gap={4} align="center">
            <Text size="xs" c="dimmed">失效概率</Text>
            <Text fw={700} size="xl" c={fatigue.failureProbability > 0.5 ? 'red' : fatigue.failureProbability > 0.2 ? 'orange' : 'green'}>
              {(fatigue.failureProbability * 100).toFixed(1)}%
            </Text>
            <RingProgress
              size={50}
              thickness={6}
              roundCaps
              sections={[{ value: fatigue.failureProbability * 100, color: fatigue.failureProbability > 0.5 ? 'red' : fatigue.failureProbability > 0.2 ? 'orange' : 'green' }]}
            />
          </Stack>
        </Card>

        <Card withBorder padding="sm">
          <Stack gap={4} align="center">
            <Text size="xs" c="dimmed">安全系数</Text>
            <Text fw={700} size="xl" c={fatigue.safetyFactor >= 2 ? 'green' : fatigue.safetyFactor >= 1.5 ? 'orange' : 'red'}>
              {safetyFactorDisplay}
            </Text>
            <IconShield size={18} color={fatigue.safetyFactor >= 2 ? '#40c057' : fatigue.safetyFactor >= 1.5 ? '#fd7e14' : '#fa5252'} />
          </Stack>
        </Card>

        <Card withBorder padding="sm">
          <Stack gap={4} align="center">
            <Text size="xs" c="dimmed">剩余寿命</Text>
            <Text fw={700} size="xl" c={fatigue.remainingLifePercent > 50 ? 'green' : fatigue.remainingLifePercent > 20 ? 'orange' : 'red'}>
              {fatigue.remainingLifePercent.toFixed(1)}%
            </Text>
            <Progress
              value={fatigue.remainingLifePercent}
              color={fatigue.remainingLifePercent > 50 ? 'green' : fatigue.remainingLifePercent > 20 ? 'orange' : 'red'}
              size="sm"
              w="100%"
            />
          </Stack>
        </Card>

        <Card withBorder padding="sm">
          <Stack gap={4} align="center">
            <Text size="xs" c="dimmed">临界轮辐</Text>
            <Text fw={700} size="xl" c={criticalSpokesCount > 0 ? 'red' : 'green'}>
              {criticalSpokesCount}
            </Text>
            {criticalSpokesCount > 0 ? (
              <Tooltip label={`轮辐 ${fatigue.criticalSpokes.join(', ')} 处于高风险`}>
                <Box>
                  <IconAlertTriangle size={18} color="#fa5252" />
                </Box>
              </Tooltip>
            ) : (
              <IconCheck size={18} color="#40c057" />
            )}
          </Stack>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={2} spacing="md">
        <Paper withBorder p="md">
          <Title order={5} mb="sm">S-N 曲线 (疲劳寿命)</Title>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={snCurveDataMpa} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="cycles"
                type="number"
                scale="log"
                domain={['auto', 'auto']}
                tickFormatter={formatNumber}
                label={{ value: '循环次数', position: 'insideBottom', offset: -2 }}
              />
              <YAxis
                label={{ value: '应力 (MPa)', angle: -90, position: 'insideLeft' }}
              />
              <RTooltip
                formatter={(value: number) => [`${value.toFixed(2)} MPa`, '应力']}
                labelFormatter={(label: number) => `循环: ${formatNumber(label)}`}
              />
              <ReferenceLine
                y={enduranceLimitMpa}
                stroke="#fa5252"
                strokeDasharray="5 5"
                label={{ value: `持久极限 ${enduranceLimitMpa.toFixed(1)} MPa`, position: 'insideTopRight', fill: '#fa5252', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="stress"
                stroke="#4c6ef5"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        <Paper withBorder p="md">
          <Title order={5} mb="sm">损伤累积曲线</Title>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={damageAccumulationData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="cycleLabel"
                label={{ value: '循环次数', position: 'insideBottom', offset: -2 }}
              />
              <YAxis
                label={{ value: '累积损伤 D', angle: -90, position: 'insideLeft' }}
              />
              <RTooltip
                formatter={(value: number, name: string) => {
                  if (name === 'totalDamage') return [value.toFixed(4), '总损伤'];
                  if (name === 'maxSpokeDamage') return [value.toFixed(4), '最大轮辐损伤'];
                  return [value, name];
                }}
                labelFormatter={(label: string) => `循环: ${label}`}
              />
              <Legend formatter={(value: string) => value === 'totalDamage' ? '总损伤' : value === 'maxSpokeDamage' ? '最大轮辐损伤' : value} />
              <ReferenceLine
                y={1.0}
                stroke="#fa5252"
                strokeDasharray="5 5"
                label={{ value: '失效阈值 D=1.0', position: 'insideTopRight', fill: '#fa5252', fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="totalDamage"
                stroke="#4c6ef5"
                fill="#4c6ef5"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="maxSpokeDamage"
                stroke="#fd7e14"
                fill="#fd7e14"
                fillOpacity={0.1}
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      </SimpleGrid>

      <Paper withBorder p="md">
        <Title order={5} mb="sm">多路面工况对比</Title>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={multiRoadData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
              yAxisId="left"
              orientation="left"
              label={{ value: '最大力 (N)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: '预估寿命 (次循环)', angle: 90, position: 'insideRight' }}
              tickFormatter={formatNumber}
            />
            <RTooltip
              formatter={(value: number, name: string) => {
                if (name === 'maxForce') return [`${value.toFixed(1)} N`, '最大力'];
                if (name === 'estimatedLife') return [formatNumber(value), '预估寿命'];
                return [value, name];
              }}
            />
            <Legend formatter={(value: string) => value === 'maxForce' ? '最大力 (N)' : value === 'estimatedLife' ? '预估寿命 (次循环)' : value} />
            <ReferenceLine yAxisId="left" y={FORCE_THRESHOLD} stroke="#fa5252" strokeDasharray="5 5" label={{ value: '力阈值', position: 'insideTopLeft', fill: '#fa5252', fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="maxForce" radius={[4, 4, 0, 0]}>
              {multiRoadData.map((entry: { color: string }, index: number) => (
                <Cell key={`force-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Bar yAxisId="right" dataKey="estimatedLife" radius={[4, 4, 0, 0]} fillOpacity={0.6}>
              {multiRoadData.map((entry: { color: string }, index: number) => (
                <Cell key={`life-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      <Paper withBorder p="md">
        <Title order={5} mb="sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconBulb size={20} />
          优化建议
        </Title>
        <Accordion variant="separated" multiple>
          {fatigue.optimizationSuggestions.map((suggestion: OptimizationSuggestion, index: number) => (
            <Accordion.Item key={index} value={`suggestion-${index}`}>
              <Accordion.Control>
                <Group gap="sm">
                  <ThemeIcon
                    size="sm"
                    color={getPriorityColor(suggestion.priority)}
                    variant="light"
                  >
                    {suggestion.priority === 'high' ? (
                      <IconAlertTriangle size={14} />
                    ) : suggestion.priority === 'medium' ? (
                      <IconTrendingDown size={14} />
                    ) : (
                      <IconCheck size={14} />
                    )}
                  </ThemeIcon>
                  <Text fw={500}>{suggestion.title}</Text>
                  <Badge size="xs" color={getPriorityColor(suggestion.priority)} variant="light">
                    {suggestion.priority === 'high' ? '高优先级' : suggestion.priority === 'medium' ? '中优先级' : '低优先级'}
                  </Badge>
                  <Badge size="xs" color={getTypeBadgeColor(suggestion.type)} variant="light">
                    {suggestion.type === 'material' ? '材料' : suggestion.type === 'geometry' ? '几何' : suggestion.type === 'load' ? '载荷' : '路面'}
                  </Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  <Text size="sm">{suggestion.description}</Text>
                  <Divider />
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">预期改善:</Text>
                    <Badge size="xs" color="teal" variant="light">
                      {suggestion.expectedImprovement}
                    </Badge>
                  </Group>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Paper>
    </Stack>
  );
};

export default DurabilityPanel;
