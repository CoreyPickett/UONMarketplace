export default function UpdateSuccess() {
  return (
    <div className="panel">
      <h2>✅ Update Successful</h2>
      <p>Your account has been updated.</p>
      <button className="btn" onClick={() => navigate("/profile")}>
        Return to Profile
      </button>
    </div>
  );
}