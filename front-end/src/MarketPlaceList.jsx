//File for the display of listings on the marketplace
import { Link } from "react-router-dom";
import './MarketPlaceList.css';

export default function MarketPlaceList({ listings }) {
  const bucket = import.meta.env.VITE_S3_BUCKET_NAME;
  const region = import.meta.env.VITE_AWS_REGION;

  return (
    <div className="marketplace-grid">
      {Array.isArray(listings) && listings.length > 0 ? (
        listings.map((listing) => {
          const imageKey = Array.isArray(listing.images) && typeof listing.images[0] === "string"
            ? listing.images[0]
            : null;

          const thumbnail = imageKey?.startsWith("http")
            ? imageKey
            : imageKey
              ? `https://${bucket}.s3.${region}.amazonaws.com/${imageKey}`
              : listing.image?.startsWith("http")
                ? listing.image
                : listing.image
                  ? `https://${bucket}.s3.${region}.amazonaws.com/${listing.image}`
                  : "/placeholder-listing.jpg";

          return (
            <div key={listing._id} className="listing-card">
              <Link to={`/marketplace/${listing._id}`} className="listing-link">
                <div className="listing-image-wrapper">
                  <img
                    src={thumbnail}
                    alt={listing.title}
                    className="listing-image"
                    onError={(e) => (e.currentTarget.src = "/placeholder-listing.jpg")}
                  />
                </div>
                <div className="listing-info">
                  <h3 className="listing-title">{listing.title}</h3>
                  <p className="listing-category">Condition: {listing.condition}</p>
                  <p className="listing-price">{listing.price}</p>
                  <p className="listing-content">{listing.content?.[0]}</p>
                  <p className="listing-name">Listed by {listing.ownerEmail.split("@")[0]}</p>
                </div>
              </Link>
            </div>
          );
        })
      ) : (
        <p className="no-listings-message">No listings available yet.</p>
      )}
    </div>
  );
}
