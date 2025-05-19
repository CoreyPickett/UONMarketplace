//Main App function with paths to webpages
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import axios from "axios";
import './App.css';
import Login from './pages/Login';
import Registration from "./pages/Registration";
import Dashboard from "./pages/Dashboard";
import MarketPlace from "./pages/MarketPlace";
import Listing, { loader as listingLoader} from "./pages/Listing";
import NotFound from "./pages/NotFound";
import Layout from './Layout';

//Routes guided by url path
const routes = [{
  path: '/',
  element: <Layout />,
  errorElement: <NotFound />, //Custom error page, will trigger if error occurs
  children: [{
    path: '/',
    element: <Dashboard />  
  }, {
    path: '/login',
    element: <Login />
  }, {
    path: '/registration',
    element: <Registration />
  }, {
    path: '/marketplace',
    element: <MarketPlace />
  }, {
    path: '/marketplace/:name',
    element: <Listing />,
    loader: listingLoader, //Custom loader for individual listing pages
  }]
}]

const router = createBrowserRouter(routes);

function App() {
  return (
    <>
    <RouterProvider router={router} />
    </>
  );
}
 
export default App;

