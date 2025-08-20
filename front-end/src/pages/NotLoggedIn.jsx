
import { useNavigate, useLocation } from "react-router-dom";

export default function NotLoggedIn({ title = "You’re not logged in", message = "Please log in to continue." }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="not-logged-in" style={{ maxWidth: 560, margin: "48px auto", textAlign: "center" }}>
      <h2 style={{ marginBottom: 8 }}>{title}</h2>
      <p style={{ marginBottom: 16, color: "#6b7280" }}>{message}</p>
      <button
        onClick={() => navigate("/login", { state: { from: location } })}
        style={{
          background: "#003057", color: "#fff", border: "none",
          padding: "10px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer"
        }}
      >
        Go to Login
      </button>
    </div>
  );
}
