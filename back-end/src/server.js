//Backend server, currently integrated with MongoDb locally
import express from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';
import admin from 'firebase-admin';
import fs from 'fs';
import { ObjectId } from 'mongodb';


//import path from 'path';

//import {fileURLToPath } from 'url';
//const __filename = fileURLToPath(import.meta.url);   // these are for when the front-end final build is ready
//const __dirname = path.__dirname(__filename);        // the load the dist file when it is in the back-end once built 

const credentials = JSON.parse(
  fs.readFileSync('./credentials.json')
);

admin.initializeApp({
  credential: admin.credential.cert(credentials)
});

const app = express();

app.use(express.json());

let db;

async function connectToDB() {
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
  console.log("Connected to MongoDB");
  console.log("Using database:", db.databaseName);

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
  const listing = await db.collection('items').findOne({ _id: new ObjectId(id) });
  res.json(listing);
});

//GET request for Whole Marketplace
app.get('/api/marketplace/', async (req, res) => {
  try {
    const listings = await db.collection('items').find().toArray();
    res.status(200).json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});




//Verification for a logged in user
app.use(async function(req, res, next) {
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
});

//POST request for updating upvotes
app.post('/api/marketplace/:id/upvote', async (req, res) => {
  const { id } = req.params;
  const { uid } = req.user;

  if (!uid) {
    return res.status(401).json({ error: "User ID missing from request" });
  }

  try {
    const listing = await db.collection('items').findOne({ _id: new ObjectId(id) });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const upvoteIds = listing.upvoteIds || [];
    const canUpvote = !upvoteIds.includes(uid);

    if (!canUpvote) {
      return res.status(403).json({ error: "User has already upvoted" });
    }

    const updatedListing = await db.collection('items').findOneAndUpdate(
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
app.post('/api/marketplace/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { postedBy, text } = req.body;
  const newComment = { postedBy, text };

  const updatedListing = await db.collection('items').findOneAndUpdate({ _id: new ObjectId(id) }, {
    $push: { comments: newComment }
  }, {
    returnDocument: 'after',
  });

  res.json(updatedListing);
});


//POST request for creating a new listing
app.post('/api/marketplace/create-listing', async (req, res) => {
  console.log("Incoming listing data:", req.body);
  try {

    if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Missing request body" });
    }


    const {
      title,
      description,
      category,
      price,
      quantity,
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
      quantity,
      condition,
      location,
      delivery_options,
      image,
      seller,
      upvotes: 0,
      upvoteIds: [],
      comments: []
    };

    console.log("Received listing:", newListing);
    console.log("Using DB:", db?.databaseName);



    console.log("About to insert listing...");
    const result = await db.collection('items').insertOne(newListing);
    console.log("Insert result:", result);

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



//POST request for deleting a listing
app.post('/api/marketplace/:name', async (req, res) => { 

  const {name} = req.params;

  try {
  			 await db.collection('items').deleteOne( { name: {name} } )
      } catch (e) {res.sendStatus(400);}
});

const PORT = process.env.PORT || 8000; // this just allows for the enviroment to choose what port it runs on with the defult of 8000

//Function for starting server
async function start() {
  await connectToDB();
  app.listen(PORT, function() {
    console.log('Server is listening on port ' + PORT);
  });
}

start();