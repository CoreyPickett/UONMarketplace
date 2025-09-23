//Create Message Form
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./CreateListing.css";
import NotLoggedIn from "./NotLoggedIn";

export default function CreateMessage() {
  const [formData, setFormData] = useState({
    otherUserName: "",
    lastMessage: "",
    lastMessageAt: "",
    unread: [],   
    message: "",            
  });

  const [submitting, setSubmitting] = useState(false);

  // render-level, not inside onSubmit
  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (u) => {
      setUser(u || null);
      setCheckingUser(false);
    });
    return () => unsub();
    }, []);

    

    const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);

      const auth = getAuth();
      const current = auth.currentUser;

      // return JSX here—just redirect 
      if (!current) {
        navigate("/login", { replace: true, state: { from: "/create-message" } });
        return;
      }

      if (!formData.otherUserName || !formData.message ) {
        alert("Please fill in OtherUserName and LastMessage.");
        setSubmitting(false);
        return;
      }

      const token = await current.getIdToken(true); // force refresh OK
      const payload = {
        ...formData,
        
      };

      const res = await axios.post("/api/marketplace/create-message", payload, {
        headers: { authtoken: token },
      });

      if (res.status === 201 && res.data?.success) {
        alert("Messages created successfully!");
        navigate("/messages");
      } else {
        throw new Error("Unexpected response from server.");
      }
    } catch (err) {
      console.error("Create message error:", err);
      const status = err?.response?.status;
      const data = err?.response?.data;
      alert(
        `Failed to create messages. ${status ? `Status: ${status}. ` : ""}${
          data?.error || data?.message || ""
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    setFormData((p) => ({
      ...p,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

// route to not logged in page if not logged in
  if (checkingUser) return null; 
  if (!user) {
    return (
      <NotLoggedIn
        title="You’re not logged in"
        message="You must be logged in to create a messages."
      />
    );
  }

    return (
        <div>
            <h1 style={{ textAlign: "center", marginBottom: 20 }}>Create New Messages</h1>
            <form onSubmit={onSubmit} className="create-form">
            <input
                name="otherUserName"
                placeholder="otherUserName"
                value={formData.otherUserName}
                onChange={handleChange}
                required
            />

            <textarea
                name="message"
                placeholder="Message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                //required
            />

            <button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create Listing"}
            </button>
            </form>
        </div>
    )



}