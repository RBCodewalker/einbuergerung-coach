import React from 'react';
import { Alert, Progress, Text, Group, ThemeIcon, Button } from '@mantine/core';
import { Brain, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAI } from '../contexts/AIContext';
import { aiExplanationService } from '../services/aiExplanations';

export function AIModelStatus() {
  const { isModelLoading, isModelReady, loadingProgress, loadingError, isMobile } = useAI();

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
          {isMobile 
            ? "Auf Mobilgeräten kann dies länger dauern oder möglicherweise nicht funktionieren."
            : "Dies kann beim ersten Besuch bis zu einer Minute dauern."
          }
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
    const handleRetry = async () => {
      try {
        await aiExplanationService.initialize(true); // Force retry
        window.location.reload(); // Reload to reset state
      } catch (error) {
        console.log('Retry failed:', error);
      }
    };

    return (
      <Alert
        variant="light"
        color="yellow"
        icon={<AlertTriangle size={16} />}
        title="KI-Modell nicht verfügbar"
        mb="md"
      >
        <Text size="sm" mb="sm">{loadingError}</Text>
        {isMobile && (
          <Button
            size="xs"
            variant="light"
            color="yellow"
            leftSection={<RefreshCw size={14} />}
            onClick={handleRetry}
          >
            Erneut versuchen
          </Button>
        )}
      </Alert>
    );
  }

  return null;
}