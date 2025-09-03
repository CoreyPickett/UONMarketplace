import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import NotLoggedIn from "./NotLoggedIn";
import SaveButton from "../SaveButton";
import "./MarketPlace.css"; // reuse your listing styles if you want

export default function Saved() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);

  const current = getAuth().currentUser;
  if (!current) {
    return <NotLoggedIn title="You’re not logged in" message="Sign in to see saved items." />;
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const token = await getAuth().currentUser.getIdToken();
        const res = await fetch("/api/saves", { headers: { authtoken: token } });
        const data = await res.json();
        if (alive) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <main className="marketplace">
      <div className="marketplace-header">
        <h1>Saved Items</h1>
        <Link className="btn" to="/marketplace">Browse Marketplace</Link>
      </div>

      {loading ? (
        <div className="empty">Loading…</div>
      ) : !items?.length ? (
        <div className="empty">No saved items yet.</div>
      ) : (
        <div className="cards-grid">
          {items.map((l) => {
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
              <article key={String(l._id)} className="listing-card">
                <div className="listing-image-wrapper">
                  <img
                    src={thumbnail}
                    alt={l.title || "Listing"}
                    className="listing-image"
                    onError={(e) => (e.currentTarget.src = "/placeholder-listing.jpg")}
                  />
                </div>
                <div className="listing-info">
                  <h3 className="listing-title">{l.title || "Untitled"}</h3>
                  <p className="listing-category">{l.category || "—"}</p>
                  <p className="listing-location">📍 {l.location || "N/A"}</p>
                </div>
                <div style={{ display: "flex", gap: 8, padding: "0 12px 12px" }}>
                  <Link className="btn btn-ghost" to={`/marketplace/${l._id}`}>View</Link>
                  <SaveButton listingId={l._id} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
