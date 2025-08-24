import { Select, Group, Text, Badge } from '@mantine/core';
import { MapPin } from 'lucide-react';
import { getAvailableStates } from '../utils/stateQuestions';

export function StateSelector({ 
  selectedState, 
  onStateChange, 
  disabled = false,
  placeholder = "Bundesland wählen (optional)"
}) {
  const states = getAvailableStates();
  
  const stateOptions = states.map(state => ({
    value: state.key,
    label: state.name
  }));

  return (
    <Group gap="sm" align="center">
      <MapPin size={16} />
      <Select
        placeholder={placeholder}
        data={stateOptions}
        value={selectedState}
        onChange={onStateChange}
        disabled={disabled}
        searchable
        style={{ minWidth: 200, flex: 1 }}
        size="sm"
      />
      <Badge size="sm" color="blue" variant="light">
        10 Landesfragen
      </Badge>
    </Group>
  );
}