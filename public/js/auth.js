document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  const errorMsg = document.getElementById('error-msg');

  function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
  }

 
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password, confirmPassword })
        });

        const data = await response.json();
        if (!response.ok) {
          showError(data.error || 'Registration failed.');
        } else {
          window.location.href = '/';
        }
      } catch (err) {
        showError('Network error. Please try again.');
      }
    });
  }

  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) {
          showError(data.error || 'Login failed.');
        } else {
          window.location.href = '/';
        }
      } catch (err) {
        showError('Network error. Please try again.');
      }
    });
  }
});