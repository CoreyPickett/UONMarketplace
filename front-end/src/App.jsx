import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from './pages/Login';
import Registration from "./pages/Registration";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/MarketPlace";
import Listing from "./pages/Listing";



function App() {
  console.log("App loaded");

  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/:name" element={<Listing />} />
      </Routes>
    </Router>
    </>
  );
}

export default App;

