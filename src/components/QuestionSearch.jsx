import { useState, useMemo, useEffect } from 'react';
import {
  Paper,
  TextInput,
  Stack,
  Text,
  ScrollArea,
  Group,
  Badge,
  ActionIcon,
  Highlight
} from '@mantine/core';
import { Search, X } from 'lucide-react';
import Fuse from 'fuse.js';

export function QuestionSearch({ 
  questions = [], 
  onQuestionSelect, 
  isVisible = false,
  onClose 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Configure Fuse.js for fuzzy searching
  const fuse = useMemo(() => {
    const fuseOptions = {
      keys: [
        {
          name: 'question',
          weight: 0.7
        },
        {
          name: 'options',
          weight: 0.3
        }
      ],
      threshold: 0.4, // Lower = more strict matching
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      ignoreLocation: true
    };

    return new Fuse(questions, fuseOptions);
  }, [questions]);

  // Update search results when query changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const results = fuse.search(searchQuery.trim());
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, fuse]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isVisible) {
        event.preventDefault();
        if (onClose) {
          onClose();
        }
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, onClose]);

  const handleQuestionSelect = (question) => {
    if (onQuestionSelect) {
      onQuestionSelect(question);
    }
    setSearchQuery('');
    setSearchResults([]);
    if (onClose) {
      onClose();
    }
  };

  const getQuestionCategory = (questionId) => {
    if (questionId >= 1 && questionId <= 35) return { name: 'Geschichte I', color: 'red' };
    if (questionId >= 36 && questionId <= 68) return { name: 'Geschichte II', color: 'orange' };
    if (questionId >= 69 && questionId <= 98) return { name: 'Verfassung', color: 'yellow' };
    if (questionId >= 99 && questionId <= 133) return { name: 'Deutschland', color: 'green' };
    if (questionId >= 134 && questionId <= 173) return { name: 'Politik I', color: 'blue' };
    if (questionId >= 174 && questionId <= 213) return { name: 'Politik II', color: 'indigo' };
    if (questionId >= 214 && questionId <= 246) return { name: 'Recht', color: 'violet' };
    if (questionId >= 247 && questionId <= 272) return { name: 'Bildung I', color: 'pink' };
    if (questionId >= 273 && questionId <= 300) return { name: 'Bildung II', color: 'gray' };
    if (questionId >= 301 && questionId <= 310) return { name: 'Länder', color: 'teal' };
    return { name: 'Unbekannt', color: 'gray' };
  };

  const highlightText = (text, matches = []) => {
    if (!matches.length) return text;
    
    // Find matches for this specific text
    const textMatches = matches.filter(match => 
      match.value === text || (Array.isArray(match.value) && match.value.includes(text))
    );

    if (!textMatches.length) return text;

    const match = textMatches[0];
    if (match.indices && match.indices.length > 0) {
      const [start, end] = match.indices[0];
      return (
        <Highlight highlight={text.substring(start, end + 1)}>
          {text}
        </Highlight>
      );
    }

    return text;
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        }}
        onClick={onClose}
      />

      {/* Search Modal */}
      <Paper
        withBorder
        p="md"
        radius="md"
        shadow="lg"
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '600px',
          zIndex: 1000,
          backgroundColor: 'var(--mantine-color-body)'
        }}
      >
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Text size="lg" fw={600}>
            Fragen durchsuchen
          </Text>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onClose}
            size="sm"
          >
            <X size={16} />
          </ActionIcon>
        </Group>

        <TextInput
          placeholder="Suchbegriff eingeben... (mindestens 2 Zeichen)"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          size="md"
          autoFocus
        />

        {searchQuery.length >= 2 && (
          <ScrollArea h={500} scrollbarSize={6}>
            <Stack gap="xs">
              {searchResults.length > 0 ? (
                <>
                  <Text size="sm" c="dimmed">
                    {searchResults.length} Ergebnis{searchResults.length !== 1 ? 'se' : ''} gefunden
                  </Text>
                  {searchResults.map(({ item: question, matches = [] }) => {
                    const category = getQuestionCategory(question.id);
                    return (
                      <Paper
                        key={question.id}
                        p="sm"
                        withBorder
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleQuestionSelect(question)}
                        className="search-result-item"
                      >
                        <Stack gap="xs">
                          <Group justify="space-between" align="flex-start">
                            <Badge
                              size="xs"
                              color={category.color}
                              variant="light"
                            >
                              Frage {question.id}
                            </Badge>
                            <Badge
                              size="xs"
                              color={category.color}
                              variant="outline"
                            >
                              {category.name}
                            </Badge>
                          </Group>
                          
                          <Text size="sm" lh={1.4} component="div">
                            {highlightText(question.question, matches)}
                          </Text>
                          
                          {/* Show matching options */}
                          {matches.some(match => match.key === 'options') && (
                            <Stack gap={2}>
                              <Text size="xs" c="dimmed" fw={500}>
                                Passende Antwortmöglichkeiten:
                              </Text>
                              {question.options.map((option, index) => {
                                const optionMatches = matches.filter(match => 
                                  match.key === 'options' && 
                                  Array.isArray(match.value) && 
                                  match.value[index] === option
                                );
                                
                                if (optionMatches.length > 0) {
                                  return (
                                    <Text
                                      key={index}
                                      size="xs"
                                      c={index === question.correct ? 'green' : 'dimmed'}
                                      style={{ paddingLeft: '12px' }}
                                      component="div"
                                    >
                                      {String.fromCharCode(65 + index)}: {highlightText(option, optionMatches)}
                                      {index === question.correct && (
                                        <Badge size="xs" color="green" variant="light" ml="xs">
                                          Richtig
                                        </Badge>
                                      )}
                                    </Text>
                                  );
                                }
                                return null;
                              })}
                            </Stack>
                          )}
                        </Stack>
                      </Paper>
                    );
                  })}
                </>
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  Keine Ergebnisse für "{searchQuery}" gefunden
                </Text>
              )}
            </Stack>
          </ScrollArea>
        )}
      </Stack>

      <style>{`
        .search-result-item:hover {
          background-color: light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6)) !important;
          transform: translateY(-1px) !important;
          box-shadow: var(--mantine-shadow-md) !important;
        }
      `}</style>
    </Paper>
    </>
  );
}