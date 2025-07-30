//Backend server, currently integrated with MongoDb locally
import express from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';
import admin from 'firebase-admin';
import fs from 'fs';


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

  db = client.db('test-marketplace-db');
}

/*   
// below is code for once the front-end is built and implemented as files in the back-end

app.use(express.static(path.join(__dirname, '../dist')))

app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
})
*/

//Get request for a listing
app.get('/api/marketplace/:name', async (req, res) => {
  const { name } = req.params;
  const listing = await db.collection('items').findOne({ name });
  res.json(listing);
});

// for getting the entire collection of listings
app.get('/api/marketplace/', async (req, res) => {
  const listings = db.collection('items').find() // queries all in the collection 
  res.json(listings);
});



//Verification for a logged in user
app.use(async function(req, res, next) {
  const { authtoken } = req.headers;

  if (authtoken) {
    const user = await admin.auth().verifyIdToken(authtoken);
    req.user = user;
  } else {
    res.sendStatus(400);
  }

  next();
});

//Post request for updating upvotes
app.post('/api/marketplace/:name/upvote', async (req, res) => {
  const { name } = req.params;
  const { uid } = req.user;

  const Listing = await db.collection('listings').findOneAndUpdate({ name });

  const upvoteIds = listing.upvoteIds || [];
  const canUpvote = uid && !upvoteIds.includes(uid);

  if (canUpvote){
    const updatedListing = await db.collection('listings').findOneAndUpdate({ name }, {
        $inc: { upvotes: 1 },
        $push: { upvoteIds: uid },
    }, {
      returnDocument: "after",
    });

    res.json(updatedListing);
  }
    else {
    res.sendStatus(403);
  }
});

//Post request for adding comments
app.post('/api/marketplace/:name/comments', async (req, res) => {
  const { name } = req.params;
  const { postedBy, text } = req.body;
  const newComment = { postedBy, text };

  const updatedListing = await db.collection('listings').findOneAndUpdate({ name }, {
    $push: { comments: newComment }
  }, {
    returnDocument: 'after',
  });

  res.json(updatedListing);
});

// I think this is the right tag
// for vreating a new listing
app.post('/api/marketplace/CreateListing', async (req, res) => { 


  //Get all var and parameters
  const {name} = ;
  const {des} = ;
  const {cat} = ;
  const {AUD} = ;
  const {quantity} = ;
  const {condition} = ;
  const {location} = ;
  const {delivery} = ;
  const {tag} = ;
  const {image} = ;

  await db. collection('item').insertOne(
 	{
    name: {name},
    description: {des},
    category: {cat},
    price: {AUD},
    quantity: { quantity },
    condition: {condition},
    location: {location},
    delivery_options: {delivery},
		tagsOrKeywords: {tag},
		image: {image},
    name: {name},
    upvotes: 0,
    upvoteIds: [],
    comments: []
  });
});

app.post('/api/marketplace/:name', async (req, res) => { 

  const {name} = req.params;

  

  try {
  			 await db.collection('item').deleteOne( { name: {name} } )
      } catch (e) {res.(e);}


});

// this just allows for the enviroment to choose what port it runs on with the defult of 8000
const PORT = process.env.PORT || 8000;

//Function for starting server
async function start() {
  await connectToDB();
  app.listen(PORT, function() {
    console.log('Server is listening on port ' + PORT);
  });
}

start();