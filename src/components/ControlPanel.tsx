import React from 'react';
import {
  Paper,
  Title,
  NumberInput,
  Slider,
  Stack,
  Text,
  Alert,
  Box,
  Group,
  Button,
  Divider,
  Badge,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { WheelParameters, FORCE_THRESHOLD } from '../types';
import { validateParameters } from '../physics/simulation';

interface ControlPanelProps {
  parameters: WheelParameters;
  onParametersChange: (params: WheelParameters) => void;
  onSimulate: () => void;
  canSimulate: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  parameters,
  onParametersChange,
  onSimulate,
  canSimulate,
}) => {
  const form = useForm<WheelParameters>({
    initialValues: parameters,
    validate: {
      wheelRadius: (value) =>
        value > 0 ? null : '车轮半径必须大于 0',
      spokeCount: (value) =>
        value > 0 && Number.isInteger(value)
          ? null
          : '轮辐数量必须是大于 0 的整数',
      axleLoad: (value) =>
        value > 0 ? null : '车轴载重必须大于 0',
      impactIntensity: (value) =>
        value >= 0 ? null : '路面冲击强度不能为负数',
    },
  });

  const validationErrors = validateParameters(form.values);
  const isValid = validationErrors.length === 0;

  const handleChange = (field: keyof WheelParameters, value: number) => {
    form.setFieldValue(field, value);
    onParametersChange({ ...form.values, [field]: value });
  };

  React.useEffect(() => {
    form.setValues(parameters);
  }, [parameters]);

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={4}>参数配置</Title>
          <Badge color="blue" variant="light">
            阈值: {FORCE_THRESHOLD.toLocaleString()} N
          </Badge>
        </Group>

        <Divider />

        <Stack gap="lg">
          <Box>
            <Group justify="space-between" mb="xs">
              <Text fw={500} size="sm">
                车轮半径
              </Text>
              <Text size="sm" c="dimmed">
                {form.values.wheelRadius.toFixed(2)} m
              </Text>
            </Group>
            <NumberInput
              placeholder="车轮半径"
              min={0.1}
              step={0.05}
              precision={2}
              hideControls
              error={form.errors.wheelRadius}
              value={form.values.wheelRadius}
              onChange={(value) =>
                handleChange('wheelRadius', typeof value === 'number' ? value : 0)
              }
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
              <Text fw={500} size="sm">
                轮辐数量
              </Text>
              <Text size="sm" c="dimmed">
                {form.values.spokeCount} 根
              </Text>
            </Group>
            <NumberInput
              placeholder="轮辐数量"
              min={1}
              step={1}
              hideControls
              error={form.errors.spokeCount}
              value={form.values.spokeCount}
              onChange={(value) =>
                handleChange(
                  'spokeCount',
                  typeof value === 'number' ? Math.max(1, Math.floor(value)) : 1
                )
              }
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

          <Box>
            <Group justify="space-between" mb="xs">
              <Text fw={500} size="sm">
                车轴载重
              </Text>
              <Text size="sm" c="dimmed">
                {form.values.axleLoad.toFixed(1)} kg
              </Text>
            </Group>
            <NumberInput
              placeholder="车轴载重"
              min={1}
              step={10}
              precision={1}
              hideControls
              error={form.errors.axleLoad}
              value={form.values.axleLoad}
              onChange={(value) =>
                handleChange('axleLoad', typeof value === 'number' ? value : 0)
              }
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
              <Text fw={500} size="sm">
                路面冲击强度
              </Text>
              <Text size="sm" c="dimmed">
                {form.values.impactIntensity.toFixed(2)}
              </Text>
            </Group>
            <NumberInput
              placeholder="路面冲击强度"
              min={0}
              step={0.1}
              precision={2}
              hideControls
              error={form.errors.impactIntensity}
              value={form.values.impactIntensity}
              onChange={(value) =>
                handleChange(
                  'impactIntensity',
                  typeof value === 'number' ? Math.max(0, value) : 0
                )
              }
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
        </Stack>

        {!isValid && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="参数错误"
            color="red"
            variant="light"
          >
            {validationErrors.map((err, idx) => (
              <Text key={idx} size="sm">
                • {err}
              </Text>
            ))}
          </Alert>
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
      </Stack>
    </Paper>
  );
};

export default ControlPanel;
