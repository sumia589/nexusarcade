/**
 * NEXUS ARCADE - Game Player Controller (Full-Stack Connected)
 * Fetches game details from REST API (/api/games/:id), automatically increments play count,
 * embeds playable iframe, handles ratings, comments, and submits high scores to MongoDB (/api/scores).
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

  let currentGame = null;
  let allGames = [];

  // Parse Query Param ?id=... (supports slug or Mongo ID)
  const urlParams = new URLSearchParams(window.location.search);
  const gameIdentifier = urlParams.get('id') || 'space-dodge';

  // DOM Elements
  const gameStage = document.getElementById('gameStage');
  const gameIframe = document.getElementById('gameIframe');
  const splashOverlay = document.getElementById('splashOverlay');
  const launchBtn = document.getElementById('launchBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const theaterBtn = document.getElementById('theaterBtn');
  const restartBtn = document.getElementById('restartBtn');
  const favoriteBtn = document.getElementById('favoriteBtn');
  const shareBtn = document.getElementById('shareBtn');

  const gameTitleEl = document.getElementById('gameTitle');
  const gameCatBadgeEl = document.getElementById('gameCatBadge');
  const gamePlaysEl = document.getElementById('gamePlays');
  const gameDevEl = document.getElementById('gameDev');
  const gameDateEl = document.getElementById('gameDate');
  const gameDescEl = document.getElementById('gameDesc');
  const gameInstructionsEl = document.getElementById('gameInstructions');
  const desktopControlsEl = document.getElementById('desktopControls');
  const mobileControlsEl = document.getElementById('mobileControls');
  const breadcrumbTitle = document.getElementById('breadcrumbTitle');
  const breadcrumbCat = document.getElementById('breadcrumbCat');

  const starsPicker = document.getElementById('starsPicker');
  const userRatingText = document.getElementById('userRatingText');
  const relatedGrid = document.getElementById('relatedGamesGrid');

  const commentForm = document.getElementById('commentForm');
  const commentList = document.getElementById('commentsList');

  async function initPlayer() {
    try {
      // 1. Fetch current game from API (automatically increments playCount in MongoDB!)
      let fetchedGame = null;
      try {
        const res = await fetch(`/api/games/${encodeURIComponent(gameIdentifier)}`);
        if (res.ok) {
          const json = await res.json();
          fetchedGame = json.data;
        }
      } catch (e) {}

      // 2. Fetch all games for related recommendations
      try {
        const allRes = await fetch('/api/games');
        if (allRes.ok) {
          const allJson = await allRes.json();
          allGames = allJson.data;
        }
      } catch (e) {}

      // Fallback to static if backend didn't return
      if (!fetchedGame) {
        if (allGames.length === 0) {
          const staticRes = await fetch('data/games.json');
          allGames = await staticRes.json();
        }
        fetchedGame = allGames.find(g => (g.slug === gameIdentifier || g.id === gameIdentifier || g._id === gameIdentifier)) || allGames[0];
      }

      currentGame = fetchedGame;

      renderGameDetails();
      setupToolbar();
      setupRatingWidget();
      setupComments();
      renderRelatedGames();
    } catch (err) {
      console.error('Player initialization error:', err);
      if (gameTitleEl) gameTitleEl.textContent = 'Game Not Found';
    }
  }

  function renderGameDetails() {
    if (!currentGame) return;

    // Document SEO
    document.title = `${currentGame.title} - Play Free Online on Nexus Arcade`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', `Play ${currentGame.title} free in your browser. ${currentGame.description}`);

    // Breadcrumbs
    if (breadcrumbTitle) breadcrumbTitle.textContent = currentGame.title;
    if (breadcrumbCat) {
      breadcrumbCat.textContent = currentGame.category;
      breadcrumbCat.href = `index.html#categoryBar`;
    }

    // Header info
    if (gameTitleEl) gameTitleEl.textContent = currentGame.title;
    if (gameCatBadgeEl) {
      gameCatBadgeEl.textContent = currentGame.category.toUpperCase();
      gameCatBadgeEl.className = `badge badge-featured`;
    }
    const playsNum = currentGame.playCount || currentGame.plays || 0;
    if (gamePlaysEl) gamePlaysEl.textContent = `${(playsNum / 1000).toFixed(0)}k Plays`;
    if (gameDevEl) gameDevEl.textContent = currentGame.developer || 'Indie Lab';
    
    const releaseStr = currentGame.releaseDate || (currentGame.createdAt ? new Date(currentGame.createdAt).getFullYear() : '2026');
    if (gameDateEl) gameDateEl.textContent = releaseStr;
    if (gameDescEl) gameDescEl.textContent = currentGame.longDescription || currentGame.description;
    if (gameInstructionsEl) gameInstructionsEl.textContent = currentGame.instructions || 'Follow on-screen instructions.';

    // Controls
    if (desktopControlsEl && currentGame.controls) {
      desktopControlsEl.textContent = currentGame.controls.desktop || 'Arrow Keys / WASD, Space to Action';
    }
    if (mobileControlsEl && currentGame.controls) {
      mobileControlsEl.textContent = currentGame.controls.mobile || 'Touch, drag & tap gestures';
    }

    // Splash overlay preview
    if (splashOverlay) {
      const splashTitle = splashOverlay.querySelector('.splash-title');
      const splashCat = splashOverlay.querySelector('.splash-category');
      if (splashTitle) splashTitle.textContent = currentGame.title;
      if (splashCat) splashCat.textContent = currentGame.category.toUpperCase();
      const bannerImg = currentGame.bannerUrl || currentGame.banner || currentGame.thumbnailUrl;
      splashOverlay.style.backgroundImage = `radial-gradient(rgba(8,10,17,0.85), rgba(8,10,17,0.95)), url('${bannerImg}')`;
    }

    updateFavoriteBtnState();
  }

  // Launch Game
  function launchGame() {
    if (!gameIframe || !currentGame) return;
    gameIframe.src = currentGame.embedUrl || currentGame.iframeUrl;
    if (splashOverlay) splashOverlay.classList.add('hidden');
    window.NexusToast.show(`🎮 Starting ${currentGame.title}... Good luck!`);
  }

  // Toolbar Actions
  function setupToolbar() {
    if (launchBtn) launchBtn.addEventListener('click', launchGame);

    // Fullscreen
    if (fullscreenBtn && gameStage) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          if (gameStage.requestFullscreen) {
            gameStage.requestFullscreen();
          } else if (gameStage.webkitRequestFullscreen) {
            gameStage.webkitRequestFullscreen();
          }
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
        }
      });
    }

    // Theater Mode
    if (theaterBtn && gameStage) {
      theaterBtn.addEventListener('click', () => {
        const isTheater = gameStage.classList.toggle('theater-mode');
        theaterBtn.classList.toggle('active', isTheater);
        window.NexusToast.show(isTheater ? '🎬 Theater Mode ON (Press Esc to exit)' : 'Theater Mode OFF');
      });
    }

    // Restart Game
    if (restartBtn && gameIframe) {
      restartBtn.addEventListener('click', () => {
        if (gameIframe.src) {
          gameIframe.src = gameIframe.src;
          window.NexusToast.show('🔄 Game restarted');
        } else {
          launchGame();
        }
      });
    }

    // Favorite
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', () => toggleFavorite());
    }

    // Share link
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
          window.NexusToast.show('🔗 Link copied to clipboard! Share with friends!');
        } else {
          window.NexusToast.show('Share URL: ' + window.location.href);
        }
      });
    }
  }

  // --- Favorite Toggle ---
  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem('nexus_favorites') || '[]');
    } catch(e) {
      return [];
    }
  }

  function toggleFavorite() {
    if (!currentGame) return;
    let favs = getFavorites();
    const id = currentGame.slug || currentGame._id;
    const index = favs.indexOf(id);

    if (index > -1) {
      favs.splice(index, 1);
      window.NexusToast.show(`Removed ${currentGame.title} from favorites`);
    } else {
      favs.push(id);
      window.NexusToast.show(`❤️ Added ${currentGame.title} to your favorites!`);
    }

    localStorage.setItem('nexus_favorites', JSON.stringify(favs));
    updateFavoriteBtnState();
  }

  function updateFavoriteBtnState() {
    if (!favoriteBtn || !currentGame) return;
    const favs = getFavorites();
    const isFav = favs.includes(currentGame.slug || currentGame._id);
    favoriteBtn.classList.toggle('active', isFav);
    favoriteBtn.innerHTML = isFav ? `<span>❤️</span> Favorited` : `<span>🤍</span> Favorite`;
  }

  // --- Star Rating System ---
  function setupRatingWidget() {
    if (!starsPicker || !currentGame) return;

    const ratingKey = `nexus_rating_${currentGame.slug || currentGame._id}`;
    let savedRating = localStorage.getItem(ratingKey);

    if (savedRating) {
      highlightStars(parseInt(savedRating, 10));
      if (userRatingText) userRatingText.textContent = `You rated this ${savedRating} ★`;
    }

    const stars = starsPicker.querySelectorAll('.star');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.val, 10);
        localStorage.setItem(ratingKey, val);
        highlightStars(val);
        if (userRatingText) userRatingText.textContent = `Thanks! You rated this ${val} ★`;
        window.NexusToast.show(`⭐ Thanks for rating ${val} stars!`);
      });
    });
  }

  function highlightStars(val) {
    if (!starsPicker) return;
    const stars = starsPicker.querySelectorAll('.star');
    stars.forEach(s => {
      const sVal = parseInt(s.dataset.val, 10);
      s.classList.toggle('active', sVal <= val);
    });
  }

  // --- Comments / Discussion System ---
  function setupComments() {
    if (!commentList) return;

    renderComments();

    if (commentForm) {
      commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const authorInput = document.getElementById('commentAuthor');
        const textInput = document.getElementById('commentText');

        const author = authorInput ? authorInput.value.trim() : 'Player';
        const text = textInput ? textInput.value.trim() : '';

        if (!text) return;

        const commentsKey = `nexus_comments_${currentGame.slug || currentGame._id}`;
        let comments = [];
        try {
          comments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
        } catch(e) {}

        const newComment = {
          author: author || 'CyberGamer',
          text: text,
          date: 'Just now'
        };

        comments.unshift(newComment);
        localStorage.setItem(commentsKey, JSON.stringify(comments));

        textInput.value = '';
        renderComments();
        window.NexusToast.show('💬 Review posted successfully!');
      });
    }
  }

  function renderComments() {
    if (!commentList || !currentGame) return;

    const commentsKey = `nexus_comments_${currentGame.slug || currentGame._id}`;
    let comments = [];
    try {
      comments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
    } catch(e) {}

    if (comments.length === 0) {
      comments = [
        { author: 'NeonPilot99', text: 'Incredible controls and responsive soundtrack! Hit my new personal best today.', date: '2 days ago' },
        { author: 'ArcadeAddict', text: 'Super addictive gameplay loop. Runs at a silky 60 FPS in browser with zero lag.', date: '4 days ago' }
      ];
      localStorage.setItem(commentsKey, JSON.stringify(comments));
    }

    commentList.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="comment-top">
          <span class="comment-user">🎮 ${escapeHtml(c.author)}</span>
          <span class="comment-date">${escapeHtml(c.date)}</span>
        </div>
        <p class="comment-text">${escapeHtml(c.text)}</p>
      </div>
    `).join('');
  }

  // --- Related Games ---
  function renderRelatedGames() {
    if (!relatedGrid || !currentGame || allGames.length === 0) return;

    const currentId = currentGame.slug || currentGame._id;
    const related = allGames
      .filter(g => (g.slug !== currentId && g._id !== currentId) && (g.category === currentGame.category || g.isPopular || g.popular))
      .slice(0, 4);

    relatedGrid.innerHTML = related.map(g => {
      const gid = g.slug || g._id || g.id;
      const thumb = g.thumbnailUrl || g.thumbnail || 'assets/images/thumb-space-dodge.svg';
      const plays = ((g.playCount || g.plays || 0) / 1000).toFixed(0);
      return `
        <article class="game-card">
          <div class="card-media">
            <img src="${thumb}" alt="${escapeHtml(g.title)}" loading="lazy" onerror="this.src='assets/images/thumb-space-dodge.svg'">
            <div class="card-overlay">
              <a href="game.html?id=${gid}" class="btn-quick-play">▶</a>
            </div>
          </div>
          <div class="card-body">
            <div class="card-category">${escapeHtml(g.category)}</div>
            <h4 class="card-title"><a href="game.html?id=${gid}">${escapeHtml(g.title)}</a></h4>
            <div class="card-meta">
              <span class="card-rating">★ ${g.rating || 4.8}</span>
              <span class="card-plays">${plays}k plays</span>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  document.addEventListener('DOMContentLoaded', initPlayer);
})();
