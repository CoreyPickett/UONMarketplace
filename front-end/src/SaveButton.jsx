import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import axios from "axios";

export default function SaveButton({ listingId, className = "icon-btn" }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const current = getAuth().currentUser;
        if (!current) return; // not logged in → default false
        const token = await current.getIdToken();
        const ids = await axios
          .get("/api/saves", {
            params: { idsOnly: 1 },
            headers: { authtoken: token },
          })
          .then((r) => r.data || []);
        if (alive) setSaved(ids.includes(String(listingId)));
      } catch {
        /* ignore */
      }
    })();
    return () => { alive = false; };
  }, [listingId]);

  const toggle = async () => {
    try {
      const current = getAuth().currentUser;
      if (!current) {
        alert("Please sign in to save items.");
        return;
      }
      setBusy(true);
      const token = await current.getIdToken();
      if (!saved) {
        await axios.post(`/api/saves/${listingId}`, {}, { headers: { authtoken: token } });
        setSaved(true);
      } else {
        await axios.delete(`/api/saves/${listingId}`, { headers: { authtoken: token } });
        setSaved(false);
      }
    } catch (e) {
      console.error(e);
      alert("Could not update saved state. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      aria-pressed={saved ? "true" : "false"}
      title={saved ? "Unsave" : "Save"}
      disabled={busy}
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "6px 10px",
        background: saved ? "#eef2ff" : "#fff",
        cursor: busy ? "not-allowed" : "pointer",
      }}
    >
      {saved ? "★ Saved" : "☆ Save"}
    </button>
  );
}
