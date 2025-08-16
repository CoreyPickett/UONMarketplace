import { useState } from "react";
import axios from "axios";
import { getAuth } from "firebase/auth";
import "./Messages.css";
import { useNavigate } from "react-router-dom";
function Messages() {
    return (
        <main className="messages-content">
            <h1 className="page-title">Messages</h1>
            <div className="messages-wrapper">
                <p>Here you can manage your messages.</p>
                <div className="messages-card">
                    <ProfileSearch />
                </div>
                <div className="messages-card">
                    <SampleMessages/>
                    </div>
            </div>
        </main>
    );
}    



const ProfileSearch = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [profiles, setProfiles] = useState([]);
    const auth = getAuth();
   

  const handleSearch = async (e) => {
    e.preventDefault();
    try { //Search function to find profiles based on name
      const response = await axios.get(`/api/marketplace/`);
      const filtered = response.data.filter(item =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) //Filters title names, not case sensitive
      );
      setProfiles(filtered);
    } catch (error) {
      console.error("Error fetching profiles:", error); //Error message
    }
  };

  return ( //Search and Delete Admin form with Delete button
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
}

const SampleMessages = () => {
    const navigate = useNavigate();
    const [selected, setSelected] = useState(null);
    const messages = [
        {
            id : 1,
            sender: "John Doe",
             avatar: "/images/default-avatar.png",
            content: "Hello! How are you?",
            date: "2023-10-01",
            status: "unread"
        },
        {
            id: 2,
            sender: "Jane Smith",
             avatar: "/images/default-avatar.png",
            content: "Are you coming to the event?",
            date: "2023-10-02",
            status: "read"
        },
        {
            id: 3,
            sender: "Alice Johnson",
             avatar: "/images/default-avatar.png",
            content: "Don't forget our meeting tomorrow.",
            date: "2023-10-03",
            status: "unread"
        }
        
        

    ];

     if (selected) {
        return (
            <div className="dm-view">
                <button className="btn" onClick={() => setSelected(null)}>← Back</button>
                <div style={{display: "flex", alignItems: "center", margin: "1rem 0"}}>
                    <img src={selected.avatar} alt={selected.sender} width={48} style={{borderRadius: "50%", marginRight: 16}} />
                    <h2 style={{margin: 0}}>{selected.sender}</h2>
                </div>
                <div className="dm-message" style={{marginBottom: "1rem"}}>
                    <strong>{selected.status}</strong> {selected.content}
                    <div style={{fontSize: "0.9em", color: "#888"}}>{selected.date}</div>
                </div>
                {/* You can add a chat history and input box here */}
                <input className="dm-input" type="text" placeholder="Type a message..." style={{width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc"}} />
            </div>
        );
    }



    return(
        <div>
            <h2>Messages:</h2>
            <table className="messages-table">
                <tbody>
                {messages.map((msg) => (
                    <tr key={msg.id}
                    onClick={() => navigate(`/messages/${msg.id}`)}
                    tabIndex={0}
                    onKeyDown={(e) => {}}
                    style={{cursor: "pointer"}}
                    aria-label={`Message from ${msg.sender} on ${msg.date}`}>
                        <td>
                             <img src={msg.avatar} alt={msg.sender} width={40} style={{borderRadius: "50%"}} />
                            <span className="sender">{msg.sender}</span>
                        </td>
                        <td>
                            <strong>{msg.status}</strong> {msg.content}
                        </td>
                        <td>{msg.date}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}


export default Messages;