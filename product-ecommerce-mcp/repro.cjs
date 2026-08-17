const Database = require('better-sqlite3');
try {
  console.log("Attempting to open database...");
  const db = new Database(':memory:');
  console.log("Database opened successfully.");
  db.close();
} catch (e) {
  console.error("Failed:", e);
}
