// Creates list of messages in a convo
import { useEffect, useRef } from "react";

export default function MessageList({ messages, meUid, meAvatar, otherAvatar }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="message-list">
      {messages?.map((m) => {
        const mine = m.from === meUid;
        const cls = `bubble ${mine ? "me" : "them"}`; // <- matches your CSS
        const avatar = mine ? meAvatar : otherAvatar;
        return (
          <div key={m._id || m.at} style={{ display: "flex", gap: 8, alignItems: "flex-end", justifyContent: mine ? "flex-end" : "flex-start" }}>
            {!mine && <img src={otherAvatar || "/images/default-avatar.png"} alt="" width={28} height={28} style={{ borderRadius: "50%" }} />}
            <div className={cls}>
              <div>{m.body}</div>
              <div className="metadata">{m.at ? new Date(m.at).toLocaleString() : ""}</div>
            </div>
            {mine && <img src={meAvatar || "/images/default-avatar.png"} alt="" width={28} height={28} style={{ borderRadius: "50%" }} />}
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
