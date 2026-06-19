import React from 'react';
import { Paper, Title, NumberInput, Slider, Stack, Text, Alert, Box, Group, Button, Divider, Badge, Select, SegmentedControl, Tooltip } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconRefresh, IconTool, IconMap, IconActivity } from '@tabler/icons-react';
import { WheelParameters, FORCE_THRESHOLD, MATERIALS, ROAD_CONDITIONS, getMaterialById, getRoadConditionById, BATTLEFIELD_TERRAINS, BattlefieldTerrain } from '../types';
import { validateParameters } from '../physics/simulation';

interface ControlPanelProps {
  parameters: WheelParameters;
  onParametersChange: (params: WheelParameters) => void;
  onSimulate: () => void;
  canSimulate: boolean;
  selectedTerrain?: BattlefieldTerrain;
  onSelectTerrain?: (terrainId: string) => void;
  onRunAdvancedSimulation?: () => void;
  isRunningAdvancedSimulation?: boolean;
}

const LOG_MARKS = [
  { value: 0, label: '1K' },
  { value: 25, label: '10K' },
  { value: 50, label: '100K' },
  { value: 75, label: '1M' },
  { value: 100, label: '10M' },
];

function cyclesToSlider(cycles: number): number {
  const minLog = Math.log10(1000);
  const maxLog = Math.log10(10000000);
  const clamped = Math.max(minLog, Math.min(maxLog, Math.log10(Math.max(1, cycles))));
  return ((clamped - minLog) / (maxLog - minLog)) * 100;
}

function sliderToCycles(sliderVal: number): number {
  const minLog = Math.log10(1000);
  const maxLog = Math.log10(10000000);
  const logVal = minLog + (sliderVal / 100) * (maxLog - minLog);
  return Math.round(Math.pow(10, logVal));
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  parameters,
  onParametersChange,
  onSimulate,
  canSimulate,
  selectedTerrain,
  onSelectTerrain,
  onRunAdvancedSimulation,
  isRunningAdvancedSimulation = false,
}) => {
  const form = useForm<WheelParameters>({
    initialValues: parameters,
  });

  const validationErrors = validateParameters(form.values);
  const isValid = validationErrors.length === 0;

  const handleChange = (field: keyof WheelParameters, value: number | string) => {
    const updated = { ...form.values, [field]: value };
    form.setValues(updated);
    onParametersChange(updated);
  };

  React.useEffect(() => {
    form.setValues(parameters);
  }, [parameters]);

  const currentMaterial = getMaterialById(form.values.materialId);
  const currentRoad = getRoadConditionById(form.values.roadConditionId);

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <IconTool size={20} />
            <Title order={4}>参数配置</Title>
          </Group>
          <Badge color="blue" variant="light">
            阈值: {FORCE_THRESHOLD.toLocaleString()} N
          </Badge>
        </Group>

        <Divider label="基础结构参数" labelPosition="center" />

        <Box>
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm">车轮半径</Text>
            <Text size="sm" c="dimmed">{form.values.wheelRadius.toFixed(2)} m</Text>
          </Group>
          <NumberInput
            placeholder="车轮半径"
            min={0.1}
            max={3}
            step={0.05}
            decimalScale={2}
            hideControls
            value={form.values.wheelRadius}
            onChange={(value) => handleChange('wheelRadius', typeof value === 'number' ? value : 0.1)}
            mb="xs"
          />
          <Slider
            value={form.values.wheelRadius}
            onChange={(value) => handleChange('wheelRadius', value)}
            min={0.1}
            max={3}
            step={0.05}
            marks={[
              { value: 0.5, label: '0.5m' },
              { value: 1.5, label: '1.5m' },
              { value: 2.5, label: '2.5m' },
            ]}
          />
        </Box>

        <Box>
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm">轮辐数量</Text>
            <Text size="sm" c="dimmed">{form.values.spokeCount} 根</Text>
          </Group>
          <NumberInput
            placeholder="轮辐数量"
            min={3}
            max={36}
            step={1}
            hideControls
            value={form.values.spokeCount}
            onChange={(value) => handleChange('spokeCount', typeof value === 'number' ? Math.max(3, Math.floor(value)) : 3)}
            mb="xs"
          />
          <Slider
            value={form.values.spokeCount}
            onChange={(value) => handleChange('spokeCount', value)}
            min={3}
            max={36}
            step={1}
            marks={[
              { value: 6, label: '6' },
              { value: 12, label: '12' },
              { value: 24, label: '24' },
            ]}
          />
        </Box>

        <Divider label="载荷与冲击" labelPosition="center" />

        <Box>
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm">车轴载重</Text>
            <Text size="sm" c="dimmed">{form.values.axleLoad.toFixed(1)} kg</Text>
          </Group>
          <NumberInput
            placeholder="车轴载重"
            min={10}
            max={2000}
            step={10}
            decimalScale={1}
            hideControls
            value={form.values.axleLoad}
            onChange={(value) => handleChange('axleLoad', typeof value === 'number' ? value : 10)}
            mb="xs"
          />
          <Slider
            value={form.values.axleLoad}
            onChange={(value) => handleChange('axleLoad', value)}
            min={10}
            max={2000}
            step={10}
            marks={[
              { value: 200, label: '200kg' },
              { value: 1000, label: '1吨' },
              { value: 1800, label: '1.8吨' },
            ]}
          />
        </Box>

        <Box>
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm">路面冲击强度</Text>
            <Text size="sm" c="dimmed">{form.values.impactIntensity.toFixed(2)}</Text>
          </Group>
          <NumberInput
            placeholder="路面冲击强度"
            min={0}
            max={10}
            step={0.1}
            decimalScale={2}
            hideControls
            value={form.values.impactIntensity}
            onChange={(value) => handleChange('impactIntensity', typeof value === 'number' ? Math.max(0, value) : 0)}
            mb="xs"
          />
          <Slider
            value={form.values.impactIntensity}
            onChange={(value) => handleChange('impactIntensity', value)}
            min={0}
            max={10}
            step={0.1}
            marks={[
              { value: 0, label: '平稳' },
              { value: 3, label: '轻微' },
              { value: 7, label: '剧烈' },
              { value: 10, label: '极端' },
            ]}
          />
        </Box>

        <Box>
          <Text fw={500} size="sm" mb="xs">路况类型</Text>
          <SegmentedControl
            fullWidth
            value={form.values.roadConditionId}
            onChange={(value) => handleChange('roadConditionId', value)}
            data={ROAD_CONDITIONS.map((rc) => ({
              value: rc.id,
              label: (
                <Tooltip label={rc.description} key={rc.id}>
                  <Text size="xs" ta="center">
                    {rc.icon} {rc.name}
                  </Text>
                </Tooltip>
              ),
            }))}
          />
          <Text size="xs" c="dimmed" mt={4}>
            {currentRoad.icon} {currentRoad.name} — {currentRoad.description}
          </Text>
        </Box>

        <Divider label="材料与截面" labelPosition="center" />

        <Box>
          <Text fw={500} size="sm" mb="xs">轮辐材料</Text>
          <Select
            value={form.values.materialId}
            onChange={(value) => handleChange('materialId', value ?? 'elm')}
            data={MATERIALS.map((m) => ({
              value: m.id,
              label: `${m.name} (${m.nameEn})`,
            }))}
            allowDeselect={false}
          />
          <Text size="xs" c="dimmed" mt={4}>
            {currentMaterial.description}
          </Text>
          <Paper bg="gray.0" p="xs" radius="sm" mt="xs">
            <Group gap="md" justify="center">
              <Box>
                <Text size="xs" c="dimmed">疲劳极限</Text>
                <Text size="sm" fw={600}>{(currentMaterial.enduranceLimit / 1e6).toFixed(0)} MPa</Text>
              </Box>
              <Divider orientation="vertical" />
              <Box>
                <Text size="xs" c="dimmed">抗拉强度</Text>
                <Text size="sm" fw={600}>{(currentMaterial.tensileStrength / 1e6).toFixed(0)} MPa</Text>
              </Box>
              <Divider orientation="vertical" />
              <Box>
                <Text size="xs" c="dimmed">弹性模量</Text>
                <Text size="sm" fw={600}>{(currentMaterial.elasticModulus / 1e9).toFixed(1)} GPa</Text>
              </Box>
            </Group>
          </Paper>
        </Box>

        <Box>
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm">轮辐宽度</Text>
            <Text size="sm" c="dimmed">{(form.values.spokeWidth * 100).toFixed(1)} cm</Text>
          </Group>
          <NumberInput
            placeholder="轮辐宽度"
            min={2}
            max={15}
            step={0.1}
            decimalScale={1}
            hideControls
            suffix=" cm"
            value={parseFloat((form.values.spokeWidth * 100).toFixed(1))}
            onChange={(value) => {
              const meters = (typeof value === 'number' ? value : 2) / 100;
              handleChange('spokeWidth', Math.max(0.02, Math.min(0.15, meters)));
            }}
            mb="xs"
          />
          <Slider
            value={parseFloat((form.values.spokeWidth * 100).toFixed(1))}
            onChange={(value) => handleChange('spokeWidth', value / 100)}
            min={2}
            max={15}
            step={0.1}
            marks={[
              { value: 3, label: '3cm' },
              { value: 8, label: '8cm' },
              { value: 13, label: '13cm' },
            ]}
          />
        </Box>

        <Box>
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm">轮辐高度</Text>
            <Text size="sm" c="dimmed">{(form.values.spokeHeight * 100).toFixed(1)} cm</Text>
          </Group>
          <NumberInput
            placeholder="轮辐高度"
            min={2}
            max={20}
            step={0.1}
            decimalScale={1}
            hideControls
            suffix=" cm"
            value={parseFloat((form.values.spokeHeight * 100).toFixed(1))}
            onChange={(value) => {
              const meters = (typeof value === 'number' ? value : 2) / 100;
              handleChange('spokeHeight', Math.max(0.02, Math.min(0.20, meters)));
            }}
            mb="xs"
          />
          <Slider
            value={parseFloat((form.values.spokeHeight * 100).toFixed(1))}
            onChange={(value) => handleChange('spokeHeight', value / 100)}
            min={2}
            max={20}
            step={0.1}
            marks={[
              { value: 4, label: '4cm' },
              { value: 10, label: '10cm' },
              { value: 16, label: '16cm' },
            ]}
          />
        </Box>

        <Divider label="运行工况" labelPosition="center" />

        <Box>
          <Group justify="space-between" mb="xs">
            <Text fw={500} size="sm">运行循环次数</Text>
            <Text size="sm" c="dimmed">{form.values.operatingCycles.toLocaleString()} 次</Text>
          </Group>
          <NumberInput
            placeholder="运行循环次数"
            min={1000}
            max={10000000}
            step={1000}
            hideControls
            value={form.values.operatingCycles}
            onChange={(value) => handleChange('operatingCycles', typeof value === 'number' ? Math.max(1000, Math.round(value)) : 1000)}
            mb="xs"
          />
          <Slider
            value={cyclesToSlider(form.values.operatingCycles)}
            onChange={(value) => handleChange('operatingCycles', sliderToCycles(value))}
            min={0}
            max={100}
            step={0.1}
            marks={LOG_MARKS}
          />
        </Box>

        {!isValid && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="参数错误"
            color="red"
            variant="light"
          >
            {validationErrors.map((err, idx) => (
              <Text key={idx} size="sm">• {err}</Text>
            ))}
          </Alert>
        )}

        {selectedTerrain && onSelectTerrain && (
          <>
            <Divider label="战场地形" labelPosition="center" />

            <Box>
              <Group gap="xs" mb="xs">
                <IconMap size={14} />
                <Text fw={500} size="sm">选择战场环境</Text>
              </Group>
              <Select
                value={selectedTerrain.id}
                onChange={(value) => value && onSelectTerrain(value)}
                data={BATTLEFIELD_TERRAINS.map((t) => ({
                  value: t.id,
                  label: `${t.icon} ${t.name}`,
                }))}
                allowDeselect={false}
                size="sm"
              />
              <Group gap="xs" mt="xs" wrap="nowrap">
                <Badge color="orange" variant="light" size="sm">
                  冲击 {selectedTerrain.impactMultiplier.toFixed(1)}x
                </Badge>
                <Badge color="red" variant="light" size="sm">
                  频率 {selectedTerrain.frequencyFactor.toFixed(1)}x
                </Badge>
                <Badge color="yellow" variant="light" size="sm">
                  限速 {selectedTerrain.speedLimit}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
                {selectedTerrain.description}
              </Text>
            </Box>
          </>
        )}

        <Button
          fullWidth
          leftSection={<IconRefresh size={18} />}
          onClick={onSimulate}
          disabled={!isValid || !canSimulate}
          color="blue"
          size="md"
        >
          {isValid ? '运行模拟 / 刷新结果' : '请修正参数后运行'}
        </Button>

        {onRunAdvancedSimulation && (
          <Button
            fullWidth
            leftSection={<IconActivity size={18} />}
            onClick={onRunAdvancedSimulation}
            loading={isRunningAdvancedSimulation}
            disabled={!isValid || !canSimulate}
            color="violet"
            variant="light"
            size="md"
          >
            高级仿真 (时序/损伤/优化)
          </Button>
        )}
      </Stack>
    </Paper>
  );
};

export default ControlPanel;
