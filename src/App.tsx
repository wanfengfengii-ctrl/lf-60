import React, { useState, useCallback, useMemo } from 'react';
import {
  AppShell,
  Header,
  Title,
  Container,
  Grid,
  Paper,
  Text,
  Group,
  ThemeIcon,
  Box,
  Divider,
  Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconWheel,
  IconAlertTriangle,
  IconInfoCircle,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import ControlPanel from './components/ControlPanel';
import Wheel3DView from './components/Wheel3DView';
import ForceCharts from './components/ForceCharts';
import SchemeManager from './components/SchemeManager';
import { runSimulation, validateParameters } from './physics/simulation';
import {
  WheelParameters,
  SimulationResult,
  SavedScheme,
  FORCE_THRESHOLD,
} from './types';

const DEFAULT_PARAMETERS: WheelParameters = {
  wheelRadius: 1.0,
  spokeCount: 12,
  axleLoad: 500,
  impactIntensity: 2.0,
};

const App: React.FC = () => {
  const [parameters, setParameters] = useState<WheelParameters>(DEFAULT_PARAMETERS);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  const errors = useMemo(() => validateParameters(parameters), [parameters]);
  const hasValidParams = errors.length === 0;

  const handleSimulate = useCallback(() => {
    try {
      const validationErrors = validateParameters(parameters);
      if (validationErrors.length > 0) {
        notifications.show({
          title: '参数错误',
          message: validationErrors.map((e) => `• ${e}`).join('\n'),
          color: 'red',
          icon: <IconX size={18} />,
        });
        return;
      }

      const simResult = runSimulation(parameters);
      setResult(simResult);
      setIsSimulated(true);

      const exceededCount = simResult.spokeData.filter(
        (s) => s.exceedsThreshold
      ).length;

      if (exceededCount > 0) {
        notifications.show({
          title: '警告：存在超载轮辐',
          message: `${exceededCount} 根轮辐超过承载阈值 (${FORCE_THRESHOLD.toLocaleString()} N)，建议增加轮辐数量或减少载重`,
          color: 'red',
          icon: <IconAlertTriangle size={18} />,
          autoClose: 6000,
        });
      } else {
        notifications.show({
          title: '模拟完成',
          message: `所有 ${parameters.spokeCount} 根轮辐受力均在安全范围内`,
          color: 'green',
          icon: <IconCheck size={18} />,
        });
      }
    } catch (err) {
      notifications.show({
        title: '模拟失败',
        message: err instanceof Error ? err.message : '未知错误',
        color: 'red',
        icon: <IconX size={18} />,
      });
    }
  }, [parameters]);

  const handleLoadScheme = useCallback((scheme: SavedScheme) => {
    setParameters(scheme.result.parameters);
    setResult(scheme.result);
    setIsSimulated(true);
  }, []);

  const statusInfo = useMemo(() => {
    if (!result) {
      return {
        color: 'gray',
        label: '未运行',
        message: '调整参数后点击"运行模拟"',
      };
    }
    const exceeded = result.spokeData.filter((s) => s.exceedsThreshold).length;
    if (exceeded > 0) {
      return {
        color: 'red',
        label: '超载警告',
        message: `${exceeded} 根轮辐超过阈值`,
      };
    }
    if (result.maxForce > FORCE_THRESHOLD * 0.8) {
      return {
        color: 'orange',
        label: '接近上限',
        message: '最大受力接近承载阈值',
      };
    }
    return {
      color: 'green',
      label: '状态良好',
      message: '所有轮辐安全运行',
    };
  }, [result]);

  return (
    <AppShell
      header={{ height: 70 }}
      padding="md"
      style={{ background: '#f8f9fa' }}
    >
      <AppShell.Header style={{ borderBottom: '1px solid #e5e7eb' }}>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="md" wrap="nowrap">
              <ThemeIcon size={48} radius="md" color="blue" variant="light">
                <IconWheel size={28} />
              </ThemeIcon>
              <div>
                <Title order={3} c="blue">
                  古战车车轮受力模拟器
                </Title>
                <Text size="xs" c="dimmed">
                  Chariot Wheel Force Simulator — 结构力学分析系统
                </Text>
              </div>
            </Group>
            <Group gap="md" wrap="nowrap">
              <Paper
                p="xs"
                radius="md"
                withBorder
                style={{
                  borderColor:
                    statusInfo.color === 'red'
                      ? '#ff6b6b'
                      : statusInfo.color === 'orange'
                      ? '#ffa94d'
                      : statusInfo.color === 'green'
                      ? '#40c057'
                      : '#ced4da',
                  background:
                    statusInfo.color === 'red'
                      ? '#fff5f5'
                      : statusInfo.color === 'orange'
                      ? '#fff4e6'
                      : statusInfo.color === 'green'
                      ? '#ebfbee'
                      : '#f8f9fa',
                }}
              >
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon
                    size="sm"
                    radius="full"
                    color={statusInfo.color as any}
                    variant="filled"
                  >
                    <IconInfoCircle size={14} />
                  </ThemeIcon>
                  <div style={{ lineHeight: 1.2 }}>
                    <Text fw={600} size="sm" c={statusInfo.color}>
                      {statusInfo.label}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {statusInfo.message}
                    </Text>
                  </div>
                </Group>
              </Paper>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          <Grid gutter="lg">
            <Grid.Col span={{ base: 12, md: 3 }}>
              <ControlPanel
                parameters={parameters}
                onParametersChange={setParameters}
                onSimulate={handleSimulate}
                canSimulate={hasValidParams}
              />
              <Divider my="md" />
              <SchemeManager
                currentResult={result}
                onLoadScheme={handleLoadScheme}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 9 }}>
              <Grid gutter="lg">
                <Grid.Col span={12}>
                  <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="md">
                      <Title order={4}>三维车轮视图</Title>
                      <Group gap="xs">
                        <Text size="xs" c="dimmed">
                          💡 拖拽旋转 · 滚轮缩放
                        </Text>
                      </Group>
                    </Group>
                    {!isSimulated ? (
                      <Box
                        style={{
                          height: 500,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background:
                            'repeating-linear-gradient(45deg, #f8f9fa, #f8f9fa 10px, #f1f3f5 10px, #f1f3f5 20px)',
                          borderRadius: 8,
                        }}
                      >
                        <Stack align="center" gap="sm">
                          <ThemeIcon size={64} radius="md" color="blue" variant="light">
                            <IconWheel size={36} />
                          </ThemeIcon>
                          <Text c="dimmed" ta="center">
                            调整左侧参数后点击
                            <Text fw={600} c="blue" component="span" mx="xs">
                              "运行模拟"
                            </Text>
                            查看车轮三维模型
                          </Text>
                        </Stack>
                      </Box>
                    ) : (
                      <div style={{ height: 500 }}>
                        <Wheel3DView result={result} />
                      </div>
                    )}
                  </Paper>
                </Grid.Col>

                <Grid.Col span={12}>
                  <ForceCharts result={result} />
                </Grid.Col>

                <Grid.Col span={12}>
                  <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Title order={5} mb="md">
                      📖 使用说明
                    </Title>
                    <Grid>
                      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Text fw={600} size="sm" mb="xs" c="blue">
                          1️⃣ 配置参数
                        </Text>
                        <Text size="xs" c="dimmed" lh={1.6}>
                          设置车轮半径（0.1~3m）、轮辐数量（3~36根）、车轴载重（10~2000kg）及路面冲击强度（0~10）。
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Text fw={600} size="sm" mb="xs" c="orange">
                          2️⃣ 运行模拟
                        </Text>
                        <Text size="xs" c="dimmed" lh={1.6}>
                          验证参数有效后点击运行模拟，系统将根据物理模型计算每根轮辐的静态受力和冲击受力。
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Text fw={600} size="sm" mb="xs" c="red">
                          3️⃣ 查看高亮
                        </Text>
                        <Text size="xs" c="dimmed" lh={1.6}>
                          三维视图中：绿色=安全，黄色=中等，橙色=偏高，红色=超载（超过8000N阈值）。
                        </Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                        <Text fw={600} size="sm" mb="xs" c="green">
                          4️⃣ 保存方案
                        </Text>
                        <Text size="xs" c="dimmed" lh={1.6}>
                          保存完整参数和图表结果，支持随时加载历史方案或导出JSON文件分享。
                        </Text>
                      </Grid.Col>
                    </Grid>
                  </Paper>
                </Grid.Col>
              </Grid>
            </Grid.Col>
          </Grid>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default App;
