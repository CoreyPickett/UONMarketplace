// src/Admin.jsx
import { useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";
import axios from "axios";
import "./Admin.css";

// helper: limit text to N chars and add an ellipsis
const ellipsize = (str, max = 20) =>
  typeof str === "string" && str.length > max
    ? str.slice(0, max).trimEnd() + "…"
    : str ?? "";

export default function Admin() {
  // ----- Tabs -----
  const [tab, setTab] = useState("listings"); // "listings" | "users"

  // =======================
  // LISTINGS (existing)
  // =======================
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
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (tab === "users") {
      fetchAllUsers();
    }
  }, [tab]);

  const fetchAllUsers = async () => {
    try {
      setULoading(true);

      const user = getAuth().currentUser;
      if (!user) throw new Error("Not signed in");

      const token = await user.getIdToken();

      const res = await fetch("/api/admin/users", {
        headers: { authtoken: token },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const array = Array.isArray(data) ? data : (Array.isArray(data?.users) ? data.users : []);
      setUsers(array);
      setUError("");
    } catch (err) {
      console.error(err);
      setUsers([]);
      setUError("Failed to fetch users. Are you signed in as an admin?");
    } finally {
      setULoading(false);
    }
  };

  const filtered = useMemo(() => {
    let out = [...listings];
    const qq = q.trim().toLowerCase();

    if (qq) {
      out = out.filter((l) =>
        [l.title, l.description, l.category, l.location, l.seller]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(qq))
      );
    }
    if (category) out = out.filter((l) => String(l.category) === category);

    const min = minPrice !== "" ? Number(minPrice) : undefined;
    const max = maxPrice !== "" ? Number(maxPrice) : undefined;
    if (!Number.isNaN(min) && min !== undefined) {
      out = out.filter((l) => (typeof l.price === "number" ? l.price >= min : true));
    }
    if (!Number.isNaN(max) && max !== undefined) {
      out = out.filter((l) => (typeof l.price === "number" ? l.price <= max : true));
    }

    out.sort((a, b) => {
      if (sort === "priceAsc") return (a.price ?? Infinity) - (b.price ?? Infinity);
      if (sort === "priceDesc") return (b.price ?? -Infinity) - (a.price ?? -Infinity);
      if (sort === "titleAsc")
        return String(a.title || "").localeCompare(String(b.title || ""));
      const aId = String(a._id || "");
      const bId = String(b._id || "");
      return bId.localeCompare(aId); // "recent" by id desc if createdAt missing
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

  const onDeleteListing = (id) => setConfirmId(id);

  const confirmDeleteListing = async () => {
    if (!confirmId) return;
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        alert("You must be signed in as an admin to delete.");
        return;
      }
      const token = await user.getIdToken();
      await axios.delete(`/api/marketplace/${confirmId}`, {
        headers: { authtoken: token },
      });
      setListings((xs) => xs.filter((l) => String(l._id) !== String(confirmId)));
      setConfirmId(null);
    } catch (e) {
      console.error(e);
      alert("Failed to delete listing.");
      setConfirmId(null);
    }
  };

  // =======================
  // USERS (new)
  // =======================
  const [uQuery, setUQuery] = useState(""); // email to search
  const [users, setUsers] = useState([]); // results array
  const [uLoading, setULoading] = useState(false);
  const [uError, setUError] = useState("");
  const [deleteUid, setDeleteUid] = useState(null); // uid we’re about to delete
  const [deleting, setDeleting] = useState(false);
  const [busyUid, setBusyUid] = useState(null); // uid currently being toggled

  const list = Array.isArray(users) ? users : [];
  const filteredUsers = list.filter((u) => {
    const t = uQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(t) ||
      u.displayName?.toLowerCase().includes(t) ||
      (u.uid || u.id || u._id)?.toLowerCase().includes(t)
    );
  });

  const requestDeleteUser = (uid) => setDeleteUid(uid);
  const cancelDeleteUser = () => setDeleteUid(null);

  const confirmDeleteUser = async () => {
    if (!deleteUid) return;
    try {
      setDeleting(true);
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();

      // Try RESTful delete first
      try {
        await axios.delete(`/api/admin/users/${deleteUid}`, {
          headers: { authtoken: token },
        });
      } catch (delErr) {
        // fallback to legacy POST route if DELETE not present/allowed
        await axios.post(
          `/api/admin/delete-user`,
          { uid: deleteUid },
          { headers: { authtoken: token } }
        );
      }

      setUsers((prev) => prev.filter((u) => (u.uid || u.id || u._id) !== deleteUid));
      setDeleteUid(null);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "Failed to delete user. Ensure your account has admin privileges.");
    } finally {
      setDeleting(false);
    }
  };

  // Disable or enable a user by uid
  const setUserDisabled = async (uid, disabled) => {
    try {
      const me = getAuth().currentUser?.uid;
      if (me && uid === me) {
        alert("You cannot change your own disable/enable status.");
        return;
      }

      setBusyUid(uid);

      const token = await getAuth().currentUser.getIdToken();
      const url = disabled ? "/api/admin/disable-user" : "/api/admin/enable-user";

      await axios.post(url, { uid }, { headers: { authtoken: token } });

      setUsers((prev) =>
        prev.map((u) => ((u.uid || u.id || u._id) === uid ? { ...u, disabled } : u))
      );
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.error || "Failed to update user status.");
    } finally {
      setBusyUid(null);
    }
  };

  const currentUid = getAuth().currentUser?.uid;

  return (
    <main className="admin">
      <header className="admin-header">
        <div>
          <h1>Admin Console</h1>
          <p className="muted">Moderate listings and manage users.</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${tab === "listings" ? "active" : ""}`}
          onClick={() => setTab("listings")}
        >
          Listings
        </button>
        <button
          className={`tab-btn ${tab === "users" ? "active" : ""}`}
          onClick={() => setTab("users")}
        >
          Users
        </button>
      </div>

      {/* ================= LISTINGS TAB ================= */}
      {tab === "listings" && (
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
                  <button className="icon-btn" onClick={() => setQ("")} title="Clear">
                    ✕
                  </button>
                )}
              </div>

              <select
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
              <button className="btn" onClick={resetFilters}>
                Reset
              </button>
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
                      filtered.map((l) => {
                        const bucket = import.meta.env.VITE_S3_BUCKET_NAME;
                        const region = import.meta.env.VITE_AWS_REGION;

                        const imageKey =
                          Array.isArray(l.images) && typeof l.images[0] === "string"
                            ? l.images[0]
                            : null;

                        const thumbnail = imageKey?.startsWith("http")
                          ? imageKey
                          : imageKey
                          ? `https://${bucket}.s3.${region}.amazonaws.com/${imageKey}`
                          : l.image?.startsWith("http")
                          ? l.image
                          : l.image
                          ? `https://${bucket}.s3.${region}.amazonaws.com/${l.image}`
                          : "/placeholder-listing.jpg";

                        const titleFull = l.title || "Untitled";
                        const priceFull =
                          typeof l.price === "number"
                            ? l.price.toLocaleString("en-AU", { style: "currency", currency: "AUD" })
                            : "—";

                        return (
                          <tr key={String(l._id)}>
                            <td>
                              <div className="item-cell">
                                <div className="thumb">
                                  <img
                                    src={thumbnail}
                                    alt={titleFull}
                                    onError={(e) => (e.currentTarget.src = "/placeholder-listing.jpg")}
                                  />
                                </div>
                                <div className="meta">
                                  <div className="title" title={titleFull}>
                                    {ellipsize(titleFull, 20)}
                                  </div>
                                  <div className="sub muted">{l.location || "Location N/A"}</div>
                                </div>
                              </div>
                            </td>
                            <td className="hide-sm">{l.category || "—"}</td>
                            <td>
                              <span className="admin-price" title={priceFull}>
                                {ellipsize(priceFull, 20)}
                              </span>
                            </td>
                            <td className="hide-md">{l.ownerEmail || "—"}</td>
                            <td>{l.upvotes ?? 0}</td>
                            <td>
                              <button
                                className="icon-btn danger"
                                title="Delete listing"
                                onClick={() => onDeleteListing(l._id)}
                              >
                                🗑
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <span className="muted">Showing {filtered.length} of {listings.length}</span>
              </div>
            </>
          )}
        </section>
      )}

      {/* ================= USERS TAB ================= */}
      {tab === "users" && (
        <section className="admin-card">
          <div className="toolbar">
            <div className="inputs">
              <div className="searchbox">
                <input
                  value={uQuery}
                  onChange={(e) => setUQuery(e.target.value)}
                  placeholder="Search user by email, name, or UID…"
                  aria-label="Search users"
                />
                {uQuery && (
                  <button className="icon-btn" onClick={() => setUQuery("")} title="Clear">
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {uError && <div className="alert error">{uError}</div>}

          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th className="hide-sm">Email</th>
                  <th>Role</th>
                  <th className="hide-sm">Status</th>
                  <th style={{ width: 1 }} />
                  <th style={{ width: 1 }} />
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center" }}>
                      <div className="empty">No matching users.</div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const uid = u.uid || u.id || u._id;
                    const isSelf = currentUid && uid === currentUid;
                    return (
                      <tr key={uid}>
                        <td>
                          <div className="meta">
                            <div className="title">
                              {u.displayName || (u.email ? `(${u.email})` : "Unnamed")}
                            </div>
                            <div className="sub muted">{uid}</div>
                          </div>
                        </td>
                        <td className="hide-sm">{u.email || "—"}</td>
                        <td>{u.isAdmin ? "Admin" : "User"}</td>
                        <td className="hide-sm">{u.disabled ? "Disabled" : "Active"}</td>

                        <td style={{ textAlign: "right" }}>
                          <button
                            className="icon-btn"
                            title={u.disabled ? "Enable user" : "Disable user"}
                            onClick={() => setUserDisabled(uid, !u.disabled)}
                            disabled={busyUid === uid || isSelf}
                          >
                            {busyUid === uid ? "…" : u.disabled ? "Enable" : "Disable"}
                          </button>
                        </td>

                        <td style={{ textAlign: "right" }}>
                          <button
                            className="icon-btn danger"
                            title={isSelf ? "You cannot delete your own account" : "Delete user"}
                            onClick={() => !isSelf && requestDeleteUser(uid)}
                            disabled={isSelf}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Listing delete modal */}
      {confirmId && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Delete listing?</h3>
            <p className="muted">This action can’t be undone. The listing will be removed permanently.</p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={confirmDeleteListing}>
                Delete
              </button>
              <button className="btn" onClick={() => setConfirmId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User delete modal */}
      {deleteUid && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>Delete this user?</h3>
            <p className="muted">This removes their account. You can’t undo this.</p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={confirmDeleteUser} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button className="btn" onClick={cancelDeleteUser} disabled={deleting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
