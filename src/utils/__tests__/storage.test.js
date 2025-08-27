import {
  setStorageData,
  getStorageData,
  removeStorageData,
  migrateFromCookies,
  getStorageInfo,
  validateStorageIntegrity,
  StorageType
} from '../storage';
import * as cookieUtils from '../cookies';

// Mock cookie utilities
jest.mock('../cookies');

describe('Robust Storage System', () => {
  beforeEach(() => {
    // Clear all storage types
    localStorage.clear();
    sessionStorage.clear();
    cookieUtils.getCookie.mockClear();
    cookieUtils.setCookie.mockClear();
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('setStorageData', () => {
    it('should use localStorage when available', () => {
      const testData = { test: 'value', number: 42 };
      
      const result = setStorageData('test-key', testData, true);
      
      expect(result).toBe(true);
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify(testData));
      expect(localStorage.getItem('_storage_version')).toBe('1.0');
    });

    it('should not store data when disabled', () => {
      const result = setStorageData('test-key', 'value', false);
      
      expect(result).toBe(false);
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('should fallback to cookies when localStorage fails', () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('localStorage failed');
      });
      
      // Mock document and setSecureCookie behavior
      Object.defineProperty(global, 'document', {
        value: { cookie: '' },
        writable: true
      });
      
      const result = setStorageData('test-key', 'test-value', true);
      
      expect(result).toBe(true);
      
      // Restore localStorage
      localStorage.setItem = originalSetItem;
    });
  });

  describe('getStorageData', () => {
    it('should retrieve data from localStorage', () => {
      const testData = { quiz: 'stats', correct: 107 };
      localStorage.setItem('test-key', JSON.stringify(testData));
      
      const result = getStorageData('test-key');
      
      expect(result).toEqual(testData);
    });

    it('should fallback to sessionStorage when localStorage is empty', () => {
      const testData = { fallback: 'data' };
      sessionStorage.setItem('test-key', JSON.stringify(testData));
      
      const result = getStorageData('test-key');
      
      expect(result).toEqual(testData);
    });

    it('should fallback to cookies when web storage is empty', () => {
      cookieUtils.getCookie.mockReturnValue(JSON.stringify({ cookie: 'data' }));
      
      const result = getStorageData('test-key');
      
      expect(result).toEqual({ cookie: 'data' });
    });

    it('should return null for non-existent data', () => {
      cookieUtils.getCookie.mockReturnValue(null);
      
      const result = getStorageData('non-existent');
      
      expect(result).toBeNull();
    });

    it('should handle JSON parsing errors gracefully', () => {
      localStorage.setItem('invalid-json', 'invalid json content');
      
      const result = getStorageData('invalid-json');
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('removeStorageData', () => {
    it('should remove data from all storage types', () => {
      // Set data in all storage types
      localStorage.setItem('test-key', 'value');
      sessionStorage.setItem('test-key', 'value');
      
      // Mock document for cookie removal
      Object.defineProperty(global, 'document', {
        value: { cookie: '' },
        writable: true
      });
      
      removeStorageData('test-key');
      
      expect(localStorage.getItem('test-key')).toBeNull();
      expect(sessionStorage.getItem('test-key')).toBeNull();
      // Cookie removal is tested by the fact that no error was thrown
    });
  });

  describe('migrateFromCookies', () => {
    it('should migrate cookie data to localStorage', () => {
      const statsData = {
        correct: 107,
        wrong: 23,
        totalSessions: 15,
        attempted: {},
        correctAnswers: {},
        incorrectAnswers: {}
      };
      
      cookieUtils.getCookie.mockImplementation((key) => {
        if (key === 'lid.stats') return JSON.stringify(statsData);
        if (key === 'lid.mode') return '"dashboard"';
        return null;
      });
      
      migrateFromCookies();
      
      expect(localStorage.getItem('lid.stats')).toBe(JSON.stringify(statsData));
      expect(localStorage.getItem('lid.mode')).toBe('"dashboard"');
      expect(localStorage.getItem('_storage_version')).toBe('1.0');
    });

    it('should not overwrite existing localStorage data', () => {
      localStorage.setItem('lid.stats', '{"existing": "data"}');
      cookieUtils.getCookie.mockReturnValue('{"cookie": "data"}');
      
      migrateFromCookies();
      
      expect(localStorage.getItem('lid.stats')).toBe('{"existing": "data"}');
    });
  });

  describe('validateStorageIntegrity', () => {
    it('should return valid data when validation passes', () => {
      const validData = { correct: 107, wrong: 23 };
      localStorage.setItem('stats', JSON.stringify(validData));
      
      const validator = (data) => typeof data.correct === 'number';
      const result = validateStorageIntegrity('stats', validator);
      
      expect(result).toEqual(validData);
    });

    it('should remove invalid data and return null', () => {
      const invalidData = { correct: 'not-a-number' };
      localStorage.setItem('stats', JSON.stringify(invalidData));
      
      const validator = (data) => typeof data.correct === 'number';
      const result = validateStorageIntegrity('stats', validator);
      
      expect(result).toBeNull();
      expect(localStorage.getItem('stats')).toBeNull();
    });

    it('should handle validator errors gracefully', () => {
      const testData = { test: 'data' };
      localStorage.setItem('test-key', JSON.stringify(testData));
      
      const faultyValidator = () => {
        throw new Error('Validator error');
      };
      
      const result = validateStorageIntegrity('test-key', faultyValidator);
      
      expect(result).toBeNull();
      expect(localStorage.getItem('test-key')).toBeNull();
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage availability information', () => {
      const info = getStorageInfo();
      
      expect(info).toHaveProperty('bestStorage');
      expect(info).toHaveProperty('available');
      expect(info.available).toHaveProperty('localStorage');
      expect(info.available).toHaveProperty('sessionStorage');
      expect(info.available).toHaveProperty('cookies');
    });

    it('should detect localStorage as best storage in normal conditions', () => {
      const info = getStorageInfo();
      
      expect(info.bestStorage).toBe(StorageType.LOCAL);
      expect(info.available.localStorage).toBe(true);
    });
  });
});