import { Paper, Group, Title, Button, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { useQuiz } from '../contexts/QuizContext';
import { LearnBrowser } from '../components/LearnBrowser';
import { QuestionNavigator } from '../components/QuestionNavigator';

export function AllQuestionsLearnPage() {
  const { enhancedLearnSet } = useQuiz();
  const navigate = useNavigate();

  return (
    <Stack gap="lg" mt="xl" pb={80}>
      {/* Fixed Header - Should not animate */}
      <Paper withBorder p="lg" radius="lg" shadow="sm">
        <Group justify="space-between" align="center">
          <Title order={2} size="h4">
            Alle Fragen - Lern-Modus
          </Title>
          <Button 
            onClick={() => navigate('/lernen/themenbereiche')} 
            variant="default"
            leftSection={<RotateCcw size={16} />}
          >
            Themenbereiche
          </Button>
        </Group>
      </Paper>
      
      {/* Animated Question Content Only */}
      <QuestionNavigator
        mode="learn"
        questions={enhancedLearnSet}
        baseRoute="/lernen/alle"
      >
        <LearnBrowser data={enhancedLearnSet} hideNavigation={true} />
      </QuestionNavigator>
    </Stack>
  );
}