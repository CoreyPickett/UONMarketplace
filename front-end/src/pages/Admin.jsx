import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuth } from "firebase/auth";
import "./Admin.css";


function Admin() {

   
    return ( 
    <main className="admin-content"> 
        <div>
           
            <h1 className="page-title">Admin</h1>
            <div className = "adminsections">
            <div className="admin-card">
            <ListingsSearch />
            </div>
            <div className="admin-card">
            <UserSearch />
            </div>
            <div className="admin-card wide">
            <Announcements />
            </div>
            </div>
        </div>
    </main>
    );

}

const ListingsSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState("");
  const auth = getAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    try { //Search function to find listings based on title
      const response = await axios.get(`/api/marketplace/`);
      const filtered = response.data.filter(item =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) //Filters title names, not case sensitive
      );
      setListings(filtered);
    } catch (error) {
      console.error("Error fetching listings:", error); //Error message
    }
  };

  const handleDelete = async (id) => {
    const user = auth.currentUser;
    if (!user) return alert("You must be logged in to delete listings."); //Error is user not logged in
    const token = await user.getIdToken();

    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    try { //Delete function
      await axios.delete(`/api/marketplace/${id}`, {
        headers: { authtoken: token }
      });
      setListings(listings.filter(listing => listing._id !== id));
      setStatus("Listing deleted successfully.");
    } catch (error) {
      console.error("Error deleting listing:", error);
      setStatus("Failed to delete listing.");
    }
  };

  return ( //Search and Delete Admin form with Delete button
    <div>
      <form onSubmit={handleSearch}>
        <h2>Search Listings</h2>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search listings..."
        />
        <button className="btn" type="submit">Search</button>
      </form>

      {status && <p className="status-message">{status}</p>}

      <ul className="listing-results">
        {listings.map(listing => (
          <li key={listing._id} className="listing-item">
            <span>{listing.title}</span>
            <button className="btn delete-btn" onClick={() => handleDelete(listing._id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};


const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("");
  const auth = getAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await axios.get(`/api/admin/search-user?email=${searchTerm}`, {
      headers: { authtoken: token }
      });

      setUser(response.data);
      setStatus("");
    } catch (error) {
      console.error("Search error:", error);
      setUser(null);
      setStatus("User not found.");
    }
  };

  const handleDisable = async () => {
    if (!user?.uid) return;
    const token = await auth.currentUser.getIdToken();

    if (!window.confirm("Disable this user account?")) return;

    try {
      await axios.post('/api/admin/disable-user', { uid: user.uid }, {
        headers: { authtoken: token }
      });
      setStatus("User disabled successfully.");
    } catch (error) {
      console.error("Disable error:", error);
      setStatus("Failed to disable user.");
    }
  };

  const handleDelete = async () => {
    if (!user?.uid) return;
    const token = await auth.currentUser.getIdToken();

    if (!window.confirm("Are you sure you want to permanently delete this account?")) return;

    try {
      await axios.post('/api/admin/delete-user', { uid: user.uid }, {
        headers: { authtoken: token }
      });
      setStatus("User deleted successfully.");
      setUser(null); // Clear user from view
    } catch (error) {
      console.error("Delete error:", error);
      setStatus("Failed to delete user.");
   }
  };


  return (
    <div>
      <form onSubmit={handleSearch}>
        <h2>Search Users</h2>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter email or UID"
        />
        <button className="btn" type="submit">Search</button>
      </form>

      {status && <p className="status-message">{status}</p>}

      {user && (
        <div className="user-card">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>UID:</strong> {user.uid}</p>
          <p><strong>Disabled:</strong> {user.disabled ? "Yes" : "No"}</p>
          <button className="btn delete-btn" onClick={handleDisable}>
            Disable Account
          </button>
          <button className="btn danger-btn" onClick={handleDelete}>
            Delete Account
          </button>

        </div>
      )}
    </div>
  );
};


const Announcements = () => {
    const [title, setTitle] = useState(""); // <-- Add this line
    const [announcement, setAnnouncement] = useState("");   
    const [status, setStatus] = useState("");
    const auth = getAuth();
    const [severity, setSeverity] = useState("info");
    const [expiresAt, setExpiresAt] = useState("");

    const handleSend = async (e) => {
        e.preventDefault();
        if (!title.trim() || !announcement.trim()) {
            alert("Please fill in all fields.");
            return; // <-- Add this line
        }
        try {
            setStatus("");
            const user = auth.currentUser;
            if (!user) {
                alert("You must be logged in to send an announcement.");
                return;
            }
            const token = await user.getIdToken();
            await axios.post('/api/announcements', { 
                title,
                announcement,
                severity,
                expiresAt: expiresAt || null,
            }, {headers: { authtoken: token }});
            setStatus("Announcement sent successfully!");
            setTitle("");
            setAnnouncement("");
            setSeverity("info");
        } catch (error) {
            console.error("Error sending announcement:", error);
            setStatus("Failed to send announcement.");
        }
    };

    return (
        <form onSubmit={handleSend}>
           
            <h2>Send Announcement</h2>
            
            <input
            className="input"
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />
            <textarea
            className="input"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Write your announcement here..."
                rows="4"
                cols="50"
                required
            />
           
            <div className="form-group">
                <div>
                <label>Severity:</label>
                
                <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                    <option value="info">Info</option>     
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="success">Success</option>
                </select>
            </div>
            <div>
                <label>Announcement expires at:</label>
                <input
                    className="short-input"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    placeholder="Expires At (optional)"
                />
                </div>
            </div>
            <button className="btn" type="submit">Send Announcement</button>
            {status && <p style={{ marginTop: 8}}>{status}</p>}
            
            
        </form>
    );
}

export default Admin;