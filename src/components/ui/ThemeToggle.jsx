import { Button, ActionIcon, Group } from '@mantine/core';
import { Sun, Moon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function ThemeToggle() {
  const { colorScheme, toggleDark } = useApp();

  return (
    <Group gap="sm">
      <Button
        onClick={toggleDark}
        variant="default"
        leftSection={colorScheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        visibleFrom="sm"
      >
        {colorScheme === 'dark' ? 'Light' : 'Dark'}
      </Button>
      <ActionIcon
        onClick={toggleDark}
        variant="default"
        size="lg"
        hiddenFrom="sm"
      >
        {colorScheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </ActionIcon>
    </Group>
  );
}