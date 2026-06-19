import React, { useMemo, useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Grid,
  Divider,
  Progress,
  Slider,
  Button,
  Box,
} from '@mantine/core';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  IconActivity,
  IconFlame,
  IconAlertTriangle,
  IconCheck,
  IconShield,
  IconClock,
  IconTarget,
} from '@tabler/icons-react';
import { DamageEvolutionResult } from '../types';

interface DamageEvolutionPanelProps {
  damageEvolution: DamageEvolutionResult | null;
}

const FAILURE_MODE_LABELS: Record<string, string> = {
  spoke_fracture: '轮辐断裂',
  hub_failure: '轮毂失效',
  rim_failure: '轮辋失效',
  fatigue_cumulative: '疲劳累积',
};

const DamageEvolutionPanel: React.FC<DamageEvolutionPanelProps> = ({ damageEvolution }) => {
  const [selectedStateIndex, setSelectedStateIndex] = useState<number>(0);

  const evolutionChartData = useMemo(() => {
    if (!damageEvolution) return [];
    return damageEvolution.states.map((state) => ({
      name: `${Math.round(state.cycle / 1000)}K`,
      cycle: state.cycle,
      totalDamage: Math.round(state.totalDamage * 1000) / 10,
      maxDamage: Math.round(state.maxDamage * 1000) / 10,
      safetyFactor: state.safetyFactor,
      structuralIntegrity: state.structuralIntegrity,
      failureProbability: Math.round(state.failureProbability * 1000) / 10,
      failedSpokes: state.failedSpokes.length,
    }));
  }, [damageEvolution]);

  const spokeDamageData = useMemo(() => {
    if (!damageEvolution) return [];
    const state = damageEvolution.states[selectedStateIndex];
    return state.spokeDamages.map((damage, index) => ({
      spoke: `#${index + 1}`,
      damage: Math.round(damage * 1000) / 10,
      crackLength: state.crackLengths[index],
      stressConcentration: state.stressConcentrations[index],
      remainingLife: state.remainingLives[index] === Infinity 
        ? 999999 
        : state.remainingLives[index],
      failed: state.failedSpokes.includes(index),
    }));
  }, [damageEvolution, selectedStateIndex]);

  const radarData = useMemo(() => {
    if (!damageEvolution) return [];
    const state = damageEvolution.states[selectedStateIndex];
    return [
      { subject: '结构完整性', A: state.structuralIntegrity, fullMark: 100 },
      { subject: '安全系数', A: Math.min(100, state.safetyFactor * 10), fullMark: 100 },
      { subject: '失效概率', A: (1 - state.failureProbability) * 100, fullMark: 100 },
      { subject: '剩余寿命', A: Math.min(100, (state.remainingLives[0] || 0) / 10000), fullMark: 100 },
      { subject: '完好轮辐', A: ((damageEvolution.states[0].spokeDamages.length - state.failedSpokes.length) / 
        damageEvolution.states[0].spokeDamages.length) * 100, fullMark: 100 },
    ];
  }, [damageEvolution, selectedStateIndex]);

  if (!damageEvolution) {
    return (
      <Stack gap="md">
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Stack align="center" gap="sm">
            <IconActivity size={48} color="#adb5bd" />
            <Text c="dimmed" ta="center">
              暂无损伤演化数据
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              请先选择战场地形并运行损伤演化仿真
            </Text>
          </Stack>
        </Paper>
      </Stack>
    );
  }

  const currentState = damageEvolution.states[selectedStateIndex];
  const hasFailure = damageEvolution.failureCycle !== null;
  const failureOccurred = hasFailure && currentState.cycle >= (damageEvolution.failureCycle || 0);

  const getHealthColor = (value: number, isInverted = false) => {
    const v = isInverted ? 1 - value : value;
    if (v > 0.8) return 'green';
    if (v > 0.6) return 'lime';
    if (v > 0.4) return 'yellow';
    if (v > 0.2) return 'orange';
    return 'red';
  };

  return (
    <Stack gap="md">
      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <IconFlame size={20} color="#e03131" />
            <Title order={4}>动态损伤演化</Title>
          </Group>
          <Group gap="xs">
            {hasFailure ? (
              <Badge color="red" variant="filled" size="lg">
                <IconAlertTriangle size={14} />
                <Text size="xs" ml={4}>
                  失效发生: {damageEvolution.failureCycle?.toLocaleString()} 循环
                </Text>
              </Badge>
            ) : (
              <Badge color="green" variant="filled" size="lg">
                <IconCheck size={14} />
                <Text size="xs" ml={4}>全程安全</Text>
              </Badge>
            )}
            {damageEvolution.failureMode && (
              <Badge color="orange" variant="light" size="lg">
                失效模式: {FAILURE_MODE_LABELS[damageEvolution.failureMode]}
              </Badge>
            )}
          </Group>
        </Group>

        <Grid gutter="md" mb="md">
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Paper bg="gray.0" p="sm" radius="sm">
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">总循环次数</Text>
                <Badge color="blue" size="sm">
                  {damageEvolution.totalCycles.toLocaleString()}
                </Badge>
              </Group>
              <Text size="lg" fw={700}>{damageEvolution.totalCycles.toLocaleString()}</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Paper bg="gray.0" p="sm" radius="sm">
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">最终损伤</Text>
                <Badge color={getHealthColor(damageEvolution.finalState.totalDamage, true)} size="sm">
                  {(damageEvolution.finalState.totalDamage * 100).toFixed(1)}%
                </Badge>
              </Group>
              <Text size="lg" fw={700}>
                {(damageEvolution.finalState.totalDamage * 100).toFixed(1)}%
              </Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Paper bg="gray.0" p="sm" radius="sm">
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">最终安全系数</Text>
                <Badge color={getHealthColor(damageEvolution.finalState.safetyFactor / 10)} size="sm">
                  {damageEvolution.finalState.safetyFactor.toFixed(2)}
                </Badge>
              </Group>
              <Text size="lg" fw={700}>
                {damageEvolution.finalState.safetyFactor.toFixed(2)}
              </Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Paper bg="gray.0" p="sm" radius="sm">
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">失效轮辐数</Text>
                <Badge color={damageEvolution.finalState.failedSpokes.length > 0 ? 'red' : 'green'} size="sm">
                  {damageEvolution.finalState.failedSpokes.length} 根
                </Badge>
              </Group>
              <Text size="lg" fw={700}>
                {damageEvolution.finalState.failedSpokes.length} / {damageEvolution.initialState.spokeDamages.length}
              </Text>
            </Paper>
          </Grid.Col>
        </Grid>

        <Divider my="sm" />

        <Box mb="md">
          <Group justify="space-between" mb="xs">
            <Text fw={600} size="sm">时间轴控制</Text>
            <Group gap="xs">
              <IconClock size={16} color="#868e96" />
              <Text size="sm" c="dimmed">
                当前循环: {currentState.cycle.toLocaleString()}
              </Text>
            </Group>
          </Group>
          <Slider
            value={selectedStateIndex}
            onChange={setSelectedStateIndex}
            min={0}
            max={damageEvolution.states.length - 1}
            step={1}
            marks={damageEvolution.states
              .filter((_, i) => i % Math.ceil(damageEvolution.states.length / 5) === 0)
              .map((state, i) => ({
                value: i * Math.ceil(damageEvolution.states.length / 5),
                label: `${Math.round(state.cycle / 1000)}K`,
              }))}
            mb="xs"
          />
          <Group gap="xs" justify="center">
            <Button
              size="xs"
              variant="light"
              onClick={() => setSelectedStateIndex(0)}
            >
              开始
            </Button>
            <Button
              size="xs"
              variant="light"
              onClick={() => setSelectedStateIndex(Math.max(0, selectedStateIndex - 1))}
              disabled={selectedStateIndex === 0}
            >
              ← 上一帧
            </Button>
            <Button
              size="xs"
              variant="light"
              onClick={() => setSelectedStateIndex(Math.min(damageEvolution.states.length - 1, selectedStateIndex + 1))}
              disabled={selectedStateIndex === damageEvolution.states.length - 1}
            >
              下一帧 →
            </Button>
            <Button
              size="xs"
              variant="light"
              onClick={() => setSelectedStateIndex(damageEvolution.states.length - 1)}
            >
              结束
            </Button>
          </Group>
        </Box>

        {failureOccurred && (
          <Paper bg="red.0" p="sm" radius="sm" mb="md">
            <Group gap="xs">
              <IconAlertTriangle size={20} color="#c92a2a" />
              <div>
                <Text fw={600} size="sm" c="red.9">
                  ⚠️ 失效已发生
                </Text>
                <Text size="sm" c="red.9">
                  在第 {damageEvolution.failureCycle?.toLocaleString()} 循环时发生
                  {FAILURE_MODE_LABELS[damageEvolution.failureMode || 'fatigue_cumulative']}
                  {damageEvolution.criticalSpokeIndex !== null && 
                    `，关键轮辐: #${damageEvolution.criticalSpokeIndex + 1}`
                  }
                </Text>
              </div>
            </Group>
          </Paper>
        )}

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="sm" radius="sm" withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={600} size="sm">损伤与失效概率趋势</Text>
                <Badge color="red" variant="light" size="sm">
                  {currentState.failedSpokes.length} 根失效
                </Badge>
              </Group>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="name" stroke="#6c757d" fontSize={12} />
                    <YAxis stroke="#6c757d" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #dee2e6',
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="totalDamage"
                      name="总损伤 (%)"
                      stroke="#ff6b6b"
                      fill="#ff6b6b"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="failureProbability"
                      name="失效概率 (%)"
                      stroke="#fab005"
                      fill="#fab005"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="failedSpokes"
                      name="失效轮辐数"
                      stroke="#c92a2a"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="sm" radius="sm" withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={600} size="sm">安全系数与结构完整性</Text>
                <Badge color={getHealthColor(currentState.safetyFactor / 10)} variant="light" size="sm">
                  {currentState.safetyFactor.toFixed(2)}
                </Badge>
              </Group>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="name" stroke="#6c757d" fontSize={12} />
                    <YAxis stroke="#6c757d" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #dee2e6',
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="safetyFactor"
                      name="安全系数"
                      stroke="#40c057"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="structuralIntegrity"
                      name="结构完整性 (%)"
                      stroke="#228be6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="sm" radius="sm" withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={600} size="sm">各轮辐损伤分布</Text>
                <Badge color="blue" variant="light" size="sm">
                  循环: {currentState.cycle.toLocaleString()}
                </Badge>
              </Group>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spokeDamageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="spoke" stroke="#6c757d" fontSize={10} />
                    <YAxis stroke="#6c757d" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #dee2e6',
                        borderRadius: 8,
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === 'damage') return [`${value}%`, '损伤'];
                        if (name === 'crackLength') return [`${value}mm`, '裂纹长度'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="damage"
                      name="损伤 (%)"
                      fill="#ff6b6b"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="crackLength"
                      name="裂纹长度 (mm)"
                      fill="#fab005"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="sm" radius="sm" withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={600} size="sm">健康状态雷达图</Text>
                <Badge color={getHealthColor(currentState.structuralIntegrity / 100)} variant="light" size="sm">
                  {currentState.structuralIntegrity.toFixed(1)}%
                </Badge>
              </Group>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e9ecef" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="当前状态"
                      dataKey="A"
                      stroke="#228be6"
                      fill="#228be6"
                      fillOpacity={0.5}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #dee2e6',
                        borderRadius: 8,
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Paper>
          </Grid.Col>
        </Grid>

        <Divider my="sm" />

        <Title order={5} mb="xs">当前状态详细指标</Title>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper
              bg={currentState.totalDamage > 0.7 ? 'red.0' : currentState.totalDamage > 0.4 ? 'orange.0' : 'green.0'}
              p="sm"
              radius="sm"
            >
              <Group gap="xs" mb="xs">
                <IconTarget size={20} color={currentState.totalDamage > 0.7 ? '#c92a2a' : currentState.totalDamage > 0.4 ? '#d9480f' : '#2f9e44'} />
                <Text fw={600} size="sm">总损伤</Text>
              </Group>
              <Text size="lg" fw={700}>
                {(currentState.totalDamage * 100).toFixed(1)}%
              </Text>
              <Progress
                value={currentState.totalDamage * 100}
                color={currentState.totalDamage > 0.7 ? 'red' : currentState.totalDamage > 0.4 ? 'orange' : 'green'}
                mt="xs"
              />
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper
              bg={currentState.safetyFactor < 1.5 ? 'red.0' : currentState.safetyFactor < 2.5 ? 'orange.0' : 'green.0'}
              p="sm"
              radius="sm"
            >
              <Group gap="xs" mb="xs">
                <IconShield size={20} color={currentState.safetyFactor < 1.5 ? '#c92a2a' : currentState.safetyFactor < 2.5 ? '#d9480f' : '#2f9e44'} />
                <Text fw={600} size="sm">安全系数</Text>
              </Group>
              <Text size="lg" fw={700}>
                {currentState.safetyFactor.toFixed(2)}
              </Text>
              <Progress
                value={Math.min(100, currentState.safetyFactor * 20)}
                color={currentState.safetyFactor < 1.5 ? 'red' : currentState.safetyFactor < 2.5 ? 'orange' : 'green'}
                mt="xs"
              />
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper
              bg={currentState.failureProbability > 0.5 ? 'red.0' : currentState.failureProbability > 0.2 ? 'orange.0' : 'green.0'}
              p="sm"
              radius="sm"
            >
              <Group gap="xs" mb="xs">
                <IconAlertTriangle size={20} color={currentState.failureProbability > 0.5 ? '#c92a2a' : currentState.failureProbability > 0.2 ? '#d9480f' : '#2f9e44'} />
                <Text fw={600} size="sm">失效概率</Text>
              </Group>
              <Text size="lg" fw={700}>
                {(currentState.failureProbability * 100).toFixed(1)}%
              </Text>
              <Progress
                value={currentState.failureProbability * 100}
                color={currentState.failureProbability > 0.5 ? 'red' : currentState.failureProbability > 0.2 ? 'orange' : 'green'}
                mt="xs"
              />
            </Paper>
          </Grid.Col>
        </Grid>

        <Divider my="sm" />

        <Title order={5} mb="xs">轮辐详细状态</Title>
        <Grid gutter="xs">
          {spokeDamageData.slice(0, 12).map((spoke, index) => (
            <Grid.Col span={{ base: 6, sm: 4, md: 3, lg: 2 }} key={index}>
              <Paper
                p="xs"
                radius="sm"
                withBorder
                bg={spoke.failed ? 'red.0' : spoke.damage > 70 ? 'orange.0' : 'gray.0'}
              >
                <Group justify="space-between" mb="xs">
                  <Text fw={600} size="xs">{spoke.spoke}</Text>
                  {spoke.failed ? (
                    <Badge color="red" size="xs">失效</Badge>
                  ) : spoke.damage > 70 ? (
                    <Badge color="orange" size="xs">危险</Badge>
                  ) : (
                    <Badge color="green" size="xs">正常</Badge>
                  )}
                </Group>
                <Text size="xs" fw={600}>
                  {spoke.damage.toFixed(1)}%
                </Text>
                <Progress
                  value={spoke.damage}
                  color={spoke.failed ? 'red' : spoke.damage > 70 ? 'orange' : 'green'}
                  size="xs"
                  mt="xs"
                />
                {spoke.crackLength > 0 && (
                  <Text size="xs" c="dimmed" mt="xs">
                    裂纹: {spoke.crackLength.toFixed(1)}mm
                  </Text>
                )}
              </Paper>
            </Grid.Col>
          ))}
        </Grid>
      </Paper>
    </Stack>
  );
};

export default DamageEvolutionPanel;
