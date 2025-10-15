import React, { useEffect, useMemo, useState } from "react";
import MarketPlaceList from "../MarketPlaceList";
import "./MarketPlace.css";

export default function MarketPlace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("recent");
  const [rangeNote, setRangeNote] = useState("");

  // load listings
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
    return () => {
      alive = false;
    };
  }, []);

  // range warning note
  useEffect(() => {
    const min = minPrice === "" ? undefined : Number(minPrice);
    const max = maxPrice === "" ? undefined : Number(maxPrice);
    if (
      min !== undefined &&
      max !== undefined &&
      !Number.isNaN(min) &&
      !Number.isNaN(max) &&
      max < min
    ) {
      setRangeNote("Max price is below Min price.");
    } else {
      setRangeNote("");
    }
  }, [minPrice, maxPrice]);

  // helper: safest “recent” time (updatedAt → createdAt → ObjectId time → 0)
  const getTime = (l) => {
    if (l?.updatedAt) {
      const t = Date.parse(l.updatedAt);
      if (!Number.isNaN(t)) return t;
    }
    if (l?.createdAt) {
      const t = Date.parse(l.createdAt);
      if (!Number.isNaN(t)) return t;
    }
    // ObjectId timestamp fallback (if hex string)
    const id = typeof l?._id === "string" ? l._id : String(l?._id || "");
    if (id && id.length >= 8) {
      const sec = parseInt(id.slice(0, 8), 16);
      if (Number.isFinite(sec)) return sec * 1000;
    }
    return 0;
  };

  const filteredListings = useMemo(() => {
    let out = Array.isArray(listings) ? listings.filter((l) => !l.sold) : [];
    const q = search.trim().toLowerCase();

    // text search
    if (q) {
      out = out.filter((l) =>
        [l?.title, l?.description, l?.category, l?.location, l?.ownerEmail]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    // category
    if (category) out = out.filter((l) => String(l?.category) === category);

    // price range (accept numbers or numeric strings)
    const min = minPrice !== "" ? Number(minPrice) : undefined;
    const max = maxPrice !== "" ? Number(maxPrice) : undefined;

    if (!Number.isNaN(min) && min !== undefined) {
      out = out.filter((l) => {
        const p = Number(l?.price);
        return Number.isFinite(p) && p >= min;
        });
    }
    if (!Number.isNaN(max) && max !== undefined) {
      out = out.filter((l) => {
        const p = Number(l?.price);
        return Number.isFinite(p) && p <= max;
      });
    }

    // sort
    out.sort((a, b) => {
      switch (sort) {
        case "priceAsc":
          return (Number(a?.price) || Infinity) - (Number(b?.price) || Infinity);
        case "priceDesc":
          return (Number(b?.price) || -Infinity) - (Number(a?.price) || -Infinity);
        case "titleAsc":
          return String(a?.title || "").localeCompare(String(b?.title || ""));
        case "recent":
        default:
          return getTime(b) - getTime(a);
      }
    });

    return out;
  }, [listings, search, category, minPrice, maxPrice, sort]);

  const handleReset = () => {
    setSearch("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSort("recent");
    setRangeNote("");
  };

  const searchDisabled = useMemo(() => {
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
    )
      return true;
    return false;
  }, [minPrice, maxPrice]);

  return (
    <div className="mp-wrap">
      {/* Sticky toolbar */}
      <div className="mp-toolbar">
        {/* Big search bar */}
        <div className="mp-search">
          <input
            className="mp-input"
            type="text"
            placeholder="Search Marketplace…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search listings"
          />
        </div>

        {/* Filter row */}
        <div className="mp-row">
          <select
            className="mp-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            <option value="Books">Books</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Furniture">Furniture</option>
            <option value="Other">Other</option>
          </select>

          {/* Min/Max kept snug inside one box */}
          <div className="mp-price">
            <input
              className="mp-price-input"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              aria-label="Minimum price"
            />
            <span className="mp-price-sep">–</span>
            <input
              className="mp-price-input"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              aria-label="Maximum price"
            />
          </div>

          <select
            className="mp-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort results"
          >
            <option value="recent">Most Recent</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="titleAsc">Title A–Z</option>
          </select>

          {/* Actions: Search (acts as apply/confirm) + Reset */}
          <div className="mp-actions">
            <button
              className="mp-btn"
              disabled={searchDisabled}
              onClick={() => {}}
              title={searchDisabled ? "Fix price inputs to apply" : "Apply filters"}
            >
              Search
            </button>
            <button className="mp-btn mp-btn-ghost" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>

        {rangeNote && <div className="mp-note">{rangeNote}</div>}
      </div>

      {/* Results */}
      <div className="mp-results">
        <h2 className="mp-heading">Current Listings</h2>
        {loading ? (
          <p>Loading…</p>
        ) : filteredListings.length === 0 ? (
          <p>No listings found.</p>
        ) : (
          <MarketPlaceList listings={filteredListings} />
        )}
      </div>
    </div>
  );
}
