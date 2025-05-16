import { useState } from 'react';
import { useParams, useLoaderData } from 'react-router-dom';
import axios from 'axios';
import listings from '../listing-content';

export default function Listing() {
  const { name } = useParams();
  const { upvotes: initialUpvotes} = useLoaderData();
  const [upvotes, setUpvotes] = useState(initialUpvotes);

  const listing = listings.find(a => a.name === name);

  async function onUpvoteClicked() {
    const response = await axios.post('/api/marketplace/' + name + '/upvote');
    const updatedListingData = response.data;
    setUpvotes(updatedListingData.upvotes);
  }

  if (!listing) {
    return <h1>Listing not found</h1>;
  }

  return (
    <>
      <h1>{listing.title}</h1>
      <button onClick={onUpvoteClicked}>Upvote</button>
      <p>This listing has {upvotes} upvotes</p>
      {listing.content.map((p, index) => <p key={index}>{p}</p>)}
    </>
  );
}

export async function loader({ params }) {
  const response = await axios.get('/api/marketplace/' + params.name);
  const { upvotes } = response.data;
  return { upvotes};
}