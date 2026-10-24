/**
 * Database Seeder Script (`npm run seed`)
 * Seeds categories, 12+ games, a default admin account, and initial leaderboard scores.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../server/models/Admin');
const Category = require('../server/models/Category');
const Game = require('../server/models/Game');
const Score = require('../server/models/Score');
const ContactMessage = require('../server/models/ContactMessage');

const sampleCategories = [
  { name: 'Puzzle', slug: 'puzzle', icon: '🧩', description: 'Brain teasers, logic grids, and spatial puzzles.' },
  { name: 'Action', slug: 'action', icon: '⚔️', description: 'Fast-paced combat, survival, and adrenaline battles.' },
  { name: 'Racing', slug: 'racing', icon: '🏎️', description: 'High-octane neon speedways, drifting, and time trials.' },
  { name: 'Arcade', slug: 'arcade', icon: '🕹️', description: 'Timeless retro classics, brick breakers, and snakes.' },
  { name: 'Adventure', slug: 'adventure', icon: '🗺️', description: 'Dungeon quests, mysterious islands, and exploration.' },
  { name: 'Brain Training', slug: 'brain-training', icon: '🧠', description: 'Cognitive memory, speed math, and mental agility drills.' }
];

const sampleGames = [
  {
    title: 'Neon Space Dodge',
    slug: 'space-dodge',
    category: 'Action',
    badge: 'FEATURED',
    isFeatured: true,
    isPopular: true,
    isNew: false,
    rating: 4.9,
    ratingCount: 3840,
    playCount: 284120,
    developer: 'PixelNova Studios',
    thumbnailUrl: 'assets/images/thumb-space-dodge.svg',
    bannerUrl: 'assets/images/banner-space-dodge.svg',
    embedUrl: 'playable_games/space-dodge/index.html',
    description: 'Pilot your hyperspace fighter through an asteroid storm! Dodge cosmic debris, collect energy orbs, and blast hostile drones.',
    longDescription: 'Neon Space Dodge thrusts you into the cockpit of an agile prototype starship navigating uncharted deep-space debris fields. With pulsing synthwave beats and reactive neon visual effects, every second tests your reflexes.',
    instructions: 'Desktop: Arrow keys or WASD to navigate ship. Spacebar to shoot photon lasers. Mobile: Touch and drag anywhere to steer.',
    tags: ['Sci-Fi', 'Shooter', 'Survival', 'Arcade', 'Retro'],
    controls: {
      desktop: 'WASD / Arrow Keys to Move, Spacebar to Shoot, P to Pause',
      mobile: 'Touch & Drag to steer, auto-fire active'
    }
  },
  {
    title: 'Cyber Retro Snake',
    slug: 'retro-snake',
    category: 'Arcade',
    badge: 'HOT',
    isFeatured: false,
    isPopular: true,
    isNew: false,
    rating: 4.8,
    ratingCount: 4210,
    playCount: 395000,
    developer: 'ArcadeByte',
    thumbnailUrl: 'assets/images/thumb-retro-snake.svg',
    bannerUrl: 'assets/images/banner-retro-snake.svg',
    embedUrl: 'playable_games/retro-snake/index.html',
    description: 'The immortal classic reborn in vivid cyberpunk neon! Slither across glowing grids, devour data packets, and activate turbo speed boosts.',
    longDescription: 'Cyber Retro Snake modernizes the beloved arcade snake formula with slick glowing grid visuals, particle trails, and reactive sound design.',
    instructions: 'Desktop: Arrow keys or WASD to change direction. Mobile: Swipe in direction or use on-screen D-Pad.',
    tags: ['Classic', 'Arcade', 'Retro', 'Quick Play'],
    controls: {
      desktop: 'Arrow Keys or WASD to turn, Space to toggle Turbo',
      mobile: 'Swipe Gestures / On-screen Directional Touch'
    }
  },
  {
    title: 'Cyber Grid 2048',
    slug: 'cyber-2048',
    category: 'Puzzle',
    badge: 'POPULAR',
    isFeatured: false,
    isPopular: true,
    isNew: false,
    rating: 4.7,
    ratingCount: 2980,
    playCount: 192300,
    developer: 'LogicMatrix Games',
    thumbnailUrl: 'assets/images/thumb-cyber-2048.svg',
    bannerUrl: 'assets/images/banner-cyber-2048.svg',
    embedUrl: 'playable_games/cyber-2048/index.html',
    description: 'Merge identical holographic power cells to reach the legendary 2048 core tile. Smooth, hypnotic, and challenging puzzle strategy.',
    longDescription: 'Cyber Grid 2048 elevates mathematical sliding tile puzzles into an immersive cyberpunk experience. Slide numbers across a 4x4 quantum grid, combining matching numbers into double their value.',
    instructions: 'Desktop: Arrow keys to slide tiles in any direction. Mobile: Swipe left, right, up, or down.',
    tags: ['Puzzle', 'Math', 'Casual', 'Strategy'],
    controls: {
      desktop: 'Arrow Keys to Slide Tiles, U to Undo',
      mobile: 'Touch Swipe in four cardinal directions'
    }
  },
  {
    title: 'Neon Brick Breaker',
    slug: 'neon-breaker',
    category: 'Arcade',
    badge: 'NEW',
    isFeatured: false,
    isPopular: false,
    isNew: true,
    rating: 4.9,
    ratingCount: 1150,
    playCount: 87400,
    developer: 'HyperVolt Labs',
    thumbnailUrl: 'assets/images/thumb-neon-breaker.svg',
    bannerUrl: 'assets/images/banner-neon-breaker.svg',
    embedUrl: 'playable_games/neon-breaker/index.html',
    description: 'Shatter luminous glass bricks with high-velocity kinetic plasma balls, multi-ball drops, laser paddles, and chain reactions.',
    longDescription: 'Neon Brick Breaker brings intense physics-driven paddle action to your browser. Deflect the quantum ball against colorful brick matrices with varied resilience.',
    instructions: 'Desktop: Move paddle with Mouse or Left/Right Arrow keys. Click to launch ball. Mobile: Drag paddle across bottom.',
    tags: ['Arcade', 'Breakout', 'Physics', 'Retro'],
    controls: {
      desktop: 'Mouse cursor / Arrow keys to slide paddle, Click/Space to release ball',
      mobile: 'Touch and drag paddle horizontally'
    }
  },
  {
    title: 'Neuro Match: Brain Training',
    slug: 'brain-memory',
    category: 'Brain Training',
    badge: 'BRAIN',
    isFeatured: false,
    isPopular: true,
    isNew: false,
    rating: 4.8,
    ratingCount: 2140,
    playCount: 165000,
    developer: 'CognitivePlay',
    thumbnailUrl: 'assets/images/thumb-brain-memory.svg',
    bannerUrl: 'assets/images/banner-brain-memory.svg',
    embedUrl: 'playable_games/brain-memory/index.html',
    description: 'Boost working memory and visual pattern recall with card-matching matrix challenges across progressive difficulty levels.',
    longDescription: 'Neuro Match tests your brain’s cognitive speed and visual retention. Flip high-tech encrypted cards to uncover matching symbols and lock them in before time runs out.',
    instructions: 'Click or tap cards to flip them. Match pairs to clear the board in minimum turns and time.',
    tags: ['Memory', 'Brain Training', 'Mind', 'Casual'],
    controls: {
      desktop: 'Mouse click to flip cards',
      mobile: 'Tap card to flip'
    }
  },
  {
    title: 'Turbo Velocity 3D',
    slug: 'turbo-velocity',
    category: 'Racing',
    badge: 'HOT',
    isFeatured: false,
    isPopular: true,
    isNew: false,
    rating: 4.9,
    ratingCount: 5120,
    playCount: 412000,
    developer: 'Velocity Nitro Games',
    thumbnailUrl: 'assets/images/thumb-turbo-velocity.svg',
    bannerUrl: 'assets/images/banner-turbo-velocity.svg',
    embedUrl: 'playable_games/space-dodge/index.html?mode=racing',
    description: 'High-octane synthwave highway racer! Weave through rush-hour traffic, draft behind hypercars, and fire up nitro boosters.',
    longDescription: 'Take the wheel of an illegal nocturnal street racer in a neon-drenched metropolis. Drift tight hairpin turns, collect nitro cans, and outrun metropolitan interceptors.',
    instructions: 'Desktop: WASD or Arrow Keys to steer and accelerate. Shift key for Nitro Boost.',
    tags: ['Racing', 'Cars', 'Speed', '3D', 'Nitro'],
    controls: {
      desktop: 'W/Up: Gas, S/Down: Brake, A/D: Steer, Shift: Nitro',
      mobile: 'On-screen pedal and steering wheel buttons'
    }
  },
  {
    title: 'Mystic Relic Quest',
    slug: 'mystic-dungeon',
    category: 'Adventure',
    badge: 'NEW',
    isFeatured: false,
    isPopular: false,
    isNew: true,
    rating: 4.6,
    ratingCount: 980,
    playCount: 74500,
    developer: 'MythicForge',
    thumbnailUrl: 'assets/images/thumb-mystic-dungeon.svg',
    bannerUrl: 'assets/images/banner-mystic-dungeon.svg',
    embedUrl: 'playable_games/space-dodge/index.html?mode=quest',
    description: 'Embark on an epic dungeon crawl! Solve ancient rune puzzles, disarm treacherous spike traps, and vanquish shadow golems.',
    longDescription: 'Mystic Relic Quest immerses players into labyrinthine underground ruins teeming with forgotten lore and lost treasures.',
    instructions: 'Desktop: Arrow keys to explore, Space to interact/swing weapon.',
    tags: ['Adventure', 'RPG', 'Dungeon', 'Fantasy'],
    controls: {
      desktop: 'Arrow Keys to move, Space to strike/interact, I for Inventory',
      mobile: 'Virtual joystick and action buttons'
    }
  },
  {
    title: 'Gravity Warp Lab',
    slug: 'quantum-gravity',
    category: 'Puzzle',
    badge: 'POPULAR',
    isFeatured: false,
    isPopular: true,
    isNew: false,
    rating: 4.7,
    ratingCount: 1890,
    playCount: 134000,
    developer: 'Graviton Studios',
    thumbnailUrl: 'assets/images/thumb-quantum-gravity.svg',
    bannerUrl: 'assets/images/banner-quantum-gravity.svg',
    embedUrl: 'playable_games/cyber-2048/index.html?mode=gravity',
    description: 'Flip gravitational axes to guide quantum matter spheres through laser corridors, magnetic portals, and temporal anomalies.',
    longDescription: 'Defy physics in a top-secret orbital research station where gravity is malleable. Manipulate the 360-degree orientation of the laboratory.',
    instructions: 'Desktop: Arrow keys to shift gravity orientation.',
    tags: ['Physics', 'Puzzle', 'Logic', 'Sci-Fi'],
    controls: {
      desktop: 'Arrow keys to shift gravity, R to reset chamber',
      mobile: 'Swipe up/down/left/right'
    }
  },
  {
    title: 'Shadow Blade: Cyber Run',
    slug: 'shadow-ninja',
    category: 'Action',
    badge: 'HOT',
    isFeatured: false,
    isPopular: true,
    isNew: false,
    rating: 4.9,
    ratingCount: 4490,
    playCount: 352000,
    developer: 'Shinobi Soft',
    thumbnailUrl: 'assets/images/thumb-shadow-ninja.svg',
    bannerUrl: 'assets/images/banner-shadow-ninja.svg',
    embedUrl: 'playable_games/space-dodge/index.html?mode=ninja',
    description: 'Sprint rooftop to rooftop across Neo-Tokyo! Wall-run, deflect laser shurikens, and unleash devastating stealth katana strikes.',
    longDescription: 'A lightning-paced endless runner meets precision hack-and-slash action. As an augmented cyber ninja, dash through neon skyscape corridors.',
    instructions: 'Desktop: Spacebar to jump/double jump, Click or J key to strike.',
    tags: ['Action', 'Runner', 'Ninja', 'Fast-Paced'],
    controls: {
      desktop: 'Space / Up to Jump, J / Left-Click to Katana Slash',
      mobile: 'Split-screen touch buttons'
    }
  },
  {
    title: 'Pixel Nitro GP',
    slug: 'pixel-kart',
    category: 'Racing',
    badge: 'NEW',
    isFeatured: false,
    isPopular: false,
    isNew: true,
    rating: 4.8,
    ratingCount: 1640,
    playCount: 118000,
    developer: 'RetroSpeed',
    thumbnailUrl: 'assets/images/thumb-pixel-kart.svg',
    bannerUrl: 'assets/images/banner-pixel-kart.svg',
    embedUrl: 'playable_games/retro-snake/index.html?mode=kart',
    description: 'Fun arcade kart racing with wild power-ups, homing rockets, oil slicks, and split-second turbo drift boosts across 8 circuits.',
    longDescription: 'Compete against zany opponents across volcano islands, ice glaciers, and neon city courses. Collect mystery item boxes to unleash lightning strikes.',
    instructions: 'Desktop: Arrow keys to steer, Space to launch item, Shift to drift.',
    tags: ['Racing', 'Kart', 'Multiplayer', 'Arcade'],
    controls: {
      desktop: 'Arrow Keys / WASD, Space to use power-up, Shift to drift',
      mobile: 'Tilt steering or touch buttons'
    }
  },
  {
    title: 'Speed Math Blitz',
    slug: 'math-blaster',
    category: 'Brain Training',
    badge: 'BRAIN',
    isFeatured: false,
    isPopular: false,
    isNew: true,
    rating: 4.7,
    ratingCount: 820,
    playCount: 62000,
    developer: 'EduGame Lab',
    thumbnailUrl: 'assets/images/thumb-math-blaster.svg',
    bannerUrl: 'assets/images/banner-math-blaster.svg',
    embedUrl: 'playable_games/brain-memory/index.html?mode=math',
    description: 'Lightning-speed mental arithmetic drills! Solve rapid calculations before time expires to trigger score multipliers and brain ranks.',
    longDescription: 'Sharpen your mental reflexes with adaptive mathematical arithmetic challenges. Equations appear at increasing tempo testing addition and multiplication.',
    instructions: 'Select the correct answer from 4 multiple choice options as fast as possible.',
    tags: ['Math', 'Brain Training', 'Quiz', 'Educational'],
    controls: {
      desktop: 'Number keys 1-4 or Mouse Click to select answer',
      mobile: 'Tap choice card'
    }
  },
  {
    title: 'Isle of Wonders: Adventure',
    slug: 'island-odyssey',
    category: 'Adventure',
    badge: 'POPULAR',
    isFeatured: false,
    isPopular: true,
    isNew: false,
    rating: 4.8,
    ratingCount: 3120,
    playCount: 224000,
    developer: 'SunkenTreasure Games',
    thumbnailUrl: 'assets/images/thumb-island-odyssey.svg',
    bannerUrl: 'assets/images/banner-island-odyssey.svg',
    embedUrl: 'playable_games/space-dodge/index.html?mode=island',
    description: 'Explore an uncharted tropical archipelago brimming with secret caves, mysterious pirate treasure maps, and native wildlife.',
    longDescription: 'A narrative-rich point-and-click exploration adventure across lush tropical islands. Gather ancient totems and uncover the sunken fortress.',
    instructions: 'Desktop: Point and click to explore, interact with items in scene.',
    tags: ['Adventure', 'Story', 'Exploration', 'Puzzle'],
    controls: {
      desktop: 'Left-click to interact, mouse hover for clues',
      mobile: 'Tap interactables'
    }
  }
];

const seedDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gameportal';

  try {
    console.log(`[Seed] Connecting to MongoDB at: ${uri}`);
    await mongoose.connect(uri);
    console.log('[Seed] Connected.');

    // 1. Clear existing collections
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      Admin.deleteMany({}),
      Category.deleteMany({}),
      Game.deleteMany({}),
      Score.deleteMany({}),
      ContactMessage.deleteMany({})
    ]);

    // 2. Create Default Admin User
    const adminUser = process.env.DEFAULT_ADMIN_USER || 'admin';
    const adminPass = process.env.DEFAULT_ADMIN_PASS || 'AdminPass123!';
    const passwordHash = await Admin.hashPassword(adminPass);

    const createdAdmin = await Admin.create({
      username: adminUser.toLowerCase(),
      passwordHash
    });
    console.log(`[Seed] Admin user created: ${createdAdmin.username} / ${adminPass}`);

    // 3. Create Categories
    const createdCategories = await Category.insertMany(sampleCategories);
    console.log(`[Seed] Seeded ${createdCategories.length} categories.`);

    // 4. Create Games
    const createdGames = await Game.insertMany(sampleGames);
    console.log(`[Seed] Seeded ${createdGames.length} games.`);

    // 5. Create Sample Leaderboard Scores
    const spaceDodge = createdGames.find(g => g.slug === 'space-dodge');
    const retroSnake = createdGames.find(g => g.slug === 'retro-snake');
    const cyber2048 = createdGames.find(g => g.slug === 'cyber-2048');

    const sampleScores = [
      { playerName: 'ValkyrieX', score: 14250, gameId: spaceDodge._id, gameTitle: spaceDodge.title },
      { playerName: 'CyberGlitch', score: 11900, gameId: spaceDodge._id, gameTitle: spaceDodge.title },
      { playerName: 'NovaSniper', score: 9840, gameId: spaceDodge._id, gameTitle: spaceDodge.title },
      { playerName: 'RetroKing', score: 8700, gameId: retroSnake._id, gameTitle: retroSnake.title },
      { playerName: 'NeonViper', score: 7200, gameId: retroSnake._id, gameTitle: retroSnake.title },
      { playerName: 'QuantumMaster', score: 16384, gameId: cyber2048._id, gameTitle: cyber2048.title },
      { playerName: 'TileChampion', score: 12240, gameId: cyber2048._id, gameTitle: cyber2048.title }
    ];

    await Score.insertMany(sampleScores);
    console.log(`[Seed] Seeded ${sampleScores.length} leaderboard high scores.`);

    // 6. Create Sample Contact Message
    await ContactMessage.create({
      name: 'Elena Rostova',
      email: 'elena@indiegames.example.com',
      subject: 'DeveloperSubmission',
      message: 'Hello Nexus Arcade team! I developed a new HTML5 cyberpunk puzzle game called Neon Matrix. Would love to feature it on your portal!'
    });
    console.log('[Seed] Seeded sample contact message.');

    console.log('\n=============================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=============================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();
