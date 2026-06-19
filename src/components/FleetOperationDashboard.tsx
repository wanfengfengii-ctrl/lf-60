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
  RingProgress,
  Center,
  Chip,
  Avatar,
} from '@mantine/core';
import {
  IconGauge,
  IconAlertTriangle,
  IconTrendingUp,
  IconTrendingDown,
  IconCircleCheck,
  IconCar,
  IconClock,
  IconCurrencyDollar,
  IconWheelchair,
  IconHeartbeat,
  IconActivity,
  IconAlertCircle,
  IconCheck,
  IconClockHour4,
  IconTool,
  IconArchive,
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
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  FleetOperationData,
  Vehicle,
  FaultSeverity,
} from '../types';

const FAULT_SEVERITY_COLORS: Record<FaultSeverity, string> = {
  none: 'gray',
  mild: 'blue',
  moderate: 'yellow',
  severe: 'orange',
  critical: 'red',
};

const FAULT_SEVERITY_LABELS: Record<FaultSeverity, string> = {
  none: '无',
  mild: '轻微',
  moderate: '中等',
  severe: '严重',
  critical: '危急',
};

interface FleetOperationDashboardProps {
  fleetData: FleetOperationData;
  vehicles: Vehicle[];
}

const HEALTH_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

const VEHICLE_STATUS_COLORS: Record<Vehicle['status'], string> = {
  active: '#10B981',
  maintenance: '#F59E0B',
  idle: '#6B7280',
  retired: '#EF4444',
};

const VEHICLE_STATUS_LABELS: Record<Vehicle['status'], string> = {
  active: '运行中',
  maintenance: '维护中',
  idle: '空闲',
  retired: '已退役',
};

const FleetOperationDashboard: React.FC<FleetOperationDashboardProps> = ({
  fleetData,
  vehicles,
}) => {
  const [selectedVehicleStatus, setSelectedVehicleStatus] = useState<string | null>(null);

  const { fleet, kpi, topIssues, costTrend, availabilityTrend } = fleetData;

  const filteredVehicles = useMemo(() => {
    if (!selectedVehicleStatus) return vehicles;
    return vehicles.filter((v) => v.status === selectedVehicleStatus);
  }, [vehicles, selectedVehicleStatus]);

  const healthDistributionData = useMemo(() => {
    return kpi.healthDistribution.map((item) => ({
      ...item,
    }));
  }, [kpi.healthDistribution]);

  const vehicleHealthData = useMemo(() => {
    return vehicles.map((v) => ({
      name: v.name,
      healthScore: v.healthScore,
      totalMileage: Math.round(v.totalMileage / 1000),
    }));
  }, [vehicles]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#3B82F6';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return '优秀';
    if (score >= 60) return '良好';
    if (score >= 40) return '一般';
    return '较差';
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    unit,
    color,
    trend,
    trendLabel,
  }: {
    icon: React.ComponentType<any>;
    title: string;
    value: string | number;
    unit?: string;
    color: string;
    trend?: number;
    trendLabel?: string;
  }) => (
    <Card withBorder padding="lg" radius="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            {title}
          </Text>
          <Group gap={4} align="baseline">
            <Text size="xl" fw={700}>
              {value}
            </Text>
            {unit && (
              <Text size="sm" c="dimmed">
                {unit}
              </Text>
            )}
          </Group>
          {trend !== undefined && (
            <Group gap={4}>
              <ThemeIcon size="sm" color={trend >= 0 ? 'green' : 'red'} variant="light">
                {trend >= 0 ? <IconTrendingUp size={12} /> : <IconTrendingDown size={12} />}
              </ThemeIcon>
              <Text size="xs" c={trend >= 0 ? 'green' : 'red'}>
                {trend >= 0 ? '+' : ''}
                {trend.toFixed(1)}% {trendLabel || '同比'}
              </Text>
            </Group>
          )}
        </Stack>
        <ThemeIcon size={48} radius="md" color={color} variant="light">
          <Icon size={24} />
        </ThemeIcon>
      </Group>
    </Card>
  );

  const KPIGauge = ({
    value,
    label,
    max = 100,
    color,
    icon: Icon,
  }: {
    value: number;
    label: string;
    max?: number;
    color: string;
    icon?: React.ComponentType<any>;
  }) => (
    <Card withBorder padding="lg" radius="md">
      <Stack align="center" gap="sm">
        <RingProgress
          size={120}
          thickness={10}
          roundCaps
          sections={[{ value: (value / max) * 100, color }]}
          label={
            <Center>
              <Stack align="center" gap={0}>
                {Icon && <Icon size={20} color={color} />}
                <Text size="xl" fw={700}>
                  {value.toFixed(1)}
                </Text>
              </Stack>
            </Center>
          }
        />
        <Text size="sm" c="dimmed">
          {label}
        </Text>
      </Stack>
    </Card>
  );

  return (
    <Stack gap="lg">
      <Card withBorder padding="xl" radius="md" bg="gradient-to-r from-blue.50 to-cyan.50">
        <Group justify="space-between" align="center">
          <Stack gap={4}>
          <Group gap="md">
            <ThemeIcon size={56} radius="xl" color="blue" variant="filled">
              <IconCar size={32} />
            </ThemeIcon>
            <Stack gap={0}>
              <Text size="xl" fw={700}>
                {fleet.name}
              </Text>
              <Text size="md" c="dimmed">
                {fleet.description}
              </Text>
            </Stack>
            </Group>
          </Stack>
          <Group gap="lg">
            <Group gap="sm">
              <ThemeIcon size="sm" color="green" variant="light">
                <IconCar size={16} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text size="sm" fw={600}>
                  {vehicles.length}
                </Text>
                <Text size="xs" c="dimmed">
                  车辆总数
                </Text>
              </Stack>
            </Group>
            <Group gap="sm">
              <ThemeIcon size="sm" color="blue" variant="light">
                <IconWheelchair size={16} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text size="sm" fw={600}>
                  {kpi.totalWheels}
                </Text>
                <Text size="xs" c="dimmed">
                  车轮总数
                </Text>
              </Stack>
            </Group>
            <Group gap="sm">
              <ThemeIcon size="sm" color="teal" variant="light">
                <IconActivity size={16} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text size="sm" fw={600}>
                  {kpi.activeWheels}
                </Text>
                <Text size="xs" c="dimmed">
                  活跃车轮
                </Text>
              </Stack>
            </Group>
          </Group>
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <StatCard
          icon={IconHeartbeat}
          title="平均健康度"
          value={kpi.averageHealthScore.toFixed(1)}
          unit="分"
          color="green"
          trend={2.3}
        />
        <StatCard
          icon={IconCurrencyDollar}
          title="月度维护成本"
          value={`¥${kpi.monthlyMaintenanceCost.toLocaleString()}`}
          color="blue"
          trend={-1.5}
        />
        <StatCard
          icon={IconAlertCircle}
          title="故障率"
          value={(kpi.failureRate * 100).toFixed(1)}
          unit="%"
          color="orange"
        />
        <StatCard
          icon={IconCircleCheck}
          title="可用率"
          value={(kpi.availabilityRate * 100).toFixed(1)}
          unit="%"
          color="teal"
          trend={0.8}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 3 }}>
        <KPIGauge value={kpi.averageHealthScore} label="平均健康度" color="#10B981" icon={IconGauge} />
        <KPIGauge value={kpi.availabilityRate * 100} label="可用率" color="#3B82F6" icon={IconCircleCheck} />
        <KPIGauge value={kpi.failureRate * 100} label="故障率" color="#F59E0B" icon={IconAlertTriangle} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Card withBorder padding="lg" radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="lg" fw={600}>
                健康度分布
              </Text>
              <Badge color="blue" variant="light">
                按健康等级
              </Badge>
            </Group>
            <Box h={280}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    label={({ level, percent }) =>
                      `${level} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {healthDistributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={HEALTH_COLORS[index % HEALTH_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Group justify="center" gap="lg">
              {healthDistributionData.map((item, index) => (
                <Group key={item.level} gap="xs">
                  <Box w={12} h={12} bg={HEALTH_COLORS[index]} style={{ borderRadius: 4 }} />
                  <Text size="sm">
                    {item.level} ({item.count})
                  </Text>
                </Group>
              ))}
            </Group>
          </Stack>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="lg" fw={600}>
                成本趋势
              </Text>
              <Badge color="teal" variant="light">
                近6个月
              </Badge>
            </Group>
            <Box h={280}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={costTrend}>
                  <defs>
                    <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSpare" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="maintenanceCost"
                    stroke="#3B82F6"
                    fill="url(#colorMain)"
                    name="维护成本"
                  />
                  <Area
                    type="monotone"
                    dataKey="sparePartsCost"
                    stroke="#10B981"
                    fill="url(#colorSpare)"
                    name="备件成本"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Stack>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Card withBorder padding="lg" radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="lg" fw={600}>
                车辆健康排行
              </Text>
              <Badge color="orange" variant="light">
                按健康度
              </Badge>
            </Group>
            <Box h={280}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleHealthData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'healthScore' ? `${value}分` : `${value}千公里`,
                      name === 'healthScore' ? '健康度' : '总里程',
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="healthScore"
                    name="健康度"
                    radius={[0, 4, 4, 0]}
                  >
                    {vehicleHealthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getHealthColor(entry.healthScore)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Stack>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="lg" fw={600}>
                可用率趋势
              </Text>
              <Badge color="cyan" variant="light">
                近6个月
              </Badge>
            </Group>
            <Box h={280}>
              <ResponsiveContainer width="100%" height="100%">
              <LineChart data={availabilityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, '']}
                />
                <Line
                  type="monotone"
                  dataKey="availabilityRate"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#8B5CF6' }}
                  activeDot={{ r: 8 }}
                  name="可用率"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          </Stack>
        </Card>
      </SimpleGrid>

      <Card withBorder padding="lg" radius="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="lg" fw={600}>
              重点关注问题
            </Text>
            {kpi.criticalWarnings > 0 && (
              <Badge color="red" variant="filled">
              {kpi.criticalWarnings} 个严重警告
            </Badge>
            )}
          </Group>

          {topIssues.length > 0 ? (
            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
              {topIssues.map((issue, index) => (
                <Paper key={index}
                  withBorder
                  p="md"
                  radius="md"
                  bg={issue.severity === 'critical' ? 'red.0' : issue.severity === 'severe' ? 'orange.0' : 'gray.0'}
                >
                  <Group justify="space-between" align="flex-start" mb="xs">
                    <Stack gap={4}>
                      <Text fw={600}>
                        {issue.vehicleName}
                      </Text>
                      <Text size="sm" c="dimmed">
                        车轮 ID: {issue.wheelId.slice(0, 8)}...
                      </Text>
                    </Stack>
                    <Badge
                      color={FAULT_SEVERITY_COLORS[issue.severity]}
                      variant="light"
                    >
                      {FAULT_SEVERITY_LABELS[issue.severity]}
                    </Badge>
                  </Group>
                  <Text size="sm">
                    {issue.issue}
                  </Text>
                </Paper>
              ))}
            </SimpleGrid>
          ) : (
            <Paper withBorder p="xl" radius="md" bg="green.0">
              <Center>
                <Stack gap="sm" align="center">
                  <ThemeIcon size={48} color="green" variant="light">
                    <IconCheck size={32} />
                  </ThemeIcon>
                  <Text fw={600} c="green">
                    车队运行状态良好
                  </Text>
                  <Text size="sm" c="dimmed">
                    当前没有需要重点关注的问题
                  </Text>
                </Stack>
              </Center>
            </Paper>
          )}
        </Stack>
      </Card>

      <Card withBorder padding="lg" radius="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="lg" fw={600}>
              车辆状态概览
            </Text>
            <Group gap="xs">
              <Chip
              value="all"
              checked={selectedVehicleStatus === null}
              onClick={() => setSelectedVehicleStatus(null)}
            >
              全部
            </Chip>
            {Object.entries(VEHICLE_STATUS_LABELS).map(([key, label]) => (
              <Chip
                key={key}
                value={key}
                checked={selectedVehicleStatus === key}
                onClick={() => setSelectedVehicleStatus(key)}
              >
                {label}
              </Chip>
            ))}
          </Group>
          </Group>

          <ScrollArea h={400}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>车辆名称</Table.Th>
                  <Table.Th>类型</Table.Th>
                  <Table.Th>状态</Table.Th>
                  <Table.Th>健康度</Table.Th>
                  <Table.Th>总里程</Table.Th>
                  <Table.Th>车轮数</Table.Th>
                  <Table.Th>上次维护</Table.Th>
                  <Table.Th>下次维护</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredVehicles.map((vehicle) => (
                  <Table.Tr key={vehicle.id}>
                    <Table.Td>
                      <Group gap="sm">
                      <Avatar
                        size={32}
                        color={VEHICLE_STATUS_COLORS[vehicle.status]}
                        radius="md"
                      >
                        <IconCar size={18} />
                      </Avatar>
                      <Text fw={500}>
                        {vehicle.name}
                      </Text>
                    </Group>
                    </Table.Td>
                    <Table.Td>{vehicle.type}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={VEHICLE_STATUS_COLORS[vehicle.status]}
                        variant="light"
                      >
                        {VEHICLE_STATUS_LABELS[vehicle.status]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="sm">
                        <RingProgress
                          size={36}
                          thickness={4}
                          roundCaps
                          sections={[
                            {
                              value: vehicle.healthScore,
                              color: getHealthColor(vehicle.healthScore),
                            },
                          ]}
                        />
                        <Stack gap={0}>
                          <Text size="sm" fw={600}>
                            {vehicle.healthScore.toFixed(1)}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {getHealthLabel(vehicle.healthScore)}
                          </Text>
                        </Stack>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      {vehicle.totalMileage.toLocaleString()} 公里
                    </Table.Td>
                    <Table.Td>{vehicle.wheels.length} 个</Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {new Date(vehicle.lastMaintenanceDate).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ThemeIcon size="sm" color="blue" variant="light">
                          <IconClockHour4 size={14} />
                        </ThemeIcon>
                        <Text size="sm">
                          {new Date(vehicle.nextMaintenanceDate).toLocaleDateString()}
                        </Text>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Stack>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Card withBorder padding="lg" radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                平均维修时间
              </Text>
              <ThemeIcon size="sm" color="orange" variant="light">
                <IconTool size={16} />
              </ThemeIcon>
            </Group>
            <Text size="xl" fw={700}>
              {kpi.meanTimeToRepair.toFixed(1)}
              <Text size="sm" c="dimmed" span>
                {" "}小时
              </Text>
            </Text>
            <Progress
              value={(kpi.meanTimeToRepair / 24) * 100}
              color="orange"
              size="xs"
            />
          </Stack>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                单轮平均成本
              </Text>
              <ThemeIcon size="sm" color="cyan" variant="light">
                <IconCurrencyDollar size={16} />
              </ThemeIcon>
            </Group>
            <Text size="xl" fw={700}>
              ¥{kpi.averageCostPerWheel.toLocaleString()}
            </Text>
            <Progress value={65} color="cyan" size="xs" />
          </Stack>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                即将到来的维护
              </Text>
              <ThemeIcon size="sm" color="blue" variant="light">
                <IconClock size={16} />
              </ThemeIcon>
            </Group>
            <Text size="xl" fw={700}>
              {kpi.upcomingMaintenanceTasks}
              <Text size="sm" c="dimmed" span>
                {" "}项
              </Text>
            </Text>
            <Progress
              value={(kpi.upcomingMaintenanceTasks / 20) * 100}
              color="blue"
              size="xs"
            />
          </Stack>
        </Card>

        <Card withBorder padding="lg" radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                备件库存价值
              </Text>
              <ThemeIcon size="sm" color="green" variant="light">
                <IconArchive size={16} />
              </ThemeIcon>
            </Group>
            <Text size="xl" fw={700}>
              ¥{kpi.sparePartsStockValue.toLocaleString()}
            </Text>
            <Progress value={72} color="green" size="xs" />
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
};

export default FleetOperationDashboard;
