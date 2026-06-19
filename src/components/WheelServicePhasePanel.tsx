import React, { useState, useMemo } from 'react';
import {
  Paper,
  Text,
  Stack,
  Group,
  Badge,
  Box,
  ThemeIcon,
  Divider,
  SimpleGrid,
  Card,
  Timeline,
  RingProgress,
  Center,
  Select,
  Fieldset,
} from '@mantine/core';
import {
  IconWheel,
  IconCalendar,
  IconRoute,
  IconTool,
  IconHeartbeat,
  IconHistory,
  IconCircleCheck,
  IconAlertTriangle,
  IconClock,
} from '@tabler/icons-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  WheelServiceRecord,
  SERVICE_PHASE_LABELS,
  SERVICE_PHASE_COLORS,
  ServicePhase,
} from '../types';

interface WheelServicePhasePanelProps {
  wheels: WheelServiceRecord[];
}

const WHEEL_POSITION_LABELS: Record<string, string> = {
  front_left: '左前轮',
  front_right: '右前轮',
  rear_left: '左后轮',
  rear_right: '右后轮',
};

const WheelServicePhasePanel: React.FC<WheelServicePhasePanelProps> = ({ wheels }) => {
  const [selectedWheelId, setSelectedWheelId] = useState<string>(wheels[0]?.identity.id || '');

  const selectedWheel = useMemo(
    () => wheels.find((w) => w.identity.id === selectedWheelId) || wheels[0],
    [wheels, selectedWheelId]
  );

  const phaseProgressData = useMemo(() => {
    if (!selectedWheel) return [];
    return selectedWheel.phaseHistory.map((phase) => ({
      name: SERVICE_PHASE_LABELS[phase.phase],
      cycles: phase.cycles / 10000,
      mileage: phase.mileage,
      duration: phase.endedAt
        ? Math.round((phase.endedAt - phase.startedAt) / (24 * 60 * 60 * 1000))
        : Math.round((Date.now() - phase.startedAt) / (24 * 60 * 60 * 1000)),
    }));
  }, [selectedWheel]);

  const healthTrendData = useMemo(() => {
    if (!selectedWheel) return [];
    const data = [];
    let health = 100;
    for (let i = 0; i <= 10; i++) {
      const cycles = (selectedWheel.totalCycles / 10) * i;
      health = Math.max(20, 100 - (cycles / selectedWheel.totalCycles) * (100 - selectedWheel.currentHealthScore));
      data.push({
        cycles: Math.round(cycles / 10000) + '万次',
        health: Math.round(health * 10) / 10,
        maintenance: Math.floor((cycles / 50000)),
      });
    }
    return data;
  }, [selectedWheel]);

  const phaseOrder: ServicePhase[] = ['new', 'running_in', 'normal_service', 'wear_period', 'critical', 'retired'];
  const currentPhaseIndex = phaseOrder.indexOf(selectedWheel?.currentPhase || 'new');

  if (wheels.length === 0) {
    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Center py="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="md" color="gray" variant="light">
              <IconWheel size={32} />
            </ThemeIcon>
            <Text c="dimmed" ta="center">暂无车轮服役数据</Text>
            <Text size="xs" c="dimmed" ta="center">请先生成车队数据以查看服役阶段管理</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Card shadow="sm" p="md" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <ThemeIcon size="lg" radius="md" color="blue" variant="light">
              <IconWheel size={20} />
            </ThemeIcon>
            <Text fw={600} size="sm">选择车轮</Text>
          </Group>
          <Select
            value={selectedWheelId}
            onChange={(v) => v && setSelectedWheelId(v)}
            data={wheels.map((w) => ({
              value: w.identity.id,
              label: `${w.identity.serialNumber} - ${WHEEL_POSITION_LABELS[w.position] || w.position}`,
            }))}
            style={{ width: 350 }}
            searchable
            placeholder="搜索车轮编号..."
          />
        </Group>
      </Card>

      {selectedWheel && (
        <>
          <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <ThemeIcon size="md" radius="md" color="blue" variant="light">
                    <IconWheel size={16} />
                  </ThemeIcon>
                  <Badge
                    color={SERVICE_PHASE_COLORS[selectedWheel.currentPhase] as any}
                    variant="light"
                  >
                    {SERVICE_PHASE_LABELS[selectedWheel.currentPhase]}
                  </Badge>
                </Group>
                <Box>
                  <Text size="xs" c="dimmed">车轮编号</Text>
                  <Text fw={700} size="sm">{selectedWheel.identity.serialNumber}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">安装位置</Text>
                  <Text fw={600}>{WHEEL_POSITION_LABELS[selectedWheel.position] || selectedWheel.position}</Text>
                </Box>
              </Stack>
            </Card>

            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <ThemeIcon size="md" radius="md" color="cyan" variant="light">
                    <IconRoute size={16} />
                  </ThemeIcon>
                </Group>
                <Box>
                  <Text size="xs" c="dimmed">累计行驶里程</Text>
                  <Text fw={700} size="xl">{selectedWheel.totalMileage.toLocaleString()} <Text size="sm" c="dimmed">km</Text></Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">累计循环次数</Text>
                  <Text fw={600}>{(selectedWheel.totalCycles / 10000).toFixed(1)} 万次</Text>
                </Box>
              </Stack>
            </Card>

            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <ThemeIcon size="md" radius="md" color="orange" variant="light">
                <IconTool size={16} />
              </ThemeIcon>
                </Group>
                <SimpleGrid cols={2} spacing="xs">
                  <Box>
                    <Text size="xs" c="dimmed">维护次数</Text>
                    <Text fw={700} size="lg">{selectedWheel.maintenanceCount}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">维修次数</Text>
                    <Text fw={700} size="lg" c="orange">{selectedWheel.repairCount}</Text>
                  </Box>
                </SimpleGrid>
                <Box>
                  <Text size="xs" c="dimmed">累计成本</Text>
                  <Text fw={600} c="red">¥{selectedWheel.totalCost.toLocaleString()}</Text>
                </Box>
              </Stack>
            </Card>

            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <ThemeIcon
                    size="md"
                    radius="md"
                    color={selectedWheel.currentHealthScore > 60 ? 'green' : selectedWheel.currentHealthScore > 40 ? 'yellow' : 'red'}
                    variant="light"
                  >
                    <IconHeartbeat size={16} />
                  </ThemeIcon>
                </Group>
                <Center>
                  <RingProgress
                    size={100}
                    thickness={10}
                    sections={[{
                      value: selectedWheel.currentHealthScore,
                      color: selectedWheel.currentHealthScore > 60 ? '#40c057' : selectedWheel.currentHealthScore > 40 ? '#fab005' : '#ff6b6b'
                    }]}
                    label={
                      <Center>
                        <Text fw={700} size="lg" c={selectedWheel.currentHealthScore > 60 ? 'green' : selectedWheel.currentHealthScore > 40 ? 'yellow' : 'red'}>
                          {selectedWheel.currentHealthScore}%
                        </Text>
                      </Center>
                    }
                  />
                </Center>
                <Text ta="center" size="xs" c="dimmed">当前健康度</Text>
              </Stack>
            </Card>
          </SimpleGrid>

          <Card shadow="sm" p="md" radius="md" withBorder>
            <Stack gap="md">
              <Group gap="xs">
                <ThemeIcon size="lg" radius="md" color="violet" variant="light">
                  <IconHistory size={20} />
                </ThemeIcon>
                <Text fw={600} size="sm">生命周期阶段追踪</Text>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                <Box>
                  <Group gap={0} mb="md">
                    {phaseOrder.map((phase, idx) => {
                      const isActive = idx < currentPhaseIndex;
                      const isCurrent = idx === currentPhaseIndex;
                      const PhaseIcon = isCurrent
                        ? IconAlertTriangle
                        : isActive
                        ? IconCircleCheck
                        : IconClock;
                      return (
                        <Box key={phase} style={{ flex: 1, textAlign: 'center' }}>
                          <ThemeIcon
                            size="md"
                            radius="md"
                            color={isCurrent
                              ? (SERVICE_PHASE_COLORS[phase] as any)
                              : isActive
                              ? 'green'
                              : 'gray'}
                            variant={isCurrent ? 'filled' : isActive ? 'light' : 'outline'}
                            mb="xs"
                          >
                            <PhaseIcon size={14} />
                          </ThemeIcon>
                          <Text size="xs" fw={isCurrent ? 700 : 500} c={isCurrent ? SERVICE_PHASE_COLORS[phase] as any : isActive ? 'green' : 'dimmed'}>
                            {SERVICE_PHASE_LABELS[phase]}
                          </Text>
                          {idx < phaseOrder.length - 1 && (
                            <Box style={{ position: 'absolute', top: 16, left: '60%', right: '-40%' }}>
                              <Divider />
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Group>

                  <Timeline active={currentPhaseIndex} bulletSize={20} lineWidth={2}>
                    {selectedWheel.phaseHistory.map((phase) => (
                      <Timeline.Item
                        key={phase.id}
                        bullet={
                          <ThemeIcon
                            size={20}
                            radius="xl"
                            color={SERVICE_PHASE_COLORS[phase.phase] as any}
                            variant="filled"
                          >
                            <IconCircleCheck size={12} />
                          </ThemeIcon>
                        }
                        title={SERVICE_PHASE_LABELS[phase.phase]}
                      >
                        <Stack gap={4}>
                          <Group gap="xs">
                            <IconCalendar size={12} />
                            <Text size="xs" c="dimmed">
                              {new Date(phase.startedAt).toLocaleDateString('zh-CN')}
                              {phase.endedAt && ` - ${new Date(phase.endedAt).toLocaleDateString('zh-CN')}`}
                            </Text>
                          </Group>
                          <Group gap="xs">
                            <IconRoute size={12} />
                            <Text size="xs" c="dimmed">{phase.mileage.toLocaleString()} km</Text>
                            <IconClock size={12} />
                            <Text size="xs" c="dimmed">{(phase.cycles / 10000).toFixed(1)} 万次</Text>
                          </Group>
                          <Text size="xs" c="dimmed">{phase.notes}</Text>
                        </Stack>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Box>

                <Box style={{ height: 280 }}>
                  <Text size="sm" fw={600} mb="xs">健康度演变趋势</Text>
                  <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={healthTrendData}>
                      <defs>
                        <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#40c057" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#40c057" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                      <XAxis dataKey="cycles" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="health"
                        stroke="#40c057"
                        strokeWidth={2}
                        fill="url(#healthGradient)"
                        name="健康度 (%)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </SimpleGrid>
            </Stack>
          </Card>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
                    <IconRoute size={20} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">各阶段里程分布</Text>
                </Group>
                <Box style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={phaseProgressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="mileage" name="里程 (km)" fill="#339af0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Stack>
            </Card>

            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                    <IconCalendar size={20} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">各阶段持续天数</Text>
                </Group>
                <Box style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={phaseProgressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="duration"
                        name="天数"
                        stroke="#fab005"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#fab005' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Stack>
            </Card>
          </SimpleGrid>

          <Fieldset legend="车辆信息">
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
              <Box>
                <Text size="xs" c="dimmed">制造日期</Text>
                <Text fw={600}>{new Date(selectedWheel.identity.manufactureDate).toLocaleDateString('zh-CN')}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">安装日期</Text>
                <Text fw={600}>{new Date(selectedWheel.identity.installationDate).toLocaleDateString('zh-CN')}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">已服役天数</Text>
                <Text fw={600}>
                  {Math.floor((Date.now() - selectedWheel.identity.installationDate) / (24 * 60 * 60 * 1000)).toLocaleString()} 天
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">上次检查</Text>
                <Text fw={600}>{new Date(selectedWheel.lastInspectionDate).toLocaleDateString('zh-CN')}</Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">下次检查</Text>
                <Text fw={600} c={selectedWheel.nextInspectionDate < Date.now() ? 'red' : 'dark'}>
                  {new Date(selectedWheel.nextInspectionDate).toLocaleDateString('zh-CN')}
                  {selectedWheel.nextInspectionDate < Date.now() && ' (已逾期)'}
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="dimmed">材料类型</Text>
                <Text fw={600}>{selectedWheel.identity.materialId}</Text>
              </Box>
            </SimpleGrid>
          </Fieldset>
        </>
      )}
    </Stack>
  );
};

export default WheelServicePhasePanel;
