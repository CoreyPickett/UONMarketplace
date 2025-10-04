// Creates list of messages in a convo
export default function MessageList({
  messages, meUid, meName, meAvatar, otherUid, otherName, otherAvatar
}) {
  return (
    <div className="message-list">
      {messages.map(m => {
        const mine = m.from === meUid;   // <— key line
        const avatar = mine ? meAvatar : otherAvatar;
        const name   = mine ? meName   : otherName;

        return (
          <div key={m._id} className={`bubble ${mine ? "mine" : "theirs"}`}>
            <img className="avatar" src={avatar} alt={name} />
            <div className="content">
              <div className="name">{name}</div>
              <div className="body">{m.body}</div>
              <div className="time">{new Date(m.at).toLocaleString()}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
