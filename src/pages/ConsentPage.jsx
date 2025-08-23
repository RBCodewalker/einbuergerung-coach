import { Container, Paper, Title, Text, Group, Button } from '@mantine/core';
import { useApp } from '../contexts/AppContext';

export function ConsentPage() {
  const { setConsent } = useApp();

  return (
    <Container size="sm" style={{ minHeight: '100vh' }} py="xl">
      <Paper withBorder p="xl" radius="lg" shadow="sm" maw={600} mx="auto">
        <Title order={2}>Cookies</Title>
        <Text c="dimmed" mt="sm" size="sm">
          Möchtest du Einstellungen und Fortschritt in Cookies speichern?
        </Text>
        <Group mt="lg" gap="md">
          <Button
            onClick={() => setConsent('necessary')}
            variant="default"
          >
            Nur notwendig
          </Button>
          <Button
            onClick={() => setConsent('all')}
            variant="filled"
          >
            Alle akzeptieren
          </Button>
        </Group>
      </Paper>
    </Container>
  );
}