import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import useListings from "./useListings";
import UsernameDisplay from "./components/UsernameDisplay";
import "./MarketPlaceList.css";

const toAUD = (n) =>
  Number.isFinite(Number(n))
    ? Number(n).toLocaleString("en-AU", { style: "currency", currency: "AUD" })
    : n ?? "";

export default function MarketPlaceList() {
  const [sellerProfiles, setSellerProfiles] = useState({});
  const { listings, loading } = useListings();
  const [params] = useSearchParams();
  const q = (params.get("query") || "").trim().toLowerCase();

  const filtered = (listings || []).filter((l) => {
    if (!q) return true;
    const hay =
      [
        l.title,
        l.description,
        l.content,
        l.category,
        l.location,
        Array.isArray(l.tagsOrKeywords) ? l.tagsOrKeywords.join(" ") : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    return hay.includes(q);
  });

  useEffect(() => {
    const fetchProfiles = async () => {
      const uids = filtered.map((l) => l.ownerUid).filter(Boolean);
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

    fetchProfiles();
  }, [filtered]);

  if (loading) {
    return (
      <div className="marketplace-grid" aria-busy="true">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="listing-card" style={{ height: 280, background: "#f1f5f9" }} />
        ))}
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="marketplace-grid">
        <div className="no-listings-message">
          No listings found{q ? ` for “${q}”` : ""}. Try different keywords.
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-grid">
      {filtered.map((l) => {
        const thumb =
          (Array.isArray(l.images) && l.images[0]) || l.image || "/placeholder-listing.jpg";
        const saves = Number(l.saves || 0);

        return (
          <article key={l._id} className="listing-card">
            <Link className="listing-link" to={`/marketplace/${l._id}`}>
              <div className="listing-image">
                <img className="listing-thumb" src={thumb} alt={l.title} loading="lazy"
                     onError={(e)=> (e.currentTarget.src="/placeholder-listing.jpg")} />
                <div className="saved-pill">{saves} saved</div>
              </div>

              <div className="listing-info">
                <h3 className="listing-title">{l.title}</h3>
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
