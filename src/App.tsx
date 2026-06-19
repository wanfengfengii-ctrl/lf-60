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
  Button,
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
  IconCalendar,
  IconClock,
  IconUsers,
  IconPackage,
  IconDashboard,
  IconGauge,
  IconFileText,
  IconActivity,
  IconMap,
  IconRoute,
  IconBug,
  IconPlayerPlay,
  IconSettings,
  IconChartDots,
  IconSwords,
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
import WheelServicePhasePanel from './components/WheelServicePhasePanel';
import HistoricalFaultArchive from './components/HistoricalFaultArchive';
import MaintenanceSchedulePanel from './components/MaintenanceSchedulePanel';
import LifePredictionPanel from './components/LifePredictionPanel';
import ResourceSchedulingPanel from './components/ResourceSchedulingPanel';
import SparePartsAnalysisPanel from './components/SparePartsAnalysisPanel';
import FleetOperationDashboard from './components/FleetOperationDashboard';
import TimeSeriesPanel from './components/TimeSeriesPanel';
import BattlefieldTerrainPanel from './components/BattlefieldTerrainPanel';
import MissionGroupPanel from './components/MissionGroupPanel';
import DamageEvolutionPanel from './components/DamageEvolutionPanel';
import FailurePlaybackPanel from './components/FailurePlaybackPanel';
import StructuralOptimizationPanel from './components/StructuralOptimizationPanel';
import MultiSchemeDecisionPanel from './components/MultiSchemeDecisionPanel';
import CombatScenarioPanel from './components/CombatScenarioPanel';
import { runSimulation, validateParameters } from './physics/simulation';
import { generateAllFleetData } from './physics/fleetManagement';
import {
  generateTimeSeriesData,
  simulateDamageEvolution,
  createFailurePlaybackSession,
  generateOptimizationSchemes,
  evaluateMultiSchemeDecision,
  createMissionGroup,
} from './physics/digitalTwin';
import {
  WheelParameters,
  SimulationResult,
  SavedScheme,
  FORCE_THRESHOLD,
  DEFAULT_PARAMETERS,
  BATTLEFIELD_TERRAINS,
  MISSION_TEMPLATES,
  BattlefieldTerrain,
  LoadMission,
  MissionGroup,
  TimeSeriesRecord,
  DamageEvolutionResult,
  FailurePlaybackSession,
  StructuralOptimizationScheme,
  MultiSchemeDecisionResult,
} from './types';

const STORAGE_KEY = 'chariot_wheel_schemes';

const App: React.FC = () => {
  const [parameters, setParameters] = useState<WheelParameters>(DEFAULT_PARAMETERS);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [previousExceededCount, setPreviousExceededCount] = useState<number>(-1);
  const [isLoadingScheme, setIsLoadingScheme] = useState(false);
  const [schemes, setSchemes] = useState<SavedScheme[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('force');
  const [fleetData, setFleetData] = useState<any>(null);

  const [selectedTerrain, setSelectedTerrain] = useState<BattlefieldTerrain>(BATTLEFIELD_TERRAINS[0]);
  const [missionGroup, setMissionGroup] = useState<MissionGroup | null>(null);
  const [selectedMissions, setSelectedMissions] = useState<LoadMission[]>([MISSION_TEMPLATES[0]]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesRecord | null>(null);
  const [damageEvolutionResult, setDamageEvolutionResult] = useState<DamageEvolutionResult | null>(null);
  const [failurePlaybackSession, setFailurePlaybackSession] = useState<FailurePlaybackSession | null>(null);
  const [optimizationSchemes, setOptimizationSchemes] = useState<StructuralOptimizationScheme[]>([]);
  const [multiSchemeDecisionResult, setMultiSchemeDecisionResult] = useState<MultiSchemeDecisionResult | null>(null);
  const [isRunningAdvancedSimulation, setIsRunningAdvancedSimulation] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSchemes(JSON.parse(saved));
      } catch {
        setSchemes([]);
      }
    }

    const fleet = generateAllFleetData();
    setFleetData(fleet);
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

  const runAdvancedSimulation = useCallback(() => {
    if (!result || !hasValidParams) return;

    setIsRunningAdvancedSimulation(true);

    setTimeout(() => {
      try {
        const tsData = generateTimeSeriesData(result, parameters.operatingCycles, Math.floor(parameters.operatingCycles / 50));
        setTimeSeriesData(tsData);

        const deResult = simulateDamageEvolution(parameters, selectedTerrain, parameters.operatingCycles, 40);
        setDamageEvolutionResult(deResult);

        const fpSession = createFailurePlaybackSession('wheel_001', tsData, deResult);
        setFailurePlaybackSession(fpSession);

        if (selectedMissions.length > 0) {
          const mg = createMissionGroup(
            '自定义任务编组',
            `包含 ${selectedMissions.length} 个任务的自定义编组`,
            selectedMissions
          );
          setMissionGroup(mg);
        }

        const optSchemes = generateOptimizationSchemes(result, 6);
        setOptimizationSchemes(optSchemes);

        if (optSchemes.length > 0) {
          const decisionResult = evaluateMultiSchemeDecision(optSchemes);
          setMultiSchemeDecisionResult(decisionResult);
        }

        notifications.show({
          title: '高级仿真完成',
          message: '时序记录、损伤演化、失效回放、优化方案等数据已生成',
          color: 'green',
          icon: <IconCheck size={18} />,
        });
      } catch (error) {
        console.error('Advanced simulation error:', error);
        notifications.show({
          title: '高级仿真出错',
          message: '部分数据生成失败，请检查参数设置',
          color: 'red',
          icon: <IconAlertTriangle size={18} />,
        });
      } finally {
        setIsRunningAdvancedSimulation(false);
      }
    }, 800);
  }, [result, hasValidParams, parameters, selectedTerrain, selectedMissions]);

  const handleSelectTerrain = useCallback((terrainId: string) => {
    const terrain = BATTLEFIELD_TERRAINS.find(t => t.id === terrainId);
    if (terrain) {
      setSelectedTerrain(terrain);
      setParameters(prev => ({
        ...prev,
        impactIntensity: Math.max(prev.impactIntensity, terrain.impactMultiplier * 2),
        axleLoad: Math.min(prev.axleLoad, prev.axleLoad * (1 - terrain.loadReduction)),
      }));
    }
  }, []);

  const handleAddMission = useCallback((mission: LoadMission) => {
    setSelectedMissions(prev => [...prev, { ...mission, id: Math.random().toString(36).substring(2, 11) }]);
  }, []);

  const handleRemoveMission = useCallback((index: number) => {
    setSelectedMissions(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleReorderMissions = useCallback((fromIndex: number, toIndex: number) => {
    setSelectedMissions(prev => {
      const newMissions = [...prev];
      const [removed] = newMissions.splice(fromIndex, 1);
      newMissions.splice(toIndex, 0, removed);
      return newMissions;
    });
  }, []);

  const handleClearMissions = useCallback(() => {
    setSelectedMissions([]);
    setMissionGroup(null);
  }, []);

  const handleApplyScenarioConfig = useCallback((config: WheelParameters) => {
    setParameters(config);
  }, []);

  const handleApplyScenarioTerrain = useCallback((terrainId: string) => {
    handleSelectTerrain(terrainId);
  }, [handleSelectTerrain]);

  const handleSchemeSelect = useCallback((schemeId: string) => {
    setSelectedSchemeId(schemeId);
  }, []);

  const handleGenerateSchemes = useCallback(() => {
    if (!result) return;
    setIsRunningAdvancedSimulation(true);
    setTimeout(() => {
      const optSchemes = generateOptimizationSchemes(result, 6);
      setOptimizationSchemes(optSchemes);
      setSelectedSchemeId(optSchemes.length > 0 ? optSchemes[0].id : null);
      setIsRunningAdvancedSimulation(false);
      notifications.show({
        title: '优化方案已生成',
        message: `共生成 ${optSchemes.length} 个结构优化方案`,
        color: 'green',
        icon: <IconCheck size={18} />,
      });
    }, 800);
  }, [result]);

  const handleRunDecision = useCallback(() => {
    if (optimizationSchemes.length === 0) return;
    setIsRunningAdvancedSimulation(true);
    setTimeout(() => {
      const decisionResult = evaluateMultiSchemeDecision(optimizationSchemes);
      setMultiSchemeDecisionResult(decisionResult);
      setIsRunningAdvancedSimulation(false);
      notifications.show({
        title: '决策分析完成',
        message: `推荐方案: ${decisionResult.schemes.find(s => s.id === decisionResult.recommendedSchemeId)?.name}`,
        color: 'grape',
        icon: <IconCheck size={18} />,
      });
    }, 600);
  }, [optimizationSchemes]);

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
                  selectedTerrain={selectedTerrain}
                  onSelectTerrain={handleSelectTerrain}
                  onRunAdvancedSimulation={runAdvancedSimulation}
                  isRunningAdvancedSimulation={isRunningAdvancedSimulation}
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
                        value="service"
                        leftSection={<IconGauge size={16} />}
                      >
                        服役管理
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="faults"
                        leftSection={<IconFileText size={16} />}
                      >
                        故障档案
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="schedule"
                        leftSection={<IconCalendar size={16} />}
                      >
                        养护排程
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="life"
                        leftSection={<IconClock size={16} />}
                      >
                        寿命预测
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="resources"
                        leftSection={<IconUsers size={16} />}
                      >
                        资源调度
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="spareparts"
                        leftSection={<IconPackage size={16} />}
                      >
                        备件分析
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="fleet"
                        leftSection={<IconDashboard size={16} />}
                      >
                        车队看板
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
                      <Tabs.Tab
                        value="timeSeries"
                        leftSection={<IconActivity size={16} />}
                      >
                        时序记录
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="terrain"
                        leftSection={<IconMap size={16} />}
                      >
                        战场地形
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="mission"
                        leftSection={<IconRoute size={16} />}
                      >
                        任务编组
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="damage"
                        leftSection={<IconBug size={16} />}
                      >
                        损伤演化
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="playback"
                        leftSection={<IconPlayerPlay size={16} />}
                      >
                        失效回放
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="optimization"
                        leftSection={<IconSettings size={16} />}
                      >
                        结构优化
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="decision"
                        leftSection={<IconChartDots size={16} />}
                      >
                        方案决策
                      </Tabs.Tab>
                      <Tabs.Tab
                        value="scenario"
                        leftSection={<IconSwords size={16} />}
                      >
                        战役推演
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

                    <Tabs.Panel value="service" pt="md">
                      {fleetData && (
                        <WheelServicePhasePanel
                          wheels={fleetData.wheels}
                        />
                      )}
                    </Tabs.Panel>

                    <Tabs.Panel value="faults" pt="md">
                      {fleetData && (
                        <HistoricalFaultArchive
                          faults={fleetData.faults}
                          patterns={fleetData.faultPatterns}
                        />
                      )}
                    </Tabs.Panel>

                    <Tabs.Panel value="schedule" pt="md">
                      {fleetData && (
                        <MaintenanceSchedulePanel
                          schedule={fleetData.maintenanceSchedule}
                        />
                      )}
                    </Tabs.Panel>

                    <Tabs.Panel value="life" pt="md">
                      {fleetData && (
                        <LifePredictionPanel
                          predictions={fleetData.lifePredictions}
                          wheels={fleetData.wheels}
                        />
                      )}
                    </Tabs.Panel>

                    <Tabs.Panel value="resources" pt="md">
                      {fleetData && (
                        <ResourceSchedulingPanel
                          technicians={fleetData.technicians}
                          equipment={fleetData.equipment}
                          schedules={fleetData.resourceSchedules}
                          tasks={fleetData.maintenanceTasks}
                        />
                      )}
                    </Tabs.Panel>

                    <Tabs.Panel value="spareparts" pt="md">
                      {fleetData && (
                        <SparePartsAnalysisPanel
                          spareParts={fleetData.spareParts}
                          consumptions={fleetData.sparePartConsumptions}
                          analyses={fleetData.sparePartAnalyses}
                        />
                      )}
                    </Tabs.Panel>

                    <Tabs.Panel value="fleet" pt="md">
                      {fleetData && (
                        <FleetOperationDashboard
                          fleetData={fleetData.fleetOperationData}
                          vehicles={fleetData.fleet.vehicles}
                        />
                      )}
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

                    <Tabs.Panel value="timeSeries" pt="md">
                      {!timeSeriesData ? (
                        <Stack gap="md" align="center">
                          <Paper shadow="sm" p="xl" radius="md" withBorder>
                            <Stack align="center" gap="md">
                              <IconActivity size={48} color="#adb5bd" />
                              <Text c="dimmed" ta="center">
                                暂无时序记录数据
                              </Text>
                              <Text size="sm" c="dimmed" ta="center">
                                请先配置参数，然后点击下方按钮运行高级仿真生成时序数据
                              </Text>
                              <Button
                                onClick={runAdvancedSimulation}
                                loading={isRunningAdvancedSimulation}
                                disabled={!result || !hasValidParams}
                                color="blue"
                              >
                                运行高级仿真
                              </Button>
                            </Stack>
                          </Paper>
                        </Stack>
                      ) : (
                        <TimeSeriesPanel timeSeries={timeSeriesData} />
                      )}
                    </Tabs.Panel>

                    <Tabs.Panel value="terrain" pt="md">
                      <BattlefieldTerrainPanel
                        selectedTerrainId={selectedTerrain.id}
                        onSelectTerrain={handleSelectTerrain}
                      />
                    </Tabs.Panel>

                    <Tabs.Panel value="mission" pt="md">
                      <MissionGroupPanel
                        selectedMissions={selectedMissions}
                        onAddMission={handleAddMission}
                        onRemoveMission={handleRemoveMission}
                        onReorderMissions={handleReorderMissions}
                        onClearMissions={handleClearMissions}
                        onRunSimulation={runAdvancedSimulation}
                        isSimulating={isRunningAdvancedSimulation}
                        missionGroup={missionGroup}
                      />
                    </Tabs.Panel>

                    <Tabs.Panel value="damage" pt="md">
                      {!damageEvolutionResult ? (
                        <Stack gap="md" align="center">
                          <Paper shadow="sm" p="xl" radius="md" withBorder>
                            <Stack align="center" gap="md">
                              <IconBug size={48} color="#adb5bd" />
                              <Text c="dimmed" ta="center">
                                暂无损伤演化数据
                              </Text>
                              <Text size="sm" c="dimmed" ta="center">
                                请先配置参数，然后点击下方按钮运行高级仿真
                              </Text>
                              <Button
                                onClick={runAdvancedSimulation}
                                loading={isRunningAdvancedSimulation}
                                disabled={!result || !hasValidParams}
                                color="blue"
                              >
                                运行高级仿真
                              </Button>
                            </Stack>
                          </Paper>
                        </Stack>
                      ) : (
                        <DamageEvolutionPanel damageEvolution={damageEvolutionResult} />
                      )}
                    </Tabs.Panel>

                    <Tabs.Panel value="playback" pt="md">
                      {!failurePlaybackSession ? (
                        <Stack gap="md" align="center">
                          <Paper shadow="sm" p="xl" radius="md" withBorder>
                            <Stack align="center" gap="md">
                              <IconPlayerPlay size={48} color="#adb5bd" />
                              <Text c="dimmed" ta="center">
                                暂无失效回放数据
                              </Text>
                              <Text size="sm" c="dimmed" ta="center">
                                请先配置参数，然后点击下方按钮运行高级仿真
                              </Text>
                              <Button
                                onClick={runAdvancedSimulation}
                                loading={isRunningAdvancedSimulation}
                                disabled={!result || !hasValidParams}
                                color="blue"
                              >
                                运行高级仿真
                              </Button>
                            </Stack>
                          </Paper>
                        </Stack>
                      ) : (
                        <FailurePlaybackPanel playbackSession={failurePlaybackSession} />
                      )}
                    </Tabs.Panel>

                    <Tabs.Panel value="optimization" pt="md">
                      {optimizationSchemes.length === 0 ? (
                        <Stack gap="md" align="center">
                          <Paper shadow="sm" p="xl" radius="md" withBorder>
                            <Stack align="center" gap="md">
                              <IconSettings size={48} color="#adb5bd" />
                              <Text c="dimmed" ta="center">
                                暂无结构优化方案
                              </Text>
                              <Text size="sm" c="dimmed" ta="center">
                                请先配置参数，然后点击下方按钮运行高级仿真生成优化方案
                              </Text>
                              <Button
                                onClick={runAdvancedSimulation}
                                loading={isRunningAdvancedSimulation}
                                disabled={!result || !hasValidParams}
                                color="blue"
                              >
                                运行高级仿真
                              </Button>
                            </Stack>
                          </Paper>
                        </Stack>
                      ) : (
                        <StructuralOptimizationPanel
                          schemes={optimizationSchemes}
                          selectedSchemeId={selectedSchemeId}
                          onSchemeSelect={handleSchemeSelect}
                          onGenerateSchemes={handleGenerateSchemes}
                          isGenerating={isRunningAdvancedSimulation}
                          baseParameters={parameters}
                        />
                      )}
                    </Tabs.Panel>

                    <Tabs.Panel value="decision" pt="md">
                      {!multiSchemeDecisionResult ? (
                        <Stack gap="md" align="center">
                          <Paper shadow="sm" p="xl" radius="md" withBorder>
                            <Stack align="center" gap="md">
                              <IconChartDots size={48} color="#adb5bd" />
                              <Text c="dimmed" ta="center">
                                暂无多方案决策数据
                              </Text>
                              <Text size="sm" c="dimmed" ta="center">
                                请先配置参数，然后点击下方按钮运行高级仿真生成决策评估
                              </Text>
                              <Button
                                onClick={runAdvancedSimulation}
                                loading={isRunningAdvancedSimulation}
                                disabled={!result || !hasValidParams}
                                color="blue"
                              >
                                运行高级仿真
                              </Button>
                            </Stack>
                          </Paper>
                        </Stack>
                      ) : (
                        <MultiSchemeDecisionPanel
                          decisionResult={multiSchemeDecisionResult}
                          onRunDecision={handleRunDecision}
                          isRunning={isRunningAdvancedSimulation}
                          schemes={optimizationSchemes}
                        />
                      )}
                    </Tabs.Panel>

                    <Tabs.Panel value="scenario" pt="md">
                      <CombatScenarioPanel
                        onSelectConfiguration={handleApplyScenarioConfig}
                        onSelectTerrain={handleApplyScenarioTerrain}
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
