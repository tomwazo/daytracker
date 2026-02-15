/**
 * Script to generate and upload dummy data to Cosmos DB
 * Usage: node scripts/generate-dummy-data.js
 */

const { CosmosClient } = require("@azure/cosmos");
const fs = require("fs");
const path = require("path");

// Try to load from local.settings.json if env vars not set
let endpoint = process.env.COSMOS_ENDPOINT;
let key = process.env.COSMOS_KEY;
let databaseId = process.env.COSMOS_DATABASE || "daytracker";

if (!endpoint || !key) {
  console.log("Loading credentials from api/local.settings.json...");
  try {
    const localSettingsPath = path.join(__dirname, "..", "api", "local.settings.json");
    const localSettings = JSON.parse(fs.readFileSync(localSettingsPath, "utf8"));

    endpoint = localSettings.Values.COSMOS_ENDPOINT;
    key = localSettings.Values.COSMOS_KEY;
    databaseId = localSettings.Values.COSMOS_DATABASE || "daytracker";

    if (!endpoint || !key || endpoint.includes("your-account") || key.includes("your-cosmos-key")) {
      console.error("\n❌ Error: Please update api/local.settings.json with your real Cosmos DB credentials");
      console.error("   Get them from Azure Portal → Your Cosmos DB → Keys\n");
      process.exit(1);
    }

    console.log("✓ Credentials loaded successfully\n");
  } catch (error) {
    console.error("\n❌ Error: Could not load credentials from api/local.settings.json");
    console.error("   Make sure the file exists and contains valid JSON\n");
    process.exit(1);
  }
}

const containerId = "entries";

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);
const container = database.container(containerId);

// Profiles
const profiles = ["daddy", "mommy", "tabitha", "imogen"];

// Realistic word vocabulary
const words = [
  // Positive emotions
  "happy", "joyful", "grateful", "peaceful", "content", "excited", "hopeful",
  "proud", "loved", "energized", "relaxed", "calm", "blessed", "lucky",

  // Productive/Active
  "productive", "busy", "active", "focused", "motivated", "accomplished",
  "creative", "inspired", "determined", "efficient",

  // Social/Connected
  "connected", "social", "supported", "loved", "caring", "friendly",

  // Descriptive
  "sunny", "rainy", "cloudy", "warm", "cold", "bright", "cozy",

  // Challenging
  "tired", "stressed", "overwhelmed", "anxious", "worried", "frustrated",
  "difficult", "challenging", "busy", "hectic",

  // Neutral
  "ordinary", "routine", "normal", "quiet", "steady", "balanced",

  // Activities
  "exercise", "reading", "cooking", "working", "playing", "learning",
  "laughing", "resting", "thinking", "planning",

  // Family-related
  "family", "together", "fun", "games", "stories", "adventures",
];

// Generate a random score with some personality patterns
function generateScore(profileId, dayOfWeek) {
  let baseScore = 6; // Start at 6/10

  // Personality patterns
  if (profileId === "daddy") {
    baseScore = 7; // Generally optimistic
    if (dayOfWeek === 0 || dayOfWeek === 6) baseScore += 1; // Happier on weekends
  } else if (profileId === "mommy") {
    baseScore = 6.5; // Balanced
    if (dayOfWeek === 3) baseScore += 0.5; // Wednesday boost (mid-week milestone)
  } else if (profileId === "tabitha") {
    baseScore = 7.5; // Usually cheerful
    if (dayOfWeek === 5) baseScore += 1; // Excited for Friday
  } else if (profileId === "imogen") {
    baseScore = 8; // Very happy baby
  }

  // Add some randomness (-2 to +2)
  const randomness = Math.random() * 4 - 2;
  const score = Math.round(baseScore + randomness);

  // Clamp between 1 and 10
  return Math.max(1, Math.min(10, score));
}

// Pick 3 random unique words
function generateWords(score) {
  // Adjust word pool based on score
  let wordPool = [...words];

  if (score >= 8) {
    // Bias towards positive words for high scores
    wordPool = wordPool.filter(w =>
      ["happy", "joyful", "grateful", "peaceful", "content", "excited",
       "hopeful", "proud", "loved", "energized", "sunny", "blessed"].includes(w) ||
      Math.random() > 0.3
    );
  } else if (score <= 4) {
    // Bias towards challenging words for low scores
    wordPool = wordPool.filter(w =>
      ["tired", "stressed", "overwhelmed", "anxious", "worried", "frustrated",
       "difficult", "challenging", "rainy", "cloudy"].includes(w) ||
      Math.random() > 0.3
    );
  }

  const selectedWords = [];
  while (selectedWords.length < 3) {
    const word = wordPool[Math.floor(Math.random() * wordPool.length)];
    if (!selectedWords.includes(word)) {
      selectedWords.push(word);
    }
  }

  return selectedWords;
}

// Generate entries for the last 90 days
function generateDummyData() {
  const entries = [];
  const today = new Date();

  for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayOfWeek = date.getDay();

    // Each profile gets an entry (with some random gaps)
    for (const profileId of profiles) {
      // 85% chance of having an entry (simulates some missed days)
      if (Math.random() > 0.15) {
        const score = generateScore(profileId, dayOfWeek);
        const entryWords = generateWords(score);

        const entry = {
          id: `${profileId}-${dateStr}`,
          profileId,
          date: dateStr,
          score,
          words: entryWords,
          createdAt: new Date(date.getTime() + Math.random() * 86400000).toISOString(), // Random time during the day
        };

        entries.push(entry);
      }
    }
  }

  return entries;
}

// Upload entries to Cosmos DB
async function uploadEntries(entries) {
  console.log(`Uploading ${entries.length} entries to Cosmos DB...`);

  let successCount = 0;
  let errorCount = 0;

  for (const entry of entries) {
    try {
      await container.items.upsert(entry);
      successCount++;
      if (successCount % 50 === 0) {
        console.log(`  Uploaded ${successCount}/${entries.length}...`);
      }
    } catch (error) {
      console.error(`Error uploading entry ${entry.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n✅ Upload complete!`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Total entries: ${entries.length}`);
}

// Main function
async function main() {
  console.log("🎲 Generating dummy data for the last 90 days...\n");

  const entries = generateDummyData();

  console.log(`Generated ${entries.length} entries for ${profiles.length} profiles\n`);

  // Show sample data
  console.log("Sample entry:");
  console.log(JSON.stringify(entries[0], null, 2));
  console.log();

  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question("Upload to Cosmos DB? (yes/no): ", async (answer) => {
    readline.close();

    if (answer.toLowerCase() === "yes" || answer.toLowerCase() === "y") {
      await uploadEntries(entries);
    } else {
      console.log("Upload cancelled.");
    }
  });
}

main().catch(console.error);
