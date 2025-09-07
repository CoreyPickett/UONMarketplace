import { useState } from "react";
import { getAuth, updateEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./UpdateEmail.css";

export default function UpdateEmail() {
  const [newEmail, setNewEmail] = useState("");
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const auth = getAuth();
      await updateEmail(auth.currentUser, newEmail);
      navigate("/UpdateSuccess");
    } catch (err) {
      console.error("Email update failed", err);
      alert("You may need to reauthenticate.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="update-email-container">
      <h2 style={{ textAlign: "center" }}>Update Email</h2>
      <form onSubmit={handleUpdate}>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Enter new email"
          required
        />
        <button type="submit" disabled={updating}>
          {updating ? "Updating…" : "Confirm Email Change"}
        </button>
      </form>
      <div className="back-link">
        <a href="/profile">← Back to Profile</a>
      </div>
    </div>
  );
}