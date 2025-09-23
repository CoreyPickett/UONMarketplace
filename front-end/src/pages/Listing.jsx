// src/pages/Listing.jsx
// Individual Listing (new layout) + Buy Now modal integration

import { useEffect, useMemo, useState } from "react";
import { useParams, useLoaderData, Link } from "react-router-dom";
import useUser from "../useUser";
import SaveButton from "../SaveButton";
import BuyNowModal from "../components/BuyNow"; // <-- ensure filename matches
import Avatar from "../components/Avatar";
import "./Listing.css";

// Currency helper
const toAUD = (n) =>
  Number.isFinite(Number(n))
    ? Number(n).toLocaleString("en-AU", { style: "currency", currency: "AUD" })
    : n ?? "";

// Build a public S3 URL when listing.images contains just a key
const buildImageUrl = (key) => {
  if (!key) return null;
  if (String(key).startsWith("http")) return key;
  const bucket = import.meta.env.VITE_S3_BUCKET_NAME;
  const region = import.meta.env.VITE_AWS_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

export default function Listing() {
  const [sellerProfile, setSellerProfile] = useState(null);

  const { id } = useParams(); // not strictly needed, but harmless
  const listing = useLoaderData();
  const { user } = useUser();

  // Saved count (replaces upvotes)
  const [saves, setSaves] = useState(Number(listing?.saves || 0));

  // Image carousel + modal state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBuyNow, setShowBuyNow] = useState(false);

  // Keep saves in sync if loader brings in a different listing
  useEffect(() => {
    setSaves(Number(listing?.saves || 0));
    setCurrentImageIndex(0);
  }, [listing?._id]);

  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        if (!listing?.ownerUid) return; // assuming you store UID on listing
        const res = await fetch(`/api/profile/${listing.ownerUid}`);
        if (!res.ok) throw new Error("Seller profile fetch failed");
        const data = await res.json();
        setSellerProfile(data);
      } catch (err) {
        console.error("Failed to load seller profile:", err);
      }
    };

    fetchSellerProfile();
  }, [listing?.ownerUid]);

  if (!listing) {
    return (
      <main style={{ maxWidth: 980, margin: "16px auto", padding: "0 16px" }}>
        <h1>Listing not found</h1>
        <p>That item may have been removed or never existed.</p>
        <Link to="/marketplace" className="ListingOptions">← Back to Marketplace</Link>
      </main>
    );
  }

  // Normalise images → array of public URLs (fallback to placeholder)
  const images = useMemo(() => {
    const srcs = Array.isArray(listing?.images) && listing.images.length
      ? listing.images
      : (listing?.image ? [listing.image] : []);
    const urls = srcs.map(buildImageUrl).filter(Boolean);
    return urls.length ? urls : ["/placeholder-listing.jpg"];
  }, [listing]);

  const priceText = toAUD(listing?.price);

  return (
    <main style={{ maxWidth: 980, margin: "16px auto", padding: "0 16px" }}>
      {/* Title + Save + saved count */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ margin: "12px 0 16px" }}>{listing.title}</h1>
        <SaveButton
          listingId={listing._id}
          onChange={(_, delta) => setSaves((s) => Math.max(0, (s || 0) + (delta || 0)))}
        />
        <span className="badge">{saves} saved</span>
      </div>

      {/* Hero image + carousel nav */}
      <div
        style={{
          position: "relative",
          height: 320,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 6px 18px rgba(0,0,0,0.10)",
          marginBottom: 18,
          background: "#e5e7eb",
        }}
      >
        <img
          src={images[currentImageIndex]}
          alt={listing.title || `Image ${currentImageIndex + 1}`}
          onError={(e) => (e.currentTarget.src = "/placeholder-listing.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {/* Image nav */}
        {images.length > 1 && (
          <>
            <button
              className="image-nav-btn"
              aria-label="Previous image"
              onClick={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)}
              style={{
                position: "absolute",
                top: "50%",
                left: 12,
                transform: "translateY(-50%)",
              }}
            >
              ‹
            </button>

            <button
              className="image-nav-btn"
              aria-label="Next image"
              onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
              style={{
                position: "absolute",
                top: "50%",
                right: 12,
                transform: "translateY(-50%)",
              }}
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Badges below image */}
      <div style={{ display: "flex", gap: 8, margin: "8px 0 18px 0", flexWrap: "wrap" }}>
        {listing.condition ? <span className="badge">{listing.condition}</span> : null}
        {priceText ? <span className="badge badge-primary">{priceText}</span> : null}
        {listing.location ? <span className="badge">📍 {listing.location}</span> : null}
        {listing.category ? <span className="badge">{listing.category}</span> : null}
      </div>

      {/* Description / content */}
      <section className="listing-details" style={{ marginTop: 8 }}>
        {Array.isArray(listing.content)
          ? listing.content.map((para, i) => (
              <p key={i} style={{ lineHeight: 1.6 }}>{para}</p>
            ))
          : listing.description
          ? <p style={{ lineHeight: 1.6 }}>{listing.description}</p>
          : listing.content
          ? <p style={{ lineHeight: 1.6 }}>{listing.content}</p>
          : null}
      </section>

      {/* Seller + Actions */}
      <section style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Avatar
            src={sellerProfile?.profilePhotoUrl}
            fallbackText={listing.ownerEmail?.[0]?.toUpperCase() || "U"}
            size="sm"
            alt="Seller avatar"
          />
          <div style={{ fontSize: 14, color: "#6b7280" }}>
            Listed by <strong>{listing.ownerEmail?.split("@")[0] || "Unknown"}</strong>
          </div>
        </div>

        <div className="listing-actions-row">
          <button
            className="ListingOptions"
            onClick={() => setShowBuyNow(true)}
            title={user ? "Buy now" : "Sign in required to purchase"}
          >
            Buy Now
          </button>

          {listing.ownerEmail ? (
            <a
              className="ListingOptions secondary"
              href={`mailto:${listing.ownerEmail}?subject=Enquiry about "${encodeURIComponent(
                listing.title || "your listing"
              )}"`}
            >
              Message seller
            </a>
          ) : (
            <Link className="ListingOptions secondary" to="/messages">
              Message seller
            </Link>
          )}
        </div>
      </section>

      {/* Buy Now Modal */}
      {showBuyNow && listing && (
        <BuyNowModal listing={listing} onClose={() => setShowBuyNow(false)} />
      )}
    </main>
  );
}
