import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import MessageMaker from "../components/MessageMaker";
import MessageList from "../components/MessageList";
import { api } from "../api";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./DirectMessage.css";

export default function DirectMessage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [me, setMe] = useState(null);

  // preview from previous page (may be undefined on hard reload)
  const preview = location.state?.preview || {};
  const listingId = preview.listingId || null;
  const ownerUid = preview.ownerUid || null;
  


  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // seed thread + messages from preview if we have it
  const [thread, setThread] = useState(
    preview
      ? {
          title: preview.listingTitle
            ? `${preview.other?.name || "User"} - ${preview.listingTitle}`
            : (preview.other?.name || "User"),
          me: preview.meta?.me,
          other: preview.meta?.other,
        }
      : null
  );
  const [messages, setMessages] = useState(preview?.messages || []);

  const isValidObjectId = (s) =>
    typeof s === "string" && /^[a-f\d]{24}$/i.test(s);

  // wait for Firebase auth, then fetch the real thread (works on hard reload)
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), async (user) => {
      setMe(user?.uid || null);
      if (!isValidObjectId(id)) {
        setError("Bad conversation id.");
        setLoading(false);
        return;
      }
      try {
        setError("");
        setLoading(true);
        // NOTE: use "/messages/..." if baseURL === "/api"; otherwise use "/api/messages/..."
        const { data } = await api.get(`/messages/${id}`);
        const meta = data?.meta || {};
        const otherName = meta.other?.name || "User";
        setThread({
          title: data.listingTitle
            ? `${otherName} - ${data.listingTitle}`
            : otherName,
          me: meta.me,
          other: meta.other,
        });
        setMessages(data?.messages || []);
        api.post(`/messages/${id}/read`).catch(() => {});
      } catch (e) {
        setError(
          e?.response?.status === 401
            ? "Please sign in again."
            : "Conversation not found."
        );
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [id]);
  

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
      console.log("Sending message:", { threadId: id, body });

      const { data } = await api.post(`/messages/${id}/messages`, { text: body });

      setMessages(data?.messages || []);

      const updatedThread = await api.get(`/messages/${id}`);
      const meta = updatedThread.data?.meta || {};
      setThread((prev) => ({
        ...prev,
        lastMessage: updatedThread.data?.lastMessage,
        lastMessageAt: updatedThread.data?.lastMessageAt,
        unread: updatedThread.data?.unread,
        me: meta.me,
        other: meta.other,
      }));
    } catch (e) {
      console.warn("Send failed; keeping optimistic message", e);
    } finally {
      setSending(false);
    }
  };

  async function handleMarkAsSold() {
    if (!listingId || !me || thread?.me?.uid !== me) return;

    console.log("Me:", me);
    console.log("Listing ID:", listingId);

    try {
      const token = await getAuth().currentUser.getIdToken();
      const res = await api.post(`/marketplace/${listingId}/sell`, {
        buyerUid: thread.other?.uid,
        soldAt: new Date().toISOString()
      }, {
        headers: { authtoken: token }
      });

      if (res.data?.success) {
        alert("Item marked as sold.");

        // Add a system message
        setMessages((prev) => [
          ...prev,
          {
            _id: `sys_${Date.now()}`,
            from: "system",
            body: "Item has been marked as sold.",
            at: new Date().toISOString(),
            kind: "system"
          }
        ]);
      } else {
        throw new Error("Failed to mark item as sold");
      }
    } catch (e) {
      console.error("Mark as sold failed:", e);
      alert("Could not mark item as sold. Please try again.");
    }
  }

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
        {me === ownerUid && listingId && (
          <button
            onClick={handleMarkAsSold}
            style={{
              marginLeft: "auto",
              background: "#003057",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Mark as Sold
          </button>
        )}
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