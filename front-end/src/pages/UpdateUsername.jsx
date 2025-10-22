import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../api";

export default function UpdateUsername({ currentUsername }) {
  const [username, setUsername] = useState(currentUsername || "");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateUsername = (name) => /^[a-zA-Z0-9_-]{3,20}$/.test(name);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateUsername(username)) {
      setStatus({ type: "error", message: "Invalid format. Use 3–20 characters: letters, numbers, _ or -." });
      return;
    }

    setLoading(true);
    try {
      const res = await api.put("/user/updateUsername", { username });
      navigate("/UpdateSuccess", {
        state: {
          type: "username",
          message: `Your username has been updated to "${res.data.username}".`
        }
      });
    } catch (err) {
      const msg = err.response?.data?.error || "Unexpected error";
      setStatus({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="settings-form">
      <label htmlFor="username">New Username</label>
      <input
        id="username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Choose a username"
        disabled={loading}
      />

      {/* Current Username Display */}
      <div className="muted">
        Current: <strong>{currentUsername || "Not set yet"}</strong>
      </div>

      <button type="submit" disabled={loading || username === currentUsername}>
        {loading ? "Updating..." : "Update Username"}
      </button>

      {status && <div className={`status ${status.type}`}>{status.message}</div>}
    </form>
  );
}