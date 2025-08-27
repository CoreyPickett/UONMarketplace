import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import NotLoggedIn from "./NotLoggedIn";  // ← fixed path (from pages → src root)
import useUser from "../useUser";          // ← fixed path (src/useUser.js)
import "./Dashboard.css";

function formatAUD(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  try {
    return n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function timeAgo(dateLike) {
  if (!dateLike) return "—";
  const d = new Date(dateLike);
  if (isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day}d ago`;
  if (hr > 0) return `${hr}h ago`;
  if (min > 0) return `${min}m ago`;
  return "Just now";
}

export default function Dashboard() {
  const { user, isLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [allListings, setAllListings] = useState([]);  // marketplace
  const [allThreads, setAllThreads] = useState([]); // messages
  const [refreshing, setRefreshing] = useState(false); // small UI bit

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        // fetch all listings (backend already sorts by createdAt desc)
        const [listingsRes, msgsRes] = await Promise.all([
          fetch("/api/marketplace/"),
          fetch("/api/messages/"),
        ]);

        const listings = await listingsRes.json().catch(() => []);
        const threads = await msgsRes.json().catch(() => []);

        if (!alive) return;
        setAllListings(Array.isArray(listings) ? listings : []);
        setAllThreads(Array.isArray(threads) ? threads : []);
      } catch (e) {
        console.error("Dashboard load error:", e);
        if (!alive) return;
        setAllListings([]);
        setAllThreads([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const my = useMemo(() => {
    if (!user) return { listings: [], threads: [] };
    const uid = user.uid;
    const email = user.email?.toLowerCase();
    const myListings = allListings.filter( // My listings
      (l) => l.ownerUid === uid || (email && l.ownerEmail?.toLowerCase() === email)
    );

    // My message threads: owned OR I’m a receiver
    const myThreads = allThreads.filter((t) => {
      const owned = t.ownerUid === uid || (email && t.ownerEmail?.toLowerCase() === email);
      const inIds = Array.isArray(t.reciverIds) && t.reciverIds.includes(uid);
      const inEmails =
        Array.isArray(t.reciverEmails) &&
        email &&
        t.reciverEmails.map((e) => (e || "").toLowerCase()).includes(email);
      return owned || inIds || inEmails;
    });

    return { listings: myListings, threads: myThreads };
  }, [user, allListings, allThreads]);

  const stats = useMemo(() => {
    const totalListings = my.listings.length;
    const totalUpvotes = my.listings.reduce((sum, l) => sum + (l.upvotes || 0), 0);

    // last activity across my listings (createdAt or last comment)
    const lastListingActivity = my.listings
      .map((l) => {
        const cDates = (l.comments || []).map((c) => c.createdAt || c.date).filter(Boolean);
        const mostRecentComment = cDates.length
          ? new Date(
              cDates
                .map((v) => new Date(v)?.getTime() || 0)
                .reduce((a, b) => Math.max(a, b), 0)
            )
          : null;
        const createdAt = l.createdAt ? new Date(l.createdAt) : null;
        return mostRecentComment || createdAt;
      })
      .filter(Boolean)
      .sort((a, b) => b - a)[0];

    // thread “last message” timestamps
    const lastThreadActivity = my.threads
      .map((t) => {
        const msgs = Array.isArray(t.messages) ? t.messages : [];
        const mostRecent = msgs
          .map((m) => new Date(m.createdAt || m.date || 0))
          .filter((d) => !isNaN(d.getTime()))
          .sort((a, b) => b - a)[0];
        return mostRecent || (t.createdAt ? new Date(t.createdAt) : null);
      })
      .filter(Boolean)
      .sort((a, b) => b - a)[0];

    const lastActivity =
      (lastListingActivity && lastThreadActivity
        ? new Date(Math.max(lastListingActivity, lastThreadActivity))
        : lastListingActivity || lastThreadActivity) || null;

    return {
      totalListings,
      totalUpvotes,
      threadCount: my.threads.length,
      lastActivity,
    };
  }, [my]);

  const latestMyListings = useMemo(() => {
    const sorted = [...my.listings].sort((a, b) => {
      const ad = new Date(a.createdAt || 0).getTime();
      const bd = new Date(b.createdAt || 0).getTime();
      return bd - ad;
    });
    return sorted.slice(0, 4);
  }, [my.listings]);

  const latestThreads = useMemo(() => {
    const pickDate = (t) => {
      const msgs = Array.isArray(t.messages) ? t.messages : [];
      const mostRecent = msgs
        .map((m) => new Date(m.createdAt || m.date || 0))
        .filter((d) => !isNaN(d.getTime()))
        .sort((a, b) => b - a)[0];
      return mostRecent ? mostRecent.getTime() : new Date(t.createdAt || 0).getTime();
    };
    const sorted = [...my.threads].sort((a, b) => pickDate(b) - pickDate(a));
    return sorted.slice(0, 3);
  }, [my.threads]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [listingsRes, msgsRes] = await Promise.all([
        fetch("/api/marketplace/"),
        fetch("/api/messages/"),
      ]);
      setAllListings((await listingsRes.json().catch(() => [])) ?? []);
      setAllThreads((await msgsRes.json().catch(() => [])) ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : !user ? (
        <NotLoggedIn
          title="You’re not logged in"
          message="Please sign in to view your dashboard."
        />
      ) : (
    <main className="dash">
      {/* Header */}
      <header className="dash__header">
        <div className="dash__id">
          <div className="dash__avatar" aria-hidden="true">
            {(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="dash__title">Welcome{user?.displayName ? `, ${user.displayName}` : ""}</h1>
            <p className="muted">{user?.email}</p>
          </div>
        </div>

        <div className="dash__header-actions">
          <button className="btn" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <Link className="btn btn-primary" to="/create-listing">
            + Create Listing
          </Link>
        </div>
      </header>

      {/* Stats */}
      <section className="dash__grid">
        <div className="stat-card">
          <div className="stat-card__label">My Listings</div>
          <div className="stat-card__value">
            {loading ? "…" : stats.totalListings}
          </div>
          <div className="stat-card__hint">
            Latest: {loading || latestMyListings.length === 0
              ? "—"
              : timeAgo(latestMyListings[0].createdAt)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__label">Message Threads</div>
          <div className="stat-card__value">
            {loading ? "…" : stats.threadCount}
          </div>
          <div className="stat-card__hint">
            Last message: {loading || !stats.lastActivity ? "—" : timeAgo(stats.lastActivity)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__label">Total Upvotes</div>
          <div className="stat-card__value">
            {loading ? "…" : stats.totalUpvotes}
          </div>
          <div className="stat-card__hint">Across your listings</div>
        </div>

        <div className="stat-card stat-card--accent">
          <div className="stat-card__label">Quick Links</div>
          <div className="stat-card__actions">
            <Link to="/marketplace" className="chip">Browse</Link>
            <Link to="/messages" className="chip">Messages</Link>
            <Link to="/profile" className="chip">Profile</Link>
            <Link to="/admin" className="chip">Admin</Link>
          </div>
        </div>
      </section>

      {/* Content columns */}
      <section className="dash__columns">
        {/* My latest listings */}
        <div className="panel">
          <div className="panel__head">
            <h2>My Latest Listings</h2>
            <Link to="/marketplace" className="link">View all</Link>
          </div>

          {loading ? (
            <div className="skeleton-list">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : latestMyListings.length === 0 ? (
            <div className="empty">
              You haven’t created any listings yet.
              <Link to="/create-listing" className="link"> Create your first listing</Link>.
            </div>
          ) : (
            <ul className="item-list">
              {latestMyListings.map((l) => (
                <li className="item" key={String(l._id)}>
                  <div className="item__thumb">
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
                  <div className="item__meta">
                    <div className="item__title">{l.title || "Untitled"}</div>
                    <div className="item__sub">
                      {l.category || "—"} • {l.location || "Location N/A"}
                    </div>
                    <div className="item__badges">
                      {typeof l.price === "number" && (
                        <span className="badge badge--primary">{formatAUD(l.price)}</span>
                      )}
                      {l.condition && <span className="badge">{l.condition}</span>}
                      <span className="badge">⬆ {l.upvotes ?? 0}</span>
                    </div>
                  </div>
                  <div className="item__tail">
                    <div className="muted">{timeAgo(l.createdAt)}</div>
                    <Link to={`/marketplace/${l._id}`} className="btn btn-ghost">View</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Inbox preview */}
        <div className="panel">
          <div className="panel__head">
            <h2>Inbox Preview</h2>
            <Link to="/messages" className="link">Open messages</Link>
          </div>

          {loading ? (
            <div className="skeleton-list">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : latestThreads.length === 0 ? (
            <div className="empty">
              No message threads yet. Start a conversation from a listing page.
            </div>
          ) : (
            <ul className="thread-list">
              {latestThreads.map((t) => {
                const last = Array.isArray(t.messages) && t.messages.length
                  ? t.messages[t.messages.length - 1]
                  : null;
                return (
                  <li className="thread" key={String(t._id)}>
                    <div className="thread__avatar" aria-hidden="true">✉</div>
                    <div className="thread__meta">
                      <div className="thread__title">
                        Conversation {String(t._id).slice(-6)}
                      </div>
                      <div className="thread__snippet muted">
                        {last?.text ? last.text.substring(0, 80) : "No messages yet…"}
                      </div>
                    </div>
                    <div className="thread__tail muted">
                      {timeAgo(last?.createdAt || t.createdAt)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
    )}
  </>
  );
}