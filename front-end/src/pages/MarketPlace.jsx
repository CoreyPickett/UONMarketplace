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
  const [sort, setSort] = useState("recent");

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

  const filteredListings = useMemo(() => {
    let out = [...listings];
    const qq = search.trim().toLowerCase();

    if (qq) {
      out = out.filter((l) =>
        [l.title, l.description, l.category, l.location, l.ownerEmail]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(qq))
      );
    }

    if (category) out = out.filter((l) => String(l.category) === category);

    const min = minPrice !== "" ? Number(minPrice) : undefined;
    const max = maxPrice !== "" ? Number(maxPrice) : undefined;

    if (!Number.isNaN(min) && min !== undefined) {
      out = out.filter((l) => typeof l.price === "number" && l.price >= min);
    }

    if (!Number.isNaN(max) && max !== undefined) {
      out = out.filter((l) => typeof l.price === "number" && l.price <= max);
    }

    out.sort((a, b) => {
      if (sort === "priceAsc") return (a.price ?? Infinity) - (b.price ?? Infinity);
      if (sort === "priceDesc") return (b.price ?? -Infinity) - (a.price ?? -Infinity);
      if (sort === "titleAsc") return String(a.title || "").localeCompare(String(b.title || ""));
      return String(b._id || "").localeCompare(String(a._id || "")); // recent fallback
    });

    return out;
  }, [listings, search, category, minPrice, maxPrice, sort]);


  const handleReset = () => {
    setSearch("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setRangeNote("");
  };


  

  // Disable Search when numbers are invalid
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
          <label>Sort By</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Most Recent</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="titleAsc">Title A–Z</option>
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
          <MarketPlaceList listings={filteredListings} />
        )}
      </main>
    </div>
  );
}
