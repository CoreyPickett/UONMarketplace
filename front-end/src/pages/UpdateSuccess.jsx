import { useNavigate, useLocation } from "react-router-dom";

export default function UpdateSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  const message =
    location.state?.message || "Your account has been updated successfully.";
  const type = location.state?.type || "profile";

  return (
    <div className="panel">
      <h2>✅ {type === "username" ? "Username Updated" : "Update Successful"}</h2>
      <p>{message}</p>
      <button className="btn" onClick={() => navigate("/profile")}>
        Return to Profile
      </button>
    </div>
  );
}