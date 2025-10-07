import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { api } from "./api"; 

export default function SaveButton({
  listingId,
  className = "icon-btn",
  onChange,
}) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Load initial saved state (for the current user)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const current = getAuth().currentUser;
        if (!current) return; // unauthenticated -> leave as false

        // /api/saves?idsOnly=1 returns an array of item IDs saved by the user
        const ids = await api
          .get("/saves?idsOnly=1")
          .then((r) => Array.isArray(r.data) ? r.data : []);
        if (alive) setSaved(ids.includes(String(listingId)));
      } catch {
        // Ignore load errors — non-blocking
      }
    })();

    return () => {
      alive = false;
    };
  }, [listingId]);

  const toggleSave = async () => {
    const current = getAuth().currentUser;
    if (!current) {
      alert("Please sign in to save items.");
      return;
    }

    // Optimistic update
    const next = !saved;
    const delta = next ? +1 : -1;

    setBusy(true);
    setSaved(next);
    onChange && onChange(next, delta);

    try {
      if (next) {
        // Save
        await api.post(`/saves/${listingId}`);
      } else {
        // Unsave
        await api.delete(`/saves/${listingId}`);
      }
    } catch (e) {
      // Roll back UI on failure
      console.error("Save/Unsave failed:", e);
      setSaved(!next);
      onChange && onChange(!next, -delta);
      alert("Could not update saved state. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleSave}
      className={className}
      aria-pressed={saved ? "true" : "false"}
      aria-label={saved ? "Unsave this item" : "Save this item"}
      title={saved ? "Unsave" : "Save"}
      disabled={busy}
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "6px 10px",
        background: saved ? "#eef2ff" : "#fff",
        cursor: busy ? "not-allowed" : "pointer",
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      {saved ? "★ Saved" : "☆ Save"}
    </button>
  );
}
