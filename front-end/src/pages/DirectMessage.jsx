import { useEffect, useState } from "react";  
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./DirectMessage.css";

export default function DirectMessage() {
    const { id } = useParams();
    const [thread, setThread] = useState(null);
    const [text, setText] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
    console.log("DM id param:", id);
  }, [id]);

    const demo = [
         { id: "1", sender: "John Doe", avatar: "/images/default-avatar.png", messages: [
        { from: "John Doe", at: "2023-10-01 10:00", body: "Hello! How are you?" }
      ]},
      { id: "2", sender: "Jane Smith", avatar: "/images/default-avatar.png", messages: [
        { from: "Jane Smith", at: "2023-10-02 09:13", body: "Are you coming to the event?" }
      ]},
        { id: "3", sender: "Alice Johnson", avatar: "/images/default-avatar.png", messages: [
            { from: "Alice Johnson", at: "2023-10-03 14:45", body: "Let's catch up soon!" }
        ]}
];

useEffect(() => {
    const match = demo.find(t => String(t.id) === String(id));
  setThread(match || null);
}, [id]);

if (!thread) return <main style={{ padding: "20px" }}>Loading...</main>;

const sendMessage = async (e) => {
    e.preventDefault();
    if (text.trim() === "") return;
    setThread(t => ({
        ...t,
        messages: [...t.messages, { from: "You", at: new Date().toISOString(), body: text }]
    }));
    setText("");
};

return (
    <main className="direct-message-content" style={{ padding: "20px" }}>
        <button onClick={() => navigate("/messages")}>Back to Messages</button>
        <div style={{display: "flex", alignItems: "center", gap: 12, margin: "12px 0"}}>
            <img src={thread.avatar} alt={thread.sender} width={50} style={{borderRadius: "50%"}} />
            <h2 style={{margin: 0}}>{thread.sender}</h2>
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, maxHeight: 400, overflow: "auto" }}>
                {thread.messages.map((msg, index) => (
                    <div key={index} style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: "bold" }}>{msg.from}</div>
                        <div> {msg.body}</div>
                        <div style={{ fontSize: "0.8em", color: "#888" }}>{msg.at}\</div>
                    </div>
                ))}
            </div>

        <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input
                className="dm-input"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type your message..."
            />
            <button type="submit" className="btn">Send</button>           
             
        </form>
    </main>
    );
}            


