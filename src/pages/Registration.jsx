//Registration page
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import "./registration.css";

export default function Registration() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phNumber, setPhNumber] = useState('');
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

        <div className="inputbox">
  <div className="phone-input-wrapper">
    <span className="phone-prefix">+61</span>
    <input 
      type="tel"
      placeholder="Phone Number"
      required
      value={phNumber}
      onChange={e => {
        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 9); // allow max 9 digits
  const formatted = digitsOnly
    .replace(/^(\d{3})(\d{0,3})(\d{0,3})$/, (match, g1, g2, g3) =>
      [g1, g2, g3].filter(Boolean).join(' ')
    );
  setPhNumber(formatted);
}}
      className="phone-input"
    />
  </div>
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
