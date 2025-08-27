import React from 'react';
import { render, act } from '@testing-library/react';
import { useStorageState } from '../useStorageState';
import * as storage from '../../utils/storage';

// Mock storage utilities
jest.mock('../../utils/storage');

// Test component to use the hook
function TestComponent({ 
  hookKey, 
  initialValue, 
  enabled = true, 
  validator = null 
}) {
  const [value, setValue, { syncFromStorage }] = useStorageState(
    hookKey, 
    initialValue, 
    enabled, 
    validator
  );
  
  return (
    <div>
      <div data-testid="value">{JSON.stringify(value)}</div>
      <button onClick={() => setValue('new-value')} data-testid="set-button">
        Set Value
      </button>
      <button onClick={() => setValue(prev => prev + '-updated')} data-testid="update-button">
        Update Value
      </button>
      <button onClick={syncFromStorage} data-testid="sync-button">
        Sync from Storage
      </button>
    </div>
  );
}

describe('useStorageState', () => {
  beforeEach(() => {
    storage.getStorageData.mockClear();
    storage.setStorageData.mockClear();
    storage.validateStorageIntegrity.mockClear();
    
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default value when no storage data exists', () => {
      storage.getStorageData.mockReturnValue(null);
      
      const { getByTestId } = render(
        <TestComponent hookKey="test-key" initialValue="default-value" />
      );
      
      expect(getByTestId('value')).toHaveTextContent('"default-value"');
      expect(storage.getStorageData).toHaveBeenCalledWith('test-key');
    });

    it('should initialize with storage data when it exists', () => {
      storage.getStorageData.mockReturnValue('storage-value');
      
      const { getByTestId } = render(
        <TestComponent hookKey="test-key" initialValue="default-value" />
      );
      
      expect(getByTestId('value')).toHaveTextContent('"storage-value"');
    });

    it('should use validator for initialization when provided', () => {
      const validData = { correct: 107, wrong: 23 };
      storage.validateStorageIntegrity.mockReturnValue(validData);
      
      const validator = (data) => typeof data.correct === 'number';
      
      const { getByTestId } = render(
        <TestComponent 
          hookKey="stats" 
          initialValue={{}} 
          validator={validator}
        />
      );
      
      expect(storage.validateStorageIntegrity).toHaveBeenCalledWith('stats', validator);
      expect(getByTestId('value')).toHaveTextContent(JSON.stringify(validData));
    });

    it('should fallback to initial value when validation fails', () => {
      storage.validateStorageIntegrity.mockReturnValue(null);
      
      const validator = (data) => typeof data.correct === 'number';
      
      const { getByTestId } = render(
        <TestComponent 
          hookKey="stats" 
          initialValue={{ correct: 0 }} 
          validator={validator}
        />
      );
      
      expect(getByTestId('value')).toHaveTextContent('{"correct":0}');
    });

    it('should not use storage when disabled', () => {
      const { getByTestId } = render(
        <TestComponent 
          hookKey="test-key" 
          initialValue="default" 
          enabled={false}
        />
      );
      
      expect(getByTestId('value')).toHaveTextContent('"default"');
      expect(storage.getStorageData).not.toHaveBeenCalled();
    });
  });

  describe('value updates', () => {
    it('should update storage when value changes', async () => {
      storage.getStorageData.mockReturnValue(null);
      storage.setStorageData.mockReturnValue(true);
      
      const { getByTestId } = render(
        <TestComponent hookKey="test-key" initialValue="initial" />
      );
      
      // Wait for initial render to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      act(() => {
        getByTestId('set-button').click();
      });
      
      expect(getByTestId('value')).toHaveTextContent('"new-value"');
      
      // Wait for useEffect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(storage.setStorageData).toHaveBeenCalledWith('test-key', 'new-value', true);
    });

    it('should handle function updates', async () => {
      storage.getStorageData.mockReturnValue('test');
      storage.setStorageData.mockReturnValue(true);
      
      const { getByTestId } = render(
        <TestComponent hookKey="test-key" initialValue="initial" />
      );
      
      // Wait for initial render
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      act(() => {
        getByTestId('update-button').click();
      });
      
      expect(getByTestId('value')).toHaveTextContent('"test-updated"');
    });

    it('should reject invalid updates when validator is provided', () => {
      const initialData = { correct: 107 };
      storage.getStorageData.mockReturnValue(initialData);
      
      const validator = (data) => typeof data.correct === 'number';
      
      const { getByTestId } = render(
        <TestComponent 
          hookKey="stats" 
          initialValue={{}} 
          validator={validator}
        />
      );
      
      // Try to set invalid data (this would normally fail validation)
      act(() => {
        getByTestId('set-button').click();
      });
      
      // Value should remain unchanged if validation fails
      expect(console.warn).toHaveBeenCalledWith(
        'Validation failed for stats, rejecting update'
      );
    });

    it('should not update storage when disabled', () => {
      const { getByTestId } = render(
        <TestComponent 
          hookKey="test-key" 
          initialValue="initial" 
          enabled={false}
        />
      );
      
      act(() => {
        getByTestId('set-button').click();
      });
      
      expect(storage.setStorageData).not.toHaveBeenCalled();
    });

    it('should warn when storage fails', () => {
      storage.getStorageData.mockReturnValue(null);
      storage.setStorageData.mockReturnValue(false);
      
      const { getByTestId } = render(
        <TestComponent hookKey="test-key" initialValue="initial" />
      );
      
      act(() => {
        getByTestId('set-button').click();
      });
      
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to persist test-key to storage'
      );
    });
  });

  describe('syncFromStorage', () => {
    it('should sync data from storage', () => {
      storage.getStorageData.mockReturnValueOnce('initial').mockReturnValueOnce('updated');
      
      const { getByTestId } = render(
        <TestComponent hookKey="test-key" initialValue="default" />
      );
      
      expect(getByTestId('value')).toHaveTextContent('"initial"');
      
      act(() => {
        getByTestId('sync-button').click();
      });
      
      expect(getByTestId('value')).toHaveTextContent('"updated"');
    });

    it('should use validator when syncing', () => {
      const updatedData = { correct: 200, wrong: 50 };
      storage.validateStorageIntegrity.mockReturnValueOnce({ correct: 107 })
                                       .mockReturnValueOnce(updatedData);
      
      const validator = (data) => typeof data.correct === 'number';
      
      const { getByTestId } = render(
        <TestComponent 
          hookKey="stats" 
          initialValue={{}} 
          validator={validator}
        />
      );
      
      act(() => {
        getByTestId('sync-button').click();
      });
      
      expect(storage.validateStorageIntegrity).toHaveBeenCalledWith('stats', validator);
      expect(getByTestId('value')).toHaveTextContent(JSON.stringify(updatedData));
    });

    it('should not sync when disabled', () => {
      const { getByTestId } = render(
        <TestComponent 
          hookKey="test-key" 
          initialValue="default" 
          enabled={false}
        />
      );
      
      act(() => {
        getByTestId('sync-button').click();
      });
      
      expect(storage.getStorageData).not.toHaveBeenCalled();
    });
  });
});