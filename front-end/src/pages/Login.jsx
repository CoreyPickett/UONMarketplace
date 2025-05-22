//Login Page
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import "./login.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in all fields.");
      return;
    }
    alert(`Logging in as ${email}`);
  };

  const navigate = useNavigate();

  async function Authenticate() {
    try {
      await signInWithEmailAndPassword(getAuth(), email, password);
      navigate('/');
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <p>{error}</p>}
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="password-group">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <button 
          type="submit"
          onClick={Authenticate}>
          Login
        </button>

        {/* 👇 New user registration link */}
        <div className="register-link">
          <p>Don't have an account? <Link to="/registration">Create one</Link></p>
        </div>
      </form>
    </div>
  );
};
