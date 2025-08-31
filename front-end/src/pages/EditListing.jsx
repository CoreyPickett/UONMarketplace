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
        image: "",
        seller: "",
        quantity: 1,            
      });
    
      const [submitting, setSubmitting] = useState(false);

  // preview fallbacks
  const [thumbFallback, setThumbFallback] = useState(false);
  const [previewFallback, setPreviewFallback] = useState(false);

  // render-level, not inside onSubmit
  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchListing = async () => {
        try {
        const res = await axios.get(`/api/marketplace/${id}`);
        if (res.status === 200 && res.data) {
            setFormData(res.data);
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
    if (formData.image) {
      setThumbFallback(false);
      setPreviewFallback(false);
    }
  }, [formData.image]);


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

  // image preview sources
  const thumbSrc =
    thumbFallback || !formData.image ? "/placeholder-listing.jpg" : formData.image;

  const previewSrc =
    previewFallback || !formData.image ? "/placeholder-listing.jpg" : formData.image;

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

          <div className="edit-form-image-row">
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp, image/gif"
              onChange={async (e) => {
                const file = e.target.files[0];

                if (!file) return;

                const rawType = file.type?.toLowerCase(); //Extra sanitisation to exclude file type errors
                const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
                const filetype = validTypes.includes(rawType) ? rawType : "image/jpeg";
                const filename = encodeURIComponent(file.name?.trim());

                if (!filename || !filetype) {
                  console.error("Invalid filename or filetype:", { filename, filetype });
                  alert("Unsupported image type or missing filename.");
                  return;
                }

                try {
                  const { data } = await axios.get(
                    "/api/marketplace/s3-upload-url",
                    { params: { filename, filetype } }
                  );

                  await axios.put(data.uploadURL, file, {
                    headers: { "Content-Type": filetype },
                  });

                  const imageUrl = `https://${import.meta.env.VITE_S3_BUCKET_NAME}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${data.key}`;
                  setFormData((prev) => ({ ...prev, image: imageUrl }));
                  setThumbFallback(false);
                  setPreviewFallback(false);
                } catch (error) {
                  console.error("Image upload failed:", error);
                  alert("Image upload failed. Please try again.");
                }
              }}
            />
            <div className="edit-form-thumb-preview">
              <img
                src={thumbSrc}
                alt="thumb"
                className="edit-form-thumb-img"
                onError={() => setThumbFallback(true)}
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
              alt={formData.title || "Preview image"}
              className="listing-image"
              onError={() => setPreviewFallback(true)}
            />
            <div className="listing-badges">
              {formData.condition && <span className="badge">{formData.condition}</span>}
              {formData.price && <span className="badge badge-primary">{priceAUD}</span>}
            </div>
          </div>

          <div className="listing-info">
            <h3 className="listing-title">{formData.title || "Listing title"}</h3>
            {formData.category && <p className="listing-category">{formData.category}</p>}
            {formData.location && <p className="listing-location">📍 {formData.location}</p>}
            {formData.seller && <p className="listing-name">Listed by {formData.ownerEmail.split("@")[0]}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}