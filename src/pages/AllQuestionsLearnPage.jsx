import { useState, useEffect } from 'react';
import { Paper, Group, Title, Button, Stack, ActionIcon, Tooltip } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Search } from 'lucide-react';
import { useQuiz } from '../contexts/QuizContext';
import { LearnBrowser } from '../components/LearnBrowser';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { QuestionSearch } from '../components/QuestionSearch';

export function AllQuestionsLearnPage() {
  const { enhancedLearnSet } = useQuiz();
  const navigate = useNavigate();
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const handleQuestionSelect = (question) => {
    // Find the global index of the selected question
    const questionIndex = enhancedLearnSet.findIndex(q => q.id === question.id);
    if (questionIndex !== -1) {
      // Navigate to the question (1-based index for URL)
      navigate(`/lernen/alle/${questionIndex + 1}`);
    }
  };

  // Handle keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchVisible(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Stack gap="lg" mt="xl" pb={80}>
      {/* Search Component */}
      <QuestionSearch
        questions={enhancedLearnSet}
        isVisible={isSearchVisible}
        onClose={() => setIsSearchVisible(false)}
        onQuestionSelect={handleQuestionSelect}
      />

      {/* Fixed Header - Should not animate */}
      <Paper withBorder p="lg" radius="lg" shadow="sm">
        <Group justify="space-between" align="center">
          <Title order={2} size="h4">
            Alle Fragen - Lern-Modus
          </Title>
          <Group gap="sm">
            <Tooltip 
              label="Fragen durchsuchen (Strg+K)"
              position="bottom"
              withArrow
            >
              <ActionIcon
                variant="light"
                color="blue"
                size="lg"
                onClick={() => setIsSearchVisible(true)}
              >
                <Search size={18} />
              </ActionIcon>
            </Tooltip>
            <Button 
              onClick={() => navigate('/lernen/themenbereiche')} 
              variant="default"
              leftSection={<RotateCcw size={16} />}
            >
              Themenbereiche
            </Button>
          </Group>
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