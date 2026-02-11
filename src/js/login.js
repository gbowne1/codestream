/**
 * Login Page JavaScript
 * Handles user authentication with proper status code handling:
 * - 400: Missing fields
 * - 401: Invalid credentials
 * - 200: Successful login
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');

  // Check if user is already logged in
  const token = localStorage.getItem('token');
  if (token) {
    // Redirect to home if already logged in
    window.location.href = '/';
    return;
  }

  /**
   * Show error message to user
   * @param {string} message - Error message to display
   */
  function showError(message) {
    errorMessage.textContent = message;
    errorAlert.classList.remove('d-none');

    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideError();
    }, 5000);
  }

  /**
   * Hide error message
   */
  function hideError() {
    errorAlert.classList.add('d-none');
    errorMessage.textContent = '';
  }

  /**
   * Set loading state for login button
   * @param {boolean} isLoading - Whether the form is submitting
   */
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

  /**
   * Handle form submission
   */
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Client-side validation (additional to HTML5 required attribute)
    if (!email || !password) {
      showError('Please fill out all fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // Handle different status codes
      if (response.status === 200) {
        // SUCCESS - Login successful
        console.log('Login successful:', data);

        // Store token in localStorage
        localStorage.setItem('token', data.token);

        // Store user info (optional)
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        // Show success message briefly
        errorAlert.classList.remove('alert-danger');
        errorAlert.classList.add('alert-success');
        errorMessage.innerHTML =
          '<i class="fas fa-check-circle me-2"></i>Login successful! Redirecting...';
        errorAlert.classList.remove('d-none');

        // Redirect to home page after short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else if (response.status === 400) {
        // BAD REQUEST - Missing or invalid fields
        showError(data.message || 'Please fill out all fields.');
        setLoading(false);
      } else if (response.status === 401) {
        // UNAUTHORIZED - Invalid credentials
        showError(data.message || 'Invalid email or password.');
        setLoading(false);
      } else if (response.status === 500) {
        // SERVER ERROR
        showError('Server error. Please try again later.');
        setLoading(false);
      } else {
        // OTHER ERRORS
        showError(data.message || 'An unexpected error occurred.');
        setLoading(false);
      }
    } catch (error) {
      // Network error or other fetch errors
      console.error('Login error:', error);
      showError('Unable to connect to server. Please check your connection.');
      setLoading(false);
    }
  });

  // Hide error when user starts typing
  emailInput.addEventListener('input', hideError);
  passwordInput.addEventListener('input', hideError);
});
