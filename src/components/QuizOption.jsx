import { Button, Group, Badge, Text } from '@mantine/core';
import { Check, X } from 'lucide-react';
import { ANSWER_LABELS } from '../constants';

export function QuizOption({ 
  option, 
  index, 
  isSelected, 
  isCorrect, 
  showResult, 
  onSelect 
}) {
  return (
    <div style={{ transform: 'scale(1)', transition: 'transform 0.1s ease' }}>
      <Button
        onClick={() => onSelect(index)}
        variant={isSelected ? (isCorrect ? 'light' : 'light') : 'default'}
        color={isSelected ? (isCorrect ? 'emerald' : 'red') : 'gray'}
        justify="flex-start"
        fullWidth
        p="md"
        h="auto"
        style={{ 
          textAlign: 'left',
          transform: 'scale(1)',
          transition: 'transform 0.1s ease'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Group gap="md" w="100%">
          <Badge
            variant="outline"
            size="sm"
            color={isSelected ? (isCorrect ? 'emerald' : 'red') : 'gray'}
          >
            {ANSWER_LABELS[index]}
          </Badge>
          <Text flex={1}>{option}</Text>
          {showResult && isSelected && (
            isCorrect ? <Check size={18} /> : <X size={18} />
          )}
        </Group>
      </Button>
    </div>
  );
}