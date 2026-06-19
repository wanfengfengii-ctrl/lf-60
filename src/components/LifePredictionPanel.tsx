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
  Select,
  Alert,
  Chip,
} from '@mantine/core';
import {
  IconHeartbeat,
  IconClock,
  IconAlertTriangle,
  IconCircleCheck,
  IconTrendingDown,
  IconCalendar,
  IconRoute,
  IconBulb,
  IconRefresh,
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
  Legend,
} from 'recharts';
import {
  LifePredictionResult,
  LifePredictionPoint,
  Warning as WarningType,
  WheelServiceRecord,
} from '../types';

interface LifePredictionPanelProps {
  predictions: LifePredictionResult[];
  wheels: WheelServiceRecord[];
}

const RISK_COLORS: Record<LifePredictionPoint['riskLevel'], string> = {
  low: '#40c057',
  medium: '#fab005',
  high: '#fd7e14',
  critical: '#ff6b6b',
};

const RISK_LABELS: Record<LifePredictionPoint['riskLevel'], string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '危急',
};

const WARNING_TYPE_LABELS: Record<WarningType['type'], string> = {
  health: '健康预警',
  life: '寿命预警',
  maintenance: '维护提醒',
  spare_parts: '备件预警',
  resource: '资源预警',
};

const LifePredictionPanel: React.FC<LifePredictionPanelProps> = ({ predictions, wheels }) => {
  const [selectedWheelId, setSelectedWheelId] = useState<string>(wheels[0]?.identity.id || '');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const selectedPrediction = useMemo(
    () => predictions.find((p) => p.wheelId === selectedWheelId),
    [predictions, selectedWheelId]
  );

  const selectedWheel = useMemo(
    () => wheels.find((w) => w.identity.id === selectedWheelId),
    [wheels, selectedWheelId]
  );

  const allWarnings = useMemo(() => {
    const warnings = predictions.flatMap((p) => p.warnings);
    return showAcknowledged ? warnings : warnings.filter((w) => !w.acknowledged);
  }, [predictions, showAcknowledged]);

  const chartData = useMemo(() => {
    if (!selectedPrediction) return [];
    return selectedPrediction.predictionCurve.map((point) => ({
      cycles: (point.cycles / 10000).toFixed(0) + '万',
      health: point.predictedHealthScore,
      lower: point.lowerBound,
      upper: point.upperBound,
      risk: RISK_LABELS[point.riskLevel],
    }));
  }, [selectedPrediction]);

  if (predictions.length === 0) {
    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Center py="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="md" color="gray" variant="light">
              <IconHeartbeat size={32} />
            </ThemeIcon>
            <Text c="dimmed" ta="center">暂无寿命预测数据</Text>
            <Text size="xs" c="dimmed" ta="center">请先生成车队数据以查看寿命预测预警</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Card shadow="sm" p="md" radius="md" withBorder>
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon size="lg" radius="md" color="blue" variant="light">
              <IconHeartbeat size={20} />
            </ThemeIcon>
            <Text fw={600} size="sm">选择车轮</Text>
          </Group>
          <Select
            value={selectedWheelId}
            onChange={(v) => v && setSelectedWheelId(v)}
            data={wheels.map((w) => ({
              value: w.identity.id,
              label: `${w.identity.serialNumber} - 健康度 ${w.currentHealthScore}%`,
            }))}
            style={{ width: 400 }}
            searchable
            placeholder="搜索车轮编号..."
          />
        </Group>
      </Card>

      {selectedPrediction && selectedWheel && (
        <>
          <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <ThemeIcon size="md" radius="md" color="green" variant="light">
                    <IconHeartbeat size={16} />
                  </ThemeIcon>
                </Group>
                <Center>
                  <RingProgress
                    size={100}
                    thickness={10}
                    sections={[{
                      value: selectedPrediction.currentHealthScore,
                      color: selectedPrediction.currentHealthScore > 60 ? '#40c057' : selectedPrediction.currentHealthScore > 40 ? '#fab005' : '#ff6b6b'
                    }]}
                    label={
                      <Center>
                        <Text fw={700} size="lg" c={selectedPrediction.currentHealthScore > 60 ? 'green' : selectedPrediction.currentHealthScore > 40 ? 'yellow' : 'red'}>
                          {selectedPrediction.currentHealthScore}%
                        </Text>
                      </Center>
                    }
                  />
                </Center>
                <Text ta="center" size="xs" c="dimmed">当前健康度</Text>
              </Stack>
            </Card>

            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <ThemeIcon size="md" radius="md" color="cyan" variant="light">
                    <IconClock size={16} />
                  </ThemeIcon>
                  <Badge
                    color={selectedPrediction.predictedRemainingCycles < 50000 ? 'red' : selectedPrediction.predictedRemainingCycles < 200000 ? 'orange' : 'green'}
                    variant="light"
                    size="xs"
                  >
                    {selectedPrediction.predictedRemainingCycles < 50000 ? '紧急' : selectedPrediction.predictedRemainingCycles < 200000 ? '注意' : '充足'}
                  </Badge>
                </Group>
                <Box>
                  <Text size="xs" c="dimmed">预计剩余循环</Text>
                  <Text fw={700} size="xl">{(selectedPrediction.predictedRemainingCycles / 10000).toFixed(1)}万</Text>
                </Box>
                <Text size="xs" c="dimmed">
                  置信区间: {(selectedPrediction.confidenceInterval.lower / 10000).toFixed(0)}万 - {(selectedPrediction.confidenceInterval.upper / 10000).toFixed(0)}万次
                </Text>
              </Stack>
            </Card>

            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <ThemeIcon size="md" radius="md" color="orange" variant="light">
                    <IconRoute size={16} />
                  </ThemeIcon>
                </Group>
                <Box>
                  <Text size="xs" c="dimmed">预计剩余里程</Text>
                  <Text fw={700} size="xl">{selectedPrediction.predictedRemainingMileage.toLocaleString()} km</Text>
                </Box>
                <Text size="xs" c="dimmed">
                  约 {Math.floor(selectedPrediction.predictedRemainingMileage / 500)} 天
                </Text>
              </Stack>
            </Card>

            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <ThemeIcon size="md" radius="md" color="violet" variant="light">
                    <IconCalendar size={16} />
                  </ThemeIcon>
                </Group>
                <Box>
                  <Text size="xs" c="dimmed">预计寿命终止</Text>
                  <Text fw={700} size="xl" c={selectedPrediction.predictedEndOfLifeDate < Date.now() + 30 * 24 * 60 * 60 * 1000 ? 'red' : 'dark'}>
                    {new Date(selectedPrediction.predictedEndOfLifeDate).toLocaleDateString('zh-CN')}
                  </Text>
                </Box>
                <Text size="xs" c="dimmed">
                  {Math.max(0, Math.floor((selectedPrediction.predictedEndOfLifeDate - Date.now()) / (24 * 60 * 60 * 1000)))} 天后
                </Text>
              </Stack>
            </Card>
          </SimpleGrid>

          <Card shadow="sm" p="md" radius="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                    <IconTrendingDown size={20} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">健康度衰减预测曲线</Text>
                </Group>
                <Group gap="xs">
                  <Badge size="xs" color="gray" variant="light">95% 置信区间</Badge>
                </Group>
              </Group>

              <Box style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="healthPredGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#339af0" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#339af0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                    <XAxis dataKey="cycles" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area
                      type="monotone"
                      dataKey="upper"
                      stroke="transparent"
                      fill="transparent"
                      name="上限"
                    />
                    <Area
                      type="monotone"
                      dataKey="lower"
                      stroke="transparent"
                      fill="url(#healthPredGradient)"
                      name="下限"
                    />
                    <Line
                      type="monotone"
                      dataKey="health"
                      stroke="#339af0"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#339af0' }}
                      name="预测健康度"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>

              <SimpleGrid cols={{ base: 1, md: 4 }} spacing="sm">
                {Object.entries(RISK_COLORS).map(([level, color]) => (
                  <Group key={level} gap="xs">
                    <Box w={12} h={12} bg={color} style={{ borderRadius: 4 }} />
                    <Text size="xs">{RISK_LABELS[level as LifePredictionPoint['riskLevel']]}</Text>
                  </Group>
                ))}
              </SimpleGrid>
            </Stack>
          </Card>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                    <IconBulb size={20} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">关键影响因素</Text>
                </Group>
                <Stack gap="sm">
                  {selectedPrediction.keyFactors.map((factor, idx) => (
                    <Paper key={idx} p="sm" radius="md" withBorder>
                      <Stack gap={4}>
                        <Group justify="space-between">
                          <Text fw={600} size="sm">{factor.factor}</Text>
                          <Badge
                            color={factor.impact > 1.5 ? 'red' : factor.impact > 1.0 ? 'orange' : 'green'}
                            variant="light"
                            size="xs"
                          >
                            影响系数: {factor.impact.toFixed(2)}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed">{factor.description}</Text>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            </Card>

            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon size="lg" radius="md" color="green" variant="light">
                    <IconCircleCheck size={20} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">维护建议</Text>
                </Group>
                <Stack gap="sm">
                  {selectedPrediction.recommendations.map((rec, idx) => (
                    <Group key={idx} gap="sm" align="flex-start">
                      <ThemeIcon size="sm" radius="md" color="green" variant="light" mt={2}>
                        <IconCircleCheck size={14} />
                      </ThemeIcon>
                      <Text size="sm">{rec}</Text>
                    </Group>
                  ))}
                </Stack>
              </Stack>
            </Card>
          </SimpleGrid>

          {allWarnings.length > 0 && (
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Group gap="xs">
                    <ThemeIcon size="lg" radius="md" color="red" variant="light">
                      <IconAlertTriangle size={20} />
                    </ThemeIcon>
                    <Text fw={600} size="sm">预警信息</Text>
                  </Group>
                  <Chip
                    checked={showAcknowledged}
                    onClick={() => setShowAcknowledged(!showAcknowledged)}
                    size="xs"
                  >
                    显示已确认
                  </Chip>
                </Group>

                <ScrollArea h={250} type="hover">
                  <Stack gap="sm">
                    {allWarnings.sort((a, b) => {
                      const levelOrder = { critical: 0, warning: 1, info: 2 };
                      return levelOrder[a.level] - levelOrder[b.level];
                    }).map((warning) => (
                      <Alert
                        key={warning.id}
                        color={warning.level === 'critical' ? 'red' : warning.level === 'warning' ? 'orange' : 'blue'}
                        icon={<IconAlertTriangle size={16} />}
                        title={`${WARNING_TYPE_LABELS[warning.type]} - ${warning.level === 'critical' ? '紧急' : warning.level === 'warning' ? '警告' : '提示'}`}
                        withCloseButton={false}
                      >
                        <Stack gap={4}>
                          <Text size="sm">{warning.message}</Text>
                          <Group gap="xs">
                            <Text size="xs" c="dimmed">
                              触发时间: {new Date(warning.triggeredAt).toLocaleString('zh-CN')}
                            </Text>
                            {warning.acknowledged && (
                              <Badge size="xs" variant="light" color="gray">
                                已确认: {warning.acknowledgedBy}
                              </Badge>
                            )}
                          </Group>
                        </Stack>
                      </Alert>
                    ))}
                  </Stack>
                </ScrollArea>
              </Stack>
            </Card>
          )}
        </>
      )}

      <Card shadow="sm" p="md" radius="md" withBorder>
        <Stack gap="md">
          <Group gap="xs">
            <ThemeIcon size="lg" radius="md" color="violet" variant="light">
              <IconHeartbeat size={20} />
            </ThemeIcon>
            <Text fw={600} size="sm">整车队健康度风险分布</Text>
          </Group>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Box style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={predictions.slice(0, 10).map((p, idx) => ({
                  name: `车轮${idx + 1}`,
                  current: p.currentHealthScore,
                  predicted30: Math.max(0, p.currentHealthScore - (100 - p.currentHealthScore) * 0.2),
                  predicted90: Math.max(0, p.currentHealthScore - (100 - p.currentHealthScore) * 0.5),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="current" name="当前健康度" fill="#339af0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="predicted30" name="30天后预测" fill="#fab005" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="predicted90" name="90天后预测" fill="#ff6b6b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Box style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedPrediction?.predictionCurve.slice(0, 10).map((p) => ({
                  cycles: (p.cycles / 10000).toFixed(0) + '万',
                  health: p.predictedHealthScore,
                  risk: p.riskLevel === 'critical' ? 100 : p.riskLevel === 'high' ? 75 : p.riskLevel === 'medium' ? 50 : 25,
                })) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                  <XAxis dataKey="cycles" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="health"
                    name="健康度"
                    stroke="#339af0"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="risk"
                    name="风险等级"
                    stroke="#ff6b6b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </SimpleGrid>
        </Stack>
      </Card>

      <Card shadow="sm" p="md" radius="md" withBorder>
        <Stack gap="md">
          <Group gap="xs">
            <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
              <IconRefresh size={20} />
            </ThemeIcon>
            <Text fw={600} size="sm">批量寿命预测概览</Text>
          </Group>
          <ScrollArea h={300} type="hover">
            <Table withTableBorder withColumnBorders striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>车轮编号</Table.Th>
                  <Table.Th>当前健康度</Table.Th>
                  <Table.Th>剩余循环</Table.Th>
                  <Table.Th>剩余里程</Table.Th>
                  <Table.Th>预计报废日期</Table.Th>
                  <Table.Th>风险等级</Table.Th>
                  <Table.Th>预警数</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {predictions.map((pred) => {
                  const wheel = wheels.find((w) => w.identity.id === pred.wheelId);
                  const lastPoint = pred.predictionCurve[0];
                  return (
                    <Table.Tr key={pred.wheelId}>
                      <Table.Td>
                        <Text size="xs" fw={600}>{wheel?.identity.serialNumber}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <Progress
                            value={pred.currentHealthScore}
                            color={pred.currentHealthScore > 60 ? 'green' : pred.currentHealthScore > 40 ? 'yellow' : 'red'}
                            size="sm"
                            style={{ width: 60 }}
                          />
                          <Text size="xs" fw={600}>{pred.currentHealthScore}%</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs">{(pred.predictedRemainingCycles / 10000).toFixed(1)}万</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs">{pred.predictedRemainingMileage.toLocaleString()} km</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c={pred.predictedEndOfLifeDate < Date.now() + 90 * 24 * 60 * 60 * 1000 ? 'red' : 'dark'}>
                          {new Date(pred.predictedEndOfLifeDate).toLocaleDateString('zh-CN')}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={RISK_COLORS[lastPoint?.riskLevel || 'low'] as any}
                          variant="filled"
                          size="xs"
                        >
                          {RISK_LABELS[lastPoint?.riskLevel || 'low']}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {pred.warnings.length > 0 ? (
                          <Badge color={pred.warnings.some((w) => w.level === 'critical') ? 'red' : 'orange'} size="xs">
                            {pred.warnings.length} 条
                          </Badge>
                        ) : (
                          <Text size="xs" c="dimmed">无</Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Stack>
      </Card>
    </Stack>
  );
};

export default LifePredictionPanel;
