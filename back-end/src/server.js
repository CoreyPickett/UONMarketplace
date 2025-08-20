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

}

/*   
// below is code for once the front-end is built and implemented as files in the back-end

app.use(express.static(path.join(__dirname, '../dist')))

app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
})
*/


//GET request for a listing
app.get('/api/marketplace/:id', async (req, res) => {
  const { id } = req.params;
  const listing = await db.collection('items').findOne({ _id: new ObjectId(id) }); //Gets idividual item based on unique ID
  res.json(listing);
});

//GET request for Whole Marketplace
app.get('/api/marketplace/', async (req, res) => {
  try {
    const listings = await db.collection('items').find().toArray(); //Lists all items in 'items' array
    res.status(200).json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});



//Verification for a logged in user
const verifyUser = async (req, res, next) => {
  const { authtoken } = req.headers;

  if (!authtoken) {
    return res.sendStatus(400);
  }

  try {
    const user = await admin.auth().verifyIdToken(authtoken);
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.sendStatus(401);
  }
};


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

//POST request for adding comments
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
app.get('/api/marketplace/create-listing/s3-upload-url', async (req, res) => {
  const { filename, filetype } = req.query;

  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]; //Sanity check for valid image types
  if (!validTypes.includes(filetype)) {
    return res.status(400).send("Invalid file type");
  }

  if (!filename || !filetype) { //Sanity check for incomplete query
    return res.status(400).send("Missing filename or filetype");
  }


  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, ''); //Remove unwanted characters
  const key = `listings/${Date.now()}_${safeFilename}`;

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Expires: 30,
    ContentType: filetype,
  };

  try { //Connect to AWS for image upload to bucket
    const uploadURL = await s3.getSignedUrlPromise('putObject', params);
    res.json({ uploadURL, key });
  } catch (error) {
    console.error("S3 URL error:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});


//GET request to search user by email
app.get('/api/admin/search-user', async (req, res) => {
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
      image,
      seller,
    } = req.body;

    const newListing = {
      title,
      description,
      category,
      price,
      condition,
      location,
      delivery_options,
      image,
      seller,
      //  ownership fields for Profile "My Listings"
      ownerUid: uid || null,
      ownerEmail: email || null,

      upvotes: 0,
      upvoteIds: [],
      comments: [],
      //  createdAt to help sort later
      createdAt: new Date(),
    };

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

// GET request for Whole Marketplace
app.get('/api/marketplace/', async (req, res) => {
  try {
    const listings = await db.collection('items')
      .find()
      .sort({ createdAt: -1 })       // <- optional
      .toArray();
    res.status(200).json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// GET request for Advanced Seacrh Function
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

// \/\/\/\/ Stuff for messages below \/\/\/\/ -------------------------------------------------------------------------

//GET request for a messages
app.get('/api/messages/:id', async (req, res) => {
  const { id } = req.params;
  const messages = await db.collection('messages').findOne({ _id: new ObjectId(id) }); //Gets idividual messages based on unique ID
  res.json(messages);
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
app.post('/api/messages/create-message', verifyUser, async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Missing request body" });
    }

    const { uid, email } = req.user || {};

    const {
      reciverIds,
      reciverEmails,
      messages,
    } = req.body;

    const newMessages = {
      reciverIds,
      reciverEmails,
      messages,
      //  ownership fields for Profile "messages"
      ownerUid: uid || null,
      ownerEmail: email || null,

      //  createdAt to help sort later
      createdAt: new Date(),
    };

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
    return res.status(500).json({ success: false, message: 'Unexpected error' });
  }
});

//DELETE request for deleting a listing
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
app.post('/api/messages/:id/comments', verifyUser, async (req, res) => {
  const { id } = req.params;
  const { postedBy, text } = req.body;
  const newmessage = { postedBy, text };

  const updatedMessages = await db.collection('messages').findOneAndUpdate({ _id: new ObjectId(id) }, { //Get messages based on unique ID
    $push: { messages: newmessage }
  }, {
    returnDocument: 'after',
  });

  res.json(updatedMessages); //Update Messages
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