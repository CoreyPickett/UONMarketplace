import { useEffect, useMemo, useState } from "react";
import { useParams, useLoaderData, Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { api } from "../api";
import useUser from "../useUser";
import SaveButton from "../SaveButton";
import "./Listing.css";


function BuyNowModal({ listing, onClose }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const price = Number(listing?.price || 0);
  const total = Number.isFinite(price) ? price * (Number(qty) || 1) : 0;

  const submit = async () => {
    try {
      setSubmitting(true);

      // Build initial message body for the seller
      const lines = [
        `Hi, I'm interested in buying "${listing?.title}"`,
        `Quantity: ${qty}`,
        Number.isFinite(price) ? `Offered total: $${total.toFixed(2)} AUD` : null,
        note ? `Note: ${note}` : null,
        "(Sent via Buy Now)"
      ].filter(Boolean);

      // Prefer ownerEmail if present; otherwise fall back to ownerUid if available
      const payload = {
        reciverIds: listing?.ownerUid ? [listing.ownerUid] : undefined,
        reciverEmails: listing?.ownerEmail ? [listing.ownerEmail] : undefined,
        messages: [
          {
            from: "me", // backend will override with authenticated uid/email
            body: lines.join("\n"),
            at: new Date().toISOString(),
          },
        ],
      };

      const res = await api.post("/messages/create-message", payload);
      if (res?.data?.success) {
        alert("Buy request sent to the seller. You can continue the conversation in Messages.");
        onClose?.();
      } else {
        throw new Error("Failed to create conversation");
      }
    } catch (e) {
      console.error(e);
      alert("Could not send buy request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h3 style={{ marginTop: 0 }}>Buy “{listing?.title || "Item"}”</h3>

        <div className="modal-row">
          <label htmlFor="qty">Quantity</label>
          <input
            id="qty"
            type="number"
            min={1}
            step={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>

        <div className="modal-row">
          <label htmlFor="note">Note to seller (optional)</label>
          <textarea
            id="note"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add pickup times, offer details, or questions…"
          />
        </div>

        <div className="modal-summary">
          {Number.isFinite(price) ? (
            <div>
              <div>Price: ${price.toFixed(2)} AUD</div>
              <div><strong>Total: ${total.toFixed(2)} AUD</strong></div>
            </div>
          ) : (
            <div><strong>Contact the seller for price.</strong></div>
          )}
        </div>

        <div className="modal-actions">
          <button className="ListingOptions" onClick={submit} disabled={submitting}>
            {submitting ? "Sending…" : "Send Buy Request"}
          </button>
          <button className="ListingOptions secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
        </div>
      </div>
      <style>{`
        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
          padding: 16px;
        }
        .modal-card {
          width: 100%; max-width: 520px; background: #fff; border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.25); padding: 18px 18px 14px;
        }
        .modal-row { display: flex; flex-direction: column; gap: 6px; margin: 10px 0; }
        .modal-row input, .modal-row textarea {
          border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 10px; font-size: 14px;
        }
        .modal-summary { margin: 12px 0; color: #374151; }
        .modal-actions { display: flex; gap: 10px; margin-top: 10px; }
      `}</style>
    </div>
  );
}

// --- utils ---
const toAUD = (n) =>
  Number.isFinite(Number(n))
    ? Number(n).toLocaleString("en-AU", { style: "currency", currency: "AUD" })
    : n ?? "";

const buildImageUrl = (key) => {
  if (!key) return null;
  if (String(key).startsWith("http")) return key;
  const bucket = import.meta.env.VITE_S3_BUCKET_NAME;
  const region = import.meta.env.VITE_AWS_REGION;
  return bucket && region
    ? `https://${bucket}.s3.${region}.amazonaws.com/${key}`
    : key;
};

export default function Listing() {
  const { id } = useParams();
  const listing = useLoaderData();
  const { user } = useUser();
  const auth = getAuth();

  // Saved count (replaces upvotes)
  const [saves, setSaves] = useState(Number(listing?.saves || 0));

  // Buy Now
  const [showBuyNow, setShowBuyNow] = useState(false);

  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Sync saves on loader change
  useEffect(() => {
    setSaves(Number(listing?.saves || 0));
  }, [listing?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Normalise images → array of URLs
  const images = useMemo(() => {
    const srcs = Array.isArray(listing?.images) && listing.images.length
      ? listing.images
      : (listing?.image ? [listing.image] : []);
    const urls = srcs.map((k) => buildImageUrl(k)).filter(Boolean);
    return urls.length ? urls : ["/placeholder-listing.jpg"];
  }, [listing]);

  const priceText = toAUD(listing?.price);

  if (!listing) {
    return (
      <main style={{ maxWidth: 980, margin: "16px auto", padding: "0 16px" }}>
        <h1>Listing not found</h1>
        <p>That item may have been removed or never existed.</p>
        <Link to="/marketplace" className="ListingOptions">← Back to Marketplace</Link>
      </main>
    );
  }

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
          alt={listing.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => (e.currentTarget.src = "/placeholder-listing.jpg")}
        />

        {images.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              right: 10,
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <button
              className="image-nav-btn"
              onClick={() =>
                setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)
              }
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              className="image-nav-btn"
              onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
              aria-label="Next image"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div style={{ textAlign: "center", fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
          Image {currentImageIndex + 1} of {images.length}
        </div>
      )}

      {/* Badges below image */}
      <div style={{ display: "flex", gap: 8, margin: "8px 0 18px 0", flexWrap: "wrap" }}>
        {listing.condition ? <span className="badge">{listing.condition}</span> : null}
        {priceText ? <span className="badge badge-primary">{priceText}</span> : null}
        {listing.location ? <span className="badge">📍 {listing.location}</span> : null}
        {listing.category ? <span className="badge">{listing.category}</span> : null}
      </div>

      {/* Description */}
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
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 10 }}>
          Listed by{" "}
          <strong>
            {listing.ownerEmail ? listing.ownerEmail.split("@")[0] : "Unknown"}
          </strong>
        </div>

        <div className="listing-actions-row">
          <button
            className="ListingOptions"
            onClick={() => {
              if (!auth.currentUser) {
                alert("Please sign in to use Buy Now.");
                return;
              }
              if (!listing.ownerEmail && !listing.ownerUid) {
                alert("Seller contact is missing for this listing.");
                return;
              }
              setShowBuyNow(true);
            }}
          >
            Buy Now
          </button>

          {/* “Message seller” — mailto if email exists, otherwise route to messages */}
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
