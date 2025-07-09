import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import "./forgotPswd.css";

const ForgotPswd = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(getAuth(), email);
      setMessage("Reset link sent! Please check your email.");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="forgotPswd-wrapper">
      <form className="forgotPswd-form" onSubmit={handleReset}>
        <h1>Forgot Password</h1>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <div className="inputbox">
          <input
            type="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button type="submit" className="submit-button">Send Reset Link</button>

        <div className="login-link">
          <p>Remember your password? <Link to="/login">Back to Login</Link></p>
        </div>
      </form>
    </div>
  );
};

export default ForgotPswd;