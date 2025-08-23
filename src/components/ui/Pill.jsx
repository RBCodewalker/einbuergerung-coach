import { Paper, Text } from '@mantine/core';

const COLOR_MAP = {
  emerald: 'emerald',
  rose: 'red', 
  zinc: 'gray',
  sky: 'blue',
};

export function Pill({ label, value, tone }) {
  return (
    <Paper p="md" radius="lg" bg={`light-dark(var(--mantine-color-${COLOR_MAP[tone]}-1), var(--mantine-color-${COLOR_MAP[tone]}-7))`}>
      <Text
        size="xs"
        mb={4}
        c={`light-dark(var(--mantine-color-dark-6), var(--mantine-color-dark-0))`}
      >
        {label}
      </Text>
      <Text
        size="xl"
        fw={700}
        c={`light-dark(var(--mantine-color-dark-9), var(--mantine-color-dark-0))`}
      >
        {value}
      </Text>
    </Paper>
  );
}