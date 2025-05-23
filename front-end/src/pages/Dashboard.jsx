import { Link } from "react-router-dom";
import "./Dashboard.css";
import listings from "../listing-content"; // adjust if path is different

const Dashboard = () => {
  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Menu</h2>
        <nav>
          <ul>
            <li><Link to="/dashboard">Dashboard Home</Link></li>
            <li>
              <details>
                <summary>Listings</summary>
                <ul>
                  <li><Link to="/create-listing">Create Listing</Link></li>
                  <li><Link to="/marketplace">Browse Marketplace</Link></li>
                </ul>
              </details>
            </li>
            <li><Link to="/messages">Messages</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/admin">Admin</Link></li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <h1>Welcome to UoN Community Marketplace</h1>
        <p>Here are the latest listings from the community:</p>

        <div className="listing-grid">
          {listings.map((item) => (
            <div key={item.name} className="listing-card">
              <strong>{item.title}</strong>
              <p>{item.price} — {item.location}</p>
              <Link to={`/marketplace/${item.name}`}>View Listing</Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
