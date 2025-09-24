import { Link } from "react-router-dom";

export default function UsernameDisplay({ username, fallback }) {
  if (username) {
    return <span>{username}</span>;
  }
  return <span className="muted warning">{fallback || "Unknown"}</span>;
}