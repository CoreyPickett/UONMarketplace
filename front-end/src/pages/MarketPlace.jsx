import React, { useEffect, useMemo, useState } from "react";
import MarketPlaceList from "../MarketPlaceList";
import "./MarketPlace.css";

export default function MarketPlace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // price slider state
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 1000, step: 1 });

  const [sort, setSort] = useState("recent"); // recent | priceAsc | priceDesc | titleAsc | saved
  const [rangeNote, setRangeNote] = useState("");

  // helper to compute nice slider bounds from data
  const computePriceBounds = (arr) => {
    const prices = (Array.isArray(arr) ? arr : [])
      .map((l) => Number(l?.price))
      .filter((n) => Number.isFinite(n) && n >= 0);

    if (prices.length === 0) return { min: 0, max: 1000, step: 1 };

    const rawMin = Math.min(...prices);
    const rawMax = Math.max(...prices);
    const step = rawMax > 500 ? 5 : 1;
    const niceMin = Math.max(0, Math.floor(rawMin / step) * step);
    const niceMax = Math.ceil(rawMax / step) * step;
    return { min: niceMin, max: Math.max(niceMin + step, niceMax), step };
  };

  // load listings, then initialize slider to lowest/highest
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/marketplace/");
        const data = await res.json();
        if (!alive) return;
        const arr = Array.isArray(data) ? data : [];
        setListings(arr);

        const bounds = computePriceBounds(arr);
        setPriceBounds(bounds);
        setMinPrice(bounds.min); 
        setMaxPrice(bounds.max); 
      } catch (e) {
        console.error("Failed to load listings:", e);
        if (alive) {
          setListings([]);
          // keep default bounds, still show slider
          setPriceBounds({ min: 0, max: 1000, step: 1 });
          setMinPrice(0);
          setMaxPrice(1000);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // if bounds ever change (e.g., new data), keep values inside range without overriding user choices
  useEffect(() => {
    setMinPrice((v) => Math.min(Math.max(v, priceBounds.min), priceBounds.max));
    setMaxPrice((v) => Math.max(Math.min(v, priceBounds.max), priceBounds.min));
  }, [priceBounds.min, priceBounds.max]);

  // slider handlers
  const onMinSlide = (val) => {
    const v = Number(val);
    if (!Number.isFinite(v)) return;
    setMinPrice(Math.min(v, maxPrice));
  };
  const onMaxSlide = (val) => {
    const v = Number(val);
    if (!Number.isFinite(v)) return;
    setMaxPrice(Math.max(v, minPrice));
  };

  useEffect(() => {
    setRangeNote(minPrice > maxPrice ? "Max price is below Min price." : "");
  }, [minPrice, maxPrice]);

  // robust saves getter
  const getSaves = (l) => {
    if (typeof l?.saves === "number") return l.saves;
    if (Array.isArray(l?.saves)) return l.saves.length;
    if (typeof l?.saveCount === "number") return l.saveCount;
    if (Array.isArray(l?.savedBy)) return l.savedBy.length;
    if (l?.savedBy && typeof l.savedBy === "object") return Object.keys(l.savedBy).length;
    return 0;
  };

  const filteredListings = useMemo(() => {
    let out = Array.isArray(listings) ? [...listings] : [];
    const q = search.trim().toLowerCase();

    if (q) {
      out = out.filter((l) =>
        [l?.title, l?.description, l?.category, l?.location, l?.ownerEmail]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (category) out = out.filter((l) => String(l?.category) === category);

    out = out.filter((l) => {
      const p = Number(l?.price);
      if (!Number.isFinite(p)) return false;
      return p >= minPrice && p <= maxPrice;
    });

    out.sort((a, b) => {
      switch (sort) {
        case "saved": {
          const sa = getSaves(a);
          const sb = getSaves(b);
          if (sb !== sa) return sb - sa; // desc
          return String(b?._id || "").localeCompare(String(a?._id || ""));
        }
        case "priceAsc":
          return (Number(a?.price) || Infinity) - (Number(b?.price) || Infinity);
        case "priceDesc":
          return (Number(b?.price) || -Infinity) - (Number(a?.price) || -Infinity);
        case "titleAsc":
          return String(a?.title || "").localeCompare(String(b?.title || ""));
        case "recent":
        default:
          return String(b?._id || "").localeCompare(String(a?._id || ""));
      }
    });

    return out;
  }, [listings, search, category, minPrice, maxPrice, sort]);

  const handleReset = () => {
    setSearch("");
    setCategory("");
    setSort("recent");
    setMinPrice(priceBounds.min);
    setMaxPrice(priceBounds.max);
    setRangeNote("");
  };

  const sliderRangePct = useMemo(() => {
    const span = priceBounds.max - priceBounds.min || 1;
    const a = Math.max(0, Math.min(100, ((minPrice - priceBounds.min) / span) * 100));
    const b = Math.max(0, Math.min(100, ((maxPrice - priceBounds.min) / span) * 100));
    return { a, b };
  }, [minPrice, maxPrice, priceBounds]);

  return (
    <div className="mp-wrap">
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

        {/* Filters row */}
        <div className="mp-row">
          {/* Category */}
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

          {/* Price dual slider */}
          <div
            className="mp-dual"
            style={{
              ["--range-a"]: `${sliderRangePct.a}%`,
              ["--range-b"]: `${sliderRangePct.b}%`,
            }}
          >
            <div className="vals">
              <span>${Math.round(minPrice)}</span>
              <span>${Math.round(maxPrice)}</span>
            </div>
            <div className="sliders">
              <input
                className="mp-range-input"
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={priceBounds.step}
                value={minPrice}
                onChange={(e) => onMinSlide(e.target.value)}
                aria-label="Minimum price"
              />
              <input
                className="mp-range-input"
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={priceBounds.step}
                value={maxPrice}
                onChange={(e) => onMaxSlide(e.target.value)}
                aria-label="Maximum price"
              />
            </div>
          </div>

          {/* Sort select */}
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
            <option value="saved">Most Saved</option>
          </select>

          {/* Actions */}
          <div className="mp-actions">
            <button
              className={`mp-btn ${sort === "saved" ? "active" : ""}`}
              onClick={() => setSort("saved")}
              title="Sort by most saved"
            >
              Most Saved
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
