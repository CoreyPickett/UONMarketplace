import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import useUser from "./useUser";

export default function Header() {
  const { isLoading, user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const onSignOut = async () => {
    try {
      await signOut(getAuth());
      navigate("/login");
    } catch (e) {
      console.error(e);
      alert("Sign out failed. Please try again.");
    }
  };

  return (
    <header style={wrap}>
      <nav style={nav}>
        {/* Left: brand + primary links */}
        <div style={left}>
          <Link to="/" style={brand} aria-label="UoN Marketplace Home">
            <span style={brandMark}>UoN</span>
            <span>Marketplace</span>
          </Link>
          <ul style={links}>
            <li><Link to="/marketplace" style={link(location, "/marketplace")}>Marketplace</Link></li>
            <li><Link to="/saved" style={link(location, "/saved")}>Saved</Link></li>
            <li><Link to="/create-listing" style={link(location, "/create-listing")}>Create Listing</Link></li>
            <li><Link to="/admin" style={link(location, "/admin")}>Admin</Link></li>
          </ul>
        </div>

        {/* Right: auth controls */}
        <ul style={right}>
          {isLoading ? (
            <li style={{ color: "#6b7280" }}>Loading…</li>
          ) : user ? (
            <>
              <li style={{ color: "#6b7280", fontWeight: 600 }}>
                {user.email?.split("@")[0] || "Account"}
              </li>
              <li>
                <Link to="/profile" style={btnSecondary}>Profile</Link>
              </li>
              <li>
                <button type="button" onClick={onSignOut} style={btnPrimary}>
                  Sign out
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" style={btnSecondary}>Log in</Link>
              </li>
              <li>
                <Link to="/registration" style={btnPrimary}>Sign up</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

const wrap = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  background: "#ffffff",
  borderBottom: "1px solid #e5e7eb",
};

const nav = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "10px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const left = { display: "flex", alignItems: "center", gap: 16 };

const brand = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  textDecoration: "none",
  color: "#003057",
  fontWeight: 800,
  fontSize: "1.05rem",
};

const brandMark = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 6,
  background: "#003057",
  color: "#fff",
  fontSize: 14,
  fontWeight: 800,
};

const links = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const link = (location, toPath) => ({
  textDecoration: "none",
  color: location.pathname.startsWith(toPath) ? "#003057" : "#0f172a",
  fontWeight: location.pathname.startsWith(toPath) ? 800 : 600,
  padding: "8px 10px",
  borderRadius: 8,
  border: location.pathname.startsWith(toPath) ? "1px solid #003057" : "1px solid transparent",
  background: location.pathname.startsWith(toPath) ? "rgba(0,48,87,0.06)" : "transparent",
});

const right = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const btnBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  textDecoration: "none",
  cursor: "pointer",
  lineHeight: 1,
  userSelect: "none",
};

const btnPrimary = {
  ...btnBase,
  background: "#003057",
  color: "#fff",
  borderColor: "transparent",
};

const btnSecondary = {
  ...btnBase,
  background: "#fff",
  color: "#003057",
  borderColor: "#003057",
};
