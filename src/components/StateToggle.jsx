import { useState } from 'react';
import { Menu, Button, Text, Modal, Group } from '@mantine/core';
import { MapPin, ChevronDown } from 'lucide-react';
import { useDisclosure } from '@mantine/hooks';
import { useLocation } from 'react-router-dom';
import { getAvailableStates } from '../utils/stateQuestions';
import { useQuiz } from '../contexts/QuizContext';

export function StateToggle() {
  const { selectedState, setSelectedState, setStats, stats } = useQuiz();
  const location = useLocation();
  const [opened, { open, close }] = useDisclosure(false);
  const [pendingState, setPendingState] = useState(null);
  const states = getAvailableStates();
  
  const currentStateName = states.find(s => s.key === selectedState)?.name || 'Baden-Württemberg';
  
  // Enable only on dashboard route, disable everywhere else
  const isOnDashboard = location.pathname === '/';

  const handleStateClick = (stateKey, stateName) => {
    if (stateKey === selectedState) return; // No change needed
    
    // Check if user has progress on state questions (IDs 301-310)
    const hasStateProgress = Object.keys(stats?.attempted || {}).some(id => {
      const questionId = parseInt(id);
      return questionId >= 301 && questionId <= 310;
    });

    if (hasStateProgress) {
      setPendingState({ key: stateKey, name: stateName });
      open();
    } else {
      // No progress to lose, change immediately
      setSelectedState(stateKey);
    }
  };

  const confirmStateChange = () => {
    if (!pendingState) return;
    
    // Reset state questions progress (IDs 301-310) with mutual exclusivity ensured
    setStats(prevStats => {
      const newAttempted = { ...prevStats.attempted };
      const newCorrectAnswers = { ...prevStats.correctAnswers };
      const newIncorrectAnswers = { ...prevStats.incorrectAnswers };
      
      let correctReset = 0;
      let wrongReset = 0;
      
      // Remove state questions (301-310) from all progress tracking
      for (let id = 301; id <= 310; id++) {
        const idStr = id.toString();
        
        if (newAttempted[idStr]) {
          delete newAttempted[idStr];
          
          // Count and remove from correct answers
          if (newCorrectAnswers[idStr]) {
            delete newCorrectAnswers[idStr];
            correctReset++;
          }
          
          // Count and remove from incorrect answers (but don't double count if was in both)
          if (newIncorrectAnswers[idStr] !== undefined) {
            delete newIncorrectAnswers[idStr];
            // Only increment wrong counter if it wasn't already counted in correct
            if (!prevStats.correctAnswers?.[idStr]) {
              wrongReset++;
            }
          }
        }
      }
      
      return {
        ...prevStats,
        attempted: newAttempted,
        correctAnswers: newCorrectAnswers,
        incorrectAnswers: newIncorrectAnswers,
        correct: Math.max(0, prevStats.correct - correctReset),
        wrong: Math.max(0, prevStats.wrong - wrongReset)
      };
    });
    
    setSelectedState(pendingState.key);
    close();
    setPendingState(null);
  };

  const cancelStateChange = () => {
    close();
    setPendingState(null);
  };

  return (
    <>
      <Menu shadow="md" width={200} disabled={!isOnDashboard}>
        <Menu.Target>
          <Button 
            variant="light" 
            size="xs"
            leftSection={<MapPin size={14} />}
            rightSection={<ChevronDown size={14} />}
            disabled={!isOnDashboard}
          >
            {currentStateName}
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Bundesland wählen</Menu.Label>
          {states.map(state => (
            <Menu.Item 
              key={state.key}
              onClick={() => handleStateClick(state.key, state.name)}
              style={{ 
                fontWeight: state.key === selectedState ? 600 : 400,
                backgroundColor: state.key === selectedState ? 'light-dark(var(--mantine-color-blue-1), var(--mantine-color-blue-9))' : undefined
              }}
            >
              {state.name}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>

      <Modal
        opened={opened}
        onClose={cancelStateChange}
        title="Bundesland ändern"
        centered
        size="sm"
      >
        <Text size="sm" mb="md">
          Möchten Sie wirklich zu <strong>{pendingState?.name}</strong> wechseln?
        </Text>
        <Text size="xs" c="dimmed" mb="lg">
          Dies wird Ihren Fortschritt bei den aktuellen Landesfragen zurücksetzen 
          (gequizzte, richtige und falsche Antworten der Fragen 301-310).
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="light" onClick={cancelStateChange}>
            Abbrechen
          </Button>
          <Button color="red" onClick={confirmStateChange}>
            Wechseln & Fortschritt zurücksetzen
          </Button>
        </Group>
      </Modal>
    </>
  );
}