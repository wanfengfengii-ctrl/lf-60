import React, { useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Card,
  Badge,
  Button,
  ScrollArea,
  Grid,
  Divider,
  ThemeIcon,
  Box,
  SegmentedControl,
  Tooltip,
  Progress,
} from '@mantine/core';
import {
  IconMountain,
  IconFlame,
  IconShield,
  IconAlertTriangle,
  IconCheck,
  IconMapPin,
  IconRoute,
  IconGauge,
  IconWeight,
} from '@tabler/icons-react';
import {
  BattlefieldTerrain,
  BATTLEFIELD_TERRAINS,
  TerrainType,
  getMaterialById,
} from '../types';

interface BattlefieldTerrainPanelProps {
  selectedTerrainId: string | null;
  onSelectTerrain: (terrainId: string) => void;
}

const TERRAIN_TYPE_LABELS: Record<TerrainType, { label: string; icon: string }> = {
  plain: { label: '平原', icon: '🏛️' },
  hilly: { label: '丘陵', icon: '🏔️' },
  mountain: { label: '山地', icon: '⛰️' },
  desert: { label: '沙漠', icon: '🏜️' },
  marsh: { label: '沼泽', icon: '🌊' },
  forest: { label: '森林', icon: '🌲' },
  river: { label: '渡口', icon: '🌉' },
  siege: { label: '攻城', icon: '🏯' },
};

const BattlefieldTerrainPanel: React.FC<BattlefieldTerrainPanelProps> = ({
  selectedTerrainId,
  onSelectTerrain,
}) => {
  const [filterType, setFilterType] = useState<TerrainType | 'all'>('all');

  const filteredTerrains = filterType === 'all'
    ? BATTLEFIELD_TERRAINS
    : BATTLEFIELD_TERRAINS.filter(t => t.type === filterType);

  const selectedTerrain = BATTLEFIELD_TERRAINS.find(t => t.id === selectedTerrainId);

  const getDifficultyColor = (multiplier: number) => {
    if (multiplier <= 0.8) return 'green';
    if (multiplier <= 1.2) return 'blue';
    if (multiplier <= 1.8) return 'yellow';
    if (multiplier <= 2.2) return 'orange';
    return 'red';
  };

  const getDifficultyLabel = (multiplier: number) => {
    if (multiplier <= 0.8) return '温和';
    if (multiplier <= 1.2) return '中等';
    if (multiplier <= 1.8) return '困难';
    if (multiplier <= 2.2) return '恶劣';
    return '极端';
  };

  const getStrategicColor = (importance: BattlefieldTerrain['strategicImportance']) => {
    switch (importance) {
      case 'low': return 'gray';
      case 'medium': return 'blue';
      case 'high': return 'orange';
      case 'critical': return 'red';
    }
  };

  const getStrategicLabel = (importance: BattlefieldTerrain['strategicImportance']) => {
    switch (importance) {
      case 'low': return '低';
      case 'medium': return '中';
      case 'high': return '高';
      case 'critical': return '极高';
    }
  };

  return (
    <Stack gap="md">
      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <IconMapPin size={20} color="#228be6" />
            <Title order={4}>战场地形选择</Title>
          </Group>
          <Badge color="blue" variant="light">
            共 {BATTLEFIELD_TERRAINS.length} 种地形
          </Badge>
        </Group>

        <Box mb="md">
          <Text fw={500} size="sm" mb="xs">地形类型筛选</Text>
          <SegmentedControl
            fullWidth
            value={filterType}
            onChange={(value) => setFilterType(value as TerrainType | 'all')}
            data={[
              { value: 'all', label: '全部' },
              ...Object.entries(TERRAIN_TYPE_LABELS).map(([value, { label, icon }]) => ({
                value,
                label: `${icon} ${label}`,
              })),
            ]}
          />
        </Box>

        <Divider mb="md" />

        <ScrollArea h={400} type="auto">
          <Grid gutter="md">
            {filteredTerrains.map((terrain) => (
              <Grid.Col span={{ base: 12, md: 6 }} key={terrain.id}>
                <Card
                  shadow="sm"
                  p="md"
                  radius="md"
                  withBorder
                  style={{
                    borderColor: selectedTerrainId === terrain.id ? '#228be6' : '#e5e7eb',
                    background: selectedTerrainId === terrain.id ? '#e7f5ff' : 'white',
                    cursor: 'pointer',
                  }}
                  onClick={() => onSelectTerrain(terrain.id)}
                >
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <ThemeIcon
                        size="lg"
                        radius="md"
                        style={{ backgroundColor: terrain.color + '20', color: terrain.color }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{terrain.icon}</span>
                      </ThemeIcon>
                      <div>
                        <Text fw={600} size="md">{terrain.name}</Text>
                        <Text size="xs" c="dimmed">
                          {TERRAIN_TYPE_LABELS[terrain.type].label} · {terrain.elevation}m
                        </Text>
                      </div>
                    </Group>
                    <Stack gap={4} align="flex-end">
                      <Badge color={getDifficultyColor(terrain.impactMultiplier)} variant="light" size="sm">
                        难度: {getDifficultyLabel(terrain.impactMultiplier)}
                      </Badge>
                      <Badge color={getStrategicColor(terrain.strategicImportance)} variant="light" size="sm">
                        战略价值: {getStrategicLabel(terrain.strategicImportance)}
                      </Badge>
                    </Stack>
                  </Group>

                  <Text size="sm" c="dimmed" mb="sm" lineClamp={2}>
                    {terrain.description}
                  </Text>

                  <Grid gutter="xs" mb="xs">
                    <Grid.Col span={6}>
                      <Group gap={4}>
                        <IconFlame size={14} color="#ff6b6b" />
                        <Text size="xs" c="dimmed">冲击系数</Text>
                        <Text size="xs" fw={600}>{terrain.impactMultiplier.toFixed(1)}x</Text>
                      </Group>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Group gap={4}>
                        <IconRoute size={14} color="#228be6" />
                        <Text size="xs" c="dimmed">频率因子</Text>
                        <Text size="xs" fw={600}>{terrain.frequencyFactor.toFixed(1)}x</Text>
                      </Group>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Group gap={4}>
                        <IconGauge size={14} color="#40c057" />
                        <Text size="xs" c="dimmed">限速</Text>
                        <Text size="xs" fw={600}>{terrain.speedLimit} km/h</Text>
                      </Group>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Group gap={4}>
                        <IconWeight size={14} color="#fab005" />
                        <Text size="xs" c="dimmed">减载</Text>
                        <Text size="xs" fw={600}>{(terrain.loadReduction * 100).toFixed(0)}%</Text>
                      </Group>
                    </Grid.Col>
                  </Grid>

                  <Group justify="space-between" mt="xs">
                    <Tooltip label={terrain.historicalContext}>
                      <Badge color="grape" variant="light" size="sm">
                        📜 历史背景
                      </Badge>
                    </Tooltip>
                    <Badge
                      color={selectedTerrainId === terrain.id ? 'blue' : 'gray'}
                      variant={selectedTerrainId === terrain.id ? 'filled' : 'light'}
                      size="sm"
                    >
                      {selectedTerrainId === terrain.id ? (
                        <Group gap={4}>
                          <IconCheck size={12} />
                          <span>已选择</span>
                        </Group>
                      ) : '点击选择'}
                    </Badge>
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </ScrollArea>
      </Paper>

      {selectedTerrain && (
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <ThemeIcon
                size="lg"
                radius="md"
                style={{ backgroundColor: selectedTerrain.color + '20', color: selectedTerrain.color }}
              >
                <span style={{ fontSize: '1.2rem' }}>{selectedTerrain.icon}</span>
              </ThemeIcon>
              <div>
                <Title order={5}>{selectedTerrain.name}</Title>
                <Text size="sm" c="dimmed">
                  {TERRAIN_TYPE_LABELS[selectedTerrain.type].label} · 海拔 {selectedTerrain.elevation}m
                </Text>
              </div>
            </Group>
            <Badge
              color={getDifficultyColor(selectedTerrain.impactMultiplier)}
              variant="filled"
              size="lg"
            >
              综合难度: {getDifficultyLabel(selectedTerrain.impactMultiplier)}
            </Badge>
          </Group>

          <Grid gutter="md" mb="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper bg="gray.0" p="sm" radius="sm">
                <Text fw={600} size="sm" mb="xs">地形特性</Text>
                <Stack gap={8}>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">坡度</Text>
                    <Text size="xs" fw={600}>{(selectedTerrain.slope * 100).toFixed(1)}°</Text>
                  </Group>
                  <Progress
                    value={selectedTerrain.slope * 400}
                    color={selectedTerrain.slope > 0.15 ? 'red' : selectedTerrain.slope > 0.08 ? 'orange' : 'green'}
                    size="xs"
                  />
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">粗糙度</Text>
                    <Text size="xs" fw={600}>{(selectedTerrain.roughness * 100).toFixed(0)}%</Text>
                  </Group>
                  <Progress
                    value={selectedTerrain.roughness * 100}
                    color={selectedTerrain.roughness > 0.7 ? 'red' : selectedTerrain.roughness > 0.4 ? 'orange' : 'green'}
                    size="xs"
                  />
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">障碍密度</Text>
                    <Text size="xs" fw={600}>{(selectedTerrain.obstacleDensity * 100).toFixed(0)}%</Text>
                  </Group>
                  <Progress
                    value={selectedTerrain.obstacleDensity * 100}
                    color={selectedTerrain.obstacleDensity > 0.6 ? 'red' : selectedTerrain.obstacleDensity > 0.3 ? 'orange' : 'green'}
                    size="xs"
                  />
                </Stack>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper bg="gray.0" p="sm" radius="sm">
                <Text fw={600} size="sm" mb="xs">推荐配置</Text>
                <Stack gap={8}>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">推荐材料</Text>
                    <Badge color="blue" variant="light" size="sm">
                      {getMaterialById(selectedTerrain.recommendedMaterial)?.name}
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">最高限速</Text>
                    <Text size="xs" fw={600}>{selectedTerrain.speedLimit} km/h</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">建议减载</Text>
                    <Text size="xs" fw={600}>{(selectedTerrain.loadReduction * 100).toFixed(0)}%</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">冲击系数</Text>
                    <Badge color={getDifficultyColor(selectedTerrain.impactMultiplier)} variant="light" size="sm">
                      {selectedTerrain.impactMultiplier.toFixed(1)}x
                    </Badge>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>

          <Divider my="sm" />

          <Paper bg="blue.0" p="sm" radius="sm" mb="sm">
            <Group gap="xs" mb="xs">
              <IconShield size={16} color="#1971c2" />
              <Text fw={600} size="sm" c="blue.9">历史背景</Text>
            </Group>
            <Text size="sm" c="blue.9">
              {selectedTerrain.historicalContext}
            </Text>
          </Paper>

          <Paper bg="orange.0" p="sm" radius="sm">
            <Group gap="xs" mb="xs">
              <IconAlertTriangle size={16} color="#d9480f" />
              <Text fw={600} size="sm" c="orange.9">注意事项</Text>
            </Group>
            <Stack gap={4}>
              {selectedTerrain.warningNotes.map((note, idx) => (
                <Text key={idx} size="sm" c="orange.9">
                  • {note}
                </Text>
              ))}
            </Stack>
          </Paper>

          <Group justify="flex-end" mt="md">
            <Button
              variant="filled"
              color="blue"
              leftSection={<IconMountain size={16} />}
              onClick={() => selectedTerrain && onSelectTerrain(selectedTerrain.id)}
            >
              确认选择此地形
            </Button>
          </Group>
        </Paper>
      )}
    </Stack>
  );
};

export default BattlefieldTerrainPanel;
