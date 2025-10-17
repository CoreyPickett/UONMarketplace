import { getDb } from '../config/db.js';

// POST request to update profile photo
export async function updateProfilePhoto(req, res) {
  const { uid } = req.user || {};
  const { profilePhotoUrl } = req.body;

  // Validate S3 URL format
  if (!uid || !profilePhotoUrl || typeof profilePhotoUrl !== "string" || !profilePhotoUrl.startsWith("https://")) {
    return res.status(400).json({ error: "Missing or invalid data" });
  }

  try {
    const db = await getDb();
    const result = await db.collection('profile').updateOne(
      { uid },
      { $set: { profilePhotoUrl, updatedAt: new Date() } },
      { upsert: true } // Creates the document if it doesn't exist
    );

    if (!result.acknowledged) {
      return res.status(500).json({ error: "Update failed" });
    }

    res.status(200).json({ success: true, message: "Profile photo updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Unexpected error" });
  }
}

// POST request for updating profile photos
export async function updateProfilePhotoAlt(req, res) {
  const uid = req.user?.uid;
  const { profilePhotoUrl } = req.body;

  if (!uid || !profilePhotoUrl || typeof profilePhotoUrl !== "string" || !profilePhotoUrl.startsWith("https://")) {
    return res.status(400).json({ error: "Missing or invalid data" });
  }

  try {
    const db = await getDb();
    const result = await db.collection("profile").updateOne(
      { uid },
      { $set: { profilePhotoUrl, updatedAt: new Date() } },
      { upsert: true }
    );

    if (!result.acknowledged) {
      return res.status(500).json({ error: "Update failed" });
    }

    res.status(200).json({ success: true, message: "Profile photo updated" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// GET request for individual user profile pages
export async function getUserProfile(req, res) {
  const { uid } = req.params;
  if (!uid) return res.status(400).json({ error: "Missing UID" });

  try {
    const db = await getDb();
    const profile = await db.collection("profile").findOne({ uid });
    const user = await db.collection("users").findOne({ uid });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const isAdmin = ['admin@uon.edu', 'tester@uon.edu', 'demo2@uon.edu', 'tester100@uon.edu.au'].includes(user?.email);

    res.json({
      ...profile,
      username: user?.username || null,
      isAdmin
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

// POST request to set a username
export async function setUsername(req, res) {
  const { uid } = req.user || {};
  const { username } = req.body;

  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "Username is required and must be a string." });
  }

  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: "Invalid username format." });
  }

  // Check if username is already taken
  try {
    const db = await getDb();
    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: "Username already taken." });
    }

    // Update the user's document
    const result = await db.collection('users').updateOne(
      { uid },
      { $set: { username } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: "Username update failed." });
    }

    res.status(200).json({ success: true, message: "Username set successfully", username });
  } catch (err) {
    res.status(500).json({ success: false, message: "Unexpected error" });
  }
}

// POST request to update a username
export async function updateUsername(req, res) {
  const { uid, email } = req.user || {};
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Missing username in request body." });
  }

  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: "Invalid username format." });
  }

  // Check if username is already taken
  try {
    const db = await getDb();
    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser && existingUser.uid !== uid) {
      return res.status(409).json({ error: "Username already taken." });
    }

    // Ensure user document exists
    const userDoc = await db.collection('users').findOne({ uid });
    if (!userDoc) {
      await db.collection('users').insertOne({
        uid,
        email,
        username: null,
        createdAt: new Date()
      });
    }

    // Update username
    const result = await db.collection('users').updateOne(
      { uid },
      { $set: { username } }
    );

    const message = result.modifiedCount === 0
      ? "Username already set"
      : "Username updated successfully";

    res.status(200).json({ success: true, message, username });
  } catch (err) {
    res.status(500).json({ success: false, message: "Unexpected error" });
  }
}