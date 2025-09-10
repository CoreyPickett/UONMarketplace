import { useState } from "react";
import { getAuth, updateEmail, EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./UpdateEmail.css";

export default function UpdateEmail() {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [reauthNeeded, setReauthNeeded] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user.providerData.length === 0) {
      console.warn("No provider data found. Email update may be blocked.");
    }

    if (!user || !user.email) {
      alert("User session expired. Please log in again.");
      navigate("/login");
      return;
    }

    if (!newEmail.includes("@") || !newEmail.includes(".")) {
      alert("Please enter a valid email address.");
      setUpdating(false);
      return;
    }

    if (!user.emailVerified) {
      alert("Your current email is not verified. Please verify it before updating.");

      try {
        await sendEmailVerification(user);
        alert("Verification email sent. Please check your inbox.");
      } catch (err) {
        console.error("Failed to send verification email", err);
        alert("Could not send verification email. Try again later.");
      }

      setUpdating(false);
      return;
    }

    try {
      await updateEmail(user, newEmail);
      setPassword("");
      setReauthNeeded(false);
      navigate("/UpdateSuccess");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setReauthNeeded(true);
      } else {
        console.error("Email update failed", err);
        alert(err.message || "Email update failed.");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleReauthAndUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const auth = getAuth();
    const user = auth.currentUser;
    console.log(auth.currentUser.providerData);

    
    if (!user || !user.email) {
      alert("User session expired. Please log in again.");
      navigate("/login");
      return;
    }

    if (!newEmail.includes("@") || !newEmail.includes(".")) {
      alert("Please enter a valid email address.");
      setUpdating(false);
      return;
    }

    if (!user.emailVerified) {
      alert("Your current email is not verified. Please verify it before updating.");

      try {
        await sendEmailVerification(user);
        alert("Verification email sent. Please check your inbox.");
      } catch (err) {
        console.error("Failed to send verification email", err);
        alert("Could not send verification email. Try again later.");
      }

      setUpdating(false);
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail);
      setPassword("");
      setReauthNeeded(false);
      navigate("/UpdateSuccess");
    } catch (err) {
      console.error("Reauthentication failed", err);
      alert("Reauthentication failed. Please check your password.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="update-email-container">
      <h2 style={{ textAlign: "center" }}>Update Email</h2>
      <form onSubmit={reauthNeeded ? handleReauthAndUpdate : handleUpdate}>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Enter new email"
          required
        />

        {reauthNeeded && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter current password to reauthenticate"
            required
          />
        )}

        <button type="submit" disabled={updating}>
          {updating
            ? "Updating…"
            : reauthNeeded
            ? "Reauthenticate & Update"
            : "Confirm Email Change"}
        </button>
      </form>
      <div className="back-link">
        <a href="/profile">← Back to Profile</a>
      </div>
    </div>
  );
}