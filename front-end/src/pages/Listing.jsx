//Individual Listing 
import { useMemo, useState, useEffect } from 'react';
import { useParams, useLoaderData } from 'react-router-dom';
import axios from 'axios';
import useUser from '../useUser';
import "./Listing.css"

const formatAUD = (n) =>
  Number.isFinite(Number(n))
    ? Number(n).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })
    : n;

export default function Listing() {
  const { id } = useParams();
  const listing = useLoaderData();
  const { isLoading, user } = useUser();

  const [upvotes, setUpvotes] = useState(Number(listing?.upvotes || 0));
  const [didUpvote, setDidUpvote] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);


  // If the loader delivers new data (nav), sync state
  useEffect(() => {
    setUpvotes(Number(listing?.upvotes || 0));
    setDidUpvote(false);
  }, [listing?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const alreadyUpvoted = useMemo(() => {
    if (!listing?.upvoteIds || !user?.uid) return false;
    return listing.upvoteIds.includes(user.uid);
  }, [listing?.upvoteIds, user?.uid]);

  const canUpvote = !!user && !didUpvote && !alreadyUpvoted;

  async function onUpvoteClicked() {
    try {
      if (!user) return;
      const token = await user.getIdToken();
      const headers = { authtoken: token };
      const res = await axios.post(`/api/marketplace/${id}/upvote`, null, { headers });

      // Server returns { success, listing, upvotes }
      const next = res.data?.upvotes ?? res.data?.listing?.upvotes;
      if (typeof next === 'number') setUpvotes(next);
      setDidUpvote(true);
    } catch (e) {
      console.error('Upvote failed:', e);
      alert('Upvote failed. Please try again.');
    }
  }

  if (!listing) {
    return (
      <>
        <h1>Listing not found</h1>
        <p>That item may have been removed or never existed.</p>
      </>
    );
  }

  const bucket = import.meta.env.VITE_S3_BUCKET_NAME;
  const region = import.meta.env.VITE_AWS_REGION;

  const images = Array.isArray(listing.images) && listing.images.length > 0
  ? listing.images
  : [listing.image || '/placeholder-listing.jpg'];


  const priceText = formatAUD(listing.price);

  return (
    <div style={{ maxWidth: 980, margin: '16px auto', padding: '0 16px' }}>
      <h1 style={{ margin: '12px 0 16px' }}>{listing.title}</h1>

      <div
        style={{
          position: 'relative',
          height: 300,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 6px 18px rgba(0,0,0,0.10)',
          marginBottom: 18,
          background: '#e5e7eb',
        }}
      >
        <img
          src={images[currentImageIndex]}
          alt={`Image ${currentImageIndex + 1}`}
          onError={(e) => (e.currentTarget.src = '/placeholder-listing.jpg')}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />


        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentImageIndex((i) => (i === 0 ? images.length - 1 : i - 1))
              }
              style={{
                position: 'absolute',
                top: '50%',
                left: 12,
                transform: 'translateY(-50%)',
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: '50%',
                padding: '6px 10px',
                cursor: 'pointer',
              }}
            >
              ←
            </button>
            <button
              onClick={() =>
                setCurrentImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))
              }
              style={{
                position: 'absolute',
                top: '50%',
                right: 12,
                transform: 'translateY(-50%)',
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: '50%',
                padding: '6px 10px',
                cursor: 'pointer',
              }}
            >
              →
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
          <div style={{ textAlign: 'center', fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
            Image {currentImageIndex + 1} of {images.length}
          </div>
        )}

      {/* Badges below image */}
      <div style={{ display: 'flex', gap: 8, margin: '8px 0 18px 0' }}>
        {listing.condition ? <span className="badge">{listing.condition}</span> : null}
        {'price' in listing ? <span className="badge badge-primary">{priceText}</span> : null}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {user ? (
          <button
            onClick={onUpvoteClicked}
            disabled={!canUpvote}
            style={{
              background: canUpvote ? '#003057' : '#9aa6b2',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 14px',
              cursor: canUpvote ? 'pointer' : 'not-allowed',
              fontWeight: 800,
            }}
          >
            {alreadyUpvoted || didUpvote ? 'Upvoted' : 'Upvote'}
          </button>
        ) : (
          <span style={{ color: '#6b7280' }}>Sign in to upvote</span>
        )}
        <span style={{ color: '#374151' }}>
          This listing has <strong>{upvotes}</strong> upvote{upvotes === 1 ? '' : 's'}
        </span>
      </div>

      {/* Details */}
      <section
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: 16,
          lineHeight: 1.55,
        }}
      >
        <p style={{ marginTop: 0 }}>
          <strong>Description:</strong> {listing.description}
        </p>
        {listing.category && (
          <p>
            <strong>Category:</strong> {listing.category}
          </p>
        )}
        {'price' in listing && (
          <p>
            <strong>Price:</strong> {priceText}
          </p>
        )}
        {listing.condition && (
          <p>
            <strong>Condition:</strong> {listing.condition}
          </p>
        )}
        {listing.location && (
          <p>
            <strong>Location:</strong> {listing.location}
          </p>
        )}
        {Array.isArray(listing.delivery_options) && listing.delivery_options.length > 0 && (
          <p>
            <strong>Delivery Options:</strong> {listing.delivery_options.join(', ')}
          </p>
        )}
        {listing.seller && (
          <p>
            <strong>Seller:</strong> {listing.ownerEmail.split("@")[0]}
          </p>
        )}
      </section>
      <div className="listing-actions-row">
        <button className="ListingOptions">Buy Now</button>
        <button className="ListingOptions secondary">Save</button>
        <button className="ListingOptions secondary">Message seller</button>
      </div>
    </div>
  );
}
