import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";        
import "./Messages.css";

// Lets users search for profiles 
const ProfileSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [profiles, setProfiles] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      // Fetch all marketplace items 
      const { data } = await api.get("/marketplace/"); 
      // Filter results
      const filtered = (data || []).filter(item =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setProfiles(filtered);
    } catch (err) {
      console.error("Error fetching profiles:", err);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <h2>Search Profiles</h2>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search profiles..."
        />
        <button className="btn" type="submit">Search</button>
      </form>
    </div>
  );
};

// just as a demo
const DEMO_THREADS = [
  {
    _id: "demo-1",
    otherUserName: "Jane Smith",
    lastMessage: "Have you delivered the textbooks yet?",
    lastMessageAt: new Date().toISOString(),
    unread: { me: 1 },
    avatar: "/images/default-avatar.png",
  },
];

// Shows all message threads for logged-in user
const ConversationList = () => {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]); // all conversations
  const [loading, setLoading] = useState(true); // Loading state
  const [menuFor, setMenuFor] = useState(null); // Which thread menu is open
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // Which thread is being deleted

  // fetch all message threads for the user
  useEffect(() => {
    (async () => {
      try {
        // fetch all conversations for user
        const { data } = await api.get("/messages");
        const list = data?.threads ?? data ?? [];
        // If no threads demo it
        setThreads(list.length ? list : DEMO_THREADS);
      } catch (e) {
        // If API fails demo it and log error
        console.warn("GET /api/messages failed; showing demo:", e);
        setThreads(DEMO_THREADS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Mark conversation as read 
  const handleMarkAsRead = async (id) => {
    // API call is commented out for demo will uncomment when backend is ready
    // try {
    //   await api.post(`/messages/${id}/read`);
    // } catch (e) {
    //   console.error("Failed to mark as read", e);
    // }
    // Update local state so UI reflects the change immediately
    setThreads((prev) =>
      prev.map((t) =>
        t._id === id ? { ...t, unread: { ...t.unread, me: 0 } } : t
      )
    );
    setMenuFor(null);
  };

  // Delete conversation 
  const handleDelete = async (id) => {
    // API call is commented out for demo will uncomment when backend is ready
    // try {
    //   await api.delete(`/messages/${id}`);
    // } catch (e) {
    //   console.error("Failed to delete conversation", e);
    // }
    // Remove the thread from local state
    setThreads((prev) => prev.filter((t) => t._id !== id));
    setConfirmDeleteId(null);
    setMenuFor(null);
  };

  // loading message 
  if (loading) return <div>Loading messages…</div>;
  // No convos message
  if (!threads.length) return <div>No conversations yet.</div>;

  return (
    <div>
      <h2>Conversations:</h2>
      <table className="messages-table">
        <tbody>
          {threads.map((t) => (
            <tr key={t._id}>
              <td
                onClick={() =>
                  navigate(`/messages/${t._id}`, {
                    state: {
                      preview: {
                        sender: t.otherUserName ?? "User",
                        avatar: t.avatar ?? "/images/default-avatar.png",
                      },
                    },
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <img src={t.avatar ?? "/images/default-avatar.png"} alt="" width={40} style={{ borderRadius: "50%" }} />
                <span className="sender">{t.otherUserName ?? "User"}</span>
              </td>
              <td
                onClick={() =>
                  navigate(`/messages/${t._id}`, {
                    state: {
                      preview: {
                        sender: t.otherUserName ?? "User",
                        avatar: t.avatar ?? "/images/default-avatar.png",
                      },
                    },
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <strong>{(t.unread?.me ?? 0) > 0 ? "Unread" : "Read"}</strong> {t.lastMessage}
              </td>
              <td>{t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleString() : ""}</td>
              <td style={{ position: "relative" }}>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setMenuFor(menuFor === t._id ? null : t._id);
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                  aria-label="Open message menu"
                >
                  ⋮
                </button>
                {menuFor === t._id && (
                  <div className="dropdown">
                    <button onClick={() => handleMarkAsRead(t._id)}>Mark as read</button>
                    <button style={{ color: "red" }} onClick={() => setConfirmDeleteId(t._id)}>
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {confirmDeleteId && (
        <div className="delete-confirm-popup">
          <div>
            <p>Delete this conversation?</p>
            <button className="btn" onClick={() => handleDelete(confirmDeleteId)} style={{ marginRight: 10 }}>Delete</button>
            <button className="btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

//  convo list
export default function Messages() {
  return (
    <main className="messages-content">
      <h1 className="page-title">Messages</h1>

      <ConversationList />
    </main>
  );
}