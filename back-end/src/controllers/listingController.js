// controllers/listingController.js
import { ObjectId } from 'mongodb';
import { isValidObjectId } from '../utils/validation.js';
import { getDb } from '../config/db.js';
import s3 from '../config/aws.js';

// GET request for a listing
export async function getListingById(req, res) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid listing ID format." });
  }

  try {
    const db = await getDb();
    const listing = await db.collection('items').findOne({ _id: new ObjectId(id) });
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(listing);
  } catch (e) {
    res.status(400).json({ error: "Invalid listing id" });
  }
}

// POST request for creating a new listing
export async function createListing(req, res) {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Missing request body" });
    }

    const { uid, email } = req.user || {};
    const {
      title, description, category, price, condition,
      location, delivery_options, images
    } = req.body;

    if (images.length > 10) {
      return res.status(400).json({ error: "Maximum 10 images allowed." });
    }

    const isValidUrl = (url) => typeof url === "string" && url.startsWith("https://");
    if (!images.every(isValidUrl)) {
      return res.status(400).json({ error: "Invalid image URL format." });
    }

    const newListing = {
      title, description, category, price, condition, location, delivery_options,
      images: Array.isArray(images) ? images : [],
      ownerUid: uid || null,
      ownerEmail: email || null,
      upvotes: 0,
      upvoteIds: [],
      comments: [],
      createdAt: new Date(),
      sold: false, // Boolean statement for if an item is sold
      buyerUid: null, // UID of buyer
      soldAt: null // Date item is sold
    };

    const db = await getDb();
    const result = await db.collection('items').insertOne(newListing);

    if (!result.acknowledged) {
      return res.status(500).json({ error: "Insert failed" });
    }

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      insertedId: result.insertedId
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unexpected error' });
  }
}

// GET request for uploading images
export async function getS3UploadUrl(req, res) {
  const { filename, filetype, scope = "listing", userId = "anonymous" } = req.query;

  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validTypes.includes(filetype)) {
    return res.status(400).send("Invalid file type");
  }

  if (!filename || !filetype) {
    return res.status(400).send("Missing filename or filetype");
  }

  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
  const key = scope === "profile"
    ? `profile/${userId}/profile.jpg`
    : `listings/${Date.now()}_${safeFilename}`;

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
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
}

// POST request for updating upvotes
export async function upvoteListing(req, res) {
  const { id } = req.params;
  const { uid } = req.user;

  if (!uid) {
    return res.status(401).json({ error: "User ID missing from request" });
  }

  try {
    const db = await getDb();
    const listing = await db.collection('items').findOne({ _id: new ObjectId(id) });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const upvoteIds = listing.upvoteIds || [];
    if (upvoteIds.includes(uid)) {
      return res.status(403).json({ error: "User has already upvoted" });
    }

    const updatedListing = await db.collection('items').findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $inc: { upvotes: 1 },
        $push: { upvoteIds: uid }
      },
      { returnDocument: "after" }
    );

    res.status(200).json({ success: true, listing: updatedListing.value });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST request for adding comments (Not updated)
export async function addComment(req, res) {
  const { id } = req.params;
  const { postedBy, text } = req.body;
  const newComment = { postedBy, text };

  try {
    const db = await getDb();
    const updatedListing = await db.collection('items').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $push: { comments: newComment } },
      { returnDocument: 'after' }
    );

    res.json(updatedListing);
  } catch (err) {
    res.status(500).json({ error: "Failed to add comment" });
  }
}

// DELETE request for deleting a listing
export async function deleteListing(req, res) {
  const { id } = req.params;

  try {
    const db = await getDb();
    const result = await db.collection('items').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    res.status(200).json({ success: true, message: "Listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// PUT request for Editing Listings
export async function editListing(req, res) {
  const { id } = req.params;
  const updates = req.body;

  //Check for valid ObjectID
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid listing ID format." });
  }

  try {
    const db = await getDb();
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

    // Image safeguard
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

    const result = await db.collection('items').updateOne( // Update DB
      { _id: new ObjectId(id) },
      { $set: safeUpdates }
    );

    if (result.modifiedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Failed to update listing." });
    }
  } catch (e) {
    res.status(400).json({ error: "Invalid listing id or update payload." });
  }
}

// POST request to mark item as sold
export async function markListingAsSold(req, res) {
  const { id } = req.params;
  const { uid } = req.user; // Authenticated user
  const { buyerUid, soldAt } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid listing ID format." });
  }

  try {
    const db = await getDb();
    const listing = await db.collection('items').findOne({ _id: new ObjectId(id) });

    console.log("Authenticated UID:", uid);
    console.log("Listing owner UID:", listing.ownerUid);

    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.sold) return res.status(400).json({ error: "Item already marked as sold" });

    // Only allow owner to mark as sold
    if (listing.ownerUid !== uid) {
      return res.status(403).json({ error: "Only the owner can mark this item as sold" });
    }

    // Use provided buyerUid or fallback to null
    const buyer = buyerUid || null;

    const result = await db.collection('items').updateOne(
      { _id: new ObjectId(id), sold: false },
      {
        $set: {
          sold: true,
          buyerUid: buyer,
          soldAt: soldAt ? new Date(soldAt) : new Date()
        }
      }
    );

    let threadId = null;

    if (buyer) {
      const thread = await db.collection("messages").findOne({
        listingId: new ObjectId(id),
        participants: { $all: [uid, buyer] }
      });

      if (thread?._id) {
        threadId = String(thread._id);
      }
    }

    if (!threadId && buyer) {
      console.warn("No thread found between seller and buyer for listing:", id);
    }

    if (result.modifiedCount === 1) {
      res.json({success: true, message: "Item successfully marked as sold", threadId });
    } else {
      res.status(500).json({ error: "Failed to update item status" });
    }
  } catch (err) {
    console.error("markListingAsSold error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// POST Route to record Buyer UID when selecting Buy Now
export async function recordPurchase(req, res) {
  const { id } = req.params;
  const buyerUid = req.user.uid;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid listing ID" });
  }

  try {
    const db = await getDb();
    const result = await db.collection("items").updateOne(
      { _id: new ObjectId(id), buyerUid: null }, // prevent overwriting
      { $set: { buyerUid } }
    );

    if (result.modifiedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Purchase already recorded or listing not found" });
    }
  } catch (err) {
    console.error("Purchase error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}