# Nexus Arcade - Full-Stack Online Gaming Portal

A modern, responsive online gaming portal built with a **Node.js + Express** backend, **MongoDB with Mongoose** database, and a bright, vibrant **HTML5, CSS3, and vanilla JavaScript** frontend (zero paid dependencies).

---

## 🚀 Features

* **Real REST API Backend**:
  * `GET /api/games`: Filter by category, live search query, sort by popularity/rating/newest.
  * `GET /api/games/:id`: Fetch game by Mongo ID or Slug; automatically increments `playCount` in MongoDB.
  * `POST /api/games/:id/play`: Explicit play session counter increment.
  * `GET /api/categories`: Dynamic list of genres with real-time game counts.
  * `POST /api/scores`: Save player high scores with validation.
  * `GET /api/scores/:gameId`: Retrieve top 10 scores for a game.
  * `GET /api/scores`: Retrieve top scores across the entire platform.
  * `POST /api/contact`: Contact form submissions saved to MongoDB with rate limiting.
  * `GET /sitemap.xml`: Dynamic XML sitemap querying live games from database.
* **Protected Admin Dashboard (`admin.html`)**:
  * Secure login with `bcryptjs` password hashing and JWT authorization.
  * Real-time metrics: Total games, total plays, total scores, unread messages.
  * Full Game CRUD: Add, edit, delete, and organize games.
  * Image thumbnail uploads via `multer` into `public/uploads/`.
  * Instant toggle switches for `isFeatured`, `isPopular`, and `isNew`.
  * Category management and contact message review.
* **Modern Public Gaming Portal**:
  * Large featured hero banner with prominent "Play Now" button.
  * Category filter pills with dynamic count badges.
  * "Popular Games" and "New Games" responsive thumbnail grids.
  * 5 IAB monetization ad placeholders (728x90, 300x250, 300x600, 970x90).
  * VIP Membership showcase and high-score leaderboards.
  * 5 built-in playable HTML5 mini-games with synthesizer audio.
  * Fully responsive on desktop, tablet, and mobile (hamburger navigation drawer).
* **Security & Performance**:
  * `helmet` HTTP headers, `compression` (Gzip), static asset caching.
  * `express-rate-limit` on login and contact submissions.
  * `express-mongo-sanitize` preventing NoSQL query injection.
  * Input validation via `express-validator`.

---

## 📁 Project Directory Structure

```
c:/Users/SUMA/Desktop/lab final/
├── package.json               # Node.js dependencies and scripts
├── .env                       # Environment variables (local config)
├── .env.example               # Environment variables template
├── PROPOSAL.md                # Cost analysis: WordPress vs. Node.js + MongoDB
├── README.md                  # Comprehensive setup & deployment guide
├── server/
│   ├── server.js              # Server entry point & graceful shutdown
│   ├── app.js                 # Express app configuration & middleware
│   ├── config/
│   │   └── db.js              # Mongoose database connection
│   ├── models/
│   │   ├── Game.js            # Game schema (slug, category, embedUrl, plays)
│   │   ├── Category.js        # Category schema (name, slug, icon)
│   │   ├── Score.js           # Score schema (playerName, score, gameId)
│   │   ├── ContactMessage.js  # Contact inquiry schema (name, email, message)
│   │   └── Admin.js           # Admin schema (username, bcrypt passwordHash)
│   ├── routes/
│   │   ├── games.js           # Games public API endpoints
│   │   ├── categories.js      # Categories API endpoints
│   │   ├── scores.js          # Leaderboard scores API
│   │   ├── contact.js         # Contact message API
│   │   ├── admin.js           # Admin auth & dashboard CRUD
│   │   └── sitemap.js         # Dynamic XML sitemap generator
│   └── middleware/
│       ├── auth.js            # JWT bearer token verifier
│       ├── rateLimiter.js     # Rate limiting for auth & contact
│       ├── upload.js          # Multer thumbnail file uploader
│       ├── validation.js      # express-validator rules
│       └── errorHandler.js    # Centralized JSON error & 404 handler
├── public/
│   ├── index.html             # Homepage
│   ├── game.html              # Game player template page
│   ├── admin.html             # Protected Admin Dashboard
│   ├── about.html             # About Us page
│   ├── contact.html           # Contact Us & FAQ page
│   ├── privacy.html           # Privacy Policy page
│   ├── terms.html             # Terms of Service page
│   ├── 404.html               # Custom 404 error page
│   ├── robots.txt             # Search crawler directives
│   ├── css/                   # Stylesheets (style.css, game.css, admin.css)
│   ├── js/                    # Client controllers (main.js, game-player.js, admin.js)
│   ├── assets/images/         # Crisp SVG thumbnails and banners
│   ├── uploads/               # Uploaded game thumbnails
│   └── playable_games/        # 5 HTML5 Canvas playable mini-games
└── scripts/
    ├── seed.js                # Database seeder (npm run seed)
    └── mongosh-examples.js    # Mongosh interactive query cheat sheet
```

---

## 🛠️ Getting Started (Local Setup)

### 1. Prerequisites
* **Node.js**: v18.0.0 or later (`node -v`)
* **MongoDB**: Either local MongoDB Community Server running on `mongodb://127.0.0.1:27017` OR a free MongoDB Atlas cluster URI.

### 2. Installation
Open your terminal in the project directory and install dependencies:
```bash
npm install
```

### 3. Environment Configuration
Create or edit `.env` in the root directory (copied from `.env.example`):
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/gameportal
JWT_SECRET=your_super_secret_jwt_key_here
DEFAULT_ADMIN_USER=admin
DEFAULT_ADMIN_PASS=AdminPass123!
SITE_URL=http://localhost:3000
```

### 4. Database Seeding
Populate MongoDB with 6 categories, 12 sample games, initial scores, sample message, and the default admin user:
```bash
npm run seed
```

### 5. Launch Application
Start the server:
```bash
npm start
```
The application will launch on:
* **Public Gaming Portal**: [http://localhost:3000](http://localhost:3000)
* **Admin Control Center**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
* **Dynamic XML Sitemap**: [http://localhost:3000/sitemap.xml](http://localhost:3000/sitemap.xml)

---

## 🔑 Default Administrator Credentials

* **Username**: `admin`
* **Password**: `AdminPass123!`
*(Configurable via `DEFAULT_ADMIN_USER` and `DEFAULT_ADMIN_PASS` in `.env`)*

---

## 📊 Using Mongosh for Database Queries

You can query and inspect the database directly using `mongosh`:

```bash
# Connect to local database
mongosh mongodb://127.0.0.1:27017/gameportal

# Run the provided query examples script
mongosh mongodb://127.0.0.1:27017/gameportal scripts/mongosh-examples.js
```

### Common Mongosh Commands:
```javascript
// Show all games
db.games.find({}, { title: 1, category: 1, playCount: 1 });

// Find games in a specific category
db.games.find({ category: "Action" });

// Count total plays across all games
db.games.aggregate([{ $group: { _id: null, total: { $sum: "$playCount" } } }]);

// Toggle isFeatured for a game
db.games.updateOne({ slug: "retro-snake" }, { $set: { isFeatured: true } });

// View top 5 scores
db.scores.find().sort({ score: -1 }).limit(5);

// View contact inquiries
db.contactmessages.find();
```

---

## 🌐 Deploying to Production (Render / Railway + MongoDB Atlas)

### Step 1: Set up MongoDB Atlas (Free Forever)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register for a free account.
2. Create an **M0 Free Shared Cluster**.
3. Under **Database Access**, create a user (e.g., `dbadmin` + secure password).
4. Under **Network Access**, add IP `0.0.0.0/0` (allow access from anywhere).
5. Click **Connect** > **Drivers** > copy connection string:
   ```
   mongodb+srv://dbadmin:<password>@cluster0.abcde.mongodb.net/gameportal?retryWrites=true&w=majority
   ```

### Step 2: Deploy to Render or Railway
1. Push this repository to GitHub or GitLab.
2. In [Render.com](https://render.com) or [Railway.app](https://railway.app), create a new **Web Service** connected to your repository.
3. Configure build & start commands:
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
4. Set Environment Variables in your dashboard:
   * `NODE_ENV`: `production`
   * `MONGODB_URI`: *Your MongoDB Atlas connection string*
   * `JWT_SECRET`: *A long secure random string*
   * `SITE_URL`: *Your production domain or Render URL*
5. Run the seed script once via Render shell or remote terminal:
   ```bash
   npm run seed
   ```
6. Your live gaming portal is fully deployed with automated SSL!
