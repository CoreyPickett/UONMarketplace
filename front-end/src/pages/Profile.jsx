import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuth } from "firebase/auth";
import useUser from "../useUser";
import "./Profile.css";

export default function Profile() {
  const { user, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState("overview"); // overview | my | saved | settings
  const [allListings, setAllListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();

  // Load all listings (so we can filter "My Listings" and "Saved" locally)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingListings(true);
        const res = await fetch("/api/marketplace/");
        const data = await res.json();
        if (alive) setAllListings(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load listings:", e);
        if (alive) setAllListings([]);
      } finally {
        if (alive) setLoadingListings(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Saved IDs from localStorage
  const savedIds = useMemo(() => {
    try {
      const raw = localStorage.getItem("savedItems");
      const arr = JSON.parse(raw || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, []);

  const myListings = useMemo(() => {
    if (!user) return [];
    const uid = user.uid;
    const email = user.email?.toLowerCase();
    return allListings.filter((l) => {
      const owner = (l.ownerUid || "").toString();
      const sellerEmail = (l.seller || "").toString().toLowerCase();
      return (owner && owner === uid) || (email && sellerEmail === email);
    });
  }, [allListings, user]);

  const savedListings = useMemo(() => {
    if (!savedIds.length) return [];
    const set = new Set(savedIds.map(String));
    return allListings.filter((l) => set.has(String(l._id)));
  }, [savedIds, allListings]);

  async function deleteListing(id) {
    if (!user) return;
    const ok = window.confirm("Delete this listing permanently?");
    if (!ok) return;
    try {
      setDeletingId(id);
      const token = await user.getIdToken(true);
      await axios.delete(`/api/marketplace/${id}`, {
        headers: { authtoken: token },
      });
      // Remove from UI
      setAllListings((prev) => prev.filter((l) => String(l._id) !== String(id)));
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete listing.");
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="profile-wrap">
        <div className="profile-card"><p>Loading profile…</p></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-wrap">
        <div className="profile-card">
          <h2>You're not signed in</h2>
          <p>Please sign in to view your profile.</p>
          <Link className="btn btn-primary" to="/login">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-wrap">
      {/* Header */}
      <section className="profile-card">
        <div className="profile-header">
          <div className="avatar">{user.email?.[0]?.toUpperCase() || "U"}</div>
          <div className="whoami">
            <h2>{user.email}</h2>
            <div className="muted">UID: {user.uid}</div>
          </div>
          <div className="profile-actions">
            <button className="btn" onClick={() => navigate("/create-listing")}>
              + Create Listing
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === "my" ? "active" : ""}`}
            onClick={() => setActiveTab("my")}
          >
            My Listings
          </button>
          <button
            className={`tab ${activeTab === "saved" ? "active" : ""}`}
            onClick={() => setActiveTab("saved")}
          >
            Saved
          </button>
          <button
            className={`tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>
      </section>

      {/* Content */}
      <section className="profile-content">
        {activeTab === "overview" && (
          <div className="panel">
            <h3>Welcome back 👋</h3>
            <ul className="stats">
              <li><strong>{myListings.length}</strong> listing{myListings.length === 1 ? "" : "s"} posted</li>
              <li><strong>{savedListings.length}</strong> saved</li>
            </ul>
            <p className="muted">
              Use the tabs above to manage your listings, see items you’ve saved,
              or update your profile settings.
            </p>
          </div>
        )}

        {activeTab === "my" && (
          <div className="panel">
            <h3>My Listings</h3>
            {loadingListings ? (
              <p>Loading your listings…</p>
            ) : myListings.length === 0 ? (
              <div className="empty">
                <p>You haven't posted anything yet.</p>
                <button className="btn btn-primary" onClick={() => navigate("/create-listing")}>
                  Create your first listing
                </button>
              </div>
            ) : (
              <div className="cards-grid">
                {myListings.map((l) => (
                  <article className="card" key={l._id}>
                    <div className="card-img">
                      <img
                        src={l.image || "/placeholder-listing.jpg"}
                        alt={l.title}
                        onError={(e) => (e.currentTarget.src = "/placeholder-listing.jpg")}
                      />
                      <div className="badges">
                        {l.condition && <span className="badge">{l.condition}</span>}
                        {"price" in l && (
                          <span className="badge badge-primary">
                            {Number(l.price || 0).toLocaleString("en-AU", {
                              style: "currency",
                              currency: "AUD",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="card-body">
                      <h4 title={l.title}>{l.title}</h4>
                      {l.location && <div className="loc">📍 {l.location}</div>}
                      <div className="actions">
                        <Link className="btn" to={`/marketplace/${l._id}`}>View</Link>
                        <Link className="btn btn-secondary" to={`/edit-listing/${l._id}`}>Edit</Link>
                        <button
                          className="btn btn-danger"
                          onClick={() => deleteListing(l._id)}
                          disabled={deletingId === String(l._id)}
                        >
                          {deletingId === String(l._id) ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "saved" && (
          <div className="panel">
            <h3>Saved Items</h3>
            {loadingListings ? (
              <p>Loading…</p>
            ) : savedListings.length === 0 ? (
              <div className="empty">
                <p>No saved items yet.</p>
                <p className="muted">On a listing page, click “Save” to keep it here.</p>
              </div>
            ) : (
              <div className="cards-grid">
                {savedListings.map((l) => (
                  <article className="card" key={l._id}>
                    <div className="card-img">
                      <img
                        src={l.image || "/placeholder-listing.jpg"}
                        alt={l.title}
                        onError={(e) => (e.currentTarget.src = "/placeholder-listing.jpg")}
                      />
                      <div className="badges">
                        {l.condition && <span className="badge">{l.condition}</span>}
                        {"price" in l && (
                          <span className="badge badge-primary">
                            {Number(l.price || 0).toLocaleString("en-AU", {
                              style: "currency",
                              currency: "AUD",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="card-body">
                      <h4 title={l.title}>{l.title}</h4>
                      {l.location && <div className="loc">📍 {l.location}</div>}
                      <div className="actions">
                        <Link className="btn" to={`/marketplace/${l._id}`}>View</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="panel">
            <h3>Settings</h3>
            <p className="muted">More settings coming soon.</p>
            <button
              className="btn"
              onClick={async () => {
                try {
                  await getAuth().signOut();
                  navigate("/login");
                } catch (e) {
                  console.error("Sign out error", e);
                }
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
