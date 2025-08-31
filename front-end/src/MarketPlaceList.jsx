//File for the display of listings on the marketplace
import { Link } from "react-router-dom";
import './MarketPlaceList.css';

export default function MarketPlaceList({ listings }) {
  return (
    <div className="marketplace-grid">
      {Array.isArray(listings) && listings.length > 0 ? (
        listings.map((listing) => (
          <div key={listing._id} className="listing-card">
            <Link to={`/marketplace/${listing._id}`} className="listing-link">
              <div className="listing-image-wrapper">
                {listing.image && (
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="listing-image"
                  />
                )}
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
        ))
      ) : (
        <p className="no-listings-message">No listings available yet.</p>
      )}
    </div>
  );
}