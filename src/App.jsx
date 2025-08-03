// Main App function with paths to webpages
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import axios from "axios";

import "./App.css";

// Pages
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import ForgotPswd from "./pages/forgotPswd";
import Dashboard from "./pages/Dashboard";
import MarketPlace from "./pages/MarketPlace";
import Listing, { loader as listingLoader } from "./pages/Listing";
import CreateListing from "./pages/CreateListing";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";


// Layout with Header
import Layout from "./Layout";

// Define routes
const routes = [
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: "login",
        element: <Login />
      },
      {
        path: "registration",
        element: <Registration />
      },
      {
        path: '/forgotpswd',
        element: <ForgotPswd />
      },
      {
        path: "marketplace",
        element: <MarketPlace />
      },
      {
        path: "marketplace/:name",
        element: <Listing />,
        loader: listingLoader
      },
      {
        path: "create-listing",
        element: <CreateListing />
      },
      {
        path: "profile",
        element: <Profile />
      }
      
    ]
  }
];

// Create the router
const router = createBrowserRouter(routes);

// App component
function App() {
  return <RouterProvider router={router} />;
}

export default App;
