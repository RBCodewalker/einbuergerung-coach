import {
  Stack,
  Progress,
  Group,
  Text,
  Badge,
  Paper,
  Title,
  Image,
  Button,
  NumberInput,
  Modal
} from '@mantine/core';
import { Flag, RefreshCcw, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuiz } from '../contexts/QuizContext';
import { QuizOption } from '../components/QuizOption';
import { getImageSrc } from '../utils/images';
import { TIMER_WARNING_THRESHOLD } from '../constants';
import { getQuestionCategory } from '../utils/categories';
import { AIExplanation } from '../components/AIExplanation';
import { QuestionNavigator } from '../components/QuestionNavigator';

export function QuizPage() {
  const navigate = useNavigate();
  const { questionIndex } = useParams();
  const {
    progress,
    current,
    questions,
    currentQA,
    flags,
    quizDuration,
    remaining,
    formatTime,
    answers,
    handleAnswer,
    toggleFlag,
    setShowReview,
    completeQuiz,
    excludeCorrect,
    selectedState,
    showTimeUpModal,
    setShowTimeUpModal
  } = useQuiz();

  const handleQuestionJump = (value) => {
    if (value && value >= 1 && value <= questions.length) {
      navigate(`/quiz/${value}`);
    }
  };

  // Enhanced keyboard shortcuts with flag toggle
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Don't trigger if user is typing in an input
      if (event.target.tagName === 'INPUT') return;
      
      if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        toggleFlag();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleFlag]);

  if (!currentQA) return null;

  return (
    <>
      {/* Fixed UI Elements - Should not animate */}
      <Stack gap="lg" mt="xl" pb={80}>
        {/* Progress Bar */}
        <Stack gap="xs">
          <Progress value={progress} color="emerald" size="sm" radius="xl" />
          {excludeCorrect && (
            <Text size="xs" c="blue" ta="center">
              📚 Nur noch nicht beherrschte Fragen
            </Text>
          )}
        </Stack>
        
        {/* Question Counter */}
        <Group justify="space-between" align="center">
          <Group align="center" gap="sm">
            <Text size="sm" c="dimmed">
              Frage
            </Text>
            <NumberInput
              value={parseInt(questionIndex, 10)}
              onChange={handleQuestionJump}
              min={1}
              max={questions.length}
              w={80}
              size="sm"
              hideControls
            />
            <Text size="sm" c="dimmed">
              von {questions.length}
            </Text>
            {flags.includes(current) && (
              <Badge
                color="yellow"
                variant="light"
                leftSection={<Flag size={14} />}
                size="sm"
              >
                flagged
              </Badge>
            )}
          </Group>
          {quizDuration > 0 && (
            <Badge
              color={remaining <= 60 ? 'red' : 'gray'}
              variant="light"
              size="lg"
            >
              ⏱ {formatTime}
            </Badge>
          )}
        </Group>

        {/* Animated Question Content Only */}
        <QuestionNavigator
          mode="quiz"
          questions={questions}
          currentIndex={parseInt(questionIndex, 10) - 1}
          baseRoute="/quiz"
          centerActions={
            <Group gap="sm">
              <Button
                onClick={toggleFlag}
                variant={flags.includes(current) ? 'light' : 'subtle'}
                color={flags.includes(current) ? 'yellow' : 'gray'}
                leftSection={<Flag size={16} />}
                size="sm"
              >
                Flag
              </Button>
              <Button
                onClick={() => {
                  setShowReview(true);
                  completeQuiz();
                  navigate('/quiz/review');
                }}
                variant="subtle"
                color="blue"
                leftSection={<RefreshCcw size={16} />}
                size="sm"
              >
                Review
              </Button>
            </Group>
          }
        >
          <Paper withBorder p="xl" radius="lg" shadow="sm">
        <Group justify="space-between" align="flex-start" mb="lg">
          <Title order={2} size="h3" style={{ flex: 1 }}>
            {currentQA.question}
          </Title>
          {/* <Badge 
            color={getQuestionCategory(currentQA.id).color} 
            variant="light"
            size="sm"
          >
            {getQuestionCategory(currentQA.id).name}
          </Badge> */}
        </Group>
        
        {currentQA.image && (
          <Image
            src={getImageSrc(currentQA, selectedState)}
            alt="Question Image"
            mah={300}
            fit="contain"
            radius="md"
            mb="lg"
          />
        )}
        
        <Stack gap="md">
          {currentQA.options?.map((option, i) => (
            <QuizOption
              key={i}
              option={option}
              index={i}
              isSelected={answers[current] === i}
              isCorrect={currentQA.answerIndex === i}
              showResult={answers[current] === i}
              onSelect={handleAnswer}
            />
          ))}
        </Stack>

        {/* AI Explanation - only show if user has answered */}
        {answers[current] !== -1 && (
          <AIExplanation
            question={currentQA}
            options={currentQA.options}
            correctIndex={currentQA.answerIndex}
            userIndex={answers[current]}
            disabled={false}
          />
        )}

          </Paper>
        </QuestionNavigator>
      </Stack>

      {/* Timer Expiry Modal */}
      <Modal
        opened={showTimeUpModal}
        onClose={() => {}}
        title={
          <Group gap="sm">
            <Clock size={20} color="red" />
            <Text fw={600}>Zeit abgelaufen!</Text>
          </Group>
        }
        centered
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
      >
        <Stack gap="lg">
          <Text>
            Die Zeit für den Quiz ist abgelaufen. Du kannst deine Antworten überprüfen oder zum Dashboard zurückkehren.
          </Text>
          
          <Group justify="center" gap="md">
            <Button
              variant="filled"
              color="blue"
              leftSection={<RefreshCcw size={16} />}
              onClick={() => {
                setShowReview(true);
                setShowTimeUpModal(false);
                navigate('/quiz/review');
              }}
            >
              Antworten überprüfen
            </Button>
            
            <Button
              variant="default"
              onClick={() => {
                setShowTimeUpModal(false);
                navigate('/');
              }}
            >
              Zum Dashboard
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}