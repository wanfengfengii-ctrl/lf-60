import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  Slider,
  Grid,
  Divider,
  Card,
  Progress,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconAlertTriangle,
  IconClock,
  IconTarget,
  IconShield,
  IconCheck,
  IconExclamationMark,
} from '@tabler/icons-react';
import { FailurePlaybackSession, FailureEvent } from '../types';

interface FailurePlaybackPanelProps {
  playbackSession: FailurePlaybackSession | null;
}

const FAILURE_TYPE_COLORS: Record<FailureEvent['type'], string> = {
  spoke_fracture: 'red',
  hub_failure: 'orange',
  rim_failure: 'yellow',
  fatigue_cumulative: 'grape',
};

const FAILURE_TYPE_LABELS: Record<FailureEvent['type'], string> = {
  spoke_fracture: '轮辐断裂',
  hub_failure: '轮毂失效',
  rim_failure: '轮辋失效',
  fatigue_cumulative: '疲劳累积',
};

const SEVERITY_COLORS: Record<FailureEvent['severity'], string> = {
  mild: 'green',
  moderate: 'yellow',
  severe: 'orange',
  critical: 'red',
};

const SEVERITY_LABELS: Record<FailureEvent['severity'], string> = {
  mild: '轻微',
  moderate: '中等',
  severe: '严重',
  critical: '致命',
};

const FailurePlaybackPanel: React.FC<FailurePlaybackPanelProps> = ({ playbackSession }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playbackDirection, setPlaybackDirection] = useState<'forward' | 'reverse'>('forward');

  useEffect(() => {
    if (!playbackSession || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (playbackDirection === 'forward') {
          if (prev >= playbackSession.timeSeriesData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + playbackSpeed;
        } else {
          if (prev <= 0) {
            setIsPlaying(false);
            return 0;
          }
          return prev - playbackSpeed;
        }
      });
    }, 100);

    return () => clearInterval(interval);
  }, [playbackSession, isPlaying, playbackSpeed, playbackDirection]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [playbackSession]);

  const currentDataPoint = useMemo(() => {
    if (!playbackSession || !playbackSession.timeSeriesData.length) return null;
    const idx = Math.min(Math.max(0, currentIndex), playbackSession.timeSeriesData.length - 1);
    return playbackSession.timeSeriesData[idx];
  }, [playbackSession, currentIndex]);

  const currentEvolutionState = useMemo(() => {
    if (!playbackSession || !playbackSession.evolutionStates.length) return null;
    const ratio = currentIndex / Math.max(1, (playbackSession?.timeSeriesData.length || 1) - 1);
    const idx = Math.min(
      Math.floor(ratio * playbackSession.evolutionStates.length),
      playbackSession.evolutionStates.length - 1
    );
    return playbackSession.evolutionStates[idx];
  }, [playbackSession, currentIndex]);

  const eventsAtCurrentPoint = useMemo(() => {
    if (!playbackSession || !currentDataPoint) return [];
    return playbackSession.failureEvents.filter(
      (e) => e.cycle <= currentDataPoint.cycle
    );
  }, [playbackSession, currentDataPoint]);

  const nextEvent = useMemo(() => {
    if (!playbackSession || !currentDataPoint) return null;
    return playbackSession.failureEvents.find(
      (e) => e.cycle > currentDataPoint.cycle
    );
  }, [playbackSession, currentDataPoint]);

  const keyFramesAtCurrentPoint = useMemo(() => {
    if (!playbackSession || !currentDataPoint) return [];
    return playbackSession.keyFrames.filter(
      (k) => k.cycle <= currentDataPoint.cycle
    );
  }, [playbackSession, currentDataPoint]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, []);

  const handleGoToEnd = useCallback(() => {
    if (playbackSession) {
      setCurrentIndex(playbackSession.timeSeriesData.length - 1);
      setIsPlaying(false);
    }
  }, [playbackSession]);

  const handleJumpToEvent = useCallback((event: FailureEvent) => {
    if (!playbackSession) return;
    const idx = playbackSession.timeSeriesData.findIndex(
      (d) => d.cycle >= event.cycle
    );
    if (idx >= 0) {
      setCurrentIndex(idx);
      setIsPlaying(false);
    }
  }, [playbackSession]);

  const handleDirectionToggle = useCallback(() => {
    setPlaybackDirection((prev) => (prev === 'forward' ? 'reverse' : 'forward'));
  }, []);

  if (!playbackSession) {
    return (
      <Stack gap="md">
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Stack align="center" gap="sm">
            <IconPlayerPlay size={48} color="#adb5bd" />
            <Text c="dimmed" ta="center">
              暂无失效回放数据
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              请先运行战役仿真，系统将自动记录失效过程
            </Text>
          </Stack>
        </Paper>
      </Stack>
    );
  }

  const progressPercent = playbackSession.timeSeriesData.length > 1
    ? (currentIndex / (playbackSession.timeSeriesData.length - 1)) * 100
    : 0;

  const hasFailure = playbackSession.failureEvents.length > 0;

  return (
    <Stack gap="md">
      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <IconPlayerPlay size={20} color="#e03131" />
            <Title order={4}>失效过程回放</Title>
          </Group>
          <Group gap="xs">
            <Badge color={hasFailure ? 'red' : 'green'} variant="filled" size="lg">
              {hasFailure ? `${playbackSession.failureEvents.length} 个失效事件` : '无失效事件'}
            </Badge>
            <Badge color="blue" variant="light" size="lg">
              {playbackSession.timeSeriesData.length} 帧数据
            </Badge>
          </Group>
        </Group>

        <Grid gutter="md" mb="md">
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Paper bg="gray.0" p="sm" radius="sm">
              <Text size="xs" c="dimmed" mb="xs">总循环次数</Text>
              <Text size="lg" fw={700}>{playbackSession.totalCycles.toLocaleString()}</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Paper bg="gray.0" p="sm" radius="sm">
              <Text size="xs" c="dimmed" mb="xs">当前循环</Text>
              <Text size="lg" fw={700}>{currentDataPoint?.cycle.toLocaleString() || 0}</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Paper bg="gray.0" p="sm" radius="sm">
              <Text size="xs" c="dimmed" mb="xs">当前健康度</Text>
              <Text size="lg" fw={700}>
                {currentDataPoint?.healthScore.toFixed(1) || 100}%
              </Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Paper bg="gray.0" p="sm" radius="sm">
              <Text size="xs" c="dimmed" mb="xs">已发生失效</Text>
              <Text size="lg" fw={700}>{eventsAtCurrentPoint.length}</Text>
            </Paper>
          </Grid.Col>
        </Grid>

        <Paper bg="blue.0" p="md" radius="md" mb="md">
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <IconClock size={18} color="#1971c2" />
              <Text fw={600} size="sm">播放控制</Text>
            </Group>
            <Group gap="xs">
              <Badge color="blue" variant="light">
                {playbackDirection === 'forward' ? '正向播放' : '反向回放'}
              </Badge>
              <Badge color="blue" variant="light">
                {playbackSpeed}x 速度
              </Badge>
            </Group>
          </Group>

          <Group justify="center" gap="xs" mb="md">
            <Button
              size="sm"
              variant="light"
              onClick={handleReset}
              leftSection={<IconPlayerSkipBack size={16} />}
            >
              重置
            </Button>
            <Button
              size="sm"
              variant="light"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 10))}
              leftSection={<IconPlayerSkipBack size={16} />}
            >
              后退10帧
            </Button>
            <Button
              size="sm"
              variant="light"
              onClick={handleDirectionToggle}
              color={playbackDirection === 'reverse' ? 'orange' : 'gray'}
            >
              {playbackDirection === 'forward' ? '→' : '←'}
            </Button>
            <Button
              size="lg"
              color={isPlaying ? 'red' : 'green'}
              onClick={handlePlayPause}
              leftSection={isPlaying ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
            >
              {isPlaying ? '暂停' : '播放'}
            </Button>
            <Button
              size="sm"
              variant="light"
              onClick={() => setCurrentIndex((prev) => Math.min(playbackSession.timeSeriesData.length - 1, prev + 10))}
              leftSection={<IconPlayerSkipForward size={16} />}
            >
              前进10帧
            </Button>
            <Button
              size="sm"
              variant="light"
              onClick={handleGoToEnd}
              leftSection={<IconPlayerSkipForward size={16} />}
            >
              跳转结尾
            </Button>
          </Group>

          <Group justify="center" gap="xs" mb="md">
            <Text size="xs" c="dimmed">播放速度:</Text>
            {[1, 2, 5, 10].map((speed) => (
              <Button
                key={speed}
                size="xs"
                variant={playbackSpeed === speed ? 'filled' : 'light'}
                color="blue"
                onClick={() => setPlaybackSpeed(speed)}
              >
                {speed}x
              </Button>
            ))}
          </Group>

          <Divider mb="md" />

          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed">
              0 循环
            </Text>
            <Text size="xs" fw={600}>
              {currentDataPoint?.cycle.toLocaleString() || 0} 循环
            </Text>
            <Text size="xs" c="dimmed">
              {playbackSession.totalCycles.toLocaleString()} 循环
            </Text>
          </Group>

          <Slider
            value={currentIndex}
            onChange={setCurrentIndex}
            min={0}
            max={playbackSession.timeSeriesData.length - 1}
            step={1}
            label={null}
            mb="xs"
          />

          <Progress value={progressPercent} size="sm" color="blue" />

          {playbackSession.keyFrames.length > 0 && (
            <Group gap="xs" mt="md" wrap="wrap">
              <Text size="xs" c="dimmed">关键帧:</Text>
              {playbackSession.keyFrames.map((kf, idx) => {
                const isActive = keyFramesAtCurrentPoint.some(
                  (k) => k.cycle === kf.cycle
                );
                return (
                  <Tooltip key={idx} label={`${kf.label}: ${kf.description}`}>
                    <Badge
                      size="sm"
                      color={isActive ? 'blue' : 'gray'}
                      variant={isActive ? 'filled' : 'light'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        const idx = playbackSession.timeSeriesData.findIndex(
                          (d) => d.cycle >= kf.cycle
                        );
                        if (idx >= 0) setCurrentIndex(idx);
                      }}
                    >
                      {kf.label}
                    </Badge>
                  </Tooltip>
                );
              })}
            </Group>
          )}
        </Paper>

        {nextEvent && (
          <Paper bg="orange.0" p="sm" radius="sm" mb="md">
            <Group gap="xs">
              <IconExclamationMark size={18} color="#d9480f" />
              <div>
                <Text fw={600} size="sm" c="orange.9">
                  下一事件: {FAILURE_TYPE_LABELS[nextEvent.type]} (严重度: {SEVERITY_LABELS[nextEvent.severity]})
                </Text>
                <Text size="sm" c="orange.9">
                  距离 {nextEvent.cycle - (currentDataPoint?.cycle || 0)} 循环
                  {" | "}{nextEvent.description}
                </Text>
              </div>
              <Button
                size="xs"
                color="orange"
                onClick={() => handleJumpToEvent(nextEvent)}
              >
                跳转到事件
              </Button>
            </Group>
          </Paper>
        )}

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: currentEvolutionState ? 6 : 12 }}>
            <Paper p="sm" radius="sm" withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={600} size="sm">实时状态监测</Text>
                <Badge color="blue" variant="light" size="sm">
                  {new Date(currentDataPoint?.timestamp || Date.now()).toLocaleTimeString('zh-CN')}
                </Badge>
              </Group>

              <Stack gap="sm">
                <Group justify="space-between">
                  <Group gap="xs">
                    <IconTarget size={16} color="#ff6b6b" />
                    <Text size="sm">最大受力</Text>
                  </Group>
                  <Text size="sm" fw={600}>
                    {currentDataPoint?.maxForce.toFixed(0) || 0} N
                  </Text>
                </Group>
                <Progress
                  value={Math.min(100, ((currentDataPoint?.maxForce || 0) / 10000) * 100)}
                  color="red"
                  size="xs"
                />

                <Group justify="space-between">
                  <Group gap="xs">
                    <IconShield size={16} color="#40c057" />
                    <Text size="sm">健康度</Text>
                  </Group>
                  <Text size="sm" fw={600}>
                    {currentDataPoint?.healthScore.toFixed(1) || 100}%
                  </Text>
                </Group>
                <Progress
                  value={currentDataPoint?.healthScore || 0}
                  color={(currentDataPoint?.healthScore || 100) > 60 ? 'green' : (currentDataPoint?.healthScore || 100) > 30 ? 'yellow' : 'red'}
                  size="xs"
                />

                <Group justify="space-between">
                  <Group gap="xs">
                    <IconAlertTriangle size={16} color="#fab005" />
                    <Text size="sm">累积损伤</Text>
                  </Group>
                  <Text size="sm" fw={600}>
                    {((currentDataPoint?.totalDamage || 0) * 100).toFixed(1)}%
                  </Text>
                </Group>
                <Progress
                  value={(currentDataPoint?.totalDamage || 0) * 100}
                  color={(currentDataPoint?.totalDamage || 0) > 0.7 ? 'red' : (currentDataPoint?.totalDamage || 0) > 0.4 ? 'orange' : 'yellow'}
                  size="xs"
                />

                <Group justify="space-between">
                  <Group gap="xs">
                    <IconClock size={16} color="#228be6" />
                    <Text size="sm">运行里程</Text>
                  </Group>
                  <Text size="sm" fw={600}>
                    {currentDataPoint?.mileage.toFixed(2) || 0} km
                  </Text>
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>

          {currentEvolutionState && (
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper p="sm" radius="sm" withBorder>
                <Group justify="space-between" mb="xs">
                  <Text fw={600} size="sm">结构状态</Text>
                  <Badge
                    color={currentEvolutionState.failedSpokes.length > 0 ? 'red' : 'green'}
                    variant="light"
                    size="sm"
                  >
                    {currentEvolutionState.failedSpokes.length} 根失效
                  </Badge>
                </Group>

                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text size="sm">安全系数</Text>
                    <Text size="sm" fw={600}>
                      {currentEvolutionState.safetyFactor.toFixed(2)}
                    </Text>
                  </Group>
                  <Progress
                    value={Math.min(100, currentEvolutionState.safetyFactor * 20)}
                    color={currentEvolutionState.safetyFactor < 1.5 ? 'red' : currentEvolutionState.safetyFactor < 2.5 ? 'orange' : 'green'}
                    size="xs"
                  />

                  <Group justify="space-between">
                    <Text size="sm">结构完整性</Text>
                    <Text size="sm" fw={600}>
                      {currentEvolutionState.structuralIntegrity.toFixed(1)}%
                    </Text>
                  </Group>
                  <Progress
                    value={currentEvolutionState.structuralIntegrity}
                    color={currentEvolutionState.structuralIntegrity < 40 ? 'red' : currentEvolutionState.structuralIntegrity < 70 ? 'orange' : 'green'}
                    size="xs"
                  />

                  <Group justify="space-between">
                    <Text size="sm">失效概率</Text>
                    <Text size="sm" fw={600}>
                      {(currentEvolutionState.failureProbability * 100).toFixed(1)}%
                    </Text>
                  </Group>
                  <Progress
                    value={currentEvolutionState.failureProbability * 100}
                    color={currentEvolutionState.failureProbability > 0.5 ? 'red' : currentEvolutionState.failureProbability > 0.2 ? 'orange' : 'yellow'}
                    size="xs"
                  />

                  <Group justify="space-between">
                    <Text size="sm">最大损伤轮辐</Text>
                    <Text size="sm" fw={600}>
                      #{currentEvolutionState.spokeDamages.indexOf(Math.max(...currentEvolutionState.spokeDamages)) + 1}
                      {" "}({(currentEvolutionState.maxDamage * 100).toFixed(1)}%)
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>
          )}
        </Grid>

        <Divider my="sm" />

        <Title order={5} mb="xs">失效事件时间线</Title>
        {playbackSession.failureEvents.length === 0 ? (
          <Paper bg="green.0" p="sm" radius="sm">
            <Group gap="xs">
              <IconCheck size={20} color="#2f9e44" />
              <Text c="green.9" fw={600}>
                本次仿真未检测到失效事件，车轮状态良好
              </Text>
            </Group>
          </Paper>
        ) : (
          <Stack gap="sm">
            {playbackSession.failureEvents.map((event, idx) => {
              const hasOccurred = eventsAtCurrentPoint.some((e) => e.id === event.id);
              return (
                <Card
                  key={event.id}
                  p="sm"
                  radius="md"
                  withBorder
                  bg={hasOccurred ? `${FAILURE_TYPE_COLORS[event.type]}.0` : 'gray.0'}
                  style={{
                    borderColor: hasOccurred ? undefined : '#e5e7eb',
                    opacity: hasOccurred ? 1 : 0.6,
                  }}
                >
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <ThemeIcon
                        size="md"
                        radius="md"
                        color={FAILURE_TYPE_COLORS[event.type]}
                        variant="filled"
                      >
                        <Text size="xs" fw={700}>{idx + 1}</Text>
                      </ThemeIcon>
                      <div>
                        <Text fw={600} size="sm">
                          {FAILURE_TYPE_LABELS[event.type]}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {event.cycle.toLocaleString()} 循环
                        </Text>
                      </div>
                    </Group>
                    <Group gap="xs">
                      <Badge color={SEVERITY_COLORS[event.severity]} size="sm">
                        {SEVERITY_LABELS[event.severity]}
                      </Badge>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => handleJumpToEvent(event)}
                      >
                        跳转
                      </Button>
                    </Group>
                  </Group>

                  <Text size="sm" mb="xs">{event.description}</Text>

                  <Grid gutter={4}>
                    <Grid.Col span={4}>
                      <Text size="xs" c="dimmed">受力: {event.forceAtFailure.toFixed(0)}N</Text>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Text size="xs" c="dimmed">应力: {(event.stressAtFailure / 1e6).toFixed(1)}MPa</Text>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Text size="xs" c="dimmed">损伤: {(event.damageAtFailure * 100).toFixed(0)}%</Text>
                    </Grid.Col>
                  </Grid>

                  <Group gap="xs" mt="xs">
                    <Text size="xs" c="dimmed">根本原因:</Text>
                    <Badge size="xs" variant="light">{event.rootCause}</Badge>
                  </Group>

                  {event.immediateActions.length > 0 && (
                    <Group gap="xs" mt="xs">
                      <Text size="xs" c="dimmed">应急措施:</Text>
                      {event.immediateActions.map((action, i) => (
                        <Badge key={i} size="xs" color="blue" variant="light">
                          {action}
                        </Badge>
                      ))}
                    </Group>
                  )}
                </Card>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
};

export default FailurePlaybackPanel;
