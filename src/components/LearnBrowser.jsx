import { useState } from 'react';
import { Stack, Group, Text, ActionIcon, Title, Image, Paper, Badge, NumberInput } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { getImageSrc } from '../utils/images';
import { ANSWER_LABELS } from '../constants';
import { getQuestionCategory } from '../utils/categories';
import { AIExplanation } from './AIExplanation';
import { useQuiz } from '../contexts/QuizContext';

export function LearnBrowser({ data }) {
  const navigate = useNavigate();
  const { questionIndex } = useParams();
  const { selectedState } = useQuiz();
  const currentIndex = parseInt(questionIndex, 10) - 1; // Convert from 1-based to 0-based
  const currentQuestion = data[currentIndex];

  const handlePrevious = () => {
    const newIndex = Math.max(1, parseInt(questionIndex, 10) - 1);
    navigate(`/learn/${newIndex}`);
  };

  const handleNext = () => {
    const newIndex = Math.min(data.length, parseInt(questionIndex, 10) + 1);
    navigate(`/learn/${newIndex}`);
  };

  const handleQuestionJump = (value) => {
    if (value && value >= 1 && value <= data.length) {
      navigate(`/learn/${value}`);
    }
  };

  if (!currentQuestion) return null;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Group gap="sm" align="center">
          <Text size="sm" c="dimmed">
            Frage
          </Text>
          <NumberInput
            value={parseInt(questionIndex, 10)}
            onChange={handleQuestionJump}
            min={1}
            max={data.length}
            w={80}
            size="sm"
            hideControls
          />
          <Text size="sm" c="dimmed">
            von {data.length}
          </Text>
        </Group>
        <Group gap="sm">
          <ActionIcon
            onClick={handlePrevious}
            variant="default"
            size="lg"
            disabled={parseInt(questionIndex, 10) === 1}
          >
            ◀
          </ActionIcon>
          <ActionIcon
            onClick={handleNext}
            variant="default"
            size="lg"
            disabled={parseInt(questionIndex, 10) === data.length}
          >
            ▶
          </ActionIcon>
        </Group>
      </Group>

      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Title order={3} size="h4" style={{ flex: 1 }}>
            {currentQuestion.question}
          </Title>
          {/* <Badge 
            color={getQuestionCategory(currentQuestion.id).color} 
            variant="light"
            size="sm"
          >
            {getQuestionCategory(currentQuestion.id).name}
          </Badge> */}
        </Group>
        
        {currentQuestion.image && (
          <Image
            src={getImageSrc(currentQuestion, selectedState)}
            alt="Question Image"
            mah={300}
            fit="contain"
            radius="md"
          />
        )}
        
        <Stack gap="sm">
        {currentQuestion.options?.map((option, i) => (
          <Paper
            key={i}
            p="md"
            radius="lg"
            withBorder={i === currentQuestion.answerIndex}
            bg={
              i === currentQuestion.answerIndex
                ? "light-dark(var(--mantine-color-emerald-1), var(--mantine-color-emerald-9))"
                : undefined
            }
            style={{
              borderColor:
                i === currentQuestion.answerIndex
                  ? "light-dark(var(--mantine-color-emerald-6), var(--mantine-color-emerald-4))"
                  : undefined,
            }}
          >
            <Text
              fw={i === currentQuestion.answerIndex ? 600 : 400}
              c={
                i === currentQuestion.answerIndex
                  ? "light-dark(var(--mantine-color-dark-9), var(--mantine-color-dark-0))"
                  : undefined
              }
            >
              {ANSWER_LABELS[i]}. {option}
            </Text>
          </Paper>
        ))}
        </Stack>

        {/* AI Explanation for learn mode */}
        <AIExplanation
          question={currentQuestion}
          options={currentQuestion.options}
          correctIndex={currentQuestion.answerIndex}
          userIndex={null} // No user selection in learn mode
          disabled={false}
        />
      </Stack>
    </Stack>
  );
}