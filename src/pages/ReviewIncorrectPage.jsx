import { 
  Stack, 
  Group, 
  Title, 
  Paper, 
  Text, 
  Button, 
  Badge,
  Divider,
  Image,
  Switch
} from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { getQuestionCategory } from '../utils/categories';
import { getImageSrc } from '../utils/images';

export function ReviewIncorrectPage() {
  const { learnSet, stats, markAsLearned, unmarkAsLearned, selectedState } = useQuiz();
  const navigate = useNavigate();
  const [showLearned, setShowLearned] = useState(false);

  // Get questions that were answered incorrectly
  const allIncorrectQuestions = (learnSet || []).filter((question) => {
    return stats?.incorrectAnswers?.[question.id] !== undefined;
  });

  // Get questions that were answered incorrectly and not yet marked as learned
  const unlearnedIncorrectQuestions = allIncorrectQuestions.filter((question) => {
    return !stats?.learnedQuestions?.[question.id];
  });

  // Get questions that were answered incorrectly but marked as learned
  const learnedIncorrectQuestions = allIncorrectQuestions.filter((question) => {
    return stats?.learnedQuestions?.[question.id];
  });

  const displayQuestions = showLearned ? allIncorrectQuestions : unlearnedIncorrectQuestions;

  // Early return if data is not ready
  if (!learnSet || !stats) {
    return (
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Title order={1} size="h1">
            Falsche Antworten
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
          Falsche Antworten ({unlearnedIncorrectQuestions.length})
        </Title>
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
        >
          Zurück zum Dashboard
        </Button>
      </Group>

      {/* Controls */}
      {learnedIncorrectQuestions.length > 0 && (
        <Paper withBorder p="md" radius="lg">
          <Group justify="space-between" align="center">
            <Group gap="md" align="center">
              <Text size="sm" c="dimmed">
                {learnedIncorrectQuestions.length} Frage(n) als gelernt markiert
              </Text>
              <Switch
                label="Gelernte Fragen anzeigen"
                checked={showLearned}
                onChange={(event) => setShowLearned(event.currentTarget.checked)}
                size="sm"
              />
            </Group>
          </Group>
        </Paper>
      )}

      {displayQuestions.length === 0 ? (
        <Paper withBorder p="xl" radius="lg" shadow="sm">
          <Text ta="center" c="dimmed">
            {showLearned 
              ? "Keine falschen Antworten zum Anzeigen." 
              : unlearnedIncorrectQuestions.length === 0 && learnedIncorrectQuestions.length > 0
                ? "Alle falschen Antworten wurden als gelernt markiert! 🎉" 
                : "Keine falschen Antworten zum Anzeigen."
            }
          </Text>
        </Paper>
      ) : (
        <Stack gap="lg">
          {displayQuestions.map((question) => {
            const userWrongAnswer = stats.incorrectAnswers[question.id];
            const isLearned = stats?.learnedQuestions?.[question.id];
            
            return (
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
                      <Badge color="red" variant="light">
                        Falsch beantwortet
                      </Badge>
                      {isLearned && (
                        <Badge color="blue" variant="light">
                          Gelernt ✓
                        </Badge>
                      )}
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
                      const isUserWrongAnswer = answerIndex === userWrongAnswer;
                      const isCorrectAnswer = answerIndex === question.answerIndex;
                      
                      let backgroundColor = 'transparent';
                      let borderColor = 'var(--mantine-color-gray-3)';
                      
                      if (isUserWrongAnswer && !isCorrectAnswer) {
                        backgroundColor = 'light-dark(var(--mantine-color-red-1), var(--mantine-color-red-9))';
                        borderColor = 'var(--mantine-color-red-4)';
                      } else if (isCorrectAnswer) {
                        backgroundColor = 'light-dark(var(--mantine-color-emerald-1), var(--mantine-color-emerald-9))';
                        borderColor = 'var(--mantine-color-green-4)';
                      }

                      return (
                        <Paper
                          key={answerIndex}
                          p="sm"
                          radius="md"
                          bg={backgroundColor}
                          style={{
                            border: `2px solid ${borderColor}`
                          }}
                        >
                          <Group gap="sm" justify="space-between">
                            <Text fw={isUserWrongAnswer || isCorrectAnswer ? 600 : 400}>
                              {String.fromCharCode(65 + answerIndex)}) {answer}
                            </Text>
                            <Group gap="xs">
                              {isUserWrongAnswer && !isCorrectAnswer && (
                                <Badge color="red" size="sm">
                                  ✗ Deine Antwort
                                </Badge>
                              )}
                              {isCorrectAnswer && (
                                <Badge color="green" size="sm">
                                  ✓ Richtige Antwort
                                </Badge>
                              )}
                            </Group>
                          </Group>
                        </Paper>
                      );
                    })}
                  </Stack>
                  
                  {/* Mark as Learned Button */}
                  <Group justify="flex-end" mt="md">
                    {isLearned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        color="gray"
                        onClick={() => unmarkAsLearned(question.id)}
                      >
                        Als ungelernt markieren
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="light"
                        color="blue"
                        onClick={() => markAsLearned(question.id)}
                      >
                        Als gelernt markieren
                      </Button>
                    )}
                  </Group>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}