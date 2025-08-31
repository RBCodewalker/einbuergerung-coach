import { 
  Stack, 
  Group, 
  Title, 
  Paper, 
  Text, 
  Button, 
  Badge,
  Image,
  ActionIcon
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { getImageSrc } from '../utils/images';
import { Flag, FlagOff } from 'lucide-react';

export function ReviewFlaggedPage() {
  const { enhancedLearnSet, stats, selectedState, toggleFlagById } = useQuiz();
  const navigate = useNavigate();

  // Get questions that are flagged
  const flaggedQuestions = (enhancedLearnSet || []).filter((question) => {
    return stats?.flaggedQuestions?.[question.id];
  });

  // Early return if data is not ready
  if (!enhancedLearnSet || !stats) {
    return (
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Title order={1} size="h1">
            Markierte Fragen
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
          Markierte Fragen ({flaggedQuestions.length})
        </Title>
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
        >
          Zurück zum Dashboard
        </Button>
      </Group>

      {flaggedQuestions.length === 0 ? (
        <Paper withBorder p="xl" radius="lg" shadow="sm">
          <Stack align="center" gap="md">
            <Flag size={48} color="var(--mantine-color-dimmed)" />
            <Text ta="center" c="dimmed" size="lg">
              Keine markierten Fragen
            </Text>
            <Text ta="center" c="dimmed" size="sm">
              Markiere Fragen während des Quiz, um sie hier zu sammeln und später zu wiederholen.
            </Text>
            <Button
              variant="light"
              onClick={() => navigate('/')}
            >
              Quiz starten
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Stack gap="lg">
          <Text size="sm" c="dimmed" ta="center">
            Diese Fragen hast du als wichtig markiert. Du kannst sie hier wiederholen oder die Markierung entfernen.
          </Text>
          
          {flaggedQuestions.map((question) => (
            <Paper key={question.id} withBorder p="lg" radius="lg" shadow="sm">
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <Title order={3} size="h4" style={{ flex: 1 }}>
                    {question.question}
                  </Title>
                  <Group gap="xs">
                    <Badge 
                      color="yellow" 
                      variant="light"
                      leftSection={<Flag size={14} />}
                    >
                      Markiert
                    </Badge>
                    <ActionIcon
                      onClick={() => toggleFlagById(question.id)}
                      variant="subtle"
                      color="gray"
                      title="Markierung entfernen"
                    >
                      <FlagOff size={16} />
                    </ActionIcon>
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
                  {(question.options || question.answers || []).map((answer, answerIndex) => {
                    const isCorrectAnswer = answerIndex === question.answerIndex;
                    
                    return (
                      <Paper
                        key={answerIndex}
                        p="sm"
                        radius="md"
                        bg={isCorrectAnswer ? 'light-dark(var(--mantine-color-emerald-1), var(--mantine-color-emerald-9))' : 'transparent'}
                        style={{
                          border: isCorrectAnswer 
                            ? '2px solid var(--mantine-color-green-4)' 
                            : '1px solid var(--mantine-color-gray-3)'
                        }}
                      >
                        <Group gap="sm" justify="space-between">
                          <Text fw={isCorrectAnswer ? 600 : 400}>
                            {String.fromCharCode(65 + answerIndex)}) {answer}
                          </Text>
                          {isCorrectAnswer && (
                            <Badge color="green" size="sm">
                              ✓ Richtige Antwort
                            </Badge>
                          )}
                        </Group>
                      </Paper>
                    );
                  })}
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}