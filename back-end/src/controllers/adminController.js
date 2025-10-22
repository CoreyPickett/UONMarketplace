// controllers/adminController.js
import admin from '../config/firebase.js';

// DELETE request to delete user by UID
export async function deleteUserByUid(req, res) {
  const { uid } = req.params;
  if (uid === req.user.uid) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }

  try {
    const target = await admin.auth().getUser(uid);
    if (target.customClaims?.isAdmin === true) {
      return res.status(403).json({ error: "Cannot delete another admin user." });
    }

    await admin.auth().deleteUser(uid);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
}

// DELETE request to delete user
export async function deleteUserByBody(req, res) {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "Missing UID" });

  try {
    await admin.auth().deleteUser(uid);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
}

// POST request to disable user by IUD
export async function disableUser(req, res) {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "Missing UID" });

  try {
    await admin.auth().updateUser(uid, { disabled: true });
    res.json({ success: true, message: "User disabled" });
  } catch (error) {
    res.status(500).json({ error: "Failed to disable user" });
  }
}

// Enable user in Admin page
export async function enableUser(req, res) {
  const { uid } = req.body;

  if (!uid) return res.status(400).json({ error: "Missing UID" });

  if (!req.user?.isAdmin && !req.user?.admin) {
    return res.status(403).json({ error: "Admin privileges required" });
  }

  try {
    await admin.auth().updateUser(uid, { disabled: false });
    res.json({ success: true, message: "User enabled" });
  } catch (error) {
    console.error("Enable user failed:", error);
    res.status(500).json({ error: "Failed to enable user" });
  }
}

// GET request to list all users
export async function listAllUsers(req, res) {
  try {
    const allUsers = [];
    let nextPageToken;

    do {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      result.users.forEach((userRecord) => {
        allUsers.push({
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          disabled: userRecord.disabled,
          customClaims: userRecord.customClaims || {},
        });
      });
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

// GET request to search user by email
export async function searchUserByEmail(req, res) {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    res.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      disabled: userRecord.disabled,
      metadata: userRecord.metadata,
      customClaims: userRecord.customClaims || {},
    });
  } catch (error) {
    res.status(404).json({ error: "User not found" });
  }
}