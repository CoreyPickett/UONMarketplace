//Placeholder Listings used for testing/ development
//Each listing has a name, title, and content
import axios from "axios";
const listings = axios.get('/api/marketplace/');
export default listings;

