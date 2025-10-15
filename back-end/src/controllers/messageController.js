import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';

export async function startConversation(req, res) {
  const me = req.user.uid;
  const { listingId, sellerUid, listingTitle } = req.body;
  if (!listingId || !sellerUid) return res.status(400).json({ error: "Need listingId and sellerUid" });

  const participants = [me, sellerUid].sort();
  const now = new Date().toISOString();

  let sellerName = "User";
  let sellerAvatar = "/images/default-avatar.png";

  try {
    const db = await getDb();
    const u = await db.collection('users').findOne({ uid: sellerUid });
    const p = await db.collection('profile').findOne({ uid: sellerUid });
    if (u?.username) sellerName = u.username;
    if (p?.profilePhotoUrl) sellerAvatar = p.profilePhotoUrl;

    const baseDoc = {
      listingId,
      listingTitle: listingTitle || "",
      otherUserName: sellerName,
      avatar: sellerAvatar,
      participants,
      messages: [],
      createdAt: now,
      lastMessage: "",
      lastMessageAt: null,
      unread: { [me]: 0, [sellerUid]: 1 },
    };

    await db.collection('messages').updateOne(
      { listingId, participants },
      { $setOnInsert: baseDoc },
      { upsert: true }
    );

    const thread = await db.collection('messages').findOne({ listingId, participants });
    res.json({ ...thread, _id: String(thread._id) });
  } catch {
    res.status(500).json({ error: "Failed to start conversation" });
  }
}

export async function getAllThreads(req, res) {
  const me = req.user.uid;
  try {
    const db = await getDb();
    const base = await db.collection('messages')
      .find({ participants: me })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .toArray();

    const enrich = async (t) => {
      const otherUid = (t.participants || []).find(u => u !== me) || me;
      let otherName = "User";
      let otherAvatar = "/images/default-avatar.png";

      try {
        const u = await db.collection('users').findOne({ uid: otherUid });
        const p = await db.collection('profile').findOne({ uid: otherUid });
        if (u?.username) otherName = u.username;
        if (p?.profilePhotoUrl) otherAvatar = p.profilePhotoUrl;
      } catch {}

      return {
        _id: String(t._id),
        listingId: t.listingId,
        listingTitle: t.listingTitle || "",
        otherUserName: otherName,
        avatar: otherAvatar,
        unread: t.unread || {},
        lastMessage: t.lastMessage || "",
        lastMessageAt: t.lastMessageAt || null,
      };
    };

    const threads = await Promise.all(base.map(enrich));
    res.json(threads);
  } catch {
    res.status(500).json({ error: "Failed to fetch threads" });
  }
}

export async function getThreadById(req, res) {
  const me = req.user.uid;
  const { id } = req.params;

  try {
    const db = await getDb();
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const thread = await db.collection('messages').findOne(query);
    if (!thread) return res.status(404).json({ error: "Conversation not found" });

    if (!Array.isArray(thread.participants) || !thread.participants.includes(me)) {
      return res.status(403).json({ error: "Not authorized for this thread" });
    }

    const otherUid = thread.participants.find(u => u !== me) || me;

    const loadUser = async (uid) => {
      const u = await db.collection('users').findOne({ uid });
      const p = await db.collection('profile').findOne({ uid });
      return {
        uid,
        name: u?.username || u?.displayName || "User",
        avatar: p?.profilePhotoUrl || "/images/default-avatar.png",
      };
    };

    const [meUser, otherUser] = await Promise.all([loadUser(me), loadUser(otherUid)]);

    let ownerUid = null;
    try {
      const listingQuery = ObjectId.isValid(thread.listingId)
        ? { _id: new ObjectId(thread.listingId) }
        : { _id: thread.listingId };


      const listing = await db.collection('items').findOne(listingQuery);
      if (listing?.ownerUid) ownerUid = listing.ownerUid;
      if (!listing) {
        console.warn("Listing not found for ID:", thread.listingId);
      } else if (!listing.ownerUid) {
        console.warn("Listing found but missing ownerUid:", listing);
      }

      console.log("Fetched listing:", listing);
    } catch (e) {
      console.warn("Failed to fetch listing for ownerUid:", e);
    }

    res.json({ ...thread, _id: String(thread._id), ownerUid, meta: { me: meUser, other: otherUser } });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST request for sending message in Thread
export async function sendMessage(req, res) {
  const rawId = req.params.id;
  const me = req.user.uid;
  const { text } = req.body; // frontend sends 'text', not 'body'

  if (!text?.trim()) return res.status(400).json({ error: "Empty message" });
  if (!ObjectId.isValid(rawId)) return res.status(400).json({ error: "Invalid thread ID" });

  try {
    const db = await getDb();
    const threadId = new ObjectId(rawId);
    const thread = await db.collection('messages').findOne({ _id: threadId });
    if (!thread) return res.status(404).json({ error: "Conversation not found" });

    if (!Array.isArray(thread.participants) || !thread.participants.includes(me)) {
      return res.status(403).json({ error: "Not authorized for this thread" });
    }

    const other = thread.participants.find(u => u !== me) || me;
    const otherKey = String(other);
    const now = new Date().toISOString();

    if (typeof thread.unread !== 'object' || thread.unread === null || Array.isArray(thread.unread)) {
      await db.collection('messages').updateOne({ _id: threadId }, { $set: { unread: {} } });
      thread.unread = {};
    }

    const unreadCount = (thread.unread[otherKey] || 0) + 1;

    const updatePayload = {
      $push: { messages: { from: me, body: text, at: now } }, 
      $set: {
        lastMessage: text,
        lastMessageAt: now,
        [`unread.${otherKey}`]: unreadCount
      }
    };

    if (!otherKey || !text) {
      console.warn("Invalid update payload:", { otherKey, text });
      return res.status(400).json({ error: "Invalid message data" });
    }

    const result = await db.collection('messages').findOneAndUpdate(
      { _id: threadId },
      updatePayload,
      { returnDocument: 'after' }
    );

    if (!result) {
      console.warn("Update failed — result.value is null");
      console.warn("Thread ID:", threadId.toHexString());
      console.warn("Update query:", { _id: threadId });
      console.warn("Update payload:", updatePayload);
      return res.status(500).json({ error: "Failed to update message thread" });
    }

    res.json({ messages: result.messages });
  } catch (err) {
    console.error("Message send error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST request to mark a conversation as read
export async function markThreadAsRead(req, res) {
  const { id } = req.params;
  const me = req.user?.uid || req.user?.email || "unknown";

  try {
    const db = await getDb();
    const query = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
      : { _id: id };

    const thread = await db.collection('messages').findOne(query);
    if (!thread) return res.status(404).json({ error: "Conversation not found" });

    if (!Array.isArray(thread.participants) || !thread.participants.includes(me)) {
      return res.status(403).json({ error: "Not authorized for this thread" });
    }

    await db.collection('messages').updateOne(
      { _id: thread._id },
      { $set: { [`unread.${me}`]: 0 } }
    );

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
}

// DELETE request for deleting a thread
export async function deleteThread(req, res) {
  const { id } = req.params;
  const me = req.user.uid;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid thread ID" });
  }

  try {
    const db = await getDb();
    const threadId = new ObjectId(id);
    const thread = await db.collection('messages').findOne({ _id: threadId });

        if (!thread) {
      return res.status(404).json({ success: false, message: "Thread not found" });
    }

    if (!Array.isArray(thread.participants) || !thread.participants.includes(me)) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this thread" });
    }

    const result = await db.collection('messages').deleteOne({ _id: threadId });

    if (result.deletedCount === 0) {
      return res.status(500).json({ success: false, message: "Thread deletion failed" });
    }

    res.status(200).json({ success: true, message: "Thread deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}