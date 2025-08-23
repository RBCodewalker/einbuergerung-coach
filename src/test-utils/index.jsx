import React from 'react';
import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { AppProvider } from '../contexts/AppContext';
import { QuizProvider } from '../contexts/QuizContext';

// Mock theme for testing
const testTheme = {
  primaryColor: 'emerald',
  colors: {
    emerald: [
      '#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399',
      '#10b981', '#059669', '#047857', '#065f46', '#064e3b'
    ]
  }
};

// Test wrapper with all providers
export function TestWrapper({ children }) {
  return (
    <MantineProvider theme={testTheme}>
      <AppProvider>
        <QuizProvider>
          {children}
        </QuizProvider>
      </AppProvider>
    </MantineProvider>
  );
}

// Custom render function with providers
export function renderWithProviders(ui, options = {}) {
  return render(ui, {
    wrapper: TestWrapper,
    ...options
  });
}

// Mock localStorage for tests
export const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock document.cookie
export const mockCookie = {
  get: jest.fn(),
  set: jest.fn()
};

// Setup function for tests
export function setupTest() {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
  });

  // Mock document.cookie
  Object.defineProperty(document, 'cookie', {
    get: mockCookie.get,
    set: mockCookie.set,
    configurable: true
  });

  // Mock fetch
  global.fetch = jest.fn();

  // Mock process.env
  process.env.PUBLIC_URL = '/test';
}

// Cleanup function
export function cleanupTest() {
  mockLocalStorage.getItem.mockClear();
  mockLocalStorage.setItem.mockClear();
  mockLocalStorage.removeItem.mockClear();
  mockLocalStorage.clear.mockClear();
  
  mockCookie.get.mockClear();
  mockCookie.set.mockClear();
  
  if (global.fetch) {
    global.fetch.mockClear();
  }
}

// Test data helpers
export const testQuestions = [
  {
    id: 1,
    question: 'Test question 1?',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    answerIndex: 2
  },
  {
    id: 2,
    question: 'Test question 2?',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    answerIndex: 0
  }
];

// Re-export testing library functions
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';