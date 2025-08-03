//File for the display of listings on the marketplace

import { Link } from "react-router-dom";
import './MarketPlaceList.css';

export default function MarketPlaceList({ listings }) {
  return (
    <div className="marketplace-grid">
      {listings.map((listing) => (
        <div key={listing.name} className="listing-card">
          <Link to={`/marketplace/${listing.name}`} className="listing-link">
            <div className="listing-image-wrapper">
              <img
                src={listing.image}
                alt={listing.title}
                className="listing-image"
              />
            </div>
            <div className="listing-info">
              <h3 className="listing-title">{listing.title}</h3>
              <p className="listing-category"> Conditon: {listing.condition}</p>
              <p className="listing-price">{listing.price}</p>
              <p className="listing-content">{listing.content[0]}</p>
              <p className="listing-name"> Listed by {listing.seller}</p>

            
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}