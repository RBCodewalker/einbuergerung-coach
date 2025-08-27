import React from 'react';
import { Paper, Stack, Text, Badge, Group, Code, Button } from '@mantine/core';
import { getStorageInfo, getStorageData } from '../utils/storage';

export function StorageDebug() {
  const [storageInfo, setStorageInfo] = React.useState(null);
  const [statsData, setStatsData] = React.useState(null);

  React.useEffect(() => {
    setStorageInfo(getStorageInfo());
    setStatsData(getStorageData('lid.stats'));
  }, []);

  const handleRefresh = () => {
    setStorageInfo(getStorageInfo());
    setStatsData(getStorageData('lid.stats'));
  };

  if (!storageInfo) return null;

  return (
    <Paper withBorder p="md" radius="md" style={{ marginBottom: '16px' }}>
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" fw={600}>Storage Debug Info</Text>
          <Button size="xs" variant="light" onClick={handleRefresh}>
            Refresh
          </Button>
        </Group>
        
        <Group gap="xs">
          <Text size="xs">Best Storage:</Text>
          <Badge size="xs" color="blue">{storageInfo.bestStorage}</Badge>
        </Group>

        <Group gap="xs">
          <Text size="xs">Available:</Text>
          {Object.entries(storageInfo.available).map(([key, available]) => (
            <Badge 
              key={key} 
              size="xs" 
              color={available ? 'green' : 'red'}
            >
              {key}: {available ? '✓' : '✗'}
            </Badge>
          ))}
        </Group>

        <Group gap="xs">
          <Text size="xs">Version:</Text>
          <Badge size="xs" color="teal">{storageInfo.version}</Badge>
        </Group>

        {statsData && (
          <Stack gap={2}>
            <Text size="xs" fw={500}>Stats Data:</Text>
            <Code block size="xs" style={{ fontSize: '10px' }}>
              Correct: {statsData.correct || 0} | 
              Wrong: {statsData.wrong || 0} | 
              Sessions: {statsData.totalSessions || 0}
            </Code>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}