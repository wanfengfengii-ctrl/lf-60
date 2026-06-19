import React, { useMemo } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  Grid,
  Card,
  Progress,
  ThemeIcon,
  ScrollArea,
} from '@mantine/core';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  IconSettings,
  IconCheck,
  IconX,
  IconTrendingUp,
  IconTrendingDown,
  IconShield,
  IconClock,
  IconTarget,
  IconWeight,
  IconCoin,
  IconTool,
  IconAward,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { StructuralOptimizationScheme, WheelParameters } from '../types';

interface StructuralOptimizationPanelProps {
  schemes: StructuralOptimizationScheme[];
  selectedSchemeId: string | null;
  onSchemeSelect: (schemeId: string) => void;
  onGenerateSchemes: () => void;
  isGenerating: boolean;
  baseParameters: WheelParameters;
}

const COMPLEXITY_COLORS: Record<string, string> = {
  low: 'green',
  medium: 'yellow',
  high: 'red',
};

const COMPLEXITY_LABELS: Record<string, string> = {
  low: '简单',
  medium: '中等',
  high: '复杂',
};

const RISK_COLORS: Record<string, string> = {
  low: 'green',
  medium: 'yellow',
  high: 'red',
};

const RISK_LABELS: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

const StructuralOptimizationPanel: React.FC<StructuralOptimizationPanelProps> = ({
  schemes,
  selectedSchemeId,
  onSchemeSelect,
  onGenerateSchemes,
  isGenerating,
  baseParameters: _baseParameters,
}) => {
  const selectedScheme = useMemo(
    () => schemes.find((s) => s.id === selectedSchemeId),
    [schemes, selectedSchemeId]
  );

  const comparisonData = useMemo(() => {
    if (!selectedScheme) return [];
    return selectedScheme.improvementMetrics.map((metric) => ({
      name: metric.metric,
      before: metric.before,
      after: metric.after,
      improvement: metric.improvementPercent,
    }));
  }, [selectedScheme]);

  const radarData = useMemo(() => {
    if (!selectedScheme) return [];
    const metrics = selectedScheme.improvementMetrics.slice(0, 6);
    return metrics.map((metric) => ({
      subject: metric.metric,
      before: Math.min(100, (metric.before / Math.max(metric.after, metric.before)) * 100),
      after: Math.min(100, (metric.after / Math.max(metric.after, metric.before)) * 100),
      fullMark: 100,
    }));
  }, [selectedScheme]);

  const getMetricIcon = (metric: string) => {
    if (metric.includes('受力') || metric.includes('应力')) return <IconTarget size={14} />;
    if (metric.includes('安全') || metric.includes('系数')) return <IconShield size={14} />;
    if (metric.includes('寿命') || metric.includes('疲劳')) return <IconClock size={14} />;
    if (metric.includes('损伤')) return <IconTrendingDown size={14} />;
    if (metric.includes('重量') || metric.includes('质量')) return <IconWeight size={14} />;
    return <IconSettings size={14} />;
  };

  if (schemes.length === 0) {
    return (
      <Stack gap="md">
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Stack align="center" gap="sm">
            <IconSettings size={48} color="#adb5bd" />
            <Text c="dimmed" ta="center">
              暂无优化方案
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              点击下方按钮运行结构优化，系统将自动生成多种优化方案
            </Text>
            <Button
              mt="md"
              color="blue"
              size="md"
              leftSection={<IconSettings size={18} />}
              onClick={onGenerateSchemes}
              loading={isGenerating}
            >
              {isGenerating ? '正在生成优化方案...' : '生成优化方案'}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <IconSettings size={20} color="#228be6" />
            <Title order={4}>结构优化方案推演</Title>
          </Group>
          <Group gap="xs">
            <Badge color="blue" variant="light" size="lg">
              {schemes.length} 个方案
            </Badge>
            <Button
              size="sm"
              variant="light"
              leftSection={<IconSettings size={16} />}
              onClick={onGenerateSchemes}
              loading={isGenerating}
            >
              重新生成
            </Button>
          </Group>
        </Group>

        <Title order={5} mb="xs">可选优化方案</Title>
        <ScrollArea h={200} type="auto" mb="md">
          <Grid gutter="md">
            {schemes.map((scheme) => (
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={scheme.id}>
                <Card
                  shadow="sm"
                  p="md"
                  radius="md"
                  withBorder
                  style={{
                    borderColor: selectedSchemeId === scheme.id ? '#228be6' : '#e5e7eb',
                    background: selectedSchemeId === scheme.id ? '#e7f5ff' : 'white',
                    cursor: 'pointer',
                  }}
                  onClick={() => onSchemeSelect(scheme.id)}
                >
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <ThemeIcon
                        size="lg"
                        radius="md"
                        color={scheme.overallImprovement > 30 ? 'green' : scheme.overallImprovement > 15 ? 'blue' : 'yellow'}
                        variant="light"
                      >
                        {scheme.type === 'material' ? '🧱' :
                         scheme.type === 'geometry' ? '📐' :
                         scheme.type === 'structural' ? '🏗️' :
                         scheme.type === 'comprehensive' ? '🔧' : '⚙️'}
                      </ThemeIcon>
                      <div>
                        <Text fw={600} size="sm">{scheme.name}</Text>
                        <Text size="xs" c="dimmed">
                          {scheme.type === 'material' ? '材料优化' :
                           scheme.type === 'geometry' ? '几何优化' :
                           scheme.type === 'structural' ? '结构优化' :
                           scheme.type === 'comprehensive' ? '综合优化' : '工艺优化'}
                        </Text>
                      </div>
                    </Group>
                    <Stack gap={4} align="flex-end">
                      <Badge
                        color={scheme.overallImprovement > 30 ? 'green' : scheme.overallImprovement > 15 ? 'blue' : 'yellow'}
                        size="sm"
                      >
                        {scheme.overallImprovement.toFixed(1)}% 提升
                      </Badge>
                      <Badge color={COMPLEXITY_COLORS[scheme.implementationComplexity]} variant="light" size="sm">
                        {COMPLEXITY_LABELS[scheme.implementationComplexity]}
                      </Badge>
                    </Stack>
                  </Group>

                  <Text size="xs" c="dimmed" mb="xs" lineClamp={2}>
                    {scheme.description}
                  </Text>

                  <Grid gutter={4} mb="xs">
                    <Grid.Col span={6}>
                      <Group gap={4}>
                        <IconCoin size={12} color="#868e96" />
                        <Text size="xs" c="dimmed">{scheme.estimatedCost} 钱</Text>
                      </Group>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Group gap={4}>
                        <IconClock size={12} color="#868e96" />
                        <Text size="xs" c="dimmed">{scheme.estimatedTime}h</Text>
                      </Group>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Group gap={4}>
                        <IconShield size={12} color="#868e96" />
                        <Text size="xs" c="dimmed">
                          可行性: {(scheme.feasibilityScore * 100).toFixed(0)}%
                        </Text>
                      </Group>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Group gap={4}>
                        <IconAlertTriangle size={12} color="#868e96" />
                        <Text size="xs" c="dimmed">
                          {RISK_LABELS[scheme.riskLevel]}
                        </Text>
                      </Group>
                    </Grid.Col>
                  </Grid>

                  <Progress
                    value={scheme.overallImprovement}
                    color={scheme.overallImprovement > 30 ? 'green' : scheme.overallImprovement > 15 ? 'blue' : 'yellow'}
                    size="xs"
                  />

                  {selectedSchemeId === scheme.id && (
                    <Group justify="flex-end" mt="xs">
                      <Badge color="blue" size="sm" variant="filled">
                        <IconCheck size={12} />
                        <Text size="xs" ml={4}>已选择</Text>
                      </Badge>
                    </Group>
                  )}
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </ScrollArea>

        {selectedScheme && (
          <>
            <Title order={5} mb="xs">方案详情: {selectedScheme.name}</Title>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper p="sm" radius="sm" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text fw={600} size="sm">综合评分</Text>
                    <Badge
                      color={selectedScheme.feasibilityScore > 0.8 ? 'green' : selectedScheme.feasibilityScore > 0.6 ? 'blue' : 'yellow'}
                      size="lg"
                    >
                      {(selectedScheme.feasibilityScore * 100).toFixed(0)} 分
                    </Badge>
                  </Group>
                  <Progress
                    value={selectedScheme.feasibilityScore * 100}
                    color={selectedScheme.feasibilityScore > 0.8 ? 'green' : selectedScheme.feasibilityScore > 0.6 ? 'blue' : 'yellow'}
                    size="md"
                    mb="md"
                  />

                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconTrendingUp size={16} color="#40c057" />
                        <Text size="sm">整体提升</Text>
                      </Group>
                      <Text size="sm" fw={600} c="green.7">
                        +{selectedScheme.overallImprovement.toFixed(1)}%
                      </Text>
                    </Group>

                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconCoin size={16} color="#fab005" />
                        <Text size="sm">实施成本</Text>
                      </Group>
                      <Text size="sm" fw={600}>
                        {selectedScheme.estimatedCost.toLocaleString()} 钱
                      </Text>
                    </Group>

                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconClock size={16} color="#228be6" />
                        <Text size="sm">预计工期</Text>
                      </Group>
                      <Text size="sm" fw={600}>
                        {selectedScheme.estimatedTime} 小时
                      </Text>
                    </Group>

                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconTool size={16} color="#868e96" />
                        <Text size="sm">实施难度</Text>
                      </Group>
                      <Badge color={COMPLEXITY_COLORS[selectedScheme.implementationComplexity]}>
                        {COMPLEXITY_LABELS[selectedScheme.implementationComplexity]}
                      </Badge>
                    </Group>

                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconAlertTriangle size={16} color="#e03131" />
                        <Text size="sm">风险等级</Text>
                      </Group>
                      <Badge color={RISK_COLORS[selectedScheme.riskLevel]}>
                        {RISK_LABELS[selectedScheme.riskLevel]}
                      </Badge>
                    </Group>
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper p="sm" radius="sm" withBorder>
                  <Text fw={600} size="sm" mb="xs">性能对比</Text>
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                        <XAxis dataKey="name" stroke="#6c757d" fontSize={10} />
                        <YAxis stroke="#6c757d" fontSize={12} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #dee2e6',
                            borderRadius: 8,
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="before"
                          name="优化前"
                          fill="#adb5bd"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="after"
                          name="优化后"
                          fill="#40c057"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper p="sm" radius="sm" withBorder>
                  <Text fw={600} size="sm" mb="xs">性能雷达图</Text>
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e9ecef" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="优化前"
                          dataKey="before"
                          stroke="#adb5bd"
                          fill="#adb5bd"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                        <Radar
                          name="优化后"
                          dataKey="after"
                          stroke="#228be6"
                          fill="#228be6"
                          fillOpacity={0.5}
                          strokeWidth={2}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #dee2e6',
                            borderRadius: 8,
                          }}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Paper>
              </Grid.Col>
            </Grid>

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="sm" radius="sm" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text fw={600} size="sm">参数变更详情</Text>
                    <Badge color="blue" variant="light" size="sm">
                      {selectedScheme.parameterChanges.length} 项变更
                    </Badge>
                  </Group>
                  <Stack gap="sm">
                    {selectedScheme.parameterChanges.map((change, idx) => (
                      <Group key={idx} justify="space-between">
                        <Text size="sm">{change.parameterName}</Text>
                        <Group gap="xs">
                          <Text size="sm" c="dimmed" style={{ textDecoration: 'line-through' }}>
                            {typeof change.oldValue === 'number' 
                              ? (change.oldValue as number).toFixed(2) 
                              : change.oldValue}
                          </Text>
                          <IconTrendingUp size={14} color={change.isBetter ? '#40c057' : '#e03131'} />
                          <Text size="sm" fw={600} c={change.isBetter ? 'green.7' : 'red.7'}>
                            {typeof change.newValue === 'number' 
                              ? (change.newValue as number).toFixed(2) 
                              : change.newValue}
                          </Text>
                          <Badge
                            size="xs"
                            color={change.isBetter ? 'green' : 'red'}
                            variant="light"
                          >
                            {change.changePercent > 0 ? '+' : ''}{change.changePercent.toFixed(1)}%
                          </Badge>
                        </Group>
                      </Group>
                    ))}
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="sm" radius="sm" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text fw={600} size="sm">优化效果明细</Text>
                    <Badge color="green" variant="light" size="sm">
                      {selectedScheme.improvementMetrics.filter((m) => m.isBetter).length} 项改善
                    </Badge>
                  </Group>
                  <Stack gap="sm">
                    {selectedScheme.improvementMetrics.map((metric, idx) => (
                      <Group key={idx} justify="space-between">
                        <Group gap="xs">
                          {getMetricIcon(metric.metric)}
                          <Text size="sm">{metric.metric}</Text>
                        </Group>
                        <Group gap="xs">
                          <Text size="sm" c="dimmed">
                            {metric.before.toFixed(2)} {metric.unit}
                          </Text>
                          <IconTrendingUp size={14} color={metric.isBetter ? '#40c057' : '#e03131'} />
                          <Text size="sm" fw={600} c={metric.isBetter ? 'green.7' : 'red.7'}>
                            {metric.after.toFixed(2)} {metric.unit}
                          </Text>
                          <Badge
                            size="xs"
                            color={metric.isBetter ? 'green' : 'red'}
                          >
                            {metric.improvementPercent > 0 ? '+' : ''}{metric.improvementPercent.toFixed(1)}%
                          </Badge>
                        </Group>
                      </Group>
                    ))}
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>

            {selectedScheme.recommendations.length > 0 && (
              <Paper bg="blue.0" p="sm" radius="sm" mt="md">
                <Group gap="xs" mb="xs">
                  <IconAward size={18} color="#1971c2" />
                  <Text fw={600} size="sm" c="blue.9">专家建议</Text>
                </Group>
                <Stack gap={4}>
                  {selectedScheme.recommendations.map((rec, idx) => (
                    <Text key={idx} size="sm" c="blue.9">
                      • {rec}
                    </Text>
                  ))}
                </Stack>
              </Paper>
            )}

            {selectedScheme.constraints.length > 0 && (
              <Paper p="sm" radius="sm" withBorder mt="md">
                <Text fw={600} size="sm" mb="xs">约束条件检查</Text>
                <Grid gutter={8}>
                  {selectedScheme.constraints.map((constraint, idx) => (
                    <Grid.Col span={{ base: 12, md: 6 }} key={idx}>
                      <Group justify="space-between">
                        <Group gap="xs">
                          {constraint.isViolated ? (
                            <IconX size={16} color="#e03131" />
                          ) : (
                            <IconCheck size={16} color="#40c057" />
                          )}
                          <Text size="sm">{constraint.name}</Text>
                        </Group>
                        <Group gap="xs">
                          <Text size="xs" c="dimmed">
                            当前: {constraint.currentValue.toFixed(2)} {constraint.unit}
                          </Text>
                          <Text size="xs" c="dimmed">
                            限值: {constraint.limitValue.toFixed(2)} {constraint.unit}
                          </Text>
                          <Badge
                            size="xs"
                            color={constraint.isViolated ? 'red' : 'green'}
                            variant={constraint.isViolated ? 'filled' : 'light'}
                          >
                            {constraint.isViolated ? '违反' : '满足'}
                          </Badge>
                        </Group>
                      </Group>
                    </Grid.Col>
                  ))}
                </Grid>
              </Paper>
            )}
          </>
        )}
      </Paper>
    </Stack>
  );
};

export default StructuralOptimizationPanel;
