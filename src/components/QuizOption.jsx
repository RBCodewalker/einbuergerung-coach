import { Button, Group, Badge, Text } from '@mantine/core';
import { motion } from 'framer-motion';
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
    <motion.div whileTap={{ scale: 0.98 }}>
      <Button
        onClick={() => onSelect(index)}
        variant={isSelected ? (isCorrect ? 'light' : 'light') : 'default'}
        color={isSelected ? (isCorrect ? 'emerald' : 'red') : 'gray'}
        justify="flex-start"
        fullWidth
        p="md"
        h="auto"
        style={{ textAlign: 'left' }}
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
    </motion.div>
  );
}