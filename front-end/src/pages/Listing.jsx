//Individual Listing page, currently with upvotes implemented
import { useState } from 'react';
import { useParams, useLoaderData } from 'react-router-dom';
import axios from 'axios';
import useUser from '../useUser';

export default function Listing() {
  const { id } = useParams();
  const listing = useLoaderData();
  const [upvotes, setUpvotes] = useState(listing.upvotes);
  const { isLoading, user } = useUser();

  async function onUpvoteClicked() {
    const token = user && await user.getIdToken();
    const headers = token ? { authtoken: token } : {};
    const response = await axios.post('/api/marketplace/' + id + '/upvote', null, { headers });
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
      <p><strong>Listing Decription:</strong> {listing.description}</p>
      <p><strong>Category:</strong> {listing.category}</p>
      <p><strong>Price:</strong> ${listing.price}</p>
      <p><strong>Condition:</strong> {listing.condition}</p>
      <p><strong>Location:</strong> {listing.location}</p>
      <p><strong>Delivery Options:</strong> {listing.delivery_options?.join(', ')}</p>

    </>
  );
}

export async function loader({ params }) {
  const response = await axios.get('/api/marketplace/' + params.id);
  return response.data;
}