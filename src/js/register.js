/**
 * Register Page JavaScript
 * Handles user registration
 */

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const registerBtn = document.getElementById('registerBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const messageAlert = document.getElementById('messageAlert');
    const messageText = document.getElementById('messageText');

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/';
        return;
    }

    /**
     * Show message to user
     * @param {string} message - Message to display
     * @param {string} type - 'success' or 'danger'
     */
    function showMessage(message, type = 'danger') {
        messageAlert.className = `alert alert-${type}`;
        messageText.textContent = message;
        messageAlert.classList.remove('d-none');

        if (type === 'success') {
            setTimeout(() => {
                hideMessage();
            }, 3000);
        }
    }

    /**
     * Hide message
     */
    function hideMessage() {
        messageAlert.classList.add('d-none');
        messageText.textContent = '';
    }

    /**
     * Set loading state
     * @param {boolean} isLoading
     */
    function setLoading(isLoading) {
        if (isLoading) {
            registerBtn.disabled = true;
            btnText.textContent = 'Creating account...';
            btnSpinner.classList.remove('d-none');
        } else {
            registerBtn.disabled = false;
            btnText.textContent = 'Create Account';
            btnSpinner.classList.add('d-none');
        }
    }

    /**
     * Handle form submission
     */
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage();

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !email || !password) {
            showMessage('Please fill out all fields.');
            return;
        }

        if (password.length < 6) {
            showMessage('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.status === 201) {
                // Success
                showMessage('Account created successfully! Redirecting to login...', 'success');

                // Store token if returned
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                } else {
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 1500);
                }

            } else if (response.status === 400) {
                showMessage(data.message || 'Invalid input. Please check your details.');
                setLoading(false);

            } else if (response.status === 500) {
                showMessage('Server error. Please try again later.');
                setLoading(false);

            } else {
                showMessage(data.message || 'An unexpected error occurred.');
                setLoading(false);
            }

        } catch (error) {
            console.error('Registration error:', error);
            showMessage('Unable to connect to server. Please check your connection.');
            setLoading(false);
        }
    });

    // Hide message when user starts typing
    usernameInput.addEventListener('input', hideMessage);
    emailInput.addEventListener('input', hideMessage);
    passwordInput.addEventListener('input', hideMessage);
});
