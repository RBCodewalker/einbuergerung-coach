import { useMemo, useState } from 'react';
import { 
  Paper, 
  Group, 
  Title, 
  Button, 
  Progress, 
  Text,
  Badge,
  Stack,
  NumberInput,
  ActionIcon,
  ThemeIcon,
  Select,
  Tooltip
} from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw, Filter, Shuffle } from 'lucide-react';
import { useQuiz } from '../contexts/QuizContext';
import { LearnBrowser } from '../components/LearnBrowser';
import { getQuestionCategory } from '../utils/categories';

export function CategoryLearnPage() {
  const navigate = useNavigate();
  const { questionIndex } = useParams();
  const { enhancedLearnSet, stats } = useQuiz();
  const [filterMode, setFilterMode] = useState('alle'); // alle, unbeantwortet, falsch, richtig
  const [isShuffled, setIsShuffled] = useState(false);

  const currentIndex = parseInt(questionIndex, 10) - 1;
  const currentQuestion = enhancedLearnSet[currentIndex];
  
  // Kategorie der aktuellen Frage ermitteln
  const currentCategory = currentQuestion ? getQuestionCategory(currentQuestion.id) : null;

  // Fragen der aktuellen Kategorie filtern und sortieren
  const { categoryQuestions, allCategoryQuestions } = useMemo(() => {
    if (!currentCategory) return { categoryQuestions: [], allCategoryQuestions: [] };

    // Alle Fragen der Kategorie (unabhängig vom Filter)
    const allCategoryQuestions = enhancedLearnSet.filter(q => 
      q.id >= currentCategory.startId && q.id <= currentCategory.endId
    );

    let filteredQuestions = [...allCategoryQuestions];

    // Nach Filtermodus filtern
    switch (filterMode) {
      case 'unbeantwortet':
        filteredQuestions = filteredQuestions.filter(q => !stats?.attempted?.[q.id]);
        break;
      case 'falsch':
        filteredQuestions = filteredQuestions.filter(q => stats?.incorrectAnswers?.[q.id]);
        break;
      case 'richtig':
        filteredQuestions = filteredQuestions.filter(q => stats?.correctAnswers?.[q.id]);
        break;
      default:
        // 'alle' - keine weitere Filterung
        break;
    }

    // Mischen falls aktiviert
    if (isShuffled) {
      filteredQuestions = [...filteredQuestions].sort(() => Math.random() - 0.5);
    }

    return { categoryQuestions: filteredQuestions, allCategoryQuestions };
  }, [enhancedLearnSet, currentCategory, filterMode, stats, isShuffled]);

  // Prüfen ob die aktuelle Frage zur Kategorie gehört
  const isInCategory = currentQuestion && currentCategory && allCategoryQuestions.some(q => q.id === currentQuestion.id);
  
  // Aktueller Index in der gefilterten Liste
  const currentCategoryIndex = categoryQuestions.findIndex(q => q.id === currentQuestion?.id);
  const isValidIndex = currentCategoryIndex !== -1 && isInCategory;

  // Statistiken für die Kategorie
  const categoryStats = useMemo(() => {
    if (!currentCategory || !allCategoryQuestions.length) return null;

    const total = allCategoryQuestions.length;
    const answered = allCategoryQuestions.filter(q => stats?.attempted?.[q.id]).length;
    const correct = allCategoryQuestions.filter(q => stats?.correctAnswers?.[q.id]).length;
    const wrong = allCategoryQuestions.filter(q => stats?.incorrectAnswers?.[q.id]).length;
    
    const progress = total > 0 ? Math.round((answered / total) * 100) : 0;
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    return {
      total,
      answered,
      correct,
      wrong,
      unanswered: total - answered,
      progress,
      accuracy
    };
  }, [currentCategory, allCategoryQuestions, stats]);

  const handlePrevious = () => {
    if (!isValidIndex || currentCategoryIndex <= 0) return;
    
    const prevQuestion = categoryQuestions[currentCategoryIndex - 1];
    const globalIndex = enhancedLearnSet.findIndex(q => q.id === prevQuestion.id);
    navigate(`/lernen/kategorie/${globalIndex + 1}`);
  };

  const handleNext = () => {
    if (!isValidIndex || currentCategoryIndex >= categoryQuestions.length - 1) return;
    
    const nextQuestion = categoryQuestions[currentCategoryIndex + 1];
    const globalIndex = enhancedLearnSet.findIndex(q => q.id === nextQuestion.id);
    navigate(`/lernen/kategorie/${globalIndex + 1}`);
  };

  const handleQuestionJump = (categoryPosition) => {
    if (!categoryPosition || categoryPosition < 1 || categoryPosition > categoryQuestions.length) return;
    
    const targetQuestion = categoryQuestions[categoryPosition - 1];
    const globalIndex = enhancedLearnSet.findIndex(q => q.id === targetQuestion.id);
    navigate(`/lernen/kategorie/${globalIndex + 1}`);
  };

  const handleFilterChange = (newFilter) => {
    setFilterMode(newFilter);
    
    // Nach Filteränderung zur ersten Frage der gefilterten Liste springen  
    // Wir müssen das mit setTimeout machen, da sich categoryQuestions erst beim nächsten Render aktualisiert
    setTimeout(() => {
      // Get fresh filtered questions based on new filter
      let freshFiltered = [...allCategoryQuestions];
      
      switch (newFilter) {
        case 'unbeantwortet':
          freshFiltered = freshFiltered.filter(q => !stats?.attempted?.[q.id]);
          break;
        case 'falsch':
          freshFiltered = freshFiltered.filter(q => stats?.incorrectAnswers?.[q.id]);
          break;
        case 'richtig':
          freshFiltered = freshFiltered.filter(q => stats?.correctAnswers?.[q.id]);
          break;
        default:
          // 'alle' - keine weitere Filterung
          break;
      }
      
      if (freshFiltered.length > 0) {
        const firstQuestion = freshFiltered[0];
        const globalIndex = enhancedLearnSet.findIndex(q => q.id === firstQuestion.id);
        navigate(`/lernen/kategorie/${globalIndex + 1}`);
      }
    }, 50);
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
  };

  // Automatic redirect to first question in category if current question is not in category
  if (!isInCategory && currentQuestion && allCategoryQuestions.length > 0) {
    const firstCategoryQuestion = allCategoryQuestions[0];
    const globalIndex = enhancedLearnSet.findIndex(q => q.id === firstCategoryQuestion.id);
    navigate(`/lernen/kategorie/${globalIndex + 1}`, { replace: true });
    return null;
  }

  if (!currentQuestion || !currentCategory || !categoryStats) {
    return (
      <Paper withBorder p="xl" radius="lg" shadow="sm" mt="xl">
        <Text>Frage nicht gefunden</Text>
        <Button onClick={() => navigate('/lernen/themenbereiche')} mt="md">
          Zurück zu den Themenbereichen
        </Button>
      </Paper>
    );
  }

  if (!isValidIndex) {
    // If question is in category but not in current filter, show option to reset filter
    if (isInCategory) {
      return (
        <Paper withBorder p="xl" radius="lg" shadow="sm" mt="xl">
          <Stack gap="md">
            <Text>Diese Frage ist im aktuellen Filter "{filterMode}" nicht verfügbar.</Text>
            <Group>
              <Button onClick={() => setFilterMode('alle')} variant="filled">
                Alle Fragen anzeigen
              </Button>
              <Button onClick={() => navigate('/lernen/themenbereiche')} variant="default">
                Zurück zu den Themenbereichen
              </Button>
            </Group>
          </Stack>
        </Paper>
      );
    } else {
      // Question not in this category at all - redirect to themenbereiche
      navigate('/lernen/themenbereiche', { replace: true });
      return null;
    }
  }

  return (
    <Stack gap="lg" mt="xl">
      {/* Header mit Kategorie-Info */}
      <Paper withBorder p="lg" radius="lg" shadow="sm">
        <Group justify="space-between" align="center" mb="md">
          <Group gap="sm">
            <ThemeIcon size="lg" color={currentCategory.color} variant="light">
              <Text size="lg">{currentCategory.icon}</Text>
            </ThemeIcon>
            <Stack gap={2}>
              <Title order={2} size="h4">
                {currentCategory.name}
              </Title>
              <Text size="sm" c="dimmed">
                {currentCategory.description}
              </Text>
            </Stack>
          </Group>
          <Button
            onClick={() => navigate('/lernen/themenbereiche')}
            variant="default"
            leftSection={<RotateCcw size={16} />}
          >
            Themenbereiche
          </Button>
        </Group>

        {/* Fortschritt und Statistiken */}
        <Group justify="space-between" align="center">
          <Group gap="lg">
            <Stack gap={2} align="center">
              <Text size="xs" c="dimmed">Fortschritt</Text>
              <Badge color={categoryStats.progress === 100 ? 'green' : 'blue'} variant="light">
                {categoryStats.progress}%
              </Badge>
            </Stack>
            <Stack gap={2} align="center">
              <Text size="xs" c="dimmed">Bearbeitet</Text>
              <Text size="sm" fw={500}>{categoryStats.answered}/{categoryStats.total}</Text>
            </Stack>
            {categoryStats.answered > 0 && (
              <Stack gap={2} align="center">
                <Text size="xs" c="dimmed">Erfolgsrate</Text>
                <Badge 
                  color={categoryStats.accuracy >= 70 ? 'green' : categoryStats.accuracy >= 50 ? 'orange' : 'red'} 
                  variant="light"
                >
                  {categoryStats.accuracy}%
                </Badge>
              </Stack>
            )}
          </Group>
        </Group>

        {/* Fortschrittsbalken */}
        <Progress
          value={categoryStats.progress}
          color={categoryStats.progress === 100 ? 'green' : 'blue'}
          size="sm"
          radius="xl"
          mt="sm"
        />
      </Paper>

      {/* Navigation und Filter */}
      <Paper withBorder p="lg" radius="lg" shadow="sm">
        <Group justify="space-between" align="center">
          {/* Filter und Shuffle */}
          <Group gap="sm">
            <Select
              value={filterMode}
              onChange={handleFilterChange}
              data={[
                { value: 'alle', label: `Alle (${categoryStats.total})` },
                { value: 'unbeantwortet', label: `Unbeantwortet (${categoryStats.unanswered})` },
                { value: 'falsch', label: `Falsch (${categoryStats.wrong})` },
                { value: 'richtig', label: `Richtig (${categoryStats.correct})` }
              ]}
              leftSection={<Filter size={16} />}
              w={180}
              size="sm"
            />
            <Tooltip label={isShuffled ? "Zufällige Reihenfolge aktiv" : "Ursprüngliche Reihenfolge"}>
              <ActionIcon
                onClick={toggleShuffle}
                variant={isShuffled ? "filled" : "default"}
                color="blue"
                size="lg"
              >
                <Shuffle size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>

          {/* Fragen Navigation */}
          <Group gap="sm" align="center">
            <Text size="sm" c="dimmed">Frage</Text>
            <NumberInput
              value={currentCategoryIndex + 1}
              onChange={handleQuestionJump}
              min={1}
              max={categoryQuestions.length}
              w={80}
              size="sm"
              hideControls
            />
            <Text size="sm" c="dimmed">von {categoryQuestions.length}</Text>
            
            <Group gap="xs" ml="sm">
              <ActionIcon
                onClick={handlePrevious}
                variant="default"
                size="lg"
                disabled={currentCategoryIndex <= 0}
              >
                <ArrowLeft size={16} />
              </ActionIcon>
              <ActionIcon
                onClick={handleNext}
                variant="default"
                size="lg"
                disabled={currentCategoryIndex >= categoryQuestions.length - 1}
              >
                <ArrowRight size={16} />
              </ActionIcon>
            </Group>
          </Group>
        </Group>
      </Paper>

      {/* Lern-Browser */}
      <LearnBrowser data={enhancedLearnSet} />
    </Stack>
  );
}