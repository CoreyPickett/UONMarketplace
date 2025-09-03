import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import MessageMaker from "../components/MessageMaker";
import MessageList from "../components/MessageList";
import { api } from "../api";
import "./DirectMessage.css";

// Demo if API fails
const DEMO_MESSAGES = {
  "demo-1": [
    { _id: "m1", from: "u_jane", body: "Have you delivered the textbooks yet?", at: "2025-08-19T09:19:00Z" },
    { _id: "m2", from: "me",     body: "Yes",          at: "2025-08-19T09:20:37Z" },
  ],
};

export default function DirectMessage() {
  const { id } = useParams(); // Get convo ID from URL
  const navigate = useNavigate();
  const { state } = useLocation();
  const preview = state?.preview; // Info from previous page
  const me = "me"; // Replace with real user ID later on i guess

  const [loading, setLoading] = useState(true);
  const [thread, setThread] = useState(preview || null);
  const [messages, setMessages] = useState([]);

  // Load messages 
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Try to get message from the backend
        const { data } = await api.get(`/messages/${id}`);
        if (cancelled) return;

        const t = data?.thread || {};
        setThread({
          sender: t.otherUserName || t.name || preview?.sender || "User",
          avatar: t.avatar || preview?.avatar || "/images/default-avatar.png",
        });
        setMessages(data?.messages || []);
        // Mark as read in backend
        try { await api.post(`/messages/${id}/read`); } catch {}
      } catch (e) {
        // If API fails use demo 
        console.warn(`GET /api/messages/${id} failed; using demo/preview`, e);
        if (!cancelled) {
          setThread(preview || { sender: "User", avatar: "/images/default-avatar.png" });
          setMessages(DEMO_MESSAGES[id] || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, preview]);

  // Send new message
  const handleSend = async (body) => {
    // Add message 
    const temp = { _id: `tmp_${Date.now()}`, from: me, body, at: new Date().toISOString() };
    setMessages((prev) => [...prev, temp]);
    try {
      // Try to send to backend
      const { data } = await api.post(`/messages/${id}/messages`, { postedBy: me, text: body });
      const real = data?.messages || temp;
      // Replace temp message with real one from backend
      setMessages((prev) => prev.map((m) => (m._id === temp._id ? real : m)));
    } catch (e) {
      // If send fails, keep the temp message
      console.warn("Send failed; keeping optimistic message", e);
      // (optionally rollback instead)
    }
  };

  if (loading) return <main style={{ padding: 20 }}>Loading…</main>;
  if (!thread)  return <main style={{ padding: 20 }}>Conversation not found</main>;

  return (
    <main className="direct-message-content" style={{ padding: 20 }}>
      <button className="back-button" onClick={() => navigate("/messages")}>Back to Messages</button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0" }}>
        <img src={thread.avatar} alt={thread.sender} width={50} style={{ borderRadius: "50%" }} />
        <h2 style={{ margin: 0 }}>{thread.sender}</h2>
      </div>

      <MessageList messages={messages} me={me} />
      <MessageMaker onSend={handleSend} />
    </main>
  );
}