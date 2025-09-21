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
import Listing from "./pages/Listing";
import { loader as listingLoader } from "./listingLoader";
import CreateListing from "./pages/CreateListing";
import CreateMessage from "./pages/CreateMessage";
import EditListing from "./pages/EditListing"
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Messages from "./pages/Messages";
import DirectMessage from "./pages/DirectMessage"; 
import Saved from "./pages/Saved"; 
import UpdateEmail from "./pages/UpdateEmail";
import UpdatePswd from "./pages/UpdatePswd";
import UpdateSuccess from "./pages/UpdateSuccess"; 
import UpdatePhoto from "./pages/UpdatePhoto";
import UpdateUsername from "./pages/UpdateUsername";


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
       { path: "saved", element: <Saved /> },  
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
        path: "marketplace/:id",
        element: <Listing />,
        loader: listingLoader,
      },
      {
        path: "create-listing",
        element: <CreateListing />
      },
      {
        path: "create-message",
        element: <CreateMessage />
      },
      {
        path: "edit-listing/:id",
        element: <EditListing/>
      },
      {
        path: "profile",
        element: <Profile />
      },
      {
        path: "admin",
        element: <Admin />
      },
      {
        path: "updateEmail",
        element: <UpdateEmail />
      },
      {
        path: "updatePswd",
        element: <UpdatePswd />
      },
      {
        path: "updatePhoto",
        element: <UpdatePhoto />
      },
      {
        path: "updateUsername",
        element: <UpdateUsername />
      },
      {
        path: "updateSuccess",
        element: <UpdateSuccess />
      },
      {
        path: "messages",
        element: <Messages />
      },
      {
      path: "messages/:id",
        element: <DirectMessage />
      },
      {
        path: "marketplace/:id/buy",
        element: <Listing />,  // same page
        loader: listingLoader,
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
