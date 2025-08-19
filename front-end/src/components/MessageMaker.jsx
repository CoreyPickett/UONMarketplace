import { useState } from "react";

// message input form for sending new messages
export default function MessageMaker({ onSend, sending=false }) {
  const [text, setText] = useState("");

  const submit = () => {
    const body = text.trim();
    if (!body || sending) return;
    onSend(body);      // Call send function
    setText("");       // Clearinput after sending
  };

  return (
    <form onSubmit={(e)=>{ e.preventDefault(); submit(); }} className="message-maker">
      <input
        value={text}
        onChange={(e)=>setText(e.target.value)}
        // Enter = send
        onKeyDown={(e)=>{ if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder="Type your message..."
      />
      <button className="btn" disabled={!text.trim() || sending}>Send</button>
    </form>
  );
}