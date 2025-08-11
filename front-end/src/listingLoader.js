//Custom Listings loader used to fetch listings in Create Listing
import axios from "axios";

export async function loader({ params }) {
  const response = await axios.get('/api/marketplace/' + params.id);
  return response.data;
}