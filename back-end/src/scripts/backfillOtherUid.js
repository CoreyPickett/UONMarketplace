// backfillOtherUid.js
import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017");

async function run() {
  try {
    await client.connect();
    const db = client.db("uon-marketplace-db");

    const result = await db.collection("messages").updateMany(
      { otherUid: { $exists: false } },
      { $set: { otherUid: null } }
    );

    console.log(`Updated ${result.modifiedCount} messages`);
  } catch (err) {
    console.error("Backfill failed:", err);
  } finally {
    await client.close();
  }
}

run();