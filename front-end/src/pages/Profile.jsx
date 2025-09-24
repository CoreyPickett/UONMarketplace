import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuth } from "firebase/auth";
import useUser from "../useUser";
import Avatar from "../components/Avatar";
import UsernameDisplay from "../components/UsernameDisplay";
import "./Profile.css";

export default function Profile() {
  const { user, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState("overview"); // overview | my | saved | settings

  const [allListings, setAllListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [profileData, setProfileData] = useState(null);



  // NEW: saved IDs (prefer server, fallback to localStorage)
  const [savedIds, setSavedIds] = useState([]);

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
    return () => {
      alive = false;
    };
  }, []);

  // Load saved IDs:
  //  - If signed in: GET /api/saves?idsOnly=1 with authtoken
  //  - Else fallback to localStorage "savedItems"
  useEffect(() => {
    let alive = true;

    async function loadSaved() {
      // helper: localStorage fallback
      const getLocalSaved = () => {
        try {
          const raw = localStorage.getItem("savedItems");
          const arr = JSON.parse(raw || "[]");
          return Array.isArray(arr) ? arr.map(String) : [];
        } catch {
          return [];
        }
      };

      // signed in? try server
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch("/api/saves?idsOnly=1", {
            headers: { authtoken: token },
          });
          if (!res.ok) throw new Error("Saved API failed");
          const ids = await res.json();
          if (alive) setSavedIds(Array.isArray(ids) ? ids.map(String) : []);
          return;
        } catch (e) {
          console.warn("Falling back to local saved items:", e);
          if (alive) setSavedIds(getLocalSaved());
          return;
        }
      }

      // not signed in -> use local
      if (alive) setSavedIds(getLocalSaved());
    }

    loadSaved();
    return () => {
      alive = false;
    };
  }, [user]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await fetch(`/api/profile/${user.uid}`);
        if (!res.ok) throw new Error("Profile fetch failed");
        const data = await res.json();
        setProfileData(data);
      } catch (err) {
        console.error("Failed to load profile data:", err);
      }
    };

    if (user?.uid) {
      fetchProfileData();
    }
  }, [user]);

  const myListings = useMemo(() => {
    if (!user) return [];
    const uid = user.uid;
    const email = user.email?.toLowerCase();
    return allListings.filter((l) => {
      const owner = (l.ownerUid || "").toString();
      const sellerEmail = (l.ownerEmail || l.seller || "").toString().toLowerCase();
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
          <Avatar
            src={profileData?.profilePhotoUrl}
            fallbackText={user.email?.[0]?.toUpperCase() || "U"}
            size="md"
          />
          <div className="whoami">
            <h2>{user.email}</h2>
            <div className="uid-row">
              <span className="uid-label">UID:</span>
              <span className="uid-value" title={user.uid}>
                {user.uid}
              </span>
              <button
                type="button"
                className="btn-copy btn-xs"
                onClick={() => navigator.clipboard.writeText(user.uid)}
                aria-label="Copy UID"
              >
                Copy
              </button>
            </div>

              {/* Display Username */}
              <UsernameDisplay username={profileData?.username} />
            </div>
            <div className="profile-actions">
              
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

<button className="btn" onClick={() => navigate("/create-listing")}>
              + Create Listing
            </button>

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
                {myListings.map((l) => {
                  const bucket = import.meta.env.VITE_S3_BUCKET_NAME;
                  const region = import.meta.env.VITE_AWS_REGION;

                  const imageKey = Array.isArray(l.images) && typeof l.images[0] === "string"
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

                  return (
                    <article className="card" key={l._id}>
                      <div className="card-img">
                        <img
                          src={thumbnail}
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
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Saved */}
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
                {savedListings.map((l) => {
                  const bucket = import.meta.env.VITE_S3_BUCKET_NAME;
                  const region = import.meta.env.VITE_AWS_REGION;

                  const imageKey = Array.isArray(l.images) && typeof l.images[0] === "string"
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

                  return (
                    <article className="card" key={l._id}>
                      <div className="card-img">
                        <img
                          src={thumbnail}
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
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <div className="panel">
            <h3>Settings</h3>

            {/* Update Email */}
            <div className="settings-actions">
              <div className="action-block">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/updateEmail")}
                >
                  Change Email
                </button>
              </div>

              {/* Update Password */}
              <div className="action-block">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/updatePswd")}
                >
                  Change Password
                </button>
              </div>

              {/* Update Profile Picture */}
              <div className="action-block">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/updatePhoto")}
                >
                  Change Profile Picture
                </button>
              </div>
            </div>

              {/* Update Username */}
              <div className="action-block">
              <button
                className="btn btn-primary"
                onClick={() => navigate("/updateUsername")}
              >
                Change Username
              </button>
            </div>


            <hr />

            {/* Sign Out */}
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
