import { setCookie, getCookie } from '../cookies';

describe('Cookie utilities', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie = '';
    
    // Mock document.cookie setter
    let cookieStore = '';
    Object.defineProperty(document, 'cookie', {
      get: () => cookieStore,
      set: (value) => {
        cookieStore = value;
      },
      configurable: true
    });
  });

  describe('setCookie', () => {
    it('should set a cookie with default expiration', () => {
      setCookie('testKey', 'testValue');
      expect(document.cookie).toContain('testKey=testValue');
    });

    it('should set a cookie with custom expiration', () => {
      setCookie('testKey', 'testValue', 30);
      expect(document.cookie).toContain('testKey=testValue');
    });

    it('should encode cookie values', () => {
      setCookie('testKey', 'test value with spaces');
      expect(document.cookie).toContain('testKey=test%20value%20with%20spaces');
    });

    it('should handle special characters', () => {
      setCookie('testKey', 'test=value;with,special&chars');
      expect(document.cookie).toContain('testKey=test%3Dvalue%3Bwith%2Cspecial%26chars');
    });
  });

  describe('getCookie', () => {
    it('should return null for non-existent cookie', () => {
      expect(getCookie('nonExistent')).toBeNull();
    });

    it('should retrieve existing cookie value', () => {
      document.cookie = 'testKey=testValue';
      expect(getCookie('testKey')).toBe('testValue');
    });

    it('should decode cookie values', () => {
      document.cookie = 'testKey=test%20value%20with%20spaces';
      expect(getCookie('testKey')).toBe('test value with spaces');
    });

    it('should handle multiple cookies', () => {
      document.cookie = 'key1=value1; key2=value2; key3=value3';
      expect(getCookie('key2')).toBe('value2');
    });

    it('should return null for partial matches', () => {
      document.cookie = 'testKey=testValue';
      expect(getCookie('test')).toBeNull();
      expect(getCookie('Key')).toBeNull();
    });
  });
});