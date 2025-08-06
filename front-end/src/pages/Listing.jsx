//Individual Listing page, currently with upvotes implemented
import { useState } from 'react';
import { useParams, useLoaderData } from 'react-router-dom';
import axios from 'axios';
import useUser from '../useUser';

export default function Listing() {
  const { name } = useParams();
  const listing = useLoaderData();
  const [upvotes, setUpvotes] = useState(listing.upvotes);
  const { isLoading, user } = useUser();

  async function onUpvoteClicked() {
    const token = user && await user.getIdToken();
    const headers = token ? { authtoken: token } : {};
    const response = await axios.post('/api/marketplace/' + name + '/upvote', null, { headers });
    const updatedListingData = response.data;
    setUpvotes(updatedListingData.upvotes);
  }

  if (!listing) {
    return <h1>Listing not found</h1>;
  }

  return (
    <>
      <h1>{listing.title}</h1>
      {user && <button onClick={onUpvoteClicked}>Upvote</button>}
      <p>This listing has {upvotes} upvotes</p>
      {listing.content.map((p, index) => <p key={index}>{p}</p>)}
    </>
  );
}

export async function loader({ params }) {
  const response = await axios.get('/api/marketplace/' + params.name);
  return response.data;
}