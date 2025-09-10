import { useState } from "react";
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./UpdatePswd.css";

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [reauthNeeded, setReauthNeeded] = useState(false);
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
    const auth = getAuth();
    const user = auth.currentUser;

    try {
      await updatePassword(user, newPassword);
      navigate("/UpdateSuccess");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setReauthNeeded(true);
      } else {
        console.error("Password update failed", err);
        alert("Something went wrong.");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleReauthAndUpdate = async (e) => {
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
    const auth = getAuth();
    const user = auth.currentUser;

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      navigate("/UpdateSuccess");
    } catch (err) {
      console.error("Reauthentication failed", err);
      alert("Reauthentication failed. Please check your current password.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="update-password-container">
      <h2 style={{ textAlign: "center" }}>Update Password</h2>
      <form onSubmit={reauthNeeded ? handleReauthAndUpdate : handleUpdate}>
        
        <div className="password-group">
          <input
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
          >
            {showNewPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div className="password-group">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>

        {reauthNeeded && (
          <div className="password-group">
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password to reauthenticate"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((prev) => !prev)}
            >
              {showCurrentPassword ? "Hide" : "Show"}
            </button>
          </div>
        )}

        <button type="submit" disabled={updating}>
          {updating
            ? "Updating…"
            : reauthNeeded
            ? "Reauthenticate & Update"
            : "Confirm Password Change"}
        </button>
      </form>
      <div className="back-link">
        <a href="/profile">← Back to Profile</a>
      </div>
    </div>
  );
}