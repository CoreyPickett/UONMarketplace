import { useParams } from 'react-router-dom';
import listings from '../listing-content';

export default function Listing() {

  const { name } = useParams();

  const listing = listings.find(a => a.name === name);

  if (!listing) {
    return <h1>Listing not found</h1>;
  }

  return (
    <>
      <h1>{listing.title}</h1>
      {listing.content.map((p, index) => <p key={index}>{p}</p>)}
    </>
  );

}