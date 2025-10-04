import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import MessageMaker from "../components/MessageMaker";
import MessageList from "../components/MessageList";
import { api } from "../api";
import { getAuth, onAuthStateChanged } from "firebase/auth";
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
  const [me, setMe] = useState(null); // Replaced hardcoed me with Firebase user UID

  const [loading, setLoading] = useState(true);
  const [thread, setThread] = useState(preview || null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  const isValidObjectId = (id) =>
  typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

  // Keep Bubbles on correct side
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (user) => {
      setMe(user?.uid || null);
    });
    return () => unsub();
  }, []);


  // Load messages 
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Try to get message from the backend
        const { data } = await api.get(`/messages/${id}`);
        const t = data || {};
        const meta = t.meta || {};
        const otherName = meta.other?.name || t.otherUserName || "User";
          setThread({
            title: t.listingTitle ? `${otherName} - ${t.listingTitle}` : otherName,
            me: meta.me,
            other: meta.other,
          });
          setMessages(t.messages || []);
        console.log("Thread data received:", data);
        if (!data) {
          console.warn(`Thread ${id} not found in backend`);
        }
        if (cancelled) return;

        const sellerName = t.otherUserName || t.name || "User";
        const composed = t.listingTitle
          ? `${sellerName} – ${t.listingTitle}`
          : (preview?.sender || sellerName);
        setMessages(t.messages || []);
        // Mark as read in backend
        if (!id.startsWith("demo-") && isValidObjectId(id)) {
          setTimeout(() => {
            api.post(`/messages/${id}/read`).catch((e) =>
              console.warn(`POST /messages/${id}/read failed`, e)
            );
          }, 300); // Optional delay to avoid race conditions
        }
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
    if (!me || sending) return;

    if (!body || typeof body !== "string" || body.trim() === "") {
      console.warn("Invalid message body:", body);
      return;
    }

    setSending(true);

    const temp = {
      _id: `tmp_${Date.now()}`,
      from: me,
      body,
      at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, temp]);

    try {
      const { data } = await api.post(`/messages/${id}/messages`, { body });
      setMessages(data?.messages || []);
    } catch (e) {
      console.warn("Send failed; keeping optimistic message", e);
    } finally {
      setSending(false);
    }
  };

  // Scroll to bottom of messages
  useEffect(() => {
    const el = document.querySelector(".message-list");
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  if (loading) return <main style={{ padding: 20 }}>Loading…</main>;
  if (!thread)  return <main style={{ padding: 20 }}>Conversation not found</main>;

  return (
    <main className="direct-message-content" style={{ padding: 20 }}>
      <button className="back-button" onClick={() => navigate("/messages")}>Back to Messages</button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0" }}>
        <img src={thread.other?.avatar || "/images/default-avatar.png"} alt={thread.title} width={50} style={{ borderRadius: "50%" }} />
        <h2 style={{ margin: 0 }}>{thread.title}</h2>
      </div>

      <MessageList
        messages={messages}
        meUid={thread.me?.uid}
        meAvatar={thread.me?.avatar}
        otherUid={thread.other?.uid}
        otherAvatar={thread.other?.avatar}
      />
      <MessageMaker onSend={handleSend} sending={sending || !me} />
    </main>
  );
}