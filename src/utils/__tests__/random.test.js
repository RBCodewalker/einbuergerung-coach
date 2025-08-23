import { mulberry32 } from '../random';

describe('Random utilities', () => {
  describe('mulberry32', () => {
    it('should return a function', () => {
      const rng = mulberry32(12345);
      expect(typeof rng).toBe('function');
    });

    it('should generate numbers between 0 and 1', () => {
      const rng = mulberry32(12345);
      for (let i = 0; i < 100; i++) {
        const num = rng();
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(1);
      }
    });

    it('should be deterministic with same seed', () => {
      const rng1 = mulberry32(12345);
      const rng2 = mulberry32(12345);
      
      const sequence1 = [];
      const sequence2 = [];
      
      for (let i = 0; i < 10; i++) {
        sequence1.push(rng1());
        sequence2.push(rng2());
      }
      
      expect(sequence1).toEqual(sequence2);
    });

    it('should generate different sequences with different seeds', () => {
      const rng1 = mulberry32(12345);
      const rng2 = mulberry32(54321);
      
      const sequence1 = [];
      const sequence2 = [];
      
      for (let i = 0; i < 10; i++) {
        sequence1.push(rng1());
        sequence2.push(rng2());
      }
      
      expect(sequence1).not.toEqual(sequence2);
    });

    it('should handle edge case seeds', () => {
      expect(() => mulberry32(0)).not.toThrow();
      expect(() => mulberry32(-1)).not.toThrow();
      expect(() => mulberry32(2147483647)).not.toThrow();
    });

    it('should maintain state between calls', () => {
      const rng = mulberry32(12345);
      const first = rng();
      const second = rng();
      const third = rng();
      
      expect(first).not.toBe(second);
      expect(second).not.toBe(third);
      expect(first).not.toBe(third);
    });
  });
});