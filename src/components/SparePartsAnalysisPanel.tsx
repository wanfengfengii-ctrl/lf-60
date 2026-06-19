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
  Tabs,
  Tooltip as MantineTooltip,
} from '@mantine/core';
import {
  IconPackage,
  IconAlertTriangle,
  IconTrendingUp,
  IconCurrencyDollar,
  IconShoppingCart,
  IconChartBar,
  IconPigMoney,
  IconArchive,
  IconCircleCheck,
  IconClock,
} from '@tabler/icons-react';
import {
  BarChart,
  Bar,
  Line,
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
  SparePart,
  SparePartConsumption,
  SparePartAnalysis,
  SPARE_PART_CATEGORY_LABELS,
} from '../types';

interface SparePartsAnalysisPanelProps {
  spareParts: SparePart[];
  consumptions: SparePartConsumption[];
  analyses: SparePartAnalysis[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

const STOCK_OUT_RISK_COLORS: Record<SparePartAnalysis['stockOutRisk'], string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
};

const STOCK_OUT_RISK_LABELS: Record<SparePartAnalysis['stockOutRisk'], string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

const SparePartsAnalysisPanel: React.FC<SparePartsAnalysisPanelProps> = ({
  spareParts,
  consumptions,
  analyses,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  const stats = useMemo(() => {
    const totalStockValue = spareParts.reduce((sum, p) => sum + p.currentStock * p.unitCost, 0);
    const totalConsumptionValue = consumptions.reduce((sum, c) => sum + c.cost, 0);
    const lowStockItems = spareParts.filter((p) => p.currentStock < p.minimumStock).length;
    const totalItems = spareParts.length;
    const avgTurnoverRate = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.turnoverRate, 0) / analyses.length
      : 0;
    const highRiskItems = analyses.filter((a) => a.stockOutRisk === 'high').length;
    const optimizationPotential = analyses.reduce((sum, a) => sum + a.costOptimizationPotential, 0);

    return {
      totalStockValue,
      totalConsumptionValue,
      lowStockItems,
      totalItems,
      avgTurnoverRate,
      highRiskItems,
      optimizationPotential,
    };
  }, [spareParts, consumptions, analyses]);

  const filteredParts = useMemo(() => {
    if (!selectedCategory) return spareParts;
    return spareParts.filter((p) => p.category === selectedCategory);
  }, [spareParts, selectedCategory]);

  const categoryDistribution = useMemo(() => {
    const grouped: Record<string, { count: number; value: number; consumed: number }> = {};
    spareParts.forEach((p) => {
      if (!grouped[p.category]) {
        grouped[p.category] = { count: 0, value: 0, consumed: 0 };
      }
      grouped[p.category].count += 1;
      grouped[p.category].value += p.currentStock * p.unitCost;
    });
    consumptions.forEach((c) => {
      const part = spareParts.find((p) => p.id === c.partId);
      if (part && grouped[part.category]) {
        grouped[part.category].consumed += c.cost;
      }
    });
    return Object.entries(grouped).map(([key, val]) => ({
      category: SPARE_PART_CATEGORY_LABELS[key as SparePart['category']] || key,
      count: val.count,
      value: val.value,
      consumed: val.consumed,
    }));
  }, [spareParts, consumptions]);

  const consumptionTrend = useMemo(() => {
    const monthly: Record<string, { month: string; quantity: number; cost: number }> = {};
    consumptions.forEach((c) => {
      const date = new Date(c.usedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[monthKey]) {
        monthly[monthKey] = { month: monthKey, quantity: 0, cost: 0 };
      }
      monthly[monthKey].quantity += c.quantity;
      monthly[monthKey].cost += c.cost;
    });
    return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
  }, [consumptions]);

  const topConsumedParts = useMemo(() => {
    return [...analyses]
      .sort((a, b) => b.totalConsumed - a.totalConsumed)
      .slice(0, 8)
      .map((a) => ({
        name: a.partName,
        consumed: a.totalConsumed,
        cost: a.totalCost,
      }));
  }, [analyses]);

  const getStockLevelColor = (part: SparePart) => {
    if (part.currentStock < part.minimumStock) return '#EF4444';
    const ratio = part.currentStock / part.maximumStock;
    if (ratio < 0.3) return '#F59E0B';
    if (ratio < 0.6) return '#3B82F6';
    return '#10B981';
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
              <ThemeIcon size="sm" color={trend >= 0 ? 'red' : 'green'} variant="light">
                <IconTrendingUp size={12} style={{ transform: trend >= 0 ? 'none' : 'rotate(180deg)' }} />
              </ThemeIcon>
              <Text size="xs" c={trend >= 0 ? 'red' : 'green'}>
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

  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <StatCard
          icon={IconPackage}
          title="库存总价值"
          value={`¥${stats.totalStockValue.toLocaleString()}`}
          color="blue"
          trend={5.2}
        />
        <StatCard
          icon={IconShoppingCart}
          title="累计消耗价值"
          value={`¥${stats.totalConsumptionValue.toLocaleString()}`}
          color="teal"
          trend={-2.8}
        />
        <StatCard
          icon={IconAlertTriangle}
          title="库存预警项"
          value={stats.lowStockItems}
          unit={`/ ${stats.totalItems}`}
          color="orange"
        />
        <StatCard
          icon={IconPigMoney}
          title="成本优化空间"
          value={`¥${stats.optimizationPotential.toLocaleString()}`}
          color="green"
        />
      </SimpleGrid>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>
            消耗概览
          </Tabs.Tab>
          <Tabs.Tab value="inventory" leftSection={<IconPackage size={16} />}>
            库存管理
          </Tabs.Tab>
          <Tabs.Tab value="analysis" leftSection={<IconArchive size={16} />}>
            消耗分析
          </Tabs.Tab>
          <Tabs.Tab value="warnings" leftSection={<IconAlertTriangle size={16} />}>
            库存预警
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <Stack gap="md">
            <Group gap="xs" mb="sm">
              <Text size="sm" fw={500}>
                类别筛选：
              </Text>
              <Chip
                value="all"
                checked={selectedCategory === null}
                onClick={() => setSelectedCategory(null)}
              >
                全部
              </Chip>
              {Object.entries(SPARE_PART_CATEGORY_LABELS).map(([key, label]) => (
                <Chip
                  key={key}
                  value={key}
                  checked={selectedCategory === key}
                  onClick={() => setSelectedCategory(key)}
                >
                  {label}
                </Chip>
              ))}
            </Group>

            <SimpleGrid cols={{ base: 1, lg: 2 }}>
              <Card withBorder padding="lg" radius="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text size="lg" fw={600}>
                      类别消耗分布
                    </Text>
                    <Badge color="blue" variant="light">
                      按消耗金额
                    </Badge>
                  </Group>
                  <Box h={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="consumed"
                          label={({ category, percent }) =>
                            `${category} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {categoryDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`¥${value.toLocaleString()}`, '消耗金额']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Stack>
              </Card>

              <Card withBorder padding="lg" radius="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text size="lg" fw={600}>
                      消耗趋势
                    </Text>
                    <Badge color="teal" variant="light">
                      按月统计
                    </Badge>
                  </Group>
                  <Box h={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={consumptionTrend}>
                        <defs>
                          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            name === 'cost' ? `¥${value.toLocaleString()}` : `${value}件`,
                            name === 'cost' ? '消耗金额' : '消耗数量',
                          ]}
                        />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="cost"
                          stroke="#3B82F6"
                          fill="url(#colorCost)"
                          name="消耗金额"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="quantity"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          name="消耗数量"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </Stack>
              </Card>
            </SimpleGrid>

            <Card withBorder padding="lg" radius="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="lg" fw={600}>
                    Top 消耗备件
                  </Text>
                  <Badge color="orange" variant="light">
                    按消耗数量
                  </Badge>
                </Group>
                <Box h={280}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topConsumedParts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === 'consumed' ? `${value}件` : `¥${value.toLocaleString()}`,
                          name === 'consumed' ? '消耗数量' : '消耗金额',
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="consumed" fill="#3B82F6" name="消耗数量" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="cost" fill="#10B981" name="消耗金额" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="inventory" pt="md">
          <Stack gap="md">
            <Card withBorder padding="lg" radius="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="lg" fw={600}>
                    备件库存状态
                  </Text>
                  <Group gap="sm">
                    <Group gap={4}>
                      <Box w={12} h={12} bg="#10B981" style={{ borderRadius: 4 }} />
                      <Text size="xs">正常</Text>
                    </Group>
                    <Group gap={4}>
                      <Box w={12} h={12} bg="#F59E0B" style={{ borderRadius: 4 }} />
                      <Text size="xs">偏低</Text>
                    </Group>
                    <Group gap={4}>
                      <Box w={12} h={12} bg="#EF4444" style={{ borderRadius: 4 }} />
                      <Text size="xs">不足</Text>
                    </Group>
                  </Group>
                </Group>
                <ScrollArea h={400}>
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>备件名称</Table.Th>
                        <Table.Th>类别</Table.Th>
                        <Table.Th>当前库存</Table.Th>
                        <Table.Th>安全库存</Table.Th>
                        <Table.Th>最大库存</Table.Th>
                        <Table.Th>库存水平</Table.Th>
                        <Table.Th>单价</Table.Th>
                        <Table.Th>供应商</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredParts.map((part) => (
                        <Table.Tr key={part.id}>
                          <Table.Td>
                            <Group gap="sm">
                              <ThemeIcon size="sm" color="blue" variant="light">
                                <IconPackage size={14} />
                              </ThemeIcon>
                              <Text fw={500}>{part.name}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Badge color="gray" variant="light">
                              {SPARE_PART_CATEGORY_LABELS[part.category]}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={600} c={getStockLevelColor(part)}>
                              {part.currentStock} {part.unit}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text c="dimmed">{part.minimumStock} {part.unit}</Text>
                          </Table.Td>
                          <Table.Td>{part.maximumStock} {part.unit}</Table.Td>
                          <Table.Td>
                            <Stack gap={4} w={120}>
                              <Progress
                                value={(part.currentStock / part.maximumStock) * 100}
                                color={getStockLevelColor(part)}
                                size="sm"
                                radius="sm"
                              />
                              <Text size="xs" c="dimmed">
                                {((part.currentStock / part.maximumStock) * 100).toFixed(0)}%
                              </Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>¥{part.unitCost.toLocaleString()}</Table.Td>
                          <Table.Td>{part.supplier}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="analysis" pt="md">
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, lg: 2 }}>
              <Card withBorder padding="lg" radius="md">
                <Stack gap="md">
                  <Text size="lg" fw={600}>
                    库存周转分析
                  </Text>
                  <ScrollArea h={380}>
                    <Table highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>备件名称</Table.Th>
                          <Table.Th>累计消耗</Table.Th>
                          <Table.Th>周转率</Table.Th>
                          <Table.Th>缺货风险</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {analyses.map((analysis) => (
                          <Table.Tr key={analysis.partId}>
                            <Table.Td>
                              <Text fw={500}>{analysis.partName}</Text>
                            </Table.Td>
                            <Table.Td>{analysis.totalConsumed} 件</Table.Td>
                            <Table.Td>
                              <Group gap="sm">
                                <RingProgress
                                  size={40}
                                  thickness={6}
                                  roundCaps
                                  sections={[
                                    {
                                      value: Math.min(analysis.turnoverRate * 20, 100),
                                      color: analysis.turnoverRate > 3 ? '#10B981' : analysis.turnoverRate > 1 ? '#F59E0B' : '#EF4444',
                                    },
                                  ]}
                                  label={
                                    <Center>
                                      <Text size="xs" fw={700}>
                                        {analysis.turnoverRate.toFixed(1)}
                                      </Text>
                                    </Center>
                                  }
                                />
                                <Text size="xs" c="dimmed">次/年</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={STOCK_OUT_RISK_COLORS[analysis.stockOutRisk]}
                                variant="light"
                              >
                                {STOCK_OUT_RISK_LABELS[analysis.stockOutRisk]}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Stack>
              </Card>

              <Card withBorder padding="lg" radius="md">
                <Stack gap="md">
                  <Text size="lg" fw={600}>
                    成本优化建议
                  </Text>
                  <Stack gap="sm">
                    {analyses
                      .filter((a) => a.costOptimizationPotential > 0)
                      .sort((a, b) => b.costOptimizationPotential - a.costOptimizationPotential)
                      .slice(0, 6)
                      .map((analysis) => (
                        <Paper key={analysis.partId} withBorder p="sm" radius="md">
                          <Group justify="space-between" align="flex-start">
                            <Stack gap={4}>
                              <Text fw={500}>{analysis.partName}</Text>
                              <Text size="xs" c="dimmed">
                                优化空间：¥{analysis.costOptimizationPotential.toLocaleString()}
                              </Text>
                            </Stack>
                            <Group gap="xs">
                              <MantineTooltip
                                label={`建议调整采购周期，当前周转率 ${analysis.turnoverRate.toFixed(1)} 次/年`}
                              >
                                <ThemeIcon size="sm" color="blue" variant="light">
                                  <IconCurrencyDollar size={14} />
                                </ThemeIcon>
                              </MantineTooltip>
                            </Group>
                          </Group>
                          <Progress
                            mt="xs"
                            value={(analysis.costOptimizationPotential / Math.max(...analyses.map(a => a.costOptimizationPotential))) * 100}
                            color="green"
                            size="xs"
                          />
                        </Paper>
                      ))}
                  </Stack>
                </Stack>
              </Card>
            </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="warnings" pt="md">
          <Stack gap="md">
            <Card withBorder padding="lg" radius="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="lg" fw={600}>
                    库存预警
                  </Text>
                  {stats.highRiskItems > 0 && (
                    <Badge color="red" variant="filled">
                      {stats.highRiskItems} 个高风险
                    </Badge>
                  )}
                </Group>

                <Stack gap="sm">
                  {spareParts
                    .filter((p) => p.currentStock < p.minimumStock)
                    .map((part) => {
                      const analysis = analyses.find((a) => a.partId === part.id);
                      const shortage = part.minimumStock - part.currentStock;
                      const estimatedCost = shortage * part.unitCost;

                      return (
                        <Paper key={part.id} withBorder p="md" radius="md" bg="red.0">
                          <Group justify="space-between" align="flex-start">
                            <Stack gap={4}>
                              <Group gap="sm">
                                <ThemeIcon size="sm" color="red">
                                  <IconAlertTriangle size={16} />
                                </ThemeIcon>
                                <Text fw={600} c="red">
                                  {part.name}
                                </Text>
                                <Badge color="red" variant="light">
                                  {SPARE_PART_CATEGORY_LABELS[part.category]}
                                </Badge>
                              </Group>
                              <Group gap="lg">
                                <Stack gap={0}>
                                  <Text size="xs" c="dimmed">
                                    当前库存
                                  </Text>
                                  <Text size="lg" fw={700} c="red">
                                    {part.currentStock} {part.unit}
                                  </Text>
                                </Stack>
                                <Stack gap={0}>
                                  <Text size="xs" c="dimmed">
                                    安全库存
                                  </Text>
                                  <Text size="lg" fw={500}>
                                    {part.minimumStock} {part.unit}
                                  </Text>
                                </Stack>
                                <Stack gap={0}>
                                  <Text size="xs" c="dimmed">
                                    缺货数量
                                  </Text>
                                  <Text size="lg" fw={700} c="orange">
                                    {shortage} {part.unit}
                                  </Text>
                                </Stack>
                                <Stack gap={0}>
                                  <Text size="xs" c="dimmed">
                                    补货预估
                                  </Text>
                                  <Text size="lg" fw={500}>
                                    ¥{estimatedCost.toLocaleString()}
                                  </Text>
                                </Stack>
                                <Stack gap={0}>
                                  <Text size="xs" c="dimmed">
                                    到货周期
                                  </Text>
                                  <Text size="lg" fw={500}>
                                    {part.leadTimeDays} 天
                                  </Text>
                                </Stack>
                              </Group>
                            </Stack>
                            <Stack gap={4} align="flex-end">
                              <Badge color="orange" variant="light">
                                供应商：{part.supplier}
                              </Badge>
                              {analysis && (
                                <Badge
                                  color={STOCK_OUT_RISK_COLORS[analysis.stockOutRisk]}
                                  variant="light"
                                >
                                  风险等级：{STOCK_OUT_RISK_LABELS[analysis.stockOutRisk]}
                                </Badge>
                              )}
                              <Group gap="xs">
                                <ThemeIcon size="sm" color="blue" variant="light">
                                  <IconClock size={14} />
                                </ThemeIcon>
                                <Text size="xs" c="dimmed">
                                  建议{part.leadTimeDays}天内补货
                                </Text>
                              </Group>
                            </Stack>
                          </Group>
                        </Paper>
                      );
                    })}

                  {spareParts.filter((p) => p.currentStock < p.minimumStock).length === 0 && (
                    <Paper withBorder p="xl" radius="md" bg="green.0">
                      <Center>
                        <Stack gap="sm" align="center">
                          <ThemeIcon size={48} color="green" variant="light">
                            <IconCircleCheck size={32} />
                          </ThemeIcon>
                          <Text fw={600} c="green">
                            所有备件库存充足
                          </Text>
                          <Text size="sm" c="dimmed">
                            当前没有需要补货的备件
                          </Text>
                        </Stack>
                      </Center>
                    </Paper>
                  )}
                </Stack>
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default SparePartsAnalysisPanel;
