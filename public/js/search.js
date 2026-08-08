let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  setupSearch();
  setupLogout();
});

async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.loggedIn) {
      window.location.href = '/login.html';
    } else {
      currentUser = data.user;
      document.getElementById('my-profile-link').href = `/profile.html?username=${currentUser.username}`;
    }
  } catch (err) {
    window.location.href = '/login.html';
  }
}

function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login.html';
    });
  }
}

function setupSearch() {
  const input = document.getElementById('search-input');
  
  
  input.addEventListener('input', async () => {
    const query = input.value.trim();
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    const resultsContainer = document.getElementById('search-results-container');
    resultsContainer.innerHTML = '';

    data.users.forEach(user => {
      const avatarPath = user.profile_picture === 'default-avatar.png' 
        ? '/images/default-avatar.png' 
        : `/uploads/profiles/${user.profile_picture}`;

      const card = document.createElement('div');
      card.className = 'user-card';
      card.innerHTML = `
        <div class="user-info">
          <img src="${avatarPath}" class="avatar" alt="Avatar">
          <div>
            <div class="username">${user.username}</div>
            <div class="post-time">${user.bio || 'No bio'}</div>
          </div>
        </div>
        <a href="/profile.html?username=${user.username}" class="btn btn-primary btn-sm">View Profile</a>
      `;
      resultsContainer.appendChild(card);
    });
  });
}