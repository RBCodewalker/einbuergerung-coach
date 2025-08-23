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
  ActionIcon,
  NumberInput
} from '@mantine/core';
import { Flag, RefreshCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuiz } from '../contexts/QuizContext';
import { QuizOption } from '../components/QuizOption';
import { getImageSrc } from '../utils/images';
import { TIMER_WARNING_THRESHOLD } from '../constants';
import { getQuestionCategory } from '../utils/categories';

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
    excludeCorrect
  } = useQuiz();

  const handleNext = () => {
    const nextIndex = Math.min(questions.length, parseInt(questionIndex, 10) + 1);
    if (nextIndex > questions.length) {
      navigate('/quiz/review');
    } else {
      navigate(`/quiz/${nextIndex}`);
    }
  };

  const handlePrev = () => {
    const prevIndex = Math.max(1, parseInt(questionIndex, 10) - 1);
    navigate(`/quiz/${prevIndex}`);
  };

  const handleQuestionJump = (value) => {
    if (value && value >= 1 && value <= questions.length) {
      navigate(`/quiz/${value}`);
    }
  };

  if (!currentQA) return null;

  return (
    <Stack mt="xl" gap="lg">
      <Stack gap="xs">
        <Progress value={progress} color="emerald" size="sm" radius="xl" />
        {excludeCorrect && (
          <Text size="xs" c="blue" ta="center">
            📚 Nur noch nicht beherrschte Fragen
          </Text>
        )}
      </Stack>
      
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
            src={getImageSrc(currentQA)}
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

        <Group justify="space-between" mt="lg">
          <Group gap="sm">
            <Button 
              onClick={handlePrev} 
              variant="default" 
              visibleFrom="sm"
              disabled={parseInt(questionIndex, 10) === 1}
            >
              Zurück
            </Button>
            <ActionIcon
              onClick={handlePrev}
              variant="default"
              size="lg"
              hiddenFrom="sm"
              disabled={parseInt(questionIndex, 10) === 1}
            >
              ◀
            </ActionIcon>
            <Button 
              onClick={handleNext} 
              variant="default" 
              visibleFrom="sm"
              disabled={parseInt(questionIndex, 10) === questions.length}
            >
              Weiter
            </Button>
            <ActionIcon
              onClick={handleNext}
              variant="default"
              size="lg"
              hiddenFrom="sm"
              disabled={parseInt(questionIndex, 10) === questions.length}
            >
              ▶
            </ActionIcon>
          </Group>
          
          <Group gap="sm">
            <Button
              onClick={toggleFlag}
              variant={flags.includes(current) ? 'light' : 'default'}
              color={flags.includes(current) ? 'yellow' : 'gray'}
              leftSection={<Flag size={16} />}
            >
              Flag
            </Button>
            <Button
              onClick={() => {
                setShowReview(true);
                completeQuiz();
                navigate('/quiz/review');
              }}
              variant="default"
              leftSection={<RefreshCcw size={16} />}
            >
              Review
            </Button>
          </Group>
        </Group>
      </Paper>
    </Stack>
  );
}