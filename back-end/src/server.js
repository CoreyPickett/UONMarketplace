import express from 'express';

const listingInfo = [
  { name: 'friends-1001', upvotes: 0, comments: [] },
  { name: 'NuBot', upvotes: 0, comments: [] },
  { name: 'parking-spot', upvotes: 0, comments: [] },
]

const app = express();

app.use(express.json());

app.post('/api/marketplace/:name/upvote', (req, res) => {
  const listing = listingInfo.find(a => a.name === req.params.name);
  listing.upvotes += 1;

  res.json(listing);
});

app.post('/api/marketplace/:name/comments', (req, res) => {
  const { name } = req.params;
  const { postedBy, text } = req.body;

  const listing = listingInfo.find(a => a.name === name);

  listing.comments.push({
    postedBy,
    text,
  });

  res.json(listing);
});

app.listen(8000, function() {
  console.log('Server is listening on port 8000');
});