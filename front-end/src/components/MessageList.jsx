// Creates list of messages in a convo
export default function MessageList({ messages, me }) {
  return (
    <div className="message-list">
      {messages.map((m, i) => (
        <div key={m._id ?? i} className={`bubble ${m.from === me ? "me" : "them"}`}>
          <div className="body">{m.body}</div>
          <div className="metadata">{new Date(m.at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
