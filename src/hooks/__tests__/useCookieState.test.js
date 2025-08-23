import React from 'react';
import { render, act } from '@testing-library/react';
import { useCookieState } from '../useCookieState';
import * as cookieUtils from '../../utils/cookies';

// Mock cookie utilities
jest.mock('../../utils/cookies');

// Test component to use the hook
function TestComponent({ hookKey, initialValue, enabled = true }) {
  const [value, setValue] = useCookieState(hookKey, initialValue, enabled);
  
  return (
    <div>
      <div data-testid="value">{JSON.stringify(value)}</div>
      <button onClick={() => setValue('new-value')} data-testid="set-button">
        Set Value
      </button>
      <button onClick={() => setValue(prev => prev + '-updated')} data-testid="update-button">
        Update Value
      </button>
    </div>
  );
}

describe('useCookieState', () => {
  beforeEach(() => {
    cookieUtils.getCookie.mockClear();
    cookieUtils.setCookie.mockClear();
  });

  it('should initialize with default value when no cookie exists', () => {
    cookieUtils.getCookie.mockReturnValue(null);
    
    const { getByTestId } = render(
      <TestComponent hookKey="test-key" initialValue="default-value" />
    );
    
    expect(getByTestId('value')).toHaveTextContent('"default-value"');
    expect(cookieUtils.getCookie).toHaveBeenCalledWith('test-key');
  });

  it('should initialize with cookie value when it exists', () => {
    cookieUtils.getCookie.mockReturnValue(JSON.stringify('cookie-value'));
    
    const { getByTestId } = render(
      <TestComponent hookKey="test-key" initialValue="default-value" />
    );
    
    expect(getByTestId('value')).toHaveTextContent('"cookie-value"');
  });

  it('should handle invalid JSON in cookie', () => {
    cookieUtils.getCookie.mockReturnValue('invalid-json');
    
    const { getByTestId } = render(
      <TestComponent hookKey="test-key" initialValue="default-value" />
    );
    
    expect(getByTestId('value')).toHaveTextContent('"default-value"');
  });

  it('should update cookie when value changes', async () => {
    cookieUtils.getCookie.mockReturnValue(null);
    
    const { getByTestId } = render(
      <TestComponent hookKey="test-key" initialValue="initial" />
    );
    
    expect(getByTestId('value')).toHaveTextContent('"initial"');
    
    act(() => {
      getByTestId('set-button').click();
    });
    
    expect(getByTestId('value')).toHaveTextContent('"new-value"');
    expect(cookieUtils.setCookie).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'));
  });

  it('should not use cookies when disabled', () => {
    const { getByTestId } = render(
      <TestComponent hookKey="test-key" initialValue="default" enabled={false} />
    );
    
    expect(getByTestId('value')).toHaveTextContent('"default"');
    expect(cookieUtils.getCookie).not.toHaveBeenCalled();
    
    act(() => {
      getByTestId('set-button').click();
    });
    
    expect(cookieUtils.setCookie).not.toHaveBeenCalled();
  });

  it('should handle function updates', () => {
    cookieUtils.getCookie.mockReturnValue(JSON.stringify('test'));
    
    const { getByTestId } = render(
      <TestComponent hookKey="test-key" initialValue="initial" />
    );
    
    expect(getByTestId('value')).toHaveTextContent('"test"');
    
    act(() => {
      getByTestId('update-button').click();
    });
    
    expect(getByTestId('value')).toHaveTextContent('"test-updated"');
    expect(cookieUtils.setCookie).toHaveBeenCalledWith('test-key', JSON.stringify('test-updated'));
  });
});