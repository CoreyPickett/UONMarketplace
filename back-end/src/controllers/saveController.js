// controllers/saveController.js
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';

// List my saved items (full item docs). Add ?idsOnly=1 to return only IDs.
export async function getSavedItems(req, res) {
  try {
    const uid = req.user.uid;
    const idsOnly = String(req.query.idsOnly || "").toLowerCase() === "1";

    const db = await getDb();
    const doc = await db.collection('saves').findOne({ uid });
    const itemIds = (doc?.itemIds || []).map((id) => new ObjectId(id));

    if (idsOnly) {
      return res.json((doc?.itemIds || []).map(String));
    }

    const items = itemIds.length
      ? await db.collection('items').find({
          _id: { $in: itemIds },
          status: { $ne: "sold" } // Exclude sold items
        }).toArray()
      : [];

    res.json(items);
  } catch (e) {
    res.status(500).json({ error: "Failed to load saved items" });
  }
}

// Save an item
export async function saveItem(req, res) {
  const { id } = req.params;
  const uid = req.user.uid;
  console.log("Save request from:", req.user?.uid);
  console.log("Saving item ID:", req.params.id);

  try {
    const db = await getDb();

    const item = await db.collection('items').findOne({ _id: new ObjectId(id) });
    if (!item || item.status === "sold") {
      return res.status(400).json({ error: "Cannot save a sold item." });
    }

    // upsert user saves doc
    await db.collection('saves').updateOne(
      { uid },
      { $addToSet: { itemIds: id } },
      { upsert: true }
    );

    // update item saves (count + prevent dup)
    await db.collection('items').updateOne(
      { _id: new ObjectId(id) },
      {
        $addToSet: { saveIds: uid },
        $inc: { saves: 1 },
      }
    );

    res.status(204).send();
  } catch (e) {
    console.error("Save failed:", e);
    res.status(500).json({ error: "Failed to save item" }); // ✅ Use 500 for server error
  }
}

// Unsave an item
export async function unsaveItem(req, res) {
  const { id } = req.params;
  const uid = req.user.uid;

  try {
    const db = await getDb();

    await db.collection('saves').updateOne(
      { uid },
      { $pull: { itemIds: id } }
    );

    // decrement saves but not below zero
    const item = await db.collection('items').findOne({ _id: new ObjectId(id) });
    const next = Math.max(0, (item?.saves || 0) - 1);

    await db.collection('items').updateOne(
      { _id: new ObjectId(id) },
      { $pull: { saveIds: uid }, $set: { saves: next } }
    );

    res.status(204).send();
  } catch (e) {
    res.status(400).json({ error: "Failed to unsave item" });
  }
}