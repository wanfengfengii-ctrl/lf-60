import React, { useMemo } from 'react';
import { Paper, Title, Text, Group, Stack, Badge, Table, ScrollArea, Divider } from '@mantine/core';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { IconActivity, IconClock, IconRoute } from '@tabler/icons-react';
import { TimeSeriesRecord } from '../types';

interface TimeSeriesPanelProps {
  timeSeries: TimeSeriesRecord | null;
}

const TimeSeriesPanel: React.FC<TimeSeriesPanelProps> = ({ timeSeries }) => {
  const chartData = useMemo(() => {
    if (!timeSeries) return [];
    return timeSeries.dataPoints.map((point) => ({
      name: `${Math.round(point.cycle / 1000)}K`,
      cycle: point.cycle,
      maxForce: Math.round(point.maxForce),
      avgForce: Math.round(point.avgForce),
      healthScore: point.healthScore,
      totalDamage: Math.round(point.totalDamage * 1000) / 10,
      maxStress: Math.round(point.maxStress / 1e6 * 100) / 100,
    }));
  }, [timeSeries]);

  const spokeDamageData = useMemo(() => {
    if (!timeSeries || timeSeries.dataPoints.length === 0) return [];
    const lastPoint = timeSeries.dataPoints[timeSeries.dataPoints.length - 1];
    return lastPoint.spokeDamages.map((damage, index) => ({
      spoke: `#${index + 1}`,
      damage: Math.round(damage * 1000) / 10,
    }));
  }, [timeSeries]);

  if (!timeSeries) {
    return (
      <Stack gap="md">
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Stack align="center" gap="sm">
            <IconActivity size={48} color="#adb5bd" />
            <Text c="dimmed" ta="center">
              暂无时序数据
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              请先配置战场地形和任务编组，运行仿真后查看时序记录
            </Text>
          </Stack>
        </Paper>
      </Stack>
    );
  }

  const lastPoint = timeSeries.dataPoints[timeSeries.dataPoints.length - 1];

  return (
    <Stack gap="md">
      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <IconActivity size={20} color="#228be6" />
            <Title order={4}>运行状态时序记录</Title>
          </Group>
          <Group gap="xs">
            <Badge color="blue" variant="light">
              <IconClock size={12} />
              <Text size="xs" ml={4}>
                {new Date(timeSeries.startTime).toLocaleString('zh-CN')}
              </Text>
            </Badge>
          </Group>
        </Group>

        <Group gap="md" mb="md">
          <Paper bg="blue.0" p="xs" radius="sm">
            <Text size="sm" fw={600}>总循环次数</Text>
            <Text size="lg" fw={700}>{timeSeries.totalCycles.toLocaleString()} 次</Text>
          </Paper>
          <Paper bg="green.0" p="xs" radius="sm">
            <Text size="sm" fw={600}>总里程</Text>
            <Text size="lg" fw={700}>{timeSeries.totalMileage.toLocaleString()} km</Text>
          </Paper>
          <Paper bg="orange.0" p="xs" radius="sm">
            <Text size="sm" fw={600}>采样点数</Text>
            <Text size="lg" fw={700}>{timeSeries.dataPoints.length}</Text>
          </Paper>
          <Paper bg="purple.0" p="xs" radius="sm">
            <Text size="sm" fw={600}>当前健康度</Text>
            <Text size="lg" fw={700}>{lastPoint.healthScore.toFixed(1)}%</Text>
          </Paper>
        </Group>

        <Divider my="sm" />

        <Title order={5} mb="xs">受力与应力趋势</Title>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis dataKey="name" stroke="#6c757d" fontSize={12} />
              <YAxis stroke="#6c757d" fontSize={12} />
              <Tooltip
                contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: 8,
              }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="maxForce"
                name="最大受力 (N)"
                stroke="#ff6b6b"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="avgForce"
                name="平均受力 (N)"
                stroke="#228be6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="maxStress"
                name="最大应力 (MPa)"
                stroke="#fab005"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <Title order={5} mb="xs">健康度与损伤趋势</Title>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis dataKey="name" stroke="#6c757d" fontSize={12} />
              <YAxis stroke="#6c757d" fontSize={12} />
              <Tooltip
                contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: 8,
              }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="healthScore"
                name="健康度 (%)"
                stroke="#40c057"
                fill="#40c057"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="totalDamage"
                name="累积损伤 (%)"
                stroke="#fa5252"
                fill="#fa5252"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <Title order={5} mb="xs">各轮辐最终损伤分布</Title>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spokeDamageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis dataKey="spoke" stroke="#6c757d" fontSize={12} />
              <YAxis stroke="#6c757d" fontSize={12} />
              <Tooltip
                contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: 8,
              }}
              />
              <Tooltip formatter={(value: number) => [`${value}%`, '损伤程度']} />
              <Area
                type="monotone"
                dataKey="damage"
                name="损伤程度"
                stroke="#fa5252"
                fill="#fa5252"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <Title order={5} mb="xs">详细数据记录</Title>
        <ScrollArea h={250}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>循环次数</Table.Th>
                <Table.Th>时间</Table.Th>
                <Table.Th>最大受力</Table.Th>
                <Table.Th>平均受力</Table.Th>
                <Table.Th>最大应力</Table.Th>
                <Table.Th>健康度</Table.Th>
                <Table.Th>损伤</Table.Th>
                <Table.Th>路况</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {timeSeries.dataPoints.slice(-10).map((point, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td>{point.cycle.toLocaleString()}</Table.Td>
                  <Table.Td>
                    {new Date(point.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Table.Td>
                  <Table.Td>{point.maxForce.toLocaleString()} N</Table.Td>
                  <Table.Td>{point.avgForce.toLocaleString()} N</Table.Td>
                  <Table.Td>{(point.maxStress / 1e6).toFixed(2)} MPa</Table.Td>
                  <Table.Td>
                    <Badge
                      color={point.healthScore > 70 ? 'green' : point.healthScore > 40 ? 'yellow' : 'red'}
                      variant="light"
                    >
                      {point.healthScore.toFixed(1)}%
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={point.totalDamage < 0.3 ? 'green' : point.totalDamage < 0.6 ? 'yellow' : 'red'}
                      variant="light"
                    >
                      {(point.totalDamage * 100).toFixed(1)}%
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <IconRoute size={14} /> {point.roadConditionId}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    </Stack>
  );
};

export default TimeSeriesPanel;
