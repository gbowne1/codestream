export const getToken = () => localStorage.getItem('token');

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Checks whether the current token is valid.
 * Returns true when /api/auth/me succeeds.
 */
export const checkAuth = async () => {
  const token = getToken();
  if (!token) return false;

  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) return true;

    if (res.status === 401 || res.status === 403) {
      clearAuth();
    }

    return false;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
};
