import { getImageSrc } from '../images';

// Mock process.env
const originalEnv = process.env;
beforeAll(() => {
  process.env = { ...originalEnv, PUBLIC_URL: '/test-public' };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Image utilities', () => {
  describe('getImageSrc', () => {
    it('should return null for undefined question', () => {
      expect(getImageSrc(undefined)).toBeNull();
      expect(getImageSrc(null)).toBeNull();
    });

    it('should return null for question without image', () => {
      const question = { id: 1, question: 'Test?' };
      expect(getImageSrc(question)).toBeNull();
    });

    it('should return null for question with null/undefined image', () => {
      expect(getImageSrc({ id: 1, image: null })).toBeNull();
      expect(getImageSrc({ id: 1, image: undefined })).toBeNull();
    });

    it('should return full HTTP URL as-is', () => {
      const question = { id: 1, image: 'http://example.com/image.jpg' };
      expect(getImageSrc(question)).toBe('http://example.com/image.jpg');
    });

    it('should return full HTTPS URL as-is', () => {
      const question = { id: 1, image: 'https://example.com/image.jpg' };
      expect(getImageSrc(question)).toBe('https://example.com/image.jpg');
    });

    it('should handle mixed case HTTP/HTTPS', () => {
      const question1 = { id: 1, image: 'HTTP://example.com/image.jpg' };
      const question2 = { id: 2, image: 'HTTPS://example.com/image.jpg' };
      
      expect(getImageSrc(question1)).toBe('HTTP://example.com/image.jpg');
      expect(getImageSrc(question2)).toBe('HTTPS://example.com/image.jpg');
    });

    it('should construct local path for non-URL images', () => {
      const question = { id: 123, image: 'some-local-reference' };
      expect(getImageSrc(question)).toBe('/test-public/images/image-123.png');
    });

    it('should return null for empty string image', () => {
      const question = { id: 456, image: '' };
      expect(getImageSrc(question)).toBeNull();
    });

    it('should handle numeric IDs', () => {
      const question = { id: 789, image: 'local' };
      expect(getImageSrc(question)).toBe('/test-public/images/image-789.png');
    });

    it('should handle string IDs', () => {
      const question = { id: 'abc123', image: 'local' };
      expect(getImageSrc(question)).toBe('/test-public/images/image-abc123.png');
    });
  });
});