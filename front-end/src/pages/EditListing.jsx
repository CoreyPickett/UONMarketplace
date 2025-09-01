//Edit Listing Form
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./EditListing.css";
import NotLoggedIn from "./NotLoggedIn";



export default function EditListing () {
    const{ id } = useParams();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        price: "",
        condition: "",
        location: "",
        delivery_options: "",   
        images: [],
        quantity: 1,            
      });
    
      const [submitting, setSubmitting] = useState(false);

  // render-level, not inside onSubmit
  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchListing = async () => {
        try {
        const res = await axios.get(`/api/marketplace/${id}`);
        if (res.status === 200 && res.data) {
          const safeData = {
            ...res.data,
            images: Array.isArray(res.data.images) ? res.data.images : [],
          };
          setFormData((prev) => ({ ...prev, ...safeData }));
        } else {
            throw new Error("Listing not found");
        }
        } catch (err) {
        console.error("Failed to load listing:", err);
        navigate("/marketplace"); // fallback
        }
    };

    fetchListing();
    }, [id]);


  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (u) => {
      setUser(u || null);
      setCheckingUser(false);
    });
    return () => unsub();
  }, []);

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

    setFormData((p) => ({
      ...p,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploadedUrls = [];

    for (const file of files) {
      const filename = encodeURIComponent(file.name);
      const filetype = file.type;

      try {
        //Match backend image limit
        if (formData.images.length + files.length > 10) {
          alert("You can upload up to 10 images per listing.");
          return;
        }

        const { data } = await axios.get("/api/marketplace/s3-upload-url", {
          params: { filename, filetype },
        });

        await axios.put(data.uploadURL, file, {
          headers: { "Content-Type": filetype },
        });

        const imageUrl = `https://${import.meta.env.VITE_S3_BUCKET_NAME}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${data.key}`;
        uploadedUrls.push(imageUrl);
      } catch (err) {
        console.error("Image upload failed:", err);
        alert("Image upload failed. Please try again.");
      }
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls],
    }));
  };

  const priceAUD = useMemo(() => {
    const n = Number(formData.price);
    return Number.isFinite(n)
      ? n.toLocaleString("en-AU", { style: "currency", currency: "AUD" })
      : "";
  }, [formData.price]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);

      const auth = getAuth();
      const current = auth.currentUser;

      // return JSX here—just redirect 
      if (!current) {
        navigate("/login", { replace: true, state: { from: "/create-listing" } });
        return;
      }

      if (!formData.title || !formData.description || !formData.category) {
        alert("Please fill in Title, Description and Category.");
        setSubmitting(false);
        return;
      }

      const token = await current.getIdToken(true); // force refresh OK
      const payload = {
        ...formData,
        price: Number(formData.price || 0),
        quantity: Number(formData.quantity || 1),
      };

      const res = await axios.put(`/api/marketplace/${id}`, payload, {
        headers: { authtoken: token },
      });

      if (res.status === 200 && res.data?.success) {
        alert("Listing updated successfully!");
        navigate("/marketplace");
      } else {
        throw new Error("Unexpected response from server.");
      }
    } catch (err) {
      console.error("Create listing error:", err);
      const status = err?.response?.status;
      const data = err?.response?.data;
      alert(
        `Failed to update listing. ${status ? `Status: ${status}. ` : ""}${
          data?.error || data?.message || ""
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Remove image before submitting function
  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };


  // image preview source (updated for multiple images)
  const previewSrc = formData.images?.[0] || "/placeholder-listing.jpg";

  // route to not logged in page if not logged in
  if (checkingUser) return null; 
  if (!user) {
    return (
      <NotLoggedIn
        title="You're not logged in"
        message="You must be logged in to create a listing."
      />
    );
  }

  return (
    <div className="edit-listing-wrapper">
      <div>
  <h1 className="listing-edit-title">Edit Listing</h1>
  <form onSubmit={onSubmit} className="edit-form">
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

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Category
            </option>
            <option value="Electronics">Electronics</option>
            <option value="Books">Books</option>
            <option value="Clothing">Clothing</option>
            <option value="Furniture">Furniture</option>
            <option value="Other">Other</option>
          </select>

          <div className="edit-form-row">
            <input
              name="price"
              type="text"
              inputMode="decimal"
              placeholder="Price (AUD)"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>
          {priceAUD && (
            <div className="edit-form-price-preview">
              Preview price: {priceAUD}
            </div>
          )}

          <div className="edit-form-row">
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Current Condition
              </option>
              <option value="Brand New">Brand New</option>
              <option value="New">New</option>
              <option value="Barely Used">Barely Used</option>
              <option value="Used">Used</option>
              <option value="Well Used">Well Used</option>
            </select>

            <input
              name="location"
              placeholder="Location (e.g. Callaghan Campus)"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <select
            name="delivery_options"
            value={formData.delivery_options}
            onChange={handleChange}   
            required
          >
            <option value="" disabled>Select a delivery option</option>
            <option value="Pickup">Pickup</option>
            <option value="Local Delivery">Local Delivery</option>
            <option value="Postal Delivery">Postal Delivery</option>
          </select>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: 12 }}>
            <input
              type="file"
              multiple
              accept="image/jpeg, image/png, image/webp, image/gif"
              onChange={handleImageUpload}
            />
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              You can upload up to 10 images. The first image will be used as the listing thumbnail.
            </p>
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
                src={previewSrc}
                alt="Preview"
                className="listing-image"
              />
            </div>
          </div>


          <button type="submit" disabled={submitting}>
            {submitting ? "Updating…" : "Edit Listing"}
          </button>
        </form>
      </div>

      <div className="edit-listing-preview">
        <h3 className="edit-listing-preview-title">Preview</h3>
        <div className="listing-card">
          <div className="listing-image-wrapper">
            <img
              src={previewSrc}
              alt="Preview"
              className="listing-image"
            />
            <div className="listing-badges">
              {formData.condition && <span className="badge">{formData.condition}</span>}
              {formData.price && <span className="badge badge-primary">{priceAUD}</span>}
            </div>
          </div>
          <div
          className="image-preview-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))",
            gap: "8px",
            marginTop: "12px",
          }}
        >
          {formData.images.map((url, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img
                src={url}
                alt={`Image ${i + 1}`}
                className="thumbnail"
                style={{
                  width: "100%",
                  height: 48,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  background: "#e5e7eb",
                }}
                onError={(e) => (e.target.src = "/placeholder-listing.jpg")}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
          <div className="listing-info">
            <h3 className="listing-title">{formData.title || "Listing title"}</h3>
            {formData.category && <p className="listing-category">{formData.category}</p>}
            {formData.location && <p className="listing-location">📍 {formData.location}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}