import { NavLink } from "react-router-dom";   
import { useEffect, useMemo, useState } from "react";
import useUser from "../useUser";

export default function Sidebar({ open, onClose }) {
  const { user } = useUser();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${user.uid}`);
        if (!res.ok) throw new Error("Profile fetch failed");
        const data = await res.json();
        setProfileData(data);
      } catch (err) {
        console.error("Failed to fetch profile in Sidebar:", err);
      }
    };
    if (user?.uid) fetchProfile();
  }, [user]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  

  // shared styles for links
  const linkBase = {
    display: "block",
    padding: "12px 16px",
    color: "white",
    textDecoration: "none",
    borderRadius: 10,
    transition: "background .15s ease, color .15s ease, font-weight .05s ease",
    position: "relative",
  };

  const items = useMemo(() => {
    const base = [
      { to: "/", label: "Dashboard", end: true },
      { to: "/marketplace", label: "Browse Marketplace" },
      { to: "/create-listing", label: "Create Listing" },
      { to: "/messages", label: "Messages" },
      { to: "/profile", label: "Profile" },
    ];
    if (profileData?.isAdmin) {
      base.push({ to: "/admin", label: "Admin" });
    }
    return base;
  }, [profileData]);

  return (
    <>

      <style>{`
        .side-link:hover { 
          font-weight: 700; 
          background: rgba(255,255,255,0.06);
        }
        .side-link.is-active::before {
          content:"";
          position:absolute; left:0; top:8px; bottom:8px; width:4px; border-radius:4px;
          background:#60a5fa;
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,.35)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .18s ease",
          zIndex: 60
        }}
        aria-hidden
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        style={{
          position: "fixed", top: 0, left: 0, height: "100vh",
          width: 300, maxWidth: "85vw",
          background: "#0A2A44", color: "white",
          boxShadow: "2px 0 16px rgba(0,0,0,.25)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .22s ease",
          zIndex: 70, display: "flex", flexDirection: "column"
        }}
      >
        <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ letterSpacing: .5 }}>UoN Marketplace</strong>
          <button onClick={onClose} aria-label="Close menu"
            style={{ background: "transparent", color: "white", border: 0, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        <nav style={{ padding: 8 }}>
          
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => `side-link ${isActive ? "is-active" : ""}`}
              style={({ isActive }) => ({
                ...linkBase,
                fontWeight: isActive ? 800 : 500,
                color: isActive ? "#fff" : "white",
                background: isActive ? "rgba(255,255,255,.12)" : "transparent",
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>


      </aside>
    </>
  );
}
