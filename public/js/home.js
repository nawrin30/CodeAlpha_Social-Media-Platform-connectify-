let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  if (currentUser) {
    loadFeed();
    setupCreatePost();
    setupLogout();
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

function setupCreatePost() {
  const form = document.getElementById('create-post-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = document.getElementById('post-content').value;
    const imageInput = document.getElementById('post-image');

    const formData = new FormData();
    formData.append('content', content);
    if (imageInput.files[0]) {
      formData.append('image', imageInput.files[0]);
    }

    const res = await fetch('/api/posts', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      document.getElementById('post-content').value = '';
      imageInput.value = '';
      loadFeed();
    }
  });
}

async function loadFeed() {
  const container = document.getElementById('feed-container');
  const res = await fetch('/api/posts');
  const data = await res.json();

  container.innerHTML = '';

  data.posts.forEach(post => {
    const postEl = renderPostCard(post);
    container.appendChild(postEl);
    loadComments(post.id);
  });
}

function renderPostCard(post) {
  const card = document.createElement('article');
  card.className = 'post-card';
  card.id = `post-${post.id}`;

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
    <div class="post-content" id="post-text-${post.id}">${escapeHtml(post.content)}</div>
    ${post.image ? `<img src="/uploads/posts/${post.image}" class="post-image" alt="Post upload">` : ''}
    <div class="post-actions">
      <button class="like-btn ${post.user_liked ? 'liked' : ''}" onclick="toggleLike(${post.id}, ${post.user_liked})">
        👍 <span id="like-count-${post.id}">${post.like_count}</span> Likes
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
  if (res.ok) loadFeed();
}

async function deletePost(postId) {
  if (confirm('Are you sure you want to delete this post?')) {
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) loadFeed();
  }
}

async function editPost(postId, currentContent) {
  const newContent = prompt('Edit your post:', currentContent);
  if (newContent !== null && newContent.trim() !== '') {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent })
    });
    if (res.ok) loadFeed();
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
  if (confirm('Delete this comment?')) {
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    if (res.ok) loadFeed();
  }
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}