import React from "react";
import { Link } from "react-router-dom";
import "./registration.css";

const Registration = () => {
  return (
    <div className="registration-wrapper">
      <form className="registration-form">
        <h1>Register</h1>

        <div className="inputbox">
          <input type="text" placeholder="Username" required />
        </div>

        <div className="inputbox">
          <input type="email" placeholder="Email" required />
        </div>

        <div className="inputbox">
          <input type="password" placeholder="Password" required />
        </div>

        <div className="inputbox">
          <input type="password" placeholder="Confirm Password" required />
        </div>

        <button type="submit" className="submit-button">Register Now!</button>

        <div className="login-link">
          <p>
            Already have an account? <Link to="/login">Log in Here!</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Registration;
