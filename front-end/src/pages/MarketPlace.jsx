import React, { useState, useEffect } from "react";
import MarketPlaceList from "../MarketPlaceList";
import "./MarketPlace.css";

const MarketPlace = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch filtered listings from the backend
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          query: search,
          category,
          minPrice,
          maxPrice,
        });

        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();
        setListings(data);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
        setListings([]);
      }
      setLoading(false);
    };

    fetchListings();
  }, [search, category, minPrice, maxPrice]);

  return (
    <div className="marketplace-container">
      <aside className="sidebar">
        <h3>Advanced Filters</h3>

        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
          />
        </div>

        <div className="filter-group">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All</option>
            <option value="Books">Books</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Furniture">Furniture</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Min Price</label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="e.g. 10"
          />
        </div>

        <div className="filter-group">
          <label>Max Price</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="e.g. 100"
          />
        </div>
      </aside>

      <main className="listing-section">
        <h2>Current Listings</h2>
        {loading ? (
          <p>Loading...</p>
        ) : listings.length === 0 ? (
          <p>No listings found.</p>
        ) : (
          <MarketPlaceList listings={listings} />
        )}
      </main>
    </div>
  );
};

export default MarketPlace;
