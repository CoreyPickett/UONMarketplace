import axios from "axios";

export async function loader({ params }) {
  const response = await axios.get('/api/marketplace/' + params.id);
  return response.data;
}