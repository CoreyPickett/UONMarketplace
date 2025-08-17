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
    const [messages, setMessages] = useState([
        {
            id : 1,
            sender: "John Doe",
            avatar: "/images/default-avatar.png",
            content: "When are my books coming I am still waiting for them.",
            date: "2023-10-01",
            status: "Unread"
        },
        {
            id: 2,
            sender: "Jane Smith",
            avatar: "/images/default-avatar.png",
            content: "Thankyou for the delivery, it was fast!",
            date: "2023-10-02",
            status: "Read"
        },
        {
            id: 3,
            sender: "Alice Johnson",
            avatar: "/images/default-avatar.png",
            content: "Thanks for purchasing my pencil case, I hope you like it!",
            date: "2023-10-03",
            status: "Unread"
        }
    ]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const markAsRead = (id) => {
        setMessages(msgs =>
            msgs.map(msg =>
                msg.id === id ? { ...msg, status: "Read" } : msg
            )
        );
        setOpenDropdown(null);
    };

    // Show confirmation dialog
    const handleDeleteClick = (id) => {
        setConfirmDeleteId(id);
        setOpenDropdown(null);
    };

    // Confirm delete
    const confirmDelete = () => {
        setMessages(msgs => msgs.filter(msg => msg.id !== confirmDeleteId));
        setConfirmDeleteId(null);
    };

    // Cancel delete
    const cancelDelete = () => {
        setConfirmDeleteId(null);
    };

    return (
        <div>
            <h2>Messages:</h2>
            <table className="messages-table">
                <tbody>
                {messages.map((msg) => (
                    <tr key={msg.id}>
                        <td
                            onClick={() => navigate(`/messages/${msg.id}`)}
                            style={{cursor: "pointer"}}
                        >
                            <img src={msg.avatar} alt={msg.sender} width={40} style={{borderRadius: "50%"}} />
                            <span className="sender">{msg.sender}</span>
                        </td>
                        <td
                            onClick={() => navigate(`/messages/${msg.id}`)}
                            style={{cursor: "pointer"}}
                        >
                            <strong>{msg.status}</strong> {msg.content}
                        </td>
                        <td>{msg.date}</td>
                        <td style={{position: "relative"}}>
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    setOpenDropdown(openDropdown === msg.id ? null : msg.id);
                                }}
                                style={{background: "none", border: "none", cursor: "pointer"}}
                                aria-label="Open message menu"
                            >⋮</button>
                            {openDropdown === msg.id && (
                                <div className="dropdown">
                                    <button onClick={() => markAsRead(msg.id)} style={{display: "block", width: "100%", padding: "8px", border: "none", background: "none", textAlign: "left", cursor: "pointer"}}>Mark as read</button>
                                    <button onClick={() => handleDeleteClick(msg.id)} style={{display: "block", width: "100%", padding: "8px", border: "none", background: "none", textAlign: "left", color: "red", cursor: "pointer"}}>Delete</button>
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {/* Confirmation Popup */}
            {confirmDeleteId !== null && (
                <div className="delete-confirm-popup">
                    <div>
                        <p>Are you sure you want to delete this conversation?</p>
                        <button className="btn" onClick={confirmDelete} style={{marginRight: 10}}>Delete</button>
                        <button className="btn" onClick={cancelDelete}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}


export default Messages;