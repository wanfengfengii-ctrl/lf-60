import React, { useState, useMemo } from 'react';
import {
  Paper,
  Text,
  Stack,
  Group,
  Badge,
  Progress,
  Box,
  ThemeIcon,
  Table,
  Divider,
  ScrollArea,
  SimpleGrid,
  Card,
  Center,
  Chip,
  Timeline,
} from '@mantine/core';
import {
  IconUsers,
  IconTools,
  IconClock,
  IconCalendar,
  IconAlertTriangle,
  IconTool,
  IconStar,
  IconTrendingUp,
} from '@tabler/icons-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import {
  Technician,
  Equipment,
  ResourceSchedule,
  MaintenanceTask,
  TECHNICIAN_SKILL_LABELS,
} from '../types';

interface ResourceSchedulingPanelProps {
  technicians: Technician[];
  equipment: Equipment[];
  schedules: ResourceSchedule[];
  tasks: MaintenanceTask[];
}

const ResourceSchedulingPanel: React.FC<ResourceSchedulingPanelProps> = ({
  technicians,
  equipment,
  schedules,
  tasks,
}) => {
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [resourceType, setResourceType] = useState<'technicians' | 'equipment'>('technicians');

  const selectedSchedule = schedules[selectedDateIdx];

  const stats = useMemo(() => {
    const availableTechs = technicians.filter((t) => t.available).length;
    const totalWorkload = technicians.reduce((sum, t) => sum + t.currentWorkload, 0);
    const avgWorkload = technicians.length > 0 ? totalWorkload / technicians.length : 0;
    const availableEquipment = equipment.filter((e) => e.available).length;
    const totalUtilization = schedules.reduce((sum, s) => sum + s.utilizationRate, 0) / schedules.length;

    return {
      totalTechs: technicians.length,
      availableTechs,
      avgWorkload,
      totalEquipment: equipment.length,
      availableEquipment,
      avgUtilization: totalUtilization,
    };
  }, [technicians, equipment, schedules]);

  const workloadDistribution = useMemo(() => {
    return technicians.map((tech) => ({
      name: tech.name,
      workload: tech.currentWorkload,
      tasks: tasks.filter((t) => t.assignedTechnician === tech.name).length,
    }));
  }, [technicians, tasks]);

  const utilizationTrend = useMemo(() => {
    return schedules.map((s) => ({
      date: `${new Date(s.date).getMonth() + 1}/${new Date(s.date).getDate()}`,
      utilization: s.utilizationRate,
      allocatedHours: s.totalAllocatedHours,
    }));
  }, [schedules]);

  const dailyAllocations = useMemo(() => {
    if (!selectedSchedule) return [];
    return selectedSchedule.allocations.map((alloc) => {
      const tech = technicians.find((t) => t.id === alloc.technicianId);
      const task = tasks.find((t) => t.id === alloc.taskId);
      return { alloc, tech, task };
    });
  }, [selectedSchedule, technicians, tasks]);

  const skillDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    technicians.forEach((t) => {
      counts[t.skillLevel] = (counts[t.skillLevel] || 0) + 1;
    });
    return Object.entries(counts).map(([level, count]) => ({
      name: TECHNICIAN_SKILL_LABELS[level as Technician['skillLevel']],
      count,
    }));
  }, [technicians]);

  const equipmentTypeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    equipment.forEach((e) => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ name: type, count }));
  }, [equipment]);

  if (technicians.length === 0 && equipment.length === 0) {
    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Center py="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="md" color="gray" variant="light">
              <IconUsers size={32} />
            </ThemeIcon>
            <Text c="dimmed" ta="center">暂无资源调度数据</Text>
            <Text size="xs" c="dimmed" ta="center">请先生成车队数据以查看维修资源调度</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, md: 6 }} spacing="md">
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <ThemeIcon size="md" radius="md" color="blue" variant="light">
                <IconUsers size={16} />
              </ThemeIcon>
            </Group>
            <Box>
              <Text size="xs" c="dimmed">技术人员</Text>
              <Text fw={700} size="xl">{stats.totalTechs}</Text>
            </Box>
            <Text size="xs" c="green">可用 {stats.availableTechs} 人</Text>
          </Stack>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <ThemeIcon size="md" radius="md" color="orange" variant="light">
                <IconTrendingUp size={16} />
              </ThemeIcon>
            </Group>
            <Box>
              <Text size="xs" c="dimmed">平均工作负载</Text>
              <Text fw={700} size="xl">{stats.avgWorkload.toFixed(1)}%</Text>
            </Box>
            <Progress value={stats.avgWorkload} size="sm" color={stats.avgWorkload > 80 ? 'red' : stats.avgWorkload > 60 ? 'orange' : 'green'} />
          </Stack>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <ThemeIcon size="md" radius="md" color="cyan" variant="light">
                <IconTools size={16} />
              </ThemeIcon>
            </Group>
            <Box>
              <Text size="xs" c="dimmed">设备总数</Text>
              <Text fw={700} size="xl">{stats.totalEquipment}</Text>
            </Box>
            <Text size="xs" c="green">可用 {stats.availableEquipment} 台</Text>
          </Stack>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <ThemeIcon size="md" radius="md" color="violet" variant="light">
                <IconClock size={16} />
              </ThemeIcon>
            </Group>
            <Box>
              <Text size="xs" c="dimmed">平均资源利用率</Text>
              <Text fw={700} size="xl" c="violet">{stats.avgUtilization.toFixed(1)}%</Text>
            </Box>
            <Progress value={stats.avgUtilization} size="sm" color="violet" />
          </Stack>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <ThemeIcon size="md" radius="md" color="green" variant="light">
                <IconCalendar size={16} />
              </ThemeIcon>
            </Group>
            <Box>
              <Text size="xs" c="dimmed">今日计划任务</Text>
              <Text fw={700} size="xl">{selectedSchedule?.allocations.length || 0}</Text>
            </Box>
            <Text size="xs" c="dimmed">{selectedSchedule?.totalAllocatedHours || 0} 工时</Text>
          </Stack>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <ThemeIcon size="md" radius="md" color="red" variant="light">
                <IconAlertTriangle size={16} />
              </ThemeIcon>
            </Group>
            <Box>
              <Text size="xs" c="dimmed">资源冲突</Text>
              <Text fw={700} size="xl" c="red">0</Text>
            </Box>
            <Text size="xs" c="green">当前无冲突</Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <Group gap="md">
        <Chip
          checked={resourceType === 'technicians'}
          onClick={() => setResourceType('technicians')}
          size="md"
        >
          <IconUsers size={14} style={{ marginRight: 4 }} />
          人员调度
        </Chip>
        <Chip
          checked={resourceType === 'equipment'}
          onClick={() => setResourceType('equipment')}
          size="md"
        >
          <IconTools size={14} style={{ marginRight: 4 }} />
          设备管理
        </Chip>
      </Group>

      {resourceType === 'technicians' ? (
        <>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                    <IconUsers size={20} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">技术人员工作负载</Text>
                </Group>
                <Box style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workloadDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="workload" name="工作量 (%)" radius={[0, 4, 4, 0]}>
                        {workloadDistribution.map((entry, idx) => (
                          <Cell key={idx} fill={entry.workload > 80 ? '#ff6b6b' : entry.workload > 60 ? '#fab005' : '#40c057'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Stack>
            </Card>

            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                    <IconTrendingUp size={20} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">资源利用率趋势</Text>
                </Group>
                <Box style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={utilizationTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar yAxisId="left" dataKey="utilization" name="利用率 (%)" fill="#339af0" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="allocatedHours" name="分配工时 (h)" fill="#40c057" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Stack>
            </Card>
          </SimpleGrid>

          <Card shadow="sm" p="md" radius="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
                    <IconCalendar size={20} />
                  </ThemeIcon>
                  <Stack gap={0}>
                    <Text fw={600} size="sm">人员排班</Text>
                    <Text size="xs" c="dimmed">
                      {selectedSchedule ? new Date(selectedSchedule.date).toLocaleDateString('zh-CN') : '无数据'}
                    </Text>
                  </Stack>
                </Group>
                <Group gap="xs">
                  {schedules.map((_, idx) => (
                    <Chip
                      key={idx}
                      checked={selectedDateIdx === idx}
                      onClick={() => setSelectedDateIdx(idx)}
                      size="xs"
                    >
                      {new Date(schedules[idx].date).getDate()}日
                    </Chip>
                  ))}
                </Group>
              </Group>

              {selectedSchedule && (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                  <Box>
                    <Text size="sm" fw={600} mb="sm">时间线</Text>
                    <ScrollArea h={350} type="hover">
                      <Timeline active={dailyAllocations.length} bulletSize={24} lineWidth={2}>
                        {dailyAllocations.map(({ alloc, tech, task }, _idx) => (
                          <Timeline.Item
                            key={alloc.taskId}
                            bullet={
                              <ThemeIcon
                                size={24}
                                radius="xl"
                                color={task?.priority === 'critical' ? 'red' : task?.priority === 'high' ? 'orange' : 'blue'}
                                variant="filled"
                              >
                                <IconTool size={12} />
                              </ThemeIcon>
                            }
                            title={`${new Date(alloc.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(alloc.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`}
                          >
                            <Card p="xs" radius="md" withBorder>
                              <Stack gap={4}>
                                <Group justify="space-between">
                                  <Text fw={600} size="sm">{task?.title}</Text>
                                  <Badge
                                    color={task?.priority === 'critical' ? 'red' : task?.priority === 'high' ? 'orange' : 'blue'}
                                    variant="filled"
                                    size="xs"
                                  >
                                    {task?.priority === 'critical' ? '紧急' : task?.priority === 'high' ? '高' : '中'}
                                  </Badge>
                                </Group>
                                <Group gap="xs">
                                  <IconUsers size={12} color="dimmed" />
                                  <Text size="xs">{tech?.name}</Text>
                                  <Badge size="xs" variant="light" color="gray">
                                    {tech ? TECHNICIAN_SKILL_LABELS[tech.skillLevel] : ''}
                                  </Badge>
                                </Group>
                                <Text size="xs" c="dimmed">{task?.description}</Text>
                              </Stack>
                            </Card>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    </ScrollArea>
                  </Box>

                  <Box>
                    <Text size="sm" fw={600} mb="sm">人员详情</Text>
                    <ScrollArea h={350} type="hover">
                      <Stack gap="sm">
                        {technicians.map((tech) => (
                          <Card key={tech.id} p="sm" radius="md" withBorder>
                            <Stack gap="sm">
                              <Group justify="space-between">
                                <Group gap="xs">
                                  <ThemeIcon
                                    size="md"
                                    radius="md"
                                    color={tech.available ? 'green' : 'gray'}
                                    variant="light"
                                  >
                                    <IconUsers size={16} />
                                  </ThemeIcon>
                                  <Stack gap={0}>
                                    <Text fw={600} size="sm">{tech.name}</Text>
                                    <Group gap="xs">
                                      <Badge size="xs" variant="light">
                                        {TECHNICIAN_SKILL_LABELS[tech.skillLevel]}
                                      </Badge>
                                      <Text size="xs" c="dimmed">¥{tech.hourlyRate}/h</Text>
                                    </Group>
                                  </Stack>
                                </Group>
                                <Badge
                                  color={tech.available ? 'green' : 'gray'}
                                  variant="dot"
                                  size="xs"
                                >
                                  {tech.available ? '在岗' : '休假'}
                                </Badge>
                              </Group>
                              <Divider />
                              <Stack gap={4}>
                                <Group justify="space-between">
                                  <Text size="xs" c="dimmed">当前工作负载</Text>
                                  <Text size="xs" fw={600} c={tech.currentWorkload > 80 ? 'red' : tech.currentWorkload > 60 ? 'orange' : 'green'}>
                                    {tech.currentWorkload}%
                                  </Text>
                                </Group>
                                <Progress
                                  value={tech.currentWorkload}
                                  color={tech.currentWorkload > 80 ? 'red' : tech.currentWorkload > 60 ? 'orange' : 'green'}
                                  size="sm"
                                />
                              </Stack>
                              <Group gap="xs" wrap="wrap">
                                {tech.specialties.map((spec, idx) => (
                                  <Badge key={idx} size="xs" variant="light" color="blue">
                                    <IconStar size={8} style={{ marginRight: 2 }} />
                                    {spec}
                                  </Badge>
                                ))}
                              </Group>
                              <Group gap="xs">
                                <Text size="xs" c="dimmed">今日任务:</Text>
                                <Text size="xs" fw={600}>
                                  {dailyAllocations.filter((a) => a.tech?.id === tech.id).length} 项
                                </Text>
                              </Group>
                            </Stack>
                          </Card>
                        ))}
                      </Stack>
                    </ScrollArea>
                  </Box>
                </SimpleGrid>
              )}
            </Stack>
          </Card>

          <Card shadow="sm" p="md" radius="md" withBorder>
            <Stack gap="md">
              <Group gap="xs">
                <ThemeIcon size="lg" radius="md" color="violet" variant="light">
                  <IconStar size={20} />
                </ThemeIcon>
                <Text fw={600} size="sm">技能分布</Text>
              </Group>
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <Box style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="人数" radius={[4, 4, 0, 0]}>
                        {skillDistribution.map((_, idx) => (
                          <Cell key={idx} fill={['#40c057', '#339af0', '#fab005', '#ff6b6b'][idx]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
                <Box>
                  <Text size="sm" fw={600} mb="sm">人员列表</Text>
                  <ScrollArea h={180} type="hover">
                    <Table withTableBorder withColumnBorders striped>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>姓名</Table.Th>
                          <Table.Th>等级</Table.Th>
                          <Table.Th>专长</Table.Th>
                          <Table.Th>时薪</Table.Th>
                          <Table.Th>状态</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {technicians.map((tech) => (
                          <Table.Tr key={tech.id}>
                            <Table.Td>
                              <Text size="xs" fw={600}>{tech.name}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge size="xs" variant="light">{TECHNICIAN_SKILL_LABELS[tech.skillLevel]}</Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="xs">{tech.specialties.join(', ')}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="xs">¥{tech.hourlyRate}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge color={tech.available ? 'green' : 'gray'} size="xs" variant="dot">
                                {tech.available ? '在岗' : '休假'}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Box>
              </SimpleGrid>
            </Stack>
          </Card>
        </>
      ) : (
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
                <IconTools size={20} />
              </ThemeIcon>
              <Text fw={600} size="sm">设备管理</Text>
            </Group>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Box style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={equipmentTypeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="数量" radius={[4, 4, 0, 0]} fill="#339af0" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Box>
                <Text size="sm" fw={600} mb="sm">设备列表</Text>
                <ScrollArea h={180} type="hover">
                  <Table withTableBorder withColumnBorders striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>设备名称</Table.Th>
                        <Table.Th>类型</Table.Th>
                        <Table.Th>状态</Table.Th>
                        <Table.Th>下次校准</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {equipment.map((eq) => (
                        <Table.Tr key={eq.id}>
                          <Table.Td>
                            <Text size="xs" fw={600}>{eq.name}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge size="xs" variant="light">{eq.type}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={eq.available ? 'green' : 'red'} size="xs" variant="dot">
                              {eq.available ? '可用' : '维护中'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">
                              {eq.maintenanceSchedule[0] ? new Date(eq.maintenanceSchedule[0].date).toLocaleDateString('zh-CN') : '-'}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Box>
            </SimpleGrid>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};

export default ResourceSchedulingPanel;
