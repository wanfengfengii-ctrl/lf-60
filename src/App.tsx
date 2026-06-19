import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  AppShell,
  Container,
  Grid,
  Paper,
  Text,
  Title,
  Group,
  ThemeIcon,
  Box,
  Stack,
  Tabs,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconWheel,
  IconAlertTriangle,
  IconInfoCircle,
  IconCheck,
  IconX,
  IconFlame,
  IconChartBar,
  IconArrowsLeftRight,
  IconFileExport,
  IconStethoscope,
  IconTool,
} from '@tabler/icons-react';
import ControlPanel from './components/ControlPanel';
import Wheel3DView from './components/Wheel3DView';
import ForceCharts from './components/ForceCharts';
import SchemeManager from './components/SchemeManager';
import DurabilityPanel from './components/DurabilityPanel';
import ComparisonView from './components/ComparisonView';
import ReportExporter from './components/ReportExporter';
import FaultDiagnosisPanel from './components/FaultDiagnosisPanel';
import MaintenanceDecisionPanel from './components/MaintenanceDecisionPanel';
import { runSimulation, validateParameters } from './physics/simulation';
import {
  WheelParameters,
  SimulationResult,
  SavedScheme,
  FORCE_THRESHOLD,
  DEFAULT_PARAMETERS,
} from './types';

const STORAGE_KEY = 'chariot_wheel_schemes';

const App: React.FC = () => {
  const [parameters, setParameters] = useState<WheelParameters>(DEFAULT_PARAMETERS);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [previousExceededCount, setPreviousExceededCount] = useState<number>(-1);
  const [isLoadingScheme, setIsLoadingScheme] = useState(false);
  const [schemes, setSchemes] = useState<SavedScheme[]>([]);
  const [activeTab, setActiveTab] = useState<string>('force');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSchemes(JSON.parse(saved));
      } catch {
        setSchemes([]);
      }
    }
  }, []);

  const updateSchemes = useCallback((newSchemes: SavedScheme[]) => {
    setSchemes(newSchemes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSchemes));
  }, []);

  const errors = useMemo(() => validateParameters(parameters), [parameters]);
  const hasValidParams = errors.length === 0;

  useEffect(() => {
    if (isLoadingScheme) return;
    if (!hasValidParams) {
      setResult(null);
      setPreviousExceededCount(-1);
      return;
    }
    try {
      const simResult = runSimulation(parameters);
      setResult(simResult);
      const exceededCount = simResult.spokeData.filter(
        (s) => s.exceedsThreshold
      ).length;
      if (exceededCount !== previousExceededCount) {
        if (exceededCount > 0 && previousExceededCount === 0) {
          notifications.show({
            title: '警告：存在超载轮辐',
            message: `${exceededCount} 根轮辐超过承载阈值 (${FORCE_THRESHOLD.toLocaleString()} N)`,
            color: 'red',
            icon: <IconAlertTriangle size={18} />,
            autoClose: 6000,
          });
        } else if (exceededCount === 0 && previousExceededCount > 0) {
          notifications.show({
            title: '状态恢复安全',
            message: `所有 ${parameters.spokeCount} 根轮辐受力均在安全范围内`,
            color: 'green',
            icon: <IconCheck size={18} />,
          });
        }
        setPreviousExceededCount(exceededCount);
      }
    } catch {
      setResult(null);
    }
  }, [parameters, hasValidParams, isLoadingScheme, previousExceededCount]);

  const handleSimulate = useCallback(() => {
    if (!hasValidParams) {
      notifications.show({
        title: '参数错误',
        message: errors.map((e) => `• ${e}`).join('\n'),
        color: 'red',
        icon: <IconX size={18} />,
      });
      return;
    }
    notifications.show({
      title: '已刷新',
      message: '模拟结果已根据当前参数更新',
      color: 'blue',
      icon: <IconCheck size={18} />,
    });
  }, [hasValidParams, errors]);

  const handleLoadScheme = useCallback((scheme: SavedScheme) => {
    setIsLoadingScheme(true);
    setParameters(scheme.result.parameters);
    setResult(scheme.result);
    const exceededCount = scheme.result.spokeData.filter(
      (s) => s.exceedsThreshold
    ).length;
    setPreviousExceededCount(exceededCount);
    setTimeout(() => setIsLoadingScheme(false), 0);
  }, []);



  const statusInfo = useMemo(() => {
    if (!hasValidParams) {
      return { color: 'red', label: '参数无效', message: errors[0] || '请检查参数设置' };
    }
    if (!result) {
      return { color: 'gray', label: '计算中', message: '正在模拟计算...' };
    }
    const exceeded = result.spokeData.filter((s) => s.exceedsThreshold).length;
    if (exceeded > 0) {
      return { color: 'red', label: '超载警告', message: `${exceeded} 根轮辐超过阈值` };
    }
    if (result.maxForce > FORCE_THRESHOLD * 0.8) {
      return { color: 'orange', label: '接近上限', message: '最大受力接近承载阈值' };
    }
    if (result.fatigueAnalysis.totalDamage > 0.5) {
      return { color: 'orange', label: '损伤预警', message: '疲劳损伤累积较高' };
    }
    return { color: 'green', label: '状态良好', message: '所有轮辐安全运行' };
  }, [result, hasValidParams, errors]);

  return (
    <AppShell
      header={{ height: 64 }}
      padding="md"
      style={{ background: '#f8f9fa' }}
    >
      <AppShell.Header style={{ borderBottom: '1px solid #e5e7eb' }}>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="md" wrap="nowrap">
              <ThemeIcon size={44} radius="md" color="blue" variant="light">
                <IconWheel size={26} />
              </ThemeIcon>
              <div>
                <Text fw={700} size="lg" c="blue">
                  古战车车轮多工况耐久性评估系统
                </Text>
                <Text size="xs" c="dimmed">
                  Chariot Wheel Multi-Condition Durability Assessment System
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
                    statusInfo.color === 'red' ? '#ff6b6b'
                    : statusInfo.color === 'orange' ? '#ffa94d'
                    : statusInfo.color === 'green' ? '#40c057'
                    : '#ced4da',
                  background:
                    statusInfo.color === 'red' ? '#fff5f5'
                    : statusInfo.color === 'orange' ? '#fff4e6'
                    : statusInfo.color === 'green' ? '#ebfbee'
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
              <Stack gap="md">
                <ControlPanel
                  parameters={parameters}
                  onParametersChange={setParameters}
                  onSimulate={handleSimulate}
                  canSimulate={hasValidParams}
                />
                <SchemeManager
                  currentResult={result}
                  onLoadScheme={handleLoadScheme}
                  schemes={schemes}
                  onSchemesChange={updateSchemes}
                />
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 9 }}>
              <Grid gutter="lg">
                <Grid.Col span={12}>
                  <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="md">
                      <Title order={4}>三维车轮视图</Title>
                      <Group gap="xs">
                        <Badge color="blue" variant="light" size="sm">
                          {result?.material.name || '—'}
                        </Badge>
                        <Badge color="orange" variant="light" size="sm">
                          {result?.roadCondition.name || '—'}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          拖拽旋转 · 滚轮缩放
                        </Text>
                      </Group>
                    </Group>
                    {!result ? (
                      <Box
                        style={{
                          height: 450,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background:
                            'repeating-linear-gradient(45deg, #f8f9fa, #f8f9fa 10px, #f1f3f5 10px, #f1f3f5 20px)',
                          borderRadius: 8,
                        }}
                      >
                        <Stack align="center" gap="sm">
                          <ThemeIcon
                            size={64}
                            radius="md"
                            color={hasValidParams ? 'blue' : 'red'}
                            variant="light"
                          >
                            {hasValidParams ? (
                              <IconWheel size={36} />
                            ) : (
                              <IconAlertTriangle size={36} />
                            )}
                          </ThemeIcon>
                          {hasValidParams ? (
                            <Text c="dimmed" ta="center">正在加载车轮模型...</Text>
                          ) : (
                            <>
                              <Text c="red" fw={600} ta="center">参数无效，无法显示模型</Text>
                              <Text size="sm" c="dimmed" ta="center">{errors[0]}</Text>
                            </>
                          )}
                        </Stack>
                      </Box>
                    ) : (
                      <div style={{ height: 450 }}>
                        <Wheel3DView result={result} />
                      </div>
                    )}
                  </Paper>
                </Grid.Col>

                <Grid.Col span={12}>
                  <Tabs value={activeTab} onChange={(v) => setActiveTab(v || 'force')}>
                    <Tabs.List>
                      <Tabs.Tab
                        value="force"
                        leftSection={<IconChartBar size={16} />}
                      >
                        受力分析
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="durability"
                        leftSection={<IconFlame size={16} />}
                      >
                        耐久性评估
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="diagnosis"
                        leftSection={<IconStethoscope size={16} />}
                      >
                        故障诊断
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="maintenance"
                        leftSection={<IconTool size={16} />}
                      >
                        维修决策
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="comparison"
                        leftSection={<IconArrowsLeftRight size={16} />}
                      >
                        方案对比
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="report"
                        leftSection={<IconFileExport size={16} />}
                      >
                        报告导出
                      </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="force" pt="md">
                      <ForceCharts result={result} />
                    </Tabs.Panel>

                    <Tabs.Panel value="durability" pt="md">
                      <DurabilityPanel result={result} />
                    </Tabs.Panel>

                    <Tabs.Panel value="diagnosis" pt="md">
                      <FaultDiagnosisPanel result={result} />
                    </Tabs.Panel>

                    <Tabs.Panel value="maintenance" pt="md">
                      <MaintenanceDecisionPanel result={result} />
                    </Tabs.Panel>

                    <Tabs.Panel value="comparison" pt="md">
                      <ComparisonView schemes={schemes} />
                    </Tabs.Panel>

                    <Tabs.Panel value="report" pt="md">
                      <ReportExporter
                        result={result}
                        schemeName={result ? `方案_${new Date(result.timestamp).toLocaleString('zh-CN')}` : ''}
                      />
                    </Tabs.Panel>
                  </Tabs>
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
