/**
 * NEXUS ARCADE - Leaderboard Management System (Full-Stack Connected)
 * Fetches verified high-scores from MongoDB REST API (/api/scores) with client-side localStorage fallback.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'nexus_leaderboard_data';

  // Seed default fallback data
  const defaultFallbackData = {
    daily: [
      { user: 'ValkyrieX', game: 'Neon Space Dodge', score: 14250 },
      { user: 'CyberGlitch', game: 'Cyber Retro Snake', score: 11900 },
      { user: 'NovaSniper', game: 'Cyber Grid 2048', score: 9840 },
      { user: 'PixelGhost', game: 'Neon Brick Breaker', score: 8720 },
      { user: 'AeroZero', game: 'Turbo Velocity 3D', score: 7600 }
    ],
    weekly: [
      { user: 'HyperVolt', game: 'Neon Space Dodge', score: 48900 },
      { user: 'ValkyrieX', game: 'Turbo Velocity 3D', score: 44100 },
      { user: 'ShadowStrike', game: 'Shadow Blade', score: 38200 },
      { user: 'QuantumPilot', game: 'Gravity Warp Lab', score: 32400 },
      { user: 'NeonRebel', game: 'Cyber Retro Snake', score: 29800 }
    ],
    allTime: [
      { user: 'ChronosMaster', game: 'Neon Space Dodge', score: 184500 },
      { user: 'ValkyrieX', game: 'Cyber Retro Snake', score: 162000 },
      { user: 'ApexPredator', game: 'Cyber Grid 2048', score: 145900 },
      { user: 'HyperVolt', game: 'Neon Brick Breaker', score: 138000 },
      { user: 'NeuroHacker', game: 'Neuro Match', score: 124000 }
    ]
  };

  let currentTab = 'daily';
  let liveApiScores = [];
  let availableGames = [];

  async function fetchLiveScores() {
    try {
      const res = await fetch('/api/scores?limit=10');
      if (res.ok) {
        const json = await res.json();
        liveApiScores = json.data;
      }
    } catch (e) {
      console.warn('Leaderboard API offline, using fallback');
    }

    try {
      const gamesRes = await fetch('/api/games');
      if (gamesRes.ok) {
        const gamesJson = await gamesRes.json();
        availableGames = gamesJson.data;
        populateGameSelect(availableGames);
      }
    } catch (e) {}

    renderLeaderboard();
  }

  function populateGameSelect(games) {
    const select = document.getElementById('scoreGameSelect');
    if (!select || games.length === 0) return;
    select.innerHTML = games.map(g => `
      <option value="${g._id}">${g.title} (${g.category})</option>
    `).join('');
  }

  function renderLeaderboard() {
    const listEl = document.getElementById('leaderboardList');
    if (!listEl) return;

    let entries = [];

    if (liveApiScores && liveApiScores.length > 0 && currentTab === 'daily') {
      entries = liveApiScores.map(s => ({
        user: s.playerName,
        game: (s.gameId && s.gameId.title) ? s.gameId.title : (s.gameTitle || 'Game'),
        score: s.score
      }));
    } else {
      let stored = null;
      try {
        stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      } catch (e) {}
      const data = stored || defaultFallbackData;
      entries = data[currentTab] || data.daily;
    }

    listEl.innerHTML = entries.slice(0, 5).map((entry, index) => {
      const rank = index + 1;
      const rankClass = rank === 1 ? 'lb-rank-1' : rank === 2 ? 'lb-rank-2' : rank === 3 ? 'lb-rank-3' : '';
      return `
        <div class="lb-item">
          <div class="lb-rank ${rankClass}">${rank}</div>
          <div class="lb-user-info">
            <div class="lb-username">${escapeHtml(entry.user)}</div>
            <div class="lb-game-name">${escapeHtml(entry.game)}</div>
          </div>
          <div class="lb-score">${(entry.score || 0).toLocaleString()}</div>
        </div>
      `;
    }).join('');
  }

  function setupTabs() {
    const tabs = document.querySelectorAll('.lb-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        renderLeaderboard();
      });
    });
  }

  function setupScoreSubmission() {
    const submitBtn = document.getElementById('openSubmitScoreBtn');
    const modal = document.getElementById('scoreModal');
    const closeBtn = document.getElementById('closeScoreModalBtn');
    const form = document.getElementById('submitScoreForm');

    if (!submitBtn || !modal) return;

    submitBtn.addEventListener('click', () => {
      modal.classList.add('open');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('open');
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('scoreUsername').value.trim();
        const gameSelect = document.getElementById('scoreGameSelect');
        const gameId = gameSelect.value;
        const score = parseInt(document.getElementById('scoreValue').value, 10);

        if (!username || isNaN(score) || score <= 0) {
          alert('Please enter a valid gamertag and score.');
          return;
        }

        // Try submitting to backend API
        try {
          const res = await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerName: username,
              score: score,
              gameId: gameId
            })
          });

          if (res.ok) {
            const json = await res.json();
            modal.classList.remove('open');
            form.reset();
            if (window.NexusToast) {
              window.NexusToast.show(`🔥 High score saved to MongoDB! Welcome, ${username}!`);
            }
            fetchLiveScores();
            return;
          }
        } catch (err) {
          console.warn('API submit failed, fallback to local save');
        }

        // Fallback local save
        let stored = null;
        try {
          stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        } catch (e) {}
        const data = stored || defaultFallbackData;
        const selectedGameText = gameSelect.options[gameSelect.selectedIndex]?.text.split('(')[0].trim() || 'Arcade Game';
        data.daily.unshift({ user: username, game: selectedGameText, score: score });
        data.daily.sort((a, b) => b.score - a.score);
        data.daily = data.daily.slice(0, 5);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        renderLeaderboard();
        modal.classList.remove('open');
        form.reset();
        if (window.NexusToast) {
          window.NexusToast.show(`🔥 Score submitted! Welcome to the rank list, ${username}!`);
        }
      });
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  document.addEventListener('DOMContentLoaded', () => {
    fetchLiveScores();
    setupTabs();
    setupScoreSubmission();
  });

  window.NexusLeaderboard = {
    refresh: fetchLiveScores
  };
})();
