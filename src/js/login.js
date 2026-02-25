import { checkAuth } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');

  // Redirect if already authenticated
  const isAuthenticated = await checkAuth();
  if (isAuthenticated) {
    window.location.href = '/';
    return;
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorAlert.classList.remove('d-none');

    setTimeout(() => hideError(), 5000);
  }

  function hideError() {
    errorAlert.classList.add('d-none');
    errorMessage.textContent = '';
  }

  function setLoading(isLoading) {
    if (isLoading) {
      loginBtn.disabled = true;
      btnText.textContent = 'Logging in...';
      btnSpinner.classList.remove('d-none');
    } else {
      loginBtn.disabled = false;
      btnText.textContent = 'Login';
      btnSpinner.classList.add('d-none');
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showError('Please fill out all fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const rawText = await response.text();
      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { message: rawText || 'Unexpected server response.' };
      }

      if (response.status === 200) {
        // Save token + user
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        // Success message
        errorAlert.classList.remove('alert-danger');
        errorAlert.classList.add('alert-success');
        errorMessage.innerHTML =
          '<i class="fas fa-check-circle me-2"></i>Login successful! Redirecting...';
        errorAlert.classList.remove('d-none');

        setTimeout(() => {
          window.location.href = '/';
        }, 1000);

      } else if (response.status === 400) {
        showError(data.message || 'Please fill out all fields.');
      } else if (response.status === 401) {
        showError(data.message || 'Invalid email or password.');
      } else if (response.status === 500) {
        showError(data.message || 'Server error. Please try again later.');
      } else {
        showError(data.message || 'An unexpected error occurred.');
      }

    } catch (error) {
      console.error('Login error:', error);
      showError('Unable to connect to server. Please check your connection.');
    }

    setLoading(false);
  });

  emailInput.addEventListener('input', hideError);
  passwordInput.addEventListener('input', hideError);
});
