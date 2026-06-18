import React, { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Stack,
  Button,
  Group,
  Modal,
  TextInput,
  List,
  ActionIcon,
  Text,
  Badge,
  Divider,
  Tooltip,
  Box,
  ScrollArea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconDeviceFloppy,
  IconFolderOpen,
  IconTrash,
  IconDownload,
  IconUpload,
  IconClock,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { SavedScheme, SimulationResult, FORCE_THRESHOLD, WheelParameters } from '../types';
import { runSimulation, validateParameters } from '../physics/simulation';

interface SchemeManagerProps {
  currentResult: SimulationResult | null;
  currentParameters: WheelParameters;
  onLoadScheme: (scheme: SavedScheme) => void;
}

const STORAGE_KEY = 'chariot_wheel_schemes';

const SchemeManager: React.FC<SchemeManagerProps> = ({
  currentResult,
  currentParameters,
  onLoadScheme,
}) => {
  const [schemes, setSchemes] = useState<SavedScheme[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const saveForm = useForm({
    initialValues: { name: '' },
    validate: {
      name: (value) =>
        value.trim().length > 0 ? null : '请输入方案名称',
    },
  });

  const persistSchemes = (newSchemes: SavedScheme[]) => {
    setSchemes(newSchemes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSchemes));
  };

  const canSave = validateParameters(currentParameters).length === 0;

  const handleSave = () => {
    if (!canSave) {
      notifications.show({
        title: '无法保存',
        message: '当前参数无效，请修正后再保存',
        color: 'red',
        icon: <IconX size={18} />,
      });
      return;
    }
    saveForm.setValues({ name: `方案_${new Date().toLocaleString('zh-CN')}` });
    setSaveModalOpen(true);
  };

  const confirmSave = () => {
    saveForm.validate();
    if (!saveForm.isValid()) return;

    if (!canSave) {
      notifications.show({
        title: '保存失败',
        message: '参数无效，无法生成模拟结果',
        color: 'red',
        icon: <IconX size={18} />,
      });
      return;
    }

    let resultToSave: SimulationResult;
    try {
      resultToSave = runSimulation(currentParameters);
    } catch (err) {
      notifications.show({
        title: '保存失败',
        message: err instanceof Error ? err.message : '模拟计算出错',
        color: 'red',
        icon: <IconX size={18} />,
      });
      return;
    }

    const newScheme: SavedScheme = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: saveForm.values.name.trim(),
      result: resultToSave,
      createdAt: Date.now(),
    };

    persistSchemes([newScheme, ...schemes]);
    setSaveModalOpen(false);
    saveForm.reset();
    notifications.show({
      title: '保存成功',
      message: `方案 "${newScheme.name}" 已保存`,
      color: 'green',
      icon: <IconCheck size={18} />,
    });
  };

  const handleLoad = (scheme: SavedScheme) => {
    onLoadScheme(scheme);
    setLoadModalOpen(false);
    notifications.show({
      title: '加载成功',
      message: `已加载方案 "${scheme.name}"`,
      color: 'blue',
      icon: <IconCheck size={18} />,
    });
  };

  const handleDelete = (scheme: SavedScheme) => {
    persistSchemes(schemes.filter((s) => s.id !== scheme.id));
    notifications.show({
      title: '删除成功',
      message: `方案 "${scheme.name}" 已删除`,
      color: 'yellow',
      icon: <IconTrash size={18} />,
    });
  };

  const handleExport = () => {
    if (schemes.length === 0) {
      notifications.show({
        title: '无数据',
        message: '当前没有可导出的方案',
        color: 'yellow',
        icon: <IconX size={18} />,
      });
      return;
    }
    const dataStr = JSON.stringify(schemes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chariot_wheel_schemes_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notifications.show({
      title: '导出成功',
      message: `已导出 ${schemes.length} 个方案`,
      color: 'green',
      icon: <IconCheck size={18} />,
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as SavedScheme[];
        if (!Array.isArray(imported)) throw new Error('格式错误');

        const existingIds = new Set(schemes.map((s) => s.id));
        const filtered = imported.filter((s) => !existingIds.has(s.id));
        const merged = [...filtered, ...schemes];
        persistSchemes(merged);

        notifications.show({
          title: '导入成功',
          message: `已导入 ${filtered.length} 个新方案`,
          color: 'green',
          icon: <IconCheck size={18} />,
        });
      } catch (err) {
        notifications.show({
          title: '导入失败',
          message: '文件格式不正确',
          color: 'red',
          icon: <IconX size={18} />,
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <>
      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={4}>方案管理</Title>
            <Badge color="gray" variant="light">
              {schemes.length} 个已保存
            </Badge>
          </Group>

          <Divider />

          <Group grow>
            <Button
              leftSection={<IconDeviceFloppy size={18} />}
              onClick={handleSave}
              disabled={!currentResult}
              color="green"
              variant="light"
            >
              保存当前
            </Button>
            <Button
              leftSection={<IconFolderOpen size={18} />}
              onClick={() => setLoadModalOpen(true)}
              color="blue"
              variant="light"
              disabled={schemes.length === 0}
            >
              加载方案
            </Button>
          </Group>

          <Group grow>
            <Button
              leftSection={<IconDownload size={18} />}
              onClick={handleExport}
              color="violet"
              variant="light"
              disabled={schemes.length === 0}
            >
              导出全部
            </Button>
            <Button
              leftSection={<IconUpload size={18} />}
              onClick={() => fileInputRef.current?.click()}
              color="cyan"
              variant="light"
            >
              导入文件
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </Group>

          {schemes.length > 0 && (
            <>
              <Divider label="最近方案" labelPosition="center" />
              <ScrollArea h={160} type="hover">
                <Stack gap="xs">
                  {schemes.slice(0, 5).map((scheme) => {
                    const exceeded = scheme.result.spokeData.filter(
                      (s) => s.exceedsThreshold
                    ).length;
                    return (
                      <Box
                        key={scheme.id}
                        p="xs"
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          cursor: 'pointer',
                          background: '#fafafa',
                        }}
                        onClick={() => handleLoad(scheme)}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text fw={500} size="sm" truncate>
                              {scheme.name}
                            </Text>
                            <Group gap="xs" mt="xs" wrap="nowrap">
                              <Badge size="xs" color="gray" variant="light">
                                R={scheme.result.parameters.wheelRadius.toFixed(2)}m
                              </Badge>
                              <Badge size="xs" color="gray" variant="light">
                                {scheme.result.parameters.spokeCount}根
                              </Badge>
                              <Badge
                                size="xs"
                                color={exceeded > 0 ? 'red' : 'green'}
                                variant="dot"
                              >
                                {scheme.result.maxForce > FORCE_THRESHOLD
                                  ? '超载'
                                  : '安全'}
                              </Badge>
                            </Group>
                          </Box>
                          <Group gap="xs" wrap="nowrap">
                            <Tooltip label="加载">
                              <ActionIcon
                                size="sm"
                                color="blue"
                                variant="light"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLoad(scheme);
                                }}
                              >
                                <IconFolderOpen size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="删除">
                              <ActionIcon
                                size="sm"
                                color="red"
                                variant="light"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(scheme);
                                }}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Group>
                        <Text size="xs" c="dimmed" mt="xs">
                          <IconClock size={10} style={{ display: 'inline', marginRight: 4 }} />
                          {formatDate(scheme.createdAt)}
                        </Text>
                      </Box>
                    );
                  })}
                </Stack>
              </ScrollArea>
            </>
          )}
        </Stack>
      </Paper>

      <Modal
        opened={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="保存方案"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            将保存以下内容：
            <br />• 车轮半径、轮辐数量、载重、冲击强度等全部结构参数
            <br />• 每根轮辐的受力数据、疲劳风险及图表数据
          </Text>
          <TextInput
            label="方案名称"
            placeholder="请输入方案名称"
            {...saveForm.getInputProps('name')}
            autoFocus
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setSaveModalOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmSave} leftSection={<IconDeviceFloppy size={16} />}>
              确认保存
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={loadModalOpen}
        onClose={() => setLoadModalOpen(false)}
        title="选择方案加载"
        centered
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            共 {schemes.length} 个已保存方案
          </Text>
          {schemes.length === 0 ? (
            <Text ta="center" c="dimmed" py="xl">
              暂无保存的方案
            </Text>
          ) : (
            <ScrollArea h={400} type="hover">
              <List spacing="sm">
                {schemes.map((scheme) => {
                  const p = scheme.result.parameters;
                  const exceeded = scheme.result.spokeData.filter(
                    (s) => s.exceedsThreshold
                  ).length;
                  return (
                    <List.Item key={scheme.id} p="xs" style={{ borderRadius: 8 }}>
                      <Paper p="sm" withBorder>
                        <Group justify="space-between" mb="xs" wrap="nowrap">
                          <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text fw={600} truncate>
                              {scheme.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {formatDate(scheme.createdAt)}
                            </Text>
                          </Box>
                          <Group gap="xs" wrap="nowrap">
                            <Badge color={exceeded > 0 ? 'red' : 'green'} variant="light">
                              {exceeded > 0 ? `${exceeded}根超载` : '安全'}
                            </Badge>
                            <Button
                              size="xs"
                              onClick={() => handleLoad(scheme)}
                              leftSection={<IconFolderOpen size={14} />}
                            >
                              加载
                            </Button>
                            <ActionIcon
                              size="sm"
                              color="red"
                              variant="light"
                              onClick={() => handleDelete(scheme)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        </Group>
                        <Group gap="xs" wrap="wrap">
                          <Badge size="xs" color="blue" variant="light">
                            半径: {p.wheelRadius.toFixed(2)}m
                          </Badge>
                          <Badge size="xs" color="violet" variant="light">
                            轮辐: {p.spokeCount}根
                          </Badge>
                          <Badge size="xs" color="orange" variant="light">
                            载重: {p.axleLoad.toFixed(0)}kg
                          </Badge>
                          <Badge size="xs" color="cyan" variant="light">
                            冲击: {p.impactIntensity.toFixed(2)}
                          </Badge>
                          <Badge size="xs" color="pink" variant="light">
                            最大受力: {scheme.result.maxForce.toLocaleString()}N
                          </Badge>
                        </Group>
                      </Paper>
                    </List.Item>
                  );
                })}
              </List>
            </ScrollArea>
          )}
        </Stack>
      </Modal>
    </>
  );
};

export default SchemeManager;
