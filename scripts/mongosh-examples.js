/**
 * Mongosh Database Query Reference & Command Cheat Sheet
 * 
 * Usage:
 *   1. Connect to local database:
 *      mongosh mongodb://127.0.0.1:27017/gameportal
 * 
 *   2. Connect to MongoDB Atlas (replace connection string):
 *      mongosh "mongodb+srv://cluster0.abcde.mongodb.net/gameportal" --username <username>
 * 
 *   3. Execute this entire script non-interactively:
 *      mongosh mongodb://127.0.0.1:27017/gameportal scripts/mongosh-examples.js
 */

console.log("\n=======================================================");
console.log("🎮 NEXUS ARCADE - MONGOSH QUERY CHEAT SHEET & EXAMPLES");
console.log("=======================================================\n");

// 1. Switch to and inspect database
// use gameportal;
console.log("1. Current Database:", db.getName());
console.log("   Collections:", db.getCollectionNames());

// 2. Count documents in each collection
console.log("\n2. DOCUMENT COUNTS:");
console.log("   Total Games:            ", db.games.countDocuments());
console.log("   Total Categories:       ", db.categories.countDocuments());
console.log("   Total Scores:           ", db.scores.countDocuments());
console.log("   Total Contact Messages: ", db.contactmessages.countDocuments());
console.log("   Total Admins:           ", db.admins.countDocuments());

// 3. Show all games (summary view: title, category, plays)
console.log("\n3. ALL GAMES OVERVIEW:");
db.games.find({}, { title: 1, category: 1, playCount: 1, isFeatured: 1, _id: 0 }).forEach(g => {
  console.log(`   • [${g.category}] ${g.title} | Plays: ${g.playCount} | Featured: ${g.isFeatured}`);
});

// 4. Find games by Category (e.g. 'Puzzle' or 'Action')
console.log("\n4. FIND GAMES BY CATEGORY ('Puzzle'):");
db.games.find({ category: "Puzzle" }, { title: 1, rating: 1, slug: 1 }).forEach(p => {
  console.log(`   - ${p.title} (Slug: ${p.slug}) | ★ ${p.rating}`);
});

// 5. Update isFeatured flag for a game
console.log("\n5. UPDATE isFeatured FLAG:");
const updateResult = db.games.updateOne(
  { slug: "cyber-2048" },
  { $set: { isFeatured: true } }
);
console.log("   Update Result for 'cyber-2048':", updateResult);

// 6. View Top 5 Leaderboard Scores
console.log("\n6. TOP LEADERBOARD SCORES:");
let scoreRank = 1;
db.scores.find({}).sort({ score: -1 }).limit(5).forEach((s) => {
  console.log(`   Rank #${scoreRank++}: ${s.playerName} - ${s.score.toLocaleString()} pts (${s.gameTitle})`);
});

// 7. View Contact Messages
console.log("\n7. RECENT CONTACT MESSAGES:");
db.contactmessages.find({}).sort({ createdAt: -1 }).limit(3).forEach(m => {
  console.log(`   From: ${m.name} <${m.email}> | Subject: ${m.subject}`);
  console.log(`   Message: "${m.message.substring(0, 70)}..."`);
});

// 8. Example: Delete a game and its scores (Demonstration template)
/*
// To delete a game:
const gameToDelete = db.games.findOne({ slug: "sample-game-to-delete" });
if (gameToDelete) {
  db.scores.deleteMany({ gameId: gameToDelete._id });
  db.games.deleteOne({ _id: gameToDelete._id });
  console.log("Game and scores successfully removed.");
}
*/

console.log("\n=======================================================");
console.log("✅ Mongosh queries executed successfully!");
console.log("=======================================================\n");
