import { 
  Stack, 
  Group, 
  Title, 
  Paper, 
  Text, 
  Button, 
  Badge,
  Divider,
  Image
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { getQuestionCategory } from '../utils/categories';
import { getImageSrc } from '../utils/images';

export function ReviewCorrectPage() {
  const { learnSet, stats, selectedState } = useQuiz();
  const navigate = useNavigate();

  // Get questions that were answered correctly
  const correctQuestions = (learnSet || []).filter((question) => {
    return stats?.correctAnswers?.[question.id];
  });

  // Early return if data is not ready
  if (!learnSet || !stats) {
    return (
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Title order={1} size="h1">
            Richtige Antworten
          </Title>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
          >
            Zurück zum Dashboard
          </Button>
        </Group>
        <Paper withBorder p="xl" radius="lg" shadow="sm">
          <Text ta="center" c="dimmed">
            Lade Daten...
          </Text>
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <Title order={1} size="h1">
          Richtige Antworten ({correctQuestions.length})
        </Title>
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
        >
          Zurück zum Dashboard
        </Button>
      </Group>

      {correctQuestions.length === 0 ? (
        <Paper withBorder p="xl" radius="lg" shadow="sm">
          <Text ta="center" c="dimmed">
            Keine richtigen Antworten zum Anzeigen.
          </Text>
        </Paper>
      ) : (
        <Stack gap="lg">
          {correctQuestions.map((question, index) => (
            <Paper key={question.id} withBorder p="lg" radius="lg" shadow="sm">
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <Title order={3} size="h4" style={{ flex: 1 }}>
                    {question.question}
                  </Title>
                  <Group gap="xs">
                    {/* <Badge 
                      color={getQuestionCategory(question.id).color} 
                      variant="outline"
                      size="sm"
                    >
                      {getQuestionCategory(question.id).name}
                    </Badge> */}
                    <Badge color="green" variant="light">
                      Richtig
                    </Badge>
                  </Group>
                </Group>
                
                {question.image && (
                  <Image
                    src={getImageSrc(question, selectedState)}
                    alt="Question Image"
                    mah={300}
                    fit="contain"
                    radius="md"
                  />
                )}

                <Stack gap="xs">
                  {(question.options || question.answers || []).map((answer, answerIndex) => (
                    <Paper
                      key={answerIndex}
                      p="sm"
                      radius="md"
                      bg={answerIndex === question.answerIndex ? 'light-dark(var(--mantine-color-emerald-1), var(--mantine-color-emerald-9))' : 'transparent'}
                      style={{
                        border: answerIndex === question.answerIndex 
                          ? '2px solid var(--mantine-color-green-4)' 
                          : '1px solid var(--mantine-color-gray-3)'
                      }}
                    >
                      <Group gap="sm">
                        <Text fw={answerIndex === question.answerIndex ? 600 : 400}>
                          {String.fromCharCode(65 + answerIndex)}) {answer}
                        </Text>
                        {answerIndex === question.answerIndex && (
                          <Badge color="green" size="sm">
                            ✓ Richtig
                          </Badge>
                        )}
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}