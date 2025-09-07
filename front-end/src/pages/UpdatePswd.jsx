import { useState } from "react";
import { getAuth, updatePassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./UpdatePswd.css";

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setUpdating(true);
    try {
      const auth = getAuth();
      await updatePassword(auth.currentUser, newPassword);
      navigate("/UpdateSuccess");
    } catch (err) {
      console.error("Password update failed", err);
      alert("You may need to reauthenticate.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="update-password-container">
      <h2 style={{ textAlign: "center" }}>Update Password</h2>
      <form onSubmit={handleUpdate}>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          required
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
        />
        <button type="submit" disabled={updating}>
          {updating ? "Updating…" : "Confirm Password Change"}
        </button>
      </form>
      <div className="back-link">
        <a href="/profile">← Back to Profile</a>
      </div>
    </div>
  );
}