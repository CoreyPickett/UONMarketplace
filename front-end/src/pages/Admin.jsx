import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuth } from "firebase/auth";
import "./Admin.css";

function Admin() {

    return (
        <div>
            <h2>Admin</h2>
            <ListingsSearch />
            <UserSearch />
            <Announcements />
        </div>
    );

}

const ListingsSearch = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const auth = getAuth();

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get(`/api/listings?search=${searchTerm}`);
            // Handle the response data as needed
            console.log(response.data);
        } catch (error) {
            console.error("Error fetching listings:", error);
        }
    };

    return (
        <form onSubmit={handleSearch}>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search listings..."
            />
            <button type="submit">Search</button>
        </form>
    );
}

const UserSearch = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const auth = getAuth();

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get(`/api/listings?search=${searchTerm}`);
            // Handle the response data as needed
            console.log(response.data);
        } catch (error) {
            console.error("Error fetching listings:", error);
        }
    };

    return (
        <form onSubmit={handleSearch}>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Users..."
            />
            <button type="submit">Search</button>
        </form>
    );
}

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
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />
            <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Write your announcement here..."
                rows="4"
                cols="50"
                required
            />
            <div>
                <p>Severity:</p>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                    <option value="info">Info</option>     
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="success">Success</option>
                </select>
                <p>Announcement expires at:</p>
                <input
                
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    placeholder="Expires At (optional)"
                />
            </div>
            <button type="submit">Send Announcement</button>
            {status && <p>{status}</p>}
        </form>
    );
}
import React from 'react'; 

export default Admin;