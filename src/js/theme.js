/**
 * Theme Management Script
 * Handles dark/light mode toggle and persistence
 */

const themeKey = 'theme';
const themeToggleBtn = document.getElementById('themeToggle');

function applyTheme(isDark) {
  document.body.classList.toggle('dark', isDark);
  if (themeToggleBtn) {
    const icon = themeToggleBtn.querySelector('i');
    if (icon) {
      icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem(themeKey);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Default to saved preference, otherwise fallback to system preference
  let isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

  applyTheme(isDark);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      isDark = !isDark;
      localStorage.setItem(themeKey, isDark ? 'dark' : 'light');
      applyTheme(isDark);
    });
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initTheme);
