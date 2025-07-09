//Registration page
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import "./registration.css";

export default function Registration() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  async function createAccount() {
    event.preventDefault(); // Prevent form submission refresh
    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match!');
      return;
    }
    try {
      await createUserWithEmailAndPassword(getAuth(), email, password);
      navigate('/'); //Navigate to Dashboard
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="registration-wrapper">
      <form className="registration-form" onSubmit={createAccount}>
        <h1>Register</h1>

        {error && <p>{error}</p>}

        <div className="inputbox">
          <input 
            type="email"
            placeholder="Email" required 
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="inputbox">
          <input 
            type="password" 
            placeholder="Password" required 
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <div className="inputbox">
          <input
            type="password" 
            placeholder="Confirm Password" required 
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </div>

        <button 
          type="submit" 
          className="submit-button"
        >
          Register Now!
        </button>

        <div className="login-link">
          <p>
            Already have an account? <Link to="/login">Log in Here!</Link>
          </p>
        </div>
      </form>
    </div>
  );
};
