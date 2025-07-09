import "./Profile.css";
import useUser from "../useUser";
import { useState } from "react";

const Profile = () => {
  const { user } = useUser(); // Firebase user object
  const [activeTab, setActiveTab] = useState("listings");

  return (
    <div className="profile-wrapper">
      {/* Top Banner */}
      <div className="profile-banner">
        <img
          src="/uon-logo.jpg"
          alt="Banner"
          className="banner-img"
        />
        <img
          src="/Default-pic.png"
          alt="Profile"
          className="profile-img"
        />
        <h2>{user?.displayName || "Anonymous User"}</h2>
        <p>{user?.email}</p>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <button onClick={() => setActiveTab("listings")}>📦 My Listings</button>
        <button onClick={() => setActiveTab("saved")}>🔖 Saved Items</button>
        <button onClick={() => setActiveTab("messages")}>💬 Messages</button>
        <button onClick={() => setActiveTab("settings")}>⚙️ Settings</button>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {activeTab === "listings" && <p>You have no listings yet.</p>}
        {activeTab === "saved" && <p>You haven’t saved any items.</p>}
        {activeTab === "messages" && <p>No messages yet.</p>}
        {activeTab === "settings" && <p>Settings will be available soon.</p>}
      </div>
    </div>
  );
};

export default Profile;
