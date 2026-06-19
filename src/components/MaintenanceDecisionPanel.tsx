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
  Tabs,
  RingProgress,
  Center,
  Chip,
  Alert,
  Fieldset,
} from '@mantine/core';
import {
  IconTool,
  IconCash,
  IconChartArrows,
  IconToolsKitchen2,
  IconShieldHalf,
  IconArrowBigUp,
  IconArrowBigDown,
  IconCheck,
  IconStar,
  IconClock,
  IconAlertTriangle,
  IconBox,
  IconRoute,
  IconWeight,
  IconCar,
  IconPackage,
  IconCircleCheck,
  IconCircleX,
  IconSparkles,
} from '@tabler/icons-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  SimulationResult,
  MaintenancePlan,
  RepairActionType,
} from '../types';
import { generateMaintenanceComparison } from '../physics/diagnostic';

interface MaintenanceDecisionPanelProps {
  result: SimulationResult | null;
}

const planTypeIcon: Record<MaintenancePlan['planType'], any> = {
  repair: IconTool,
  reinforce: IconShieldHalf,
  overhaul: IconToolsKitchen2,
  preventive: IconSparkles,
};

const planTypeLabel: Record<MaintenancePlan['planType'], string> = {
  repair: '维修型',
  reinforce: '加固型',
  overhaul: '大修型',
  preventive: '预防型',
};

const planTypeColor: Record<MaintenancePlan['planType'], string> = {
  repair: 'red',
  reinforce: 'blue',
  overhaul: 'violet',
  preventive: 'teal',
};

const repairActionIcon: Record<RepairActionType, any> = {
  spoke_replace: IconTool,
  spoke_reinforce: IconShieldHalf,
  material_replace: IconBox,
  hub_tighten: IconTool,
  hub_replace: IconToolsKitchen2,
  rim_true: IconCar,
  rim_replace: IconPackage,
  load_adjust: IconWeight,
  road_avoid: IconRoute,
  regular_inspection: IconCheck,
};

const priorityInfo = {
  immediate: { label: '立即', color: 'red', order: 0 },
  high: { label: '高', color: 'orange', order: 1 },
  medium: { label: '中', color: 'yellow', order: 2 },
  low: { label: '低', color: 'gray', order: 3 },
};

const MaintenanceDecisionPanel: React.FC<MaintenanceDecisionPanelProps> = ({ result }) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('plans');

  const hasData = !!(result && result.maintenanceRecommendation);
  const rec = result?.maintenanceRecommendation;
  const recommendedPlanId = rec?.recommendedPlanId;
  const planId = selectedPlanId || recommendedPlanId || '';
  const plan = rec?.plans.find((p) => p.id === planId) || rec?.plans[0];
  const cost = rec?.costEstimates[planId] || {
    materialCost: 0, laborCost: 0, laborHours: 0, equipmentCost: 0,
    inspectionCost: 0, downtimeCost: 0, totalCost: 0,
  };
  const effect = rec?.expectedEffects[planId] || {
    safetyFactorImprovement: 0, lifeExtension: 0, loadCapacityRecovery: 0,
    stabilityRecovery: 0, vibrationReduction: 0, overallScoreImprovement: 0,
  };

  const dataComparison = useMemo(() => {
    if (!result || !rec || !planId) return null;
    if (result.maintenanceComparison && result.maintenanceComparison.planId === planId) {
      return result.maintenanceComparison;
    }
    return generateMaintenanceComparison(result, rec, planId);
  }, [result, rec, planId]);

  if (!hasData || !plan || !dataComparison) {
    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Center py="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="md" color="gray" variant="light">
              <IconTool size={32} />
            </ThemeIcon>
            <Text c="dimmed" ta="center">
              暂无维修决策数据
            </Text>
            <Text size="xs" c="dimmed" ta="center">
              请先完成参数运行模拟以生成诊断结果
            </Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  const dataRec = rec!;
  const dataPlan = plan!;

  const costChartData = [
    { name: '材料', value: cost.materialCost, color: '#4dabf7' },
    { name: '人工', value: cost.laborCost, color: '#69db7c' },
    { name: '设备', value: cost.equipmentCost, color: '#ffd43b' },
    { name: '检测', value: cost.inspectionCost, color: '#da77f2' },
    { name: '停机', value: cost.downtimeCost, color: '#ff8787' },
  ];

  const allPlansCostData = dataRec.plans.map((p) => {
    const c = dataRec.costEstimates[p.id];
    const e = dataRec.expectedEffects[p.id];
    return {
      name: p.name.replace('方案', '').replace('维修', '').replace('维护', ''),
      总成本: c.totalCost,
      评分提升: e.overallScoreImprovement,
      寿命延长: e.lifeExtension,
    };
  });

  const priorityCounts = [
    { name: '立即', value: dataPlan.actions.filter((a) => a.priority === 'immediate').length, color: '#ff6b6b' },
    { name: '高', value: dataPlan.actions.filter((a) => a.priority === 'high').length, color: '#ffa94d' },
    { name: '中', value: dataPlan.actions.filter((a) => a.priority === 'medium').length, color: '#ffd43b' },
    { name: '低', value: dataPlan.actions.filter((a) => a.priority === 'low').length, color: '#ced4da' },
  ].filter((d) => d.value > 0);

  const recommendedPlan = dataRec.plans.find((p) => p.id === dataRec.recommendedPlanId);
  const reasonText = recommendedPlan?.name === dataPlan.name
    ? '为最佳性价比选择，综合考虑安全性与经济性平衡'
    : '可作为备选参考，综合考虑不同维护策略';

  return (
    <Stack gap="md">
      <Alert
        color={planTypeColor[dataPlan.planType] as any}
        title="💡 系统推荐"
        icon={<IconStar size={20} />}
        withCloseButton={false}
      >
        <Group gap="sm" wrap="nowrap">
          <Text size="sm">
            基于当前故障状态（{result.diagnosisResult?.overallFaultLevel}级），系统推荐采用
            <Text component="span" fw={700}>「{dataPlan.name}」</Text>
            。该方案{reasonText}。
          </Text>
        </Group>
      </Alert>

      <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
        {dataRec.plans.map((p) => {
          const pc = dataRec.costEstimates[p.id];
          const pe = dataRec.expectedEffects[p.id];
          const isSelected = p.id === planId;
          const isRec = p.id === dataRec.recommendedPlanId;
          const PlanIcon = planTypeIcon[p.planType];
          return (
            <Card
              key={p.id}
              shadow="sm"
              p="md"
              radius="md"
              withBorder
              onClick={() => setSelectedPlanId(p.id)}
              style={{
                cursor: 'pointer',
                borderWidth: isSelected ? '3px' : '1px',
                borderColor: isSelected ? (planTypeColor[p.planType] as any) : '#e5e7eb',
                background: isSelected ? `${planTypeColor[p.planType]}10` : undefined,
                transition: 'all 0.2s',
              }}
            >
              <Stack gap="sm">
                <Group justify="space-between" mb="xs">
                  <Group gap="xs" wrap="nowrap">
                    <ThemeIcon
                      size="lg"
                      radius="md"
                      color={planTypeColor[p.planType] as any}
                      variant="light"
                    >
                      <PlanIcon size={20} />
                    </ThemeIcon>
                    <Stack gap={0}>
                      <Group gap="xs" wrap="nowrap">
                        <Text fw={700} size="sm">{p.name}</Text>
                        {isRec && (
                          <Badge color="yellow" size="xs" variant="filled" tt="none">
                            <IconStar size={10} /> 推荐
                          </Badge>
                        )}
                      </Group>
                      <Badge
                        color={planTypeColor[p.planType] as any}
                        variant="light"
                        size="xs"
                        tt="none"
                      >
                        {planTypeLabel[p.planType]}
                      </Badge>
                    </Stack>
                  </Group>
                </Group>
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {p.description}
                </Text>
                <Divider />
                <SimpleGrid cols={2} spacing="xs">
                  <Box>
                    <Text size="xs" c="dimmed">维修动作</Text>
                    <Text fw={600}>{p.actions.length} 项</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">工时</Text>
                    <Text fw={600}>{p.totalDurationHours.toFixed(1)}h</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">预计费用</Text>
                    <Text fw={600} c="blue">
                      ¥{pc.totalCost.toLocaleString()}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">评分提升</Text>
                    <Text fw={600} c="green">
                      +{pe.overallScoreImprovement}%
                    </Text>
                  </Box>
                </SimpleGrid>
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>

      <Tabs value={activeTab} onChange={(v) => setActiveTab(v || 'plans')}>
        <Tabs.List>
          <Tabs.Tab value="plans" leftSection={<IconTool size={16} />}>
            维修方案详情
          </Tabs.Tab>
          <Tabs.Tab value="cost" leftSection={<IconCash size={16} />}>
            成本估算
          </Tabs.Tab>
          <Tabs.Tab value="compare" leftSection={<IconChartArrows size={16} />}>
            维修前后效果对比
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="plans" pt="md">
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
              <Card shadow="sm" p="md" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <ThemeIcon size="lg" radius="md" color={planTypeColor[dataPlan.planType] as any} variant="light">
                        <IconTool size={20} />
                      </ThemeIcon>
                      <Text fw={600} size="sm">方案概览</Text>
                    </Group>
                    <Badge color={planTypeColor[dataPlan.planType] as any} variant="light">
                      {planTypeLabel[dataPlan.planType]}
                    </Badge>
                  </Group>
                  <Stack gap={4}>
                    <Text fw={700} size="lg">{dataPlan.name}</Text>
                    <Text size="sm" c="dimmed">{dataPlan.description}</Text>
                  </Stack>
                  <Divider />
                  <SimpleGrid cols={2} spacing="sm">
                    <Box>
                      <Text size="xs" c="dimmed">维修项数</Text>
                      <Text fw={700} size="xl">{dataPlan.actions.length}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">总工时</Text>
                      <Text fw={700} size="xl">{dataPlan.totalDurationHours.toFixed(1)}h</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">预计总费用</Text>
                      <Text fw={700} size="xl" c="blue">
                        ¥{cost.totalCost.toLocaleString()}
                      </Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">综合评分提升</Text>
                      <Text fw={700} size="xl" c="green">
                        +{effect.overallScoreImprovement}%
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Stack>
              </Card>

              <Card shadow="sm" p="md" radius="md" withBorder>
                <Stack gap="md">
                  <Group gap="xs">
                    <ThemeIcon size="lg" radius="md" color="green" variant="light">
                      <IconShieldHalf size={20} />
                    </ThemeIcon>
                    <Text fw={600} size="sm">预期改善效果</Text>
                  </Group>
                  <Stack gap="sm">
                    <EffectBar label="安全系数提升" value={effect.safetyFactorImprovement} color="red" icon={<IconShieldHalf size={14} />} />
                    <EffectBar label="疲劳寿命延长" value={effect.lifeExtension} color="blue" icon={<IconClock size={14} />} />
                    <EffectBar label="承载能力恢复" value={effect.loadCapacityRecovery} color="violet" icon={<IconWeight size={14} />} />
                    <EffectBar label="运行稳定性恢复" value={effect.stabilityRecovery} color="teal" icon={<IconCar size={14} />} />
                    <EffectBar label="振动水平降低" value={effect.vibrationReduction} color="orange" icon={<IconAlertTriangle size={14} />} />
                  </Stack>
                </Stack>
              </Card>

              <Card shadow="sm" p="md" radius="md" withBorder>
                <Stack gap="md">
                  <Group gap="xs">
                    <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
                      <IconToolsKitchen2 size={20} />
                    </ThemeIcon>
                    <Text fw={600} size="sm">方案优先级分布</Text>
                  </Group>
                  <Box style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityCounts}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={65}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          labelLine={false}
                        >
                          {priorityCounts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Stack>
              </Card>
            </SimpleGrid>

            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={600} size="sm">维修执行清单（按优先级）</Text>
                  <Badge color={planTypeColor[dataPlan.planType] as any} variant="light">
                    共 {dataPlan.actions.length} 项动作
                  </Badge>
                </Group>
                <ScrollArea h={400} type="hover">
                  <Stack gap="sm">
                    {[...dataPlan.actions].sort((a, b) => priorityInfo[a.priority].order - priorityInfo[b.priority].order).map((action, idx) => {
                      const ActionIcon = repairActionIcon[action.type];
                      const pri = priorityInfo[action.priority];
                      const priBorderColor = pri.color === 'red' ? '#ff6b6b' : pri.color === 'orange' ? '#ffa94d' : pri.color === 'yellow' ? '#ffd43b' : '#ced4da';
                      return (
                        <Paper
                          key={action.id}
                          p="sm"
                          radius="md"
                          withBorder
                          style={{ borderLeft: `4px solid ${priBorderColor}` }}
                        >
                          <Group justify="space-between" align="flex-start" mb="xs">
                            <Group gap="sm" wrap="nowrap">
                              <ThemeIcon size="lg" radius="md" color="gray" variant="light">
                                <ActionIcon size={18} />
                              </ThemeIcon>
                              <Stack gap={2}>
                                <Group gap="xs" wrap="nowrap">
                                  <Text fw={600}>
                                    <Text component="span" c="dimmed" fw={400} mr="xs">#{idx + 1}</Text>
                                    {action.title}
                                  </Text>
                                </Group>
                                <Group gap="xs" wrap="wrap">
                                  <Badge color={pri.color as any} variant="filled" size="xs">
                                    {pri.label}优先级
                                  </Badge>
                                  <Badge color="gray" variant="light" size="xs">
                                    <IconTool size={10} /> 复杂度 {action.complexity}/5
                                  </Badge>
                                  <Badge color="blue" variant="light" size="xs">
                                    <IconClock size={10} /> {action.durationHours}h
                                  </Badge>
                                </Group>
                              </Stack>
                            </Group>
                          </Group>
                          <Text size="sm" c="dimmed" mb="xs">
                            {action.description}
                          </Text>
                          {action.prerequisites.length > 0 && (
                            <Group gap="xs" wrap="wrap">
                              <Text size="xs" fw={500} c="dimmed">前置条件:</Text>
                              {action.prerequisites.map((pre) => (
                                <Chip key={pre} size="xs" variant="light" color="gray">
                                  {pre}
                                </Chip>
                              ))}
                            </Group>
                          )}
                          {action.affectedComponents.length > 0 && (
                            <Group gap="xs" wrap="wrap" mt="xs">
                              <Text size="xs" fw={500} c="dimmed">涉及:</Text>
                              {action.affectedComponents.slice(0, 6).map((comp) => (
                                <Badge key={comp} color="indigo" variant="dot" size="xs">
                                  {comp}
                                </Badge>
                              ))}
                              {action.affectedComponents.length > 6 && (
                                <Badge color="gray" variant="dot" size="xs">
                                  +{action.affectedComponents.length - 6} 更多
                                </Badge>
                              )}
                            </Group>
                          )}
                        </Paper>
                      );
                    })}
                  </Stack>
                </ScrollArea>
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="cost" pt="md">
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Card shadow="sm" p="md" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <ThemeIcon size="lg" radius="md" color="green" variant="light">
                        <IconCash size={20} />
                      </ThemeIcon>
                      <Text fw={600} size="sm">成本构成明细</Text>
                    </Group>
                    <Text fw={800} size="xl" c="blue">
                      ¥{cost.totalCost.toLocaleString()}
                    </Text>
                  </Group>
                  <SimpleGrid cols={2} spacing="md">
                    <Stack gap="sm">
                      <CostRow label="材料费用" value={cost.materialCost} color="#4dabf7" total={cost.totalCost} />
                      <CostRow label="人工费用" value={cost.laborCost} color="#69db7c" total={cost.totalCost} />
                      <CostRow label="设备/工装" value={cost.equipmentCost} color="#ffd43b" total={cost.totalCost} />
                      <CostRow label="检测/校准" value={cost.inspectionCost} color="#da77f2" total={cost.totalCost} />
                      <CostRow label="停机损失" value={cost.downtimeCost} color="#ff8787" total={cost.totalCost} highlight />
                    </Stack>
                    <Box style={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costChartData.filter((d) => d.value > 0)}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={75}
                          >
                            {costChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RTooltip
                            formatter={(value: any) => [`¥${Number(value).toLocaleString()}`, '金额']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </SimpleGrid>
                  <Divider />
                  <SimpleGrid cols={3} spacing="sm">
                    <Box>
                      <Text size="xs" c="dimmed">总工时</Text>
                      <Text fw={700}>{cost.laborHours} 小时</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">人工单价</Text>
                      <Text fw={700}>¥150 / 小时</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">停机损失</Text>
                      <Text fw={700} c="red">¥{cost.downtimeCost.toLocaleString()}</Text>
                    </Box>
                  </SimpleGrid>
                </Stack>
              </Card>

              <Card shadow="sm" p="md" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <ThemeIcon size="lg" radius="md" color="indigo" variant="light">
                        <IconChartArrows size={20} />
                      </ThemeIcon>
                      <Text fw={600} size="sm">方案对比（{dataRec.plans.length} 个方案）</Text>
                    </Group>
                  </Group>
                  <Box style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={allPlansCostData} barGap={8}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                        <RTooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar yAxisId="left" dataKey="总成本" name="费用 (¥)" radius={[4, 4, 0, 0]}>
                          {allPlansCostData.map((_, idx) => {
                            const p = dataRec.plans[idx];
                            return (
                              <Cell
                                key={idx}
                                fill={p && p.id === dataRec.recommendedPlanId ? '#228be6' : '#ced4da'}
                                stroke={p && p.id === planId ? '#f59f00' : undefined}
                                strokeWidth={p && p.id === planId ? 3 : 0}
                              />
                            );
                          })}
                        </Bar>
                        <Bar yAxisId="right" dataKey="寿命延长" name="寿命延长 (%)" fill="#69db7c" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                  <Divider />
                  <Table withTableBorder withColumnBorders striped stripedColor="gray.0">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>方案</Table.Th>
                        <Table.Th>类型</Table.Th>
                        <Table.Th>总费用</Table.Th>
                        <Table.Th>评分提升</Table.Th>
                        <Table.Th>性价比</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {dataRec.plans.map((p) => {
                        const c = dataRec.costEstimates[p.id];
                        const e = dataRec.expectedEffects[p.id];
                        const value = e.overallScoreImprovement / (c.totalCost / 1000);
                        return (
                          <Table.Tr
                            key={p.id}
                            style={{
                              background: p.id === planId ? '#fff9db' : undefined,
                            }}
                          >
                            <Table.Td>
                              <Group gap="xs" wrap="nowrap">
                                {p.name}
                                {p.id === dataRec.recommendedPlanId && (
                                  <Badge color="yellow" size="xs">
                                    <IconStar size={10} />
                                  </Badge>
                                )}
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Badge color={planTypeColor[p.planType] as any} variant="light" size="xs">
                                {planTypeLabel[p.planType]}
                              </Badge>
                            </Table.Td>
                            <Table.Td fw={600}>¥{c.totalCost.toLocaleString()}</Table.Td>
                            <Table.Td c="green">+{e.overallScoreImprovement}%</Table.Td>
                            <Table.Td fw={600} c={value > 5 ? 'green' : value > 2 ? 'blue' : 'gray'}>
                              {value.toFixed(2)}
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Card>
            </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="compare" pt="md">
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Card shadow="sm" p="md" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <ThemeIcon size="lg" radius="md" color="teal" variant="light">
                        <IconChartArrows size={20} />
                      </ThemeIcon>
                      <Text fw={600} size="sm">维修前后综合对比</Text>
                    </Group>
                    <Badge color={planTypeColor[dataPlan.planType] as any} variant="light">
                      {dataPlan.name}
                    </Badge>
                  </Group>
                  <Box style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={dataComparison.radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                        <Radar name="维修前" dataKey="before" stroke="#ff6b6b" fill="#ff6b6b" fillOpacity={0.25} strokeWidth={2} />
                        <Radar name="维修后" dataKey="after" stroke="#51cf66" fill="#51cf66" fillOpacity={0.3} strokeWidth={2} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <RTooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>
                </Stack>
              </Card>

              <SimpleGrid cols={2} spacing="md">
                <Card shadow="sm" p="md" radius="md" withBorder style={{ background: '#fff5f5' }}>
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <ThemeIcon size="md" radius="md" color="red" variant="light">
                        <IconCircleX size={18} />
                      </ThemeIcon>
                      <Text fw={700} size="sm">维修前</Text>
                    </Group>
                    <Divider color="#ffc9c9" />
                    <Stack gap="xs">
                      <OverviewMetric label="结构安全" value={dataComparison.beforeOverview.structuralSafety} />
                      <OverviewMetric label="估计寿命" value={dataComparison.beforeOverview.estimatedLife} />
                      <OverviewMetric label="运行稳定" value={dataComparison.beforeOverview.stability} />
                    </Stack>
                    <Divider color="#ffc9c9" />
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">综合评分</Text>
                      <RingProgress
                        size={60}
                        thickness={6}
                        sections={[{ value: dataComparison.beforeOverview.overallScore, color: '#ff6b6b' }]}
                        label={
                          <Center>
                            <Text fw={700} size="14px" c="red">
                              {dataComparison.beforeOverview.overallScore}
                            </Text>
                          </Center>
                        }
                      />
                    </Group>
                  </Stack>
                </Card>

                <Card shadow="sm" p="md" radius="md" withBorder style={{ background: '#ebfbee' }}>
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <ThemeIcon size="md" radius="md" color="green" variant="light">
                        <IconCircleCheck size={18} />
                      </ThemeIcon>
                      <Group gap="xs">
                        <Text fw={700} size="sm">维修后</Text>
                        <Badge color="green" variant="filled" size="xs">
                          +{dataComparison.afterOverview.overallScore - dataComparison.beforeOverview.overallScore}
                        </Badge>
                      </Group>
                    </Group>
                    <Divider color="#b2f2bb" />
                    <Stack gap="xs">
                      <OverviewMetric label="结构安全" value={dataComparison.afterOverview.structuralSafety} improved />
                      <OverviewMetric label="估计寿命" value={dataComparison.afterOverview.estimatedLife} improved />
                      <OverviewMetric label="运行稳定" value={dataComparison.afterOverview.stability} improved />
                    </Stack>
                    <Divider color="#b2f2bb" />
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">综合评分</Text>
                      <RingProgress
                        size={60}
                        thickness={6}
                        sections={[{ value: dataComparison.afterOverview.overallScore, color: '#51cf66' }]}
                        label={
                          <Center>
                            <Text fw={700} size="14px" c="green">
                              {dataComparison.afterOverview.overallScore}
                            </Text>
                          </Center>
                        }
                      />
                    </Group>
                  </Stack>
                </Card>
              </SimpleGrid>
            </SimpleGrid>

            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={600} size="sm">关键指标对比明细</Text>
                  <Group gap="sm">
                    <Badge color="red" variant="light">
                      维修前
                    </Badge>
                    <IconArrowBigDown size={18} color="#40c057" />
                    <Badge color="green" variant="light">
                      维修后
                    </Badge>
                  </Group>
                </Group>
                <ScrollArea>
                  <Table withTableBorder withColumnBorders striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>指标</Table.Th>
                        <Table.Th>维修前</Table.Th>
                        <Table.Th>维修后</Table.Th>
                        <Table.Th>变化量</Table.Th>
                        <Table.Th w={180}>改善</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {dataComparison.metrics.map((m, idx) => {
                        const improved = m.improvementPercent > 0;
                        return (
                          <Table.Tr key={idx}>
                            <Table.Td>
                              <Group gap="xs" wrap="nowrap">
                                <Text fw={500}>{m.name}</Text>
                                {m.unit && <Text size="xs" c="dimmed">({m.unit})</Text>}
                              </Group>
                            </Table.Td>
                            <Table.Td fw={600}>{m.beforeValue.toLocaleString()}</Table.Td>
                            <Table.Td fw={600} c={improved ? 'green' : 'red'}>
                              {m.afterValue.toLocaleString()}
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs" wrap="nowrap">
                                <ThemeIcon
                                  size="sm"
                                  radius="sm"
                                  color={improved ? 'green' : 'red'}
                                  variant="light"
                                >
                                  {improved
                                    ? <IconArrowBigUp size={14} />
                                    : <IconArrowBigDown size={14} />}
                                </ThemeIcon>
                                <Text fw={700} c={improved ? 'green' : 'red'}>
                                  {improved ? '+' : ''}{m.improvementPercent.toFixed(1)}%
                                </Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs" wrap="nowrap">
                                <Progress
                                  value={Math.min(100, (m.beforeValue / Math.max(m.beforeValue, m.afterValue)) * 100)}
                                  color="red"
                                  size="md"
                                  style={{ flex: 1, minWidth: 40, maxWidth: 80 }}
                                />
                                <Progress
                                  value={Math.min(100, (m.afterValue / Math.max(m.beforeValue, m.afterValue)) * 100)}
                                  color="green"
                                  size="md"
                                  style={{ flex: 1, minWidth: 40, maxWidth: 80 }}
                                />
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Stack>
            </Card>

            <Fieldset legend="决策建议">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <Stack gap="xs">
                  <Group gap="xs">
                    <ThemeIcon size="md" radius="md" color="teal" variant="light">
                      <IconCheck size={16} />
                    </ThemeIcon>
                    <Text fw={600} size="sm">为何选择「{dataPlan.name}」</Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    该方案在费用 ¥{cost.totalCost.toLocaleString()} 的投入下，
                    可将综合评分提升 {effect.overallScoreImprovement}%，
                    寿命延长 {effect.lifeExtension}%，
                    安全系数改善 {effect.safetyFactorImprovement}%，
                    综合性价比最优。
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Group gap="xs">
                    <ThemeIcon size="md" radius="md" color="blue" variant="light">
                      <IconAlertTriangle size={16} />
                    </ThemeIcon>
                    <Text fw={600} size="sm">后续运维建议</Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    维修完成后建议每运行 {Math.max(5000, Math.round(10000 * (dataComparison.afterOverview.estimatedLife) / 100)).toLocaleString()} 次循环进行一次全面检查，
                    {result.roadCondition.impactMultiplier > 1 ? `并优先规避${result.roadCondition.name}等高冲击路况。` : '并保持良好的驾驶习惯。'}
                  </Text>
                </Stack>
              </SimpleGrid>
            </Fieldset>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

function EffectBar({
  label, value, color, icon }: {
    label: string;
    value: number;
    color: string;
    icon: React.ReactNode;
  }) {
  return (
    <Stack gap={4}>
      <Group justify="space-between">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon size={14} radius="sm" color={color as any} variant="light">
            {icon}
          </ThemeIcon>
          <Text size="xs">{label}</Text>
        </Group>
        <Text size="xs" fw={700} c={color as any}>+{value}%</Text>
      </Group>
      <Progress value={value} color={color as any} size="sm" radius="sm" />
    </Stack>
  );
}

function CostRow({
  label, value, color, total, highlight }: {
    label: string;
    value: number;
    color: string;
    total: number;
    highlight?: boolean;
  }) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <Stack gap={2}>
      <Group justify="space-between">
        <Text size="xs" fw={highlight ? 600 : 500} c={highlight ? 'red' : 'dark'}>
          {label}
        </Text>
        <Group gap="sm" wrap="nowrap">
          <Text size="xs" fw={700}>¥{value.toLocaleString()}</Text>
          <Text size="xs" c="dimmed">{percent.toFixed(1)}%</Text>
        </Group>
      </Group>
      <Progress value={percent} color={color} size="xs" />
    </Stack>
  );
}

function OverviewMetric({ label, value, improved }: { label: string; value: number; improved?: boolean }) {
  return (
    <Group justify="space-between">
      <Text size="xs" c="dimmed">{label}</Text>
      <Group gap="xs" wrap="nowrap">
        <Progress
          value={value}
          color={improved ? 'green' : 'red'}
          size="sm"
          style={{ width: 60 }}
        />
        <Text fw={700}>{value}%</Text>
      </Group>
    </Group>
  );
}

export default MaintenanceDecisionPanel;
