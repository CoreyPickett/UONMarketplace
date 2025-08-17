// src/Admin.jsx
import { useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";
import axios from "axios";
import "./Admin.css";

export default function Admin() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("recent"); // recent | priceAsc | priceDesc | titleAsc
  const [confirmId, setConfirmId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/marketplace/");
        const data = await res.json();
        if (alive) setListings(Array.isArray(data) ? data : []);
      } catch (e) {
        if (alive) setError("Failed to load listings.");
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    let out = [...listings];

    // text search
    const qq = q.trim().toLowerCase();
    if (qq) {
      out = out.filter((l) =>
        [l.title, l.description, l.category, l.location, l.seller]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(qq))
      );
    }

    // category
    if (category) {
      out = out.filter((l) => String(l.category) === category);
    }

    // price range
    const min = minPrice !== "" ? Number(minPrice) : undefined;
    const max = maxPrice !== "" ? Number(maxPrice) : undefined;
    if (!Number.isNaN(min) && min !== undefined) {
      out = out.filter((l) => typeof l.price === "number" ? l.price >= min : true);
    }
    if (!Number.isNaN(max) && max !== undefined) {
      out = out.filter((l) => typeof l.price === "number" ? l.price <= max : true);
    }

    // sort
    out.sort((a, b) => {
      if (sort === "priceAsc") return (a.price ?? Infinity) - (b.price ?? Infinity);
      if (sort === "priceDesc") return (b.price ?? -Infinity) - (a.price ?? -Infinity);
      if (sort === "titleAsc") return String(a.title || "").localeCompare(String(b.title || ""));
      // "recent" fallback: by _id timestamp if present, else by title
      const aId = String(a._id || "");
      const bId = String(b._id || "");
      return bId.localeCompare(aId);
    });

    return out;
  }, [listings, q, category, minPrice, maxPrice, sort]);

  const resetFilters = () => {
    setQ("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSort("recent");
  };

  const onDelete = (id) => setConfirmId(id);

  const confirmDelete = async () => {
    if (!confirmId) return;
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        alert("You must be signed in as an admin to delete.");
        return;
      }
      const token = await user.getIdToken();
      await axios.delete(`/api/marketplace/${confirmId}`, { headers: { authtoken: token } });
      setListings((xs) => xs.filter((l) => String(l._id) !== String(confirmId)));
      setConfirmId(null);
    } catch (e) {
      console.error(e);
      alert("Failed to delete listing.");
      setConfirmId(null);
    }
  };

  return (
    <main className="admin">
      <header className="admin-header">
        <div>
          <h1>Admin Console</h1>
          <p className="muted">Moderate listings, manage content, and keep the marketplace tidy.</p>
        </div>
      </header>

      <section className="admin-card">
        <div className="toolbar">
          <div className="inputs">
            <div className="searchbox">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title, description, seller, location…"
                aria-label="Search listings"
              />
              {q && (
                <button className="icon-btn" onClick={() => setQ("")} title="Clear">✕</button>
              )}
            </div>

            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
              <option value="">All categories</option>
              <option value="Books">Books</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Furniture">Furniture</option>
              <option value="Other">Other</option>
            </select>

            <div className="range">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="Min $"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span>–</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="Max $"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
              <option value="recent">Sort: Recent</option>
              <option value="priceAsc">Price ↑</option>
              <option value="priceDesc">Price ↓</option>
              <option value="titleAsc">Title A–Z</option>
            </select>
          </div>

          <div className="actions">
            <button className="btn" onClick={resetFilters}>Reset</button>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}

        {loading ? (
          <div className="skeleton-table" aria-busy="true">
            <div className="row" />
            <div className="row" />
            <div className="row" />
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="hide-sm">Category</th>
                    <th>Price (AUD)</th>
                    <th className="hide-md">Seller</th>
                    <th>Upvotes</th>
                    <th style={{ width: 1 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center" }}>
                        <div className="empty">No results. Try adjusting filters.</div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((l) => (
                      <tr key={String(l._id)}>
                        <td>
                          <div className="item-cell">
                            <div className="thumb">
                              <img
                                src={
                                  l.image?.startsWith("http")
                                    ? l.image
                                    : l.image
                                    ? `/image/${l.image}`
                                    : "/placeholder-listing.jpg"
                                }
                                alt={l.title || "Listing"}
                                onError={(e) => (e.currentTarget.src = "/placeholder-listing.jpg")}
                              />
                            </div>
                            <div className="meta">
                              <div className="title">{l.title || "Untitled"}</div>
                              <div className="sub muted">{l.location || "Location N/A"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="hide-sm">{l.category || "—"}</td>
                        <td>
                          {typeof l.price === "number"
                            ? l.price.toLocaleString("en-AU", { style: "currency", currency: "AUD" })
                            : "—"}
                        </td>
                        <td className="hide-md">{l.seller || "—"}</td>
                        <td>{l.upvotes ?? 0}</td>
                        <td>
                          <button className="icon-btn danger" title="Delete listing" onClick={() => onDelete(l._id)}>
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span className="muted">
                Showing {filtered.length} of {listings.length}
              </span>
            </div>
          </>
        )}
      </section>

      {confirmId && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Delete listing?</h3>
            <p className="muted">
              This action can’t be undone. The listing will be removed permanently.
            </p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
              <button className="btn" onClick={() => setConfirmId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
