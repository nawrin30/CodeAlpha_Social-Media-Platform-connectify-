let currentUser = null;
let profileUsername = null;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  profileUsername = urlParams.get('username');

  await checkAuthStatus();
  if (profileUsername) {
    loadProfileHeader();
    loadUserPosts();
    setupLogout();
    setupEditProfileForm();
  }
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
      if (!profileUsername) profileUsername = currentUser.username;
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

async function loadProfileHeader() {
  const res = await fetch(`/api/users/${profileUsername}`);
  if (!res.ok) return alert('User not found');

  const data = await res.json();
  const user = data.user;

  document.getElementById('profile-username').textContent = user.username;
  document.getElementById('profile-bio').textContent = user.bio || 'No bio provided.';
  document.getElementById('stat-posts').textContent = data.stats.posts;
  document.getElementById('stat-followers').textContent = data.stats.followers;
  document.getElementById('stat-following').textContent = data.stats.following;

  const avatarImg = document.getElementById('profile-avatar');
  avatarImg.src = user.profile_picture === 'default-avatar.png' 
    ? '/images/default-avatar.png' 
    : `/uploads/profiles/${user.profile_picture}`;

  const actionsDiv = document.getElementById('profile-actions');
  actionsDiv.innerHTML = '';

  if (data.isSelf) {
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-secondary';
    editBtn.textContent = 'Edit Profile';
    editBtn.onclick = () => {
      document.getElementById('edit-bio').value = user.bio || '';
      document.getElementById('edit-profile-card').classList.remove('hidden');
    };
    actionsDiv.appendChild(editBtn);
  } else {
    const followBtn = document.createElement('button');
    followBtn.className = data.isFollowing ? 'btn btn-secondary' : 'btn btn-primary';
    followBtn.textContent = data.isFollowing ? 'Unfollow' : 'Follow';
    followBtn.onclick = () => toggleFollow(user.id, data.isFollowing);
    actionsDiv.appendChild(followBtn);
  }
}

async function toggleFollow(targetUserId, isFollowing) {
  const method = isFollowing ? 'DELETE' : 'POST';
  const res = await fetch(`/api/users/${targetUserId}/follow`, { method });
  if (res.ok) loadProfileHeader();
}

function setupEditProfileForm() {
  const form = document.getElementById('edit-profile-form');
  const cancelBtn = document.getElementById('cancel-edit-btn');

  cancelBtn.onclick = () => document.getElementById('edit-profile-card').classList.add('hidden');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bio = document.getElementById('edit-bio').value;
    const pictureInput = document.getElementById('edit-picture');

    const formData = new FormData();
    formData.append('bio', bio);
    if (pictureInput.files[0]) {
      formData.append('profile_picture', pictureInput.files[0]);
    }

    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      body: formData
    });

    if (res.ok) {
      document.getElementById('edit-profile-card').classList.add('hidden');
      loadProfileHeader();
    }
  });
}

async function loadUserPosts() {
  const container = document.getElementById('user-posts-container');
  const res = await fetch(`/api/posts?username=${profileUsername}`);
  const data = await res.json();

  container.innerHTML = '';
  data.posts.forEach(post => {
    const card = renderPostCard(post);
    container.appendChild(card);
    loadComments(post.id);
  });
}

function renderPostCard(post) {
  const card = document.createElement('article');
  card.className = 'post-card';
  const isOwner = currentUser && currentUser.id === post.user_id;
  const avatarPath = post.profile_picture === 'default-avatar.png' ? '/images/default-avatar.png' : `/uploads/profiles/${post.profile_picture}`;

  card.innerHTML = `
    <div class="post-header">
      <div class="user-info">
        <img src="${avatarPath}" class="avatar" alt="Avatar">
        <div>
          <a href="/profile.html?username=${post.username}" class="username">${post.username}</a>
          <div class="post-time">${new Date(post.created_at).toLocaleString()}</div>
        </div>
      </div>
      ${isOwner ? `
        <div>
          <button onclick="editPost(${post.id}, '${escapeHtml(post.content)}')" class="btn btn-secondary btn-sm">Edit</button>
          <button onclick="deletePost(${post.id})" class="btn btn-danger btn-sm">Delete</button>
        </div>
      ` : ''}
    </div>
    <div class="post-content">${escapeHtml(post.content)}</div>
    ${post.image ? `<img src="/uploads/posts/${post.image}" class="post-image" alt="Post upload">` : ''}
    <div class="post-actions">
      <button class="like-btn ${post.user_liked ? 'liked' : ''}" onclick="toggleLike(${post.id}, ${post.user_liked})">
        👍 ${post.like_count} Likes
      </button>
    </div>
    <div class="comments-section">
      <div id="comments-list-${post.id}"></div>
      <form class="comment-form" onsubmit="submitComment(event, ${post.id})">
        <input type="text" placeholder="Write a comment..." required>
        <button type="submit" class="btn btn-primary btn-sm">Comment</button>
      </form>
    </div>
  `;
  return card;
}

async function toggleLike(postId, currentlyLiked) {
  const method = currentlyLiked ? 'DELETE' : 'POST';
  const res = await fetch(`/api/posts/${postId}/like`, { method });
  if (res.ok) loadUserPosts();
}

async function deletePost(postId) {
  if (confirm('Delete this post?')) {
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) loadUserPosts();
  }
}

async function editPost(postId, currentContent) {
  const newContent = prompt('Edit post:', currentContent);
  if (newContent !== null && newContent.trim() !== '') {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent })
    });
    if (res.ok) loadUserPosts();
  }
}

async function loadComments(postId) {
  const listEl = document.getElementById(`comments-list-${postId}`);
  const res = await fetch(`/api/posts/${postId}/comments`);
  const data = await res.json();

  listEl.innerHTML = '';
  data.comments.forEach(c => {
    const isCommentOwner = currentUser && currentUser.id === c.user_id;
    const item = document.createElement('div');
    item.className = 'comment-item';
    item.innerHTML = `
      <div>
        <a href="/profile.html?username=${c.username}" class="comment-author">${c.username}</a>
        <span class="comment-text">${escapeHtml(c.text)}</span>
      </div>
      ${isCommentOwner ? `<button onclick="deleteComment(${c.id})" class="btn btn-danger btn-sm" style="padding: 2px 6px;">✕</button>` : ''}
    `;
    listEl.appendChild(item);
  });
}

async function submitComment(event, postId) {
  event.preventDefault();
  const input = event.target.querySelector('input');
  const text = input.value;

  const res = await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  if (res.ok) {
    input.value = '';
    loadComments(postId);
  }
}

async function deleteComment(commentId) {
  if (confirm('Delete comment?')) {
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    if (res.ok) loadUserPosts();
  }
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}