import React, { useState, useCallback } from 'react';
import { Paper, Title, Stack, Text, Group, Button, Badge, Divider, Card, SimpleGrid, Progress, Modal, ScrollArea, Accordion, List, ThemeIcon, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFileExport, IconDownload, IconPrinter, IconCheck, IconX, IconAlertTriangle, IconShield, IconFlame, IconInfoCircle } from '@tabler/icons-react';
import { SimulationResult, EngineeringReport } from '../types';
import { generateReport } from '../physics/simulation';

interface ReportExporterProps {
  result: SimulationResult | null;
  schemeName: string;
}

const safetyLevelConfig = {
  safe: { color: 'green', label: '安全', icon: IconShield },
  warning: { color: 'orange', label: '警告', icon: IconAlertTriangle },
  danger: { color: 'red', label: '危险', icon: IconFlame },
} as const;

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportAsJson(report: EngineeringReport) {
  const json = JSON.stringify(report, null, 2);
  const filename = `${report.schemeName}_评估报告_${new Date(report.generatedAt).toISOString().slice(0, 10)}.json`;
  downloadFile(json, filename, 'application/json');
  notifications.show({ title: '导出成功', message: 'JSON 报告已下载', color: 'green', icon: React.createElement(IconCheck) });
}

function exportAsText(report: EngineeringReport) {
  const separator = '═'.repeat(60);
  const subSeparator = '─'.repeat(60);
  const lines: string[] = [];

  lines.push(separator);
  lines.push(`  ${report.title}`);
  lines.push(separator);
  lines.push('');
  lines.push(`  方案名称: ${report.schemeName}`);
  lines.push(`  生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN')}`);
  lines.push('');

  const levelCfg = safetyLevelConfig[report.summary.safetyLevel];
  lines.push(`  安全等级: [${levelCfg.label}]  综合评分: ${report.summary.overallScore}/100`);
  lines.push('');

  if (report.summary.keyFindings.length > 0) {
    lines.push(subSeparator);
    lines.push('  关键发现:');
    report.summary.keyFindings.forEach((f, idx) => {
      lines.push(`    ${idx + 1}. ${f}`);
    });
    lines.push('');
  }

  if (report.summary.criticalIssues.length > 0) {
    lines.push(subSeparator);
    lines.push('  ⚠ 严重问题:');
    report.summary.criticalIssues.forEach((issue) => {
      lines.push(`    ! ${issue}`);
    });
    lines.push('');
  }

  report.sections.forEach((section) => {
    lines.push(separator);
    lines.push(`  ${section.title}`);
    lines.push(subSeparator);
    section.content.split('\n').forEach((line) => {
      lines.push(`    ${line}`);
    });
    lines.push('');
  });

  lines.push(separator);
  lines.push('  报告结束');
  lines.push(separator);

  const text = lines.join('\n');
  const filename = `${report.schemeName}_评估报告_${new Date(report.generatedAt).toISOString().slice(0, 10)}.txt`;
  downloadFile(text, filename, 'text/plain;charset=utf-8');
  notifications.show({ title: '导出成功', message: '文本报告已下载', color: 'green', icon: React.createElement(IconCheck) });
}

const ReportExporter: React.FC<ReportExporterProps> = ({ result, schemeName }) => {
  const [report, setReport] = useState<EngineeringReport | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!result) return;
    const engReport = generateReport(schemeName, result);
    setReport(engReport);
    setPreviewOpen(true);
    notifications.show({
      title: '报告已生成',
      message: `${schemeName} 方案评估报告生成完成`,
      color: 'blue',
      icon: React.createElement(IconInfoCircle),
    });
  }, [result, schemeName]);

  const handleExportJson = useCallback(() => {
    if (!report) return;
    exportAsJson(report);
  }, [report]);

  const handleExportText = useCallback(() => {
    if (!report) return;
    exportAsText(report);
  }, [report]);

  if (!result) {
    return (
      <Paper shadow="sm" radius="md" p="xl" withBorder>
        <Stack align="center" gap="md">
          <IconFileExport size={48} stroke={1.5} color="gray" />
          <Title order={4} c="dimmed">工程评估报告</Title>
          <Text c="dimmed" size="sm">请先运行仿真计算以生成报告</Text>
          <Button leftSection={<IconFileExport size={16} />} disabled>
            生成报告
          </Button>
        </Stack>
      </Paper>
    );
  }

  const levelCfg = report ? safetyLevelConfig[report.summary.safetyLevel] : null;

  return (
    <>
      <Paper shadow="sm" radius="md" p="lg" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="sm">
              <IconFileExport size={24} stroke={1.5} />
              <Title order={4}>工程评估报告</Title>
            </Group>
            {report && (
              <Badge size="lg" color={levelCfg!.color} variant="filled" leftSection={React.createElement(levelCfg!.icon, { size: 14 })}>
                {levelCfg!.label}
              </Badge>
            )}
          </Group>

          <Divider />

          {report ? (
            <Stack gap="md">
              <Card withBorder padding="md">
                <Stack gap="xs">
                  <Text fw={600} size="sm">综合评分</Text>
                  <Group justify="space-between">
                    <Text size="lg" fw={700}>{report.summary.overallScore}</Text>
                    <Text size="sm" c="dimmed">/ 100</Text>
                  </Group>
                  <Progress
                    value={report.summary.overallScore}
                    color={levelCfg!.color}
                    size="lg"
                    radius="md"
                  />
                </Stack>
              </Card>

              {report.summary.keyFindings.length > 0 && (
                <Card withBorder padding="md">
                  <Text fw={600} size="sm" mb="xs">关键发现</Text>
                  <List spacing={4} size="sm"
                    icon={<ThemeIcon size={20} radius="xl" color="blue" variant="light"><IconInfoCircle size={12} /></ThemeIcon>}
                  >
                    {report.summary.keyFindings.map((finding, i) => (
                      <List.Item key={i}>{finding}</List.Item>
                    ))}
                  </List>
                </Card>
              )}

              {report.summary.criticalIssues.length > 0 && (
                <Card withBorder padding="md" style={{ borderColor: 'var(--mantine-color-red-3)' }}>
                  <Text fw={600} size="sm" c="red" mb="xs">严重问题</Text>
                  <List spacing={4} size="sm"
                    icon={<ThemeIcon size={20} radius="xl" color="red" variant="light"><IconAlertTriangle size={12} /></ThemeIcon>}
                  >
                    {report.summary.criticalIssues.map((issue, i) => (
                      <List.Item key={i} c="red">{issue}</List.Item>
                    ))}
                  </List>
                </Card>
              )}

              <Accordion variant="contained" chevronPosition="right">
                {report.sections.map((section, i) => (
                  <Accordion.Item key={i} value={`section-${i}`}>
                    <Accordion.Control>
                      <Text fw={500} size="sm">{section.title}</Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Text size="sm" style={{ whiteSpace: 'pre-line' }}>{section.content}</Text>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>

              <Divider />

              <SimpleGrid cols={2} spacing="sm">
                <Button
                  leftSection={<IconDownload size={16} />}
                  variant="filled"
                  onClick={handleExportJson}
                >
                  JSON 导出
                </Button>
                <Button
                  leftSection={<IconPrinter size={16} />}
                  variant="outline"
                  onClick={handleExportText}
                >
                  文本报告导出
                </Button>
              </SimpleGrid>

              <Button
                variant="light"
                onClick={() => setPreviewOpen(true)}
                fullWidth
              >
                查看完整报告
              </Button>
            </Stack>
          ) : (
            <Stack align="center" gap="sm">
              <Text c="dimmed" size="sm">仿真结果已就绪，点击下方按钮生成评估报告</Text>
              <Button
                leftSection={<IconFileExport size={16} />}
                onClick={handleGenerate}
                fullWidth
              >
                生成报告
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Modal
        opened={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={
          <Group gap="sm">
            <IconFileExport size={20} />
            <Text fw={600}>{report?.title || '评估报告'}</Text>
          </Group>
        }
        size="lg"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {report && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                方案: {report.schemeName} | 生成时间: {new Date(report.generatedAt).toLocaleString('zh-CN')}
              </Text>
              <Badge size="lg" color={levelCfg!.color} variant="filled" leftSection={React.createElement(levelCfg!.icon, { size: 14 })}>
                {levelCfg!.label}
              </Badge>
            </Group>

            <Box>
              <Text fw={600} size="sm" mb={4}>综合评分: {report.summary.overallScore} / 100</Text>
              <Progress value={report.summary.overallScore} color={levelCfg!.color} size="lg" radius="md" />
            </Box>

            {report.summary.keyFindings.length > 0 && (
              <Box>
                <Text fw={600} size="sm" mb={4}>关键发现</Text>
                <List spacing={4} size="sm"
                  icon={<ThemeIcon size={18} radius="xl" color="blue" variant="light"><IconCheck size={10} /></ThemeIcon>}
                >
                  {report.summary.keyFindings.map((f, i) => <List.Item key={i}>{f}</List.Item>)}
                </List>
              </Box>
            )}

            {report.summary.criticalIssues.length > 0 && (
              <Box>
                <Text fw={600} size="sm" c="red" mb={4}>严重问题</Text>
                <List spacing={4} size="sm"
                  icon={<ThemeIcon size={18} radius="xl" color="red" variant="light"><IconX size={10} /></ThemeIcon>}
                >
                  {report.summary.criticalIssues.map((issue, i) => <List.Item key={i} c="red">{issue}</List.Item>)}
                </List>
              </Box>
            )}

            <Divider />

            <Accordion variant="separated" chevronPosition="right">
              {report.sections.map((section, i) => (
                <Accordion.Item key={i} value={`modal-section-${i}`}>
                  <Accordion.Control>
                    <Text fw={500} size="sm">{section.title}</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text size="sm" style={{ whiteSpace: 'pre-line' }}>{section.content}</Text>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>

            <Divider />

            <SimpleGrid cols={2} spacing="sm">
              <Button leftSection={<IconDownload size={16} />} onClick={handleExportJson}>
                JSON 导出
              </Button>
              <Button leftSection={<IconPrinter size={16} />} variant="outline" onClick={handleExportText}>
                文本报告导出
              </Button>
            </SimpleGrid>
          </Stack>
        )}
      </Modal>
    </>
  );
};

export default ReportExporter;
