//Dashboard/Homepage page, with links to existing and future areas of marketplace
import { Link } from "react-router-dom";
import "./Dashboard.css"; // Make sure this path matches where the CSS file is saved

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <h1>Welcome to UoN Community Marketplace</h1>
      <p>Select an option below to get started:</p>

      <div className="dashboard-cards">
        <Link to="/create-listing" className="dashboard-card">📦 Create New Listing</Link>
        <Link to="/marketplace" className="dashboard-card">🛒 Browse Marketplace</Link>
        <Link to="/messages" className="dashboard-card">💬 View Messages</Link>
        <Link to="/my-listings" className="dashboard-card">📁 My Listings</Link>
        <Link to="/profile" className="dashboard-card">👤 My Profile</Link>
        <Link to="/admin" className="dashboard-card">🛠 Admin Dashboard</Link>
      </div>
    </div>
  );
};

export default Dashboard;