//Buy now page
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import useUser from "../useUser";
import "./BuyNow.css";
import { useNavigate } from "react-router-dom"; 
import api from "../api";
import { getAuth } from "firebase/auth";

const API = "http://localhost:8000";
const formatAUD = (n) =>
  Number.isFinite(Number(n))
    ? Number(n).toLocaleString("en-AU", { style: "currency", currency: "AUD" })
    : n;

export default function BuyNowModal({ listing, onClose }) {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [showCVC, setShowCVC] = useState(false);
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState(false);

  // Close on escape button
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

async function handleConfirm() {
  if (listing.sold) {
    alert("This item has already been Sold.");
    return;
  }

  if (!user || isSubmitting) return;
  setIsSubmitting(true);

  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const token = await currentUser.getIdToken();

    const sellerUid = listing.ownerUid ?? listing.sellerUid;
    let threadId = null;

    if (sellerUid) {
      console.log("Starting thread with seller:", sellerUid);

      const startRes = await api.post(`/messages/start`, {
        listingId: listing._id,
        sellerUid,
        listingTitle: listing.title,
      }, {
        headers: { authtoken: token }
      });

      const thread = startRes.data || {};
      threadId = thread._id || thread.id || thread.threadId;
      console.log("Thread created:", threadId);

      if (!threadId) {
        throw new Error("Failed to create message thread");
      }

      const rawTitle = listing?.title ?? "";
      const safeTitle = rawTitle.replace(/\s+/g, " ").trim() || "your item";
      const paymentLabel = paymentMethod === "cash" ? "cash (meet in person)" : "credit card";
      const messageText = `Hello, I just purchased your "${safeTitle}" through ${paymentLabel}!`.replace(/\s+/g, " ").trim();

      if (!messageText || messageText.length < 10) {
        throw new Error("Message text is empty or too short");
      }

      console.log("Sending message:", messageText);

      try {
        const messageRes = await api.post(`/messages/${threadId}/messages`, {
          kind: "text",
          text: messageText,
          from: user.uid,
        }, {
          headers: { authtoken: token }
        });

        console.log("Message response:", messageRes.data);
      } catch (err) {
        console.warn("Message send failed:", err?.response?.data?.error || err.message);
        throw new Error("Message send failed");
      }
    }

    console.log("Marking item as sold...");

    const sellRes = await api.post(`/marketplace/${listing._id}/sell`, {
      buyerUid: user.uid,
      soldAt: new Date().toISOString()
    }, {
      headers: { authtoken: token }
    });

    if (!sellRes.data?.success) {
      throw new Error("Failed to mark item as sold");
    }

    console.log("Purchase successful. Redirecting...");

    setRevealed(true);
    if (threadId) navigate(`/messages/${threadId}`);
    alert("Purchase successful!");
    onClose(false);

  } catch (e) {
    const errorMsg = e?.response?.data?.error || e?.message || "Unknown error";
    console.warn("Purchase flow failed:", errorMsg);
    alert("Something went wrong. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
}

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Buy Now"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(30,41,59,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="modal-card"
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          padding: 32,
          minWidth: 340,
          maxWidth: 400,
          width: '100%',
          position: 'relative',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 18, fontWeight: 700, fontSize: 24, color: '#003057' }}>
          Buy {listing.title}
        </h2>

        <div className="modal-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ color: '#374151' }}>Price:</div>
          <div style={{ fontWeight: 600 }}>{formatAUD(listing.price)}</div>
        </div>

    

        <div className="modal-row" style={{ marginBottom: 18 }}>
          <label style={{ color: '#374151', marginBottom: 6, display: 'block' }}>Payment method:</label>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ fontWeight: 500 }}>
              <input
                type="radio"
                name="paymentMethod"
                value="credit"
                checked={paymentMethod === "credit"}
                onChange={() => setPaymentMethod("credit")}
                style={{ marginRight: 6 }}
              />
              Credit Card
            </label>
            <label style={{ fontWeight: 500 }}>
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={() => setPaymentMethod("cash")}
                style={{ marginRight: 6 }}
              />
              Pay in Cash (in person)
            </label>
          </div>
        {paymentMethod === "cash" && (
  <div className="modal-row" style={{ marginBottom: 12, color: '#374151', fontSize: 15 }}>
    <strong>Meet up:</strong>{" "}
    {revealed ? (listing.location || "TBA") : "Hidden — shown after purchase"}
  </div>
)}
        </div>

        {paymentMethod === "credit" && (
          <>
            <div className="modal-row" style={{ marginBottom: 12 }}>
              <label htmlFor="cardNumber" style={{ color: '#374151', display: 'block', marginBottom: 2 }}>Card Number</label>
              <input
                id="cardNumber"
                type="text"
                value={cardNumber}
                required
                onChange={e => {
                  const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 16);
                  const formatted = digitsOnly.replace(/(.{4})/g, '$1-').replace(/-$/, '');
                  setCardNumber(formatted);
                }}
                style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #d1d5db' }}
                placeholder="****-****-****-****"
                maxLength={19}
              />
            </div>
            <div className="modal-row" style={{ marginBottom: 12, display: 'flex', gap: 20 }}>
        <div style={{ flex: '0 0 90px', position: 'relative', maxWidth: 90 }}>
                <label htmlFor="cardExpiry" style={{ color: '#374151', display: 'block', marginBottom: 2 }}>Expiry</label>
                <input
                  id="cardExpiry"
                  type="text"
                  value={cardExpiry}
                  required
                  onChange={e => {
                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 4);
                    const formatted = digitsOnly.replace(/(\d{2})(\d{0,2})/, (match, g1, g2) => g2 ? `${g1}/${g2}` : g1);
                    setCardExpiry(formatted);
                  }}
                  style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #d1d5db' }}
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
        <div style={{ flex: '0 0 90px', position: 'relative', maxWidth: 100 }}>
                <label htmlFor="cardCVC" style={{ color: '#374151', display: 'block', marginBottom: 2 }}>CVC</label>
                <input
                  id="cardCVC"
                  type={showCVC ? "text" : "password"}
                  value={cardCVC}
                  required
                  onChange={e => {
                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 3);
                    const formatted = digitsOnly;
                    setCardCVC(formatted);
                  }}
          style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #d1d5db', paddingRight: 36, maxWidth: 90 }}
                  placeholder="123"
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowCVC(v => !v)}
                  aria-label={showCVC ? "Hide CVC" : "Show CVC"}
                  className="modal-cvc-toggle"
                >
                  {showCVC ? 'Hide' : 'Show'}
                </button>
              </div>

              
            </div>
          </>
        )}

        {!user && (
          <p style={{ color: "#9b1c1c", marginTop: 8 }}>
            You must be signed in to purchase.
          </p>
        )}

        <div className="modal-actions" style={{ display: 'flex', gap: 12, marginTop: 18, justifyContent: 'flex-end' }}>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || !user}
            className="btn-primary"

          >
            {isSubmitting ? "Placing order..." : "Confirm purchase"}
          </button>
          
          <button
            onClick={() => onClose(false)}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}