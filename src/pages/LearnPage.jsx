import { Paper, Group, Title, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { LearnBrowser } from '../components/LearnBrowser';

export function LearnPage() {
  const { enhancedLearnSet } = useQuiz();
  const navigate = useNavigate();

  return (
    <Paper withBorder p="xl" radius="lg" shadow="sm" mt="xl">
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2} size="h3">
          Learn Mode
        </Title>
        <Button 
          onClick={() => navigate('/')} 
          variant="default"
        >
          Zurück
        </Button>
      </Group>
      <LearnBrowser data={enhancedLearnSet} />
    </Paper>
  );
}