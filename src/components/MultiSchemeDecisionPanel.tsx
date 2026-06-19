import React, { useState, useMemo } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Grid,
  Card,
  Progress,
  ThemeIcon,
  Divider,
  ScrollArea,
  Button,
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
  LineChart,
  Line,
} from 'recharts';
import {
  IconChartBar,
  IconTrophy,
  IconTrendingUp,
  IconTrendingDown,
  IconAward,
} from '@tabler/icons-react';
import { MultiSchemeDecisionResult, StructuralOptimizationScheme } from '../types';

interface MultiSchemeDecisionPanelProps {
  decisionResult: MultiSchemeDecisionResult | null;
  onRunDecision: () => void;
  isRunning: boolean;
  schemes: StructuralOptimizationScheme[];
}

const GRADE_COLORS: Record<string, string> = {
  'S': 'grape',
  'A': 'green',
  'B': 'blue',
  'C': 'yellow',
  'D': 'red',
};

const GRADE_LABELS: Record<string, string> = {
  'S': '优秀',
  'A': '良好',
  'B': '中等',
  'C': '较差',
  'D': '不合格',
};

const CATEGORY_COLORS: Record<string, string> = {
  performance: 'blue',
  cost: 'orange',
  reliability: 'green',
  maintainability: 'yellow',
  strategic: 'purple',
};

const CATEGORY_LABELS: Record<string, string> = {
  performance: '性能',
  cost: '成本',
  reliability: '可靠性',
  maintainability: '可维护性',
  strategic: '战略',
};

const MultiSchemeDecisionPanel: React.FC<MultiSchemeDecisionPanelProps> = ({
  decisionResult,
  onRunDecision,
  isRunning,
  schemes: _schemes,
}) => {
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);

  const recommendedScheme = useMemo(() => {
    if (!decisionResult) return null;
    return decisionResult.schemes.find(
      (s) => s.id === decisionResult.recommendedSchemeId
    );
  }, [decisionResult]);

  const selectedScore = useMemo(() => {
    if (!decisionResult || !selectedSchemeId) return null;
    return decisionResult.scores.find((s) => s.schemeId === selectedSchemeId);
  }, [decisionResult, selectedSchemeId]);

  const radarData = useMemo(() => {
    if (!decisionResult || !selectedScore) return [];
    return selectedScore.criteriaScores.map((cs) => {
      const criteria = decisionResult.criteria.find((c) => c.id === cs.criteriaId);
      return {
        subject: cs.criteriaName,
        score: cs.normalizedScore,
        weight: criteria?.weight || 0,
        fullMark: 100,
      };
    });
  }, [decisionResult, selectedScore]);

  const comparisonData = useMemo(() => {
    if (!decisionResult) return [];
    return decisionResult.scores.map((score) => ({
      name: score.schemeName.length > 8 ? score.schemeName.slice(0, 8) + '...' : score.schemeName,
      综合评分: score.normalizedTotalScore,
      排名: score.rank,
    }));
  }, [decisionResult]);

  const sensitivityData = useMemo(() => {
    if (!decisionResult) return [];
    return decisionResult.sensitivityAnalysis.map((sa) => {
      const criteria = decisionResult.criteria.find((c) => c.id === sa.criteriaId);
      return {
        name: criteria?.name || sa.criteriaId,
        权重变化: sa.weightChange * 100,
        排名变化: sa.rankChange,
      };
    });
  }, [decisionResult]);

  if (!decisionResult) {
    return (
      <Stack gap="md">
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Stack align="center" gap="sm">
            <IconChartBar size={48} color="#adb5bd" />
            <Text c="dimmed" ta="center">
              暂无决策分析结果
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              请先生成结构优化方案，然后运行多准则决策分析
            </Text>
            <Button
              mt="md"
              color="grape"
              size="md"
              leftSection={<IconChartBar size={18} />}
              onClick={onRunDecision}
              loading={isRunning}
            >
              {isRunning ? '正在进行决策分析...' : '运行多准则决策分析'}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    );
  }

  const sortedScores = [...decisionResult.scores].sort((a, b) => a.rank - b.rank);

  return (
    <Stack gap="md">
      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <IconChartBar size={20} color="#845ef7" />
            <Title order={4}>多方案决策评分</Title>
          </Group>
          <Group gap="xs">
            <Badge color="grape" variant="light" size="lg">
              {decisionResult.schemes.length} 个方案 · {decisionResult.criteria.length} 项准则
            </Badge>
            <Button
              size="sm"
              variant="light"
              leftSection={<IconChartBar size={16} />}
              onClick={onRunDecision}
              loading={isRunning}
            >
              重新分析
            </Button>
          </Group>
        </Group>

        {recommendedScheme && (
          <Paper bg="grape.0" p="md" radius="md" mb="md">
            <Group justify="space-between" align="flex-start">
              <Group gap="xs">
                <ThemeIcon size="xl" radius="md" color="grape" variant="filled">
                  <IconTrophy size={24} />
                </ThemeIcon>
                <div>
                  <Group gap="xs" mb="xs">
                    <Text fw={700} size="lg" c="grape.9">
                      推荐方案: {recommendedScheme.name}
                    </Text>
                    {sortedScores[0] && (
                      <>
                        <Badge color={GRADE_COLORS[sortedScores[0].grade]} size="lg">
                          {sortedScores[0].grade} - {GRADE_LABELS[sortedScores[0].grade]}
                        </Badge>
                        <Badge color="grape" size="lg" variant="filled">
                          第 {sortedScores[0].rank} 名
                        </Badge>
                      </>
                    )}
                  </Group>
                  <Text size="sm" c="grape.8">
                    {recommendedScheme.description}
                  </Text>
                  {sortedScores[0] && (
                    <Group mt="xs" gap="md">
                      <Text size="sm" fw={600} c="grape.9">
                        综合得分: {sortedScores[0].normalizedTotalScore.toFixed(1)} 分
                      </Text>
                      <Text size="sm" c="grape.8">
                        满分 100 分
                      </Text>
                    </Group>
                  )}
                </div>
              </Group>
              {sortedScores[0] && (
                <Stack gap={4} align="flex-end">
                  {sortedScores[0].strengths.slice(0, 3).map((s, idx) => (
                    <Badge key={idx} color="green" size="sm" leftSection={<IconTrendingUp size={12} />}>
                      {s}
                    </Badge>
                  ))}
                </Stack>
              )}
            </Group>
          </Paper>
        )}

        <Title order={5} mb="xs">方案综合排名</Title>
        <ScrollArea h={200} type="auto" mb="md">
          <Grid gutter="md">
            {sortedScores.map((score, index) => {
              const scheme = decisionResult.schemes.find((s) => s.id === score.schemeId);
              const isSelected = selectedSchemeId === score.schemeId;
              return (
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={score.schemeId}>
                  <Card
                    shadow="sm"
                    p="md"
                    radius="md"
                    withBorder
                    style={{
                      borderColor: isSelected ? '#845ef7' : index === 0 ? '#845ef7' : '#e5e7eb',
                      background: isSelected ? '#f3f0ff' : index === 0 ? '#f3f0ff' : 'white',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedSchemeId(score.schemeId)}
                  >
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <ThemeIcon
                          size="lg"
                          radius="md"
                          color={index === 0 ? 'grape' : index === 1 ? 'gray' : index === 2 ? 'orange' : 'gray'}
                          variant="filled"
                        >
                          <Text size="sm" fw={700}>{score.rank}</Text>
                        </ThemeIcon>
                        <div>
                          <Text fw={600} size="sm">{score.schemeName}</Text>
                          <Text size="xs" c="dimmed">
                            {scheme?.type === 'material' ? '材料优化' :
                             scheme?.type === 'geometry' ? '几何优化' :
                             scheme?.type === 'structural' ? '结构优化' :
                             scheme?.type === 'comprehensive' ? '综合优化' : '工艺优化'}
                          </Text>
                        </div>
                      </Group>
                      <Stack gap={4} align="flex-end">
                        <Badge color={GRADE_COLORS[score.grade]} size="lg" variant="filled">
                          {score.grade}
                        </Badge>
                        <Text fw={700} size="lg">
                          {score.normalizedTotalScore.toFixed(1)}
                        </Text>
                      </Stack>
                    </Group>

                    <Progress
                      value={score.normalizedTotalScore}
                      color={GRADE_COLORS[score.grade]}
                      size="sm"
                      mb="xs"
                    />

                    <Grid gutter={4}>
                      {score.criteriaScores.slice(0, 4).map((cs) => {
                        return (
                          <Grid.Col span={6} key={cs.criteriaId}>
                            <Group justify="space-between">
                              <Text size="xs" c="dimmed">{cs.criteriaName}</Text>
                              <Text size="xs" fw={600}>{cs.normalizedScore.toFixed(0)}</Text>
                            </Group>
                          </Grid.Col>
                        );
                      })}
                    </Grid>

                    {score.strengths.length > 0 && (
                      <Group gap={4} mt="xs" wrap="wrap">
                        {score.strengths.slice(0, 2).map((s, idx) => (
                          <Badge key={idx} size="xs" color="green" variant="light">
                            {s}
                          </Badge>
                        ))}
                      </Group>
                    )}

                    {score.weaknesses.length > 0 && (
                      <Group gap={4} mt="xs" wrap="wrap">
                        {score.weaknesses.slice(0, 2).map((w, idx) => (
                          <Badge key={idx} size="xs" color="red" variant="light">
                            {w}
                          </Badge>
                        ))}
                      </Group>
                    )}
                  </Card>
                </Grid.Col>
              );
            })}
          </Grid>
        </ScrollArea>

        {selectedScore && (
          <>
            <Divider my="sm" />

            <Title order={5} mb="xs">方案详细分析: {selectedScore.schemeName}</Title>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper p="sm" radius="sm" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text fw={600} size="sm">综合评分</Text>
                    <Group gap="xs">
                      <Badge color={GRADE_COLORS[selectedScore.grade]} size="lg">
                        {selectedScore.grade}
                      </Badge>
                      <Badge color="grape" size="lg" variant="filled">
                        第 {selectedScore.rank} 名
                      </Badge>
                    </Group>
                  </Group>

                  <Text size="3rem" fw={700} ta="center" c="grape.7">
                    {selectedScore.normalizedTotalScore.toFixed(1)}
                  </Text>
                  <Text size="sm" c="dimmed" ta="center" mb="md">
                    / 100 分
                  </Text>

                  <Progress
                    value={selectedScore.normalizedTotalScore}
                    color={GRADE_COLORS[selectedScore.grade]}
                    size="md"
                    mb="md"
                  />

                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text size="sm">原始总分</Text>
                      <Text size="sm" fw={600}>
                        {selectedScore.totalScore.toFixed(1)} / {selectedScore.maxPossibleScore.toFixed(1)}
                      </Text>
                    </Group>

                    {selectedScore.strengths.length > 0 && (
                      <Paper bg="green.0" p="xs" radius="sm">
                        <Group gap="xs" mb="xs">
                          <IconTrendingUp size={14} color="#2f9e44" />
                          <Text fw={600} size="xs" c="green.9">优势</Text>
                        </Group>
                        <Stack gap={2}>
                          {selectedScore.strengths.map((s, idx) => (
                            <Text key={idx} size="xs" c="green.9">• {s}</Text>
                          ))}
                        </Stack>
                      </Paper>
                    )}

                    {selectedScore.weaknesses.length > 0 && (
                      <Paper bg="red.0" p="xs" radius="sm">
                        <Group gap="xs" mb="xs">
                          <IconTrendingDown size={14} color="#c92a2a" />
                          <Text fw={600} size="xs" c="red.9">劣势</Text>
                        </Group>
                        <Stack gap={2}>
                          {selectedScore.weaknesses.map((w, idx) => (
                            <Text key={idx} size="xs" c="red.9">• {w}</Text>
                          ))}
                        </Stack>
                      </Paper>
                    )}

                    {selectedScore.recommendations.length > 0 && (
                      <Paper bg="blue.0" p="xs" radius="sm">
                        <Group gap="xs" mb="xs">
                          <IconAward size={14} color="#1971c2" />
                          <Text fw={600} size="xs" c="blue.9">建议</Text>
                        </Group>
                        <Stack gap={2}>
                          {selectedScore.recommendations.map((r, idx) => (
                            <Text key={idx} size="xs" c="blue.9">• {r}</Text>
                          ))}
                        </Stack>
                      </Paper>
                    )}
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper p="sm" radius="sm" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text fw={600} size="sm">各准则评分</Text>
                    <Badge color="blue" variant="light" size="sm">
                      {selectedScore.criteriaScores.length} 项
                    </Badge>
                  </Group>
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={selectedScore.criteriaScores.map((cs) => {
                          const criteria = decisionResult.criteria.find((c) => c.id === cs.criteriaId);
                          return {
                            name: cs.criteriaName.length > 6 ? cs.criteriaName.slice(0, 6) + '...' : cs.criteriaName,
                            标准化分: cs.normalizedScore,
                            加权分: cs.weightedScore,
                            权重: criteria?.weight || 0,
                          };
                        })}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                        <XAxis type="number" stroke="#6c757d" fontSize={12} domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" stroke="#6c757d" fontSize={10} width={60} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #dee2e6',
                            borderRadius: 8,
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="标准化分"
                          name="标准化分"
                          fill="#228be6"
                          radius={[0, 4, 4, 0]}
                        />
                        <Bar
                          dataKey="加权分"
                          name="加权分"
                          fill="#845ef7"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Paper p="sm" radius="sm" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text fw={600} size="sm">雷达图对比</Text>
                    <Badge color="grape" variant="light" size="sm">
                      {selectedScore.criteriaScores.length} 维度
                    </Badge>
                  </Group>
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e9ecef" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="得分"
                          dataKey="score"
                          stroke="#845ef7"
                          fill="#845ef7"
                          fillOpacity={0.5}
                          strokeWidth={2}
                        />
                        <Radar
                          name="权重"
                          dataKey="weight"
                          stroke="#fab005"
                          fill="#fab005"
                          fillOpacity={0.3}
                          strokeWidth={2}
                          strokeDasharray="3 3"
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

            <Divider my="sm" />

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="sm" radius="sm" withBorder>
                  <Text fw={600} size="sm" mb="xs">各方案综合评分对比</Text>
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                        <XAxis dataKey="name" stroke="#6c757d" fontSize={10} />
                        <YAxis stroke="#6c757d" fontSize={12} domain={[0, 100]} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #dee2e6',
                            borderRadius: 8,
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="综合评分"
                          name="综合评分"
                          fill="#845ef7"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Paper>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper p="sm" radius="sm" withBorder>
                  <Text fw={600} size="sm" mb="xs">敏感性分析</Text>
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sensitivityData}>
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
                        <Line
                          type="monotone"
                          dataKey="权重变化"
                          name="权重变化 (%)"
                          stroke="#228be6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="排名变化"
                          name="排名变化"
                          stroke="#e03131"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Paper>
              </Grid.Col>
            </Grid>

            <Divider my="sm" />

            <Title order={5} mb="xs">决策准则权重</Title>
            <Grid gutter="md">
              {decisionResult.criteria.map((criteria) => {
                const categoryColor = CATEGORY_COLORS[criteria.category] || 'gray';
                return (
                  <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={criteria.id}>
                    <Paper
                      bg={`${categoryColor}.0`}
                      p="sm"
                      radius="sm"
                    >
                      <Group justify="space-between" mb="xs">
                        <Badge color={categoryColor} size="sm">
                          {CATEGORY_LABELS[criteria.category]}
                        </Badge>
                        <Text size="xs" fw={600} c={`${categoryColor}.9`}>
                          权重: {criteria.weight}
                        </Text>
                      </Group>
                      <Text fw={600} size="sm" c={`${categoryColor}.9`}>
                        {criteria.name}
                      </Text>
                      <Text size="xs" c="dimmed" mb="xs">
                        {criteria.description}
                      </Text>
                      <Progress
                        value={criteria.weight * 5}
                        color={categoryColor}
                        size="xs"
                      />
                      <Group justify="space-between" mt="xs">
                        <Text size="xs" c="dimmed">
                          单位: {criteria.unit || '-'}
                        </Text>
                        <Badge size="xs" variant="light" color={criteria.higherIsBetter ? 'green' : 'red'}>
                          {criteria.higherIsBetter ? '越高越好' : '越低越好'}
                        </Badge>
                      </Group>
                    </Paper>
                  </Grid.Col>
                );
              })}
            </Grid>

            <Paper bg="grape.0" p="sm" radius="sm" mt="md">
              <Group gap="xs" mb="xs">
                <IconAward size={18} color="#7048e8" />
                <Text fw={600} size="sm" c="grape.9">决策结论</Text>
              </Group>
              <Text size="sm" c="grape.9">
                {decisionResult.conclusion}
              </Text>
            </Paper>
          </>
        )}
      </Paper>
    </Stack>
  );
};

export default MultiSchemeDecisionPanel;