import { useMemo } from 'react';
import { 
  Paper, 
  Group, 
  Title, 
  Button, 
  Text,
  Stack,
  ThemeIcon
} from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { useQuiz } from '../contexts/QuizContext';
import { LearnBrowser } from '../components/LearnBrowser';
import { getQuestionCategory } from '../utils/categories';
import { QuestionNavigator } from '../components/QuestionNavigator';

// Mapping von URL-Segmenten zu Kategorien
const CATEGORY_URL_MAPPING = {
  'geschichte-1': { startId: 1, endId: 35 },
  'geschichte-2': { startId: 36, endId: 68 },
  'verfassung': { startId: 69, endId: 98 },
  'deutschland': { startId: 99, endId: 133 },
  'politik-1': { startId: 134, endId: 173 },
  'politik-2': { startId: 174, endId: 213 },
  'recht': { startId: 214, endId: 246 },
  'bildung-1': { startId: 247, endId: 272 },
  'bildung-2': { startId: 273, endId: 300 },
  'laender': { startId: 301, endId: 999 }
};

export function CategorySpecificLearnPage({ categoryMode }) {
  const navigate = useNavigate();
  const { questionIndex } = useParams();
  const { enhancedLearnSet, stats } = useQuiz();

  const currentIndex = parseInt(questionIndex, 10) - 1;
  const currentQuestion = enhancedLearnSet[currentIndex];


  // Kategorie-Range basierend auf categoryMode ermitteln
  const categoryRange = CATEGORY_URL_MAPPING[categoryMode];
  const currentCategory = categoryRange ? getQuestionCategory(categoryRange.startId) : null;


  // Alle Fragen der Kategorie
  const allCategoryQuestions = useMemo(() => {
    if (!categoryRange) return [];
    
    const filtered = enhancedLearnSet.filter(q => 
      q.id >= categoryRange.startId && 
      (categoryRange.endId === 999 ? true : q.id <= categoryRange.endId)
    );


    return filtered;
  }, [enhancedLearnSet, categoryRange, categoryMode]);

  // Fragen der Kategorie (ohne Filter)
  const categoryQuestions = allCategoryQuestions;

  // Aktueller Index in der gefilterten Liste
  const currentCategoryIndex = categoryQuestions.findIndex(q => q.id === currentQuestion?.id);
  const isQuestionInCategory = allCategoryQuestions.some(q => q.id === currentQuestion?.id);
  const isValidIndex = currentCategoryIndex !== -1;


  // Statistiken für die Kategorie
  const categoryStats = useMemo(() => {
    if (!allCategoryQuestions.length) return null;

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
  }, [allCategoryQuestions, stats]);

  // Custom navigation handler for category-specific routing
  const handleCategoryNavigate = (newGlobalIndex) => {
    // newGlobalIndex is 0-based global index from QuestionNavigator
    const targetQuestion = enhancedLearnSet[newGlobalIndex];
    const isTargetInCategory = targetQuestion && allCategoryQuestions.some(q => q.id === targetQuestion.id);
    

    if (isTargetInCategory) {
      // Target is within category - allow navigation
      navigate(`/lernen/${categoryMode}/${newGlobalIndex + 1}`, { replace: true });
    } else {
      // Target is outside category - find boundary question
      const currentCategoryIndex = allCategoryQuestions.findIndex(q => q.id === currentQuestion?.id);
      let boundaryQuestion = null;
      
      if (newGlobalIndex > currentIndex) {
        // Trying to go forward - go to last question in category
        boundaryQuestion = allCategoryQuestions[allCategoryQuestions.length - 1];
      } else {
        // Trying to go backward - go to first question in category  
        boundaryQuestion = allCategoryQuestions[0];
      }
      
      if (boundaryQuestion) {
        const boundaryGlobalIndex = enhancedLearnSet.findIndex(q => q.id === boundaryQuestion.id);
        navigate(`/lernen/${categoryMode}/${boundaryGlobalIndex + 1}`, { replace: true });
      }
    }
  };



  // Automatische Weiterleitung zur ersten Frage der Kategorie falls aktuelle Frage nicht zur Kategorie gehört
  if (!isQuestionInCategory && allCategoryQuestions.length > 0) {
    const firstQuestion = allCategoryQuestions[0];
    const globalIndex = enhancedLearnSet.findIndex(q => q.id === firstQuestion.id);
    
    
    navigate(`/lernen/${categoryMode}/${globalIndex + 1}`, { replace: true });
    return null;
  }

  if (!currentQuestion || !currentCategory || !categoryStats) {
    return (
      <Paper withBorder p="xl" radius="lg" shadow="sm" mt="xl">
        <Text>Frage nicht gefunden oder Kategorie ungültig</Text>
        <Button onClick={() => navigate('/lernen/themenbereiche')} mt="md">
          Zurück zu den Themenbereichen
        </Button>
      </Paper>
    );
  }

  if (!isValidIndex) {
    return (
      <Paper withBorder p="xl" radius="lg" shadow="sm" mt="xl">
        <Stack gap="md">
          <Text>Diese Frage gehört nicht zu dieser Kategorie.</Text>
          <Button onClick={() => navigate('/lernen/themenbereiche')} variant="default">
            Zurück zu den Themenbereichen
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="lg" mt="xl" pb={80}>
      {/* Fixed Category Header - Should not animate */}
      <Paper withBorder p="lg" radius="lg" shadow="sm">
        <Group justify="space-between" align="center">
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
      </Paper>

      {/* Animated Question Content Only */}
      <QuestionNavigator
        mode="learn"
        questions={enhancedLearnSet}
        currentIndex={currentIndex}
        baseRoute={`/lernen/${categoryMode}`}
        onNavigate={handleCategoryNavigate}
        centerActions={
          <Text size="sm" c="dimmed" ta="center">
            Frage {currentCategoryIndex + 1} von {categoryQuestions.length}
          </Text>
        }
      >
        <LearnBrowser 
          data={categoryQuestions} 
          hideNavigation={true} 
          currentIndex={currentCategoryIndex}
        />
      </QuestionNavigator>
    </Stack>
  );
}