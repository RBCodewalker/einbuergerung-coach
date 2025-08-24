import React from 'react';
import { Alert, Progress, Text, Group, ThemeIcon } from '@mantine/core';
import { Brain, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAI } from '../contexts/AIContext';

export function AIModelStatus() {
  const { isModelLoading, isModelReady, loadingProgress, loadingError } = useAI();

  // Don't show anything if model is ready and no error
  if (isModelReady && !loadingError && !loadingProgress) {
    return null;
  }

  // Loading state
  if (isModelLoading) {
    return (
      <Alert
        variant="light"
        color="blue"
        icon={<Brain size={16} />}
        title="KI-Modell wird geladen"
        mb="md"
      >
        <Group gap="xs" align="center" mb="xs">
          <Text size="sm">{loadingProgress || 'Initialisierung...'}</Text>
        </Group>
        <Progress value={loadingProgress.includes('%') ? parseInt(loadingProgress) : undefined} animated />
        <Text size="xs" c="dimmed" mt="xs">
          Dies kann beim ersten Besuch bis zu einer Minute dauern.
        </Text>
      </Alert>
    );
  }

  // Success state (temporary)
  if (isModelReady && loadingProgress) {
    return (
      <Alert
        variant="light"
        color="green"
        icon={<CheckCircle size={16} />}
        title="KI-Erklärungen verfügbar"
        mb="md"
      >
        <Text size="sm">{loadingProgress}</Text>
      </Alert>
    );
  }

  // Error state
  if (loadingError) {
    return (
      <Alert
        variant="light"
        color="yellow"
        icon={<AlertTriangle size={16} />}
        title="KI-Modell nicht verfügbar"
        mb="md"
      >
        <Text size="sm">{loadingError}</Text>
      </Alert>
    );
  }

  return null;
}