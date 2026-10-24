/**
 * NEXUS ARCADE - Admin Dashboard Controller
 * Handles authentication, metrics polling, game CRUD, category management, and contact messages.
 */

(function () {
  'use strict';

  const TOKEN_KEY = 'nexus_admin_token';

  // Global Toast
  function showToast(msg) {
    let t = document.getElementById('adminToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'adminToast';
      t.className = 'toast-notice';
      document.body.appendChild(t);
    }
    t.innerHTML = `<span>⚡</span> <div>${msg}</div>`;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  // Helper for authenticated fetch
  async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = options.headers || {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Do not set Content-Type if sending FormData (browser sets boundary automatically)
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    options.headers = headers;
    const res = await fetch(url, options);

    if (res.status === 401) {
      clearToken();
      showLoginScreen();
      throw new Error('Session expired. Please log in again.');
    }

    return res;
  }

  // DOM Elements
  const loginScreen = document.getElementById('loginScreen');
  const adminApp = document.getElementById('adminApp');
  const loginForm = document.getElementById('adminLoginForm');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const adminUsernameBadge = document.getElementById('adminUsernameBadge');

  // Stats
  const statGames = document.getElementById('statGames');
  const statPlays = document.getElementById('statPlays');
  const statScores = document.getElementById('statScores');
  const statMessages = document.getElementById('statMessages');
  const unreadBadge = document.getElementById('unreadBadge');

  // Tabs
  const tabButtons = document.querySelectorAll('.admin-tab');
  const tabPanes = document.querySelectorAll('.admin-tab-pane');

  // Games
  const gamesTableBody = document.getElementById('gamesTableBody');
  const adminGameSearch = document.getElementById('adminGameSearch');
  const openAddGameModalBtn = document.getElementById('openAddGameModalBtn');
  const gameModal = document.getElementById('gameModal');
  const closeGameModalBtn = document.getElementById('closeGameModalBtn');
  const gameForm = document.getElementById('gameForm');
  const gameModalTitle = document.getElementById('gameModalTitle');
  const editGameId = document.getElementById('editGameId');

  // Categories
  const categoriesTableBody = document.getElementById('categoriesTableBody');
  const addCategoryForm = document.getElementById('addCategoryForm');
  const gCategorySelect = document.getElementById('gCategory');

  // Messages
  const messagesTableBody = document.getElementById('messagesTableBody');

  // State
  let cachedGames = [];
  let cachedCategories = [];

  // --- Auth Flow ---
  async function initAuth() {
    const token = getToken();
    if (!token) {
      showLoginScreen();
      return;
    }

    try {
      const res = await authFetch('/api/admin/me');
      if (res.ok) {
        const data = await res.json();
        adminUsernameBadge.textContent = data.admin.username;
        showDashboard();
      } else {
        showLoginScreen();
      }
    } catch (e) {
      showLoginScreen();
    }
  }

  function showLoginScreen() {
    loginScreen.style.display = 'flex';
    adminApp.style.display = 'none';
  }

  function showDashboard() {
    loginScreen.style.display = 'none';
    adminApp.style.display = 'block';
    loadDashboardData();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setToken(data.token);
        adminUsernameBadge.textContent = data.admin.username;
        loginForm.reset();
        showDashboard();
        showToast('Authentication successful. Welcome, Admin!');
      } else {
        loginError.textContent = data.message || 'Login failed';
        loginError.style.display = 'block';
      }
    } catch (err) {
      loginError.textContent = 'Server connection error. Please try again.';
      loginError.style.display = 'block';
    }
  });

  logoutBtn.addEventListener('click', () => {
    clearToken();
    showLoginScreen();
    showToast('Logged out of system.');
  });

  // --- Tabs Navigation ---
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.dataset.tab;
      document.getElementById('tabGames').style.display = targetTab === 'games' ? 'block' : 'none';
      document.getElementById('tabCategories').style.display = targetTab === 'categories' ? 'block' : 'none';
      document.getElementById('tabMessages').style.display = targetTab === 'messages' ? 'block' : 'none';

      if (targetTab === 'categories') loadCategories();
      if (targetTab === 'messages') loadMessages();
    });
  });

  // --- Load Full Dashboard Data ---
  async function loadDashboardData() {
    loadStats();
    loadCategories();
    loadGames();
  }

  async function loadStats() {
    try {
      const res = await authFetch('/api/admin/stats');
      if (!res.ok) return;
      const { stats } = await res.json();

      statGames.textContent = stats.totalGames;
      statPlays.textContent = (stats.totalPlays).toLocaleString();
      statScores.textContent = stats.totalScores;
      statMessages.textContent = stats.totalMessages;

      if (stats.unreadMessages > 0) {
        unreadBadge.textContent = `${stats.unreadMessages} NEW`;
        unreadBadge.style.display = 'inline-block';
      } else {
        unreadBadge.style.display = 'none';
      }
    } catch (e) {}
  }

  // --- Games Management ---
  async function loadGames() {
    try {
      const res = await authFetch('/api/admin/games');
      if (!res.ok) return;
      const json = await res.json();
      cachedGames = json.data;
      renderGamesTable(cachedGames);
    } catch (e) {
      gamesTableBody.innerHTML = `<tr><td colspan="6" style="color:#ef4444; text-align:center;">Failed to load games.</td></tr>`;
    }
  }

  function renderGamesTable(games) {
    if (games.length === 0) {
      gamesTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">No games found in database.</td></tr>`;
      return;
    }

    gamesTableBody.innerHTML = games.map(g => {
      return `
        <tr>
          <td>
            <img src="${g.thumbnailUrl}" class="table-thumb" alt="${g.title}" onerror="this.src='assets/images/thumb-space-dodge.svg'">
          </td>
          <td>
            <strong style="color:#fff; font-size:14px;">${escapeHtml(g.title)}</strong><br>
            <span style="font-size:11px; color:var(--cyan-neon);">${g.slug}</span>
          </td>
          <td>
            <span class="badge" style="background:rgba(255,255,255,0.08);">${g.category}</span>
          </td>
          <td>
            <strong>${(g.playCount || 0).toLocaleString()}</strong>
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="toggle-btn ${g.isFeatured ? 'active-feat' : ''}" onclick="window.NexusAdmin.toggleFlag('${g._id}', 'isFeatured')">★ Featured</button>
              <button class="toggle-btn ${g.isPopular ? 'active-pop' : ''}" onclick="window.NexusAdmin.toggleFlag('${g._id}', 'isPopular')">🔥 Pop</button>
              <button class="toggle-btn ${g.isNew ? 'active-new' : ''}" onclick="window.NexusAdmin.toggleFlag('${g._id}', 'isNew')">✨ New</button>
            </div>
          </td>
          <td>
            <div class="row-actions">
              <button class="btn-action-sm btn-edit" onclick="window.NexusAdmin.openEditModal('${g._id}')">Edit</button>
              <button class="btn-action-sm btn-delete" onclick="window.NexusAdmin.deleteGame('${g._id}', '${escapeHtml(g.title)}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Filter games live search
  adminGameSearch.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderGamesTable(cachedGames);
      return;
    }
    const filtered = cachedGames.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      g.slug.toLowerCase().includes(q)
    );
    renderGamesTable(filtered);
  });

  // Toggle flags
  window.NexusAdmin = window.NexusAdmin || {};
  window.NexusAdmin.toggleFlag = async function (id, field) {
    try {
      const res = await authFetch(`/api/admin/games/${id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ field })
      });
      if (res.ok) {
        showToast(`Updated ${field} status`);
        loadGames();
        loadStats();
      }
    } catch (e) {
      showToast('Failed to toggle flag');
    }
  };

  // Add / Edit Modal
  openAddGameModalBtn.addEventListener('click', () => {
    gameForm.reset();
    editGameId.value = '';
    gameModalTitle.innerHTML = `<span>🎮</span> Add New Game`;
    gameModal.classList.add('open');
  });

  closeGameModalBtn.addEventListener('click', () => {
    gameModal.classList.remove('open');
  });

  window.NexusAdmin.openEditModal = function (id) {
    const game = cachedGames.find(g => g._id === id);
    if (!game) return;

    editGameId.value = game._id;
    gameModalTitle.innerHTML = `<span>✏️</span> Edit Game: ${escapeHtml(game.title)}`;
    document.getElementById('gTitle').value = game.title;
    document.getElementById('gSlug').value = game.slug;
    document.getElementById('gCategory').value = game.category;
    document.getElementById('gBadge').value = game.badge || '';
    document.getElementById('gEmbedUrl').value = game.embedUrl;
    document.getElementById('gThumbUrl').value = game.thumbnailUrl;
    document.getElementById('gDesc').value = game.description;
    document.getElementById('gInstructions').value = game.instructions || '';
    document.getElementById('gIsFeatured').checked = !!game.isFeatured;
    document.getElementById('gIsPopular').checked = !!game.isPopular;
    document.getElementById('gIsNew').checked = !!game.isNew;

    gameModal.classList.add('open');
  };

  // Submit Game (Add or Edit)
  gameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = editGameId.value;
    const isEdit = Boolean(id);

    const formData = new FormData();
    formData.append('title', document.getElementById('gTitle').value);
    formData.append('slug', document.getElementById('gSlug').value);
    formData.append('category', document.getElementById('gCategory').value);
    formData.append('badge', document.getElementById('gBadge').value);
    formData.append('embedUrl', document.getElementById('gEmbedUrl').value);
    formData.append('description', document.getElementById('gDesc').value);
    formData.append('instructions', document.getElementById('gInstructions').value);
    formData.append('isFeatured', document.getElementById('gIsFeatured').checked);
    formData.append('isPopular', document.getElementById('gIsPopular').checked);
    formData.append('isNew', document.getElementById('gIsNew').checked);

    const thumbFile = document.getElementById('gThumbFile').files[0];
    if (thumbFile) {
      formData.append('thumbnail', thumbFile);
    } else {
      formData.append('thumbnailUrl', document.getElementById('gThumbUrl').value || 'assets/images/thumb-space-dodge.svg');
    }

    try {
      const url = isEdit ? `/api/admin/games/${id}` : '/api/admin/games';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        body: formData
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(isEdit ? 'Game updated successfully!' : 'Game created successfully!');
        gameModal.classList.remove('open');
        gameForm.reset();
        loadGames();
        loadStats();
      } else {
        alert(json.message || 'Operation failed');
      }
    } catch (err) {
      alert('Error saving game: ' + err.message);
    }
  });

  // Delete Game
  window.NexusAdmin.deleteGame = async function (id, title) {
    if (!confirm(`Are you sure you want to permanently delete "${title}" and all its high scores?`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/admin/games/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        showToast('Game deleted successfully');
        loadGames();
        loadStats();
      } else {
        alert(json.message || 'Failed to delete');
      }
    } catch (e) {
      alert('Network error while deleting game');
    }
  };

  // --- Categories Management ---
  async function loadCategories() {
    try {
      const res = await authFetch('/api/categories');
      if (!res.ok) return;
      const json = await res.json();
      cachedCategories = json.data;

      // Populate Category dropdown in Add/Edit Game Modal
      if (gCategorySelect) {
        gCategorySelect.innerHTML = cachedCategories.map(c => `
          <option value="${c.name}">${c.icon} ${c.name}</option>
        `).join('');
      }

      // Populate Categories Table
      categoriesTableBody.innerHTML = cachedCategories.map(c => `
        <tr>
          <td style="font-size:20px;">${c.icon || '🎮'}</td>
          <td><strong style="color:#fff;">${escapeHtml(c.name)}</strong></td>
          <td><span style="color:var(--cyan-neon); font-size:12px;">${c.slug}</span></td>
          <td><span class="badge badge-featured">${c.gameCount} Games</span></td>
          <td>
            <button class="btn-action-sm btn-delete" onclick="window.NexusAdmin.deleteCategory('${c._id}', '${escapeHtml(c.name)}')">Delete</button>
          </td>
        </tr>
      `).join('');
    } catch (e) {}
  }

  addCategoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('catName').value.trim();
    const slug = document.getElementById('catSlug').value.trim();
    const icon = document.getElementById('catIcon').value.trim();
    const description = document.getElementById('catDesc').value.trim();

    try {
      const res = await authFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name, slug, icon, description })
      });
      const json = await res.json();
      if (res.ok) {
        showToast(`Category '${name}' created!`);
        addCategoryForm.reset();
        loadCategories();
      } else {
        alert(json.message || 'Failed to create category');
      }
    } catch (err) {
      alert('Error creating category');
    }
  });

  window.NexusAdmin.deleteCategory = async function (id, name) {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      const res = await authFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Category deleted');
        loadCategories();
      }
    } catch (e) {
      alert('Error deleting category');
    }
  };

  // --- Messages Management ---
  async function loadMessages() {
    try {
      const res = await authFetch('/api/admin/messages');
      if (!res.ok) return;
      const json = await res.json();
      const messages = json.data;

      if (messages.length === 0) {
        messagesTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">No messages found.</td></tr>`;
        return;
      }

      messagesTableBody.innerHTML = messages.map(m => {
        const dateStr = new Date(m.createdAt).toLocaleDateString();
        return `
          <tr style="${!m.isRead ? 'background:rgba(0,240,255,0.03);' : ''}">
            <td style="font-size:12px; color:var(--text-muted);">${dateStr}</td>
            <td>
              <strong style="color:#fff;">${escapeHtml(m.name)}</strong><br>
              <a href="mailto:${m.email}" style="color:var(--cyan-neon); font-size:12px;">${escapeHtml(m.email)}</a>
            </td>
            <td><span class="badge" style="background:#1e293b;">${escapeHtml(m.subject)}</span></td>
            <td style="max-width:300px; color:var(--text-muted); font-size:13px;">${escapeHtml(m.message)}</td>
            <td>
              ${m.isRead ? '<span style="color:var(--text-subtle); font-size:12px;">Read</span>' : '<span class="badge badge-hot">UNREAD</span>'}
            </td>
            <td>
              <div class="row-actions">
                ${!m.isRead ? `<button class="btn-action-sm btn-edit" onclick="window.NexusAdmin.markRead('${m._id}')">Mark Read</button>` : ''}
                <button class="btn-action-sm btn-delete" onclick="window.NexusAdmin.deleteMessage('${m._id}')">Delete</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (e) {}
  }

  window.NexusAdmin.markRead = async function (id) {
    try {
      const res = await authFetch(`/api/admin/messages/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        loadMessages();
        loadStats();
      }
    } catch (e) {}
  };

  window.NexusAdmin.deleteMessage = async function (id) {
    if (!confirm('Delete this message?')) return;
    try {
      const res = await authFetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Message deleted');
        loadMessages();
        loadStats();
      }
    } catch (e) {}
  };

  function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  // Init
  document.addEventListener('DOMContentLoaded', initAuth);
})();
