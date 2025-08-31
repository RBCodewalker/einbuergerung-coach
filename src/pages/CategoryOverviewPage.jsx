import { useMemo } from 'react';
import {
  Stack,
  Paper,
  Title,
  Text,
  SimpleGrid,
  Group,
  Badge,
  Progress,
  Box,
  Center
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { getAllCategories } from '../utils/categories';

export function CategoryOverviewPage() {
  const navigate = useNavigate();
  const { enhancedLearnSet, stats } = useQuiz();

  // Alle Kategorien mit Statistiken abrufen
  const categoriesWithStats = useMemo(() => {
    const categories = getAllCategories();
    
    return categories.map(category => {
      // Fragen für diese Kategorie filtern
      const categoryQuestions = enhancedLearnSet.filter(q => 
        q.id >= category.startId && q.id <= category.endId
      );
      
      // Statistiken berechnen
      const totalQuestions = categoryQuestions.length;
      const answeredQuestions = categoryQuestions.filter(q => 
        stats?.attempted?.[q.id]
      ).length;
      const correctAnswers = categoryQuestions.filter(q => 
        stats?.correctAnswers?.[q.id]
      ).length;
      const wrongAnswers = categoryQuestions.filter(q => 
        stats?.incorrectAnswers?.[q.id]
      ).length;
      
      const progressPercentage = totalQuestions > 0 
        ? Math.round((answeredQuestions / totalQuestions) * 100) 
        : 0;
      
      const accuracyPercentage = answeredQuestions > 0
        ? Math.round((correctAnswers / answeredQuestions) * 100)
        : 0;

      return {
        ...category,
        totalQuestions,
        answeredQuestions,
        correctAnswers,
        wrongAnswers,
        progressPercentage,
        accuracyPercentage,
        unansweredQuestions: totalQuestions - answeredQuestions
      };
    });
  }, [enhancedLearnSet, stats]);

  // Mapping von Kategorien zu URL-Segmenten
  const getCategoryUrlSegment = (category) => {
    const mapping = {
      "Geschichte Teil 1": "geschichte-1",
      "Geschichte Teil 2": "geschichte-2", 
      "Verfassung, Feiertage und Religion": "verfassung",
      "Deutschland": "deutschland",
      "Politisches System Teil 1": "politik-1",
      "Politisches System Teil 2": "politik-2",
      "Rechtssystem und Arbeit": "recht",
      "Bildung, Familie und EU Teil 1": "bildung-1",
      "Bildung, Familie und EU Teil 2": "bildung-2",
      "Landesfragen": "laender"
    };
    
    return mapping[category.name] || 'alle';
  };

  const handleCategoryClick = (category) => {
    // Find the first question of this category in the enhancedLearnSet
    const firstCategoryQuestion = enhancedLearnSet.find(q => 
      q.id >= category.startId && 
      (category.endId === 999 ? true : q.id <= category.endId)
    );
    
    if (firstCategoryQuestion) {
      // Find the global index of this question
      const globalIndex = enhancedLearnSet.findIndex(q => q.id === firstCategoryQuestion.id);
      const categorySegment = getCategoryUrlSegment(category);
      navigate(`/lernen/${categorySegment}/${globalIndex + 1}`);
    } else {
      // Fallback - navigate to themenbereiche if no questions found
      console.warn('No questions found for category:', category.name);
      navigate('/lernen/themenbereiche');
    }
  };

  const totalStats = useMemo(() => {
    const total = categoriesWithStats.reduce((acc, cat) => ({
      totalQuestions: acc.totalQuestions + cat.totalQuestions,
      answeredQuestions: acc.answeredQuestions + cat.answeredQuestions,
      correctAnswers: acc.correctAnswers + cat.correctAnswers,
      wrongAnswers: acc.wrongAnswers + cat.wrongAnswers
    }), { totalQuestions: 0, answeredQuestions: 0, correctAnswers: 0, wrongAnswers: 0 });

    const overallProgress = total.totalQuestions > 0 
      ? Math.round((total.answeredQuestions / total.totalQuestions) * 100) 
      : 0;
    
    const overallAccuracy = total.answeredQuestions > 0
      ? Math.round((total.correctAnswers / total.answeredQuestions) * 100)
      : 0;

    return { ...total, overallProgress, overallAccuracy };
  }, [categoriesWithStats]);

  return (
    <Stack gap="xl" mt="xl">
      {/* Header */}
      <Stack gap={4} mb="xl">
        <Title order={1} size="h2">
          Themenbereiche
        </Title>
        <Text c="dimmed" size="sm">
          Wähle einen Themenbereich zum gezielten Lernen
        </Text>
      </Stack>

      {/* Alle Fragen Option */}
      <Paper withBorder p="lg" radius="md" shadow="sm" style={{ cursor: 'pointer', background: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))' }} onClick={() => navigate('/lernen/alle/1')}>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Text size="xl">📚</Text>
            <Stack gap={2}>
              <Text fw={600} size="md">
                Alle Fragen (Sequenziell)
              </Text>
              <Text size="sm" c="dimmed">
                Alle {totalStats.totalQuestions} Fragen der Reihe nach durchgehen
              </Text>
            </Stack>
          </Group>
          <Badge color="blue" variant="light">
            {totalStats.totalQuestions} Fragen
          </Badge>
        </Group>
      </Paper>

      {/* Kategorien Grid */}
      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
        {categoriesWithStats.map((category, index) => (
          <Paper
            key={category.name}
            withBorder
            p="lg"
            radius="md"
            shadow="sm"
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              ':hover': {
                transform: 'translateY(-2px)',
                boxShadow: 'var(--mantine-shadow-md)'
              }
            }}
            onClick={() => handleCategoryClick(category)}
          >
            <Stack gap="md">
              {/* Header */}
              <Group justify="space-between" align="flex-start">
                <Group gap="sm" align="flex-start" style={{ flex: 1 }}>
                  <Text size="xl">{category.icon}</Text>
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Text fw={600} size="sm" lineClamp={2}>
                      {category.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {category.description}
                    </Text>
                  </Stack>
                </Group>
                <Badge
                  size="sm"
                  color={category.progressPercentage === 100 ? 'green' : 'blue'}
                  variant="light"
                >
                  {category.totalQuestions} Fragen
                </Badge>
              </Group>

              {/* Fortschrittsbalken */}
              <Box>
                <Group justify="space-between" mb={4}>
                  <Text size="xs" c="dimmed">Bearbeitet</Text>
                  <Text size="xs" c="dimmed">{category.progressPercentage}%</Text>
                </Group>
                <Progress
                  value={category.progressPercentage}
                  color={category.progressPercentage === 100 ? 'green' : 'blue'}
                  size="sm"
                  radius="xl"
                />
              </Box>

              {/* Statistiken */}
              <Group justify="space-between" gap="xs">
                <Group gap="xs">
                  <Text size="xs" c="green">
                    ✓ {category.correctAnswers}
                  </Text>
                  <Text size="xs" c="red">
                    ✗ {category.wrongAnswers}
                  </Text>
                  <Text size="xs" c="dimmed">
                    − {category.unansweredQuestions}
                  </Text>
                </Group>
                {category.answeredQuestions > 0 && (
                  <Badge
                    size="xs"
                    color={category.accuracyPercentage >= 70 ? 'green' : category.accuracyPercentage >= 50 ? 'orange' : 'red'}
                    variant="light"
                  >
                    {category.accuracyPercentage}% richtig
                  </Badge>
                )}
              </Group>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      {/* Hinweise */}
      <Paper withBorder p="lg" radius="md" bg="light-dark(var(--mantine-color-blue-0), var(--mantine-color-gray-9))">
        <Center>
          <Group gap="sm">
            <Text size="sm" c="blue" ta="center">
              <Text span fw={600}>💡 Tipp:</Text> Klicke auf einen Themenbereich, um gezielt zu üben. 
              Bereiche mit niedriger Erfolgsrate sollten wiederholt werden.
            </Text>
          </Group>
        </Center>
      </Paper>
    </Stack>
  );
}