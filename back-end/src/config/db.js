// config/db.js
import { MongoClient, ServerApiVersion } from 'mongodb';

let db;

export async function connectToDB() {
  const uri = !process.env.MONGODB_USERNAME
    ? 'mongodb://127.0.0.1:27017'
    : `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.gc0c2sd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  db = client.db('uon-marketplace-db');

  if (!db) {
    throw new Error('Database not connected');
  }

  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
}
