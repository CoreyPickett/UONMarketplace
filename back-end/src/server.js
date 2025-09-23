
//Backend server, currently integrated with MongoDb globally
import express from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';
import admin from 'firebase-admin';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();


//import path from 'path';

//import {fileURLToPath } from 'url';
//const __filename = fileURLToPath(import.meta.url);   // these are for when the front-end final build is ready
//const __dirname = path.__dirname(__filename);        // the load the dist file when it is in the back-end once built 

const credentials = JSON.parse( //Reads firebase credentials
  fs.readFileSync('./credentials.json')
);

admin.initializeApp({ //Start App with firebase credentials
  credential: admin.credential.cert(credentials)
});

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
});


const app = express();

app.use(express.json()); //Initialise express

let db;

async function connectToDB() { //Connect to global DB with username and password
  const uri = !process.env.MONGODB_USERNAME 
  ? 'mongodb://127.0.0.1:27017'
  : `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.gc0c2sd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();

  db = client.db('uon-marketplace-db');

  if (!db) {
    console.error('Database not connected');
    return res.status(500).send('DB not initialized');
  }

}

/*   
// below is code for once the front-end is built and implemented as files in the back-end

app.use(express.static(path.join(__dirname, '../dist')))

app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
})
*/

// Check for valid MongoDB ID to avoid crashes
function isValidObjectId(id) {
    return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
  }

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});

// GET request for Whole Marketplace
app.get('/api/marketplace/', async (req, res) => {
  try {
    const listings = await db.collection('items')
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.status(200).json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// List of current admin emails
const adminEmails = ['admin@uon.edu', 'tester@uon.edu', 'demo2@uon.edu', 'tester100@uon.edu.au'];

// Function to check if email is admin verified
function checkIfAdmin(req, res, next) {
  console.log("checkIfAdmin triggered");

  const userEmail = req.user?.email;
  const isVerified = req.user?.email_verified;

  if (!userEmail) {
    console.warn("Missing email in decoded token");
    return res.status(401).json({ error: "Invalid token: no email" });
  }

  console.log("Checking admin status for:", userEmail);

  if (adminEmails.includes(userEmail)) {
    req.user.isAdmin = true;
    console.log(`Admin verified: ${userEmail}`);
  } else {
    console.log(`Not an admin: ${userEmail}`);
  }

  next();
}

// Verification for a logged in user
const verifyUser = async (req, res, next) => {
  const { authtoken } = req.headers;
  


  if (!authtoken) {
    return res.sendStatus(400);
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(authtoken);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.sendStatus(401);
  }
};

// POST request to mark a conversation as read
app.post('/api/messages/:id/read', verifyUser, async (req, res) => {
  const { id } = req.params;
  const { uid, email } = req.user || {};
  const me = uid || email || "unknown";
  try {
    // Support both ObjectId and string IDs
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const result = await db.collection('messages').findOneAndUpdate(
      query,
      { $set: { ["unread." + me]: 0 } },
      { returnDocument: 'after' }
    );
    if (result.value) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Conversation not found" });
    }
  } catch (e) {
    console.error("Error marking as read:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});
// check if user is admin verified
const requireAdmin = (req, res, next) => {
  if (req.user?.isAdmin === true || req.user?.admin === true) {
    return next();
  }
  return res.status(403).json({ error: "Admin privileges required" });
};

app.delete("/api/admin/users/:uid", verifyUser, checkIfAdmin, requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;

    // so admins dont delete themselves by accident
    if (uid === req.user.uid) {
      return res.status(400).json({ error: "You cannot delete your own account." });
    }

    // block deleting another admin 
    const target = await admin.auth().getUser(uid);
    if (target.customClaims?.isAdmin === true) {
      return res.status(403).json({ error: "Cannot delete another admin user." });
    }

    //  Delete auth account
    await admin.auth().deleteUser(uid);

    //  Clean up marketplace data owned by that user
    //    Examples (adjust to your schema/fields):

    return res.status(204).send(); // No Content
  } catch (err) {
    console.error("Admin delete user error:", err);
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

// Enable user (admin only)
app.post('/api/admin/enable-user', verifyUser, requireAdmin, async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "Missing UID" });

  try {
    await admin.auth().updateUser(uid, { disabled: false });
    res.json({ success: true, message: "User enabled" });
  } catch (error) {
    console.error("Enable error:", error);
    res.status(500).json({ error: "Failed to enable user" });
  }
});

//POST request for updating upvotes
app.post('/api/marketplace/:id/upvote', verifyUser, async (req, res) => {
  const { id } = req.params;
  const { uid } = req.user;

  if (!uid) {
    return res.status(401).json({ error: "User ID missing from request" }); //Error if no User ID is present
  }

  try {
    const listing = await db.collection('items').findOne({ _id: new ObjectId(id) }); //Get item based on unique ID

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" }); //Error for no item found
    }

    const upvoteIds = listing.upvoteIds || [];
    const canUpvote = !upvoteIds.includes(uid);

    if (!canUpvote) {
      return res.status(403).json({ error: "User has already upvoted" });
    }

    const updatedListing = await db.collection('items').findOneAndUpdate( //Update page after upvoting
      { _id: new ObjectId(id) },
      {
        $inc: { upvotes: 1 },
        $push: { upvoteIds: uid }
      },
      {
        returnDocument: "after"
      }
    );

    return res.status(200).json({ success: true, listing: updatedListing.value });
  } catch (err) {
    console.error("Upvote error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//POST request for adding comments (Not updated)
app.post('/api/marketplace/:id/comments', verifyUser, async (req, res) => {
  const { id } = req.params;
  const { postedBy, text } = req.body;
  const newComment = { postedBy, text };

  const updatedListing = await db.collection('items').findOneAndUpdate({ _id: new ObjectId(id) }, { //Get item based on unique ID
    $push: { comments: newComment }
  }, {
    returnDocument: 'after',
  });

  res.json(updatedListing); //Update Listing
});

//DELETE request for deleting a listing
app.delete('/api/marketplace/:id', verifyUser, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.collection('items').deleteOne({ _id: new ObjectId(id) }); //Delete item based on unique ID

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Listing not found" }); //Sanity check
    }

    return res.status(200).json({ success: true, message: "Listing deleted successfully" }); //Delete success return message
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" }); //Delete failure return message
  }
});

//GET request for uploading images
app.get('/api/marketplace/s3-upload-url', async (req, res) => {
  const { filename, filetype, scope = "listing", userId = "anonymous" } = req.query;

  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validTypes.includes(filetype)) {
    console.warn("Rejected filetype:", filetype);
    return res.status(400).send("Invalid file type");
  }

  if (!filename || !filetype) {
    console.warn("Missing filename or filetype:", { filename, filetype });
    return res.status(400).send("Missing filename or filetype");
  }

  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');

  let key;
  if (scope === "profile") {
    key = `profile/${userId}/profile.jpg`; // Overwrite-safe path
  } else {
    key = `listings/${Date.now()}_${safeFilename}`; // Timestamped for uniqueness
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Expires: 30,
    ContentType: filetype,
  };

  try {
    const uploadURL = await s3.getSignedUrlPromise('putObject', params);
    res.json({ uploadURL, key });
  } catch (error) {
    console.error("S3 URL error:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

//GET request to list all users
app.get('/api/admin/users', async (req, res) => {
  try {
    const allUsers = [];
    let nextPageToken;

    do {
      const result = await admin.auth().listUsers(1000, nextPageToken); // max 1000 per page
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
    console.error("Error listing users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});



//GET request to search user by email
app.get('/api/admin/search-user', verifyUser, checkIfAdmin, requireAdmin, async (req, res) => {
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
    console.error("Error fetching user:", error);
    res.status(404).json({ error: "User not found" });
  }
});

//POST request to disable user by IUD
app.post('/api/admin/disable-user', async (req, res) => {
  const { uid } = req.body;

  if (!uid) return res.status(400).json({ error: "Missing UID" });

  try {
    await admin.auth().updateUser(uid, { disabled: true });
    res.json({ success: true, message: "User disabled" });
  } catch (error) {
    console.error("Disable error:", error);
    res.status(500).json({ error: "Failed to disable user" });
  }
});

//POST request to delete user by IUD
app.post('/api/admin/delete-user', async (req, res) => {
  const { uid } = req.body;

  if (!uid) return res.status(400).json({ error: "Missing UID" });

  try {
    await admin.auth().deleteUser(uid);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// POST request for creating a new listing
app.post('/api/marketplace/create-listing', verifyUser, async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Missing request body" });
    }

    
    const { uid, email } = req.user || {};

    const {
      title,
      description,
      category,
      price,
      condition,
      location,
      delivery_options,
      images,
    } = req.body;

    const newListing = {
      title,
      description,
      category,
      price,
      condition,
      location,
      delivery_options,
      images: Array.isArray(images) ? images : [], //Initialise images as an array for multiple images per listing
      //  ownership fields for Profile "My Listings"
      ownerUid: uid || null,
      ownerEmail: email || null,

      upvotes: 0,
      upvoteIds: [],
      comments: [],
      //  createdAt to help sort later
      createdAt: new Date(),
    };

    //Maximum number of Images
    if (images.length > 10) { 
      return res.status(400).json({ error: "Maximum 10 images allowed." });
    }

    //Ensure valid S3 URL
    const isValidUrl = (url) => typeof url === "string" && url.startsWith("https://");
    if (!images.every(isValidUrl)) {
      return res.status(400).json({ error: "Invalid image URL format." });
    }

    
    const result = await db.collection('items').insertOne(newListing);

    if (!result.acknowledged) {
      if (!res.headersSent) {
        return res.status(500).json({ error: "Insert failed" });
      }
      return;
    }

    return res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      insertedId: result.insertedId
    });
  } catch (err) {
    console.error('Insert error:', err);
    return res.status(500).json({ success: false, message: 'Unexpected error' });
  }
});

// GET request for Advanced Search Function
app.get('/api/search', async (req, res) => {
  try {
    const {
      query: rawQuery,
      category,
      minPrice,
      maxPrice,
      sort = "recent",
    } = req.query;

    console.log("Received search:", { rawQuery, category, minPrice, maxPrice, sort });

    const query = rawQuery?.trim() || "";

    console.log("Full request URL:", req.originalUrl);


    const filters = {};

    // Text search across multiple fields
    if (query.trim()) {
      const regex = new RegExp(query.trim(), "i");
      filters.$or = [
        { title: regex },
        { description: regex },
        { category: regex },
        { location: regex },
        { seller: regex },
      ];
    }

    // Category filter
    if (category) {
      filters.category = category;
    }

    // Price range filter
    const min = Number(minPrice);
    const max = Number(maxPrice);
    if (!Number.isNaN(min)) {
      filters.price = { ...filters.price, $gte: min };
    }
    if (!Number.isNaN(max)) {
      filters.price = { ...filters.price, $lte: max };
    }

    // Sorting logic
    let sortOption = { createdAt: -1 }; // default: recent
    if (sort === "priceAsc") sortOption = { price: 1 };
    if (sort === "priceDesc") sortOption = { price: -1 };
    if (sort === "titleAsc") sortOption = { title: 1 };

    console.log("Applied sort option:", sortOption);


    const listings = await db.collection("items")
      .find(filters)
      .sort(sortOption)
      .toArray();

    res.status(200).json(listings);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to perform search" });
  }
});

//PUT request for Editing Listings
app.put('/api/marketplace/:id', verifyUser, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    //Check for valid ObjectID
    if (!isValidObjectId(id)) { 
        return res.status(400).json({ error: "Invalid listing ID format." });
      }

    const listing = await db.collection('items').findOne({ _id: new ObjectId(id) });
    if (!listing) return res.status(404).json({ error: "Listing not found" });



    // Ownership check
    const uid = req.user.uid;
    const email = req.user.email?.toLowerCase();
    const isOwner =
      listing.ownerUid === uid ||
      (email && listing.ownerEmail?.toLowerCase() === email);

    if (!isOwner) {
      return res.status(403).json({ error: "You are not authorized to edit this listing." });
    }

    // Sanitise updates to only allow certain fields
    const allowedFields = [
      "title", "description", "category", "price", "condition",
      "location", "delivery_options", "images", "quantity", "seller"
    ];
    const safeUpdates = {};
    for (const key of allowedFields) {
      if (key in updates) safeUpdates[key] = updates[key];
    }

    //Image safeguard
    if ("images" in safeUpdates) {
      const images = safeUpdates.images;
      if (!Array.isArray(images)) {
        return res.status(400).json({ error: "Images must be an array." });
      }
      if (images.length > 10) {
        return res.status(400).json({ error: "Maximum 10 images allowed." });
      }
      const isValidUrl = (url) => typeof url === "string" && url.startsWith("https://");
      if (!images.every(isValidUrl)) {
        return res.status(400).json({ error: "Invalid image URL format." });
      }
    }


    const result = await db.collection('items').updateOne( //Update DB
      { _id: new ObjectId(id) },
      { $set: safeUpdates }
    );


    if (result.modifiedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Failed to update listing." });
    }
  } catch (e) {
    console.error("Update listing error:", e);
    res.status(400).json({ error: "Invalid listing id or update payload." });
  }
});

//POST request to update profile photo
app.post('/api/profile/update-photo', verifyUser, async (req, res) => {
  try {
    const { uid } = req.user || {};
    const { profilePhotoUrl } = req.body;

    if (!uid || !profilePhotoUrl || typeof profilePhotoUrl !== "string") {
      return res.status(400).json({ error: "Missing or invalid data" });
    }

    // Validate S3 URL format
    if (!profilePhotoUrl.startsWith("https://")) {
      return res.status(400).json({ error: "Invalid image URL format" });
    }

    const result = await db.collection('profile').updateOne(
      { uid },
      { $set: { profilePhotoUrl, updatedAt: new Date() } },
      { upsert: true } // Creates the document if it doesn't exist
    );

    if (!result.acknowledged) {
      return res.status(500).json({ error: "Update failed" });
    }

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ success: false, message: "Unexpected error" });
  }
});

//POST request for updating profile photos
app.post("/api/profile/updatePhoto", verifyUser, async (req, res) => {
  const uid = req.user?.uid;
  const { profilePhotoUrl } = req.body;

  console.log("Verified UID:", uid);
  console.log("Photo URL:", profilePhotoUrl);


  try {
    if (!uid || !profilePhotoUrl || typeof profilePhotoUrl !== "string") {
      console.log("UID:", uid);
      console.log("typeof UID:", typeof uid);
      console.log("Photo URL:", profilePhotoUrl);
      console.log("typeof Photo URL:", typeof profilePhotoUrl);

      return res.status(400).json({ error: "Missing or invalid data" });
    }

    console.log("Attempting DB update with:");
    console.log("Filter:", { uid });
    console.log("Payload:", { profilePhotoUrl, updatedAt: new Date() });

    const result = await db.collection("profile").updateOne(
      { uid: uid },
      { $set: { profilePhotoUrl, updatedAt: new Date() } },
      { upsert: true }
    );

    console.log("MongoDB update result:", result);

    if (!result.acknowledged) {
      return res.status(500).json({ error: "Update failed" });
    }

    res.status(200).json({ success: true, message: "Profile photo updated" });
    console.log("MongoDB update result:", result);
  } catch (err) {
    console.error("Profile photo update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//GET request for individual user profile pages
app.get("/api/profile/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ error: "Missing UID" });

    const profile = await db.collection("profile").findOne({ uid });
    const user = await db.collection("users").findOne({ uid });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json({
      ...profile,
      username: user?.username || null
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//POST request to set a username
app.post('/api/user/setUsername', verifyUser, async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Missing request body" });
    }

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

    return res.status(200).json({
      success: true,
      message: "Username set successfully",
      username
    });
  } catch (err) {
    console.error("Username update error:", err);
    return res.status(500).json({ success: false, message: "Unexpected error" });
  }
});

//POST request to update a username
app.put('/api/user/updateUsername', verifyUser, async (req, res) => {
  try {
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
    const existingUserWithUsername = await db.collection('users').findOne({ username });
    if (existingUserWithUsername && existingUserWithUsername.uid !== uid) {
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

    if (result.modifiedCount === 0) {
      return res.status(200).json({ success: true, message: "Username already set", username });
    }

    return res.status(200).json({
      success: true,
      message: "Username updated successfully",
      username
    });

  } catch (err) {
    console.error("Username update error:", err);
    return res.status(500).json({ success: false, message: "Unexpected error" });
  }
});

//GET request for a listing (Moved to end to resolve routing issues)
app.get('/api/marketplace/:id', async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    console.warn("Invalid ObjectId received:", id);
    return res.status(400).json({ error: "Invalid listing ID format." });
  }

  try {
    const listing = await db.collection('items').findOne({ _id: new ObjectId(id) }); //Gets idividual item based on unique ID
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(listing);
  } catch (e) {
    console.error("Fetch listing error:", e);
    res.status(400).json({ error: "Invalid listing id" });
  }
});

// --- SAVES / FAVORITES -----------------------------------------------

// List my saved items (full item docs). Add ?idsOnly=1 to return only IDs.
app.get('/api/saves', verifyUser, async (req, res) => {
  try {
    const uid = req.user.uid;
    const idsOnly = String(req.query.idsOnly || "").toLowerCase() === "1";

    const doc = await db.collection('saves').findOne({ uid });
    const itemIds = (doc?.itemIds || []).map((id) => new ObjectId(id));

    if (idsOnly) {
      return res.json((doc?.itemIds || []).map(String));
    }

    const items = itemIds.length
      ? await db.collection('items').find({ _id: { $in: itemIds } }).toArray()
      : [];

    res.json(items);
  } catch (e) {
    console.error("Get saves error:", e);
    res.status(500).json({ error: "Failed to load saved items" });
  }
});

// Save an item
app.post('/api/saves/:id', verifyUser, async (req, res) => {
  const { id } = req.params;
  const uid = req.user.uid;

  try {
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
    console.error("Save item error:", e);
    res.status(400).json({ error: "Failed to save item" });
  }
});

// Unsave an item
app.delete('/api/saves/:id', verifyUser, async (req, res) => {
  const { id } = req.params;
  const uid = req.user.uid;

  try {
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
    console.error("Unsave item error:", e);
    res.status(400).json({ error: "Failed to unsave item" });
  }
});


// \/\/\/\/ Stuff for messages below \/\/\/\/ -------------------------------------------------------------------------

//GET request for a messages
app.get('/api/messages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    console.log("DirectMessage API: Querying with", query);
    const message = await db.collection('messages').findOne(query);
    if (!message) {
      console.log("DirectMessage API: No message found for", query);
      return res.status(404).json({ error: 'Message not found.' });
    }
    res.json(message);
  } catch (error) {
    console.error('DirectMessage API: Database error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

//GET request for all messages
app.get('/api/messages/', async (req, res) => {
  try {
    const messages = await db.collection('messages').find().toArray(); //Lists all messages in 'messages' array
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST request for creating a new messages
app.post('/api/marketplace/create-message', verifyUser, async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Missing request body" });
    }

    const { uid, email } = req.user || {};

    const {
      otherUserName,
      message,
    } = req.body;

    const newMessages = {
      otherUserName,
      lastMessage: message,
      unread: [otherUserName],   // removed avatar as that is now stored elsewere 
      messages: [{ from: uid, body: message, at: new Date().toISOString() }],
      //  ownership fields for Profile "messages"
      ownerUid: uid || null,
      
      //  createdAt to help sort later
      createdAt: new Date(),
    };


    // checks for values
    if (!otherUserName || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!req.user || !req.user.uid) {
      return res.status(400).json({ error: "User information is missing" });
    }

    // posting to database
    const result = await db.collection('messages').insertOne(newMessages);

    if (!result.acknowledged) {
      if (!res.headersSent) {
        return res.status(500).json({ error: "Insert failed" });
      }
      return;
    }

    return res.status(201).json({
      success: true,
      message: 'Messages created successfully',
      insertedId: result.insertedId
    });
  } catch (err) {
    console.error('Insert error:', err);
    return res.status(500).json({ success: false, message: 'Unexpected error', error: err.message });
  }
});

// For searching for user exists in database
app.get('/api/create-message/user-search', verifyUser, async () => {
  const {uid} = req.body
  
  try{
  const user = await db.collection('users').findOne( { uid : uid}).toArray();
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }

});

app.get('/api/message/mutual-check', verifyUser, async (req, res) => {
  const { uid, otherUid } = req.query;  // Use query for GET

  try {
    const messagesCollection = db.collection('messages');

    const chat = await messagesCollection.findOne({
      $or: [
        { ownerUid: uid, otherUserName: otherUid },
        { ownerUid: otherUid, otherUserName: uid }
      ]
    });

    if (chat) {
      res.status(200).json(chat);
    } else {
      res.status(404).json({ message: 'No matching messages found' });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});



//DELETE request for deleting a message
app.delete('/api/messages/:id', verifyUser, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.collection('messages').deleteOne({ _id: new ObjectId(id) }); //Delete messages based on unique ID

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Messages not found" }); //Sanity check
    }

    return res.status(200).json({ success: true, message: "Messages deleted successfully" }); //Delete success return message
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" }); //Delete failure return message
  }
});

//POST request for adding message to messages page
app.post('/api/messages/:id/messages', verifyUser, async (req, res) => {
  const { id } = req.params;
  const { uid, email } = req.user || {};
  const me = uid || email || "unknown";
  const { body } = req.body; // frontend sends { body }
  try {
    // Support both ObjectId and string IDs
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const result = await db.collection('messages').findOneAndUpdate(
      query,
      {
        $push: {
          messages: {
            from: me,
            body,
            at: new Date().toISOString(),
          },
        },
      },
      { returnDocument: 'after' }
    );
    if (result.value && result.value.messages) {
      res.json({ messages: result.value.messages });
    } else {
      res.status(404).json({ error: "Conversation not found" });
    }
  } catch (e) {
    console.error("Error updating messages:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
});



const PORT = process.env.PORT || 8000; // this just allows for the enviroment to choose what port it runs on with the default of 8000

//Function for starting server
async function start() {
  await connectToDB();
  app.listen(PORT, function() {
    console.log('Server is listening on port ' + PORT);
  });
}

start();