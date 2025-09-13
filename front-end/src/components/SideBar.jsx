import { NavLink } from "react-router-dom";   // <— swap Link -> NavLink
import { useEffect } from "react";

export default function Sidebar({ open, onClose }) {
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
          {[
            { to: "/", label: "Dashboard", end: true },
            { to: "/marketplace", label: "Browse Marketplace" },
            { to: "/create-listing", label: "Create Listing" },
            { to: "/messages", label: "Messages" },
            { to: "/profile", label: "Profile" },
            { to: "/admin", label: "Admin" },
          ].map((item) => (
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
