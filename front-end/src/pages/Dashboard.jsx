// src/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NotLoggedIn from "./NotLoggedIn";
import useUser from "../useUser";
import "./Dashboard.css";

function formatAUD(n) {
  const num = Number(n);
  return Number.isFinite(num)
    ? num.toLocaleString("en-AU", { style: "currency", currency: "AUD" })
    : "—";
}

function timeAgo(dateLike) {
  if (!dateLike) return "—";
  const d =
    typeof dateLike === "string" || typeof dateLike === "number"
      ? new Date(dateLike)
      : dateLike;
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export default function Dashboard() {
  const { user, isLoading } = useUser();

  const [loading, setLoading] = useState(true);
  const [allListings, setAllListings] = useState([]);
  const [allThreads, setAllThreads] = useState([]);
  const [savedCount, setSavedCount] = useState(null);

  // Initial load
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);

        // Public listings
        const lres = await fetch("/api/marketplace/");
        const listings = await lres.json();
        if (alive) setAllListings(Array.isArray(listings) ? listings : []);

        // Threads
        const mres = await fetch("/api/messages/");
        const threads = await mres.json();
        if (alive) setAllThreads(Array.isArray(threads) ? threads : []);

        // Saved count if logged in
        if (user) {
          try {
            const token = await user.getIdToken();
            const sres = await fetch("/api/saves?idsOnly=1", {
              headers: { authtoken: token },
            });
            const ids = await sres.json();
            if (alive) setSavedCount(Array.isArray(ids) ? ids.length : 0);
          } catch {
            if (alive) setSavedCount(0);
          }
        } else {
          if (alive) setSavedCount(null);
        }
      } catch (e) {
        console.error(e);
        if (alive) {
          setAllListings([]);
          setAllThreads([]);
          setSavedCount(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [user]);

  // Mine
  const my = useMemo(() => {
    if (!user) return { listings: [], threads: [] };
    const uid = user.uid;
    const email = user.email;

    const myListings = (allListings || []).filter(
      (l) => l.ownerUid === uid || l.ownerEmail === email
    );

    const myThreads = (allThreads || []).filter((t) => {
      if (t.ownerUid === uid || t.ownerEmail === email) return true;
      if (Array.isArray(t.reciverIds) && t.reciverIds.includes(uid)) return true;
      if (Array.isArray(t.reciverEmails) && t.reciverEmails.includes(email)) return true;
      return false;
    });

    return { listings: myListings, threads: myThreads };
  }, [user, allListings, allThreads]);

  const stats = useMemo(() => {
    const totalListings = my.listings.length;
    const totalUpvotes = my.listings.reduce(
      (sum, l) => sum + (Number(l.upvotes) || 0),
      0
    );
    const totalThreads = my.threads.length;
    return { totalListings, totalUpvotes, totalThreads };
  }, [my]);

  const latestMyListings = useMemo(
    () =>
      [...my.listings]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 4),
    [my.listings]
  );

  const latestThreads = useMemo(
    () =>
      [...my.threads]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 4),
    [my.threads]
  );

  // Latest public listings for dashboard
  const latestPublicListings = useMemo(
    () =>
      [...(allListings || [])]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 6),
    [allListings]
  );

  if (isLoading) return <div className="loading">Loading…</div>;

  if (!user) {
    return (
      <NotLoggedIn
        title="You’re not logged in"
        message="Please sign in to view your dashboard."
      />
    );
  }

  return (
    <main className="dash">
      {/* Header */}
      <header className="dash__header">
        <div className="dash__id">
          <div className="dash__avatar" aria-hidden="true">
            {(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="dash__title">
              Welcome{user?.displayName ? `, ${user.displayName}` : ""}
            </h1>
            <p className="muted">{user?.email}</p>
          </div>
        </div>

        {/* Top-right actions: Create Listing button REMOVED */}
        <div className="dash__header-actions" />
      </header>

      {/* Stats row (Quick Links removed) */}
      <section
        className="dash__grid"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
      >
        <div className="stat-card">
          <div className="stat-card__label">My Listings</div>
          <div className="stat-card__value">{stats.totalListings}</div>
          <div className="stat-card__hint">
            {stats.totalListings > 0 ? "Nice!" : "Create your first listing"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__label">Total Upvotes</div>
          <div className="stat-card__value">{stats.totalUpvotes}</div>
          <div className="stat-card__hint">Combined upvotes across your items</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__label">Threads</div>
          <div className="stat-card__value">{stats.totalThreads}</div>
          <div className="stat-card__hint">Messages you’re part of</div>
        </div>
      </section>

      {/* Panels */}
      <section className="dash__columns">
        {/* My Latest Listings (keeps + New in header & empty-state link) */}
        <div className="panel">
          <div className="panel__head">
            <h2 className="panel__title">My Latest Listings</h2>
            <Link to="/create-listing" className="btn btn-ghost">
              + New
            </Link>
          </div>

          {loading ? (
            <div className="empty">Loading…</div>
          ) : latestMyListings.length === 0 ? (
            <div className="empty">
              You haven’t created any listings yet.{" "}
              <Link to="/create-listing">Create one</Link>.
            </div>
          ) : (
            <ul className="list">
              {latestMyListings.map((l) => {
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

                return (
                  <li key={String(l._id)} className="list__row">
                    <div className="item-cell">
                      <div className="thumb">
                        <img
                          src={thumbnail}
                          alt={l.title || "Listing"}
                          onError={(e) =>
                            (e.currentTarget.src = "/placeholder-listing.jpg")
                          }
                        />
                      </div>
                      <div className="meta">
                        <div className="title">{l.title || "Untitled"}</div>
                        <div className="sub">
                          {formatAUD(l.price)} · {timeAgo(l.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="row-actions">
                      <Link className="btn btn-ghost" to={`/marketplace/${l._id}`}>
                        View
                      </Link>
                      <Link className="btn btn-ghost" to={`/edit-listing/${l._id}`}>
                        Edit
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Latest on Marketplace (public) */}
        <div className="panel">
          <div className="panel__head">
            <h2 className="panel__title">Latest on Marketplace</h2>
            <Link to="/marketplace" className="btn btn-ghost">Browse</Link>
          </div>

          {loading ? (
            <div className="empty">Loading…</div>
          ) : latestPublicListings.length === 0 ? (
            <div className="empty">No listings yet. Be the first to post!</div>
          ) : (
            <ul className="list">
              {latestPublicListings.map((l) => {
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

                return (
                  <li key={String(l._id)} className="list__row">
                    <div className="item-cell">
                      <div className="thumb">
                        <img
                          src={thumbnail}
                          alt={l.title || "Listing"}
                          onError={(e) =>
                            (e.currentTarget.src = "/placeholder-listing.jpg")
                          }
                        />
                      </div>
                      <div className="meta">
                        <div className="title">{l.title || "Untitled"}</div>
                        <div className="sub">
                          {formatAUD(l.price)} · {timeAgo(l.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="row-actions">
                      <Link className="btn btn-ghost" to={`/marketplace/${l._id}`}>
                        View
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
