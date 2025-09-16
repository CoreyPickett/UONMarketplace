import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { api } from "./api";
import useUser from "./useUser";
import Layout from "./Layout";
import "./Header.css"; 

export default function Header({ onOpenMenu }) {
  const { isLoading, user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${user.uid}`);
        if (!res.ok) throw new Error("Profile fetch failed");
        const data = await res.json();
        setProfileData(data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    if (user?.uid) fetchProfile();
  }, [user]);

  const canGoBack = useMemo(
    () => window.history.length > 1 && location.pathname !== "/",
    [location.pathname]
  );
  const goBack = () => { if (canGoBack) navigate(-1); };

  const onSignOut = async () => {
    try { await signOut(getAuth()); navigate("/login"); }
    catch (e) { console.error(e); alert("Sign out failed. Please try again."); }
  };

  const isActive = (to) => location.pathname.startsWith(to);

  return (
    <header style={s.wrap}>
      <nav style={s.nav}>
        <div style={s.left}>
          {/* Hamburger */}
          <button
            type="button"
            onClick={onOpenMenu ? onOpenMenu : () => {}}
            aria-label="Open menu"
            style={{ ...s.iconBtn, marginRight: 4 }}
          >☰</button>

          {/* Back + Brand */}
          <div style={s.left}>
            <button
              type="button"
              onClick={goBack}
              disabled={!canGoBack}
              aria-label="Go back"
              style={{ ...s.iconBtn, ...(canGoBack ? {} : s.iconBtnDisabled) }}
            >←</button>

            <Link to="/" aria-label="UoN Marketplace Home" style={s.brandLink}>
              <span style={s.brandMark}>UoN</span>
              <span style={s.brandText}>Marketplace</span>
            </Link>
          </div>
        </div>

        {/* primary links */}
        <ul className="header-links">
          <li><Link to="/marketplace" style={linkStyle(isActive("/marketplace"))}>Marketplace</Link></li>
          <li><Link to="/saved" style={linkStyle(isActive("/saved"))}>Saved</Link></li>
          <li><Link to="/create-listing" style={linkStyle(isActive("/create-listing"))}>Create Listing</Link></li>
          <li><Link to="/admin" style={linkStyle(isActive("/admin"))}>Admin</Link></li>
        </ul>

        {/* Right: auth controls */}
        <ul style={s.right}>
          {isLoading ? (
            <li style={s.muted}>Loading…</li>
          ) : user ? (
            <>
              <li style={{ ...s.muted, fontWeight: 600 }}>
                {profileData?.username
                  ? `@${profileData.username}`
                  : user.email?.split("@")[0] || "Account"}
              </li>

              {/* Hide this Profile on mobile; it will appear in the mobile bar below */}
              <li className="hide-on-mobile">
                <Link to="/profile" style={s.btnSecondary}>Profile</Link>
              </li>

              <li>
                <button type="button" onClick={onSignOut} style={s.btnPrimary}>
                  Sign out
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" style={s.btnSecondary}>Log in</Link></li>
              <li><Link to="/registration" style={s.btnPrimary}>Sign up</Link></li>
            </>
          )}
        </ul>
      </nav>

      {/* ===== Mobile-only second row ===== */}
      <div className="mobile-bar-wrapper">
        <div className="mobile-bar">
          <Link to="/marketplace" className="mobile-bar-link">Marketplace</Link>
          <Link to="/profile" className="mobile-bar-link">Profile</Link>
        </div>
      </div>
      {/* ===== end mobile row ===== */}
    </header>
  );
}


const NAVY = "#003057";
const BORDER = "#e5e7eb";
const INK = "#0f172a";
const MUTED = "#6b7280";
const RADIUS = 10;

const s = {
  wrap: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "#fff",
    borderBottom: `1px solid ${BORDER}`,
    backdropFilter: "saturate(180%) blur(6px)",
  },
  nav: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "10px 16px",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: 12,
  },
  left: { display: "flex", alignItems: "center", gap: 10 },
  brandLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
  },
  brandMark: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28, height: 28,
    borderRadius: 6,
    background: NAVY,
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    boxShadow: "0 1px 4px rgba(0,0,0,.12)",
  },
  brandText: { color: NAVY, fontWeight: 800, fontSize: "1.05rem" },

  links: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    alignItems: "center",
    gap: 10,
    justifySelf: "center",
  },

  right: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
    justifySelf: "end",
  },

  iconBtn: {
    border: `1px solid ${BORDER}`,
    background: "#fff",
    color: NAVY,
    width: 34, height: 34,
    borderRadius: 8,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
    userSelect: "none",
    transition: "transform .06s ease, box-shadow .12s ease",
    boxShadow: "0 1px 4px rgba(0,0,0,.08)",
  },
  iconBtnDisabled: { opacity: 0.5, cursor: "not-allowed", boxShadow: "none" },

  btnBase: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: RADIUS,
    border: `1px solid ${BORDER}`,
    textDecoration: "none",
    cursor: "pointer",
    lineHeight: 1,
    userSelect: "none",
    transition: "transform .06s ease, filter .12s ease, box-shadow .12s ease",
    boxShadow: "0 1px 4px rgba(0,0,0,.06)",
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: RADIUS,
    background: NAVY,
    color: "#fff",
    border: "1px solid transparent",
    cursor: "pointer",
    lineHeight: 1,
    userSelect: "none",
    transition: "transform .06s ease, filter .12s ease, box-shadow .12s ease",
    boxShadow: "0 1px 4px rgba(0,0,0,.10)",
  },
  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: RADIUS,
    background: "#fff",
    color: NAVY,
    border: `1px solid ${NAVY}`,
    textDecoration: "none",
    lineHeight: 1,
    userSelect: "none",
    transition: "transform .06s ease, box-shadow .12s ease",
    boxShadow: "0 1px 4px rgba(0,0,0,.06)",
  },

  muted: { color: MUTED },
};

/** Link styles with active/hover/focus polish */
function linkStyle(active) {
  return {
    textDecoration: "none",
    color: active ? NAVY : INK,
    fontWeight: 900, // Always bold
    padding: "8px 10px",
    borderRadius: 8,
    border: active ? `2px solid ${NAVY}` : "1px solid transparent",
    background: active ? "rgba(0,48,87,0.18)" : "transparent",
    outline: "none",
    transition: "background .12s ease, color .12s ease, transform .06s ease, border .12s ease",
    boxShadow: active ? "0 2px 8px rgba(0,48,87,0.10)" : "none",
    position: "relative",
    cursor: "pointer",
   
    ...(active ? {} : {
      ':hover': {
        background: "rgba(0,48,87,0.10)",
        border: `1px solid ${NAVY}`,
        color: NAVY,
      }
    })
  };
}




