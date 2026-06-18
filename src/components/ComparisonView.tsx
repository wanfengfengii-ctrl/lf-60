import React, { useState, useMemo } from 'react';
import { Paper, Title, Stack, Text, Group, Badge, Table, Checkbox, SimpleGrid, Card, Divider, Box, ScrollArea, ThemeIcon } from '@mantine/core';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { SavedScheme, FORCE_THRESHOLD, ComparisonItem } from '../types';
import { IconArrowsLeftRight, IconChartBar, IconCheck } from '@tabler/icons-react';

interface ComparisonViewProps {
  schemes: SavedScheme[];
}

const SCHEME_COLORS = ['#228be6', '#40c057', '#fab005', '#fd7e14', '#be4bdb'];

const buildComparisonItem = (scheme: SavedScheme): ComparisonItem => {
  const result = scheme.result;
  const maxStress = Math.max(...result.spokeData.map((s) => s.stress));
  const estimatedLife = result.fatigueAnalysis.minCycleLife;
  return {
    schemeId: scheme.id,
    schemeName: scheme.name,
    maxForce: result.maxForce,
    averageForce: result.averageForce,
    maxStress,
    totalDamage: result.fatigueAnalysis.totalDamage,
    estimatedLife,
    safetyFactor: result.fatigueAnalysis.safetyFactor,
    failureProbability: result.fatigueAnalysis.failureProbability,
    materialName: result.material.name,
    roadConditionName: result.roadCondition.name,
    exceededCount: result.spokeData.filter((s) => s.exceedsThreshold).length,
  };
};

const getDamageColor = (damage: number): string => {
  if (damage < 0.3) return 'green';
  if (damage < 0.7) return 'yellow';
  if (damage < 1.0) return 'orange';
  return 'red';
};

const getSafetyColor = (factor: number): string => {
  if (factor >= 2.0) return 'green';
  if (factor >= 1.5) return 'lime';
  if (factor >= 1.0) return 'yellow';
  return 'red';
};

const ComparisonView: React.FC<ComparisonViewProps> = ({ schemes }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleScheme = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((s) => s !== id);
      }
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const selectedSchemes = useMemo(
    () => schemes.filter((s) => selectedIds.includes(s.id)),
    [schemes, selectedIds]
  );

  const comparisonItems = useMemo(
    () => selectedSchemes.map(buildComparisonItem),
    [selectedSchemes]
  );

  const radarData = useMemo(() => {
    if (comparisonItems.length < 2) return [];
    const metrics = ['maxForce', 'avgForce', 'totalDamage', 'failureProbability', 'safetyFactor'] as const;
    const labels: Record<string, string> = {
      maxForce: '最大受力',
      avgForce: '平均受力',
      totalDamage: '累积损伤',
      failureProbability: '失效概率',
      safetyFactor: '安全系数',
    };
    return metrics.map((metric) => {
      const entry: Record<string, string | number> = { metric: labels[metric] };
      comparisonItems.forEach((item) => {
        let raw: number;
        switch (metric) {
          case 'maxForce':
            raw = item.maxForce / FORCE_THRESHOLD * 100;
            break;
          case 'avgForce':
            raw = item.averageForce / FORCE_THRESHOLD * 100;
            break;
          case 'totalDamage':
            raw = item.totalDamage * 100;
            break;
          case 'failureProbability':
            raw = item.failureProbability * 100;
            break;
          case 'safetyFactor':
            raw = Math.max(0, (2 - item.safetyFactor) * 50);
            break;
          default:
            raw = 0;
        }
        entry[item.schemeName] = Math.min(100, Math.max(0, raw));
      });
      return entry;
    });
  }, [comparisonItems]);

  const barData = useMemo(() => {
    if (comparisonItems.length < 2) return [];
    return comparisonItems.map((item) => ({
      name: item.schemeName.length > 6 ? item.schemeName.slice(0, 6) + '…' : item.schemeName,
      maxForce: item.maxForce,
    }));
  }, [comparisonItems]);

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon size="lg" variant="light" color="violet">
              <IconArrowsLeftRight size={20} />
            </ThemeIcon>
            <Title order={4}>方案对比</Title>
          </Group>
          <Badge color="violet" variant="light">
            已选 {selectedIds.length}/5
          </Badge>
        </Group>

        <Divider />

        {schemes.length === 0 ? (
          <Text c="dimmed" ta="center" py="lg">
            暂无可对比的方案，请先保存方案
          </Text>
        ) : (
          <ScrollArea h={180} type="hover">
            <Stack gap="xs">
              {schemes.map((scheme) => {
                const isSelected = selectedIds.includes(scheme.id);
                const isDisabled = !isSelected && selectedIds.length >= 5;
                return (
                  <Card
                    key={scheme.id}
                    p="xs"
                    withBorder
                    style={{
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.5 : 1,
                      borderColor: isSelected ? SCHEME_COLORS[selectedIds.indexOf(scheme.id)] : undefined,
                      borderWidth: isSelected ? 2 : 1,
                    }}
                    onClick={() => !isDisabled && toggleScheme(scheme.id)}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="xs" wrap="nowrap">
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => toggleScheme(scheme.id)}
                          onClick={(e) => e.stopPropagation()}
                          color={isSelected ? SCHEME_COLORS[selectedIds.indexOf(scheme.id)] : undefined}
                        />
                        <Box>
                          <Text fw={500} size="sm">
                            {scheme.name}
                          </Text>
                          <Group gap="xs" mt={2} wrap="nowrap">
                            <Badge size="xs" color="blue" variant="light">
                              {scheme.result.material.name}
                            </Badge>
                            <Badge size="xs" color="orange" variant="light">
                              {scheme.result.roadCondition.name}
                            </Badge>
                            <Badge
                              size="xs"
                              color={scheme.result.maxForce > FORCE_THRESHOLD ? 'red' : 'green'}
                              variant="dot"
                            >
                              {scheme.result.maxForce > FORCE_THRESHOLD ? '超载' : '安全'}
                            </Badge>
                          </Group>
                        </Box>
                      </Group>
                      {isSelected && (
                        <ThemeIcon
                          size="sm"
                          color={SCHEME_COLORS[selectedIds.indexOf(scheme.id)]}
                          variant="light"
                          radius="xl"
                        >
                          <IconCheck size={12} />
                        </ThemeIcon>
                      )}
                    </Group>
                  </Card>
                );
              })}
            </Stack>
          </ScrollArea>
        )}

        {comparisonItems.length >= 2 && (
          <>
            <Divider label="对比数据" labelPosition="center" />

            <ScrollArea>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>方案名称</Table.Th>
                    <Table.Th>材料</Table.Th>
                    <Table.Th>路况</Table.Th>
                    <Table.Th>最大受力</Table.Th>
                    <Table.Th>平均受力</Table.Th>
                    <Table.Th>累积损伤</Table.Th>
                    <Table.Th>安全系数</Table.Th>
                    <Table.Th>失效概率</Table.Th>
                    <Table.Th>超载数</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {comparisonItems.map((item, idx) => (
                    <Table.Tr key={item.schemeId}>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <Box
                            w={10}
                            h={10}
                            style={{
                              borderRadius: '50%',
                              backgroundColor: SCHEME_COLORS[idx],
                            }}
                          />
                          <Text fw={500} size="sm">
                            {item.schemeName}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" color="blue" variant="light">
                          {item.materialName}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" color="orange" variant="light">
                          {item.roadConditionName}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          fw={600}
                          c={item.maxForce > FORCE_THRESHOLD ? 'red' : undefined}
                        >
                          {item.maxForce.toFixed(0)} N
                        </Text>
                      </Table.Td>
                      <Table.Td>{item.averageForce.toFixed(0)} N</Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          color={getDamageColor(item.totalDamage)}
                          variant="light"
                        >
                          {item.totalDamage.toFixed(4)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          color={getSafetyColor(item.safetyFactor)}
                          variant="light"
                        >
                          {item.safetyFactor.toFixed(2)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          c={item.failureProbability > 0.5 ? 'red' : item.failureProbability > 0.2 ? 'orange' : undefined}
                        >
                          {(item.failureProbability * 100).toFixed(1)}%
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {item.exceededCount > 0 ? (
                          <Badge size="sm" color="red" variant="filled">
                            {item.exceededCount}
                          </Badge>
                        ) : (
                          <Badge size="sm" color="green" variant="light">
                            0
                          </Badge>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Divider label="可视化对比" labelPosition="center" />

            <SimpleGrid cols={2} spacing="md">
              <Card withBorder p="md">
                <Group justify="center" mb="sm">
                  <Group gap="xs">
                    <IconChartBar size={16} />
                    <Text fw={600} size="sm">综合雷达图</Text>
                  </Group>
                </Group>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    {comparisonItems.map((item, idx) => (
                      <Radar
                        key={item.schemeId}
                        name={item.schemeName}
                        dataKey={item.schemeName}
                        stroke={SCHEME_COLORS[idx]}
                        fill={SCHEME_COLORS[idx]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend />
                    <RTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>

              <Card withBorder p="md">
                <Group justify="center" mb="sm">
                  <Group gap="xs">
                    <IconArrowsLeftRight size={16} />
                    <Text fw={600} size="sm">最大受力对比</Text>
                  </Group>
                </Group>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RTooltip />
                    <Legend />
                    <Bar dataKey="maxForce" name="最大受力 (N)" fill="#228be6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <Group justify="center" mt="xs">
                  <Text size="xs" c="dimmed">
                    阈值参考线: {FORCE_THRESHOLD.toLocaleString()} N
                  </Text>
                </Group>
              </Card>
            </SimpleGrid>
          </>
        )}

        {selectedIds.length === 1 && (
          <Text c="dimmed" ta="center" size="sm">
            请再选择至少一个方案进行对比
          </Text>
        )}
      </Stack>
    </Paper>
  );
};

export default ComparisonView;
