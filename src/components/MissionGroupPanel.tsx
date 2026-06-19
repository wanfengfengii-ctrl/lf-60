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
  ThemeIcon,
  Progress,
  TextInput,
} from '@mantine/core';
import {
  IconSwords,
  IconPackage,
  IconClock,
  IconAlertTriangle,
  IconTrash,
  IconPlayerPlay,
  IconRoute,
  IconWeight,
  IconTarget,
} from '@tabler/icons-react';
import {
  LoadMission,
  MISSION_TEMPLATES,
  MissionGroup,
} from '../types';

interface MissionGroupPanelProps {
  selectedMissions: LoadMission[];
  onAddMission: (mission: LoadMission) => void;
  onRemoveMission: (index: number) => void;
  onReorderMissions: (fromIndex: number, toIndex: number) => void;
  onClearMissions: () => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
  missionGroup: MissionGroup | null;
}

const MISSION_TYPE_COLORS: Record<LoadMission['type'], string> = {
  transport: 'blue',
  combat: 'red',
  patrol: 'green',
  supply: 'orange',
  retreat: 'yellow',
  reconnaissance: 'purple',
};

const MISSION_TYPE_LABELS: Record<LoadMission['type'], { label: string; icon: string }> = {
  transport: { label: '运输', icon: '🌾' },
  combat: { label: '作战', icon: '⚔️' },
  patrol: { label: '巡逻', icon: '🛡️' },
  supply: { label: '补给', icon: '📦' },
  retreat: { label: '撤退', icon: '🏃' },
  reconnaissance: { label: '侦察', icon: '🔭' },
};

const PRIORITY_COLORS: Record<LoadMission['priority'], string> = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
};

const PRIORITY_LABELS: Record<LoadMission['priority'], string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
};

const RISK_COLORS: Record<LoadMission['riskLevel'], string> = {
  low: 'green',
  medium: 'yellow',
  high: 'orange',
  extreme: 'red',
};

const RISK_LABELS: Record<LoadMission['riskLevel'], string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  extreme: '极高风险',
};

const MissionGroupPanel: React.FC<MissionGroupPanelProps> = ({
  selectedMissions,
  onAddMission,
  onRemoveMission,
  onReorderMissions,
  onClearMissions,
  onRunSimulation,
  isSimulating,
  missionGroup: _missionGroup,
}) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const handleToggleMission = (mission: LoadMission) => {
    const isSelected = selectedMissions.find(m => m.id === mission.id);
    if (isSelected) {
      const index = selectedMissions.findIndex(m => m.id === mission.id);
      if (index !== -1) {
        onRemoveMission(index);
      }
    } else {
      onAddMission(mission);
    }
  };

  const handleMoveMission = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= selectedMissions.length) return;
    onReorderMissions(fromIndex, toIndex);
  };

  const groupStats = {
    totalCycles: selectedMissions.reduce((sum, m) => sum + m.durationCycles, 0),
    totalHours: selectedMissions.reduce((sum, m) => sum + m.durationHours, 0),
    totalLoad: selectedMissions.reduce((sum, m) => sum + m.totalLoad, 0),
    maxLoad: selectedMissions.length > 0 ? Math.max(...selectedMissions.map(m => m.maxAllowedLoad)) : 0,
    avgDamage: selectedMissions.length > 0 
      ? selectedMissions.reduce((sum, m) => sum + m.estimatedDamage, 0) / selectedMissions.length 
      : 0,
    uniqueTerrains: [...new Set(selectedMissions.flatMap(m => m.terrainIds))],
  };

  return (
    <Stack gap="md">
      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <IconSwords size={20} color="#e03131" />
            <Title order={4}>载荷任务编组</Title>
          </Group>
          <Badge color="red" variant="light">
            共 {MISSION_TEMPLATES.length} 种任务模板
          </Badge>
        </Group>

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper bg="gray.0" p="sm" radius="sm" mb="md">
              <Text fw={600} size="sm" mb="xs">编组信息</Text>
              <Stack gap="sm">
                <TextInput
                  placeholder="编组名称"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  size="sm"
                />
                <TextInput
                  placeholder="编组描述"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  size="sm"
                />
              </Stack>
            </Paper>

            <Text fw={600} size="sm" mb="xs">可选任务模板</Text>
            <ScrollArea h={450} type="auto">
              <Stack gap="sm">
                {MISSION_TEMPLATES.map((mission) => {
                  const isSelected = selectedMissions.find(m => m.id === mission.id);
                  return (
                    <Card
                      key={mission.id}
                      shadow="sm"
                      p="sm"
                      radius="md"
                      withBorder
                      style={{
                        borderColor: isSelected ? '#e03131' : '#e5e7eb',
                        background: isSelected ? '#fff5f5' : 'white',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleToggleMission(mission)}
                    >
                      <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                          <ThemeIcon
                            size="md"
                            radius="md"
                            color={MISSION_TYPE_COLORS[mission.type]}
                            variant="light"
                          >
                            <span style={{ fontSize: '1rem' }}>
                              {MISSION_TYPE_LABELS[mission.type].icon}
                            </span>
                          </ThemeIcon>
                          <div>
                            <Text fw={600} size="sm">{mission.name}</Text>
                            <Text size="xs" c="dimmed">
                              {MISSION_TYPE_LABELS[mission.type].label}
                            </Text>
                          </div>
                        </Group>
                        <Stack gap={4} align="flex-end">
                          <Badge color={PRIORITY_COLORS[mission.priority]} variant="light" size="sm">
                            优先级: {PRIORITY_LABELS[mission.priority]}
                          </Badge>
                          <Badge color={RISK_COLORS[mission.riskLevel]} variant="light" size="sm">
                            {RISK_LABELS[mission.riskLevel]}
                          </Badge>
                        </Stack>
                      </Group>

                      <Text size="xs" c="dimmed" mb="xs" lineClamp={2}>
                        {mission.description}
                      </Text>

                      <Grid gutter={4}>
                        <Grid.Col span={6}>
                          <Group gap={4}>
                            <IconClock size={12} color="#868e96" />
                            <Text size="xs" c="dimmed">{mission.durationHours}h</Text>
                          </Group>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Group gap={4}>
                            <IconWeight size={12} color="#868e96" />
                            <Text size="xs" c="dimmed">{mission.totalLoad}kg</Text>
                          </Group>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Group gap={4}>
                            <IconRoute size={12} color="#868e96" />
                            <Text size="xs" c="dimmed">{mission.terrainIds.length} 地形</Text>
                          </Group>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Group gap={4}>
                            <IconTarget size={12} color="#868e96" />
                            <Text size="xs" c="dimmed">损伤 {(mission.estimatedDamage * 100).toFixed(0)}%</Text>
                          </Group>
                        </Grid.Col>
                      </Grid>

                      {isSelected && (
                        <Group justify="flex-end" mt="xs">
                          <Badge color="red" size="sm" variant="filled">
                            已添加
                          </Badge>
                        </Group>
                      )}
                    </Card>
                  );
                })}
              </Stack>
            </ScrollArea>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper bg="blue.0" p="sm" radius="sm" mb="md">
              <Group justify="space-between" mb="xs">
                <Text fw={600} size="sm">编组统计</Text>
                <Badge color="blue" size="sm">
                  {selectedMissions.length} 个任务
                </Badge>
              </Group>
              <Grid gutter={8}>
                <Grid.Col span={6}>
                  <Group gap={4}>
                    <IconClock size={14} color="#1971c2" />
                    <Text size="xs" c="dimmed">总时长</Text>
                    <Text size="xs" fw={600}>{groupStats.totalHours}h</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group gap={4}>
                    <IconRoute size={14} color="#1971c2" />
                    <Text size="xs" c="dimmed">总循环</Text>
                    <Text size="xs" fw={600}>{groupStats.totalCycles.toLocaleString()}</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group gap={4}>
                    <IconWeight size={14} color="#1971c2" />
                    <Text size="xs" c="dimmed">总载荷</Text>
                    <Text size="xs" fw={600}>{groupStats.totalLoad}kg</Text>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group gap={4}>
                    <IconTarget size={14} color="#1971c2" />
                    <Text size="xs" c="dimmed">预估损伤</Text>
                    <Text size="xs" fw={600}>{(groupStats.avgDamage * 100).toFixed(1)}%</Text>
                  </Group>
                </Grid.Col>
              </Grid>
            </Paper>

            <Group justify="space-between" mb="xs">
              <Text fw={600} size="sm">任务执行序列</Text>
              <Button
                size="xs"
                variant="light"
                color="red"
                leftSection={<IconTrash size={12} />}
                onClick={onClearMissions}
                disabled={selectedMissions.length === 0 || isSimulating}
              >
                清空
              </Button>
            </Group>

            {selectedMissions.length === 0 ? (
              <Paper p="xl" radius="md" withBorder bg="gray.0">
                <Stack align="center" gap="sm">
                  <IconPackage size={48} color="#adb5bd" />
                  <Text c="dimmed" ta="center">
                    请从左侧选择任务添加到编组
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    点击任务卡片即可添加到执行序列
                  </Text>
                </Stack>
              </Paper>
            ) : (
              <ScrollArea h={400} type="auto">
                <Stack gap="sm">
                  {selectedMissions.map((mission, index) => (
                    <Card
                      key={`${mission.id}-${index}`}
                      shadow="sm"
                      p="sm"
                      radius="md"
                      withBorder
                    >
                      <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                          <ThemeIcon size="md" radius="md" color="red" variant="filled">
                            <Text size="xs" fw={700}>{index + 1}</Text>
                          </ThemeIcon>
                          <ThemeIcon
                            size="md"
                            radius="md"
                            color={MISSION_TYPE_COLORS[mission.type]}
                            variant="light"
                          >
                            <span style={{ fontSize: '0.9rem' }}>
                              {MISSION_TYPE_LABELS[mission.type].icon}
                            </span>
                          </ThemeIcon>
                          <div>
                            <Text fw={600} size="sm">{mission.name}</Text>
                            <Text size="xs" c="dimmed">
                              {mission.durationHours}h · {mission.totalLoad}kg · 损伤 {(mission.estimatedDamage * 100).toFixed(0)}%
                            </Text>
                          </div>
                        </Group>
                        <Group gap={4}>
                          <Button
                            size="xs"
                            variant="subtle"
                            onClick={() => handleMoveMission(index, 'up')}
                            disabled={index === 0 || isSimulating}
                          >
                            ↑
                          </Button>
                          <Button
                            size="xs"
                            variant="subtle"
                            onClick={() => handleMoveMission(index, 'down')}
                            disabled={index === selectedMissions.length - 1 || isSimulating}
                          >
                            ↓
                          </Button>
                          <Button
                            size="xs"
                            color="red"
                            variant="subtle"
                            onClick={() => onRemoveMission(index)}
                            disabled={isSimulating}
                          >
                            <IconTrash size={14} />
                          </Button>
                        </Group>
                      </Group>

                      <Progress
                        value={(mission.estimatedDamage * 100)}
                        color={mission.estimatedDamage > 0.4 ? 'red' : mission.estimatedDamage > 0.2 ? 'orange' : 'green'}
                        size="xs"
                      />

                      {mission.shockEvents.length > 0 && (
                        <Stack gap={2} mt="xs">
                          {mission.shockEvents.slice(0, 2).map((event, idx) => (
                            <Group key={idx} gap={4}>
                              <IconAlertTriangle size={10} color="#fab005" />
                              <Text size="xs" c="dimmed">
                                {event.description} (频率: {(event.frequency * 100).toFixed(0)}%, 强度: {event.intensity}x)
                              </Text>
                            </Group>
                          ))}
                        </Stack>
                      )}
                    </Card>
                  ))}
                </Stack>
              </ScrollArea>
            )}

            <Button
              fullWidth
              mt="md"
              color="red"
              size="md"
              leftSection={<IconPlayerPlay size={18} />}
              onClick={onRunSimulation}
              disabled={selectedMissions.length === 0 || isSimulating}
            >
              {isSimulating
                ? '仿真运行中...'
                : selectedMissions.length === 0
                ? '请先选择任务'
                : `开始战役仿真 (${selectedMissions.length} 个任务)`
              }
            </Button>
          </Grid.Col>
        </Grid>
      </Paper>
    </Stack>
  );
};

export default MissionGroupPanel;
