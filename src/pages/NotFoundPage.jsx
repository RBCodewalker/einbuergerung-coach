import { Stack, Title, Text, Button, Paper } from '@mantine/core';
import { Home, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Stack align="center" justify="center" style={{ minHeight: '60vh' }} gap="xl">
      <Paper withBorder p="xl" radius="lg" shadow="sm" style={{ textAlign: 'center' }}>
        <Stack gap="lg" align="center">
          <AlertCircle size={64} color="var(--mantine-color-red-6)" />
          
          <Stack gap="sm" align="center">
            <Title order={1} size="h2">
              Seite nicht gefunden
            </Title>
            <Text c="dimmed" size="lg">
              Die angeforderte Seite existiert nicht oder ist nicht verfügbar.
            </Text>
          </Stack>
          
          <Button
            onClick={() => navigate('/')}
            leftSection={<Home size={16} />}
            size="lg"
          >
            Zurück zur Startseite
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}