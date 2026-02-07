import { describe, it, expect } from 'vitest';

describe('Utility Functions', () => {
  describe('formatViewers()', () => {
    /**
     * Helper function to format viewer count
     * This mimics the formatViewers function from main.js
     */
    function formatViewers(count) {
      if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
      return count.toLocaleString();
    }

    it('should format numbers less than 1000 as-is', () => {
      expect(formatViewers(500)).toBe('500');
      expect(formatViewers(999)).toBe('999');
      expect(formatViewers(1)).toBe('1');
    });

    it('should format 1000+ as K notation', () => {
      expect(formatViewers(1000)).toBe('1.0K');
      expect(formatViewers(1500)).toBe('1.5K');
      expect(formatViewers(2300)).toBe('2.3K');
    });

    it('should handle large numbers correctly', () => {
      expect(formatViewers(10000)).toBe('10.0K');
      expect(formatViewers(50000)).toBe('50.0K');
      expect(formatViewers(99999)).toBe('100.0K');
    });

    it('should handle edge case of exactly 1000', () => {
      expect(formatViewers(1000)).toBe('1.0K');
    });
  });

  describe('debounce()', () => {
    /**
     * Debounce helper - prevents function from being called too frequently
     */
    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    it('should return a function', () => {
      const debouncedFunc = debounce(() => {}, 100);
      expect(typeof debouncedFunc).toBe('function');
    });

    it('should delay function execution', (done) => {
      let called = false;
      const debouncedFunc = debounce(() => {
        called = true;
      }, 50);

      debouncedFunc();
      expect(called).toBe(false);

      setTimeout(() => {
        expect(called).toBe(true);
        done();
      }, 60);
    });
  });

  describe('getFilteredStreams()', () => {
    /**
     * Filter streams based on criteria
     */
    function getFilteredStreams(streams, filters) {
      return streams.filter((stream) => {
        if (filters.category && stream.category !== filters.category) {
          return false;
        }

        if (filters.subCategory && stream.subCategory !== filters.subCategory) {
          return false;
        }

        if (
          filters.programmingLanguages?.length &&
          !filters.programmingLanguages.some((lang) =>
            stream.programmingLanguages?.includes(lang)
          )
        ) {
          return false;
        }

        return true;
      });
    }

    const mockStreams = [
      {
        id: 1,
        category: 'webdev',
        subCategory: 'frontend',
        programmingLanguages: ['javascript', 'react'],
      },
      {
        id: 2,
        category: 'gamedev',
        subCategory: 'unity',
        programmingLanguages: ['csharp'],
      },
      {
        id: 3,
        category: 'webdev',
        subCategory: 'backend',
        programmingLanguages: ['python', 'django'],
      },
    ];

    it('should return all streams with no filters', () => {
      const result = getFilteredStreams(mockStreams, {});
      expect(result).toHaveLength(3);
    });

    it('should filter by category', () => {
      const result = getFilteredStreams(mockStreams, { category: 'webdev' });
      expect(result).toHaveLength(2);
      expect(result.every(s => s.category === 'webdev')).toBe(true);
    });

    it('should filter by subCategory', () => {
      const result = getFilteredStreams(mockStreams, { subCategory: 'frontend' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should filter by programming language', () => {
      const result = getFilteredStreams(mockStreams, {
        programmingLanguages: ['python'],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });

    it('should handle multiple filters', () => {
      const result = getFilteredStreams(mockStreams, {
        category: 'webdev',
        subCategory: 'frontend',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should return empty array when no matches', () => {
      const result = getFilteredStreams(mockStreams, {
        category: 'nonexistent',
      });
      expect(result).toHaveLength(0);
    });
  });
});
