//Backend server, currently integrated with MongoDb locally
import express from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';


//import path from 'path';

//import {fileURLToPath } from 'url';
//const __filename = fileURLToPath(import.meta.url);   // these are for when the front-end final build is ready
//const __dirname = path.__dirname(__filename);        // the load the dist file when it is in the back-end once built 

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
  const listing = await db.collection('listings').findOne({ name });
  res.json(listing);
});

//Post request for updating upvotes
app.post('/api/marketplace/:name/upvote', async (req, res) => {
  const { name } = req.params;

  const updatedListing = await db.collection('listings').findOneAndUpdate({ name }, {
    $inc: { upvotes: 1 }
  }, {
    returnDocument: "after",
  });

  res.json(updatedListing);
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