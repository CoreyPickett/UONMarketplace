import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import UsernameDisplay from "./components/UsernameDisplay";
import "./MarketPlaceList.css";

const toAUD = (n) =>
  Number.isFinite(Number(n))
    ? Number(n).toLocaleString("en-AU", { style: "currency", currency: "AUD" })
    : n ?? "";

const ellipsize = (str, max = 20) =>
  typeof str === "string" && str.length > max
    ? str.slice(0, max).trimEnd() + "…"
    : str ?? "";

export default function MarketPlaceList({ listings, loading = false }) {
  const [sellerProfiles, setSellerProfiles] = useState({});

  // Fetch seller profiles only for filtered listings
useEffect(() => {
  const fetchProfiles = async () => {
    const uids = listings.map((l) => l.ownerUid).filter(Boolean);
    const uniqueUids = [...new Set(uids)];

    const profileMap = {};
    await Promise.all(
      uniqueUids.map(async (uid) => {
        try {
          const res = await fetch(`/api/profile/${uid}`);
          if (!res.ok) throw new Error("Profile fetch failed");
          const data = await res.json();
          profileMap[uid] = data;
        } catch (err) {
          console.error(`Failed to fetch profile for UID ${uid}`, err);
        }
      })
    );

    setSellerProfiles(profileMap);
  };

  if (listings.length) {
    fetchProfiles();
  } else {
    setSellerProfiles({});
  }
}, [listings]);


  // Loading skeleton
  if (loading) {
    return (
      <div className="marketplace-grid" aria-busy="true">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="listing-card" style={{ height: 280, background: "#f1f5f9" }} />
        ))}
      </div>
    );
  }

  // If there are no results
  if (!listings.length) {
    return (
      <div className="marketplace-grid">
        <div className="no-listings-message">
          No listings found. Try different keywords or filters.
        </div>
      </div>
    );
  }

  // Rendering filtered listings
  return (
    <div className="marketplace-grid">
      {listings.map((l) => {
        const thumb =
          (Array.isArray(l.images) && l.images[0]) || l.image || "/placeholder-listing.jpg";
        const saves = Number(l.saves || 0);

        return (
          <article key={l._id} className="listing-card">
            <Link className="listing-link" to={`/marketplace/${l._id}`}>
              <div className="listing-image">
                <img
                  className="listing-thumb"
                  src={thumb}
                  alt={l.title || "Listing image"}
                  loading="lazy"
                  onError={(e) => (e.currentTarget.src = "/placeholder-listing.jpg")}
                />
                <div className="saved-pill">{saves} saved</div>
              </div>

              <div className="listing-info">
                <h3 className="listing-title" title={l.title}>
                  {ellipsize(l.title, 20)}
                </h3>

                {"price" in l && <div className="listing-price">{toAUD(l.price)}</div>}

                {l.content && (
                  <div className="listing-content">
                    {Array.isArray(l.content) ? l.content[0] : l.content}
                  </div>
                )}

                <div className="listing-name">
                  <UsernameDisplay
                    username={sellerProfiles[l.ownerUid]?.username}
                    fallback={l.ownerEmail?.split("@")[0]}
                  />
                </div>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
