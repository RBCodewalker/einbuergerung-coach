import {
  Stack,
  Paper,
  Title,
  Grid,
  Group,
  Button,
  Text,
  Badge,
  Image
} from '@mantine/core';
import { RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { Pill } from '../components/ui/Pill';
import { getImageSrc } from '../utils/images';
import { ANSWER_LABELS } from '../constants';
import { getQuestionCategory } from '../utils/categories';

export function ReviewPage() {
  const navigate = useNavigate();
  const { 
    questions, 
    answers, 
    scoreSummary, 
    startNewQuiz 
  } = useQuiz();

  const handleStartNewQuiz = () => {
    startNewQuiz();
    navigate('/quiz/1');
  };

  const { correct, wrong, empty, total } = scoreSummary();

  return (
    <Stack mt="xl" gap="lg">
      <Paper withBorder p="xl" radius="lg" shadow="sm">
        <Title order={2} mb="md">
          Ergebnis
        </Title>
        <Grid>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Pill label="Richtig" value={correct} tone="emerald" />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Pill label="Falsch" value={wrong} tone="rose" />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Pill label="Offen" value={empty} tone="zinc" />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Pill label="Gesamt" value={total} tone="sky" />
          </Grid.Col>
        </Grid>
        <Group mt="lg" gap="md">
          <Button
            onClick={() => navigate('/')}
            variant="default"
            leftSection={<RotateCcw size={16} />}
          >
            Zurück zum Dashboard
          </Button>
          <Button
            onClick={handleStartNewQuiz}
            variant="filled"
          >
            Neue Quizrunde
          </Button>
        </Group>
      </Paper>

      <Paper withBorder p="xl" radius="lg" shadow="sm">
        <Title order={3} size="h4" mb="lg">
          Durchsicht
        </Title>
        <Stack gap="md">
          {questions.map((question, i) => (
            <Paper key={i} withBorder p="lg" radius="md">
              <Group justify="space-between" align="flex-start" mb="sm">
                <Text fw={500} style={{ flex: 1 }}>
                  {i + 1}. {question.question}
                </Text>
                <Group gap="xs">
                  {/* <Badge 
                    color={getQuestionCategory(question.id).color} 
                    variant="outline"
                    size="sm"
                  >
                    {getQuestionCategory(question.id).name}
                  </Badge> */}
                  <Badge
                    color={
                      answers[i] === question.answerIndex
                        ? 'emerald'
                        : answers[i] === -1
                        ? 'gray'
                        : 'red'
                    }
                    variant="light"
                    size="sm"
                  >
                    {answers[i] === question.answerIndex
                      ? 'richtig'
                      : answers[i] === -1
                      ? 'offen'
                      : 'falsch'}
                  </Badge>
                </Group>
              </Group>
              
              {question.image && (
                <Image
                  src={getImageSrc(question)}
                  alt="Question Image"
                  mah={240}
                  fit="contain"
                  radius="sm"
                  mb="sm"
                />
              )}
              
              <Stack gap="xs">
                {question.options.map((option, j) => (
                  <Paper
                    key={j}
                    p="xs"
                    radius="sm"
                    bg={
                      j === question.answerIndex
                        ? 'light-dark(var(--mantine-color-emerald-1), var(--mantine-color-emerald-9))'
                        : j === answers[i] && j !== question.answerIndex
                        ? 'light-dark(var(--mantine-color-red-1), var(--mantine-color-red-9)))'
                        : undefined
                    }
                  >
                    <Text size="sm">
                      {ANSWER_LABELS[j]}. {option}
                    </Text>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}