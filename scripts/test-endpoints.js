/**
 * Automated Verification Script
 * Validates all REST API endpoints, security, database persistence, and page routing.
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      reqOptions.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json || body
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n=============================================');
  console.log('🧪 RUNNING COMPREHENSIVE ENDPOINT TESTS');
  console.log('=============================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${detail ? '(' + detail + ')' : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? '(' + detail + ')' : ''}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'online', 'Health Check');

    // 2. Categories
    const categories = await request('/api/categories');
    assert(categories.status === 200 && categories.data.count >= 6, 'GET /api/categories', `Found ${categories.data.count} categories`);

    // 3. Games listing
    const games = await request('/api/games');
    assert(games.status === 200 && games.data.count >= 12, 'GET /api/games', `Found ${games.data.count} games`);

    // 4. Games filter by category
    const puzzleGames = await request('/api/games?category=Puzzle');
    assert(puzzleGames.status === 200 && puzzleGames.data.count > 0, 'GET /api/games?category=Puzzle', `Found ${puzzleGames.data.count}`);

    // 5. Games search query
    const searchRes = await request('/api/games?search=snake');
    assert(searchRes.status === 200 && searchRes.data.count > 0, 'GET /api/games?search=snake', `Found ${searchRes.data.count}`);

    // 6. Single Game detail and auto-increment playCount
    const singleGame = await request('/api/games/space-dodge');
    assert(singleGame.status === 200 && singleGame.data.data.slug === 'space-dodge', 'GET /api/games/space-dodge', `Plays: ${singleGame.data.data.playCount}`);
    const initialPlays = singleGame.data.data.playCount;

    // 7. Explicit play increment
    const playInc = await request('/api/games/space-dodge/play', { method: 'POST' });
    assert(playInc.status === 200 && playInc.data.playCount === initialPlays + 1, 'POST /api/games/:id/play', `Updated Plays: ${playInc.data.playCount}`);

    // 8. Submit high-score
    const gameId = singleGame.data.data._id;
    const scoreSubmit = await request('/api/scores', {
      method: 'POST',
      body: {
        playerName: 'ApexTester',
        score: 18500,
        gameId: gameId
      }
    });
    assert(scoreSubmit.status === 201 && scoreSubmit.data.success, 'POST /api/scores', `Recorded score: 18500`);

    // 9. Get game top scores
    const gameScores = await request(`/api/scores/${gameId}`);
    assert(gameScores.status === 200 && gameScores.data.count > 0, 'GET /api/scores/:gameId', `Scores count: ${gameScores.data.count}`);

    // 10. Get overall top scores
    const allScores = await request('/api/scores');
    assert(allScores.status === 200 && allScores.data.count > 0, 'GET /api/scores', `Top scores count: ${allScores.data.count}`);

    // 11. Contact message submission
    const contactRes = await request('/api/contact', {
      method: 'POST',
      body: {
        name: 'Sarah Connor',
        email: 'sarah@skynet.example.com',
        subject: 'Advertising',
        message: 'Interested in booking the 728x90 leaderboard ad for next quarter.'
      }
    });
    assert(contactRes.status === 201 && contactRes.data.success, 'POST /api/contact', 'Message saved to DB');

    // 12. Admin Login
    const loginRes = await request('/api/admin/login', {
      method: 'POST',
      body: {
        username: 'admin',
        password: 'AdminPass123!'
      }
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'POST /api/admin/login (JWT Auth)', 'Token received');
    const token = loginRes.data.token;

    // 13. Admin Me verification
    const adminMe = await request('/api/admin/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(adminMe.status === 200 && adminMe.data.admin.username === 'admin', 'GET /api/admin/me (Protected)');

    // 14. Admin Stats
    const adminStats = await request('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(adminStats.status === 200 && adminStats.data.stats.totalGames >= 12, 'GET /api/admin/stats', `Games: ${adminStats.data.stats.totalGames}, Plays: ${adminStats.data.stats.totalPlays}`);

    // 15. Admin Create Game
    const newGameRes = await request('/api/admin/games', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: 'Quantum Drift Challenge',
        slug: 'quantum-drift-test',
        category: 'Racing',
        description: 'Test drifting physics game on cyber highway.',
        embedUrl: 'playable_games/space-dodge/index.html',
        thumbnailUrl: 'assets/images/thumb-turbo-velocity.svg',
        isFeatured: false,
        isPopular: true,
        isNew: true
      }
    });
    assert(newGameRes.status === 201 && newGameRes.data.success, 'POST /api/admin/games (CRUD Create)');
    const createdId = newGameRes.data.data._id;

    // 16. Admin Toggle Flag
    const toggleRes = await request(`/api/admin/games/${createdId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: { field: 'isFeatured' }
    });
    assert(toggleRes.status === 200 && toggleRes.data.data.isFeatured === true, 'PATCH /api/admin/games/:id/toggle');

    // 17. Admin Delete Game
    const deleteRes = await request(`/api/admin/games/${createdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(deleteRes.status === 200 && deleteRes.data.success, 'DELETE /api/admin/games/:id (CRUD Delete)');

    // 18. Admin Get Messages
    const adminMessages = await request('/api/admin/messages', {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(adminMessages.status === 200 && adminMessages.data.count > 0, 'GET /api/admin/messages');

    // 19. Dynamic XML Sitemap
    const sitemap = await request('/sitemap.xml');
    assert(sitemap.status === 200 && sitemap.data.includes('<urlset') && sitemap.data.includes('space-dodge'), 'GET /sitemap.xml (SEO)', 'Valid XML with dynamic games');

    // 20. Public Pages
    const pages = [
      { path: '/index.html', name: 'Homepage (index.html)' },
      { path: '/game.html?id=space-dodge', name: 'Game Player (game.html)' },
      { path: '/admin.html', name: 'Admin Dashboard (admin.html)' },
      { path: '/about.html', name: 'About Us (about.html)' },
      { path: '/contact.html', name: 'Contact & FAQ (contact.html)' },
      { path: '/privacy.html', name: 'Privacy Policy (privacy.html)' },
      { path: '/terms.html', name: 'Terms of Service (terms.html)' },
      { path: '/404.html', name: 'Custom 404 Page (404.html)' }
    ];

    for (const p of pages) {
      const pageRes = await request(p.path);
      assert(pageRes.status === 200, `Page Route: ${p.name}`);
    }

    // 21. 404 Error handling
    const notFound = await request('/non-existent-route-xyz');
    assert(notFound.status === 404, '404 Error Handler on Unknown URL');

    console.log('\n=============================================');
    console.log(`🏁 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
}

runTests();
