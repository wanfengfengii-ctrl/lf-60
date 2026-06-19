import React from 'react';
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
  Accordion,
  Card,
  Alert,
  RingProgress,
  Center,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconFlame,
  IconShield,
  IconClock,
  IconGauge,
  IconMoodEmpty,
  IconMoodSad,
  IconMoodSmile,
  IconMoodHappy,
  IconAlertCircle,
  IconSettings,
  IconCircle,
  IconCheck,
  IconBolt,
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
  Cell,
} from 'recharts';
import {
  SimulationResult,
  FaultSeverity,
  SpokeCrackFault,
} from '../types';

const severityMap: Record<FaultSeverity, { label: string; color: string; bg: string }> = {
  none: { label: '正常', color: 'green', bg: '#ebfbee' },
  mild: { label: '轻微', color: 'blue', bg: '#e7f5ff' },
  moderate: { label: '中等', color: 'yellow', bg: '#fff9db' },
  severe: { label: '严重', color: 'orange', bg: '#fff4e6' },
  critical: { label: '危险', color: 'red', bg: '#fff5f5' },
};

const crackPositionMap = {
  root: '轮毂根部',
  middle: '轮辐中部',
  rim: '轮圈端部',
};

const deformationTypeMap = {
  radial: '径向偏摆',
  lateral: '侧向偏摆',
  combined: '复合偏摆',
};

interface FaultDiagnosisPanelProps {
  result: SimulationResult | null;
}

function getMoodIcon(level: FaultSeverity) {
  switch (level) {
    case 'none': return <IconMoodHappy size={28} />;
    case 'mild': return <IconMoodSmile size={28} />;
    case 'moderate': return <IconMoodEmpty size={28} />;
    case 'severe': return <IconMoodSad size={28} />;
    case 'critical': return <IconMoodEmpty size={28} />;
  }
}

function SeverityBadge({ severity, size = 'md' }: { severity: FaultSeverity; size?: 'xs' | 'sm' | 'md' }) {
  const s = severityMap[severity];
  return (
    <Badge color={s.color as any} variant="filled" size={size} tt="uppercase">
      {s.label}
    </Badge>
  );
}

const FaultDiagnosisPanel: React.FC<FaultDiagnosisPanelProps> = ({ result }) => {
  if (!result || !result.diagnosisResult) {
    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Center py="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="md" color="gray" variant="light">
              <IconAlertTriangle size={32} />
            </ThemeIcon>
            <Text c="dimmed" ta="center">
              暂无诊断结果
            </Text>
            <Text size="xs" c="dimmed" ta="center">
              请先配置参数并运行模拟
            </Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  const d = result.diagnosisResult;
  const sev = severityMap[d.overallFaultLevel];

  const safetyRadarData = [
    { subject: '结构完整度', A: d.structuralSafety.structuralIntegrity, fullMark: 100 },
    { subject: '承载能力', A: 100 - d.structuralSafety.loadCapacityLoss, fullMark: 100 },
    { subject: '抗崩溃安全', A: 100 - d.structuralSafety.collapseRisk, fullMark: 100 },
    { subject: '疲劳寿命', A: 100 - d.lifeImpact.fatigueLifeReduction, fullMark: 100 },
    { subject: '运行稳定', A: 100 - d.stabilityImpact.handlingDegradation, fullMark: 100 },
    { subject: '振动控制', A: Math.max(0, 100 - d.stabilityImpact.vibrationIncrease / 2), fullMark: 100 },
  ];

  const crackChartData = d.spokeCracks.length > 0 ? d.spokeCracks.slice(0, 8).map((c) => ({
    name: `#${c.spokeIndex + 1}`,
    结构影响: c.structuralImpact,
    扩展风险: c.propagationRisk,
    应力集中: Math.min(100, c.stressConcentration * 25),
  })) : [];

  const hasSevereOrCritical = d.spokeCracks.some(c => c.severity === 'critical' || c.severity === 'severe');
  const spokeCracksBadgeColor = d.spokeCracks.length > 0 ? (hasSevereOrCritical ? 'red' : 'orange') : 'green';

  return (
    <Stack gap="md">
      {d.immediateAttention.length > 0 && (
        <Alert
          color="red"
          title="🚨 紧急预警"
          icon={<IconAlertCircle size={20} />}
          withCloseButton={false}
        >
          <Stack gap="xs">
            {d.immediateAttention.map((msg, i) => (
              <Text key={i} size="sm" fw={500}>
                {msg}
              </Text>
            ))}
          </Stack>
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        <Card shadow="sm" p="md" radius="md" withBorder style={{ background: sev.bg }}>
          <Stack gap="sm">
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon size="lg" radius="md" color={sev.color as any} variant="light">
                  <IconShield size={20} />
                </ThemeIcon>
                <Text fw={600} size="sm">故障等级评定</Text>
              </Group>
              <SeverityBadge severity={d.overallFaultLevel} />
            </Group>
            <Center>
              <Group gap="md" mt="xs">
                <RingProgress
                  size={110}
                  thickness={10}
                  sections={[{ value: d.riskScore, color: sev.color as any }]}
                  label={
                    <Center>
                      <Stack gap={0} align="center">
                        <ThemeIcon size={36} radius="md" color={sev.color as any} variant="light">
                          {getMoodIcon(d.overallFaultLevel)}
                        </ThemeIcon>
                      </Stack>
                    </Center>
                  }
                />
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">综合风险评分</Text>
                  <Text fw={800} fz={28} c={sev.color as any}>
                    {d.riskScore}
                    <Text component="span" size="sm" fw={400} c="dimmed"> /100</Text>
                  </Text>
                  <Text size="xs" c="dimmed">
                    {d.riskScore < 25 ? '状态良好，安全运行' :
                      d.riskScore < 50 ? '轻度风险，建议关注' :
                        d.riskScore < 70 ? '中度风险，计划检修' :
                          '高度风险，立即处理'}
                  </Text>
                </Stack>
              </Group>
            </Center>
          </Stack>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon size="lg" radius="md" color="red" variant="light">
                  <IconBolt size={20} />
                </ThemeIcon>
                <Text fw={600} size="sm">轮辐裂纹识别</Text>
              </Group>
              <Badge color={spokeCracksBadgeColor} variant="light">
                {d.spokeCracks.length}根异常
              </Badge>
            </Group>
            <Stack gap="xs">
              {d.spokeCracks.length === 0 ? (
                <Stack align="center" py="sm">
                  <ThemeIcon size={48} radius="md" color="green" variant="light">
                    <IconCheck size={24} />
                  </ThemeIcon>
                  <Text size="xs" c="dimmed">所有轮辐无明显裂纹</Text>
                </Stack>
              ) : (
                <ScrollArea h={140} type="hover">
                  <Stack gap="xs">
                    {d.spokeCracks.slice(0, 5).map((c) => (
                      <CrackRow crack={c} key={c.spokeIndex} />
                    ))}
                    {d.spokeCracks.length > 5 && (
                      <Text size="xs" c="dimmed" ta="center">
                        还有 {d.spokeCracks.length - 5} 根轮辐异常...
                      </Text>
                    )}
                  </Stack>
                </ScrollArea>
              )}
            </Stack>
          </Stack>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <IconSettings size={20} />
                </ThemeIcon>
                <Text fw={600} size="sm">轮毂松动预警</Text>
              </Group>
              <SeverityBadge severity={d.hubLooseness.severity} size="sm" />
            </Group>

            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="xs" c="dimmed">松动度</Text>
                <Text fw={600} size="sm">
                  {d.hubLooseness.loosenessDegree}%
                </Text>
              </Group>
              <Progress
                value={d.hubLooseness.loosenessDegree}
                color={severityMap[d.hubLooseness.severity].color as any}
                size="sm"
              />
              <SimpleGrid cols={2} spacing="xs" mt="xs">
                <Box>
                  <Text size="xs" c="dimmed">螺栓张力损失</Text>
                  <Text fw={600} size="sm">{d.hubLooseness.boltTensionLoss}%</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">偏摆风险</Text>
                  <Text fw={600} size="sm">{d.hubLooseness.runoutRisk}%</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">振动幅值</Text>
                  <Text fw={600} size="sm">{d.hubLooseness.vibrationAmplitude}mm</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">安全裕度</Text>
                  <Text fw={600} size="sm">{d.hubLooseness.safetyMargin}%</Text>
                </Box>
              </SimpleGrid>
            </Stack>
          </Stack>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon size="lg" radius="md" color="violet" variant="light">
                  <IconCircle size={20} />
                </ThemeIcon>
                <Text fw={600} size="sm">轮圈变形诊断</Text>
              </Group>
              <Group gap="xs">
                <Badge color="violet" variant="light">{deformationTypeMap[d.rimDeformation.deformationType]}</Badge>
                <SeverityBadge severity={d.rimDeformation.severity} size="sm" />
              </Group>
            </Group>

            <SimpleGrid cols={2} spacing="md">
              <Stack gap="xs">
                <Group justify="space-between" align="flex-end">
                  <Box>
                    <Text size="xs" c="dimmed">最大偏摆量</Text>
                    <Text fw={700} size="xl">
                      {d.rimDeformation.maxRunout}
                      <Text component="span" size="sm" fw={400} c="dimmed"> mm</Text>
                    </Text>
                  </Box>
                </Group>
                <Progress
                  value={Math.min(100, (d.rimDeformation.maxRunout / 15) * 100)}
                  color={severityMap[d.rimDeformation.severity].color as any}
                  size="lg"
                />
              </Stack>

              <Stack gap="xs">
                <Box>
                  <Text size="xs" c="dimmed">变形角度</Text>
                  <Text fw={600}>{d.rimDeformation.deformationAngle}°</Text>
                </Box>
                <SimpleGrid cols={2} spacing="xs">
                  <Box>
                    <Text size="xs" c="dimmed">胎圈密封风险</Text>
                    <Text fw={600} c={d.rimDeformation.tireSealRisk > 50 ? 'red' : d.rimDeformation.tireSealRisk > 25 ? 'orange' : 'green'}>
                      {d.rimDeformation.tireSealRisk}%
                    </Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">动平衡影响</Text>
                    <Text fw={600} c={d.rimDeformation.balanceImpact > 50 ? 'red' : d.rimDeformation.balanceImpact > 25 ? 'orange' : 'green'}>
                      {d.rimDeformation.balanceImpact}%
                    </Text>
                  </Box>
                </SimpleGrid>
              </Stack>
            </SimpleGrid>
          </Stack>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
                  <IconGauge size={20} />
                </ThemeIcon>
                <Text fw={600} size="sm">综合性能雷达图</Text>
              </Group>
            </Group>
            <Box style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={safetyRadarData} outerRadius="75%">
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="状态" dataKey="A" stroke={sev.color} fill={sev.color} fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          </Stack>
        </Card>
      </SimpleGrid>

      {crackChartData.length > 0 && (
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} size="sm">裂纹轮辐风险分布 (Top {crackChartData.length})</Text>
            </Group>
            <Box style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={crackChartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <RTooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="结构影响" radius={[2, 2, 0, 0]}>
                    {crackChartData.map((_, idx) => {
                      const crack = d.spokeCracks[idx];
                      return <Cell key={idx} fill={severityMap[crack?.severity || 'mild'].color as any} />;
                    })}
                  </Bar>
                  <Bar dataKey="扩展风险" fill="#ffa94d" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="应力集中" fill="#74c0fc" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Stack>
        </Card>
      )}

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        <ImpactCard
          icon={<IconShield size={20} />}
          iconColor="red"
          title="结构安全影响"
          items={[
            { label: '安全系数下降', value: `${d.structuralSafety.safetyFactorReduction}%` },
            { label: '承载能力损失', value: `${d.structuralSafety.loadCapacityLoss}%` },
            { label: '崩溃风险', value: `${d.structuralSafety.collapseRisk}%`, valueColor: d.structuralSafety.collapseRisk > 50 ? 'red' : d.structuralSafety.collapseRisk > 25 ? 'orange' : 'green' },
            { label: '结构完整度', value: `${d.structuralSafety.structuralIntegrity}%`, valueColor: d.structuralSafety.structuralIntegrity > 70 ? 'green' : d.structuralSafety.structuralIntegrity > 40 ? 'orange' : 'red' },
          ]}
        />
        <ImpactCard
          icon={<IconClock size={20} />}
          iconColor="orange"
          title="寿命影响分析"
          items={[
            { label: '疲劳寿命缩减', value: `${d.lifeImpact.fatigueLifeReduction}%` },
            { label: '加速老化率', value: `${d.lifeImpact.acceleratedAgingRate}%` },
            { label: '建议维护周期', value: `${d.lifeImpact.maintenanceInterval}% 原周期` },
            { label: '当前剩余寿命', value: `${result.fatigueAnalysis.remainingLifePercent}%`, valueColor: result.fatigueAnalysis.remainingLifePercent > 60 ? 'green' : result.fatigueAnalysis.remainingLifePercent > 30 ? 'orange' : 'red' },
          ]}
        />
        <ImpactCard
          icon={<IconFlame size={20} />}
          iconColor="violet"
          title="运行稳定性影响"
          items={[
            { label: '振动水平增加', value: `${d.stabilityImpact.vibrationIncrease}%` },
            { label: '操控性能下降', value: `${d.stabilityImpact.handlingDegradation}%` },
            { label: '噪声水平上升', value: `${d.stabilityImpact.noiseLevelIncrease}%` },
            { label: '乘坐舒适性损失', value: `${d.stabilityImpact.rideComfortLoss}%` },
          ]}
        />
      </SimpleGrid>

      {d.spokeCracks.length > 0 && (
        <Accordion variant="separated" chevronPosition="right">
          <Accordion.Item key="cracks" value="cracks">
            <Accordion.Control icon={<IconBolt size={18} />}>
              <Group gap="sm">
                <Text fw={600}>全部裂纹详情 ({d.spokeCracks.length} 根)</Text>
                <Badge color="orange" variant="light">点击展开</Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <ScrollArea h={300} type="hover">
                <Table withTableBorder withColumnBorders striped highlightOnHover stripedColor="gray.0">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>轮辐编号</Table.Th>
                      <Table.Th>严重程度</Table.Th>
                      <Table.Th>裂纹位置</Table.Th>
                      <Table.Th>长度 (mm)</Table.Th>
                      <Table.Th>深度 (mm)</Table.Th>
                      <Table.Th>应力集中</Table.Th>
                      <Table.Th>扩展风险</Table.Th>
                      <Table.Th>结构影响</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {d.spokeCracks.map((c) => (
                      <Table.Tr key={c.spokeIndex}>
                        <Table.Td fw={600}>#{c.spokeIndex + 1}</Table.Td>
                        <Table.Td><SeverityBadge severity={c.severity} size="sm" /></Table.Td>
                        <Table.Td>{crackPositionMap[c.crackPosition]}</Table.Td>
                        <Table.Td>{c.crackLength}</Table.Td>
                        <Table.Td>{(c.crackDepth * 1000).toFixed(1)}</Table.Td>
                        <Table.Td>{c.stressConcentration.toFixed(2)}</Table.Td>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <Progress
                              value={c.propagationRisk}
                              color={c.propagationRisk > 60 ? 'red' : c.propagationRisk > 30 ? 'orange' : 'blue'}
                              size="xs"
                              style={{ flex: 1, minWidth: 40 }}
                            />
                            <Text size="xs" fw={500}>{c.propagationRisk}%</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <Progress
                              value={c.structuralImpact}
                              color={c.structuralImpact > 60 ? 'red' : c.structuralImpact > 30 ? 'orange' : 'teal'}
                              size="xs"
                              style={{ flex: 1, minWidth: 40 }}
                            />
                            <Text size="xs" fw={500}>{c.structuralImpact}%</Text>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}
    </Stack>
  );
};

function CrackRow({ crack }: { crack: SpokeCrackFault }) {
  const s = severityMap[crack.severity];
  return (
    <Paper p="xs" radius="sm" withBorder style={{ background: s.bg, borderColor: `${s.color}33` }}>
      <Group justify="space-between" wrap="nowrap" mb={4}>
        <Group gap="xs" wrap="nowrap">
          <Badge size="xs" color={s.color as any} variant="filled" tt="none">
            #{crack.spokeIndex + 1}
          </Badge>
          <Text size="xs" fw={500}>
            {crackPositionMap[crack.crackPosition]}
          </Text>
        </Group>
        <SeverityBadge severity={crack.severity} size="xs" />
      </Group>
      <Group gap="xs" wrap="wrap">
        <Tooltip label="裂纹长度">
          <Badge size="xs" variant="light" color="gray">
            <IconBolt size={10} /> L:{crack.crackLength}mm
          </Badge>
        </Tooltip>
        <Tooltip label="结构影响">
          <Badge size="xs" variant="light" color="red">
            <IconAlertTriangle size={10} /> {crack.structuralImpact}%
          </Badge>
        </Tooltip>
        <Tooltip label="扩展风险">
          <Badge size="xs" variant="light" color="orange">
            <IconFlame size={10} /> {crack.propagationRisk}%
          </Badge>
        </Tooltip>
      </Group>
    </Paper>
  );
}

function ImpactCard({
  icon, iconColor, title, items }: {
    icon: React.ReactNode;
    iconColor: string;
    title: string;
    items: { label: string; value: string; valueColor?: string }[];
  }) {
  return (
    <Card shadow="sm" p="md" radius="md" withBorder>
      <Stack gap="md">
        <Group gap="xs" mb="xs">
          <ThemeIcon size="lg" radius="md" color={iconColor as any} variant="light">
            {icon}
          </ThemeIcon>
          <Text fw={600} size="sm">{title}</Text>
        </Group>
        <Divider mx="-md" />
        <Stack gap="sm">
          {items.map((it, idx) => (
            <Group key={idx} justify="space-between">
              <Text size="xs" c="dimmed">{it.label}</Text>
              <Text fw={600} c={(it.valueColor || 'dark') as any}>
                {it.value}
              </Text>
            </Group>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}

export default FaultDiagnosisPanel;
