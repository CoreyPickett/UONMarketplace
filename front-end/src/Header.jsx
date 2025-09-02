// src/Header.jsx (or wherever your NavBar lives)
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import useUser from "./useUser";

export default function NavBar() {
  const { isLoading, user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the back button on these paths (edit to taste)
  const hideOn = ["/"];
  const showBack = !hideOn.includes(location.pathname);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1); // go back one page
    } else {
      navigate("/", { replace: true }); // safe fallback if no history
    }
  };

  return (
    <nav
      style={{
        backgroundColor: "#1e1e1e",
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: Back, Return, and user label */}
      <ul
        style={{
          display: "flex",
          listStyle: "none",
          margin: 0,
          padding: 0,
          alignItems: "center",
          gap: "12px",
          color: "white",
        }}
      >
        {/* Back button (global) */}
        {showBack && (
          <li>
            <button
              onClick={goBack}
              style={buttonStyle}
              aria-label="Go back"
              title="Go back"
            >
              ← Back
            </button>
          </li>
        )}

        {/* Return to Dashboard button */}
        <li>
          <button
            onClick={() => navigate("/")}
            style={buttonStyle}
            title="Return to Dashboard"
          >
            Return to Dashboard
          </button>
        </li>

        {isLoading ? (
          <li style={{ marginLeft: 8 }}>Loading...</li>
        ) : (
          <>
            {user && (
              <li style={{ fontWeight: "bold", marginLeft: 6 }}>
                Logged in as {user.email}
              </li>
            )}
            <li>
              {user ? (
                <button
                  onClick={() => signOut(getAuth())}
                  style={buttonStyle}
                  title="Sign out"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  style={buttonStyle}
                  title="Sign in"
                >
                  Sign In
                </button>
              )}
            </li>
          </>
        )}
      </ul>

      {/* Right: Logo / brand */}
      <Link to="/" style={{ display: "inline-flex", alignItems: "center" }}>
        <img
          src="/uon-logo.jfif"
          alt="UoN Logo"
          style={{ height: "40px", borderRadius: "4px" }}
        />
      </Link>
    </nav>
  );
}

const buttonStyle = {
  backgroundColor: "#ffffff",
  color: "#1e1e1e",
  border: "none",
  padding: "8px 14px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};
