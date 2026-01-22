const { redisClient } = require("../config/redis");

// Default expiration time: 12 hours
const DEFAULT_TTL = 60 * 60 * 12; // 43200 seconds

/**
 * Save data by key
 * @param {string} key
 * @param {Object} data
 * @param {number|null} ttl - time to live in seconds (optional)
 */
async function addData(key, data, ttl = DEFAULT_TTL) {
  const value = JSON.stringify(data);

  if (ttl) {
    await redisClient.set(key, value, "EX", ttl); // set with expiration
  } else {
    await redisClient.set(key, value); // set without expiration
  }

  return { success: true, message: `Data added successfully with TTL: ${ttl}s` };
}

/**
 * Get data by key
 * @param {string} key
 */
async function getData(key) {
  const value = await redisClient.get(key);
  console.log(`fetch data from redis key: `, key);
  return value ? JSON.parse(value) : null;
}

/**
 * Update data by key (overwrite, keeps default TTL unless specified)
 * @param {string} key
 * @param {Object} data
 * @param {number|null} ttl - optional TTL override
 */
async function updateData(key, data, ttl = DEFAULT_TTL) {
  const exists = await redisClient.exists(key);

  if (!exists) {
    return { success: false, message: "Key not found" };
  }

  await redisClient.set(key, JSON.stringify(data), "EX", ttl);
  return { success: true, message: "Data updated successfully" };
}

/**
 * Delete data by key
 * @param {string} key
 */
async function deleteData(key) {
  const result = await redisClient.del(key);

  if (result === 0) {
    return { success: false, message: "Key not found" };
  }

  return { success: true, message: "Data deleted successfully" };
}

/**
 * Delete all keys matching a pattern (e.g., "products:detail:*")
 * Uses SCAN for safe iteration in production
 * @param {string} pattern - Redis key pattern with wildcards
 */
async function deletePattern(pattern) {
  try {
    let cursor = '0';
    let deletedCount = 0;

    do {
      // SCAN is safer than KEYS in production (non-blocking)
      const [newCursor, keys] = await redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100 // Process 100 keys at a time
      );

      cursor = newCursor;

      if (keys.length > 0) {
        const result = await redisClient.del(...keys);
        deletedCount += result;
      }
    } while (cursor !== '0');

    console.log(`✅ Deleted ${deletedCount} keys matching pattern: ${pattern}`);
    return { success: true, message: `Deleted ${deletedCount} keys matching pattern: ${pattern}`, deletedCount };
  } catch (error) {
    console.error(`❌ Error deleting pattern ${pattern}:`, error);
    return { success: false, message: `Error deleting pattern: ${error.message}` };
  }
}

/**
 * Get all keys with their data
 */
async function getAllKeysWithData() {
  const keys = await redisClient.keys("*");

  if (keys.length === 0) {
    return { success: true, message: "No keys found", data: [] };
  }
  const pipeline = redisClient.multi();
  keys.forEach((key) => pipeline.get(key));
  const values = await pipeline.exec();

  const data = keys.map((key, index) => {
    const rawValue = values[index][1]; // Redis stores as string
    let parsedValue = null;

    try {
      parsedValue = rawValue ? JSON.parse(rawValue) : null;
    } catch (err) {
      console.error(`❌ Failed to parse JSON for key "${key}", value:`, rawValue);
      parsedValue = rawValue; // fallback to raw string
    }

    return {
      key,
      value: parsedValue,
    };
  });
  return { success: true, data };
}

/**
 * Clear all keys in Redis
*/
async function clearAllKeys() {
  await redisClient.flushall();
  return { success: true, message: "All keys cleared from Redis" };
}

module.exports = {
  addData,
  getData,
  updateData,
  deleteData,
  deletePattern, // 🔹 Added this
  getAllKeysWithData,
  clearAllKeys,
};