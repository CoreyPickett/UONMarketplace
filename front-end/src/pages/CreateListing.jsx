// src/pages/CreateListing.jsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuth } from "firebase/auth";
import "./CreateListing.css";

export default function CreateListing() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    quantity: 1,
    condition: "",
    location: "",
    delivery_options: [],
    image: "",
    seller: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // Fallback flags to avoid endless re-requests of the placeholder image
  const [thumbFallback, setThumbFallback] = useState(false);
  const [previewFallback, setPreviewFallback] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (name === "price") {
      const cleaned = value.replace(/[^\d.]/g, "");
      return setFormData((p) => ({ ...p, price: cleaned }));
    }
    if (name === "quantity") {
      const q = Math.max(1, Number(value || 1));
      return setFormData((p) => ({ ...p, quantity: q }));
    }

    setFormData((p) => ({ ...p, [name]: type === "number" ? Number(value) : value }));
  };

  const handleArrayChange = (name, value) => {
    const list = value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    setFormData((p) => ({ ...p, [name]: list }));
  };

  const priceAUD = useMemo(() => {
    const n = Number(formData.price);
    return Number.isFinite(n)
      ? n.toLocaleString("en-AU", { style: "currency", currency: "AUD" })
      : "";
  }, [formData.price]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        alert("You must be logged in to create a listing.");
        setSubmitting(false);
        return;
      }

      if (!formData.title || !formData.description || !formData.category) {
        alert("Please fill in Title, Description and Category.");
        setSubmitting(false);
        return;
      }

      const token = await user.getIdToken(true); // force refresh
      const payload = {
        ...formData,
        price: Number(formData.price || 0),
        quantity: Number(formData.quantity || 1),
      };

      const res = await axios.post("/api/marketplace/create-listing", payload, {
        headers: { authtoken: token },
      });

      if (res.status === 201 && res.data?.success) {
        alert("Listing created successfully!");
        navigate("/marketplace");
      } else {
        throw new Error("Unexpected response from server.");
      }
    } catch (err) {
      console.error("Create listing error:", err);
      const status = err?.response?.status;
      const data = err?.response?.data;
      alert(
        `Failed to create listing. ${status ? `Status: ${status}. ` : ""}${
          data?.error || data?.message || ""
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Image sources that respect the fallback flags
  const thumbSrc =
    thumbFallback || !formData.image ? "/placeholder-listing.jpg" : formData.image;

  const previewSrc =
    previewFallback || !formData.image ? "/placeholder-listing.jpg" : formData.image;

  return (
    <div className="create-listing-wrapper">
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>Create New Listing</h1>

      <form onSubmit={onSubmit} className="create-form">
        <input
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          required
        />

        <input
          name="category"
          placeholder="Category (e.g. Electronics, Books)"
          value={formData.category}
          onChange={handleChange}
          required
        />

        <div style={{ display: "flex", gap: 15 }}>
          <input
            name="price"
            type="text"
            inputMode="decimal"
            placeholder="Price (AUD)"
            value={formData.price}
            onChange={handleChange}
            required
          />
          <input
            name="quantity"
            type="number"
            min={1}
            placeholder="Quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
        </div>
        {priceAUD && (
          <div style={{ color: "#4b5563", fontSize: 14 }}>Preview price: {priceAUD}</div>
        )}

        <div style={{ display: "flex", gap: 15 }}>
          <input
            name="condition"
            placeholder="Condition (e.g. New, Used)"
            value={formData.condition}
            onChange={handleChange}
            required
          />
          <input
            name="location"
            placeholder="Location (e.g. Callaghan Campus)"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>

        <input
          name="delivery_options"
          placeholder="Delivery Options (comma separated: Pickup, Post, On-campus)"
          onChange={(e) => handleArrayChange("delivery_options", e.target.value)}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: 12 }}>
          <input
            name="image"
            placeholder="Image URL"
            value={formData.image}
            onChange={(e) => {
              // reset fallbacks whenever user edits the URL
              setThumbFallback(false);
              setPreviewFallback(false);
              handleChange(e);
            }}
          />
          <div
            style={{
              width: 72,
              height: 48,
              borderRadius: 6,
              overflow: "hidden",
              background: "#e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #ddd",
            }}
          >
            <img
              src={thumbSrc}
              alt="thumb"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setThumbFallback(true)}
            />
          </div>
        </div>

        <input
          name="seller"
          placeholder="Seller Name"
          value={formData.seller}
          onChange={handleChange}
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create Listing"}
        </button>
      </form>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ margin: "0 0 12px" }}>Preview</h3>

        <div className="listing-card" style={{ width: 280 }}>
          <div className="listing-image-wrapper">
            <img
              src={previewSrc}
              alt={formData.title || "Preview image"}
              className="listing-image"
              onError={() => setPreviewFallback(true)}
            />
            <div style={{ position: "absolute", left: 12, bottom: 12, display: "flex", gap: 8 }}>
              {formData.condition && <span className="badge">{formData.condition}</span>}
              {formData.price && <span className="badge badge-primary">{priceAUD}</span>}
            </div>
          </div>

          <div className="listing-info">
            <h3 className="listing-title">{formData.title || "Listing title"}</h3>
            {formData.category && <p className="listing-category">{formData.category}</p>}
            {formData.location && <p className="listing-location">📍 {formData.location}</p>}
            {formData.seller && <p className="listing-name">Listed by {formData.seller}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
