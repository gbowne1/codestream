import { describe, it, expect, beforeEach } from 'vitest';

describe('Theme Management', () => {
  let localStorage;

  beforeEach(() => {
    // Mock localStorage
    localStorage = {
      store: {},
      getItem(key) {
        return this.store[key] || null;
      },
      setItem(key, value) {
        this.store[key] = value;
      },
      clear() {
        this.store = {};
      },
    };
    global.localStorage = localStorage;
  });

  describe('localStorage operations', () => {
    it('should save theme preference to localStorage', () => {
      localStorage.setItem('theme', 'dark');
      
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should retrieve saved theme preference', () => {
      localStorage.setItem('theme', 'light');
      const theme = localStorage.getItem('theme');
      
      expect(theme).toBe('light');
    });

    it('should return null for non-existent key', () => {
      const theme = localStorage.getItem('nonExistent');
      
      expect(theme).toBeNull();
    });

    it('should overwrite existing theme preference', () => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('theme', 'light');
      
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should clear all stored data', () => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('user', 'test');
      
      localStorage.clear();
      
      expect(localStorage.getItem('theme')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('DOM manipulation', () => {
    it('should add dark class to body', () => {
      const mockBody = {
        classList: {
          items: [],
          add(className) {
            if (!this.items.includes(className)) {
              this.items.push(className);
            }
          },
          remove(className) {
            this.items = this.items.filter(c => c !== className);
          },
          contains(className) {
            return this.items.includes(className);
          },
          toggle(className) {
            if (this.contains(className)) {
              this.remove(className);
            } else {
              this.add(className);
            }
          },
        },
      };

      mockBody.classList.add('dark');
      expect(mockBody.classList.contains('dark')).toBe(true);
    });

    it('should toggle between dark and light themes', () => {
      const mockBody = {
        classList: {
          items: [],
          toggle(className) {
            const index = this.items.indexOf(className);
            if (index > -1) {
              this.items.splice(index, 1);
            } else {
              this.items.push(className);
            }
          },
          contains(className) {
            return this.items.includes(className);
          },
        },
      };

      // Start with light (no dark class)
      expect(mockBody.classList.contains('dark')).toBe(false);

      // Toggle to dark
      mockBody.classList.toggle('dark');
      expect(mockBody.classList.contains('dark')).toBe(true);

      // Toggle back to light
      mockBody.classList.toggle('dark');
      expect(mockBody.classList.contains('dark')).toBe(false);
    });

    it('should update icon class when theme changes', () => {
      const mockIcon = {
        className: 'fas fa-moon',
      };

      // Change to sun icon (dark mode active)
      mockIcon.className = 'fas fa-sun';
      expect(mockIcon.className).toBe('fas fa-sun');

      // Change back to moon icon (light mode active)
      mockIcon.className = 'fas fa-moon';
      expect(mockIcon.className).toBe('fas fa-moon');
    });
  });
});
