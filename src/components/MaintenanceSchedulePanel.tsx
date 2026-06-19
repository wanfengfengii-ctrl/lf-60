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
  ScrollArea,
  SimpleGrid,
  Card,
  Chip,
  ActionIcon,
  Center,
} from '@mantine/core';
import {
  IconCalendar,
  IconTool,
  IconClock,
  IconCurrencyDollar,
  IconCircleCheck,
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
  IconUser,
  IconPackage,
  IconChartBar,
} from '@tabler/icons-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import {
  MaintenanceSchedule,
  MaintenanceTask,
  MAINTENANCE_TASK_TYPE_LABELS,
} from '../types';

interface MaintenanceSchedulePanelProps {
  schedule: MaintenanceSchedule;
}

const TASK_STATUS_COLORS: Record<MaintenanceTask['status'], string> = {
  scheduled: 'blue',
  in_progress: 'yellow',
  completed: 'green',
  overdue: 'red',
  cancelled: 'gray',
};

const TASK_STATUS_LABELS: Record<MaintenanceTask['status'], string> = {
  scheduled: '已排程',
  in_progress: '进行中',
  completed: '已完成',
  overdue: '已逾期',
  cancelled: '已取消',
};

const TASK_PRIORITY_COLORS: Record<MaintenanceTask['priority'], string> = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
};

const TASK_PRIORITY_LABELS: Record<MaintenanceTask['priority'], string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
};

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const MaintenanceSchedulePanel: React.FC<MaintenanceSchedulePanelProps> = ({ schedule }) => {
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const currentWeekSchedule = useMemo(() => {
    const startIdx = selectedWeekOffset * 7;
    return schedule.weeklySchedule.slice(startIdx, startIdx + 7);
  }, [schedule.weeklySchedule, selectedWeekOffset]);

  const filteredTasks = useMemo(() => {
    return schedule.tasks.filter((t) => {
      if (selectedStatus && t.status !== selectedStatus) return false;
      return true;
    }).sort((a, b) => a.scheduledDate - b.scheduledDate);
  }, [schedule.tasks, selectedStatus]);

  const weekStartDate = currentWeekSchedule[0]?.date || Date.now();
  const weekEndDate = currentWeekSchedule[currentWeekSchedule.length - 1]?.date || Date.now();

  const monthlySummary = schedule.monthlySummary;
  const completionRate = monthlySummary.totalTasks > 0
    ? Math.round((monthlySummary.completedTasks / monthlySummary.totalTasks) * 100)
    : 0;

  const taskTypeDistribution = useMemo(() => {
    const types = ['inspection', 'preventive', 'corrective', 'overhaul'] as const;
    return types.map((type) => ({
      name: MAINTENANCE_TASK_TYPE_LABELS[type],
      count: schedule.tasks.filter((t) => t.taskType === type).length,
    }));
  }, [schedule.tasks]);

  const weeklyWorkloadData = useMemo(() => {
    return currentWeekSchedule.map((day) => ({
      day: WEEKDAY_LABELS[new Date(day.date).getDay()],
      date: `${new Date(day.date).getMonth() + 1}/${new Date(day.date).getDate()}`,
      tasks: day.tasks.length,
      estimatedHours: day.tasks.reduce((sum, t) => sum + t.estimatedDurationHours, 0),
    }));
  }, [currentWeekSchedule]);

  if (schedule.tasks.length === 0) {
    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Center py="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="md" color="gray" variant="light">
              <IconCalendar size={32} />
            </ThemeIcon>
            <Text c="dimmed" ta="center">暂无养护计划数据</Text>
            <Text size="xs" c="dimmed" ta="center">请先生成车队数据以查看养护计划排程</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, md: 5 }} spacing="md">
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <ThemeIcon size="md" radius="md" color="blue" variant="light">
                <IconTool size={16} />
              </ThemeIcon>
            </Group>
            <Box>
              <Text size="xs" c="dimmed">本月任务总数</Text>
              <Text fw={700} size="xl">{monthlySummary.totalTasks}</Text>
            </Box>
            <Progress value={completionRate} size="sm" color="green" />
            <Text size="xs" c="dimmed">完成率 {completionRate}%</Text>
          </Stack>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <ThemeIcon size="md" radius="md" color="green" variant="light">
                <IconCircleCheck size={16} />
              </ThemeIcon>
            </Group>
            <Box>
              <Text size="xs" c="dimmed">已完成</Text>
              <Text fw={700} size="xl" c="green">{monthlySummary.completedTasks}</Text>
            </Box>
            <Text size="xs" c="dimmed">
              占比 {monthlySummary.totalTasks > 0 ? Math.round((monthlySummary.completedTasks / monthlySummary.totalTasks) * 100) : 0}%
            </Text>
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
              <Text size="xs" c="dimmed">已逾期</Text>
              <Text fw={700} size="xl" c="red">{monthlySummary.overdueTasks}</Text>
            </Box>
            <Text size="xs" c="dimmed">需尽快处理</Text>
          </Stack>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <ThemeIcon size="md" radius="md" color="orange" variant="light">
                <IconCurrencyDollar size={16} />
              </ThemeIcon>
            </Group>
            <Box>
              <Text size="xs" c="dimmed">预计费用</Text>
              <Text fw={700} size="xl" c="orange">¥{monthlySummary.estimatedCost.toLocaleString()}</Text>
            </Box>
            <Text size="xs" c="dimmed">实际: ¥{monthlySummary.actualCost.toLocaleString()}</Text>
          </Stack>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <ThemeIcon size="md" radius="md" color="cyan" variant="light">
                <IconClock size={16} />
              </ThemeIcon>
            </Group>
            <Box>
              <Text size="xs" c="dimmed">预计工时</Text>
              <Text fw={700} size="xl" c="cyan">
                {schedule.tasks.reduce((sum, t) => sum + t.estimatedDurationHours, 0).toFixed(1)} h
              </Text>
            </Box>
            <Text size="xs" c="dimmed">
              实际: {schedule.tasks.reduce((sum, t) => sum + (t.actualDurationHours || 0), 0).toFixed(1)} h
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <Card shadow="sm" p="md" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                <IconCalendar size={20} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text fw={600} size="sm">养护日历</Text>
                <Text size="xs" c="dimmed">
                  {new Date(weekStartDate).toLocaleDateString('zh-CN')} - {new Date(weekEndDate).toLocaleDateString('zh-CN')}
                </Text>
              </Stack>
            </Group>
            <Group gap="xs">
              <ActionIcon
                variant="light"
                onClick={() => setSelectedWeekOffset(Math.max(0, selectedWeekOffset - 1))}
                disabled={selectedWeekOffset === 0}
              >
                <IconChevronLeft size={16} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                onClick={() => setSelectedWeekOffset(Math.min(1, selectedWeekOffset + 1))}
                disabled={selectedWeekOffset >= 1}
              >
                <IconChevronRight size={16} />
              </ActionIcon>
            </Group>
          </Group>

          <SimpleGrid cols={7} spacing="xs">
            {currentWeekSchedule.map((day) => {
              const date = new Date(day.date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isPast = day.date < new Date().setHours(0, 0, 0, 0);
              const hasTasks = day.tasks.length > 0;
              const hasCritical = day.tasks.some((t) => t.priority === 'critical');
              const hasOverdue = day.tasks.some((t) => t.status === 'overdue');

              return (
                <Card
                  key={day.date}
                  p="xs"
                  radius="md"
                  withBorder
                  style={{
                    background: isToday ? '#e7f5ff' : isPast ? '#f8f9fa' : undefined,
                    borderColor: hasCritical ? '#ff6b6b' : hasOverdue ? '#fab005' : isToday ? '#339af0' : undefined,
                    borderWidth: isToday || hasCritical || hasOverdue ? 2 : 1,
                    minHeight: 140,
                  }}
                >
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="xs" fw={600} c={isToday ? 'blue' : 'dimmed'}>
                        {WEEKDAY_LABELS[date.getDay()]}
                      </Text>
                      <Text size="xs" fw={700} c={isToday ? 'blue' : 'dark'}>
                        {date.getDate()}
                      </Text>
                    </Group>
                    {hasTasks && (
                      <Stack gap={4}>
                        {day.tasks.slice(0, 3).map((task) => (
                          <Paper
                            key={task.id}
                            p={4}
                            radius="sm"
                            withBorder
                            style={{
                              borderLeft: `3px solid ${task.priority === 'critical' ? '#ff6b6b' : task.priority === 'high' ? '#fab005' : '#339af0'}`,
                              background: task.status === 'completed' ? '#ebfbee' : task.status === 'overdue' ? '#fff5f5' : '#fff9db',
                            }}
                          >
                            <Stack gap={0}>
                              <Text size="xs" fw={600} lineClamp={1}>{task.title}</Text>
                              <Group gap={4}>
                                <IconClock size={10} color="dimmed" />
                                <Text size="xs" c="dimmed">{task.estimatedDurationHours}h</Text>
                              </Group>
                            </Stack>
                          </Paper>
                        ))}
                        {day.tasks.length > 3 && (
                          <Text size="xs" c="dimmed" ta="center">
                            +{day.tasks.length - 3} 更多
                          </Text>
                        )}
                      </Stack>
                    )}
                    {!hasTasks && (
                      <Center flex={1}>
                        <Text size="xs" c="dimmed">无任务</Text>
                      </Center>
                    )}
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>
        </Stack>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
                <IconChartBar size={20} />
              </ThemeIcon>
              <Text fw={600} size="sm">本周任务分布</Text>
            </Group>
            <Box style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyWorkloadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <RechartsTooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="tasks" name="任务数" fill="#339af0" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="estimatedHours" name="工时 (h)" fill="#40c057" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Stack>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <ThemeIcon size="lg" radius="md" color="violet" variant="light">
                <IconTool size={20} />
              </ThemeIcon>
              <Text fw={600} size="sm">任务类型分布</Text>
            </Group>
            <Box style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskTypeDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <RechartsTooltip />
                  <Bar dataKey="count" name="任务数" radius={[0, 4, 4, 0]}>
                    {taskTypeDistribution.map((_, idx) => (
                      <Cell key={idx} fill={['#339af0', '#40c057', '#fab005', '#ff6b6b'][idx]} />
                    ))}
                  </Bar>
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
              <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                <IconTool size={20} />
              </ThemeIcon>
              <Text fw={600} size="sm">任务列表</Text>
            </Group>
            <Group gap="xs">
              <Chip
                checked={selectedStatus === null}
                onClick={() => setSelectedStatus(null)}
                size="xs"
              >
                全部
              </Chip>
              {(['scheduled', 'in_progress', 'completed', 'overdue'] as const).map((status) => (
                <Chip
                  key={status}
                  checked={selectedStatus === status}
                  onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                  size="xs"
                >
                  {TASK_STATUS_LABELS[status]}
                </Chip>
              ))}
            </Group>
          </Group>

          <ScrollArea h={400} type="hover">
            <Table withTableBorder withColumnBorders striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>计划日期</Table.Th>
                  <Table.Th>类型</Table.Th>
                  <Table.Th>优先级</Table.Th>
                  <Table.Th>任务名称</Table.Th>
                  <Table.Th>预计工时</Table.Th>
                  <Table.Th>费用预算</Table.Th>
                  <Table.Th>负责人</Table.Th>
                  <Table.Th>所需备件</Table.Th>
                  <Table.Th>状态</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredTasks.map((task) => (
                  <Table.Tr key={task.id}>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text size="xs" fw={600}>{new Date(task.scheduledDate).toLocaleDateString('zh-CN')}</Text>
                        <Text size="xs" c="dimmed">截止: {new Date(task.dueDate).toLocaleDateString('zh-CN')}</Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={task.taskType === 'inspection' ? 'blue' : task.taskType === 'preventive' ? 'green' : task.taskType === 'corrective' ? 'orange' : 'red'} variant="light" size="xs">
                        {MAINTENANCE_TASK_TYPE_LABELS[task.taskType]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={TASK_PRIORITY_COLORS[task.priority] as any} variant="filled" size="xs">
                        {TASK_PRIORITY_LABELS[task.priority]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" fw={600}>{task.title}</Text>
                      <Text size="xs" c="dimmed" lineClamp={1}>{task.description}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{task.estimatedDurationHours}h</Text>
                      {task.actualDurationHours && <Text size="xs" c="dimmed">实际: {task.actualDurationHours}h</Text>}
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" fw={600} c="orange">¥{task.costEstimate.toLocaleString()}</Text>
                      {task.actualCost && <Text size="xs" c="dimmed">实际: ¥{task.actualCost.toLocaleString()}</Text>}
                    </Table.Td>
                    <Table.Td>
                      {task.assignedTechnician ? (
                        <Group gap="xs" wrap="nowrap">
                          <ThemeIcon size="sm" radius="md" color="gray" variant="light">
                            <IconUser size={12} />
                          </ThemeIcon>
                          <Text size="xs">{task.assignedTechnician}</Text>
                        </Group>
                      ) : (
                        <Text size="xs" c="dimmed">未分配</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {task.requiredParts.length > 0 ? (
                        <Stack gap={2}>
                          {task.requiredParts.slice(0, 2).map((part, idx) => (
                            <Group key={idx} gap={4} wrap="nowrap">
                              <IconPackage size={10} color="dimmed" />
                              <Text size="xs">{part.partName} x{part.quantity}</Text>
                            </Group>
                          ))}
                          {task.requiredParts.length > 2 && (
                            <Text size="xs" c="dimmed">+{task.requiredParts.length - 2} 更多</Text>
                          )}
                        </Stack>
                      ) : (
                        <Text size="xs" c="dimmed">无需备件</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge color={TASK_STATUS_COLORS[task.status] as any} variant="light" size="xs">
                        {TASK_STATUS_LABELS[task.status]}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Stack>
      </Card>
    </Stack>
  );
};

export default MaintenanceSchedulePanel;
