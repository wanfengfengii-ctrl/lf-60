import React, { useState, useMemo } from 'react';
import {
  Paper,
  Text,
  Stack,
  Group,
  Badge,
  Box,
  ThemeIcon,
  Table,
  Divider,
  ScrollArea,
  SimpleGrid,
  Card,
  Chip,
  Select,
  Center,
  Modal,
  Pagination,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAlertTriangle,
  IconSearch,
  IconFilter,
  IconCalendar,
  IconTool,
  IconCurrencyDollar,
  IconClock,
  IconMapPin,
  IconCloud,
  IconUser,
  IconChartBar,
  IconTrendingUp,
  IconFileText,
  IconRoute,
} from '@tabler/icons-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  FaultRecord,
  FaultPatternAnalysis,
  FaultSeverity,
  FaultType,
} from '../types';

interface HistoricalFaultArchiveProps {
  faults: FaultRecord[];
  patterns: FaultPatternAnalysis[];
}

const FAULT_TYPE_LABELS: Record<FaultType, string> = {
  spoke_crack: '轮辐裂纹',
  hub_looseness: '轮毂松动',
  rim_deformation: '轮辋变形',
};

const FAULT_SEVERITY_COLORS: Record<FaultSeverity, string> = {
  none: 'gray',
  mild: 'green',
  moderate: 'yellow',
  severe: 'orange',
  critical: 'red',
};

const FAULT_SEVERITY_LABELS: Record<FaultSeverity, string> = {
  none: '无故障',
  mild: '轻微',
  moderate: '中等',
  severe: '严重',
  critical: '危急',
};

const HistoricalFaultArchive: React.FC<HistoricalFaultArchiveProps> = ({ faults, patterns }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [repairedFilter, setRepairedFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedFault, setSelectedFault] = useState<FaultRecord | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const pageSize = 8;

  const filteredFaults = useMemo(() => {
    return faults.filter((f) => {
      if (searchQuery && !f.description.includes(searchQuery) && !f.wheelId.includes(searchQuery)) {
        return false;
      }
      if (typeFilter && f.faultType !== typeFilter) return false;
      if (severityFilter && f.severity !== severityFilter) return false;
      if (repairedFilter === 'repaired' && !f.repairedAt) return false;
      if (repairedFilter === 'unrepaired' && f.repairedAt) return false;
      return true;
    }).sort((a, b) => b.detectedAt - a.detectedAt);
  }, [faults, searchQuery, typeFilter, severityFilter, repairedFilter]);

  const paginatedFaults = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredFaults.slice(start, start + pageSize);
  }, [filteredFaults, page]);

  const totalPages = Math.ceil(filteredFaults.length / pageSize);

  const stats = useMemo(() => {
    const total = faults.length;
    const repaired = faults.filter((f) => f.repairedAt).length;
    const unrepaired = total - repaired;
    const criticalCount = faults.filter((f) => f.severity === 'critical').length;
    const severeCount = faults.filter((f) => f.severity === 'severe').length;
    const totalCost = faults.reduce((sum, f) => sum + f.repairCost, 0);
    const totalDowntime = faults.reduce((sum, f) => sum + f.downtimeHours, 0);
    const avgRepairCost = repaired > 0 ? totalCost / repaired : 0;

    return { total, repaired, unrepaired, criticalCount, severeCount, totalCost, totalDowntime, avgRepairCost };
  }, [faults]);

  const typeDistributionData = useMemo(() => {
    const map = new Map<FaultType, number>();
    faults.forEach((f) => {
      map.set(f.faultType, (map.get(f.faultType) || 0) + 1);
    });
    return Array.from(map.entries()).map(([type, count]) => ({
      name: FAULT_TYPE_LABELS[type],
      value: count,
      color: type === 'spoke_crack' ? '#ff6b6b' : type === 'hub_looseness' ? '#fab005' : '#339af0',
    }));
  }, [faults]);

  const monthlyTrendData = useMemo(() => {
    const map = new Map<string, number>();
    faults.forEach((f) => {
      const date = new Date(f.detectedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, count }));
  }, [faults]);

  const openFaultDetail = (fault: FaultRecord) => {
    setSelectedFault(fault);
    open();
  };

  if (faults.length === 0) {
    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Center py="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="md" color="gray" variant="light">
              <IconFileText size={32} />
            </ThemeIcon>
            <Text c="dimmed" ta="center">暂无故障档案数据</Text>
            <Text size="xs" c="dimmed" ta="center">请先生成车队数据以查看历史故障记录</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <ThemeIcon size="md" radius="md" color="blue" variant="light">
                <IconAlertTriangle size={16} />
              </ThemeIcon>
              <Badge color="blue" variant="light">{stats.total} 条</Badge>
            </Group>
            <Box>
              <Text size="xs" c="dimmed">故障总数</Text>
              <Text fw={700} size="xl">{stats.total}</Text>
            </Box>
            <Group gap="xs" mt="xs">
              <Badge color="green" size="xs">已修复 {stats.repaired}</Badge>
              <Badge color="orange" size="xs">待修复 {stats.unrepaired}</Badge>
            </Group>
          </Stack>
        </Card>

        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <ThemeIcon size="md" radius="md" color="red" variant="light">
                <IconAlertTriangle size={16} />
              </ThemeIcon>
              <Badge color="red" variant="filled">{stats.criticalCount} 项</Badge>
            </Group>
            <Box>
              <Text size="xs" c="dimmed">危急故障</Text>
              <Text fw={700} size="xl" c="red">{stats.criticalCount}</Text>
            </Box>
            <Text size="xs" c="dimmed">严重故障: {stats.severeCount} 项</Text>
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
              <Text size="xs" c="dimmed">累计维修成本</Text>
              <Text fw={700} size="xl" c="orange">¥{stats.totalCost.toLocaleString()}</Text>
            </Box>
            <Text size="xs" c="dimmed">平均单次: ¥{stats.avgRepairCost.toFixed(0)}</Text>
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
              <Text size="xs" c="dimmed">累计停机时间</Text>
              <Text fw={700} size="xl" c="violet">{stats.totalDowntime.toLocaleString()} h</Text>
            </Box>
            <Text size="xs" c="dimmed">约 {Math.floor(stats.totalDowntime / 24)} 天</Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <Card shadow="sm" p="md" radius="md" withBorder>
        <Stack gap="md">
          <Group gap="xs">
            <ThemeIcon size="lg" radius="md" color="blue" variant="light">
              <IconFilter size={20} />
            </ThemeIcon>
            <Text fw={600} size="sm">筛选条件</Text>
          </Group>
          <SimpleGrid cols={{ base: 1, md: 5 }} spacing="sm">
            <div style={{ position: 'relative' }}>
              <IconSearch size={16} style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', color: '#868e96' }} />
              <input
                type="text"
                placeholder="搜索故障描述..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid #ced4da', fontSize: 14 }}
              />
            </div>
            <Select
              placeholder="故障类型"
              value={typeFilter}
              onChange={(v) => { setTypeFilter(v); setPage(1); }}
              clearable
              data={[
                { value: 'spoke_crack', label: '轮辐裂纹' },
                { value: 'hub_looseness', label: '轮毂松动' },
                { value: 'rim_deformation', label: '轮辋变形' },
              ]}
            />
            <Select
              placeholder="严重程度"
              value={severityFilter}
              onChange={(v) => { setSeverityFilter(v); setPage(1); }}
              clearable
              data={[
                { value: 'mild', label: '轻微' },
                { value: 'moderate', label: '中等' },
                { value: 'severe', label: '严重' },
                { value: 'critical', label: '危急' },
              ]}
            />
            <Select
              placeholder="修复状态"
              value={repairedFilter}
              onChange={(v) => { setRepairedFilter(v); setPage(1); }}
              clearable
              data={[
                { value: 'repaired', label: '已修复' },
                { value: 'unrepaired', label: '待修复' },
              ]}
            />
            <Chip
              checked={!searchQuery && !typeFilter && !severityFilter && !repairedFilter}
              onClick={() => { setSearchQuery(''); setTypeFilter(null); setSeverityFilter(null); setRepairedFilter(null); setPage(1); }}
            >
              重置筛选
            </Chip>
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
              <Text fw={600} size="sm">故障类型分布</Text>
            </Group>
            <Box style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {typeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
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
              <Text fw={600} size="sm">月度故障趋势</Text>
            </Group>
            <Box style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="故障数"
                    stroke="#ff6b6b"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#ff6b6b' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Stack>
        </Card>
      </SimpleGrid>

      {patterns.length > 0 && (
        <Card shadow="sm" p="md" radius="md" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <ThemeIcon size="lg" radius="md" color="violet" variant="light">
                <IconTrendingUp size={20} />
              </ThemeIcon>
              <Text fw={600} size="sm">故障模式分析</Text>
            </Group>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
              {patterns.map((pattern) => (
                <Card key={pattern.faultType} p="sm" radius="md" withBorder style={{ borderLeft: `4px solid ${pattern.faultType === 'spoke_crack' ? '#ff6b6b' : pattern.faultType === 'hub_looseness' ? '#fab005' : '#339af0'}` }}>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text fw={700} size="sm">{FAULT_TYPE_LABELS[pattern.faultType]}</Text>
                      <Badge color={FAULT_SEVERITY_COLORS[pattern.mostCommonSeverity] as any} variant="light" size="xs">
                        最常见: {FAULT_SEVERITY_LABELS[pattern.mostCommonSeverity]}
                      </Badge>
                    </Group>
                    <SimpleGrid cols={2} spacing="xs">
                      <Box>
                        <Text size="xs" c="dimmed">总次数</Text>
                        <Text fw={700}>{pattern.totalCount}</Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed">平均修复费用</Text>
                        <Text fw={700} c="orange">¥{pattern.averageRepairCost.toFixed(0)}</Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed">平均停机</Text>
                        <Text fw={700}>{pattern.averageDowntime.toFixed(1)}h</Text>
                      </Box>
                    </SimpleGrid>
                    <Divider />
                    <Text size="xs" fw={500} c="dimmed">高风险里程区间:</Text>
                    <Group gap="xs" wrap="wrap">
                      {pattern.highRiskPeriods.filter((p) => p.count > 0).map((period, idx) => (
                        <Badge key={idx} size="xs" variant="light" color="orange">
                          {period.startMileage.toLocaleString()}-{period.endMileage.toLocaleString()} km ({period.count}次)
                        </Badge>
                      ))}
                    </Group>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Card>
      )}

      <Card shadow="sm" p="md" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                <IconFileText size={20} />
              </ThemeIcon>
              <Text fw={600} size="sm">故障记录列表</Text>
            </Group>
            <Text size="xs" c="dimmed">共 {filteredFaults.length} 条记录</Text>
          </Group>

          <ScrollArea h={450} type="hover">
            <Table withTableBorder withColumnBorders striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>检测日期</Table.Th>
                  <Table.Th>故障类型</Table.Th>
                  <Table.Th>严重程度</Table.Th>
                  <Table.Th>故障描述</Table.Th>
                  <Table.Th>发生里程</Table.Th>
                  <Table.Th>修复费用</Table.Th>
                  <Table.Th>状态</Table.Th>
                  <Table.Th w={80}>操作</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedFaults.map((fault) => (
                  <Table.Tr key={fault.id}>
                    <Table.Td>
                      <Text size="xs">{new Date(fault.detectedAt).toLocaleDateString('zh-CN')}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={fault.faultType === 'spoke_crack' ? 'red' : fault.faultType === 'hub_looseness' ? 'yellow' : 'blue'} variant="light" size="xs">
                        {FAULT_TYPE_LABELS[fault.faultType]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={FAULT_SEVERITY_COLORS[fault.severity] as any} variant="filled" size="xs">
                        {FAULT_SEVERITY_LABELS[fault.severity]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" lineClamp={1}>{fault.description}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{fault.mileageAtFault.toLocaleString()} km</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" fw={600} c="orange">¥{fault.repairCost.toLocaleString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      {fault.repairedAt ? (
                        <Badge color="green" size="xs">已修复</Badge>
                      ) : (
                        <Badge color="orange" size="xs">待修复</Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Chip size="xs" onClick={() => openFaultDetail(fault)}>详情</Chip>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>

          <Group justify="center">
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              boundaries={1}
              siblings={1}
            />
          </Group>
        </Stack>
      </Card>

      <Modal
        opened={opened}
        onClose={close}
        title="故障详情"
        size="lg"
      >
        {selectedFault && (
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                <Badge color={FAULT_SEVERITY_COLORS[selectedFault.severity] as any} variant="filled">
                  {FAULT_SEVERITY_LABELS[selectedFault.severity]}
                </Badge>
                <Badge color={selectedFault.faultType === 'spoke_crack' ? 'red' : selectedFault.faultType === 'hub_looseness' ? 'yellow' : 'blue'} variant="light">
                  {FAULT_TYPE_LABELS[selectedFault.faultType]}
                </Badge>
                {selectedFault.repairedAt ? (
                  <Badge color="green">已修复</Badge>
                ) : (
                  <Badge color="orange">待修复</Badge>
                )}
              </Group>
            </Group>

            <Card p="sm" radius="md" withBorder>
              <Stack gap="sm">
                <Text fw={600} size="lg">{selectedFault.description}</Text>
                <Divider />
                <SimpleGrid cols={2} spacing="sm">
                  <Group gap="xs">
                    <IconCalendar size={14} color="dimmed" />
                    <Box>
                      <Text size="xs" c="dimmed">检测日期</Text>
                      <Text size="sm" fw={600}>{new Date(selectedFault.detectedAt).toLocaleString('zh-CN')}</Text>
                    </Box>
                  </Group>
                  {selectedFault.repairedAt && (
                    <Group gap="xs">
                      <IconTool size={14} color="dimmed" />
                      <Box>
                        <Text size="xs" c="dimmed">修复日期</Text>
                        <Text size="sm" fw={600}>{new Date(selectedFault.repairedAt).toLocaleString('zh-CN')}</Text>
                      </Box>
                    </Group>
                  )}
                  <Group gap="xs">
                    <IconRoute size={14} color="dimmed" />
                    <Box>
                      <Text size="xs" c="dimmed">发生里程</Text>
                      <Text size="sm" fw={600}>{selectedFault.mileageAtFault.toLocaleString()} km</Text>
                    </Box>
                  </Group>
                  <Group gap="xs">
                    <IconClock size={14} color="dimmed" />
                    <Box>
                      <Text size="xs" c="dimmed">停机时间</Text>
                      <Text size="sm" fw={600}>{selectedFault.downtimeHours} 小时</Text>
                    </Box>
                  </Group>
                  <Group gap="xs">
                    <IconCurrencyDollar size={14} color="dimmed" />
                    <Box>
                      <Text size="xs" c="dimmed">修复费用</Text>
                      <Text size="sm" fw={600} c="orange">¥{selectedFault.repairCost.toLocaleString()}</Text>
                    </Box>
                  </Group>
                  <Group gap="xs">
                    <IconMapPin size={14} color="dimmed" />
                    <Box>
                      <Text size="xs" c="dimmed">路况</Text>
                      <Text size="sm" fw={600}>{selectedFault.roadCondition}</Text>
                    </Box>
                  </Group>
                </SimpleGrid>

                {selectedFault.weatherCondition && (
                  <Group gap="xs">
                    <IconCloud size={14} color="dimmed" />
                    <Text size="xs" c="dimmed">天气:</Text>
                    <Text size="sm">{selectedFault.weatherCondition}</Text>
                  </Group>
                )}

                {selectedFault.rootCause && (
                  <>
                    <Divider />
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed" fw={500}>根本原因分析</Text>
                      <Text size="sm">{selectedFault.rootCause}</Text>
                    </Stack>
                  </>
                )}

                {selectedFault.repairAction && (
                  <>
                    <Divider />
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed" fw={500}>修复措施</Text>
                      <Text size="sm">{selectedFault.repairAction}</Text>
                    </Stack>
                  </>
                )}

                {selectedFault.operatorNotes && (
                  <>
                    <Divider />
                    <Stack gap={4}>
                      <Group gap="xs">
                        <IconUser size={14} color="dimmed" />
                        <Text size="xs" c="dimmed" fw={500}>操作员备注</Text>
                      </Group>
                      <Text size="sm" c="dimmed">{selectedFault.operatorNotes}</Text>
                    </Stack>
                  </>
                )}
              </Stack>
            </Card>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
};

export default HistoricalFaultArchive;
