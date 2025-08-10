import React, { useEffect, useMemo, useState } from "react";
import MarketPlaceList from "../MarketPlaceList";
import "./MarketPlace.css";

const toParams = (obj) =>
  new URLSearchParams(
    Object.entries(obj).reduce((acc, [k, v]) => {
      if (v !== "" && v !== undefined && v !== null) acc[k] = v;
      return acc;
    }, {})
  ).toString();

export default function MarketPlace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [rangeNote, setRangeNote] = useState("");

  // initial load (all listings)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/marketplace/");
        const data = await res.json();
        if (alive) setListings(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load listings:", e);
        if (alive) setListings([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // validate prices; if max < min, auto-correct and show note
  const validatePrices = () => {
    const min = minPrice === "" ? undefined : Number(minPrice);
    const max = maxPrice === "" ? undefined : Number(maxPrice);
    if (
      min !== undefined &&
      max !== undefined &&
      !Number.isNaN(min) &&
      !Number.isNaN(max) &&
      max < min
    ) {
      setMaxPrice(String(min));
      setRangeNote("Max price adjusted to match Min price.");
      return { minPrice: String(min), maxPrice: String(min) };
    }
    setRangeNote("");
    return { minPrice, maxPrice };
  };

  const handleSearch = async () => {
    const { minPrice: minAdj, maxPrice: maxAdj } = validatePrices();
    try {
      setLoading(true);

      const hasFilters =
        (search && search.trim()) ||
        category ||
        (minAdj !== "" && !Number.isNaN(Number(minAdj))) ||
        (maxAdj !== "" && !Number.isNaN(Number(maxAdj)));

      const url = hasFilters
        ? `/api/search?${toParams({
            query: search.trim(),
            category,
            minPrice: minAdj || "",
            maxPrice: maxAdj || "",
          })}`
        : "/api/marketplace/";

      const res = await fetch(url);
      const data = await res.json();
      setListings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Search failed:", e);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setSearch("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setRangeNote("");
    try {
      setLoading(true);
      const res = await fetch("/api/marketplace/");
      const data = await res.json();
      setListings(Array.isArray(data) ? data : []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  // Enter-to-search in the text field
  const onSearchKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // disable Search when numbers are invalid
  const buttonDisabled = useMemo(() => {
    const min = Number(minPrice);
    const max = Number(maxPrice);
    if (minPrice !== "" && Number.isNaN(min)) return true;
    if (maxPrice !== "" && Number.isNaN(max)) return true;
    if (
      minPrice !== "" &&
      maxPrice !== "" &&
      !Number.isNaN(min) &&
      !Number.isNaN(max) &&
      max < min
    ) {
      return true;
    }
    return false;
  }, [minPrice, maxPrice]);

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
            onKeyDown={onSearchKey}
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

        {/* Min above Max (stacked) */}
        <div className="filter-group">
          <label>Min Price</label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="e.g. 10"
            min="0"
          />

          <label>Max Price</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="e.g. 100"
            min="0"
          />
        </div>

        {rangeNote && <div className="range-note">{rangeNote}</div>}

        <div className="filter-buttons">
          <button
            className="search-btn"
            onClick={handleSearch}
            disabled={buttonDisabled}
            type="button"
          >
            Search
          </button>
          <button className="reset-btn" onClick={handleReset} type="button">
            Reset
          </button>
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
}
