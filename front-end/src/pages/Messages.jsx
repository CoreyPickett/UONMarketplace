import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Avatar from "../components/Avatar";
import { sendMessage } from "../components/MessageUtils";
import "./Messages.css";

// Shows all message threads for logged-in user
const ConversationList = () => {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]); // all conversations
  const [loading, setLoading] = useState(true); // Loading state
  const [menuFor, setMenuFor] = useState(null); // Which thread menu is open
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // Which thread is being deleted
  const me = getAuth().currentUser?.uid || getAuth().currentUser?.email || "me"; //Add Me for Unread tracking

// fetch all message threads for the user
useEffect(() => {
  const auth = getAuth();
  setLoading(true);

  const unsub = onAuthStateChanged(auth, async (user) => {
    try {
      if (!user) {
        console.warn("No user logged in; showing demo.");
        setThreads(DEMO_THREADS);
        setLoading(false);
        return;
      }
      const token = await user.getIdToken();
      const { data } = await api.get("/messages", {
        headers: { authtoken: token },
      });

      const list = Array.isArray(data?.threads)
        ? data.threads
        : Array.isArray(data)
        ? data
        : [];

      setThreads(list.length ? list : DEMO_THREADS);
    } catch (e) {
      console.warn("GET /api/messages failed; showing demo:", e);
      setThreads(DEMO_THREADS);
    } finally {
      setLoading(false);
    }
  });

  return () => unsub();
}, []);

  // Mark conversation as read
  const handleMarkAsRead = async (id) => {
    // Only call backend if not a demo thread
    if (!id.startsWith("demo-")) {
      try {
        const token = await getAuth().currentUser?.getIdToken();
        if (token) {
          await api.post(`/messages/${id}/read`, null, { headers: { authtoken: token } });
        }
      } catch (e) {
        console.error("Failed to mark as read", e);
      }
    }
    // Update local state so UI reflects the change immediately
    setThreads((prev) =>
      prev.map((t) => (t._id === id ? { ...t, unread: { ...(t.unread || {}), me: 0 } } : t))
    );
    setMenuFor(null);
  };

  // Delete conversation
  const handleDelete = async (id) => {
    try {
      const token = await getAuth().currentUser?.getIdToken();
      await api.delete(`/messages/${id}`, {
        headers: { authtoken: token }
      });
    } catch (e) {
      console.error("Failed to delete conversation", e);
      alert("Could not delete conversation. Please try again.");
    }
    setThreads((prev) => prev.filter((t) => t._id !== id));
    setConfirmDeleteId(null);
    setMenuFor(null);
  };

  useEffect(() => {
   console.log("menuFor updated:", menuFor);
 }, [menuFor]);

  // loading message
  if (loading) return <div>Loading messages…</div>;
  // No convos message
  if (!threads.length) return <div>No conversations yet.</div>;

return (
  <div>
    <h2>Conversations:</h2>
    <table className="messages-table">
      <tbody>
        {threads.map((t) => {
          const title = `${t.otherUserName ?? "User"}${t.listingTitle ? " – " + t.listingTitle : ""}`;

          const goToThread = () =>
            navigate(`/messages/${t._id}`, {
              state: {
                preview: {
                  sender: title,
                  avatar: t.avatar ?? "/images/default-avatar.png",
                  listingId: t.listingId,
                  listingTitle: t.listingTitle,
                  ownerUid: t.ownerUid,
                  meta: {
                    me: t.meta?.me,
                    other: t.meta?.other
                  },
                  messages: t.messages
                }
              }
            });

          return (
            <tr key={t._id}>
              <td onClick={goToThread} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
                <Avatar
                  src={t.avatar}
                  fallbackText={t.otherUserName?.[0]?.toUpperCase() || "U"}
                  size="sm"
                />
                <span className="sender">{title}</span>
              </td>

              <td onClick={goToThread} style={{ cursor: "pointer" }}>
                <strong>{(t.unread?.[me] ?? 0) > 0 ? "Unread" : "Read"}</strong>{" "}
                <span className="msg-preview">{t.lastMessage}</span>
              </td>

              <td>{t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleString() : ""}</td>

              <td style={{ position: "relative" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuFor(menuFor === String(t._id) ? null : String(t._id));
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                  aria-label="Open message menu"
                >
                  ⋮
                </button>

                {menuFor === String(t._id) && (
                  <div className="dropdown">
                    <button onClick={() => handleMarkAsRead(t._id)}>Mark as read</button>
                    <button style={{ color: "red" }} onClick={() => setConfirmDeleteId(t._id)}>
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>

    {confirmDeleteId && (
      <div className="delete-confirm-popup">
        <div>
          <p>Delete this conversation?</p>
          <button className="btn" onClick={() => handleDelete(confirmDeleteId)} style={{ marginRight: 10 }}>
            Delete
          </button>
          <button className="btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
        </div>
      </div>
    )}
  </div>
);
}
  
//  convo list
export default function Messages() {
  return (
    <main className="messages-content">
      <h1 className="page-title">Messages</h1>
      <ConversationList />
    </main>
  );
}