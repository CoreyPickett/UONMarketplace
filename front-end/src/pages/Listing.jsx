// src/pages/Listing.jsx
// Individual Listing (new layout) + Buy Now modal integration

import { useEffect, useMemo, useState } from "react";
import { useParams, useLoaderData, Link, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { api } from "../api";
import useUser from "../useUser";
import SaveButton from "../SaveButton";
import BuyNowModal from "../components/BuyNow"; // <-- ensure filename matches
import Avatar from "../components/Avatar";
import UsernameDisplay from "../components/UsernameDisplay";
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
  const navigate = useNavigate();
  const { id } = useParams(); // not strictly needed, but harmless
  const listing = useLoaderData();
  const { user } = useUser();

  //Loading State for Listing and Marking as sold
  const [localListing, setLocalListing] = useState(listing);
  const [markingSold, setMarkingSold] = useState(false);
  
  // Saved count (replaces upvotes)
  const [saves, setSaves] = useState(Number(localListing?.saves || 0));

  // Image carousel + modal state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBuyNow, setShowBuyNow] = useState(false);

  // Keep saves in sync if loader brings in a different listing
  useEffect(() => {
    setSaves(Number(localListing?.saves || 0));
    setCurrentImageIndex(0);
  }, [localListing?._id]);

  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        if (!localListing?.ownerUid) return; // assuming you store UID on listing
        const res = await fetch(`/api/profile/${localListing.ownerUid}`);
        if (!res.ok) throw new Error("Seller profile fetch failed");
        const data = await res.json();
        setSellerProfile(data);
      } catch (err) {
        console.error("Failed to load seller profile:", err);
      }
    };

    fetchSellerProfile();
  }, [localListing?.ownerUid]);

  if (!localListing) {
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
    const srcs = Array.isArray(localListing?.images) && localListing.images.length
      ? localListing.images
      : (localListing?.image ? [localListing.image] : []);
    const urls = srcs.map(buildImageUrl).filter(Boolean);
    return urls.length ? urls : ["/placeholder-listing.jpg"];
  }, [localListing]);

  const handleMarkAsSold = async () => {
    if (localListing.sold) {
      alert("This item is already marked as sold.");
      return;
    }

    setMarkingSold(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken();

      const res = await fetch(`/api/marketplace/${localListing._id}/sell`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authtoken: token
        },
        body: JSON.stringify({ buyerUid: localListing.buyerUid || null })
      });

      const result = await res.json();
      if (result.success) {
        setLocalListing(prev => ({ ...prev, sold: true }));

        if (result.threadId) {
          navigate(`/messages/${result.threadId}`, {
            state: {
              preview: {
                sender: `${localListing.title} - Sold`,
                avatar: sellerProfile?.profilePhotoUrl || "/images/default-avatar.png"
              }
            }
          });
        }
      } else {
        console.error("Failed to mark as sold:", result.error);
        alert("Failed to mark as sold. Please try again.");
      }
    } catch (err) {
      console.error("Error marking as sold:", err);
      alert("Something went wrong while marking as sold.");
    } finally {
      setMarkingSold(false);
    }
  };

  const priceText = toAUD(localListing?.price);

  const isOwner = localListing?.ownerUid === user?.uid;

  return (
    <main style={{ maxWidth: 980, margin: "16px auto", padding: "0 16px" }}>
      {/* Title + Save + saved count */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ margin: "12px 0 16px" }}>{localListing.title}</h1>

        {localListing.ownerUid !== user?.uid && (
          <SaveButton
            listingId={localListing._id}
            onChange={(_, delta) =>
              setSaves((s) => Math.max(0, (s || 0) + (delta || 0)))
            }
          />
        )}

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
          alt={localListing.title || `Image ${currentImageIndex + 1}`}
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
        {localListing.condition ? <span className="badge">{localListing.condition}</span> : null}
        {priceText ? <span className="badge badge-primary">{priceText}</span> : null}
        {localListing.category ? <span className="badge">{localListing.category}</span> : null}
        {localListing.location ? <span className="badge">📍 {localListing.location}</span> : null}
        
      </div>

      {/* Description / content */}
      <section className="listing-details" style={{ marginTop: 8 }}>
        {Array.isArray(localListing.content)
          ? localListing.content.map((para, i) => (
              <p key={i} style={{ lineHeight: 1.6 }}>{para}</p>
            ))
          : localListing.description 
          ? <p style={{ lineHeight: 1.6 }}>{localListing.description}</p>
          : localListing.content
          ? <p style={{ lineHeight: 1.6 }}>{localListing.content}</p>
          : null}
      </section>

      {/* Seller + Actions */}
      <section style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Avatar
            src={sellerProfile?.profilePhotoUrl}
            fallbackText={localListing.ownerEmail?.[0]?.toUpperCase() || "U"}
            size="sm"
            alt="Seller avatar"
          />
          <div style={{ fontSize: 14, color: "#6b7280" }}>
            Listed by <UsernameDisplay
                        username={sellerProfile?.username}
                        fallback={localListing.ownerEmail?.split("@")[0]}
                      />
          </div>
        </div>

        <div className="listing-actions-row">
          {localListing.ownerUid !== user?.uid && (
            <button
              className="ListingOptions"
              onClick={() => setShowBuyNow(true)}
              title={user ? "Buy now" : "Sign in required to purchase"}
            >
              Buy Now
            </button>
          )}

          {/* Conditional: Show "Message seller" if not owner, else show message */}
          {user && localListing ? (
            localListing.ownerUid !== user?.uid && localListing.ownerEmail !== user?.email ? (
              <button
                className="ListingOptions secondary"
                onClick={async () => {
                  const auth = getAuth();
                  const currentUser = auth.currentUser;

                  if (!currentUser) {
                    navigate("/login");
                    return;
                  }

                  const token = await currentUser.getIdToken();
                  const res = await api.post(
                    "/messages/start",
                    {
                      listingId: localListing._id,
                      sellerUid: localListing.ownerUid,
                      listingTitle: localListing.title,
                    },
                    {
                      headers: { authtoken: token },
                    }
                  );

                  const thread = res.data;

                  if (!thread?._id) {
                    console.error("Thread creation failed or missing _id:", thread);
                    alert("Failed to start conversation. Please try again.");
                    return;
                  }

                  navigate(`/messages/${thread._id}`, {
                    state: {
                      preview: {
                        sender:
                          `${sellerProfile?.username || localListing.ownerEmail?.split("@")[0] || "User"} – ${localListing.title}`,
                        avatar: sellerProfile?.profilePhotoUrl || "/images/default-avatar.png",
                      },
                    },
                  });
                }}
              >
                Message seller
              </button>
            ) : (
              <div className="owner-message">
                This is your listing.
                {!localListing?.sold && (
                  <button
                    onClick={handleMarkAsSold}
                    disabled={markingSold}
                    style={{
                      background: "#003057",
                      color: "#fff",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      marginTop: "12px",
                      cursor: markingSold ? "not-allowed" : "pointer",
                      opacity: markingSold ? 0.6 : 1
                    }}
                  >
                    {markingSold ? "Marking as Sold…" : "Mark as Sold"}
                  </button>
                )}
              </div>
            )
          ) : null}
        </div>
      </section>

      {/* Buy Now Modal */}
      {showBuyNow && localListing && (
        <BuyNowModal listing={localListing} onClose={() => setShowBuyNow(false)} />
      )}
    </main>
  );
}