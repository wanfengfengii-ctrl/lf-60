import React, { useState, useMemo } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Card,
  SimpleGrid,
  Button,
  Divider,
  Progress,
  Table,
  Alert,
  Box,
} from '@mantine/core';
import {
  IconSwords,
  IconShield,
  IconUsers,
  IconClock,
  IconMap,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconTarget,
  IconTrophy,
  IconHistory,
} from '@tabler/icons-react';
import {
  CombatMissionScenario,
  COMBAT_SCENARIOS,
  WheelParameters,
} from '../types';
import { simulateMissionGroup } from '../physics/digitalTwin';

interface CombatScenarioPanelProps {
  onSelectConfiguration?: (params: WheelParameters) => void;
  onSelectTerrain?: (terrainId: string) => void;
}

const CombatScenarioPanel: React.FC<CombatScenarioPanelProps> = ({
  onSelectConfiguration,
  onSelectTerrain,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<CombatMissionScenario | null>(null);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const scenarioCards = useMemo(() => {
    return COMBAT_SCENARIOS.map((scenario) => {
      const successRate = scenario.expectedOutcome.successProbability * 100;
      const damageRate = scenario.expectedOutcome.expectedDamage * 100;

      return (
        <Card
          key={scenario.id}
          shadow="sm"
          p="md"
          radius="md"
          withBorder
          style={{
            cursor: 'pointer',
            borderColor: selectedScenario?.id === scenario.id ? '#228be6' : '#e5e7eb',
            background: selectedScenario?.id === scenario.id ? '#e7f5ff' : 'white',
          }}
          onClick={() => {
            setSelectedScenario(scenario);
            setSimulationResult(null);
          }}
        >
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <IconSwords size={20} color="#e03131" />
              <Title order={5}>{scenario.name}</Title>
            </Group>
            <Badge color="orange" variant="light">
              {scenario.year < 0 ? `公元前${Math.abs(scenario.year)}年` : `公元${scenario.year}年`}
            </Badge>
          </Group>

          <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
            {scenario.description}
          </Text>

          <Group gap="md" mb="xs">
            <Box>
              <Text size="xs" c="dimmed">交战双方</Text>
              <Text size="sm" fw={600}>
                {scenario.belligerents.join(' vs ')}
              </Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">战场地形</Text>
              <Text size="sm" fw={600}>
                {scenario.terrain.icon} {scenario.terrain.name}
              </Text>
            </Box>
          </Group>

          <Divider my="sm" />

          <SimpleGrid cols={2} spacing="xs">
            <Paper bg="green.0" p="xs" radius="sm">
              <Group gap="xs">
                <IconTarget size={14} color="#2f9e44" />
                <Text size="xs" fw={600} c="green.8">
                  成功概率
                </Text>
              </Group>
              <Text size="lg" fw={700} c="green.8">
                {successRate.toFixed(0)}%
              </Text>
              <Progress
                value={successRate}
                color="green"
                size="sm"
                mt="xs"
              />
            </Paper>
            <Paper bg="red.0" p="xs" radius="sm">
              <Group gap="xs">
                <IconAlertTriangle size={14} color="#e03131" />
                <Text size="xs" fw={600} c="red.8">
                  预期损伤
                </Text>
              </Group>
              <Text size="lg" fw={700} c="red.8">
                {damageRate.toFixed(0)}%
              </Text>
              <Progress
                value={damageRate}
                color="red"
                size="sm"
                mt="xs"
              />
            </Paper>
          </SimpleGrid>

          <Group gap="xs" mt="md">
            <Badge color="blue" variant="light">
              <IconUsers size={10} />
              <Text size="xs" ml={4}>
                需战车 {Math.ceil(scenario.missionGroup.requiredWheels / 4)} 辆
              </Text>
            </Badge>
            <Badge color="purple" variant="light">
              <IconClock size={10} />
              <Text size="xs" ml={4}>
                预计 {scenario.expectedOutcome.estimatedDuration} 小时
              </Text>
            </Badge>
          </Group>
        </Card>
      );
    });
  }, [selectedScenario]);

  const runScenarioSimulation = () => {
    if (!selectedScenario) return;

    setIsSimulating(true);
    setTimeout(() => {
      try {
        const result = simulateMissionGroup(
          selectedScenario.wheelConfiguration,
          selectedScenario.missionGroup
        );
        setSimulationResult(result);
      } catch (error) {
        console.error('Simulation error:', error);
      } finally {
        setIsSimulating(false);
      }
    }, 500);
  };

  const applyConfiguration = (config: WheelParameters) => {
    if (onSelectConfiguration) {
      onSelectConfiguration(config);
    }
    if (onSelectTerrain && selectedScenario) {
      onSelectTerrain(selectedScenario.terrain.id);
    }
  };

  if (!selectedScenario) {
    return (
      <Stack gap="md">
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group gap="xs" mb="md">
            <IconHistory size={20} color="#845ef7" />
            <Title order={4}>历史战役推演</Title>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            选择一个历史战役场景，分析车轮在实战工况下的表现和优化方案
          </Text>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {scenarioCards}
          </SimpleGrid>
        </Paper>
      </Stack>
    );
  }

  const successRate = selectedScenario.expectedOutcome.successProbability * 100;
  const damageRate = selectedScenario.expectedOutcome.expectedDamage * 100;
  const casualties = selectedScenario.expectedOutcome.expectedCasualties;

  return (
    <Stack gap="md">
      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <IconSwords size={20} color="#e03131" />
            <Title order={4}>{selectedScenario.name}</Title>
            <Badge color="orange" variant="light">
              {selectedScenario.year < 0
                ? `公元前${Math.abs(selectedScenario.year)}年`
                : `公元${selectedScenario.year}年`}
            </Badge>
          </Group>
          <Button
            variant="light"
            size="sm"
            onClick={() => {
              setSelectedScenario(null);
              setSimulationResult(null);
            }}
          >
            返回列表
          </Button>
        </Group>

        <Alert
          icon={<IconHistory size={16} />}
          title={selectedScenario.historicalReference}
          color="purple"
          variant="light"
          mb="md"
        >
          {selectedScenario.description}
        </Alert>

        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md" mb="md">
          <Paper bg="green.0" p="md" radius="sm">
            <Group gap="xs" mb="xs">
              <IconTarget size={18} color="#2f9e44" />
              <Text size="sm" fw={600} c="green.8">
                成功概率
              </Text>
            </Group>
            <Text size="xl" fw={700} c="green.8">
              {successRate.toFixed(1)}%
            </Text>
            <Progress value={successRate} color="green" size="sm" mt="xs" />
          </Paper>
          <Paper bg="red.0" p="md" radius="sm">
            <Group gap="xs" mb="xs">
              <IconAlertTriangle size={18} color="#e03131" />
              <Text size="sm" fw={600} c="red.8">
                预期损伤
              </Text>
            </Group>
            <Text size="xl" fw={700} c="red.8">
              {damageRate.toFixed(1)}%
            </Text>
            <Progress value={damageRate} color="red" size="sm" mt="xs" />
          </Paper>
          <Paper bg="orange.0" p="md" radius="sm">
            <Group gap="xs" mb="xs">
              <IconUsers size={18} color="#f76707" />
              <Text size="sm" fw={600} c="orange.8">
                预期伤亡
              </Text>
            </Group>
            <Text size="xl" fw={700} c="orange.8">
              {casualties}%
            </Text>
            <Progress value={casualties} color="orange" size="sm" mt="xs" />
          </Paper>
          <Paper bg="blue.0" p="md" radius="sm">
            <Group gap="xs" mb="xs">
              <IconClock size={18} color="#1971c2" />
              <Text size="sm" fw={600} c="blue.8">
                预计时长
              </Text>
            </Group>
            <Text size="xl" fw={700} c="blue.8">
              {selectedScenario.expectedOutcome.estimatedDuration}h
            </Text>
            <Progress
              value={(selectedScenario.expectedOutcome.estimatedDuration / 48) * 100}
              color="blue"
              size="sm"
              mt="xs"
            />
          </Paper>
        </SimpleGrid>

        <Divider label="战场地形" labelPosition="center" my="sm" />

        <Card shadow="sm" p="md" radius="md" withBorder mb="md">
          <Group gap="xs" mb="xs">
            <IconMap size={18} color={selectedScenario.terrain.color} />
            <Title order={5}>
              {selectedScenario.terrain.icon} {selectedScenario.terrain.name}
            </Title>
            <Badge
              color={
                selectedScenario.terrain.strategicImportance === 'critical'
                  ? 'red'
                  : selectedScenario.terrain.strategicImportance === 'high'
                  ? 'orange'
                  : 'blue'
              }
              variant="light"
            >
              {selectedScenario.terrain.strategicImportance === 'critical'
                ? '战略要地'
                : selectedScenario.terrain.strategicImportance === 'high'
                ? '重要区域'
                : '一般区域'}
            </Badge>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            {selectedScenario.terrain.description}
          </Text>
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
            <Paper bg="gray.0" p="xs" radius="sm">
              <Text size="xs" c="dimmed">冲击系数</Text>
              <Text size="md" fw={700}>
                {selectedScenario.terrain.impactMultiplier.toFixed(1)}x
              </Text>
            </Paper>
            <Paper bg="gray.0" p="xs" radius="sm">
              <Text size="xs" c="dimmed">频率因子</Text>
              <Text size="md" fw={700}>
                {selectedScenario.terrain.frequencyFactor.toFixed(1)}x
              </Text>
            </Paper>
            <Paper bg="gray.0" p="xs" radius="sm">
              <Text size="xs" c="dimmed">限速</Text>
              <Text size="md" fw={700}>
                {selectedScenario.terrain.speedLimit} km/h
              </Text>
            </Paper>
            <Paper bg="gray.0" p="xs" radius="sm">
              <Text size="xs" c="dimmed">减载比例</Text>
              <Text size="md" fw={700}>
                {(selectedScenario.terrain.loadReduction * 100).toFixed(0)}%
              </Text>
            </Paper>
          </SimpleGrid>
          <Text size="xs" c="dimmed" mt="md">
            <IconShield size={12} /> 推荐材料：
            {selectedScenario.terrain.recommendedMaterial === 'elm'
              ? '榆木'
              : selectedScenario.terrain.recommendedMaterial === 'oak'
              ? '橡木'
              : selectedScenario.terrain.recommendedMaterial === 'ash'
              ? '白蜡木'
              : selectedScenario.terrain.recommendedMaterial === 'iron'
              ? '铸铁加固'
              : '竹质复合'}
          </Text>
        </Card>

        <Divider label="战役任务编组" labelPosition="center" my="sm" />

        <Card shadow="sm" p="md" radius="md" withBorder mb="md">
          <Group justify="space-between" mb="md">
            <Title order={5}>{selectedScenario.missionGroup.name}</Title>
            <Group gap="xs">
              <Badge color="blue" variant="light">
                {selectedScenario.missionGroup.missions.length} 个任务
              </Badge>
              <Badge color="orange" variant="light">
                {selectedScenario.missionGroup.totalCycles.toLocaleString()} 循环
              </Badge>
            </Group>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            {selectedScenario.missionGroup.description}
          </Text>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>任务类型</Table.Th>
                <Table.Th>名称</Table.Th>
                <Table.Th>载荷</Table.Th>
                <Table.Th>持续</Table.Th>
                <Table.Th>风险</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {selectedScenario.missionGroup.missions.map((mission, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td>
                    <Badge
                      color={
                        mission.type === 'combat'
                          ? 'red'
                          : mission.type === 'transport'
                          ? 'blue'
                          : mission.type === 'supply'
                          ? 'green'
                          : mission.type === 'retreat'
                          ? 'orange'
                          : 'gray'
                      }
                      variant="light"
                    >
                      {mission.icon}{' '}
                      {mission.type === 'combat'
                        ? '作战'
                        : mission.type === 'transport'
                        ? '运输'
                        : mission.type === 'patrol'
                        ? '巡逻'
                        : mission.type === 'supply'
                        ? '补给'
                        : mission.type === 'retreat'
                        ? '撤退'
                        : '侦察'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{mission.name}</Table.Td>
                  <Table.Td>{mission.totalLoad} kg</Table.Td>
                  <Table.Td>{mission.durationHours}h</Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        mission.riskLevel === 'extreme'
                          ? 'red'
                          : mission.riskLevel === 'high'
                          ? 'orange'
                          : mission.riskLevel === 'medium'
                          ? 'yellow'
                          : 'green'
                      }
                      variant="light"
                    >
                      {mission.riskLevel === 'extreme'
                        ? '极高'
                        : mission.riskLevel === 'high'
                        ? '高'
                        : mission.riskLevel === 'medium'
                        ? '中'
                        : '低'}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>

        <Divider label="基准配置方案" labelPosition="center" my="sm" />

        <Card shadow="sm" p="md" radius="md" withBorder mb="md">
          <Group justify="space-between" mb="md">
            <Title order={5}>基准战车配置</Title>
            <Group gap="xs">
              <Badge color="green" variant="light">
                成功率 {(successRate * 1.0).toFixed(0)}%
              </Badge>
              <Button
                size="sm"
                onClick={() => applyConfiguration(selectedScenario.wheelConfiguration)}
              >
                应用此配置
              </Button>
            </Group>
          </Group>
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
            <Paper bg="gray.0" p="xs" radius="sm">
              <Text size="xs" c="dimmed">车轮半径</Text>
              <Text size="sm" fw={600}>
                {selectedScenario.wheelConfiguration.wheelRadius.toFixed(2)} m
              </Text>
            </Paper>
            <Paper bg="gray.0" p="xs" radius="sm">
              <Text size="xs" c="dimmed">轮辐数量</Text>
              <Text size="sm" fw={600}>
                {selectedScenario.wheelConfiguration.spokeCount} 根
              </Text>
            </Paper>
            <Paper bg="gray.0" p="xs" radius="sm">
              <Text size="xs" c="dimmed">车轴载重</Text>
              <Text size="sm" fw={600}>
                {selectedScenario.wheelConfiguration.axleLoad} kg
              </Text>
            </Paper>
            <Paper bg="gray.0" p="xs" radius="sm">
              <Text size="xs" c="dimmed">材料</Text>
              <Text size="sm" fw={600}>
                {selectedScenario.wheelConfiguration.materialId === 'elm'
                  ? '榆木'
                  : selectedScenario.wheelConfiguration.materialId === 'oak'
                  ? '橡木'
                  : selectedScenario.wheelConfiguration.materialId === 'ash'
                  ? '白蜡木'
                  : selectedScenario.wheelConfiguration.materialId === 'iron'
                  ? '铸铁加固'
                  : '竹质复合'}
              </Text>
            </Paper>
          </SimpleGrid>
        </Card>

        <Divider label="替代配置方案" labelPosition="center" my="sm" />

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="md">
          {selectedScenario.alternativeConfigurations.map((config, idx) => {
            const baseSuccess = selectedScenario.expectedOutcome.successProbability;
            const successDiff = (config.successProbability - baseSuccess) * 100;

            return (
              <Card key={idx} shadow="sm" p="md" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Title order={5}>{config.name}</Title>
                  <Badge
                    color={successDiff >= 0 ? 'green' : 'orange'}
                    variant="light"
                  >
                    {successDiff >= 0 ? '+' : ''}
                    {successDiff.toFixed(1)}%
                  </Badge>
                </Group>

                <SimpleGrid cols={2} spacing="xs" mb="sm">
                  <Paper bg="gray.0" p="xs" radius="sm">
                    <Text size="xs" c="dimmed">轮径</Text>
                    <Text size="sm" fw={600}>
                      {config.parameters.wheelRadius.toFixed(2)}m
                    </Text>
                  </Paper>
                  <Paper bg="gray.0" p="xs" radius="sm">
                    <Text size="xs" c="dimmed">轮辐</Text>
                    <Text size="sm" fw={600}>
                      {config.parameters.spokeCount}根
                    </Text>
                  </Paper>
                </SimpleGrid>

                <Group gap="xs" mb="xs">
                  <IconCheck size={14} color="#2f9e44" />
                  <Text size="xs" c="green.8">
                    {config.advantage}
                  </Text>
                </Group>
                <Group gap="xs" mb="sm">
                  <IconX size={14} color="#e03131" />
                  <Text size="xs" c="red.8">
                    {config.disadvantage}
                  </Text>
                </Group>

                <Button
                  fullWidth
                  size="sm"
                  variant="light"
                  onClick={() => applyConfiguration(config.parameters)}
                >
                  应用此配置
                </Button>
              </Card>
            );
          })}
        </SimpleGrid>

        <Divider label="战略要点" labelPosition="center" my="sm" />

        <Paper bg="purple.0" p="md" radius="sm" mb="md">
          <Stack gap="xs">
            {selectedScenario.strategicNotes.map((note, idx) => (
              <Group key={idx} gap="xs">
                <IconTrophy size={14} color="#7048e8" />
                <Text size="sm">{note}</Text>
              </Group>
            ))}
          </Stack>
        </Paper>

        <Group justify="center" gap="md">
          <Button
            size="lg"
            leftSection={<IconSwords size={18} />}
            onClick={runScenarioSimulation}
            loading={isSimulating}
            color="red"
          >
            运行战役仿真
          </Button>
        </Group>
      </Paper>

      {simulationResult && (
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group gap="xs" mb="md">
            <IconTarget size={20} color="#228be6" />
            <Title order={4}>战役仿真结果</Title>
          </Group>

          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md" mb="md">
            <Paper bg="green.0" p="md" radius="sm">
              <Text size="sm" fw={600} c="green.8">
                任务成功率
              </Text>
              <Text size="xl" fw={700} c="green.8">
                {(simulationResult.missionSuccessProbability * 100).toFixed(1)}%
              </Text>
            </Paper>
            <Paper bg="red.0" p="md" radius="sm">
              <Text size="sm" fw={600} c="red.8">
                累积损伤
              </Text>
              <Text size="xl" fw={700} c="red.8">
                {(simulationResult.cumulativeDamage * 100).toFixed(1)}%
              </Text>
            </Paper>
            <Paper bg="blue.0" p="md" radius="sm">
              <Text size="sm" fw={600} c="blue.8">
                总循环次数
              </Text>
              <Text size="xl" fw={700} c="blue.8">
                {simulationResult.damageEvolution.totalCycles.toLocaleString()}
              </Text>
            </Paper>
            <Paper bg="orange.0" p="md" radius="sm">
              <Text size="sm" fw={600} c="orange.8">
                失效周期
              </Text>
              <Text size="xl" fw={700} c="orange.8">
                {simulationResult.damageEvolution.failureCycle
                  ? simulationResult.damageEvolution.failureCycle.toLocaleString()
                  : '未失效'}
              </Text>
            </Paper>
          </SimpleGrid>

          {simulationResult.damageEvolution.failureMode && (
            <Alert
              icon={<IconAlertTriangle size={16} />}
              title="失效模式分析"
              color="red"
              variant="light"
            >
              <Group gap="md">
                <Box>
                  <Text size="sm" fw={600}>
                    失效类型：
                  </Text>
                  <Text size="sm">
                    {simulationResult.damageEvolution.failureMode === 'spoke_fracture'
                      ? '轮辐断裂'
                      : simulationResult.damageEvolution.failureMode === 'hub_failure'
                      ? '轮毂失效'
                      : simulationResult.damageEvolution.failureMode === 'rim_failure'
                      ? '轮辋失效'
                      : '累积疲劳失效'}
                  </Text>
                </Box>
                <Box>
                  <Text size="sm" fw={600}>
                    关键轮辐：
                  </Text>
                  <Text size="sm">
                    #{(simulationResult.damageEvolution.criticalSpokeIndex ?? -1) + 1}
                  </Text>
                </Box>
              </Group>
            </Alert>
          )}

          <Divider my="sm" />

          <Title order={5} mb="xs">最终状态</Title>
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
            <Paper bg="gray.0" p="xs" radius="sm">
              <Text size="xs" c="dimmed">结构完整性</Text>
              <Text size="md" fw={700}>
                {simulationResult.damageEvolution.finalState.structuralIntegrity.toFixed(1)}%
              </Text>
            </Paper>
            <Paper bg="gray.0" p="xs" radius="sm">
              <Text size="xs" c="dimmed">安全系数</Text>
              <Text size="md" fw={700}>
                {simulationResult.damageEvolution.finalState.safetyFactor.toFixed(2)}x
              </Text>
            </Paper>
            <Paper bg="gray.0" p="xs" radius="sm">
              <Text size="xs" c="dimmed">失效轮辐</Text>
              <Text size="md" fw={700}>
                {simulationResult.damageEvolution.finalState.failedSpokes.length} 根
              </Text>
            </Paper>
            <Paper bg="gray.0" p="xs" radius="sm">
              <Text size="xs" c="dimmed">失效概率</Text>
              <Text size="md" fw={700}>
                {(simulationResult.damageEvolution.finalState.failureProbability * 100).toFixed(1)}%
              </Text>
            </Paper>
          </SimpleGrid>
        </Paper>
      )}
    </Stack>
  );
};

export default CombatScenarioPanel;
