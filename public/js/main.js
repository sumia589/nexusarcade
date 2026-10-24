/**
 * NEXUS ARCADE - Core Homepage Controller
 * Fetches dynamic game data and categories from Node.js/MongoDB REST API (/api/games & /api/categories),
 * supports live search, category filtering, sorting, VIP modal, and mobile drawer.
 */

(function () {
  'use strict';

  // Global Toast System
  const toastEl = document.createElement('div');
  toastEl.className = 'toast-notice';
  document.body.appendChild(toastEl);

  window.NexusToast = {
    show: function (message, duration = 3200) {
      toastEl.innerHTML = `<span>✨</span> <div>${message}</div>`;
      toastEl.classList.add('show');
      setTimeout(() => {
        toastEl.classList.remove('show');
      }, duration);
    }
  };

  // State
  let allGames = [];
  let allCategories = [];
  let currentCategory = 'all';
  let currentSort = 'popular';
  let searchQuery = '';

  // DOM Elements
  const heroBannerContainer = document.getElementById('heroBannerContainer');
  const categoryBar = document.getElementById('categoryBar');
  const popularGrid = document.getElementById('popularGamesGrid');
  const newGamesGrid = document.getElementById('newGamesGrid');
  const allGamesGrid = document.getElementById('allGamesGrid');
  const sortSelect = document.getElementById('sortSelect');
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  const searchDropdown = document.getElementById('searchResultsDropdown');
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileNavDrawer');
  const vipModal = document.getElementById('vipModal');
  const openVipBtns = document.querySelectorAll('.open-vip-trigger');
  const closeVipBtn = document.getElementById('closeVipModalBtn');
  const vipPlanToggle = document.getElementById('vipPlanToggle');
  const vipPriceText = document.getElementById('vipPriceText');
  const vipDurationText = document.getElementById('vipDurationText');
  const vipSubscribeBtn = document.getElementById('vipSubscribeBtn');
  const favCountEl = document.getElementById('favCount');
  const newsletterForm = document.getElementById('newsletterForm');

  // Load Categories & Games from REST API (with static fallback)
  async function loadData() {
    try {
      // 1. Fetch Categories
      try {
        const catRes = await fetch('/api/categories');
        if (catRes.ok) {
          const catJson = await catRes.json();
          allCategories = catJson.data;
        }
      } catch (e) {}

      // 2. Fetch Games
      let gamesRes;
      try {
        gamesRes = await fetch('/api/games');
      } catch (e) {}

      if (gamesRes && gamesRes.ok) {
        const json = await gamesRes.json();
        allGames = json.data;
      } else {
        // Fallback to local data/games.json if standalone
        const fallbackRes = await fetch('data/games.json');
        allGames = await fallbackRes.json();
      }

      initUI();
    } catch (err) {
      console.error('Failed to load games:', err);
      if (allGamesGrid) {
        allGamesGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align:center; padding: 40px; color: #ff007f;">
            <h3>Unable to load games database.</h3>
            <p style="color:#94a3b8; font-size:14px; margin-top:8px;">Ensure server is running or check connection.</p>
          </div>
        `;
      }
    }
  }

  function initUI() {
    renderHeroBanner();
    renderCategories();
    renderGrids();
    setupEventListeners();
    updateFavoriteCount();
  }

  // --- Render Hero Banner ---
  function renderHeroBanner() {
    if (!heroBannerContainer) return;
    const featuredGame = allGames.find(g => g.isFeatured || g.featured) || allGames[0];
    if (!featuredGame) return;

    heroBannerContainer.innerHTML = `
      <div class="hero-banner">
        <img class="hero-backdrop" src="${featuredGame.bannerUrl || featuredGame.banner || featuredGame.thumbnailUrl}" alt="${featuredGame.title} Backdrop" loading="eager">
        <div class="hero-content">
          <div class="hero-badge-row">
            <span class="badge badge-featured">★ FEATURED GAME OF THE DAY</span>
            <span class="badge badge-hot">${featuredGame.category.toUpperCase()}</span>
          </div>
          <h2 class="hero-title">${escapeHtml(featuredGame.title)}</h2>
          <p class="hero-desc">${escapeHtml(featuredGame.description)}</p>
          <div class="hero-stats">
            <div class="stat-item">
              <span class="rating-stars">★★★★★</span>
              <span class="stat-val">${featuredGame.rating}</span> (${(featuredGame.ratingCount || 100).toLocaleString()})
            </div>
            <div class="stat-item">
              <span>🎮 Plays:</span> <span class="stat-val">${((featuredGame.playCount || featuredGame.plays || 0) / 1000).toFixed(0)}k+</span>
            </div>
            <div class="stat-item">
              <span>⚡ Dev:</span> <span class="stat-val">${escapeHtml(featuredGame.developer || 'Indie Lab')}</span>
            </div>
          </div>
          <div class="hero-actions">
            <a href="game.html?id=${featuredGame.slug || featuredGame._id || featuredGame.id}" class="btn-play-hero">
              <span>▶</span> PLAY NOW
            </a>
            <button class="btn-secondary" onclick="window.NexusMain.quickPreview('${featuredGame.slug || featuredGame.id}')">
              <span>ℹ</span> Game Info
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // --- Render Category Pills with counts ---
  function renderCategories() {
    if (!categoryBar) return;

    let categories = [
      { name: 'All Games', slug: 'all', icon: '⚡', gameCount: allGames.length }
    ];

    if (allCategories && allCategories.length > 0) {
      allCategories.forEach(c => {
        categories.push({
          name: c.name,
          slug: c.name,
          icon: c.icon || '🎮',
          gameCount: c.gameCount || allGames.filter(g => g.category.toLowerCase() === c.name.toLowerCase()).length
        });
      });
    } else {
      const defaultCats = ['Puzzle', 'Action', 'Racing', 'Arcade', 'Adventure', 'Brain Training'];
      const icons = { Puzzle: '🧩', Action: '⚔️', Racing: '🏎️', Arcade: '🕹️', Adventure: '🗺️', 'Brain Training': '🧠' };
      defaultCats.forEach(cat => {
        categories.push({
          name: cat,
          slug: cat,
          icon: icons[cat] || '🎮',
          gameCount: allGames.filter(g => g.category.toLowerCase() === cat.toLowerCase()).length
        });
      });
    }

    categoryBar.innerHTML = categories.map(cat => {
      const activeClass = currentCategory.toLowerCase() === cat.slug.toLowerCase() ? 'active' : '';
      return `
        <button class="category-pill ${activeClass}" data-category="${cat.slug}">
          <span>${cat.icon}</span>
          <span>${cat.name}</span>
          <span class="pill-count">${cat.gameCount || 0}</span>
        </button>
      `;
    }).join('');

    categoryBar.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        categoryBar.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        filterAndRenderAllGames();
      });
    });
  }

  // --- Render Game Card Template ---
  function createGameCardHtml(game) {
    const badgeText = game.badge || (game.isNew ? 'NEW' : game.isPopular ? 'HOT' : '');
    const badgeHtml = badgeText ? `
      <span class="badge ${badgeText === 'HOT' ? 'badge-hot' : badgeText === 'NEW' ? 'badge-new' : 'badge-featured'} card-badge">
        ${badgeText}
      </span>
    ` : '';

    const thumb = game.thumbnailUrl || game.thumbnail || 'assets/images/thumb-space-dodge.svg';
    const gameTargetId = game.slug || game._id || game.id;
    const playDisplay = ((game.playCount || game.plays || 0) / 1000).toFixed(0);

    return `
      <article class="game-card" data-category="${game.category}">
        <div class="card-media">
          ${badgeHtml}
          <img src="${thumb}" alt="${escapeHtml(game.title)} Thumbnail" loading="lazy" onerror="this.src='assets/images/thumb-space-dodge.svg'">
          <div class="card-overlay">
            <a href="game.html?id=${gameTargetId}" class="btn-quick-play" title="Play ${escapeHtml(game.title)}" aria-label="Play ${escapeHtml(game.title)}">▶</a>
          </div>
        </div>
        <div class="card-body">
          <div class="card-category">${escapeHtml(game.category)}</div>
          <h3 class="card-title" title="${escapeHtml(game.title)}">
            <a href="game.html?id=${gameTargetId}">${escapeHtml(game.title)}</a>
          </h3>
          <div class="card-meta">
            <div class="card-rating">
              <span class="star">★</span> ${game.rating || 4.8}
            </div>
            <div class="card-plays">${playDisplay}k plays</div>
          </div>
        </div>
      </article>
    `;
  }

  // --- Render Grids ---
  function renderGrids() {
    // 1. Popular Games
    if (popularGrid) {
      const popularGames = allGames.filter(g => g.isPopular || g.popular).slice(0, 4);
      popularGrid.innerHTML = popularGames.map(createGameCardHtml).join('');
    }

    // 2. New Games
    if (newGamesGrid) {
      const newGames = allGames.filter(g => g.isNew).slice(0, 4);
      newGamesGrid.innerHTML = newGames.map(createGameCardHtml).join('');
    }

    // 3. All / Filtered Games
    filterAndRenderAllGames();
  }

  // Filter and Sort
  function filterAndRenderAllGames() {
    if (!allGamesGrid) return;

    let filtered = [...allGames];

    // Category filter
    if (currentCategory !== 'all') {
      filtered = filtered.filter(g => g.category.toLowerCase() === currentCategory.toLowerCase());
    }

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.tags && g.tags.some(t => t.toLowerCase().includes(q))) ||
        (g.description && g.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (currentSort === 'popular') {
      filtered.sort((a, b) => (b.playCount || b.plays || 0) - (a.playCount || a.plays || 0));
    } else if (currentSort === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (currentSort === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt || b.releaseDate || 0) - new Date(a.createdAt || a.releaseDate || 0));
    }

    if (filtered.length === 0) {
      allGamesGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; color: var(--text-muted);">
          <div style="font-size: 36px; margin-bottom: 10px;">🔍</div>
          <h3 style="color:#fff; margin-bottom: 6px;">No games found</h3>
          <p style="font-size: 14px;">Try searching for another keyword or select a different category.</p>
        </div>
      `;
    } else {
      allGamesGrid.innerHTML = filtered.map(createGameCardHtml).join('');
    }

    // Update Section Title Count
    const countBadge = document.getElementById('filteredCountBadge');
    if (countBadge) {
      countBadge.textContent = `${filtered.length} Games`;
    }
  }

  // --- Autocomplete Live Search ---
  function setupSearch() {
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchClear) searchClear.style.display = searchQuery ? 'block' : 'none';

      filterAndRenderAllGames();
      updateSearchDropdown();
    });

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClear.style.display = 'none';
        if (searchDropdown) searchDropdown.classList.remove('active');
        filterAndRenderAllGames();
        searchInput.focus();
      });
    }

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && searchDropdown && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.remove('active');
      }
    });
  }

  function updateSearchDropdown() {
    if (!searchDropdown) return;
    const q = searchQuery.toLowerCase().trim();

    if (!q) {
      searchDropdown.classList.remove('active');
      return;
    }

    const matches = allGames.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      (g.tags && g.tags.some(t => t.toLowerCase().includes(q)))
    ).slice(0, 5);

    if (matches.length === 0) {
      searchDropdown.innerHTML = `
        <div style="padding: 14px; text-align: center; font-size: 13px; color: var(--text-muted);">
          No matching games found for "${escapeHtml(q)}"
        </div>
      `;
    } else {
      searchDropdown.innerHTML = matches.map(m => `
        <a href="game.html?id=${m.slug || m._id || m.id}" class="search-item">
          <img src="${m.thumbnailUrl || m.thumbnail || 'assets/images/thumb-space-dodge.svg'}" alt="${escapeHtml(m.title)}">
          <div class="search-item-info">
            <h4>${escapeHtml(m.title)}</h4>
            <span>${escapeHtml(m.category)} • ★ ${m.rating}</span>
          </div>
        </a>
      `).join('');
    }

    searchDropdown.classList.add('active');
  }

  // --- VIP Membership Modal Controller ---
  function setupVipModal() {
    openVipBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (vipModal) vipModal.classList.add('open');
      });
    });

    if (closeVipBtn) {
      closeVipBtn.addEventListener('click', () => {
        vipModal.classList.remove('open');
      });
    }

    if (vipModal) {
      vipModal.addEventListener('click', (e) => {
        if (e.target === vipModal) vipModal.classList.remove('open');
      });
    }

    if (vipPlanToggle && vipPriceText && vipDurationText) {
      vipPlanToggle.addEventListener('change', () => {
        if (vipPlanToggle.checked) {
          vipPriceText.textContent = '$29.99';
          vipDurationText.textContent = '/ year (Save 38%)';
        } else {
          vipPriceText.textContent = '$3.99';
          vipDurationText.textContent = '/ month';
        }
      });
    }

    if (vipSubscribeBtn) {
      vipSubscribeBtn.addEventListener('click', () => {
        if (vipModal) vipModal.classList.remove('open');
        window.NexusToast.show('👑 VIP Activated! Enjoy 100% ad-free turbo gaming & exclusive perks!');
      });
    }
  }

  // --- Mobile Drawer Toggle ---
  function setupMobileMenu() {
    if (!mobileToggle || !mobileDrawer) return;

    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileToggle.textContent = isOpen ? '✕' : '☰';
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileToggle.textContent = '☰';
        document.body.style.overflow = '';
      });
    });
  }

  // --- Favorites Counter ---
  function updateFavoriteCount() {
    if (!favCountEl) return;
    try {
      const favs = JSON.parse(localStorage.getItem('nexus_favorites') || '[]');
      favCountEl.textContent = favs.length;
    } catch(e) {}
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    setupSearch();
    setupVipModal();
    setupMobileMenu();

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        filterAndRenderAllGames();
      });
    }

    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = newsletterForm.querySelector('input');
        if (input && input.value) {
          window.NexusToast.show('🎮 Thanks for subscribing! You’ll get weekly secret game drops.');
          input.value = '';
        }
      });
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  window.NexusMain = {
    quickPreview: function (gameId) {
      const game = allGames.find(g => (g.slug === gameId || g._id === gameId || g.id === gameId));
      if (game) {
        window.NexusToast.show(`🕹️ ${game.title}: ${game.description.substring(0, 80)}...`);
      }
    },
    updateFavoriteCount: updateFavoriteCount
  };

  document.addEventListener('DOMContentLoaded', loadData);
})();
